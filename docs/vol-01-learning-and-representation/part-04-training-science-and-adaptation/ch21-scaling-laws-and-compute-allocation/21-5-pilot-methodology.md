---
id: ms.section.21.5
entity_type: section
title: Pilot methodology
short_title: Pilot methodology
volume: 1
part: 4
chapter: 21
section: '21.5'
slug: 21-5-pilot-methodology
parent: ms.chapter.21
prev_sibling: ms.section.21.4
next_sibling: ms.section.21.6
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

# 21.5 Pilot methodology

## Scope

[DERIVED] A pilot program trains smaller or shorter runs to predict a decision-relevant target, such as the loss of a larger model or the allocation minimizing cost at required quality. Its scientific value is the accuracy of independent predictions, including uncertainty, rather than the visual smoothness of a fitted curve. The design must reveal the coordinates needed for the decision and retain a target region that does not participate in fitting or model selection.

## Why this exists

[PAPER-REPORTED] Retrospective estimation finds useful trajectory information but family-dependent extrapolation errors; controlled allocation studies identify training calibration and work accounting as consequential. These results expose the failure of treating a large collection of logged points as automatic validation. Pilot spending must buy independent coordinate information and target-relevant proximity while preserving enough budget to test the forecast. [R21.1], §§2–4; [R21.17], §§3–8.

## Intuition

[MATHEMATICALLY-DERIVED] A local fit can explain a narrow observed strip with several coefficient combinations. Farther away, their predictions diverge. Correlated checkpoints add curve shape but less independent information than an equivalent number of separately trained models. The pilot therefore controls both geometry and dependence: vary the required coordinates, record trajectory grouping, and reserve a target that cannot influence fitting. Uncertainty must pass through the allocation decision as well as the regression.

## Formulation

[MATHEMATICALLY-DERIVED] For run/checkpoint $r$, write

$$
y_r=f(N_r,D_r;\phi)+\delta(z_r)+\varepsilon_r.
$$
*(Eq. 21.20)*

[DERIVED] Here $\phi$ contains the scaling coefficients, $z_r$ records recipe and measurement differences, $\delta$ represents model discrepancy and $\varepsilon$ measurement/training randomness. This is a statistical decomposition, not a claim that the discrepancy is known or independent of $N,D$. If every large run uses a different corpus or schedule, size effects and recipe effects can be confounded. More observations on that same confounded path do not identify the missing comparison.

[MATHEMATICALLY-DERIVED] For Eq. 21.3 in log-amplitude coordinates, the Jacobian columns of the raw loss include $E$, $AN^{-\alpha}$, $BD^{-\beta}$, $-AN^{-\alpha}\log N$ and $-BD^{-\beta}\log D$. When observed sizes or token counts cover little log range, columns can become nearly dependent. Then local covariance based on $(J^\top WJ)^{-1}$ is unstable or undefined. Numerical optimizer convergence does not imply statistical identification; the design matrix and profile objective must be examined separately.

## Mechanism

```figure
id: fig-21.9
kind: diagram
title: Independent validation of a pilot prediction
caption: Splitting whole run lineages protects target independence. Uncertainty resampling repeats fitting and allocation rather than treating correlated checkpoints as independent runs.
placement: wide
evidence: DERIVED
source: [R21.1, R21.17]
alt: An immutable run table splits into training groups and untouched targets. Training groups produce fitted families and resampled decisions, whose frozen predictions are then compared with targets.
spec:
  direction: TB
  nodes:
    - {id: table, kind: dataset, label: immutable run and checkpoint table}
    - {id: train, kind: dataset, label: training run lineages}
    - {id: test, kind: boundary, label: untouched target region}
    - {id: fit, kind: process, label: fit and grouped resampling}
    - {id: freeze, kind: state, label: frozen predictions and intervals}
    - {id: assess, kind: metric, label: error coverage and decision regret}
  edges:
    - {from: table, to: train}
    - {from: table, to: test}
    - {from: train, to: fit}
    - {from: fit, to: freeze}
    - {from: freeze, to: assess}
    - {from: test, to: assess}
```

### Methodology

### Select a proxy family that preserves the intervention

[DERIVED] Proxy models should vary size through a declared architecture schedule, retaining relevant tokenizer, normalization, activation, attention and data choices. Width, depth, head count and feed-forward ratio cannot all be inferred from a parameter total. A sparse-model proxy also needs routing and expert policy; a long-context proxy needs comparable scored targets and context handling. Transfer of hyperparameters belongs to Chapter 20, but its success must be measured here because poor proxy optimization biases the surface being estimated.

[DERIVED] A pilot needs multiple sizes and durations, not simply the cheapest models. Iso-compute sweeps locate allocation minima only if they bracket them; a two-dimensional size/token design supports separate effects; repeated seeds at selected points estimate training variability. These design goals compete for budget. A single large proxy reduces extrapolation distance while several smaller replicates can better expose variance. The useful balance depends on the magnitude of the decision effect and the observed noise.

### Endpoints and intermediate checkpoints carry different information

[PAPER-REPORTED] Choshen et al. collect published loss trajectories and fit more than 1000 scaling laws across model families. Their principal holdout removes the largest-size models; they compare predicted and observed losses of those targets. They find useful information in intermediate checkpoints and a trade-off between proximity to target scale and the number of models. Their study is a retrospective analysis of released measurements, not a newly randomized pilot program. [R21.17, sections 2–8]

[DERIVED] A checkpoint at $D$ tokens on a long cosine schedule is not generally the endpoint of a schedule designed to finish at $D$. It can have a different learning rate and cumulative decay. Trajectory data can still predict well empirically, as the retrospective study shows, but that finding does not establish endpoint equivalence. Options include fitting schedule position as a covariate, using matched terminal runs, or validating trajectory-derived predictions on independent terminal runs. The choice should follow the decision: predicting an unfinished existing run and choosing a new training horizon are different targets.

[DERIVED] Multiple checkpoints share run state and stochastic history. If all checkpoints from a held-out run remain in training through another identifier, validation leaks information. If a run contributes hundreds of densely spaced checkpoints while another contributes three, ordinary unweighted fitting implicitly gives the first much more weight. Group weights or a declared covariance model can address this; simply counting checkpoint rows as sample size cannot.

### Fit objectives encode noise assumptions

[MATHEMATICALLY-DERIVED] Raw squared residuals minimize $\sum_r(y_r-f_r)^2$ and emphasize absolute loss error. Log squared residuals minimize $\sum_r(\log y_r-\log f_r)^2$ and approximate relative error for small residuals. A Huber loss $h_\tau(v)$ is quadratic near zero and linear in the tails:

$$
h_\tau(v)=\begin{cases}\tfrac12v^2,&|v|\le\tau,\\
\tau(|v|-\tfrac12\tau),&|v|>\tau.
\end{cases}
$$
*(Eq. 21.21)*

[DERIVED] Robust fitting reduces an extreme point's influence; it does not reveal whether that point is a software failure, a different recipe or real model discrepancy. Weights and robust thresholds must be fixed or selected using training data only. Choosing them after observing target errors converts the target into a tuning set. Different residual scales should be compared on the final decision metric and independent predictions, not judged solely by their own incomparable objective values.

[PAPER-REPORTED] Hoffmann's third estimator uses Huber loss on log loss. Choshen et al.'s main analysis uses squared raw loss and reports robustness analysis with Huber loss. Besiroglu et al. show that nonlinear solver stopping and coefficient precision can affect the reconstructed Chinchilla fit. These sources motivate recording the complete fit procedure rather than assuming the formula uniquely determines an estimate. [P09, Appendix D.2; R21.17, section 3/Appendix E; R21.2]

### Uncertainty must follow the whole decision pipeline

[DERIVED] Three uncertainties differ: coefficient uncertainty conditional on the fit family; predictive variation of a new run; and discrepancy between the family and the true response outside the observed region. A confidence band for the mean fitted curve is narrower than a prediction interval for an independently trained model. Neither automatically includes tokenizer changes, architecture changes or an unsupported extrapolation into repeated-data saturation.

[DERIVED] A grouped bootstrap resamples independent run lineages or higher-level families, retains within-run checkpoint structure, repeats fitting, and recomputes the decision. If seed replicates are scarce, the resulting interval has a limited empirical basis; resampling many checkpoints cannot invent seed variability. A parametric bootstrap needs an explicit noise/covariance model. Report fit failures rather than silently dropping all difficult resamples, since that conditions uncertainty on numerical success.

[PAPER-REPORTED] Porian et al. reconstruct iso-compute optima with noise-aware interpolation and resampling before estimating the allocation exponent. Their procedure addresses uncertainty in the minimization stage as well as the final power-law regression. [R21.1, section 3/Appendix B]

[MATHEMATICALLY-DERIVED] Holding the fitted allocation at reference budget $C_0$ fixed isolates exponent sensitivity. Two allocation curves $N_1=N_0(C/C_0)^a$ and $N_2=N_0(C/C_0)^{a+\delta a}$ have

$$
\frac{N_2(C)}{N_1(C)}=(C/C_0)^{\delta a},\qquad
\log\frac{N_2(C)}{N_1(C)}=\delta a\log(C/C_0).
$$
*(Eq. 21.30)*

[DERIVED] This comparison holds the reference allocation constant; it does not represent a joint coefficient confidence interval. Amplitude uncertainty and covariance must be restored in the full fit draws. The calculation isolates why a small exponent perturbation matters more farther from measured budgets.

```figure
id: fig-21.10
kind: calculator
title: Allocation sensitivity beyond the reference budget
caption: >-
  Equation 21.30 compares two analytical allocation curves sharing the same
  reference point. It isolates exponent perturbation and excludes amplitude
  covariance, model discrepancy and training variability.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-21.30
alt: >-
  At sixteen times the reference compute, increasing the allocation exponent
  by 0.05 changes predicted optimum size by a factor of about 1.149.
spec:
  tex: N_2/N_1=k^{\delta a}
  equation: "21.30"
  inputs:
    - {symbol: factor, label: target over reference compute, default: 16, min: 1, max: 10000}
    - {symbol: delta, label: allocation-exponent perturbation, default: 0.05, min: -0.5, max: 0.5}
  outputs:
    - {symbol: ratio, label: predicted size ratio, formula: factor^delta, emphasis: true}
    - {symbol: shift, label: log size shift, formula: delta*ln(factor)}
```

## Algorithm

**Algorithm 21.5 — Bounded fitting and frozen validation.** [DERIVED] Input: whole-lineage split $(\mathcal T,\mathcal V)$, finite families $\mathcal F$, starting points $\mathcal Z_f$, compact admissible parameter sets $\Theta_f$, finite step-size set $\mathcal H_f$ including zero, iteration cap $J$, tolerance $\epsilon$, and grouped resamples. Output: full fit state, forecasts and independent errors. This book-defined optimizer specifies an auditable fallback procedure; it is not represented as the original papers' L-BFGS implementation.

$$
\begin{aligned}
1.\quad &Q_f(\phi;\mathcal T)\gets\sum_{r\in\mathcal T}
 w_r\rho_f\bigl(\psi_f(y_r)-\psi_f(f(x_r;\phi))\bigr).\\
2.\quad &\phi_{0,z}\gets z\in\Theta_f,\qquad z\in\mathcal Z_f.\\
3.\quad &g_{j,z}\gets\nabla_\phi Q_f(\phi_{j,z};\mathcal T),\qquad j<J.\\
4.\quad &\eta_{j,z}\gets\operatorname*{arg\,min}_{\eta\in\mathcal H_f}
 Q_f\bigl(\Pi_{\Theta_f}(\phi_{j,z}-\eta g_{j,z});\mathcal T\bigr).\\
5.\quad &\phi_{j+1,z}\gets\Pi_{\Theta_f}(\phi_{j,z}-\eta_{j,z}g_{j,z}).\\
6.\quad &|Q_f(\phi_{j+1,z})-Q_f(\phi_{j,z})|\le\epsilon
 \ \Longrightarrow\ j_z\gets j+1\ \text{and terminate this start}.\\
7.\quad &\widehat\phi_f\gets\operatorname*{arg\,min}_{\phi\in\{\phi_{j_z,z}:z\in\mathcal Z_f^{\mathrm{finite}}\}}
 Q_f(\phi;\mathcal T).\\
8.\quad &\mathcal P\gets\operatorname{freeze}\bigl(
 \{f(x_v;\widehat\phi_f)\}_{f,v},\mathrm{resampled\ forecasts},\mathrm{fit\ diagnostics}\bigr).\\
9.\quad &\operatorname{return}\bigl(\mathcal P,\{y_v-\widehat y_{f,v}\}_{f,v\in\operatorname{reveal}(\mathcal V)}\bigr).
\end{aligned}
$$
*(Eq. 21.28)*

[DERIVED] $\psi_f$ is identity or log, $\rho_f$ is the declared squared/Huber residual penalty, and positive group weights $w_r$ fix checkpoint influence. Log objectives reject nonpositive observations. Projection enforces declared coefficient/exponent bounds. An invalid initial objective or nonfinite gradient terminates that start before projection; its failure remains in the audit and it is excluded from $\mathcal Z_f^{\mathrm{finite}}$. Nonfinite trial objectives are inadmissible step candidates. If every start fails, that family produces no forecast. Equal finite objectives use the predefined step/start ordering. At cap $J$, the final finite iterate is retained with its cap-reached status. Zero step permits a nonincreasing objective, but a zero selected step can indicate stagnation rather than stationarity; the gradient and profile diagnostics remain mandatory. No global-optimality guarantee follows from termination.

[DERIVED] Repeat lines 1–7 on each declared whole-lineage resample, preserving its preprocessing and fit failures, before line 8. A fitting-family comparison uses inner training validation or remains a reported family sensitivity; it never selects a winner from revealed target outcomes. The invariant is that $\mathcal V$ cannot alter starts, bounds, weights, transformations or coefficients. For $F$ families, $B$ resamples, $Z$ starts, $H$ candidate steps and $R$ observations, the bounded work is $O(F(B+1)ZJHR)$ at fixed parameter dimension. Observation storage is $O(R)$; coefficient draws and target forecasts add their explicit $O(FB)$ and $O(FB|\mathcal V|)$ terms.

## Implementation

[DERIVED] The fit is a numerical-analysis artifact with no required Model / autograd framework. The training observations come from the declared source/runtime layer, but this manuscript has not executed those programs or inspected a pinned fitting implementation. A bounded optimizer is fully specified mathematically above; substituting a package solver requires preserving its bounds, initialization, tolerance, failures and exact numerical revision in the artifact.

[DERIVED] The research artifact needs machine-readable observations, source/run IDs, model configuration, training presentations, unique-data estimates, cost formulas, evaluation identity and split membership. Fit output should include the full-precision coefficient vector, units, objective, bounds, initializations, convergence diagnostics, resampling seeds, predictions and plot data. A rounded prose table is insufficient for reproducing a sensitive optimum. Missing data should retain explicit missingness rather than receive customary values.

[DERIVED] Computational complexity is usually linear in the observation count per objective evaluation, with constant-dimensional parameters. A fixed iteration budget bounds numerical work, but a converged flag is not proof of a global optimum. Profile objectives and held-out error can reveal alternative fits with similar residuals but divergent target predictions. This sensitivity is particularly relevant to the fitted floor and to regimes where one power-law term dominates all observations.

[DERIVED] Training time dominates most pilot programs. Record pilot, tuning, failed-run and final-run work separately, then combine them according to the program's cost question. Data curation and evaluation can also consume material compute and human labor. A “compute saving” that counts only the selected run but omits the search program has a different boundary from total research-program efficiency. Hardware topology, precision and achieved throughput are needed for wall-time claims; FLOPs alone are insufficient.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The Hitchhiker study's archive includes 485 unique pretrained models from over 40 scaled families and roughly 1.9M evaluated training steps. Its main prediction error is mean absolute relative loss error on withheld largest-size models/checkpoints. Borrowing some coefficients across families can work in selected cases, but the paper also reports large errors when extrapolating to OPT-175B. Intermediate-checkpoint usefulness is an empirical archive finding with family-dependent accuracy. [R21.17, sections 3–6]

[PAPER-REPORTED] DataComp-LM provides a complementary controlled benchmark: hold the training procedure and evaluation protocol fixed while changing curation, then test across prescribed scales. Its design separates some data interventions from architecture tuning; it does not guarantee every proxy ranking remains invariant at any future scale. [P07, sections 2–4]

## Observations

### Observation 21.5 - Many observations can share little independent information

**What the paper claims.** [PAPER-REPORTED] Intermediate trajectories and multiple proxy models can make scaling estimation more useful; controlled studies also use resampling to quantify allocation sensitivity. [R21.17; R21.1]

**What the evidence shows.** [PAPER-REPORTED] Accuracy varies across families and extrapolation distances, and numerical or procedural choices can change fitted optima. Archived checkpoints and digitized measurements are not independent retraining. [R21.17; R21.2]

**What we infer.** [DERIVED] The number of independent runs and the range of controlled coordinates matter more than the raw count of logged checkpoint rows. Validation must preserve that dependence structure.

**What remains unknown.** [UNVERIFIED] This draft contains no executed pilot fit, no measured interval coverage and no demonstrated generalization to an unpublished target family.

## Failure modes

[DERIVED] Randomly splitting checkpoint rows leaks trajectory information. Refitting after inspecting target errors destroys the claimed independent test. Reporting only successful fits hides estimator instability. Pooling published models without data/recipe controls makes observational differences look causal. Comparing losses across tokenizers or validation corpora changes the response itself. Extending a law beyond unique-data availability introduces repetition not present in its fit. A narrow uncertainty ribbon can accompany every one of these failures.

[MATHEMATICALLY-DERIVED] Extrapolation distance is a vector, not a single “scale-up” factor. A target can lie near observed $N$ but far beyond observed $D/N$, context length or language share. Report $N_{\mathrm{target}}/N_{\max}$, $D_{\mathrm{target}}/D_{\max}$ and relevant additional coordinates, with the geometry of the training support. A target within separate marginal ranges can still lie outside their jointly observed region.

## Siblings

[DERIVED] Random row holdouts test interpolation among dependent checkpoints; whole-run holdouts test a new trajectory; largest-size holdouts test scale extrapolation; new-family holdouts additionally test recipe transfer. Their reported errors answer different questions. A coefficient confidence interval describes a fitted parameter population; a mean-response band describes its fitted mean; a new-run prediction interval additionally includes training variability under the adopted model. None supplies an unmodeled domain-shift guarantee.

## Extensions

### Improvements

[DERIVED] The methodological progression is from fitting attractive curves to designing identifiable pilots, using trajectory data with dependence acknowledged, testing coefficient transfer explicitly, recording numerical convergence, and evaluating untouched target regions. Fit-family sensitivity and prediction intervals make the decision's uncertainty reviewable. They do not prove robustness to a new training distribution.

[DERIVED] A successful pilot is one whose predictions resolve the intended decision at acceptable error and cost. When uncertainty exceeds the loss difference between candidate allocations, reporting both as plausible is more informative than declaring a numerically precise winner. The proposed artifact and tests in [verification](verification.md) implement this standard without claiming they have already been run.

## Limitations

[MATHEMATICALLY-DERIVED] Bootstrap draws cannot identify variability missing from the observed sampling units. A few seeds limit the evidence for a new-run interval; a few model sizes limit the evidence for extrapolation. A fitted family can be identifiable yet wrong outside its support. Reusing a revealed target for refitting can improve the next version, but that target no longer independently validates it. The proposed protocol records this distinction instead of preserving an invalid holdout label.

## Reproducibility

[DERIVED] Archive the immutable run/checkpoint table, split manifest, every preprocessing decision, fit objective and constraints, all starts and stopping states, resampling population, frozen forecasts and failed target predictions. Retain nominal and audited compute, hardware-time boundaries and support-distance coordinates. No fit, bootstrap coverage estimate or archive reconstruction has been executed for this chapter; the verification artifact remains an unexecuted specification.

## References

[P07](references.md#p07), controlled scales; [P09](references.md#p09), Appendix D.2; [R21.1](references.md#r21-1), uncertainty procedure; [R21.2](references.md#r21-2), numerical sensitivity; [R21.17](references.md#r21-17), §§3–8 and Appendix E; [verification](verification.md).
