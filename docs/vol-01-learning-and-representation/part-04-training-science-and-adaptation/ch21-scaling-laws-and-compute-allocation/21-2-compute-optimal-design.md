---
id: ms.section.21.2
entity_type: section
title: Compute-optimal design
short_title: Compute-optimal design
volume: 1
part: 4
chapter: 21
section: '21.2'
slug: 21-2-compute-optimal-design
parent: ms.chapter.21
prev_sibling: ms.section.21.1
next_sibling: ms.section.21.3
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

# 21.2 Compute-optimal design

[DERIVED] Compute-optimal design chooses a model and training duration to minimize a specified held-out loss at a specified training budget. It does not mean maximizing model size, fully converging every candidate, or using a universal number of tokens per parameter. The solution changes when the loss surface, feasible architecture family, optimizer recipe or work accounting changes. A serving-cost objective introduces another change, developed in section 21.3.

## Formulation

[MATHEMATICALLY-DERIVED] Assume the additive law $L=E+A N^{-\alpha}+B D^{-\beta}$ and dense work $C=\kappa ND$, with positive coefficients and continuous feasible $N,D$. Substituting $D=C/(\kappa N)$ gives

$$
L_C(N)=E+A N^{-\alpha}+B(\kappa/C)^\beta N^\beta.
$$
*(Eq. 21.5)*

[MATHEMATICALLY-DERIVED] Differentiating with respect to $\log N$ makes the trade-off explicit. The optimum satisfies $\alpha A N^{-\alpha}=\beta B D^{-\beta}$, equating the weighted marginal benefits of model size and data. Hence

$$
N_*=G(C/\kappa)^a,\qquad D_*=G^{-1}(C/\kappa)^b,
\quad a=\frac{\beta}{\alpha+\beta},\quad b=\frac{\alpha}{\alpha+\beta},\quad
G=\left(\frac{\alpha A}{\beta B}\right)^{1/(\alpha+\beta)}.
$$
*(Eq. 21.6)*

[MATHEMATICALLY-DERIVED] The second derivative in log size is positive, $\alpha^2A N^{-\alpha}+\beta^2B(\kappa/C)^\beta N^\beta$, so this is the unique continuous minimum under the assumptions. The optimum uses the full budget because both loss terms decrease with their coordinates. Discrete layer counts, memory limits, available data and admissible width/depth ratios can move the feasible optimum to a boundary.

[MATHEMATICALLY-DERIVED] The optimal ratio is

$$
\frac{D_*}{N_*}=G^{-2}(C/\kappa)^{(\alpha-\beta)/(\alpha+\beta)}.
$$
*(Eq. 21.7)*

[DERIVED] A constant ratio requires equal exponents in this family; its numerical value also depends on amplitudes, count conventions and units. Approximately equal allocation exponents do not imply a known universal ratio. Rounded coefficients can change $G$ substantially because they appear inside a fractional power. A ratio inferred from one estimator should not be silently substituted for the result of another estimator.

## Methodology

### The three original Chinchilla estimators

[PAPER-REPORTED] The original paper uses smoothed training loss as a proxy for test loss, calling it unbiased under its less-than-one-epoch, effectively infinite-data setting. That is the source's stated assumption, not an independently established absence of overlap or an actual held-out score for every fit observation. This chapter's target quantity remains held-out loss; a reconstructed source dataset must mark its proxy observations explicitly. [P09, Introduction footnote 2]

[PAPER-REPORTED] Hoffmann et al. first train each of several fixed model sizes with four schedule horizons spanning a sixteen-fold range. They smooth and interpolate loss trajectories and estimate a compute-efficient envelope over logarithmically spaced FLOP targets, using late portions of the runs. Their second approach trains terminal, horizon-matched runs at nine fixed compute budgets, constructs iso-FLOP curves, and estimates each minimum with a parabola. These are separate measurement constructions. [P09, sections 3.1–3.2/Appendices C–D]

[PAPER-REPORTED] The third approach fits Eq.21.3 to terminal losses. In log coordinates, its prediction uses log-sum-exp; the fit minimizes a Huber penalty on log-loss residuals with threshold $10^{-3}$, uses L-BFGS and several initializations, and derives allocation analytically from the fitted surface. Outlier treatment and convergence therefore affect this estimator even when the raw run collection is unchanged. [P09, section 3.3/Appendix D.2]

[DERIVED] The first construction can exploit multiple observations along training trajectories, but those observations share initialization, data order and schedule. The second measures actual endpoints selected for the budget, at the expense of separate runs. The third uses a parametric surface and extrapolates through its assumptions. Agreement between them is useful robustness evidence because their failure modes differ; it is not three independent repetitions when they share training observations.

### Allocation uncertainty differs from loss uncertainty

[MATHEMATICALLY-DERIVED] Let $t=N/N_*$ and define $X=A N_*^{-\alpha}$, $Y=B D_*^{-\beta}$, so $\alpha X=\beta Y$. At fixed compute,

$$
L_C(tN_*)-E=Xt^{-\alpha}+Yt^\beta.
$$
*(Eq. 21.8)*

[MATHEMATICALLY-DERIVED] Near $t=1$, the first-order term vanishes. With $z=\log t$, the excess above the optimum is approximately $\tfrac12(\alpha^2X+\beta^2Y)z^2$. A shallow basin permits a wide range of parameter counts with nearly identical loss. Consequently, a fit can predict loss accurately while locating the minimizing model size imprecisely. Reported uncertainty should include both predicted loss and allocation, with feasible discrete alternatives rather than a misleadingly precise scalar optimum.

### Controlled reconstruction of the Kaplan–Chinchilla disagreement

[PAPER-REPORTED] Porian et al. perform over 900 runs, including independent tuning and explicit output-head accounting. They examine head cost, warmup, decay and scale-dependent hyperparameters through staged ablations. Their model definition excludes input embeddings while retaining an untied output head, which matters especially for smaller models. Their bootstrap reconstructs noisy iso-compute minima before fitting allocation exponents rather than attaching an error bar only to the final regression. [R21.1, sections 3–4/Appendices B–C]

[DERIVED] The mechanism is identifiable. If the true per-token work is approximately $6(N_{\mathrm{body}}+N_{\mathrm{head}})$ but the budget uses $6N_{\mathrm{body}}$, smaller models can receive systematically more real compute than their nominal budget implies. A warmup fixed in updates or tokens occupies a different fraction of short and long runs. A batch size or second-moment timescale tuned at one scale can leave other scales underoptimized. Each effect can alter iso-compute shape without changing the underlying architecture's representational capacity.

## Algorithm

```text
Algorithm 21.2 — Estimate and validate a compute-constrained allocation
INPUT: comparable terminal losses; cost model; fit family; feasible configurations
OUTPUT: allocation frontier with uncertainty and held-out prediction errors
STATE: training-only fit set; untouched validation set; initialization and resampling records
INVARIANT: each iso-compute comparison uses the same declared work boundary
1. Reserve whole run lineages and target-scale points for independent validation.
2. Reconstruct actual cost including size-dependent terms omitted by any shortcut.
3. Fit the loss surface using declared residual scale, bounds and multiple starts.
4. Solve the constrained continuous optimum and evaluate feasible discrete neighbors.
5. Independently estimate bracketed minima from measured iso-compute sweeps.
6. Resample independent run groups and repeat fitting and minimization together.
7. Predict held-out losses before exposing their observations to model selection.
8. Compare fit families, minima and uncertainty; record failed fits and boundary optima.
TERMINATION: declared fit and resampling budgets finish or a documented failure is returned
COMPLEXITY: O(B J R) fit work for B resamples, J iterations and R observations
```

## Implementation

[DERIVED] The analytical solution is $O(1)$ after fitting. Real configuration selection may require a linear scan over $K$ feasible architectures, each with a computed token horizon, memory estimate and expected throughput. This $O(K)$ scan avoids pretending that a fractional layer or a model exceeding memory is deployable. If interpolating measured iso-compute curves, the minimum must be bracketed by observations on both sides; an edge minimum is evidence that the sweep does not locate the optimum.

[DERIVED] Training FLOPs, achieved FLOP/s, memory, communication and wall time must remain separate columns. A larger model can reduce available batch size or require more tensor-parallel communication; two equal-FLOP recipes need not finish together. Energy requires measured power and elapsed time or an explicitly documented energy model. Currency requires actual hardware prices and utilization assumptions. None follows from Eq.21.6 alone.

## Reported experiments

[PAPER-REPORTED] The original study's first two estimators find approximately balanced growth of parameters and training tokens with compute. Its full-scale comparison trains Chinchilla at 70B parameters on 1.4T tokens, versus Gopher at 280B parameters on roughly 300B tokens, at a comparable training-compute scale. That comparison supports the proposed allocation in the tested setting, while other recipe differences prevent attributing every downstream gain solely to the parameter/token split. [P09, sections 3–4]

[PAPER-REPORTED] In Porian et al.'s RefinedWeb ablation sequence, the estimated model-size exponent moves from 0.835 in the initial reconstruction to 0.706 with head accounting, 0.602 with warmup correction, and approximately 0.497 with tuned hyperparameters in the no-decay setting. Decay improves achieved losses but is not necessary for an approximately one-half allocation exponent in their controlled experiment. Their appendix also discloses unintended data repetition in some auxiliary tuning and OpenWebText2 runs; main RefinedWeb runs were checked separately. [R21.1, Table 1/Appendix C]

[PAPER-REPORTED] Besiroglu et al. digitize a figure from the Chinchilla paper and refit the third estimator. They recover a token/parameter ratio closer to the first two estimators than the published third-estimator coefficients imply. Their evidence concerns partial recovered observations, numerical optimization and coefficient precision, rather than an independent retraining of Chinchilla. [R21.2, sections 2–4]

## Observations

### Observation 21.2 - An allocation exponent belongs to an estimation procedure

**What the paper claims.** [PAPER-REPORTED] The Chinchilla study recommends increasing data as model size increases under compute scaling; controlled later work reconciles much of the historical allocation disagreement. [P09; R21.1]

**What the evidence shows.** [PAPER-REPORTED] Head cost, warmup and hyperparameter tuning materially change estimated optima. Refitting recovered observations also exposes sensitivity within the original third estimator. [R21.1; R21.2]

**What we infer.** [DERIVED] Reproducing an allocation requires the operation count, training calibration, estimator and convergence diagnostics. Copying only the exponent omits the conditions that produced it.

**What remains unknown.** [UNVERIFIED] These studies do not establish that every later architecture, corpus, context length or optimizer has the same optimum or a constant twenty-token ratio.

## Failure modes

[DERIVED] A single low-loss observation can dominate a noisy lower envelope; smoothing can move an apparent minimum; a parabola fitted over a broad asymmetric basin can produce an unsupported vertex; and a nonlinear surface fit can converge to a local solution. Reporting optimizer success without inspecting parameter sensitivity, residuals and held-out errors does not address these failures. A numerically converged fit can still represent the wrong family.

[MATHEMATICALLY-DERIVED] Exponent uncertainty compounds with budget distance. Taking logs in Eq.21.6 gives $\log N_* =\log G+a\log(C/\kappa)$. A perturbation $\delta a$ produces $\delta\log N_*\approx\delta\log G+\delta a\log(C/\kappa)$ when expressed in the same units. Centering the budget around an observed reference $C_0$ makes the extrapolation term $\delta a\log(C/C_0)$ explicit. Reporting the largest fitted and target budgets is therefore essential to interpreting an uncertainty band.

## Improvements and limits

[DERIVED] The improvement lineage proceeds from empirical envelopes to independently bracketed iso-compute minima and joint surfaces, then to corrected work accounting, recipe calibration and resampling of the complete estimation pipeline. Each step addresses an identifiable ambiguity. An exponent near one-half is a finding under those controls rather than a replacement for them.

[DERIVED] Training-only allocation is appropriate when training work is the objective and deployment constraints are separately feasible. It can be economically suboptimal when a model will serve enough tokens that recurring inference dominates its one-time training cost. Section 21.3 retains the same loss surface while changing the decision objective; section 21.5 explains how to collect evidence for a new recipe without treating existing coefficients as ground truth.

```figure
id: fig-21.2
kind: diagram
title: Three routes from measurements to an allocation
caption: Trajectory envelopes, terminal iso-compute minima and parametric loss surfaces estimate related quantities through different statistical procedures. Correct work accounting and independent validation constrain all three.
placement: wide
evidence: DERIVED
source: [P09, R21.1, R21.2]
alt: Common measured losses feed a trajectory envelope, iso-compute endpoint sweeps and a joint surface fit. Each produces an allocation checked against held-out runs.
spec:
  direction: LR
  nodes:
    - {id: runs, kind: dataset, label: cost-audited run records}
    - {id: envelope, kind: process, label: trajectory envelope}
    - {id: iso, kind: process, label: terminal iso-compute minima}
    - {id: fit, kind: process, label: parametric surface fit}
    - {id: opt, kind: objective, label: allocation and uncertainty}
    - {id: test, kind: metric, label: independent target-scale test}
  edges:
    - {from: runs, to: envelope}
    - {from: runs, to: iso}
    - {from: runs, to: fit}
    - {from: envelope, to: opt}
    - {from: iso, to: opt}
    - {from: fit, to: opt}
    - {from: opt, to: test}
```
