---
id: ms.section.21.1
entity_type: section
title: Empirical scaling
short_title: Empirical scaling
volume: 1
part: 4
chapter: 21
section: '21.1'
slug: 21-1-empirical-scaling
parent: ms.chapter.21
prev_sibling: null
next_sibling: ms.section.21.2
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

# 21.1 Empirical scaling

## Scope

[DERIVED] Empirical scaling begins with a measurement contract: which held-out tokens are scored, which conditional contexts are available, which model components are counted, and which training procedure produces the checkpoint. Loss plotted against a single size variable suppresses all the other coordinates. A smooth curve is consequently evidence about a controlled family or an observed collection of recipes, with different interpretations in those two cases.

## Why this exists

[DERIVED] Training a larger model is an expensive intervention; its observed endpoint does not identify how a different parameter/data allocation would have behaved. Scaling estimation addresses that missing counterfactual using controlled variation and a conditional response family. Its success criterion is independent predictive error at the intended coordinates. An attractive fitted line, a small residual on the fitted points, and a universal asymptotic claim are different evidential objects.

## Intuition

[MATHEMATICALLY-DERIVED] A response surface separates two decreasing terms only when the design exposes their distinct variation. If larger models always receive proportionally more data, the observations can reveal a useful trend while leaving the two contributions weakly identified. An offset also competes with those terms over a narrow range. The mechanism behind the estimation problem is therefore coordinate geometry and parameter sensitivity, rather than a presumed physical conservation law for intelligence.

## Formulation

[MATHEMATICALLY-DERIVED] For evaluation sequences sampled from $q$, the population autoregressive loss is

$$
L(\theta;q)=\mathbb E_q[-\log p_\theta(x_t\mid x_{<t})]
=H_q(X_t\mid X_{<t})+\mathbb E_{q(x_{<t})}\operatorname{KL}(q(\cdot\mid x_{<t})\Vert p_\theta(\cdot\mid x_{<t})).
$$
*(Eq. 21.1)*

[MATHEMATICALLY-DERIVED] This identity assumes the model assigns positive probability wherever the target distribution does; otherwise the loss can be infinite. The conditional entropy depends on tokenization, the context boundary and $q$. Evaluation with a shorter context changes the target conditional distribution. Mean empirical loss estimates Eq. 21.1 only under the declared sampling/weighting procedure. Multiple tokens from one document are correlated; counting all of them as independent observations understates uncertainty.

[PAPER-REPORTED] Kaplan et al. study decoder Transformers with a non-embedding parameter count and separate parameter-limited, data-limited and compute-efficient regimes. In their early-stopped finite-dataset law, the data coordinate is the available dataset size rather than cumulative token presentations. Translating that coordinate to this chapter's $U$, their form is

$$
L(N,U)=\left[\left(\frac{N_c}{N}\right)^{\alpha_N/\alpha_D}+\frac{U_c}{U}\right]^{\alpha_D}.
$$
*(Eq. 21.2)*

[PAPER-REPORTED] Hoffmann et al.'s third estimator instead uses

$$
L(N,D)=E+A N^{-\alpha}+B D^{-\beta},\qquad A,B,\alpha,\beta>0.
$$
*(Eq. 21.3)*

[DERIVED] These are different families and data coordinates. Eq. 21.2 describes early-stopped loss as a function of model and finite available dataset, with nonlinear coupling and no explicit additive floor; Eq. 21.3 uses processed training tokens and an estimated offset. Kaplan's compute allocation additionally uses its separate finite-training-time analysis. Exponents and data counts cannot be inserted from one family into the other. A model can fit current observations well while producing a substantially different far-field asymptote. [P08, sections 1–4; P09, section 3/Appendix D]

### What an irreducible term means

[MATHEMATICALLY-DERIVED] For Eq. 21.3, $\lim_{N,D\to\infty}L=E$ inside the assumed family. Eq. 21.1 gives an entropy lower bound for a specified evaluation distribution, but does not establish that an empirical five-parameter fit recovers it. A restricted architecture, unresolved optimization error, duplicated training/evaluation material or unmodeled data heterogeneity can be absorbed into $E$. Estimation far from the floor often permits a wide range of offsets with compensating exponents.

[MATHEMATICALLY-DERIVED] Even the one-axis function $L(N)=E+A N^{-\alpha}$ illustrates this issue:

$$
\frac{d\log(L-E)}{d\log N}=-\alpha,\qquad
\frac{d\log L}{d\log N}=-\alpha\frac{L-E}{L}.
$$
*(Eq. 21.4)*

[DERIVED] The slope of log total loss flattens as the floor becomes important; it is not the excess-loss exponent. Subtracting a fitted floor before drawing a straight line also transfers floor uncertainty into every transformed point. If a candidate floor exceeds an observed loss, the log excess is undefined. This boundary must be handled in the fitting parameterization rather than suppressed by dropping inconvenient points.

## Mechanism

```figure
id: fig-21.1
kind: diagram
title: A loss surface and its measurement contract
caption: A conditional loss surface depends on both varied coordinates and fixed recipe or evaluation choices. A compute frontier is derived by imposing a resource constraint.
placement: wide
evidence: DERIVED
source: [P08, P09]
alt: Parameter count and training-token presentations enter a loss surface alongside a fixed tokenizer, corpus, recipe and metric. A compute constraint turns the surface into a frontier.
spec:
  direction: TB
  nodes:
    - {id: n, kind: state, label: declared parameter count N}
    - {id: d, kind: dataset, label: token presentations D}
    - {id: r, kind: boundary, label: recipe and evaluation contract}
    - {id: l, kind: objective, label: conditional loss surface}
    - {id: c, kind: hardware, label: explicit compute constraint}
    - {id: f, kind: metric, label: derived optimum frontier}
  edges:
    - {from: n, to: l}
    - {from: d, to: l}
    - {from: r, to: l}
    - {from: l, to: f}
    - {from: c, to: f}
```

### Methodology

### Define coordinates before estimating a law

[PAPER-REPORTED] Kaplan's experiments used WebText2, sequence length 1024 and a fixed BPE vocabulary, with separately varied model size, dataset size and compute. The non-embedding approximation assumes conditions under which omitted vocabulary and attention terms are relatively small. Chinchilla tests substantially different model/data allocations rather than extending a single fixed-size training run. These design differences are part of the measurements. [P08, section 2/Appendix B; P09, section 3]

[DERIVED] Parameter records must distinguish trainable scalars, non-embedding scalars, output-head scalars, tied weights, total sparse parameters and activated parameters. A tied matrix contributes once to stored parameters while its output projection still performs work. Training presentations $D$ must distinguish unique material, repetitions, packed tokens, padding, masked targets and tokens consumed by unsuccessful steps. A curve against bytes or words can aid cross-tokenizer comparison only after a corresponding likelihood normalization is defined; relabeling a token-axis plot does not make losses comparable.

[MATHEMATICALLY-DERIVED] In a simplified dense network, a forward matrix multiplication uses approximately two FLOPs per multiply-accumulate per weight/token, and its two backward products add approximately four. This motivates $C\approx6ND$. It does not count an output head omitted from $N$, quadratic attention work, activation recomputation, router operations or extra objective passes. An omitted constant fraction mostly rescales the budget axis; a fraction that changes with model size can also change an estimated allocation exponent. [P08; R21.1]

### Fit a surface, then derive a frontier

[MATHEMATICALLY-DERIVED] If $N$ and $D$ vary independently, Eq. 21.3 can in principle separate their contributions. On a single path $D=kN^r$, it becomes $E+A N^{-\alpha}+B k^{-\beta}N^{-r\beta}$. A narrow observed range can make those two decreasing terms nearly indistinguishable. On a single iso-compute path $D=C/(\kappa N)$, model and data effects move in opposite directions. Multiple budgets and multiple sizes per budget are therefore different information from many checkpoints on one trajectory.

[DERIVED] The compute frontier is the envelope $L_*(C)=\min_{N,D:C(N,D)\le C}L(N,D)$. It is a derived object, not another name for the original two-dimensional surface. Its construction requires feasible model configurations and an explicit cost model. Observed best runs form a noisy lower envelope and benefit from selection over many trials; treating that minimum as an unbiased sample of the optimum introduces selection effects. Section 21.2 derives the analytical frontier and reconstructs the original empirical estimators.

```figure
id: fig-21.2
kind: calculator
title: Fitted floor and the observed log slope
caption: >-
  This analytical configuration evaluates Equation 21.4, not a fitted model.
  A positive excess loss and a nonnegative floor give a total loss whose
  log slope is shallower than the excess-loss exponent.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-21.4
alt: >-
  With floor 2 nats, excess loss 1 nat and exponent 0.3, total loss is
  3 nats and its log slope is minus 0.1, while excess-loss slope is minus 0.3.
spec:
  tex: d\log L/d\log N=-\alpha X/(E+X)
  equation: "21.4"
  inputs:
    - {symbol: floorloss, label: fitted floor in nats, default: 2, min: 0, max: 10}
    - {symbol: excess, label: positive excess loss in nats, default: 1, min: 0.001, max: 10}
    - {symbol: alpha, label: excess-loss exponent, default: 0.3, min: 0.01, max: 2}
  outputs:
    - {symbol: total, label: total loss in nats, formula: floorloss+excess}
    - {symbol: slope, label: total-loss log slope, formula: -alpha*excess/(floorloss+excess), emphasis: true}
    - {symbol: excessslope, label: excess-loss log slope, formula: -alpha}
```

## Algorithm

**Algorithm 21.1 — Construct a conditional scaling dataset.** [DERIVED] Input: finite run records $\mathcal R=\{r_1,\ldots,r_R\}$, count conventions $\nu$, and required contract fields $\mathcal H$. Output: an immutable observation ledger $\mathcal A$ and comparable groups $\mathcal G$. A missing field is retained as missing; a failed run is not a successful endpoint observation.

$$
\begin{aligned}
1.\quad &\mathcal A_0\gets\varnothing.\\
2.\quad &h_i\gets\operatorname{fields}(r_i,\mathcal H),\qquad i=1,\ldots,R.\\
3.\quad &(N_i,D_i,U_i,C_i)\gets\operatorname{count}_{\nu}(r_i).\\
4.\quad &s_i\gets\begin{cases}
\mathrm{excluded},&\neg\operatorname{comparable}(h_i,\nu),\\
\mathrm{censored},&\operatorname{failed}(r_i)\lor\neg\operatorname{terminal}(r_i),\\
\mathrm{retained},&\text{otherwise}.
\end{cases}\\
5.\quad &\mathcal A_i\gets\mathcal A_{i-1}\cup
 \{(\operatorname{id}(r_i),\operatorname{lineage}(r_i),h_i,N_i,D_i,U_i,C_i,L_i,s_i)\}.\\
6.\quad &\mathcal G\gets\{\{a\in\mathcal A_R:h(a)=h\}:h\in\operatorname{contracts}(\mathcal A_R)\}.\\
7.\quad &\operatorname{return}(\mathcal A_R,\mathcal G).
\end{aligned}
$$
*(Eq. 21.24)*

[DERIVED] $h_i$ includes tokenizer, corpus, scored distribution/mask, architecture schedule, optimizer, horizon, seed and precision. The counting map follows the declared operation ledger and exposes unsupported quantities rather than imputing them. $L_i$ is a labeled held-out loss or source proxy, never a silent mixture. The invariant is one status and one provenance record per input identity. The procedure ends after $R$ records; metadata validation costs $O(R)$ and retained storage $O(R)$, excluding corpus scanning and operation counting. No frontier is fitted at this stage.

## Implementation

[DERIVED] This section specifies statistical estimation rather than a new training runtime. The source implementations include **JAX**, the Model / autograd framework layer, in the routed study discussed in section 21.4; that provenance does not make JAX necessary for the regression. The fitting artifact is framework-independent numerical state. No installed framework version, training kernel or released fitting repository was executed here. [R21.5], training details.

[DERIVED] Scaling regression is usually inexpensive relative to producing its training observations. With $R$ observations and a constant-dimensional law, one objective/gradient evaluation costs $O(R)$ and the data table uses $O(R)$ memory. Nonlinear optimizer iterations, initialization restarts and uncertainty resampling multiply that cost. Numerical convenience does not resolve identifiability: many optimizer starts may converge to different coefficient vectors with indistinguishable fitted loss.

[DERIVED] Evaluate positive terms in a stable log parameterization. For Eq. 21.3, write $A=e^a,B=e^b,E=e^e$ and compute $\log L=\operatorname{logsumexp}(e,a-\alpha\log N,b-\beta\log D)$. Positivity constraints on the exponents require their own parameterization or bounds. Units must be consistent: replacing $N$ by billions changes the amplitude, although it leaves an ideal exponent unchanged. The fitted vector must include its unit convention, objective, bounds, stopping tolerance and optimizer initialization record.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Kaplan's single-axis fits report exponents near 0.076 for model size and 0.095 for dataset size in their specified regimes. These are not universal marginal exponents across architectures and distributions. Hoffmann's study trains over 400 models spanning below 70M to above 16B parameters and 5B to over 400B training tokens to estimate allocation under several budgets. Its scale and two-axis coverage support a different inference than a single observed large-model point. Its scaling observations use smoothed training loss as a test-loss proxy under an explicitly stated less-than-one-epoch assumption, rather than a separately held-out measurement for every fit point. [P08, summary/section 3; P09, Introduction footnote 2/section 3]

[PAPER-REPORTED] Choshen et al. later analyze 485 previously published models rather than train 485 new models. Their reconstruction fits an additive law with squared loss on raw held-out loss, while Hoffmann's third estimator uses robust loss on log loss. Thus their estimation pipelines share a functional family but assign different statistical meaning to residuals. [R21.17, sections 2–3; P09, Appendix D.2]

## Observations

### Observation 21.1 - Smooth loss requires a stable measurement boundary

**What the paper claims.** [PAPER-REPORTED] The original scaling studies find regular relationships between language-model loss and controlled changes in size, data and compute. [P08; P09]

**What the evidence shows.** [PAPER-REPORTED] Their relationships are measured under particular tokenizers, corpora, model families and training procedures; later studies change the inferred allocation by changing accounting and tuning. [R21.1]

**What we infer.** [DERIVED] A law's domain is part of the claim. Stable aggregate loss is useful for allocation within that domain, while a changed domain requires new measurements or independent transfer validation.

**What remains unknown.** [UNVERIFIED] No source establishes a single set of exponents or an irreducible-loss constant valid across all modern dense, sparse, multilingual and reasoning-model training regimes.

## Failure modes

[DERIVED] Combining different evaluation corpora can produce an apparent floor or kink caused by measurement rather than learning. Mixing endpoint schedules can mistake incomplete cooldown for poor data efficiency. Counting repeated presentations as unique data can overstate corpus growth. Comparing per-token losses from different tokenizers can reverse apparent rankings. Reporting a fit without unsuccessful runs can turn numerical instability into selection bias. A high in-sample coefficient of determination does not diagnose any of these failures.

[MATHEMATICALLY-DERIVED] Domain mixtures make the limitation precise. For fixed weights $w_j$ summing to one, $L_{\mathrm{mix}}=\sum_jw_jL_j$. Even when each $L_j=E_j+A_jN^{-\alpha_j}$, the mixture is generally not a single exact power law unless the exponents coincide. Changing weights with scale introduces an additional term $\sum_j(d w_j/d\log N)L_j$ in its slope. A reported improvement can therefore arise partly from a changed measurement or data mixture rather than a better within-domain scaling exponent.

## Siblings

[DERIVED] A learning curve varies training progress for one model; a model-size curve compares architectures under a stated duration; a response surface estimates their joint dependence; a compute frontier minimizes that surface over a feasible constraint. These objects have different inputs and cannot share an exponent without a derivation. The three original allocation estimators and their cost sensitivities belong to [section 21.2](21-2-compute-optimal-design.md); statistical dependence and independent holdouts belong to [section 21.5](21-5-pilot-methodology.md).

## Extensions

### Improvements

[DERIVED] The historical improvement is methodological: replace a single compressed size axis with a measured surface, make the floor and count convention explicit, retain recipe changes, and test predictions outside the fitted region. Later corrections to output-head cost and training calibration develop this approach in section 21.2. Repetition and cross-domain transfer require expanded coordinates in section 21.4; those additions are hypotheses to validate, not exemptions from the measurement contract.

[UNVERIFIED] This section reconstructs source methods and supplies analytical consequences. It does not estimate coefficients for a new model family. The source revisions and exact inspection boundaries are in [references](references.md); the independent fitting and held-out evaluation required to establish a new empirical law are specified in [verification](verification.md).

## Limitations

[MATHEMATICALLY-DERIVED] An empirical power law has a finite inspected domain. A positive offset and positive exponents ensure a monotone mathematical surface, but do not ensure that a new optimizer, repeated corpus, longer context or different evaluation slice follows it. A prediction is falsified for its stated error criterion when an independent comparable endpoint falls outside its accepted predictive range. Adjusting the law afterward creates a new version requiring another independent test.

## Reproducibility

[DERIVED] Retain the count convention, full-precision loss and coefficient values, scored distribution, source proxy status, run lineage and every inclusion/exclusion decision. Each PAPER-REPORTED observation here refers to a specific source protocol rather than an independently executed fit. Hardware throughput, power, currency, and uncertainty coverage for a book-authored run remain UNVERIFIED; these quantities cannot be reconstructed from the response equation alone.

## References

[P08](references.md#p08), §§1.2, 2–4; [P09](references.md#p09), §3 and Appendix D; [R21.1](references.md#r21-1), §§2–4; [R21.17](references.md#r21-17), §3; [verification](verification.md).
