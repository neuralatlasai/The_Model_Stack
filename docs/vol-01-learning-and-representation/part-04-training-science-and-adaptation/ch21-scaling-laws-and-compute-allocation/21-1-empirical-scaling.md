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

[DERIVED] Empirical scaling begins with a measurement contract: which held-out tokens are scored, which conditional contexts are available, which model components are counted, and which training procedure produces the checkpoint. Loss plotted against a single size variable suppresses all the other coordinates. A smooth curve is consequently evidence about a controlled family or an observed collection of recipes, with different interpretations in those two cases.

## Formulation

[MATHEMATICALLY-DERIVED] For evaluation sequences sampled from $q$, the population autoregressive loss is

$$
L(\theta;q)=\mathbb E_q[-\log p_\theta(x_t\mid x_{<t})]
=H_q(X_t\mid X_{<t})+\mathbb E_{q(x_{<t})}\operatorname{KL}(q(\cdot\mid x_{<t})\Vert p_\theta(\cdot\mid x_{<t})).
$$
*(Eq. 21.1)*

[MATHEMATICALLY-DERIVED] This identity assumes the model assigns positive probability wherever the target distribution does; otherwise the loss can be infinite. The conditional entropy depends on tokenization, the context boundary and $q$. Evaluation with a shorter context changes the target conditional distribution. Mean empirical loss estimates Eq.21.1 only under the declared sampling/weighting procedure. Multiple tokens from one document are correlated; counting all of them as independent observations understates uncertainty.

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

[DERIVED] These are different families and data coordinates. Eq.21.2 describes early-stopped loss as a function of model and finite available dataset, with nonlinear coupling and no explicit additive floor; Eq.21.3 uses processed training tokens and an estimated offset. Kaplan's compute allocation additionally uses its separate finite-training-time analysis. Exponents and data counts cannot be inserted from one family into the other. A model can fit current observations well while producing a substantially different far-field asymptote. [P08, sections 1–4; P09, section 3/Appendix D]

### What an irreducible term means

[MATHEMATICALLY-DERIVED] For Eq.21.3, $\lim_{N,D\to\infty}L=E$ inside the assumed family. Eq.21.1 gives an entropy lower bound for a specified evaluation distribution, but does not establish that an empirical five-parameter fit recovers it. A restricted architecture, unresolved optimization error, duplicated training/evaluation material or unmodeled data heterogeneity can be absorbed into $E$. Estimation far from the floor often permits a wide range of offsets with compensating exponents.

[MATHEMATICALLY-DERIVED] Even the one-axis function $L(N)=E+A N^{-\alpha}$ illustrates this issue:

$$
\frac{d\log(L-E)}{d\log N}=-\alpha,\qquad
\frac{d\log L}{d\log N}=-\alpha\frac{L-E}{L}.
$$
*(Eq. 21.4)*

[DERIVED] The slope of log total loss flattens as the floor becomes important; it is not the excess-loss exponent. Subtracting a fitted floor before drawing a straight line also transfers floor uncertainty into every transformed point. If a candidate floor exceeds an observed loss, the log excess is undefined. This boundary must be handled in the fitting parameterization rather than suppressed by dropping inconvenient points.

## Methodology

### Define coordinates before estimating a law

[PAPER-REPORTED] Kaplan's experiments used WebText2, sequence length 1024 and a fixed BPE vocabulary, with separately varied model size, dataset size and compute. The non-embedding approximation assumes conditions under which omitted vocabulary and attention terms are relatively small. Chinchilla tests substantially different model/data allocations rather than extending a single fixed-size training run. These design differences are part of the measurements. [P08, section 2/Appendix B; P09, section 3]

[DERIVED] Parameter records must distinguish trainable scalars, non-embedding scalars, output-head scalars, tied weights, total sparse parameters and activated parameters. A tied matrix contributes once to stored parameters while its output projection still performs work. Training presentations $D$ must distinguish unique material, repetitions, packed tokens, padding, masked targets and tokens consumed by unsuccessful steps. A curve against bytes or words can aid cross-tokenizer comparison only after a corresponding likelihood normalization is defined; relabeling a token-axis plot does not make losses comparable.

[MATHEMATICALLY-DERIVED] In a simplified dense network, a forward matrix multiplication uses approximately two FLOPs per multiply-accumulate per weight/token, and its two backward products add approximately four. This motivates $C\approx6ND$. It does not count an output head omitted from $N$, quadratic attention work, activation recomputation, router operations or extra objective passes. An omitted constant fraction mostly rescales the budget axis; a fraction that changes with model size can also change an estimated allocation exponent. [P08; R21.1]

### Fit a surface, then derive a frontier

[MATHEMATICALLY-DERIVED] If $N$ and $D$ vary independently, Eq.21.3 can in principle separate their contributions. On a single path $D=kN^r$, it becomes $E+A N^{-\alpha}+B k^{-\beta}N^{-r\beta}$. A narrow observed range can make those two decreasing terms nearly indistinguishable. On a single iso-compute path $D=C/(\kappa N)$, model and data effects move in opposite directions. Multiple budgets and multiple sizes per budget are therefore different information from many checkpoints on one trajectory.

[DERIVED] The compute frontier is the envelope $L_*(C)=\min_{N,D:C(N,D)\le C}L(N,D)$. It is a derived object, not another name for the original two-dimensional surface. Its construction requires feasible model configurations and an explicit cost model. Observed best runs form a noisy lower envelope and benefit from selection over many trials; treating that minimum as an unbiased sample of the optimum introduces selection effects. Section 21.2 derives the analytical frontier and reconstructs the original empirical estimators.

## Algorithm

```text
Algorithm 21.1 — Construct a conditional scaling dataset
INPUT: run records; evaluation contract; parameter and compute conventions
OUTPUT: auditable observations with comparability groups and exclusion reasons
STATE: immutable run IDs; lineage IDs; unit and recipe metadata
INVARIANT: every retained loss has a checkpoint, token boundary and evaluation identity
1. Resolve the model family, tokenizer, data revision and evaluation distribution.
2. Count N under the declared convention and record excluded parameter categories.
3. Count presented D, unique U and predicted evaluation tokens separately.
4. Compute algorithmic work from the declared operation model; retain measured time separately.
5. Attach optimizer, schedule horizon, seed, precision and architecture ratios.
6. Group comparable observations; flag changes rather than imputing a common recipe.
7. Retain failed and censored runs with explicit status and observed boundaries.
8. Return the dataset and its provenance manifest without fitting a frontier yet.
TERMINATION: all finite input records receive a retained, excluded or censored status
COMPLEXITY: O(R) record validation plus source-specific token and operation counting
```

## Implementation

[DERIVED] Scaling regression is usually inexpensive relative to producing its training observations. With $R$ observations and a constant-dimensional law, one objective/gradient evaluation costs $O(R)$ and the data table uses $O(R)$ memory. Nonlinear optimizer iterations, initialization restarts and uncertainty resampling multiply that cost. Numerical convenience does not resolve identifiability: many optimizer starts may converge to different coefficient vectors with indistinguishable fitted loss.

[DERIVED] Evaluate positive terms in a stable log parameterization. For Eq.21.3, write $A=e^a,B=e^b,E=e^e$ and compute $\log L=\operatorname{logsumexp}(e,a-\alpha\log N,b-\beta\log D)$. Positivity constraints on the exponents require their own parameterization or bounds. Units must be consistent: replacing $N$ by billions changes the amplitude, although it leaves an ideal exponent unchanged. The fitted vector must include its unit convention, objective, bounds, stopping tolerance and optimizer initialization record.

## Reported experiments

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

## Improvements and limits

[DERIVED] The historical improvement is methodological: replace a single compressed size axis with a measured surface, make the floor and count convention explicit, retain recipe changes, and test predictions outside the fitted region. Later corrections to output-head cost and training calibration develop this approach in section 21.2. Repetition and cross-domain transfer require expanded coordinates in section 21.4; those additions are hypotheses to validate, not exemptions from the measurement contract.

[UNVERIFIED] This section reconstructs source methods and supplies analytical consequences. It does not estimate coefficients for a new model family. The source revisions and exact inspection boundaries are in [references](references.md); the independent fitting and held-out evaluation required to establish a new empirical law are specified in [verification](verification.md).

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
  direction: LR
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
