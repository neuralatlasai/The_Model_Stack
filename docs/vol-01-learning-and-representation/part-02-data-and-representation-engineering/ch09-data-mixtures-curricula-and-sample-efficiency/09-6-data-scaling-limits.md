---
id: ms.section.9.6
entity_type: section
title: Data scaling limits
short_title: Data scaling limits
volume: 1
part: 2
chapter: 9
section: 9.6
slug: 09-6-data-scaling-limits
parent: ms.chapter.9
prev_sibling: ms.section.9.5
next_sibling: ms.verification.9
children: []
prerequisites: [ms.section.2.6, ms.section.6.5, ms.section.9.1, ms.section.9.2, ms.section.9.5]
downstream: [ms.section.11.6, ms.section.21.2, ms.section.21.3, ms.section.21.4, ms.section.22.6]
related: [ms.section.11.4]
siblings_by_mechanism: [ms.section.21.2, ms.section.21.3]
relations:
  - {type: supported_by, target: paper.P09}
  - {type: supported_by, target: paper.P07}
  - {type: trades_off_with, target: ms.section.21.3}
axes:
  lifecycle: [data, pretraining]
  mechanism: [repetition, data_constrained_scaling, synthetic_data, compute_allocation]
  feedback_setting: []
  modality: [text]
papers: [P07, P09]
implementations: []
benchmarks: []
datasets: [c4, oscar]
status:
  maturity: active
  disputed: true
evidence_summary:
  labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED]
  empirically_observed: false
word_count_target: 2300
updated_at: 2026-09-24
editorial_status: manuscript_draft
---

# 9.6 Data scaling limits

## Scope

Objective: state what happens to the mixture problem when the planned consumed tokens exceed the unique tokens available — the data-constrained regime — by giving the repetition-discounted effective-data form as its source states it, the allocation consequences, the role and risks of synthetic fractions, what "saturation" does and does not mean, and how inference demand changes the tokens-per-parameter decision. Baseline: single-epoch training at the compute-optimal token count of P09. Success criterion: the reader can compute effective data for a planned mixture from its per-domain epochs, decide whether to spend marginal compute on parameters or epochs, and state the stock estimates with their intervals. Boundaries: fitting scaling laws and the compute-optimal frontier in general are owned by [§21.1](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-1-empirical-scaling.md)–[§21.2](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-2-compute-optimal-design.md); inference-aware training as a design discipline is [§21.3](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-3-inference-aware-training.md); synthetic-data generation and its distributional risks are [§11.4](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-4-distributional-risks.md) and [§11.6](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-6-synthetic-data-economics.md). This section owns data-constrained scaling and repetition specifically.

## Why this exists

What failed before was the assumption that tokens are free at the margin. PAPER-REPORTED (P09): compute-optimal training scales parameters and tokens equally — "for every doubling of model size the number of training tokens should also be doubled" — established by training over 400 models from 70M to over 16B parameters on 5B to 500B tokens. Applied at frontier compute, that rule demands token counts that approach the supply of public text; PAPER-REPORTED (R9.6, v2 June 2024): frontier datasets "typically around 10T tokens", with Llama 3 at 15T cited from Meta's April 2024 announcement (the later Llama 3 report gives a corpus of "about 15T" tokens and 15.6T text tokens for the 405B pre-training run; PAPER-REPORTED, R9.8), and public human text of usable quality estimated at around 300T tokens with a 90% interval of 100T to 1000T. The bottleneck is unique tokens, and the regime in which it binds — the data-constrained regime — changes the answer to "parameters or tokens?" because repeated tokens are worth less than fresh ones. PAPER-REPORTED (R9.5): "with constrained data for a fixed compute budget, training with up to 4 epochs of repeated data yields negligible changes to loss compared to having unique data. However, with more repetition, the value of adding compute eventually decays to zero." The dominant constraint is therefore not compute but the exchange rate between compute and unique data, which is set by the repetition discount, by the availability of synthetic tokens, and by the inference demand that pushes runs to overtrain small models. What changed is that the mixture policy of [§9.1](09-1-mixture-formulation.md) must now be planned against a stock: the epochs column is no longer a preference but a forecast of diminishing value, and the weight on any small domain has an explicit ceiling in effective data.

```figure
id: fig-9.30
kind: stat-panel
title: Public text stock against frontier demand
caption: >-
  R9.6's estimates with their intervals, and the one comparison the section
  draws from them. A 15.6T-token run is 5.2% of the central effective stock,
  but 15.6% of its lower bound, and the intervals span an order of magnitude.
  The two Eq. 9.29 products (indexed web × q × m at q = 10% and 40%) bracket
  the reported stock, which is all the framing is for; they are not the
  paper's model. Nothing here is a point forecast.
placement: rail
anchor: why-this-exists
evidence: PAPER-REPORTED
source: [R9.6, R9.8]
alt: >-
  Instrument panel of Epoch AI's estimates (R9.6, arXiv v2, June 2024).
  Indexed web about 510T tokens, 95% interval 130T to 2100T; whole web about
  3100T, 1900T to 5200T; usable-quality fraction 10% to 40%; multi-epoch
  multiplier about 5×; effective stock about 300T, 90% interval 100T to 1000T.
  The Eq. 9.29 product of indexed web, quality fraction and multiplier is 255T
  at 10% and 1020T at 40%, derived here, not the paper's model. Frontier
  datasets are typically about 10T tokens; Llama 3 used 15.6T (R9.8), 5.2% of
  the central effective stock and 15.6% of its lower bound. Full use of the stock
  between 2026 and 2032 at 80%; a 5×-overtrained policy exhausts the stock
  around 2027 and a 100×-overtrained one around 2025.
spec:
  header: "PUBLIC TEXT STOCK · R9.6 (v2, JUNE 2024)"
  variables: { Sidx: 510.0e12, qlo: 0.1, qhi: 0.4, m: 5, Seff: 300.0e12, Slo: 100.0e12, L3: 15.6e12 }
  rows:
    - { key: "indexed web", value: "≈ 510T [130T–2100T]", note: "95% interval" }
    - { key: "whole web", value: "≈ 3100T [1900T–5200T]", note: "95% interval" }
    - { key: "usable-quality fraction q, %", value: "10–40" }
    - { key: "multi-epoch multiplier m", value: "≈ 5×" }
    - { key: "effective stock S_eff", value: "≈ 300T [100T–1000T]", note: "90% interval" }
    - { key: "Eq. 9.29 product, q = 10%, T", formula: "Sidx*qlo*m/1e12", format: integer, note: "DERIVED; not the paper's model" }
    - { key: "Eq. 9.29 product, q = 40%, T", formula: "Sidx*qhi*m/1e12", format: integer, note: "DERIVED; not the paper's model" }
    - { key: "frontier datasets, typical", value: "≈ 10T" }
    - { key: "Llama 3 ÷ central S_eff", formula: "L3/Seff", format: percent, note: "15.6T (R9.8)" }
    - { key: "Llama 3 ÷ lower-bound S_eff", formula: "L3/Slo", format: percent }
    - { key: "stock fully used, 80% interval", value: "2026–2032" }
    - { key: "5× · 100× overtrained exhausts", value: "≈ 2027 · ≈ 2025" }
```

## Intuition

Physically, the first pass over a token teaches the model what that token's context predicts; a second pass teaches it a little more, because the model has changed since and the gradient is not the same; by some number of passes the gradient contribution of that token is mostly what the model already encodes, and the compute spent is wasted or, worse, spent on memorising the exact sequence — the mechanism R9.24 associates with damaged general-purpose structures. The effective-data form of R9.5 is a saturating function that captures the first two facts: each additional epoch adds a geometrically shrinking increment of "new" data. The same reasoning applied to parameters says that adding parameters beyond what the unique data can inform has diminishing returns too, which is why the paper fits a symmetric form. Inference demand enters through a different physical channel: every token served costs about 2N FLOPs, so for a model that will serve many more tokens than it trained on, the lifetime cost is dominated by N, and a smaller model trained longer — deeper into the repetition regime if data is scarce — minimises total FLOPs at equal quality. Heuristically one hears that models "get bored" of repeated data; the physical content is the saturation of the effective-data increment and the memorisation capacity of [§9.2](09-2-quality-and-diversity.md).

## Formulation

Let U_D be unique tokens available (after filtering, under the run's tokenizer), D the tokens consumed, N the parameter count, and C ≈ 6ND the training compute ([notation.md](../../../front-matter/notation.md) §2.2, with its stated assumptions).

> **Definition — data-constrained regime.** The regime in which the planned consumed tokens exceed the unique available tokens of at least one weighted domain — `w_i D > n_i` for some i — so that repetition is forced by the policy rather than chosen.

**Repetitions and their parameter analogue.** PAPER-REPORTED (R9.5, §3–4):

$$
R_D = \frac{D}{U_D} - 1, \qquad R_N = \frac{N}{U_N} - 1
$$
*(Eq. 9.21)* where R_D is the number of repetitions (epochs minus one) of the unique data and U_N is "the compute-optimal number of parameters for U_D or less if N < N_opt" — the parameter count that U_D unique tokens would compute-optimally support — so R_N counts "excess" parameters in the same way R_D counts excess tokens.

> **Definition — repetition-discounted effective data.** Unique tokens plus a saturating contribution from repetitions, `D′ = U_D + U_D R*_D (1 − e^{−R_D/R*_D})`, in the form fitted by R9.5.

$$
D' = U_D + U_D\,R^{*}_{D}\Big(1 - e^{-R_D / R^{*}_{D}}\Big)
$$
*(Eq. 9.22)* where R*_D is a fitted constant that the paper reads as the point at which repeated data's value has decayed; PAPER-REPORTED (R9.5, Appendix A, fitted on 182 samples): R*_D ≈ 15.39.

$$
N' = U_N + U_N\,R^{*}_{N}\Big(1 - e^{-R_N / R^{*}_{N}}\Big)
$$
*(Eq. 9.23)* where R*_N ≈ 5.31 is the fitted parameter analogue (PAPER-REPORTED, R9.5).

$$
L(N, D) = \frac{A}{N'^{\alpha}} + \frac{B}{D'^{\beta}} + E
$$
*(Eq. 9.24)* where A, B, E, α, β are fitted as in the P09 form (Eq. N.3), with N′ and D′ from Eq. 9.22–9.23 replacing N and D; PAPER-REPORTED (R9.5, Appendix B, fitted on 54 samples): A ≈ 521, B ≈ 1488, E ≈ 1.87 and α = β ≈ 0.353, rounded to 0.35 in the paper's assembled loss formula. Limits: as R_D → 0, D′ → U_D (no repetition, the P09 form is recovered); as R_D → ∞, D′ → U_D(1 + R*_D), so no amount of repetition is worth more than about 1 + R*_D ≈ 16 unique-data-equivalents of the pool. MATHEMATICALLY-DERIVED from the stated form.

<details><summary>Derivation of the marginal value of an epoch under Eq. 9.22</summary>

dD′/dR_D = U_D e^{−R_D/R*_D}: the first repetition is worth U_D e^{−1/15.39} ≈ 0.94 U_D fresh tokens, the fourth about 0.77 U_D, the sixteenth about 0.35 U_D, and the fortieth about 0.07 U_D. Summing, four epochs (R_D = 3) give D′ ≈ U_D(1 + 15.39(1 − e^{−3/15.39})) ≈ 3.7 U_D against 4 U_D of consumed tokens — the "negligible" loss of the abstract; sixteen epochs give D′ ≈ 10.6 U_D against 16 U_D; forty epochs D′ ≈ 15.2 U_D against 40 U_D. MATHEMATICALLY-DERIVED from the paper's constants; the paper's own reading is that returns "eventually diminish to zero" and its results discussion of the fit (§6, Figure 5; not its limitations appendix) notes that the form "significantly underestimates the final test loss of failing models where loss increases midway through training, such as models trained for 44 epochs" — the form assumes excess epochs plateau rather than degrade.

</details>

```figure
id: fig-9.31
kind: chart
title: Repetition-discounted effective data against epochs
caption: >-
  Eq. 9.22 in unique-data equivalents. Consumed tokens rise along the dashed
  diagonal; D′ tracks it to about four epochs (3.73 of 4, 93%), bends away by
  sixteen (10.58 of 16, 66%) and flattens under the ceiling 1 + R*_D = 16.4.
  The band is Algorithm 9.6's sensitivity pass, R*_D halved and doubled: at
  sixteen epochs it spans 7.6 to 12.9. At 44 or more epochs R9.5's own runs
  showed a mid-training loss rise, which this plateau cannot show. Constants
  fitted on English web text only.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-9.22", R9.5]
alt: >-
  Log–log line chart of D′/U_D against epochs D/U_D from 1 to 64. The consumed
  diagonal equals the epoch count. With R*_D = 15.39, D′/U_D is 1.97 at 2
  epochs, 3.73 at 4, 6.62 at 8, 10.58 at 16, 14.34 at 32, 15.17 at 40 and 16.13
  at 64, approaching the dashed ceiling 16.39. With R*_D halved to 7.7 the
  values are 3.48 at 4, 7.60 at 16 and 8.65 at 40; doubled to 30.8 they are
  3.86, 12.87 and 23.11.
spec:
  type: line
  x: { label: "epochs D/U_D", scale: log2, format: raw, domain: [1, 64] }
  y: { label: "D′/U_D, unique-data equivalents", scale: log2, format: raw }
  variables: { Rs: 15.39 }
  series:
    - { id: consumed, label: "consumed tokens, D/U_D", formula: "x", sample: { from: 1, to: 64, count: 2 }, dashed: true }
    - { id: dprime, label: "D′/U_D at R*_D = 15.39 (R9.5 fit)", formula: "1 + Rs*(1 - exp(-(x - 1)/Rs))", sample: { from: 1, to: 64, count: 25 }, emphasis: true }
    - { id: half, label: "R*_D × 0.5 = 7.7", formula: "1 + 0.5*Rs*(1 - exp(-(x - 1)/(0.5*Rs)))", sample: { from: 1, to: 64, count: 25 } }
    - { id: double, label: "R*_D × 2 = 30.8", formula: "1 + 2*Rs*(1 - exp(-(x - 1)/(2*Rs)))", sample: { from: 1, to: 64, count: 25 } }
    - { id: ceiling, label: "ceiling 1 + R*_D = 16.4", formula: "1 + Rs", sample: { from: 1, to: 64, count: 2 }, dashed: true }
  annotations:
    - { x: 4, label: "4 epochs: 3.73 (93%)" }
    - { x: 16, label: "16 epochs: 10.58 (66%)" }
    - { x: 40, label: "40 epochs: 15.17 (38%)" }
```

**Per-domain extension (this book's, not the paper's).** With a mixture, each domain has its own e_i; applying Eq. 9.22 per domain,

$$
D'_{\text{mix}} = \sum_i \Big[ n_i + n_i\,R^{*}_{D}\Big(1 - e^{-(e_i - 1)^{+}/R^{*}_{D}}\Big) \Big], \qquad (e_i - 1)^{+} = \max(e_i - 1, 0)
$$
*(Eq. 9.25)* where a domain with e_i < 1 contributes its consumed tokens e_i n_i, not n_i (the formula above is for e_i ≥ 1; below one epoch, replace the bracket by e_i n_i). ASSUMED: the constant R*_D was fitted on English web text (C4 and OSCAR subsets, R9.5) and its value for code, mathematics or other languages is UNVERIFIED; the additive combination across domains ignores the interaction matrix of [§9.5](09-5-multilingual-and-specialist-mixtures.md). The ledger reports D′_mix as an indicative quantity, flagged as such.

```figure
id: fig-9.32
kind: calculator
title: Per-domain effective data of a three-domain mixture
caption: >-
  Eq. 9.25 with its e_i < 1 branch, on pool sizes taken from OLMo 2 Mix 1124
  (DCLM-Baseline 3.71T, StarCoder 83B, OpenWebMath 12.2B; R9.7, Table 4) and
  weights and budget that are illustrative, not OLMo 2's. The aggregate reads
  1.05 epochs while the math pool is read 16 times; D′_mix still looks healthy
  because the small pool is small. Scroll: the default plan, Algorithm 9.6's
  R*_D sensitivity, and a tripled math weight. The additive per-domain use of
  R9.5's constant is ASSUMED, as the section states.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-9.25", R9.5, R9.7]
alt: >-
  Calculator for Eq. 9.25 over three pool sizes, two weights (the first
  domain takes the remainder), consumed tokens D and R*_D. Defaults: pools
  3.71T, 83B and 12.2B tokens; weights 85%, 10% and 5%; D = 4T; R*_D = 15.39.
  Epochs 0.92, 4.82 and 16.4; aggregate 1.05; D′_mix 3.895T, 97.4% of D. With
  R*_D halved: D′_mix 3.826T, 95.7%. With the third weight at 15% and the first
  at 75%: third-domain epochs 49.2, aggregate still 1.05, D′_mix 3.555T, 88.9%;
  the extra 400B math tokens add about 61B of effective data.
spec:
  tex: >-
    D'_{\text{mix}} = \sum_i \Big[\min(e_i, 1)\,n_i + n_i R^{*}_{D}\big(1 - e^{-(e_i - 1)^{+}/R^{*}_{D}}\big)\Big],\qquad e_i = \frac{w_i D}{n_i}
  equation: "9.25"
  inputs:
    - { symbol: n1, label: "web pool n_1", default: 3.71e12, min: 1.0e11, max: 1.0e14, scale: log10, format: tokens }
    - { symbol: n2, label: "code pool n_2", default: 8.3e10, min: 1.0e9, max: 1.0e13, scale: log10, format: tokens }
    - { symbol: n3, label: "math pool n_3", default: 1.22e10, min: 1.0e8, max: 1.0e12, scale: log10, format: tokens }
    - { symbol: w2, label: "code weight w_2", default: 0.1, min: 0, max: 0.5, step: 0.01, format: percent }
    - { symbol: w3, label: "math weight w_3 (w_1 = 1 − w_2 − w_3)", default: 0.05, min: 0, max: 0.5, step: 0.01, format: percent }
    - { symbol: D, label: "consumed tokens D", default: 4.0e12, min: 1.0e11, max: 1.0e14, scale: log10, format: tokens }
    - { symbol: Rs, label: "R*_D", default: 15.39, min: 7.695, max: 30.78, options: [7.695, 15.39, 30.78], format: fixed2 }
  outputs:
    - { symbol: e1, label: "epochs, web e_1", formula: "(1 - w2 - w3)*D/n1", format: fixed2 }
    - { symbol: e2, label: "epochs, code e_2", formula: "w2*D/n2", format: fixed2 }
    - { symbol: e3, label: "epochs, math e_3", formula: "w3*D/n3", format: fixed2 }
    - { symbol: ag, label: "aggregate epochs D/Σn_i", formula: "D/(n1 + n2 + n3)", format: fixed2 }
    - { symbol: Dm, label: "D′_mix, Eq. 9.25", formula: "n1*min(e1, 1) + n1*Rs*(1 - exp(-max(e1 - 1, 0)/Rs)) + n2*min(e2, 1) + n2*Rs*(1 - exp(-max(e2 - 1, 0)/Rs)) + n3*min(e3, 1) + n3*Rs*(1 - exp(-max(e3 - 1, 0)/Rs))", format: tokens, emphasis: true }
    - { symbol: fr, label: "D′_mix ÷ D", formula: "Dm/D", format: percent }
states:
  - { anchor: formulation, label: "default plan", variables: { w2: 0.1, w3: 0.05, Rs: 15.39 }, highlight: [e3, ag, Dm, fr], note: "Aggregate 1.05 epochs, yet math is read 16.4 times. D′_mix is 97.4% of D because the repeated pool is small; the per-domain epochs, not the total, carry the warning." }
  - { anchor: algorithm, label: "sensitivity, R*_D × 0.5", variables: { w2: 0.1, w3: 0.05, Rs: 7.695 }, highlight: [Rs, Dm, fr], note: "Algorithm 9.6 step 8: halve R*_D and D′_mix falls to 95.7%; the code pool's contribution drops 8% and the math pool's 29%. The plan is only as good as an English-web constant." }
  - { anchor: failure-modes, label: "w_3 = 15%: hidden multi-epoch", variables: { w2: 0.1, w3: 0.15, Rs: 15.39 }, highlight: [e3, ag, fr], note: "Triple the math weight: aggregate epochs stay at 1.05, e_3 = 49, far past R*_D, and the extra 400B consumed math tokens add only about 61B of effective data." }
```

> **Definition — synthetic fraction.** `s = D_syn / D`, the share of consumed tokens whose text was produced by a model, reported per schedule phase together with the generator's identity.

$$
s = \frac{D_{\text{syn}}}{D}, \qquad U_D^{\text{eff}} \le U_{\text{human}} + U_{\text{syn}}
$$
*(Eq. 9.26)* where the inequality records that synthetic tokens are unique only to the extent that their content is not a rephrasing of the human pool — a quantity NOT-DISCLOSED for any production corpus and not measurable without the generator's inputs.

**Inference-aware allocation.** PAPER-REPORTED (R9.10, Eq. 3 and Eq. 6):

$$
\min_{N, D_{\text{tr}}} \; 6\,N\,D_{\text{tr}} + 2\,N\,D_{\text{inf}} \quad \text{s.t.} \quad L(N, D_{\text{tr}}) = \ell
$$
*(Eq. 9.27)* where D_inf is the lifetime inference tokens and ℓ the target loss; and, with hardware realism,

$$
\min_{N, D_{\text{tr}}} \; \frac{6\,N\,D_{\text{tr}}\,C_{\text{tr}}}{\mathrm{MFU}_{\text{tr}}} + 2\,N\,C_{\text{inf}}\Big[\frac{D_{\text{inp}}}{\mathrm{MFU}_{\text{inp}}} + \frac{D_{\text{out}}}{\mathrm{MFU}_{\text{out}}}\Big] \quad \text{s.t.} \quad L(N, D_{\text{tr}}) = \ell
$$
*(Eq. 9.28)* where C_tr, C_inf are cost per FLOP for training and inference hardware, and MFU differs between prefill-like input processing and autoregressive output (the paper's illustrative assumptions are about 50% and about 1%). The mechanism and its design consequences are developed in [§21.3](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-3-inference-aware-training.md); here the relevant consequence is that D_tr rises above 20N and therefore, for a fixed U_D, pushes the run into the data-constrained regime sooner.

**Stock and demand.** The exhaustion question is the comparison of a growing demand D_frontier(t) with a stock S:

$$
t_{\text{exhaust}} = \min\{t : D_{\text{frontier}}(t) \ge S_{\text{eff}}\}, \qquad S_{\text{eff}} = S_{\text{raw}} \cdot q \cdot m
$$
*(Eq. 9.29)* where q is the usable-quality fraction and m a multi-epoch multiplier. This is a DERIVED framing of the accounting in R9.6, whose numbers are: indexed web about 510T tokens (95%: 130T–2100T) and whole web about 3100T (95%: 1900T–5200T) as of 2024; q between 10% and 40% of deduplicated web; m capped at about 5× from repetition; an effective stock of about 300T tokens (90%: 100T–1000T); full utilisation "between 2026 and 2032" (80% interval), with enough data for a compute-optimal model at about 5·10²⁸ FLOP expected around 2028, a 5×-overtrained policy exhausting the stock around 2027 and a 100×-overtrained one around 2025 (PAPER-REPORTED, R9.6, arXiv v2 and the Epoch AI publication page). All of these are estimates with stated intervals spanning an order of magnitude; the chapter reports them as such and derives nothing from their point values.

> **Assumption.** The R9.5 constants apply to the pool at hand · *sensitivity:* if the true R*_D for a domain is smaller, repetition is worth less and the allocation of Algorithm 9.6 should shift toward parameters; if larger, toward epochs.

## Mechanism

**Repetition.** In the data-constrained regime the marginal epoch's value is U_D e^{−R_D/R*_D} fresh-token-equivalents (derivation above), so the exchange rate between compute and effective data falls geometrically with epochs. PAPER-REPORTED (R9.5): with constrained data, "allocating new compute to both more parameters and epochs is necessary, and … epochs should be scaled slightly faster" than parameters — the data-constrained analogue of P09's equal scaling. PAPER-REPORTED (R9.5): perplexity filtering was effective while deduplication "does not help" on the evaluated tasks in that setting — a corpus-specific result that [§9.2](09-2-quality-and-diversity.md) sets beside P06's opposite-direction finding on duplicate clusters. PAPER-REPORTED (R9.24): a *small fraction* repeated *many* times is a different regime from uniform repetition and is disproportionately harmful, so Eq. 9.22 — which describes uniform repetition of a whole pool — must not be applied to a mixture in which one small domain carries e_i ≫ 16 while the rest sits near 1; the per-domain form Eq. 9.25 at least makes such a domain visible. Cost of repetition: compute proportional to D at 6N per token regardless of how much of D is repeated; memory and communication unchanged; the "cost" is the forgone fresh tokens, which is what Eq. 9.22 prices.

```figure
id: fig-9.33
kind: stat-panel
title: Concentrated repetition, priced by Eq. 9.25 and as reported
caption: >-
  R9.24's pattern in this section's accounting. Repeating 0.1% of the data
  100 times makes 10% of the consumed tokens repeats. Eq. 9.25 prices that
  stream at 91.6% of a unique one, an 8% discount; R9.24 reports the 800M
  model performing like a 400M one. A mild data discount against a halving of
  effective parameters is the reason the Mechanism forbids applying the
  uniform-repetition form to a small domain with e_i far above 16.
placement: rail
anchor: mechanism
evidence: PAPER-REPORTED
source: [R9.24, "DERIVED:eq-9.25", R9.5]
alt: >-
  Instrument panel. The repeated subset is 0.1% of the data, repeated 100
  times, so repeats are 10% of consumed tokens and unique tokens 90%. Eq. 9.25
  with R*_D = 15.39 values the stream at 91.6% of D, a discount of 8.4%. R9.24
  reports that an 800M-parameter model trained this way performed like a
  400M-parameter model, a ratio of 0.5, with a double-descent-like rise
  mid-training and damage to copying and induction-head-like structures. A dot
  glyph shows 90 of 100 consumed tokens unique and 10 repeated.
spec:
  header: "CONCENTRATED REPETITION · R9.24 vs Eq. 9.25"
  variables: { f: 0.001, r: 100, Rs: 15.39 }
  rows:
    - { key: "repeated subset, share of data", formula: "f", format: percent }
    - { key: "repetitions of the subset", formula: "r", format: integer }
    - { key: "repeats, share of consumed tokens", formula: "f*r", format: percent }
    - { key: "unique share of consumed tokens", formula: "1 - f*r", format: percent }
    - { key: "Eq. 9.25 value, D′_mix ÷ D", formula: "(1 - f*r) + f*(1 + Rs*(1 - exp(-(r - 1)/Rs)))", format: percent }
    - { key: "Eq. 9.25 discount", formula: "1 - ((1 - f*r) + f*(1 + Rs*(1 - exp(-(r - 1)/Rs))))", format: percent }
    - { key: "reported: 800M model performs like", value: "400M (R9.24)" }
    - { key: "reported parameter-equivalent ratio", formula: "400/800", format: ratio }
    - { key: "reported during training", value: "double-descent-like rise" }
    - { key: "reported structural damage", value: "copying, induction-head-like" }
  glyph:
    type: dots
    total: 100
    filled: 90
    legend:
      - { marker: filled, label: "unique consumed tokens", value: "90%" }
      - { marker: hollow, label: "0.1% of data, read ×100", value: "10%" }
```

**Allocation under a stock.** Given C and U_D, the decision variables are N and D = C/6N; if D ≤ U_D the P09 rule applies and repetition is zero; if D > U_D, Eq. 9.24 with N′ and D′ is minimised over N, which — because R*_N < R*_D in the fit — favours spending the excess on epochs slightly more than on parameters. With inference demand (Eq. 9.27), the optimum moves to smaller N and larger D_tr, deepening repetition; PAPER-REPORTED (R9.10): for "a 30B-Chinchilla-quality model expecting 10¹³ inference tokens", the paper's analysis says to "train a 13.6B model on 2.84× the data" for a 28% reduction in total compute, and that at realistic costs "a Chinchilla-70B model costs 36% more than equal-quality cost-optimal models". PAPER-REPORTED (R9.9): MiniCPM's WSD-based measurements gave a compute-optimal data-to-model ratio of about 192 tokens per parameter against P09's about 20, with the authors noting "a huge gap in compute optimal regime between ours and [prior work] despite aligned trends" and a rough comparison to Llama 2 data suggesting 70–100; the chapter records the discrepancy and does not adjudicate it. PAPER-REPORTED (P07, Table 1): DCLM fixes its scales as tokens = 20 × parameters × a "Chinchilla multiplier", with a 7B-2x scale at 276B tokens — a convention the verification protocol of this chapter adopts to state its budgets.

**Saturation.** Two distinct claims travel under the word. The first — that loss stops improving with more unique tokens per parameter — is contradicted at the ranges tested: PAPER-REPORTED (R9.10): across 47 models of 150M–6B parameters at 10 to 10,000 tokens per parameter, "loss continues to decrease as we increase tokens per parameter, even to extreme ratios", with "no evidence of a 'saturation point'", and the paper adds that P09-style coefficients fitted at typical ratios "overestimate the impact of additional training data" at extreme ratios. The second — that loss stops improving with more *repeated* tokens — is the content of Eq. 9.22 and is supported by R9.5. Conflating the two produces the false conclusion that overtraining is pointless; the correct statement is that overtraining on *unique* data keeps paying at a declining rate, and overtraining on *repeated* data stops paying at around R*_D. DERIVED.

```figure
id: fig-9.34
kind: chart
title: Data term of the loss, fresh tokens against repeated ones
caption: >-
  The two meanings of "saturation" on one axis. Both curves are the reducible
  data term B/D′^β of Eq. 9.24 relative to its value after one pass, with
  β ≈ 0.35 (R9.5). With fresh tokens it keeps falling as (D/U_D)^−β, the
  unsaturated overtraining R9.10 reports up to 10,000 tokens per parameter;
  with the same pool repeated it follows (D′/U_D)^−β and stops near
  16.39^−0.35 = 0.376. At four epochs the two differ by 2.5%, at sixteen by 16%.
  The ratio needs neither B nor U_D. With R9.5's A ≈ 521, B ≈ 1488 and
  E ≈ 1.87 (PAPER-REPORTED) and an illustrative U_D = 100B, the one-pass term
  is 0.21 and the sixteen-epoch gap 0.012, in the paper's loss units.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-9.22", "DERIVED:eq-9.24", R9.5, R9.10]
alt: >-
  Log–log line chart of the data term relative to one pass against tokens
  consumed over the unique pool, from 1 to 64. Fresh data, (D/U_D)^−0.35: 0.785
  at 2, 0.616 at 4, 0.483 at 8, 0.379 at 16, 0.297 at 32 and 0.233 at 64.
  Repeated data, (D′/U_D)^−0.35 with R*_D = 15.39: 0.789 at 2, 0.631 at 4,
  0.516 at 8, 0.438 at 16, 0.394 at 32 and 0.378 at 64, flattening toward the
  dashed floor 0.376. The ratio of repeated to fresh is 1.025 at 4 epochs, 1.16
  at 16, 1.40 at 40 and 1.62 at 64. R9.5 reports A ≈ 521, B ≈ 1488 and
  E ≈ 1.87 with α = β ≈ 0.353, fitted on 54 samples; with an illustrative U_D
  of 100B tokens and β = 0.35, the one-pass data term B/U_D^β is 0.21 and the
  sixteen-epoch gap between the curves is 0.012, in the paper's loss units.
spec:
  type: line
  x: { label: "tokens consumed ÷ unique pool, D/U_D", scale: log2, format: raw, domain: [1, 64] }
  y: { label: "data term relative to one pass", scale: log2, format: raw }
  variables: { Rs: 15.39, beta: 0.35 }
  series:
    - { id: fresh, label: "all tokens unique: (D/U_D)^−β", formula: "x^(-beta)", sample: { from: 1, to: 64, count: 25 }, dashed: true }
    - { id: repeated, label: "pool repeated: (D′/U_D)^−β", formula: "(1 + Rs*(1 - exp(-(x - 1)/Rs)))^(-beta)", sample: { from: 1, to: 64, count: 25 }, emphasis: true }
    - { id: floor, label: "floor (1 + R*_D)^−β = 0.376", formula: "(1 + Rs)^(-beta)", sample: { from: 1, to: 64, count: 2 }, dashed: true }
  annotations:
    - { x: 4, label: "4 epochs: 0.631 vs 0.616" }
    - { x: 16, label: "16 epochs: 0.438 vs 0.379" }
    - { x: 64, label: "64 epochs: 0.378 vs 0.233" }
```

**Synthetic fractions.** PAPER-REPORTED (R9.29): when each generation's synthetic data *replaces* the real data, models tend toward collapse; when synthetic data *accumulates* alongside the original real data, collapse is avoided across the model sizes, architectures and hyperparameters tested, and in a linear-model analysis the test error has a finite upper bound independent of the number of iterations. PAPER-REPORTED (R9.7): OLMo 2's terminal mix contains several synthetic math sources (TuluMath, TinyGSM-MIND, MathCoder2) alongside human data, and its microanneals found that "rewriting can help dramatically"; PAPER-REPORTED (R9.30): Qwen3 raises the synthetic share in its second stage without disclosing it. The synthetic fractions of frontier pretraining corpora are NOT-DISCLOSED. Cost of a synthetic token: the generator's inference FLOPs (about 2N_gen per token plus prompt processing) and the verifier's, owned by [§11.6](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-6-synthetic-data-economics.md); its value as *unique* data is bounded by Eq. 9.26's inequality and is unmeasured.

## Algorithm

```text
Algorithm 9.6 — Data-constrained budget planner
INPUT   compute budget C; per-domain unique tokens n_i and target weights w_i (from §9.1–§9.5); epoch cap E_max;
        constants (A, B, E, α, β, R*_D, R*_N) from a stated fit (R9.5 defaults, or the reader's own §21.5 fit);
        optional inference demand D_inf; optional synthetic pools with generator ids and fractions s_i
OUTPUT  (N, D) plan; per-domain e_i; D'_mix; a regime flag; a sensitivity table over R*_D
STATE   candidate grid over N
INVARIANT Σ_i w_i = 1; e_i ≤ E_max; C ≈ 6·N·D + (2·N·D_inf if D_inf given)
1.  U_D ← Σ_i n_i;  for each candidate N on a log grid:
2.      D ← (C − 2·N·D_inf) / (6·N) if D_inf given else C / (6·N);  if D ≤ 0: skip
3.      e_i ← w_i·D / n_i for all i; if any e_i > E_max: renormalise w by Eq. 9.5 and recompute e_i; record the renormalised w
4.      regime ← "data-constrained" if any e_i > 1 else "single-pass"
5.      D'_mix ← Eq. 9.25 (per-domain, with the e_i < 1 branch); U_N ← N_opt(U_D) from the fit; R_N ← max(N/U_N − 1, 0)
6.      N' ← Eq. 9.23; L̂ ← A/N'^α + B/D'_mix^β + E                          # Eq. 9.24 with the mixture's D'
7.  select N* ← argmin L̂ over the grid; D* ← the corresponding D
8.  sensitivity: repeat steps 1–7 with R*_D ∈ {0.5, 1, 2} × the stated value; report the spread of N*
9.  flag any domain with e_i > 4 (the R9.5 "negligible loss" boundary) and any with e_i > R*_D; flag s_i > 0 domains as
    "unique-token count unverified" (Eq. 9.26)
10. write the plan, e_i, D'_mix, regime flag and sensitivity table to the exposure report header
TERMINATION: after the grid and the sensitivity pass.
```

Complexity: O(grid × k) arithmetic; no training. Implementation link: `exposure_report.csv` header block and `mixture_policy.yaml` in [verification.md](verification.md); the fit that supplies the constants is [§21.5](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-5-pilot-methodology.md)'s.

Cost line: parameters — the plan's N; tokens — D with the repetition profile e_i; FLOPs — C by construction, plus the generator FLOPs for any synthetic pool (owned by §11.6); memory, communication, latency — those of the planned run, not of the planner; energy and money — proportional to C at rates NOT-DISCLOSED here.

## Implementation

Tensors → operators: none; the planner is host-side arithmetic. Framework: none required. Named reference-stack systems with §4.1 layer: **MosaicML LLM Foundry** (Distributed training) — the planner's e_i become per-stream `repeat` values (R9.33), which is the most direct expression of a repetition plan in any loader opened; **Megatron-LM** (Distributed training) — the blend's target size (R9.36) is D, and per-dataset weights with a target size larger than the union of the datasets imply repetition, which the readme does not describe as capped (NOT-DISCLOSED); **TorchTitan** (Distributed training) — no mixture or repetition control is described on the pages opened (NOT-DISCLOSED). The Hugging Face `datablations` repository released with R9.5 holds the models and data of its 400 runs (OFFICIAL-DOCUMENTATION for its existence, R9.5's abstract; contents not opened). Kernels, memory, communication: none specific. Deployment: the plan is versioned with the policy; the sensitivity table is part of the report so that a reviewer can see how much the plan depends on an English-web constant.

> **Implementation note [impl.mosaicml-llm-foundry · Streaming docs "stable", accessed 2026-09-20].** `repeat` below 1 downsamples a stream and above 1 upsamples it; a plan with e_i < 1 for a large domain and e_i > 1 for a small one is expressed as two `repeat` values on two streams with `epoch_size` set to D in samples.

## Experimental design

### Experiment 9.6 — Repetition versus fresh data and synthetic accumulation at equal FLOPs

- **Hypothesis.** At equal compute, (a) a run that repeats a unique pool four times matches a run on four times the unique data within seed noise on in-pool validation but not necessarily on a held-out domain; (b) at sixteen repetitions the repeated run is worse by an amount predicted in direction by Eq. 9.22; (c) allocating the same compute to a larger model on the same unique pool (raising R_N) is worse than allocating it to epochs up to about 4 and better beyond about 16 (the R9.5 allocation claim); (d) a synthetic pool that *accumulates* with the real pool does not degrade a held-out domain relative to the real-only run of equal tokens, while a synthetic pool that *replaces* real data does.
- **Setup.** An open web pool from which U_D ∈ {1, 4, 16} × a base size is drawn; models around 400M–1B; C fixed per comparison; synthetic pool generated by a stated open model from prompts drawn from the pool's own domain labels, with generator id and prompts retained.
- **Independent variables.** Epochs ∈ {1, 4, 16}; allocation ∈ {epochs, parameters}; synthetic mode ∈ {none, accumulate, replace} at s ∈ {0.25, 0.5}.
- **Controlled variables.** C (equal FLOPs — so equal tokens only within a fixed-N arm), tokenizer, filter ledger, schedule, sequence length, seeds (3), evaluator.
- **Dataset / workload.** In-pool per-domain validation; one held-out domain excluded from the pool and from the generator's prompts; a rare-entity question set ([§9.2](09-2-quality-and-diversity.md)) to detect memorisation-versus-generalisation shifts.
- **Hardware.** Any; report C from 6ND (dense, fixed T).
- **Metrics.** Token-mean loss; held-out domain loss; rare-entity accuracy; n-gram overlap of generations with training text (memorisation probe); D′ from Eq. 9.22 for each arm.
- **Baselines.** Single-pass on the largest unique pool.
- **Expected result.** (a) and (b) as hypothesised; (c) a crossover between about 4 and about 16 epochs; (d) accumulation ≈ real-only within noise on the held-out domain; replacement worse, increasingly with s.
- **Ablation.** Concentrate the repetition on 1% of the pool at 100× (the R9.24 pattern) at equal total tokens: expected disproportionate degradation.
- **Interpretation.** Tests the uniform-repetition form, its allocation corollary, and the accumulate/replace distinction, all at one scale.
- **Threats to validity.** R9.5's constants were fitted with its own filtering and tokenizer; the crossover is scale-dependent; the synthetic generator may have seen the held-out domain in its own training (a leakage path the protocol must document); the rare-entity set may overlap the pool.

## Observations

**What the paper claims.** PAPER-REPORTED (P09): equal scaling of N and D at compute optimality. PAPER-REPORTED (R9.5): up to four epochs are nearly free, returns decay thereafter, epochs should scale slightly faster than parameters under constraint, code up to 50% did not hurt, perplexity filtering helped, deduplication did not in its setting. PAPER-REPORTED (R9.10): no saturation up to 10,000 tokens per parameter; inference demand favours smaller, longer-trained models. PAPER-REPORTED (R9.6): about 300T usable tokens (90%: 100T–1000T), exhaustion between 2026 and 2032 (80%). PAPER-REPORTED (R9.29): accumulation avoids collapse; replacement does not. PAPER-REPORTED (R9.9): a 192× compute-optimal ratio from WSD-based measurement, with the authors flagging the gap to prior work.

**What the evidence shows.** The repetition form rests on one group's 400 runs at ≤ 9B on English web text; its constants have not been independently re-fitted in the sources opened, and its own results (§6) note degradation at very high epochs that the form misses. The no-saturation result is from 47 runs at ≤ 6B by one group. The stock estimate is one organisation's model with intervals it states honestly. The accumulate/replace result has consistent support across several model classes in one paper. The 192× versus 20× discrepancy is unresolved in the sources.

**What we infer.** DERIVED: for any mixture, the per-domain epochs in the ledger, read against the 4 and about 16 boundaries, are the first-order diagnostic of whether a plan wastes compute on repetition; DERIVED: overtraining for inference is compatible with the data constraint only while the run stays below roughly four epochs on its weighted pools, after which the allocation problem changes from P09's to R9.5's; ASSUMED: Eq. 9.25's additive per-domain extension is a reporting convenience, not a fitted law.

**What remains unknown.** NOT-DISCLOSED: frontier synthetic fractions, repetition counts and unique-token counts. UNVERIFIED: R*_D for non-English and non-web domains; the interaction between repetition and the late-stage phase of [§9.3](09-3-curriculum-design.md) (does a repeated pool in the decay phase behave like Eq. 9.22?); the exhaustion year, whose interval is the honest answer.

## Failure modes

> **Failure mode — hidden multi-epoch on a small domain.** *Symptom:* aggregate epochs near 1, but one domain at e_i ≫ 16 and the memorisation probe fires. *Cause:* mixture weight far above n_i/D. *Detection:* per-domain e_i and r_i^max in the ledger; Algorithm 9.6 step 9. *Mitigation:* cap; Eq. 9.5.

> **Failure mode — saturation misread.** *Symptom:* a plan stops at 20 tokens per parameter "because more does not help". *Cause:* conflating unique-data overtraining with repetition saturation. *Detection:* is the marginal token unique? *Mitigation:* apply R9.10's finding to unique tokens and R9.5's to repeated ones.

> **Failure mode — constant transfer.** *Symptom:* the planner's N* changes by more than 2× across the R*_D sensitivity range. *Cause:* the plan depends on an English-web constant. *Detection:* Algorithm 9.6 step 8. *Mitigation:* fit R*_D on the pool at hand ([§21.5](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-5-pilot-methodology.md)) before committing.

> **Failure mode — synthetic replacement.** *Symptom:* held-out-domain loss rises across model generations while in-pool loss falls. *Cause:* synthetic data replaced rather than accumulated (R9.29). *Detection:* generation-over-generation held-out tracking. *Mitigation:* retain the human pool at a fixed floor weight.

> **Failure mode — inference demand ignored.** *Symptom:* a model at the P09 point whose serving cost dominates its lifetime FLOPs. *Cause:* D_inf omitted from the objective. *Detection:* Eq. 9.27 with a demand estimate. *Mitigation:* [§21.3](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-3-inference-aware-training.md).

## Siblings

**Compute-optimal single-pass allocation (P09)** — [§21.2](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-2-compute-optimal-design.md)
Why it exists: minimise loss at fixed C with unlimited unique data. What assumption changed (relative to this section): D ≤ U_D always. What objective changed: Eq. N.3 in N and D. What problem it solved: the N-versus-D split. What new failure mode it introduced: none in its regime; inapplicable beyond U_D. Changed primitive: (N, D).

**Data-constrained allocation (R9.5)** — this file, Eq. 9.21–9.24
Why it exists: D > U_D. What assumption changed: repeated tokens and excess parameters saturate. What objective changed: Eq. 9.24 in N′, D′. What problem it solved: how to spend compute once data binds. What new failure mode it introduced: dependence on fitted constants; misses high-epoch degradation. Changed primitive: (N, D) → (N′, D′).

**Inference-aware allocation (R9.10)** — [§21.3](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-3-inference-aware-training.md); this file, Eq. 9.27–9.28
Why it exists: lifetime cost includes serving. What assumption changed: D_inf is predictable. What objective changed: total FLOPs or cost at fixed quality. What problem it solved: smaller models for high demand. What new failure mode it introduced: deeper repetition under a data constraint. Changed primitive: training cost → training + inference cost.

**Quality–quantity trade** — [§9.2](09-2-quality-and-diversity.md)
Why it exists: filtering shrinks U_D. What assumption changed: strictness is a budget variable. What objective changed: Eq. 9.7. What problem it solved: filter choice under repetition. What new failure mode it introduced: none new; it is this section's mechanism applied to a threshold. Changed primitive: U_D → U_D(θ).

**Synthetic augmentation** — [§11.4](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-4-distributional-risks.md), [§11.6](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-6-synthetic-data-economics.md)
Why it exists: raise U_D. What assumption changed: model output is new data. What objective changed: none. What problem it solved: the stock. What new failure mode it introduced: collapse under replacement (R9.29); unmeasured uniqueness. Changed primitive: a fixed pool → a generated pool with s.

## Extensions

Domain adaptation is the data-constrained regime by construction (a small target pool), so Eq. 9.22 with the target's n_i is the first thing to compute before choosing a replay share ([§22.6](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-6-adaptation-economics.md)). Long-context pools are scarcer than short ones, so length buckets enter the constraint separately. Multimodal stocks — R9.6 gives rough token-equivalent estimates for video and images with the caveat that their usefulness for language is uncertain — are outside this chapter's evidence. For agents, environment interaction generates unbounded trajectories whose uniqueness is bounded by the environment's state space, a synthetic-fraction problem in disguise (proposal).

## Limitations

The section's equations are one paper's fitted family; a reader with a different pool must refit. The stock numbers are forecasts with order-of-magnitude intervals and depend on assumptions the source lists (constant per-user data production, no algorithmic breakthroughs, undefined quality metrics). Falsification of the section's operational claim: if Experiment 9.6 finds the sixteen-epoch arm within seed noise of the fresh-data arm, repetition is cheaper than Eq. 9.22 says for that pool; if the four-epoch arm is already materially worse, it is more expensive, and the "4 epochs are nearly free" heuristic does not hold there.

## Reproducibility

Constants and their source (R9.5 defaults or a local fit with its runs), C, U_D per domain, w_i, E_max, D_inf and the planner's grid; `exposure_report.csv` header. Sources opened: P09 (arXiv abs), R9.5 (arXiv abs; ar5iv HTML), R9.6 (arXiv abs; ar5iv HTML; Epoch AI publication page; arXiv HTML v2), R9.8 (arXiv HTML v3), R9.10 (arXiv abs; ar5iv HTML), R9.24 (arXiv abs), R9.29 (arXiv abs), R9.9 (arXiv abs; arXiv HTML), R9.7 (arXiv HTML), R9.30 (arXiv HTML), P07 (arXiv HTML). No run executed (UNVERIFIED).

## References

P07 · P09 · R9.5 · R9.6 · R9.7 · R9.8 · R9.9 · R9.10 · R9.24 · R9.29 · R9.30 · R9.33 · R9.36 · [notation.md](../../../front-matter/notation.md) · [references.md](references.md)
