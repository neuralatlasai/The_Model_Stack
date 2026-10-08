---
id: ms.section.20.2
entity_type: section
title: Hyperparameter scaling
short_title: Hyperparameter scaling
volume: 1
part: 4
chapter: 20
section: 20.2
slug: 20-2-hyperparameter-scaling
parent: ms.chapter.20
prev_sibling: ms.section.20.1
next_sibling: ms.section.20.3
children: []
prerequisites: [ms.chapter.2, ms.chapter.3, ms.chapter.19]
downstream: [ms.chapter.21, ms.chapter.22, ms.chapter.29, ms.chapter.30]
related: [ms.chapter.6, ms.chapter.13]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P13}
  - {type: implemented_by, target: impl.pytorch}
axes: {lifecycle: [pretraining, continued_training, evaluation], mechanism: [optimization, training_stability], feedback_setting: [], modality: [text, image]}
papers: [P13]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 20.2 Hyperparameter scaling

## Scope

[DERIVED] This section owns rate/batch/noise relations and width/depth transfer under specified parameterizations. The reference is independently tuned fixed-scale training. Success means a stated family, scaling map, clock invariant and held-out transfer criterion; arbitrary architecture or data changes remain outside that claim.

## Why this exists

[DERIVED] Hyperparameter scaling asks which aspects of a training transition remain comparable when width, depth, batch size or duration changes. Copying a scalar learning rate does not preserve a function-space update when the parameterization or optimizer geometry changes. Conversely, forcing equal parameter RMS updates does not ensure equal representation learning. Transfer therefore specifies a family of models, an update rule, a scale axis and a measurable invariant. Width transfer, depth transfer and batch transfer are separate claims.

## Intuition

[MATHEMATICALLY-DERIVED] Batch averaging suppresses independent sampling variance, width changes contraction sums, and depth changes accumulated residual effects. These operations act on different mathematical objects. A common numerical learning rate cannot preserve them simultaneously unless the family and optimizer provide a compatible joint scaling rule.

## Formulation

| Symbol | Meaning and domain |
|---|---|
| $z_i,G,\Sigma$ | Sample gradient, its mean and covariance at a fixed parameter state |
| $n,H$ | Number of independent equal-weight units and symmetric local Hessian |
| $\eta_\infty,n_{\mathrm{noise}}$ | Infinite-batch quadratic optimum and curvature-weighted noise scale |
| $\beta,q$ | Moment-memory coefficient and batch-size multiplier |
| $d,L$ | Hidden width and number of residual blocks |
| $\mathcal T_q,\chi$ | Source-specific scaling map and observed coordinate signature |

### Gradient noise defines a conditional batch scale

[MATHEMATICALLY-DERIVED] Let independent sampling units have gradients $z_i$ with mean $G$ and covariance $\Sigma$ at a fixed parameter state. For an average of $n$ independent units, $\widehat G_n=n^{-1}\sum_i z_i$ has covariance $\Sigma/n$. Here $n$ counts independent units, not automatically tokens: adjacent tokens within a document are dependent. If document lengths differ, valid-token weighting also changes the random variable being averaged. For a locally quadratic objective with symmetric Hessian $H$, the expected change after an SGD step is

$$
\mathbb E[\mathcal L(\theta-\eta\widehat G_n)]-\mathcal L(\theta)
\approx-\eta\|G\|_2^2+\frac{\eta^2}{2}
\left(G^\top HG+\frac{\operatorname{tr}(H\Sigma)}{n}\right).
$$
*(Eq. 20.4)*

[MATHEMATICALLY-DERIVED] If the total quadratic coefficient $G^\top HG+\operatorname{tr}(H\Sigma)/n$ is positive, minimizing this quadratic in $\eta$ yields the first expression below. The factorization on the right additionally requires $G^\top HG>0$, with $\eta_\infty=\|G\|_2^2/(G^\top HG)$:

$$
\eta_*(n)=\frac{\|G\|_2^2}{G^\top HG+\operatorname{tr}(H\Sigma)/n}
=\frac{\eta_\infty}{1+n_{\mathrm{noise}}/n},\quad
n_{\mathrm{noise}}=\frac{\operatorname{tr}(H\Sigma)}{G^\top HG}.
$$
*(Eq. 20.5)*

[MATHEMATICALLY-DERIVED] A nonnegative curvature-weighted noise scale further requires $\operatorname{tr}(H\Sigma)\ge0$; positive-semidefinite $H$ is sufficient. If $G^\top HG=0$ while the noise-curvature term is positive, the direct finite-batch optimum remains defined but $\eta_\infty$ and this factorization do not. If signal curvature is negative, retain the direct expression only where its total denominator is positive; it does not define a positive infinite-batch quadratic optimum.

[PAPER-REPORTED] This is the noise-scale model developed by McCandlish et al.; it relies on a local approximation and an SGD direction. Their simple proxy $n_{\mathrm{simple}}=\operatorname{tr}(\Sigma)/\|G\|_2^2$ coincides with Eq.20.5's noise scale when $H$ is proportional to the identity. Their experiments find useful order-of-magnitude prediction beyond that idealization, while documenting exceptions. A curvature-weighted noise scale can be ill-defined or negative outside the positive-curvature regime. The simple proxy alone cannot certify an optimal Adam learning rate. [R20.6]; section 2

### Token clocks and moment clocks

[MATHEMATICALLY-DERIVED] For constant $n$ and memory coefficient $\beta$, the contribution of a gradient $j$ accepted updates in the past is proportional to $\beta^j$. The exact e-folding memory is $-1/\log\beta$ updates and $-n/\log\beta$ sampling units. If the sole goal is preserving decay over consumed units while changing $n$ by a factor $q$, the matching coefficient is $\beta'=\beta^q$. This identity assumes a fixed clock and no skipped updates; it does not assert equivalence of the resulting stochastic optimization. The input gradients and nonlinear moment normalization also change.

[DERIVED] At a fixed consumed-token budget, increasing effective batch reduces accepted updates. Preserving the same learning-rate sequence indexed by update therefore changes the schedule as a function of data exposure; preserving the same sequence indexed by tokens changes its sampling in update time. The decay product in Eq.20.2 and the moment horizon must be compared alongside the learning rate. Gradient accumulation reproduces a larger token-normalized batch only when microbatch weighting and state advancement follow Chapter 19's contract.

## Mechanism

### Methodology: Why standard width scaling can fail after initialization

[PAPER-REPORTED] Maximal Update Parametrization, or $\mu$P, coordinates initialization, multipliers and per-parameter learning rates so that hidden features retain nontrivial changes as width grows. Initialization-only variance control is insufficient because trained weights become correlated with activations. Tensor Programs V gives several mathematically equivalent parameter representations; their stored weights and numerical learning rates differ. Its Transformer construction also changes attention scaling in the analyzed family. Those components must travel together. [R20.5]; sections 3-5/AppB/J

[MATHEMATICALLY-DERIVED] A two-layer linear calculation exposes the issue without appealing to an analogy. Let $f(x)=v^\top Ux$, with hidden width $d$, input fixed, and scalar residual derivative $e$. The gradient update contains $\Delta v=-\eta_v e Ux$. Its direct contribution to the next prediction is $\Delta v^\top Ux=-\eta_v e\|Ux\|_2^2$. If hidden coordinates have order-one variance, that norm is order $d$; a width-independent stored readout learning rate creates an order-$d$ contribution. Scaling only the global rate to fix this term simultaneously changes the input-layer update, whose appropriate scaling follows a different contraction. The exact powers depend on how $U,v$ and any explicit output multiplier are represented.

[PAPER-REPORTED] In Tensor Programs V's raw-weight table, hidden matrix initialization variance scales as inverse fan-in and Adam learning rate as inverse fan-in. In its alternative implementation table, the output multiplier carries inverse fan-in scaling while vector-like input/output parameters use different stored-weight and learning-rate conventions. Tied embeddings require the compatible representation rather than two contradictory scaling prescriptions on one tensor. An implementation must record base and target shapes and which dimensions grow; a vocabulary dimension held fixed is not a second width dimension. [R20.5]; Tables 3/8-9

[DERIVED] Coordinate checks test the intended asymptotic regime before expensive tuning: hold base hyperparameters fixed, vary the chosen width axis, and compare activation magnitudes and changes at matched early update counts. An order-one curve is an invariant to inspect, not proof of equal final loss. A model can pass an activation-magnitude check while changing depth, data distribution or optimization horizon in ways outside the transfer claim.

### Depth is a separate scaling axis

[PAPER-REPORTED] Bordelon et al. analyze residual networks combining $\mu$P with residual branches scaled by $1/\sqrt L$, where $L$ is the number of blocks. Their joint-width/depth limit and experiments support transfer for the analyzed residual architectures; width-only $\mu$P does not automatically provide depth transfer. Their appendix includes settings where depth 30 models diverge without the residual scaling. This result is architecture- and optimizer-dependent; it is not permission to insert a depth multiplier into an arbitrary pretrained checkpoint. [R20.12]

[MATHEMATICALLY-DERIVED] If residual increments were independent, zero-mean and had fixed variance, the variance of $\sum_{\ell=1}^L L^{-1/2}r_\ell$ would stay order one. If increments become coherently aligned, cross terms can change the scaling. Training-induced correlations are why a variance mnemonic is not a complete depth-transfer argument. Initialization, learning-rate scaling, normalization, branch multipliers and feature evolution must be analyzed together.

### Matrix preconditioning changes the transfer rule

[PAPER-REPORTED] Qiu et al. derive optimizer-specific width/depth rules for Muon, Shampoo and SOAP, accounting for blocking and norm grafting. Their raw Muon convention keeps the hidden-matrix rate width-independent while scaling embedding and readout rates with opposite half powers; this differs from copying Adam's hidden inverse-width rule. Finite-width stable-rank changes can still cause drift, and blocking or explicit spectral normalization can reduce that drift. The claim is tied to their update representation, not to a universal optimizer-name lookup table. [R20.13]; section 3/AppD-E

[MATHEMATICALLY-DERIVED] For an update matrix $A$, stable rank $\|A\|_F^2/\|A\|_2^2$ links RMS and spectral normalization. Equal Frobenius norm does not imply equal operator norm when stable ranks differ. A rate calibrated by entry RMS can therefore preserve an average magnitude while changing the largest function-space perturbation. Blocking additionally changes which singular directions are coupled, so it is both a systems choice and a mathematical variant.

```figure
id: fig-20.4
kind: diagram
title: Four distinct transfer axes
caption: Width, depth, batch and duration affect different terms of the transition. A transfer rule must identify the optimizer representation and the clock it preserves.
placement: inline
evidence: DERIVED
source: [R20.5, R20.6, R20.12, R20.14]
alt: Model width affects contraction scales; depth affects residual accumulation; batch affects noise; duration affects schedule and state memory. These jointly determine a transferable configuration.
spec:
  direction: TB
  nodes:
    - {id: width, kind: state, label: width and tensor roles}
    - {id: depth, kind: state, label: depth and residual scaling}
    - {id: batch, kind: state, label: batch and gradient noise}
    - {id: duration, kind: state, label: duration and schedule clock}
    - {id: config, kind: process, label: coupled parameterization}
    - {id: check, kind: node, label: held-out-scale evidence}
  edges:
    - {from: width, to: config}
    - {from: depth, to: config}
    - {from: batch, to: config}
    - {from: duration, to: config}
    - {from: config, to: check}
```

[MATHEMATICALLY-DERIVED] At constant independent batch size $n$ and coefficient $0<\beta<1$, the exact e-folding horizons are

$$
h_{\mathrm{updates}}=-1/\ln\beta,\qquad h_{\mathrm{units}}=-n/\ln\beta.
$$
*(Eq. 20.14)*

```figure
{
  "id": "fig-20.5",
  "kind": "calculator",
  "title": "Conditional SGD rate versus batch",
  "caption": "Executes the positive-curvature local SGD approximation. Inputs are an analytical configuration; correlated tokens and Adam are outside the derivation.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-20.5",
  "alt": "With batch 256 and curvature noise scale 2048, the local optimum is one ninth of the infinite-batch rate.",
  "states": [
    {
      "anchor": "formulation",
      "label": "Noise-dominated",
      "variables": {
        "n": 256
      },
      "note": "Small independent batches have a large covariance contribution."
    },
    {
      "anchor": "mechanism",
      "label": "At the noise scale",
      "variables": {
        "n": 2048
      },
      "note": "The local optimum reaches half of its limiting rate."
    }
  ],
  "spec": {
    "tex": "\\eta_*(n)=\\frac{\\eta_\\infty}{1+n_{\\mathrm{noise}}/n}",
    "equation": "20.5",
    "inputs": [
      {
        "symbol": "n",
        "label": "independent units per batch",
        "default": 256,
        "min": 16,
        "max": 65536,
        "format": "integer",
        "scale": "log2"
      },
      {
        "symbol": "noise",
        "label": "curvature noise scale",
        "default": 2048,
        "min": 16,
        "max": 65536,
        "format": "integer",
        "scale": "log2"
      },
      {
        "symbol": "eta",
        "label": "infinite-batch local rate",
        "default": 0.001,
        "min": 0.0001,
        "max": 0.01,
        "format": "raw",
        "scale": "log10"
      }
    ],
    "outputs": [
      {
        "symbol": "Rate",
        "label": "local optimum rate",
        "formula": "eta/(1+noise/n)",
        "format": "raw",
        "emphasis": true
      },
      {
        "symbol": "Fraction",
        "label": "fraction of limiting rate",
        "formula": "n/(n+noise)",
        "format": "percent",
        "emphasis": false
      }
    ]
  }
}
```

```figure
{
  "id": "fig-20.6",
  "kind": "calculator",
  "title": "Moment memory on the data clock",
  "caption": "Exact exponential-memory identity at constant batch and no skipped accepted updates. It preserves coefficient decay, not stochastic optimization equivalence.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-20.14",
  "alt": "At beta 0.95 the e-folding horizon is about 19.50 updates; 2048 independent units per update gives approximately 39928 data units.",
  "spec": {
    "tex": "h_{\\mathrm{updates}}=-1/\\ln\\beta,\\quad h_{\\mathrm{units}}=-n/\\ln\\beta",
    "equation": "20.14",
    "inputs": [
      {
        "symbol": "beta",
        "label": "memory coefficient",
        "default": 0.95,
        "min": 0.5,
        "max": 0.999,
        "format": "raw",
        "step": 0.001
      },
      {
        "symbol": "n",
        "label": "independent units per update",
        "default": 2048,
        "min": 16,
        "max": 65536,
        "format": "integer",
        "scale": "log2"
      }
    ],
    "outputs": [
      {
        "symbol": "Updates",
        "label": "e-folding updates",
        "formula": "-1/ln(beta)",
        "format": "fixed2",
        "emphasis": false
      },
      {
        "symbol": "Units",
        "label": "e-folding data units",
        "formula": "-n/ln(beta)",
        "format": "fixed2",
        "emphasis": true
      }
    ]
  }
}
```

## Algorithm

[DERIVED] This is a reconstruction of the transferable experiment logic in the cited studies, not an executed tuning run.

### Algorithm 20.2 — Transfer a parameterized optimizer family

[DERIVED] Let $q=(q_w,q_L,q_n,q_D)$ be target/base ratios for width, depth, independent batch units and token horizon. Inputs are a finite base search set $\mathcal H$, source-specific scaling map $\mathcal T_q$, fixed task/evaluation record $\mathcal A$, and disjoint tuning/held-out evaluation sets. $\operatorname{Fit}$ denotes training with the fully specified transition and a bounded budget; $\operatorname{Eval}$ returns the declared normalized validation loss. The coordinate signature $\chi$ contains activation and feature-change statistics, not a target-loss ranking:

$$
\begin{aligned}
\text{(1)}\quad &h_q=\mathcal T_q(h),\qquad
 \chi_{q,h}=\operatorname{Coordinates}(\operatorname{Fit}_{\mathrm{pilot}}(\mathcal A,h_q));\\
\text{(2)}\quad &\mathcal H_{\mathrm{valid}}=
 \{h\in\mathcal H:\operatorname{ConsistentRoles}(h_q)=1,
 \ \chi_{q,h}\in\mathcal I_q\};\\
\text{(3)}\quad &\widehat h=\arg\min_{h\in\mathcal H_{\mathrm{valid}}}
 \operatorname{Eval}_{\mathrm{tune}}(\operatorname{Fit}(\mathcal A,h));\\
\text{(4)}\quad &\widehat h_q=\mathcal T_q(\widehat h),\qquad
 \ell_q=\operatorname{Eval}_{\mathrm{held}}(\operatorname{Fit}(\mathcal A,\widehat h_q));\\
\text{(5)}\quad &\mathcal O=(\widehat h,\widehat h_q,\chi,\ell_q,
 \{\text{trial status, consumed resources}\}_{h\in\mathcal H}).
\end{aligned}
$$

[DERIVED] $\mathcal I_q$ is a preregistered coordinate-check criterion whose thresholds belong to the experiment specification. Role consistency requires one compatible rule for every tied tensor and growing dimension. If $\mathcal H_{\mathrm{valid}}$ is empty, return a failed transfer specification rather than select an unchecked configuration. Ties use a fixed rule; a diverged trial retains its status and consumed budget. The invariant is that $\ell_q$ cannot change $\widehat h$ after selection. Termination follows finite search and per-trial budgets. Training dominates work; sampled coordinate reductions add $O(N)$ arithmetic per sampled state. This protocol is mathematical pseudocode for an unexecuted procedure, not new evidence of transfer.

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch parameter groups supply distinct rates, decay coefficients and optimizer options. A practical transfer implementation also needs explicit forward multipliers where the source parameterization uses them; setting groups alone does not reconstruct $\mu$P. The inspected Muon API offers multiple shape-scaling conventions, so specifying an identical nominal rate while leaving the calibration option at its default can change the effective experiment. PyTorch is the MODEL / AUTOGRAD FRAMEWORK layer; distributed state placement and communication are separate concerns. [R20.20], [R20.23]

[DERIVED] A covariance estimate need not allocate an $N\times N$ matrix when only $\operatorname{tr}\Sigma$ is wanted. With $q$ independent equal-weight gradient samples, the sample trace is $(q-1)^{-1}\sum_i\|z_i-\bar z\|^2$. One can accumulate vector sums and sums of squared norms, or use an online centered recurrence, in $O(qN)$ arithmetic and $O(N)$ extra state. Cancellation in the raw second-moment difference and dependence between samples can dominate the estimate; a negative finite-sample noise proxy should be reported rather than silently treated as physical negative variance. The Hessian-weighted version additionally needs curvature information.

[DERIVED] Tuning cost includes failed and discarded trials. A smaller proxy can require fewer arithmetic operations yet achieve lower hardware utilization, so FLOP savings and accelerator-hour savings differ. Transfer reduces target search only if validation of its assumptions and the proxy search cost are included. Energy and money require measured power/pricing and are not inferred from a FLOP ratio.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Tensor Programs V's IWSLT14 German-English experiment tunes rate, output multiplier and attention-key multiplier on a quarter-width 4M-parameter proxy versus the 40M target. It matches total tuning FLOPs, repeats the search 25 times and evaluates each selected configuration with 5 initializations on V100 GPUs. That protocol measures reliability of a tuning procedure, rather than reporting only one fortunate run. The authors explicitly distinguish FLOPs from wall time because the small proxy underutilizes the hardware. [R20.5]; section 7.1

[PAPER-REPORTED] McCandlish et al. sweep batch sizes and tune rates separately across image, language and reinforcement-learning tasks, fit step-versus-sample Pareto curves, and compare critical batch scales with gradient-noise estimates. The simple scale often predicts the turning point at an order-of-magnitude level; autoencoder/VAE settings provide counterexamples where it underestimates the useful batch scale. For Adam/RMSProp, the observed small-batch rate exponent varies between roughly 0.5 and 1 depending on task, rather than establishing a universal linear rule. [R20.6]; section 3/AppB

[PAPER-REPORTED] Qiu et al.'s scaling comparison uses Llama-style 190M-1.4B models on shuffled FineWeb, GPT-2 tokenization, length 1024 and 128 sequences per batch. They tune a 190M base and perturb transferred rates/decay by factors of two at larger scales. Their updated comparison reports approximately 1.4 times compute multipliers for Muon, SOAP, and Shampoo; these count forward/backward FLOPs and exclude optimizer transformations. Incorrect scaling causes gains to diminish; section 20.6 treats the excluded work explicitly. [R20.13]; section 4/AppH

## Observations

### Observation 20.2 - Transfer is conditional on representation and clock

**What the paper claims.** [PAPER-REPORTED] The transfer studies propose hyperparameters that remain effective across explicitly parameterized width, depth, or optimizer families. [R20.5]; [R20.12]; [R20.13]

**What the evidence shows.** [PAPER-REPORTED] Their experiments include successful transfers and configurations that fail outside the specified scaling rule; gradient-noise studies additionally delimit when batch growth stops saving updates. [R20.5]; [R20.6]; [R20.12]; [R20.13]

**What we infer.** [DERIVED] Width contraction scales, accumulated residual effects, and optimizer memory per token are different mechanisms. A successful target run alone cannot establish general transfer or exclude the effect of better base tuning.

**What remains unknown.** [NOT-DISCLOSED] The inspected sources do not establish one validated scaling law spanning arbitrary architecture, optimizer, sequence-length, and data-distribution changes.

## Failure modes

[DERIVED] Common invalid transfers hold token budget fixed but compare different accepted updates without recording the difference; resize a tied embedding as if it were an ordinary hidden matrix; change attention normalization while keeping its rate rule; or transfer Adam's epsilon numerically when gradient scales change. A sudden rate instability can be a finite-width departure rather than a failure of the asymptotic argument. Conversely, a stable run can have nearly frozen layers and still violate the intended feature-learning regime.

## Siblings

[DERIVED] On the axis of which family change is controlled, [width transfer](#mechanism) targets contraction scales, [depth transfer](#depth-is-a-separate-scaling-axis) targets residual accumulation, and [batch transfer](#gradient-noise-defines-a-conditional-batch-scale) targets sampling noise and clock changes. Duration transfer also changes [schedule endpoints](20-3-scheduling.md#formulation). None defines the empirical loss/compute allocation fit owned by [Chapter 21](../ch21-scaling-laws-and-compute-allocation/README.md).

## Extensions

### Improvements

[PAPER-REPORTED] Complete$^{(d)}$P extends transfer across modules, width, depth, batch and duration. Its residual family uses a depth ratio raised to $-\alpha$ with $\alpha\in[1/2,1]$, and its table jointly scales rates, epsilon, decay and moment coefficients. The report studies QK-normalized Transformer configurations and per-module search rather than treating one global rate as the entire hyperparameter vector. This is a documented successor addressing multiple axes, not evidence that arbitrary architecture/data changes become free. Its distinct coefficient convention must be reconciled with Eq.20.2 before comparison. [R20.14]; sections 2-3/Table 1

## Limitations

[DERIVED] The quadratic batch result requires independent equal-weight units and positive curvature terms. Width/depth transfer requires the source parameterization, optimizer representation and finite-width regime; changing tied-weight roles, sequence distribution or data horizon can violate that contract. Coordinate invariants are necessary diagnostics, not a theorem of equal final validation loss.

## Reproducibility

[DERIVED] The transfer artifact retains every proxy/target shape, scale ratio, forward multiplier, parameter group, initialization rule, schedule clock, moment horizon, search proposal, failed trial and selected validation record. The reproducible claim is a procedure's performance on held-out scales with its tuning budget. The manuscript has not executed these experiments or verified package compatibility; the chapter's verification protocol marks its chosen configurations as proposals.


## References

[P13](references.md) ? [R20.6](references.md) ? [R20.5](references.md) ? [R20.12](references.md) ? [R20.13](references.md) ? [R20.20](references.md) ? [R20.23](references.md) ? [R20.14](references.md)
