---
id: ms.section.6.3
entity_type: section
title: Controlled comparisons
short_title: Controlled comparisons
volume: 1
part: 1
chapter: 6
section: 6.3
slug: 06-3-controlled-comparisons
parent: ms.chapter.6
prev_sibling: ms.section.6.2
next_sibling: ms.section.6.4
children: []
prerequisites: [ms.section.1.2, ms.section.1.5, ms.section.1.6, ms.section.2.5, ms.section.5.6, ms.section.6.1, ms.section.6.2]
downstream: [ms.section.6.4, ms.section.6.5, ms.section.8.6, ms.section.9.2, ms.section.21.5, ms.section.33.6, ms.section.43.6]
related: [ms.section.21.2, ms.section.9.6]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P07}
  - {type: supported_by, target: paper.P06}
  - {type: supported_by, target: paper.P09}
  - {type: implemented_by, target: impl.mosaicml-llm-foundry}
  - {type: implemented_by, target: impl.nanotron}
  - {type: evaluated_by, target: experiment.6.3}
axes: {lifecycle: [data, pretraining, evaluation], mechanism: [controlled_comparison, factorial_design, budget_matching], feedback_setting: [], modality: [text]}
papers: [P06, P07, P09]
implementations: [impl.mosaicml-llm-foundry, impl.nanotron, impl.torchtitan, impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 6.3 Controlled comparisons

## Scope

Objective: specify how arms of an experiment are constructed so that a difference is attributable — baselines, ablations, factorial designs, paired prompts, fixed budgets, and interaction effects — and work through DataComp-LM (P07) as a published controlled data comparison, stating only what the paper reports. Baseline: the one-factor-at-a-time comparison against a baseline copied from another paper. Success: given a claimed improvement the reader can name the resource that was matched, the factors that were crossed, and the interactions that remain unestimated. Boundaries: the statistics of the resulting differences are in [§6.4](06-4-measurement-uncertainty.md); compute-optimal allocation in [§21.2](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-2-compute-optimal-design.md); pilot sweeps in [§21.5](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-5-pilot-methodology.md); filter interactions inside a data pipeline in [§8.6](../../part-02-data-and-representation-engineering/ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-6-filter-interactions.md); preference-objective comparisons in [§33.6](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch33-direct-preference-optimization-and-related-objectives/33-6-controlled-comparison.md).

## Why this exists

What failed before is the comparison in which the proposed arm and the baseline arm differ in more than the proposal. The new method is tuned and the baseline is quoted from its original paper; the new data is trained for more tokens; the new tokenizer changes both tokens and FLOPs per byte; the new filter costs accelerator-days that the baseline never received. Dodge et al. report cases where a different computational investment "would have reversed published conclusions" about which model is better (PAPER-REPORTED · R6.24). The bottleneck is that a training run is the experimental replicate and is expensive, so designs drift toward few cells and single seeds, where main effects and interactions are inseparable. The constraint that became dominant is the [resource ledger](../ch01-foundation-model-lifecycle/01-5-resource-accounting.md): every arm has a ledger row, and a comparison is controlled exactly when the rows agree on the matched resource. What changed is that published designs now fix the recipe and vary one declared object — P07 states, "To isolate the effect of dataset interventions, we fix a training recipe at each scale" (PAPER-REPORTED · P07 §3.4) — and that this structure can be specified, and audited, before any run.

## Intuition

Physically, an arm is a pipeline that converts resources (tokens, FLOPs, accelerator-hours, tuning runs) into a checkpoint and then into a score. Two arms are comparable when they drew the same resources and differ only where declared. One-factor-at-a-time designs walk along the edges of a star centred on the baseline: each factor is varied with all others at baseline level, so the response at the corners — both factors changed together — is never observed. A factorial design occupies the corners of the cube; every run informs every effect. Heuristically, researchers describe this as "checking that the gains stack"; the measurable content is the interaction coefficient.

## Formulation

> **Definition — baseline arm / ablation arm.** A baseline arm is the reference configuration run under the same matched budget, tuning budget, partition, and evaluation unit components as the proposed arm. An ablation arm is the proposed configuration with exactly one component removed or reverted.

> **Definition — factorial design (evaluation).** A design in which the levels of k factors are crossed and every combination is run with r replicates, so that main effects and interaction effects are separately estimable.

> **Definition — interaction effect.** The component of the response that is not the sum of the factors' main effects; for two factors, the change in one factor's effect when the other factor changes level.

With factors coded x_j ∈ {−1, +1} and response y (a score from Eq. 6.1 on a fixed test role),

$$
y = \gamma_0 + \sum_{j=1}^{k}\gamma_j x_j + \sum_{j<l}\gamma_{jl}\, x_j x_l + \dots + \varepsilon,\qquad \operatorname{Var}(\varepsilon)=\sigma_{\text{run}}^2
$$
*(Eq. 6.6)* where γ_j = main effect (half the difference between level means), γ_{jl} = two-factor interaction, σ_run² = run-to-run variance at fixed configuration (seed variance, §6.4).

```figure
id: fig-6.13
kind: chart
title: Filter × token-budget interaction under Eq. 6.6
caption: >-
  Eq. 6.6 for two coded factors, a filter x₁ and a token budget x₂, with
  illustrative coefficients γ₀ = 0, γ₁ = 1, γ₂ = 2 in coded response units.
  The dashed line is the filter's effect at each budget, 2(γ₁ + γ₁₂x₂). With
  γ₁₂ = 0 the two lines are parallel and every ablation direction agrees. As
  γ₁₂ turns negative the lines converge and then cross. That is the
  section's warning in one picture: a filter's main effect measured at a
  small D can change sign at a large D. No run is plotted.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-6.6"
alt: >-
  Line chart of the response against the coded token budget x₂ from −1 to
  +1, for filter off (x₁ = −1) and filter on (x₁ = +1), plus a dashed line
  for the filter effect 2(γ₁ + γ₁₂x₂). Coefficients are illustrative:
  γ₀ = 0, γ₁ = 1, γ₂ = 2. At γ₁₂ = 0 the lines are parallel and the effect
  is 2 at both budgets. At γ₁₂ = −0.5, adding the filter at the baseline
  budget (x₂ = −1) gives 2(γ₁ − γ₁₂) = 3, and removing it from the full
  system (x₂ = +1) gives 2(γ₁ + γ₁₂) = 1. At γ₁₂ = −1.5 the effect is +5 at
  the low budget and −1 at the high budget: the lines cross and the sign
  changes.
spec:
  type: line
  x: { label: "token budget, coded x₂", scale: linear, format: fixed1, domain: [-1, 1] }
  y: { label: "response, coded units (illustrative)", scale: linear, format: fixed1, domain: [-5, 6] }
  variables: { g0: 0, g1: 1, g2: 2, g12: 0 }
  series:
    - { id: off, label: "filter off, x₁ = −1", formula: "g0 - g1 + (g2 - g12)*x", sample: { from: -1, to: 1, count: 21 } }
    - { id: on, label: "filter on, x₁ = +1", formula: "g0 + g1 + (g2 + g12)*x", sample: { from: -1, to: 1, count: 21 } }
    - { id: eff, label: "filter effect 2(γ₁ + γ₁₂·x₂)", formula: "2*(g1 + g12*x)", sample: { from: -1, to: 1, count: 21 }, emphasis: true, dashed: true }
  annotations:
    - { x: -1, label: "baseline budget" }
    - { x: 1, label: "full system" }
states:
  - { anchor: formulation, label: "γ₁₂ = 0, additive", variables: { g12: 0, x: -1 }, highlight: [off, on], note: "No interaction: the filter adds 2γ₁ = 2 at both budgets, the lines are parallel, and a one-factor-at-a-time ablation would be exact." }
  - { anchor: mechanism, label: "γ₁₂ = −0.5", variables: { g12: -0.5, x: 1 }, highlight: [eff], note: "Adding the filter at baseline gives 2(γ₁ − γ₁₂) = 3; removing it from the full system gives 2(γ₁ + γ₁₂) = 1. Reporting one direction hides γ₁₂." }
  - { anchor: failure-modes, label: "γ₁₂ = −1.5, sign change", variables: { g12: -1.5, x: 1 }, highlight: [eff, on, off], note: "Interaction read as main effect: the filter helps by 5 at the low budget and hurts by 1 at the high one, the sign change the section warns of once repetition sets in at large D." }
  - { anchor: siblings, label: "the star misses a corner", variables: { g12: -1.5, x: -1 }, highlight: [off, eff], note: "One-factor-at-a-time sees the filter contrast only at x₂ = −1, where it reads +5. The (+, +) corner that would show −1 is never run." }
```

For a 2×2 design with cell means ȳ_{ab} over r replicates,

$$
\hat\gamma_{12}=\tfrac14\big[(\bar y_{++}-\bar y_{-+})-(\bar y_{+-}-\bar y_{--})\big],\qquad \operatorname{Var}(\hat\gamma)=\frac{\sigma_{\text{run}}^2}{r\,2^{k}}\ \text{ for every effect in a } 2^k \text{ design}
$$
*(Eq. 6.7)* where the variance holds for each main effect and interaction because every estimate is a ±1-weighted mean of all r·2^k runs (MATHEMATICALLY-DERIVED).

```figure
id: fig-6.14
kind: matrix
title: Design matrix of Experiment 6.3's 2³ factorial
caption: >-
  The reason Eq. 6.7 holds for every effect. Rows are the eight cells of the
  filter × token budget × FLOP budget design, and columns are the seven
  effect contrasts. Each column has four +1 and four −1 entries, and any two
  columns are orthogonal. Every effect is therefore a ±1-weighted mean of all
  8·r runs with variance σ_run²/(8r). The highlighted cells are the four +1
  entries of the F·D interaction. None of them is observed by a
  one-factor-at-a-time star.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-6.6", "DERIVED:eq-6.7"]
concepts: [ms.section.6.3]
alt: >-
  Matrix of 8 runs by 7 contrast columns for a 2³ factorial over filter F,
  token budget D and FLOP budget C, in standard order. Filled cells are +1,
  empty cells −1. Main-effect columns F, D and C follow the standard
  pattern. The interaction columns F·D, F·C, D·C and F·D·C are elementwise
  products. Every column holds four +1 and four −1 entries. The F·D column
  is +1 in runs 1, 4, 5 and 8, highlighted. Run 8, all factors at +1, is +1
  in every column.
spec:
  rows: 8
  cols: 7
  pattern: explicit
  rowLabel: "run (F, D, C levels)"
  colLabel: "effect contrast"
  rowTicks: ["− − −", "+ − −", "− + −", "+ + −", "− − +", "+ − +", "− + +", "+ + +"]
  colTicks: ["F", "D", "C", "F·D", "F·C", "D·C", "F·D·C"]
  cells:
    - [0, 0, 0, 1, 1, 1, 0]
    - [1, 0, 0, 0, 0, 1, 1]
    - [0, 1, 0, 0, 1, 0, 1]
    - [1, 1, 0, 1, 0, 0, 0]
    - [0, 0, 1, 1, 0, 0, 1]
    - [1, 0, 1, 0, 1, 0, 0]
    - [0, 1, 1, 0, 0, 1, 0]
    - [1, 1, 1, 1, 1, 1, 1]
  highlight: [{ row: 0, col: 3 }, { row: 3, col: 3 }, { row: 4, col: 3 }, { row: 7, col: 3 }]
  legend: "filled = +1, empty = −1; four of each per column, so every effect averages all 8·r runs (Eq. 6.7)"
```

```figure
id: fig-6.15
kind: calculator
title: Factorial against one-factor-at-a-time, runs and precision
caption: >-
  Eq. 6.7 beside the one-factor-at-a-time alternative the Mechanism
  compares it with. A factorial pays r·2^k runs and estimates every effect,
  interactions included, with SE σ_run/√(r·2^k). One-factor-at-a-time pays
  r(k + 1) runs, estimates a main effect from 2r of them, and cannot
  estimate an interaction. The variance ratio 2^(k−1) is the "hidden
  replication". σ_run is set to 1 point for illustration because DCLM's
  replicate variance is NOT-DISCLOSED. The per-run cost of 2.0 × 10¹⁹ FLOPs
  is P07's 400M-1x figure.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-6.7", P07]
alt: >-
  Calculator for Eq. 6.7 with inputs k two-level factors, r replicates per
  cell, run-to-run SD σ_run in points and FLOPs per run. At k = 2, r = 1:
  4 factorial runs with SE 0.50 points per effect; 3 one-factor-at-a-time
  runs with main-effect SE 0.71; variance ratio 2. At k = 3, r = 3 and
  2.0 × 10¹⁹ FLOPs per run: 24 runs, SE 0.20, 4.8 × 10²⁰ FLOPs, against 12
  one-factor-at-a-time runs with SE 0.41; ratio 4. At k = 2, r = 5 and
  1.8 × 10¹⁸ FLOPs per run, the four factorial arms of verification.md:
  20 runs, 3.6 × 10¹⁹ FLOPs. At k = 5, r = 1: 32 runs against 6, ratio 16,
  6.4 × 10²⁰ FLOPs.
spec:
  tex: >-
    \operatorname{Var}(\hat\gamma)=\frac{\sigma_{\text{run}}^2}{r\,2^{k}}\ \text{(factorial)},\qquad \operatorname{Var}(\hat\gamma_j)=\frac{\sigma_{\text{run}}^2}{2r}\ \text{(one factor at a time)}
  equation: "6.7"
  inputs:
    - { symbol: k, label: "two-level factors k", default: 2, min: 1, max: 6, step: 1, format: integer }
    - { symbol: r, label: "replicates (seeds) per cell r", default: 1, min: 1, max: 10, step: 1, format: integer }
    - { symbol: s, label: "run-to-run SD σ_run, points", default: 1, min: 0.1, max: 5, step: 0.1, format: fixed1 }
    - { symbol: C1, label: "training FLOPs per run", default: 2.0e19, min: 1.0e17, max: 1.0e22, scale: log10, format: flops }
  outputs:
    - { symbol: n, label: "factorial runs r·2^k", formula: "r*2^k", format: integer }
    - { symbol: se, label: "SE of every effect, points", formula: "s/sqrt(n)", format: fixed2, emphasis: true }
    - { symbol: no, label: "one-factor-at-a-time runs r(k + 1)", formula: "r*(k + 1)", format: integer }
    - { symbol: seo, label: "its main-effect SE; interactions none", formula: "s/sqrt(2*r)", format: fixed2 }
    - { symbol: vr, label: "variance ratio, hidden replication", formula: "2^(k - 1)", format: ratio }
    - { symbol: fl, label: "factorial training FLOPs", formula: "n*C1", format: flops }
  presets:
    - { label: "2³ × 3 seeds, DCLM 400M-1x", values: { k: 3, r: 3, C1: 2.0e19 } }
    - { label: "2³ × 2 seeds", values: { k: 3, r: 2 } }
    - { label: "k = 5", values: { k: 5 } }
states:
  - { anchor: formulation, label: "2 × 2, r = 1", variables: { k: 2, r: 1, s: 1, C1: 2.0e19 }, highlight: [n, se, no, seo], note: "Four cells estimate both main effects and γ₁₂ with SE σ/2. Three one-factor-at-a-time cells give SE σ/√2 and no interaction." }
  - { anchor: mechanism, label: "2³ × 3 seeds, DCLM 400M-1x", variables: { k: 3, r: 3, s: 1, C1: 2.0e19 }, highlight: [n, fl, vr], note: "The section's cost line: 24 runs at 2.0 × 10¹⁹ FLOPs is 4.8 × 10²⁰. Every effect uses all 24 runs, so a main effect has 4× the precision of a star with 12." }
  - { anchor: experimental-design, label: "verification arms, r = 5", variables: { k: 2, r: 5, s: 1, C1: 1.8e18 }, highlight: [r, n, se, fl], note: "verification.md's filter × token-budget cells, five seed blocks: 20 runs, and a mean of 1.8 × 10¹⁸ FLOPs per run gives 3.6 × 10¹⁹. The two top-up arms are outside this factorial." }
  - { anchor: siblings, label: "k = 5, fractional territory", variables: { k: 5, r: 1, s: 1, C1: 2.0e19 }, highlight: [n, no, vr, fl], note: "Five factors: 32 runs against 6, 6.4 × 10²⁰ FLOPs even at the smallest DCLM scale. This is where a registered fractional design aliases high-order terms." }
```

> **Definition — matched-budget comparison.** A comparison in which a named resource — consumed tokens D, training FLOPs C, total FLOPs including curation and tuning, wall-clock, or money — is equal across arms by construction, and the name of the matched resource is part of the claim.

$$
C_{\text{total}} = C_{\text{train}} + C_{\text{curate}} + C_{\text{tune}} + C_{\text{eval}},\qquad
C_{\text{train}}\approx 6ND,\qquad
\Delta D_{\text{top-up}}\approx\frac{\Delta C_{\text{curate}}+\Delta C_{\text{tune}}+\Delta C_{\text{eval}}}{6N}
$$
*(Eq. 6.8)* where N, D, C follow [notation.md](../../../front-matter/notation.md); Δ denotes candidate cost minus baseline cost for each non-training stage. The top-up is valid for positive incremental non-training cost in the 6ND approximation, with N fixed. Use the actual per-token operation model when attention or recomputation is material, and retain non-FLOP CPU/storage work separately. Negative incremental cost means the other arm is cheaper; zero differences cancel rather than being charged again.

```figure
id: fig-6.16
kind: calculator
title: Matched-budget top-up under Eq. 6.8
caption: >-
  Eq. 6.8 as the cheaper arm's top-up. The candidate's incremental
  non-training cost is converted into extra training tokens at fixed N
  through 6N per token. The defaults are verification.md's ASSUMED planning
  instance. The DCLM state reproduces P07's 2.0 × 10¹⁹ from 6ND and sets
  ΔC_curate to zero, because the paper does not disclose it. The comparison
  is then training-matched only, and ΔD = 0 is what hidden curation compute
  looks like.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-6.8", P07]
alt: >-
  Calculator for Eq. 6.8 with inputs N parameters, D consumed tokens and the
  incremental curation, tuning and evaluation FLOPs. It outputs
  C_train = 6ND, the top-up ΔD = (ΔC_curate + ΔC_tune + ΔC_eval)/(6N), the
  top-up as a fraction of D, and the matched total. At N = 10⁸, D = 2 × 10⁹
  and ΔC_curate = 6 × 10¹⁶: C_train = 1.2 × 10¹⁸, ΔD = 10⁸ tokens, 5 % of D,
  total 1.26 × 10¹⁸. At D = 4 × 10⁹: 2.4 × 10¹⁸ and the same 10⁸ tokens,
  2.5 %. At DCLM 400M-1x, N = 412M and D = 8.2B: C_train = 2.03 × 10¹⁹, the
  reported 2.0 × 10¹⁹, with ΔD = 0 because curation compute is
  NOT-DISCLOSED.
spec:
  tex: >-
    C_{\text{train}}\approx 6ND,\qquad \Delta D_{\text{top-up}}\approx\frac{\Delta C_{\text{curate}}+\Delta C_{\text{tune}}+\Delta C_{\text{eval}}}{6N}
  equation: "6.8"
  inputs:
    - { symbol: N, label: "parameters N", default: 1.0e8, min: 1.0e7, max: 1.0e10, scale: log10, format: params }
    - { symbol: D, label: "consumed tokens D", default: 2.0e9, min: 1.0e8, max: 1.0e12, scale: log10, format: tokens }
    - { symbol: dCc, label: "ΔC_curate, FLOPs", default: 6.0e16, min: 0, max: 6.0e17, step: 1.0e15, format: flops }
    - { symbol: dCt, label: "ΔC_tune, FLOPs", default: 0, min: 0, max: 6.0e17, step: 1.0e15, format: flops }
    - { symbol: dCe, label: "ΔC_eval, FLOPs", default: 0, min: 0, max: 6.0e17, step: 1.0e15, format: flops }
  outputs:
    - { symbol: Ctr, label: "C_train ≈ 6ND", formula: "6*N*D", format: flops }
    - { symbol: dD, label: "top-up ΔD for the cheaper arm", formula: "(dCc + dCt + dCe)/(6*N)", format: tokens, emphasis: true }
    - { symbol: fr, label: "top-up as a share of D", formula: "dD/D", format: percent }
    - { symbol: Ctot, label: "matched total, training + incremental", formula: "Ctr + dCc + dCt + dCe", format: flops }
  presets:
    - { label: "D_high = 4 × 10⁹", values: { D: 4.0e9 } }
    - { label: "DCLM 400M-1x, curation unknown", values: { N: 4.12e8, D: 8.2e9, dCc: 0 } }
states:
  - { anchor: formulation, label: "U_low_top planning instance", variables: { N: 1.0e8, D: 2.0e9, dCc: 6.0e16, dCt: 0, dCe: 0 }, highlight: [Ctr, dD, fr], note: "ASSUMED instance: an incremental 6 × 10¹⁶ curation FLOPs at N = 10⁸ buys the unfiltered arm 10⁸ extra tokens, 5 % of its 2 × 10⁹." }
  - { anchor: mechanism, label: "DCLM 400M-1x", variables: { N: 4.12e8, D: 8.2e9, dCc: 0, dCt: 0, dCe: 0 }, highlight: [Ctr, dD], note: "6 × 412M × 8.2B = 2.03 × 10¹⁹, P07's reported 2.0 × 10¹⁹. C_curate is NOT-DISCLOSED, so no top-up is defined: the comparison is matched on training FLOPs only." }
  - { anchor: experimental-design, label: "high budget, D = 4 × 10⁹", variables: { N: 1.0e8, D: 4.0e9, dCc: 6.0e16, dCt: 0, dCe: 0 }, highlight: [D, dD, fr], note: "The same incremental cost is a smaller share at the high budget, 2.5 %. The top-up arm is still separate from the registered 4 × 10⁹ factor level." }
  - { anchor: failure-modes, label: "hidden curation compute", variables: { N: 1.0e8, D: 2.0e9, dCc: 0, dCt: 0, dCe: 0 }, highlight: [dCc, dD, Ctot], note: "Leave curation out of the ledger and ΔD falls to 0. The filtered arm wins at matched training FLOPs, and phrasing that as an efficiency gain is the failure mode." }
```

> **Definition — paired prompts.** The practice of presenting every arm with the same items, rendered by the same template, in the same order, with the same few-shot exemplars and sampling seeds, so that item-level differences are defined and a [paired test](../ch02-mathematical-and-statistical-foundations/02-5-statistical-inference.md) applies.

> **Assumption.** Arms share one tokenizer and sequence length, so matched D implies matched C_train at fixed N · *sensitivity:* with different tokenizers the same byte corpus yields different D and different FLOPs; match bytes and FLOPs, and report per-byte metrics ([§4.6](../ch04-language-modeling-and-learning-objectives/04-6-likelihood-and-capability.md), [§10.3](../../part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/10-3-vocabulary-economics.md)).

## Mechanism

**Baselines.** A baseline is an arm, not a citation. Copying a number from another report imports that report's evaluation unit (§6.1), and the LM Evaluation Harness authors list "avoid copying results from other implementations" among their recommendations for that reason (PAPER-REPORTED · R6.4). The baseline must also receive the same tuning budget: if the proposed arm's learning rate was swept over ten runs, the baseline's was too, or C_tune differs and Eq. 6.8 is violated (DERIVED). DERIVED — cost line: assigning the baseline the same tuning work as the candidate doubles the combined tuning spend relative to tuning only the candidate. The actual allocation belongs in the ledger.

**Ablations.** An ablation answers "which component of the proposal carries the effect?" by reverting one component at a time from the full system. Removal-from-full and addition-to-baseline give the same answer only when interactions are zero: by Eq. 6.6, the effect of adding factor 1 at baseline is 2(γ_1 − γ_12), and the effect of removing it from the full system is 2(γ_1 + γ_12) (MATHEMATICALLY-DERIVED). Reporting only one direction hides γ_12. Cost line: a leave-one-out ablation of a k-component system costs k + 1 runs per replicate against 2^k for the full factorial.

**Factorial designs and their economy.** For two factors, a one-factor-at-a-time design uses three cells; with r replicates each, a main effect is estimated from 2r runs with variance σ_run²/(2r), and the interaction is not estimable. The 2×2 factorial uses four cells; each effect, including the interaction, uses all 4r runs and has variance σ_run²/(4r) by Eq. 6.7. One additional cell permits a marginal effect averaged over both levels and identifies the interaction; the variance comparison applies to the same effect only if interactions vanish (MATHEMATICALLY-DERIVED). This "hidden replication" is why factorial designs remain affordable when the replicate is a training run: a 2³ design with r = 2 has sixteen runs and estimates every effect with the precision of sixteen. When 2^k is unaffordable, a fractional factorial deliberately aliases high-order interactions with main effects; the aliasing pattern must be registered, because it is an assumption that those interactions are zero (DERIVED). Cost line: 2^k · r training runs; at DCLM's smallest scale one run is 2.0 × 10¹⁹ training FLOPs (PAPER-REPORTED · P07 Table 1), so a 2³ × 3-seed design there is ≈ 4.8 × 10²⁰ FLOPs (DERIVED from the reported figure).

```figure
id: fig-6.17
kind: compare
title: Four arm designs for k two-level factors
caption: >-
  The "one contrast, two factors" row is the one to read. The star and the
  leave-one-out ablation each measure the same factor at one level of the
  other, and they disagree by 4γ₁₂. Only the full crossing separates γ₁
  from γ₁₂. The fractional design buys back runs by registering which
  interactions it assumes are zero. The run and FLOP row uses k = 3, r = 3
  and P07's 2.0 × 10¹⁹ FLOPs per 400M-1x run.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-6.6", "DERIVED:eq-6.7", P07]
alt: >-
  Comparison of four designs. One-factor-at-a-time: k + 1 runs per
  replicate; main-effect variance σ_run²/(2r); for two factors it measures
  adding factor 1 at baseline, 2(γ₁ − γ₁₂); no interactions; assumes they
  are zero; at k = 3, r = 3, 12 runs or 2.4 × 10²⁰ FLOPs. Leave-one-out
  ablation: k + 1 runs; the same variance, measured at the full system,
  2(γ₁ + γ₁₂); no interactions; 12 runs. Full 2^k factorial: 2^k runs;
  σ_run²/(r·2^k) for every effect; γ₁ and γ₁₂ separately; all interactions;
  24 runs or 4.8 × 10²⁰ FLOPs. Fractional 2^(k−p): σ_run²/(r·2^(k−p));
  main effects aliased with registered interactions; 12 runs for a half
  fraction. Failure modes, in order: interaction read as main effect; γ₁₂
  hidden when reported alone; 2^k·r training runs; aliased effects
  misattributed.
spec:
  axis: >-
    k two-level factors, r replicates per cell: runs, main-effect precision,
    what one contrast measures, estimable interactions, assumption; no
    design is ranked
  columns:
    - { id: ofat, label: "One-factor-at-a-time (star)" }
    - { id: loo, label: "Leave-one-out ablation" }
    - { id: full, label: "Full 2^k factorial", node: ms.section.6.3 }
    - { id: frac, label: "Fractional 2^(k−p)" }
  rows:
    - { dimension: "runs per replicate", values: { ofat: "k + 1", loo: "k + 1", full: "2^k", frac: "2^(k−p)" } }
    - { dimension: "main-effect variance (Eq. 6.7)", values: { ofat: "σ_run²/(2r)", loo: "σ_run²/(2r), at the full system", full: "σ_run²/(r·2^k), for every effect", frac: "σ_run²/(r·2^(k−p))" } }
    - { dimension: "one contrast, two factors", values: { ofat: "adding factor 1 at baseline: 2(γ₁ − γ₁₂)", loo: "removing factor 1 from full: 2(γ₁ + γ₁₂)", full: "γ₁ and γ₁₂ separately", frac: "γ₁ plus its registered alias" } }
    - { dimension: "interactions estimable", values: { ofat: "none", loo: "none", full: "all, each from every run", frac: "only those not aliased" } }
    - { dimension: "assumption", values: { ofat: "interactions are zero", loo: "interactions are zero", full: "none beyond Eq. 6.6", frac: "named high-order interactions are zero" } }
    - { dimension: "k = 3, r = 3 at DCLM 400M-1x", values: { ofat: "12 runs, 2.4 × 10²⁰ FLOPs", loo: "12 runs, 2.4 × 10²⁰ FLOPs", full: "24 runs, 4.8 × 10²⁰ FLOPs", frac: "12 runs for a half fraction 2^(3−1)" } }
    - { dimension: "failure mode", values: { ofat: "interaction read as main effect", loo: "hides γ₁₂ when reported in one direction", full: "cost 2^k·r training runs", frac: "aliased effects misattributed" } }
```

**Interaction effects that matter in practice.** Three recur. *Filter × token budget:* a selective filter shrinks the pool; at a large enough D the filtered arm must repeat data. Muennighoff et al. report that "training with up to 4 epochs of repeated data yields negligible changes to loss" with diminishing value beyond that (PAPER-REPORTED · R6.29; workload: their 400 runs up to 9B parameters and 900B tokens), so a filter's main effect measured at small D can change sign at large D. *Data × model size:* P07 reports Pearson correlations of r = 0.838, 0.956, and 0.982 between results at its 400M-1x, 1B-1x, and 3B-1x scales and the 7B-1x scale (PAPER-REPORTED · P07 §3.2, Figure 3); a correlation below one warns against exact transfer but does not identify an interaction: measurement noise can also lower correlation, so replicated cross-scale contrasts are required (DERIVED). *Prompt × checkpoint:* R6.22 reports weak correlation of format performance between models (PAPER-REPORTED · R6.22), which is why paired prompts fix the format across arms and why format should be a crossed factor when the arms are different checkpoints.

**Paired prompts.** Pairing is a design decision with an analysis payoff: §2.5's Eq. 2.21 removes between-item variance from the difference only if both arms saw the same items under the same rendering. The LM Evaluation Harness makes this the default by seeding Python, NumPy, PyTorch, and few-shot sampling separately (defaults `0,1234,1234,1234`) and by logging per-sample inputs and outputs with `--log_samples` (OFFICIAL-DOCUMENTATION · R6.3; the harness is outside the reference stack). DERIVED — cost line: pairing itself adds no model call when both arms were already evaluated. A changed few-shot seed adds a prompt intervention and can reduce correlation; common item ids still permit a paired statistical analysis.

**Fixed budgets.** "Same budget" is ambiguous until the resource is named. Matched tokens and matched training FLOPs coincide at fixed N, tokenizer, and sequence length, and come apart otherwise: a larger model at matched tokens uses more FLOPs; a better tokenizer at matched bytes uses fewer tokens and fewer FLOPs; a curated dataset at matched training FLOPs has still spent C_curate. P09 organises its comparisons by fixed compute, training "over 400 language models ranging from 70 million to over 16 billion parameters on 5 to 500 billion tokens", and its headline comparison holds compute fixed while trading parameters for data ("the same compute budget as Gopher but with 70B parameters and 4× more data") (PAPER-REPORTED · P09). The general rule is Eq. 6.8: decide which total is matched, give the cheaper arm the top-up, and state the matched resource in the claim.

**Worked case — DataComp-LM as a controlled data comparison.** What the paper reports (all PAPER-REPORTED · P07, arXiv v4):

| Design element | What P07 reports |
|---|---|
| Object varied | The training dataset: a *filtering track* in which "participants propose algorithms to select training data from a candidate pool", and a *mixing track* in which a submission "may combine documents from DCLM-Pool with those from any external sources" (§3.3) |
| Held fixed | "we fix a training recipe at each scale"; a decoder-only Transformer implemented in OpenLM (§3.4); 53 downstream tasks with three headline metrics — MMLU 5-shot, Core centered accuracy over 22 tasks, Extended centered accuracy over all 53 — in a suite "based on LLM-Foundry" (§3.5) |
| Budget rule | "The number of training tokens for each scale is 20 × number of parameters × Chinchilla multiplier" (§3.2) |
| Scales (Table 1) | 400M-1x: 412M parameters, 8.2B tokens, 2.0e19 FLOPs, 469B-token pool · 1B-1x: 1.4B, 28.8B, 2.4e20, 1.64T · 3B-1x: 2.8B, 55.9B, 9.4e20, 3.18T · 7B-1x: 6.9B, 138B, 5.7e21, 7.85T · 7B-2x: 6.9B, 276B, 1.1e22, 15.7T |
| Cross-scale check | Pearson r = 0.838, 0.956, 0.982 between the three smaller scales and 7B-1x (§3.2) |
| Finding on filters | "fastText-based filtering outperforms all other approaches" among those compared (§4.4) |
| Stated limitations | the authors could only ablate dimensions individually; "We also could not sufficiently explore run-to-run variation"; weaker code and math performance (§6) |

Read against this section's definitions: within a scale, D and C_train are equal across dataset arms by construction — the reported FLOPs agree with 6ND (6 × 412M × 8.2B ≈ 2.0 × 10¹⁹; DERIVED from the reported figures) — so a dataset difference is not confounded with training tokens or training FLOPs. The pools are 57 or more times the training tokens at every scale (469B/8.2B; DERIVED), so avoiding repetition requires the retained fraction and post-cleaning token count to exceed the registered consumption budget; the pool ratio alone does not establish that condition. That is a matched-budget comparison in the sense of Eq. 6.8's first term. Three things the design does not deliver, by the paper's own statement or by omission in the pages inspected: (i) replicate variance is NOT-DISCLOSED, so σ_run² in Eq. 6.7 is unknown and small differences between pipelines cannot be assigned a significance; (ii) the pipeline was assembled step by step rather than crossed (the authors could only ablate dimensions individually), so interactions among pipeline stages are unestimated; (iii) C_curate is outside the matched budget — the compute of model-based filtering relative to C_train is NOT-DISCLOSED in the pages inspected. The abstract's comparison with MAP-Neo ("a 6.6 percentage point improvement on MMLU while being trained with 40% less compute") is of a different kind: it compares units that differ in architecture, tokenizer, data, and recipe, and is a frontier statement in the sense of [§6.5](06-5-quality-resource-frontiers.md), not a controlled comparison in the sense of this section.

```figure
id: fig-6.18
kind: chart
title: DCLM scales against the 20·N token rule
caption: >-
  P07 Table 1's five scales on log–log axes against the budget rule D =
  20 × N × multiplier. With D = 20N, 6ND becomes 120N². The four 1x scales
  sit on that line and 7B-2x sits on 240N². Every dataset arm at a scale
  shares that scale's single point, which is what "matched D and C_train by
  construction" looks like. The line is drawn only through the tested
  scales and says nothing about curation compute, which is NOT-DISCLOSED.
  The candidate pool is about 57× D at every scale: 57.2 at 400M-1x and
  56.9 at the four larger ones.
placement: inline
evidence: PAPER-REPORTED
source: [P07, "DERIVED:eq-6.8"]
context:
  hardware: "not used in this chapter (NOT-DISCLOSED here)"
  model: "DCLM fixed-recipe decoder-only Transformers in OpenLM, 412M to 6.9B parameters (P07 §3.4, Table 1)"
  precision: "NOT-DISCLOSED in the pages read"
  sequenceLength: "NOT-DISCLOSED in the pages read"
  ioDistribution: "training tokens = 20 × parameters × Chinchilla multiplier (P07 §3.2)"
  concurrency: "not applicable: training-compute accounting"
  runtimeVersion: "P07 arXiv v4; OpenLM revision NOT-DISCLOSED"
  measurementBoundary: "training FLOPs as tabulated in P07 Table 1; curation and evaluation compute excluded"
alt: >-
  Log–log scatter of reported training FLOPs against parameters for P07's
  five scales: 400M-1x, 412M parameters and 2.0 × 10¹⁹ FLOPs; 1B-1x, 1.4B
  and 2.4 × 10²⁰; 3B-1x, 2.8B and 9.4 × 10²⁰; 7B-1x, 6.9B and 5.7 × 10²¹;
  7B-2x, 6.9B and 1.1 × 10²². A line 120N², which is 6ND at D = 20N, passes
  through the four 1x points: 2.04 × 10¹⁹ at 412M and 5.71 × 10²¹ at 6.9B.
  A dashed line 240N² passes through 7B-2x at 1.14 × 10²². Computed 6ND
  agrees with each reported figure to two significant digits.
spec:
  type: scatter
  x: { label: "parameters N", scale: log10, format: params, domain: [3.0e8, 1.0e10] }
  y: { label: "training FLOPs", scale: log10, format: flops, domain: [1.0e19, 3.0e22] }
  series:
    - { id: rep, label: "P07 Table 1, reported", points: [[4.12e8, 2.0e19], [1.4e9, 2.4e20], [2.8e9, 9.4e20], [6.9e9, 5.7e21], [6.9e9, 1.1e22]], emphasis: true }
    - { id: one, label: "1x rule: 6N·20N = 120N²", formula: "120*x^2", sample: { from: 3.0e8, to: 1.0e10, count: 21 } }
    - { id: two, label: "2x rule: 6N·40N = 240N²", formula: "240*x^2", sample: { from: 3.0e8, to: 1.0e10, count: 21 }, dashed: true }
  annotations:
    - { x: 4.12e8, label: "400M-1x: 6 × 412M × 8.2B ≈ 2.0e19" }
    - { x: 6.9e9, label: "7B-2x: same N, twice the tokens" }
```

FineWeb documents the cost of such designs at the ablation scale: models of 1.71B parameters trained with Nanotron on ≈ 28B tokens per filtering ablation, "two models for each dataset version, each using a different but equal-sized random subset of the full data and a different initialization seed", and "over 70 models … for an estimated total of 80,000 H100 GPU hours" (PAPER-REPORTED · P06 §3.1; workload: Llama architecture, sequence length 2048, GPT-2 tokenizer, evaluation with lighteval on tasks truncated to 1,000 samples). Two replicates per cell describes this study, not a general standard; §6.4 shows what it can and cannot resolve.

## Algorithm

```text
Algorithm 6.3 — Matched-budget factorial plan with explicit comparison groups
INPUT   bounded two-level factors; registered comparison groups and resource per group;
        per-arm curation/tuning/evaluation costs; operation-count model; r seed blocks
OUTPUT  factorial run plan, separate top-up arms, and a comparison ledger
STATE   factorial cells; immutable factor values; resource ledger; derived arms
INVARIANT  factor levels are preserved; only members of a matched group share its target
1  Enumerate the registered factorial or fraction; reject a plan exceeding the run cap.
2  Compute each cell's consumed tokens and training/non-training resource estimates.
3  For each comparison group, verify the same accounting boundary and allowed variations.
4  If token budget is a factor, create separate matching groups at each token level.
5  For training-matched contrasts, validate equal training resources within tolerance.
6  For total-compute contrasts, calculate the difference in non-training stage costs.
7  Create an additional top-up arm for the cheaper member using the operation-count model;
       never overwrite a factorial cell's registered token level.
8  Reject infeasible matches, material uncounted costs, or repetition beyond the declared cap.
9  Emit r runs per cell and derived arm, preserving the common seed-block index.
10 Freeze paired items, prompt rendering, few-shot choices, scorer, and raw outcome schema.
11 Validate each contrast's budget and write the plan before viewing test outcomes.
```

DERIVED — complexity: O(k·2^k + A·r + E_compare) for k factors, A emitted arms including top-ups, and E_compare declared matching edges, excluding resource-model evaluation. Factor vectors cost O(k) to construct. Bound k and the run count before enumeration. Total execution cost is the sum of actual per-run resource ledgers. The plan is immutable after line 11. Shared seed indices define blocks; only a truly common additive seed effect cancels. Dataset changes can alter random-number consumption and data order, so positive covariance and variance reduction require evidence rather than matching seed integers alone.

## Implementation

The arms are training and evaluation jobs on reference-stack systems. P07's arms were trained with OpenLM (outside the reference stack; used under the plan's Chapter 06 source anchor) and evaluated with a suite based on MosaicML LLM Foundry (*Distributed training* layer in the reference stack's §4.1 map) (PAPER-REPORTED · P07). P06's arms were trained with Nanotron (*Distributed training* layer) and evaluated with lighteval (outside the reference stack) (PAPER-REPORTED · P06). A PyTorch-native design would place the arms on TorchTitan (*Distributed training*) over PyTorch (*Model / autograd framework*); no property of these systems is asserted here beyond their role (NOT-DISCLOSED for their default logging of consumed tokens and FLOPs, not inspected). What the design requires of any of them, under the §4.2 *Reproducibility* and *Metrics* dimensions: identical configuration files across arms except the declared factor; logged consumed tokens (not scheduled tokens); logged accelerator-hours per arm including curation jobs so that C_curate is measured rather than estimated; and a fixed container and driver across arms, since kernel selection changes both speed and low-order numerics ([§3.6](../ch03-numerical-computation-and-trustworthy-training/03-6-reproducibility-limits.md)).

```text
Systems trace (one factorial cell)
curate data     → compute: C_curate (classifier or dedup pass over the pool) / storage: filtered shard set / failure: unlogged compute
train           → compute: 6·N·D FLOPs / memory, communication: per Chapters 29–30 / failure: divergent run replaced by a re-run (must be recorded)
evaluate        → compute: ≈2N FLOPs × evaluated tokens × tasks / failure: arm-specific prompt or few-shot seed
record          → storage: run config + consumed-token log + per-sample outcomes / failure: aggregates only
```

Cost line: the dominant term is r · 2^k · 6ND; evaluation is typically a small fraction of one training run at these scales but is paid per checkpoint evaluated (DERIVED; the ratio is workload-specific and UNVERIFIED for any given suite).

## Experimental design

### Experiment 6.3 — Data-quality gain versus extra training compute (summary; full protocol in verification.md)

- **Hypothesis:** a model-based quality filter improves held-out-domain quality at matched tokens *and* at matched total FLOPs, with no sign change across token budgets.
- **Setup:** 2 (filter off/on) × 2 (token budget) × 2 (FLOP budget) factorial with N set by C/(6D), plus a total-compute top-up arm for the unfiltered baseline (Eq. 6.8), r ≥ 3 shared seeds.
- **Independent variables:** filter, D, C.
- **Controlled variables:** architecture family, tokenizer, sequence length, optimiser recipe per (N, D), evaluation unit, partition.
- **Dataset/workload:** one raw pool; filtered pool derived from it; evaluation on in-domain tasks and on a held-out domain the filter's classifier was not trained to favour.
- **Hardware:** one accelerator class; accelerator-hours logged per arm including curation.
- **Metrics:** item-level paired differences on the held-out domain; bits-per-byte on a held-out corpus; Eq. 6.7 effects with intervals from §6.4.
- **Baselines:** unfiltered arm at matched tokens; unfiltered arm at matched total FLOPs.
- **Expected result:** under the quality explanation, γ_filter > margin in every (D, C) cell and against the top-up arm; under the compute explanation, the top-up arm closes the gap.
- **Ablation:** random subsample of the pool to the filtered pool's size (controls for pool size and repetition without selection).
- **Interpretation and Threats to validity:** in [verification.md](verification.md).

Proposal only; no run was executed.

## Observations

**What the paper claims.** P07 claims that fixing the recipe per scale isolates dataset effects, that model-based filtering is key, and that small-scale results correlate with 7B-1x results. P06 claims its two-seed, two-subsample ablation protocol gives usable signal on selected tasks. P09 claims compute-matched comparisons favour more data at smaller N than prior practice. R6.24 claims that conclusions can reverse with computational budget. R6.29 claims repetition up to about four epochs costs little.

**What the evidence shows.** P07 and P06 agree, independently, that classifier-based filtering of web text improves their downstream suites at matched training budgets; neither reports replicate variance sufficient to bound small differences, and both evaluate on overlapping families of multiple-choice tasks. No independent reproduction of either pipeline's ordering was inspected for this edition.

**What we infer.** DERIVED: DCLM's fixed-scale design addresses dataset differences at matched training resources. The proposed verification separately asks whether a gain survives accounting for incremental curation work and whether it transfers beyond filter-like tasks. UNVERIFIED: the ratio of incremental curation cost to training cost for the proposed workload; it is measured or explicitly estimated before setting the top-up, not assumed negligible.

**What remains unknown.** σ_run² for DCLM-scale runs is NOT-DISCLOSED. Interactions among pipeline stages are unestimated by the authors' statement. Whether the 0.838 correlation at the smallest scale reflects noise or a real dataset × scale interaction is UNVERIFIED without replicates.

## Failure modes

> **Failure mode — Untuned baseline.** *Symptom:* the baseline underperforms its own original report. *Cause:* C_tune spent only on the proposed arm. *Detection:* ledger rows differ in tuning runs. *Mitigation:* equal search budget, or report expected-best-of-n curves (R6.24).

> **Failure mode — Budget named loosely.** *Symptom:* "same compute" arms differ in model size or tokenizer. *Cause:* tokens matched, FLOPs not (or the reverse). *Detection:* recompute 6ND per arm; compare bytes consumed. *Mitigation:* name the matched resource; Algorithm 6.3 line 4–7.

> **Failure mode — Hidden curation compute.** *Symptom:* a data method wins at matched training FLOPs and the claim is phrased as an efficiency gain. *Cause:* C_curate outside the budget. *Detection:* no accelerator-hour log for curation jobs. *Mitigation:* total-FLOP top-up arm.

> **Failure mode — Interaction read as main effect.** *Symptom:* a filter helps at one token budget and hurts at another. *Cause:* filter × repetition interaction. *Detection:* REPETITION-CONFOUND flag; sign change across D. *Mitigation:* cross the factors; report γ_12.

> **Failure mode — Unpaired arms.** *Symptom:* wide intervals on a difference despite a large test set. *Cause:* different few-shot seeds, templates, or item subsets across arms. *Detection:* per-sample logs do not align by item id and rendered prompt hash. *Mitigation:* Algorithm 6.3 line 10.

> **Failure mode — Survivor replicates.** *Symptom:* every reported run converged. *Cause:* diverged seeds were silently re-run. *Detection:* seed list in the log differs from the registered list. *Mitigation:* record divergences as outcomes (§6.6).

## Siblings

**One-factor-at-a-time ablation** — this file
Why it exists: fewest runs. What assumption changed: interactions are zero. What problem it solved: cost. New failure mode: interaction read as main effect. Changed primitive: cube → star.

**Fractional factorial and screening designs** — this file
Why it exists: 2^k is unaffordable for k > 4 at training-run cost. What assumption changed: named high-order interactions are zero. What problem it solved: screening many factors. New failure mode: aliased effects misattributed. Changed primitive: full crossing → registered fraction.

**Iso-FLOP sweeps** — [§21.2 Compute-optimal design](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-2-compute-optimal-design.md)
Why it exists: choose N and D under one C. What assumption changed: the factor is the allocation, the budget is fixed. What objective changed: loss at fixed C. What problem it solved: confounding of size with compute. New failure mode: fitted-form extrapolation. Changed primitive: discrete arms → a curve per budget.

**Fixed-recipe competitions (DCLM-style)** — [§9.2 Quality and diversity](../../part-02-data-and-representation-engineering/ch09-data-mixtures-curricula-and-sample-efficiency/09-2-quality-and-diversity.md)
Why it exists: many groups, one question. What assumption changed: the organiser fixes everything except the dataset. What problem it solved: cross-group comparability. New failure mode: the fixed recipe may favour some datasets (recipe × data interaction unestimated). Changed primitive: per-paper recipe → shared recipe.

**Controlled preference-objective comparison** — [§33.6 Controlled comparison](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch33-direct-preference-optimization-and-related-objectives/33-6-controlled-comparison.md)
Why it exists: objective variants are compared on different data and references. What assumption changed: data, reference policy, and budget are matched. What objective changed: the factor *is* the objective. New failure mode: judge dependence. Changed primitive: checkpoint arms → objective arms.

**Online A/B tests** — [§47.3 Release control](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch47-observability-deployment-changes-and-incident-recovery/47-3-release-control.md)
Why it exists: offline items miss deployment behaviour. What assumption changed: users are randomised, not items. New failure mode: interference and novelty effects. Changed primitive: item pairing → user randomisation.

## Extensions

Domain adaptation adds the starting checkpoint as a blocking factor and retention on the original domain as a second response. Long-context comparisons must match FLOPs with the attention-score term included, which C ≈ 6ND omits ([§5.6](../ch05-minimal-transformer-and-execution-trace/05-6-reference-accounting.md)). Multimodal arms need per-modality token accounting before "matched tokens" means anything. Agent comparisons match the inference budget (samples, tool calls, wall-clock) instead of training budget ([§38.6](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch38-inference-time-reasoning-search-and-adaptive-compute/38-6-evaluation-and-economics.md)). Proposal: register the matched resource per lifecycle stage in `prereg.yaml`.

## Limitations

Eq. 6.7's variance assumes homoscedastic, independent run noise; divergent runs and shared-seed blocking violate it in known directions. Two-level factors cannot detect curvature; a filter threshold is continuous and may have an interior optimum. C ≈ 6ND is a dense-Transformer approximation. Falsification: if replicated factorials over common data and recipe factors found all two-factor interactions inside the run-to-run noise, one-factor-at-a-time ablation would be adequate for that regime and the extra cells unnecessary. Decision consequence: no "X improves Y" statement in this book is accepted without the matched resource named and the baseline's ledger row shown.

## Reproducibility

Versions: P07 arXiv 2406.11794 v4 (HTML, §3.2–§3.5, §4.4, §4.6, §6, Table 1); P06 arXiv 2406.17557 (HTML, §3.1); P09 arXiv 2203.15556 (abstract); R6.24 arXiv 1909.03004; R6.29 arXiv 2305.16264; R6.3 LM Evaluation Harness interface documentation (main branch); all accessed 2026-09-20. Artifacts: the `design` block of `prereg.yaml`. Configuration: factor levels, matched resource, tolerance tol_M, seed list, top-up tokens. Metric definitions: Eq. 6.7 effects on Eq. 6.1 scores. Unresolved: DCLM replicate variance and curation compute (NOT-DISCLOSED).

## References

P06, P07, P09; R6.3, R6.4, R6.22, R6.24, R6.29; notation.md §2.2.
