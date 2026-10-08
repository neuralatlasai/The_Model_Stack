---
id: ms.section.5.4
entity_type: section
title: Residual organization
short_title: Pre-norm vs post-norm
volume: 1
part: 1
chapter: 5
section: 5.4
slug: 05-4-residual-organization
parent: ms.chapter.5
prev_sibling: ms.section.5.3
next_sibling: ms.section.5.5
children: []
prerequisites: [ms.section.3.2, ms.section.3.4, ms.section.5.1]
downstream: [ms.section.13.4, ms.section.19.3, ms.section.20.4, ms.section.64.2]
related: []
siblings_by_mechanism: [ms.section.13.4]
relations:
  - {type: supported_by, target: paper.P01}
  - {type: implemented_by, target: impl.pytorch}
axes:
  lifecycle: [pretraining]
  mechanism: [normalization, residual_stream]
  feedback_setting: []
  modality: [text]
papers: [P01]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status:
  maturity: established
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, UNVERIFIED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 1000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 5.4 Residual organization

## Scope

Residual organization specifies where a transformation and a normalization act relative to an additive state update. Pre-normalization and post-normalization have different Jacobians and signal statistics even when their projection shapes agree. Normalization type, learned gain, epsilon, residual coefficient, and initialization are distinct choices. This section derives their local effects, states the conditions of the cited initialization theorem, and separates an analytical variance model from evidence about trained networks. (PAPER-REPORTED: P01 section 3.1; R5.3; R5.4 section 3; MATHEMATICALLY-DERIVED: identities below.)

## Why this exists

For an update `h_next=h+f(N(h))`, differentiation produces an explicit identity term plus a branch term. For `h_next=N(h+f(h))`, every incoming derivative passes through the normalization Jacobian. The identity term is a property of the computational graph; it is not a proof that singular values, parameter gradients, or training remain bounded through an arbitrary stack. Branch Jacobians can reinforce, cancel, or rotate that contribution. A stability explanation must therefore identify which derivative is controlled, under which initialization and loss, and over which training interval. (MATHEMATICALLY-DERIVED.)

Published designs make different choices. P01 uses post-LayerNorm. GPT-2 records moving LayerNorm to branch inputs and adding a final norm. LLaMA records pre-RMSNorm. These descriptions establish their architectures, while a controlled comparison of ordering and training stability requires a source that actually changes and evaluates that choice. (PAPER-REPORTED: P01 section 3.1; R5.2 section 2.3; R5.8 section 2.2.)

## Intuition

Normalization removes specific degrees of scale or shift from its input, with the result depending on its formula and epsilon. For ideal LayerNorm without epsilon and with fixed gain/bias, adding a common scalar to every channel changes neither centered values nor output; positive rescaling also leaves the normalized direction unchanged. RMSNorm omits centering, so a common shift generally changes its output. With nonzero epsilon, scale invariance is no longer exact. These are algebraic properties, without an assumption about the distribution of a trained representation. (MATHEMATICALLY-DERIVED.)

In a residual stack, the state is a sum of increments that depend on earlier states. Independence of those increments is generally not an architectural property. Any variance model that drops their covariances introduces an additional analytical condition. Keeping the covariance terms makes clear when depth growth, cancellation, or a different scaling can occur.

## Formulation

Index individual attention/FFN residual branches by j=1,...,2L. Write f_j for a branch and N_j for its normalization. The reference uses two branches per block; its final residual state h_(2L) is h_L in the block indexing of 5.1.

$$
h_j=N_j(h_{j-1}+f_j(h_{j-1})).
$$
*(Eq. 5.13)* This is post-normalization. P01's N is LayerNorm; replacing it by RMSNorm defines another post-normalized architecture.

$$
h_j=h_{j-1}+f_j(N_j(h_{j-1})).
$$
*(Eq. 5.14)* This is pre-normalization. The reference additionally applies the final norm in Eq. 5.3; that norm is part of its specified function, rather than a mathematical requirement imposed on every possible pre-normalized model.

$$
h_{2L}=h_0+\sum_{j=1}^{2L}\Delta_j,\qquad \Delta_j=f_j(N_j(h_{j-1})).
$$
*(Eq. 5.15)* The identity holds exactly in real arithmetic by telescoping the updates. Floating-point additions introduce rounding at each stage.

$$
\operatorname{RMSNorm}(x)_i=\gamma_i x_i/r,\qquad r=\sqrt{\varepsilon+d^{-1}\sum_{k=1}^d x_k^2}.
$$
*(Eq. 5.16)* Gain gamma is learned. LayerNorm instead uses centered c=x-mean(x), r=sqrt(epsilon+mean(c^2)), and can include an additive learned bias. With unit gain, RMSNorm has mean square `mean(x^2)/(epsilon+mean(x^2))`; it does not generally have zero mean or unit variance. LayerNorm's variance with unit gain/zero bias is similarly `v/(v+epsilon)`, approaching1 only in the applicable limit. (MATHEMATICALLY-DERIVED.)

```figure
id: fig-5.17
kind: diagram
title: Pre-norm and post-norm orderings of one sub-block
caption: >-
  Pre-normalization gives Jacobian I+J_f*J_N; post-normalization gives
  J_N*(I+J_f). Topology alone proves neither stream growth nor stable
  gradients. Equal-cost comparison requires the same normalization operator
  and affine parameters. P01 uses affine LayerNorm; the reference uses
  gain-only RMSNorm.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.13", "DERIVED:eq-5.14"]
alt: >-
  Pre-norm routes h through Norm then f before adding to h. Post-norm
  adds f(h) to h then normalizes. Norm type, epsilon, affine parameters,
  covariances, and initialization determine scale and gradient behavior.
spec:
  direction: LR
  nodes:
    - { id: pin, kind: tensor, label: "h_ℓ−1", sub: "[B, T, D]", group: pre }
    - { id: pn, kind: process, label: "chosen Norm", sub: "type and affine terms explicit", group: pre }
    - { id: pf, kind: process, label: "sub-block f", sub: "attention or FFN", group: pre }
    - { id: padd, kind: process, label: "residual add", sub: "h + f(Norm(h))", group: pre }
    - { id: pout, kind: tensor, label: "h_ℓ", sub: "scale depends on increments and covariances", group: pre }
    - { id: qin, kind: tensor, label: "h_ℓ−1", sub: "[B, T, D]", group: post }
    - { id: qf, kind: process, label: "sub-block f", sub: "attention or FFN", group: post }
    - { id: qadd, kind: process, label: "residual add", sub: "h + f(h)", group: post }
    - { id: qn, kind: process, label: "chosen Norm (LayerNorm in P01)", sub: "P01 has gain and shift", group: post }
    - { id: qout, kind: tensor, label: "h_ℓ", sub: "epsilon and affine terms explicit", group: post }
  edges:
    - { from: pin, to: pn }
    - { from: pn, to: pf }
    - { from: pf, to: padd }
    - { from: pin, to: padd, kind: emphasis, label: "identity path, never rescaled" }
    - { from: padd, to: pout }
    - { from: qin, to: qf }
    - { from: qf, to: qadd }
    - { from: qin, to: qadd, label: "identity path" }
    - { from: qadd, to: qn, label: "gradient crosses the norm" }
    - { from: qn, to: qout }
  groups:
    - { id: pre, label: "pre-norm, Eq. 5.14 (reference)" }
    - { id: post, label: "post-norm, Eq. 5.13 (P01)" }
```

## Mechanism

### Methodology

Let J_f and J_N denote local Jacobians with respect to their inputs. Pre-normalization has Jacobian `I+J_f(N(h))*J_N(h)`; post-normalization has `J_N(h+f(h))*(I+J_f(h))`. Over a stack, the backward cotangent is multiplied by the transposes of these Jacobians in reverse order. An identity summand can provide a direct path while the complete product still changes derivative norms. Conversely, post-normalization's scale control does not alone prove that every gradient diverges. (MATHEMATICALLY-DERIVED by the chain rule.)

For RMSNorm, use column vectors, Gamma=diag(gamma), and r from Eq. 5.16. Direct differentiation gives

$$
J_{\mathrm{RMS}}(x)=\Gamma\left(r^{-1}I-\frac{xx^{\top}}{d r^3}\right).
$$
For LayerNorm define C=I-11^T/d and c=Cx. Its Jacobian is

$$
J_{\mathrm{LN}}(x)=\Gamma\left(r^{-1}C-\frac{cc^{\top}}{d r^3}\right).
$$
The centering projector removes the common-shift direction in LayerNorm. For unit gain, the radial eigenvalue of the RMSNorm core is epsilon/r^3, while directions orthogonal to x have eigenvalue1/r. At epsilon0 and nonzero x, the radial derivative vanishes; at small r, derivatives depend strongly on epsilon. A learned nonuniform gain further changes the singular values. These identities explain why normalization placement affects derivatives without making a distribution-free training claim. (MATHEMATICALLY-DERIVED.)

The exact per-coordinate variance of Eq. 5.15 is

$$
\operatorname{Var}(h_j)=\operatorname{Var}(h_0)+\sum_{k=1}^j\operatorname{Var}(\Delta_k)
+2\sum_{k=1}^j\operatorname{Cov}(h_0,\Delta_k)
+2\sum_{1\leq k<r\leq j}\operatorname{Cov}(\Delta_k,\Delta_r).
$$
Under the additional analytical conditions that every covariance displayed is 0 and each increment has variance sigma_f^2,

$$
\operatorname{Var}(h_j)=\operatorname{Var}(h_0)+j\sigma_f^2.
$$
*(Eq. 5.17)* The resulting square-root growth of standard deviation is conditional. Negative covariance can cancel increments; correlated increments can produce other growth. For example, two equal and opposite random increments leave the original state after two additions. It is therefore incorrect to assert that the qualitative growth survives arbitrary correlations.

Scaling each branch output by 1/sqrt(2L) changes its marginal variance by 1/(2L) under this analytical model, keeping the sum of independent increment variances bounded as L grows. Scaling a nonlinear branch's input weights is not automatically equivalent to scaling its output: which matrix is changed and the activation's homogeneity matter. GPT-2's initialization description establishes its chosen depth-dependent scaling; the variance argument here is a derived explanation under explicit conditions, not an experimentally verified account of every initialized checkpoint. (PAPER-REPORTED: R5.2 section 2.3; MATHEMATICALLY-DERIVED.)

R5.4's Theorem 1 uses a simplified single-head LayerNorm model, square d-by-d branch matrices, zero-initialized Q/K, Gaussian remaining initialization/input, bounded loss derivatives, and a stated concentration condition. Its high-probability last-FFN gradient bounds are O(d*sqrt(log d)) for post-LN and O(d*sqrt(log d/L)) for pre-LN. These are upper bounds at initialization, not exact gradient values, lower bounds against vanishing, or a theorem for arbitrary causal RMSNorm stacks. (PAPER-REPORTED: R5.4 section 3.3/Theorem 1.)

Two RMSNorm gains per block add2d parameters; a final gain adds d. Their reductions and elementwise scaling cost O(B*T*d) arithmetic per call. One separate forward call reads/writes its input/output arrays and reads its gain, but backward adds saved-state and reduction work. Fusion, cache reuse, precision, and recomputation determine actual traffic. Replacing LayerNorm with RMSNorm or sharing one normalization between parallel branches changes parameter/operation details; equal projection shapes alone do not imply equal total costs.

```figure
id: fig-5.18
kind: chart
title: Conditional residual standard deviation against additions
caption: >-
  This conditional zero-mean variance model sets all cross-covariances
  to zero and each increment variance to one. Scaling complete increments
  by 1/sqrt(24) changes the growth curve. The flat post-LayerNorm baseline
  additionally takes epsilon=0, unit gain, zero shift, and nonconstant inputs.
  These are analytical curves, not arbitrary Transformer predictions.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.17"
alt: >-
  Conditional standard-deviation curves over 24 additions: sqrt(1+l),
  sqrt(1+l/24), and an ideal unit-variance post-LayerNorm baseline. Endpoints
  are 5, sqrt(2), and 1. Covariance and ideal normalization conditions are
  explicit; no network initialization experiment is reported.
spec:
  type: line
  x: { label: "residual additions ℓ (2 per block)", scale: linear, format: integer, domain: [0, 24] }
  y: { label: "standard deviation,conditional zero-mean model", scale: linear, format: fixed2 }
  variables: { V0: 1, s2: 1, N: 24 }
  series:
    - { id: pre, label: "pre-norm, Eq. 5.17", formula: "sqrt(V0 + x*s2)", sample: { from: 0, to: 24, count: 25 }, emphasis: true }
    - { id: scaled, label: "complete increments scaled by1/sqrt(N)", formula: "sqrt(V0 + x*s2/N)", sample: { from: 0, to: 24, count: 25 } }
    - { id: post, label: "ideal post-LayerNorm,epsilon=0", formula: "1", sample: { from: 0, to: 24, count: 25 }, dashed: true }
  annotations:
    - { x: 24, label: "ℓ = N = 24: 5.0 · 1.41 · 1.0" }
```

```figure
id: fig-5.19
kind: calculator
title: Residual-stream variance at depth
caption: >-
  Eq. 5.17 requires zero cross-covariances and equal increment variance.
  The switch scales complete increments by 1/sqrt(N); it does not implement
  an arbitrary initializer through a nonlinear graph. Standard deviation is
  RMS only with zero mean. The ratio compares increment and stream scales,
  not causal contribution or share of total variance.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.17"
alt: >-
  Conditional variance V0+l*s2/N^s gives 25 without scaling or2 with
  scaling at V0=s2=1, l=N=24. Standard deviations are 5 and 1.414; increment
  SD divided by stream SD is 20% or14.4%. Covariances are set to zero by
  the analytical specification, not inferred from a network.
spec:
  tex: >-
    \mathrm{Var}[h_\ell] = \mathrm{Var}[h_0] + \ell\,\sigma_f^{2} / N^{s}
  equation: "5.17"
  inputs:
    - { symbol: V0, label: "Var[h_0]", default: 1, min: 0.25, max: 4, step: 0.25, format: fixed2 }
    - { symbol: s2, label: "σ_f² per sub-block", default: 1, min: 0.25, max: 4, step: 0.25, format: fixed2 }
    - { symbol: l, label: "residual additions ℓ", default: 24, min: 0, max: 192, step: 1, format: integer }
    - { symbol: N, label: "residual layers N = 2L", default: 24, min: 2, max: 192, step: 2, format: integer }
    - { symbol: s, label: "1/√N branch scaling, 0 off, 1 on", default: 0, min: 0, max: 1, options: [0, 1], format: integer }
  outputs:
    - { symbol: Var, label: "Var[h_ℓ]", formula: "V0 + l*s2/pow(N, s)", format: fixed2 }
    - { symbol: RMS, label: "standard deviation (RMS if zero mean)", formula: "sqrt(Var)", format: fixed2, emphasis: true }
    - { symbol: rel, label: "increment SD / stream SD", formula: "sqrt(s2/pow(N, s))/RMS", format: percent }
  presets:
    - { label: "scale complete increments by1/sqrt(N)", values: { s: 1 } }
    - { label: "96 blocks, ℓ = N = 192", values: { l: 192, N: 192 } }
```

```figure
id: fig-5.20
kind: memory-stack
title: Norm traffic against attention weight reads, per block
caption: >-
  A one-read/one-write model for two separately materialized RMSNorm calls
  gives 48 MiB of activation traffic at B=8, T=1024, d=768. Reading four BF16
  attention projection matrices once gives 4.5 MiB. These are logical traffic
  terms, not measured HBM bytes or latency; fusion, cache reuse, and extra
  reductions can change the traffic.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.16"
alt: >-
  Two stacked bars in bytes per block at B = 8, T = 1024, D = 768, 2 bytes
  per value. RMSNorm traffic: reads 2·B·T·D·b = 24 MiB plus writes
  2·B·T·D·b = 24 MiB, total 48 MiB. Attention projection weight reads:
  W_Q, W_K, W_V and W_O, 4·D²·b = 4.5 MiB.
spec:
  format: bytes
  variables: { B: 8, T: 1024, D: 768, b: 2 }
  bars:
    - label: "RMSNorm traffic per block"
      segments:
        - { label: "reads, 2 × B·T·D·b", kind: flow, formula: "2*B*T*D*b" }
        - { label: "writes, 2 × B·T·D·b", kind: flow, formula: "2*B*T*D*b" }
    - label: "attention weight reads per block"
      segments:
        - { label: "W_Q, W_K, W_V, W_O: 4·D²·b", kind: tensor, formula: "4*D^2*b" }
```

## Algorithm

```text
Algorithm 5.4 - Sequential residual block with declared normalization order
INPUT: h[B,T,d]; attention A; FFN F; independent norms N_a,N_f; ordering in {pre,post}
OUTPUT: h_next[B,T,d]
STATE: intermediate residual u[B,T,d]
INVARIANT: residual additions combine tensors of the same shape; normalization parameters are explicit
1. If ordering is pre, set u = h + A(N_a(h)), then h_next = u + F(N_f(u)).
2. Otherwise set u = N_a(h + A(h)), then h_next = N_f(u + F(u)).
3. Return h_next.
TERMINATION: two finite branch updates.
```

The same ordering is applied at every block unless configuration says otherwise. Dropout, residual coefficients, and final normalization must be specified separately. No invariant of exact unit RMS/variance is asserted for arbitrary epsilon, gain, bias, and finite precision. (MATHEMATICALLY-DERIVED.)

## Implementation

Pin epsilon numerically and record whether it sits inside the square root. In the inspected PyTorch 2.14 RMSNorm page, the omitted-epsilon default uses the computation/opmath type: fp16, bf16, fp32 inputs use float32 epsilon and fp64 inputs use float64 epsilon. The API's default is versioned information; it must not be generalized to an earlier release or used to infer every backend's internal reduction behavior. Gains are initialized to ones when affine parameters are enabled. (OFFICIAL-DOCUMENTATION: R5.14 Parameters.)

Residual storage and accumulation precision are independent configuration choices. Under round-to-nearest, a sufficiently small addition can round back to the previous representable value; the threshold is related to half a local ULP, with sign, exponent, and tie details. BF16 has 7 explicit fraction bits, so one fixed relative threshold is not valid for every residual value. FP32 residual storage can reduce absorption but increases bytes and does not prove a downstream quality improvement. A comparison must track branch increments, residual values, casts, and their error rather than infer a universal precision requirement from depth.

An add-norm fusion may avoid materializing an intermediate array, but its backward must preserve both the skip contribution and the normalized branch contribution. Different gain/bias conventions, centered versus uncentered formulas, and input/output cast points change the function or its numerical realization. The single-device reference has no normalization collective; a width-sharded normalization requires an appropriate distributed reduction, treated in 29.2. No fusion or timing is attributed to an uninspected release.

## Experimental design

### Reported experiments

R5.4 tests warm-up and ordering on translation and BERT pretraining. Its initialization checks repeat configurations with ten seeds and compare depth-dependent gradient statistics; its training comparisons use validation loss/BLEU or the reported downstream protocol. The initialization theorem and training results establish different claims. They do not justify removing warm-up from every pre-normalized model. (PAPER-REPORTED: R5.4 sections 3.2-4/AppendixA.)

R5.10 derives residual/initialization coefficients and evaluates deep encoder-decoder translation models against source-defined baselines. Its large-depth result concerns that joint design and training setup, rather than a proof that changing only normalization order permits arbitrary depth. The controlled scaling and downstream evidence are developed in 13.4. (PAPER-REPORTED: R5.10 sections 3-4.)

## Observations

**What the paper claims.** R5.4 gives initialization-gradient bounds in its stated model and reports corresponding optimization experiments. R5.2 and R5.8 document architecture choices; R5.10 combines residual modification and initialization for deep training. (PAPER-REPORTED.)

**What the evidence shows.** The exact Jacobians and covariance expansion distinguish algebraic properties from distributional conditions. R5.4's restricted theorem does not automatically transfer from LayerNorm and its special initialization to the chapter's causal RMSNorm/GELU reference. (MATHEMATICALLY-DERIVED; PAPER-REPORTED.)

**What we infer.** A stability comparison must change and record ordering, normalization formula, residual coefficients, initialization, precision, and optimizer schedule separately. Combining them into one label conceals which intervention produced a reported outcome. (DERIVED.)

**What remains unknown.** The reference has not been trained or profiled. Its learned covariance structure, numerical error, useful warm-up length, and downstream quality therefore remain unverified. Undisclosed model coefficients are not reconstructed by assumption. (UNVERIFIED; NOT-DISCLOSED.)

## Failure modes

An epsilon-placement or gain/bias mismatch can produce systematic output differences while preserving weight shapes. Compare norm outputs and Jacobian-vector products over ordinary, low-norm, and constant-channel inputs. A missing final norm changes the specified reference function; unusually large logits can motivate inspection, but they are not a necessary consequence for every alternative architecture.

Residual rounding can suppress an increment even when its gradient is nonzero. Compare the stored update against a higher-precision sum at the actual residual magnitude, then examine how the discrepancy accumulates. Merely observing small branch increments does not establish that rounding changed a task outcome.

A variance-growth check can fail because the increments are correlated, have nonzero means, or differ in marginal scale. The covariance expansion distinguishes these cases; a departure from Eq. 5.17 does not falsify the exact residual equations. Similarly, unstable training after removing warm-up does not contradict a theorem limited to initialization and different premises. These are proposed diagnostics, not executed results.

## Siblings

Sequential pre-normalized and post-normalized branches differ in Jacobian ordering. LayerNorm and RMSNorm differ in centering and shift invariance. Residual-scaled variants change the size of a branch or skip contribution and may pair it with a specific initialization. These interventions should not be presented as a single mechanism.

A parallel block lets attention and FFN read the same incoming normalized state, rather than letting FFN read the attention-updated residual. PaLM documents such an architecture in R5.9; its isolated function is therefore different from Eq. 5.2. The detailed architecture comparison belongs to13.4. Reusing an architecture report as evidence of an unconditional speedup would omit its execution and quality conditions. (PAPER-REPORTED: R5.9 section 2.)

```figure
id: fig-5.21
kind: compare
title: Residual orderings at initialisation
caption: >-
  Order, norm type, initialization, and topology are separate design choices.
  Xiong's initialization bounds apply to its restricted model; they do not
  prove warmup is always removable. Variance formulas need their covariance
  conditions. A final norm is part of this reference, not mandatory for every
  pre-norm architecture. DeepNorm differs from simple pre-norm branch scaling.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.13", "DERIVED:eq-5.14", "DERIVED:eq-5.17", R5.2, R5.4, R5.9, R5.10]
alt: >-
  Comparison of residual equations and Jacobian paths: post-norm normalizes
  the sum; pre-norm adds f(Norm(h)); the scaled analytical variant scales each
  complete increment; a parallel block makes branches read the same input.
  Variance, quality, and latency need additional source-specific conditions.
spec:
  axis: >-
    Scale of the residual stream and of gradients at initialisation, and
    per-block cost, at fixed D and L; trained quality is not an axis here
  columns:
    - { id: post, label: "Post-norm (P01)", node: ms.section.5.4 }
    - { id: pre, label: "Pre-norm (reference)", node: ms.section.5.4 }
    - { id: scaled, label: "Residual-scaled pre-norm", node: ms.section.13.4 }
    - { id: par, label: "Parallel block (PaLM)", node: ms.section.13.4 }
  rows:
    - { dimension: "block equation", values: { post: "h ← Norm(h + f(h))", pre: "h ← h + f(Norm(h))", scaled: "h ← h + f(Norm(h)), complete branch output scaled by1/sqrt(N)", par: "y = x + MLP(Norm(x)) + Attention(Norm(x))" } }
    - { dimension: "Var[h_ℓ] at initialisation", values: { post: "input variance/(input variance+epsilon),before affine terms", pre: "Eq5.17 only under zero-covariance/equal-variance conditions", scaled: "conditional variance with complete increments scaled by1/sqrt(N)", par: "not derived here (§13.4)" } }
    - { dimension: "gradient path", values: { post: "through the norm's Jacobian at every block", pre: "identity path untouched", scaled: "identity path untouched", par: "identity path untouched" } }
    - { dimension: "reported at initialisation", values: { post: "restricted-model gradient upper bound;source training protocol", pre: "restricted initialization bound;source-specific warmup experiments", scaled: "conditional scaled-increment model;distinct from DeepNorm", par: "not analysed at initialisation here" } }
    - { dimension: "final norm", values: { post: "architecture-specific", pre: "included in this reference", scaled: "architecture-specific", par: "not derived here" } }
    - { dimension: "parameters and GEMM FLOPs", values: { post: "norm type and affine terms must match for cost comparison", pre: "identical", scaled: "identical", par: "one norm per block; the two input GEMMs fuse" } }
    - { dimension: "extra constant to record", values: { post: "none", pre: "none", scaled: "depth-dependent initialisation scale", par: "none" } }
    - { dimension: "new failure mode", values: { post: "warm-up length as an untracked hyperparameter", pre: "missing final norm; BF16 absorption at depth", scaled: "an extra depth-dependent constant that must be recorded", par: "quality sensitivity at small scale (R5.9)" } }
```

## Extensions

### Improvements

The historical progression includes post-LayerNorm in P01, pre-LayerNorm plus a final norm and depth-aware initialization in GPT-2, and pre-RMSNorm in LLaMA. These reports document specific designs rather than an experimentally established universal ordering. DeepNorm modifies residual weighting together with initialization; its depth result belongs to that complete method. (PAPER-REPORTED: P01; R5.2; R5.8; R5.10.)

Adding a residual gate, changing the normalization statistic, or distributing a channel reduction changes the derivative and resource account. The Jacobian and covariance analysis provides a way to state those changes before comparing source-reported training results. Analytical variance control, measured optimizer stability, and final task performance remain separate evaluation axes.

## Limitations

Local Jacobians do not alone characterize the singular values of their full trained product. The independent-increment variance model is a declared analytical special case and is not inferred from the residual architecture. Source initialization theorems retain their architecture, distribution, concentration, and loss premises. Learned gains, finite epsilon, correlated increments, mixed precision, and optimizer dynamics can change behavior beyond those premises.

## Reproducibility

Record normalization type, gain/bias, epsilon and placement, branch order, final norm, residual coefficients, the initialization of each matrix, and all cast points. Initialization studies require the stated random distribution and a clear definition of the measured gradient statistic; training studies additionally require optimizer/schedule and task evaluation. Source locators are in [references.md](references.md). The book's variance, Jacobian, and full-training verification proposals remain unexecuted.

## References

P01 · R5.2 · R5.3 · R5.4 · R5.8 · R5.9 · R5.10 · R5.11 · R5.14 · [references.md](references.md)
