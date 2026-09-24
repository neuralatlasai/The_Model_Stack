---
id: ms.section.13.4
entity_type: section
title: Normalization and residuals
short_title: Normalization and residuals
section: 13.4
slug: 13-4-normalization-and-residuals
parent: ms.chapter.13
prev_sibling: ms.section.13.3
next_sibling: ms.section.13.5
children: []
prerequisites: [ms.chapter.5, ms.chapter.10, ms.section.13.3]
downstream: [ms.chapter.14, ms.chapter.19, ms.chapter.21]
word_count_target: 1800
volume: 1
part: 3
chapter: 13
related: []
relations: []
axes: {lifecycle: [pretraining, inference], mechanism: [dense_architecture, parameter_allocation], feedback_setting: [], modality: [text]}
papers: [P01, P02]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core, impl.nvidia-transformer-engine]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 13.4 Normalization and residuals

## Scope

**KNOWN — chapter matrix.** This section analyzes LayerNorm, RMSNorm, pre/post-norm ordering, residual scaling, and signal/gradient propagation. The basic pre/post-norm definitions belong to [§5.4](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/05-4-residual-organization.md). This treatment derives the operators' invariances and Jacobians and separates them from empirical training-stability claims.

## Why this exists

**DERIVED.** Normalization can contain few parameters while controlling every residual branch's input scale. Its significance is therefore poorly represented by its fraction of total parameters. Changing normalization placement changes the Jacobian traversed by gradients even when matrix shapes remain unchanged.

**DERIVED.** Implementation differences can also invalidate an apparently small ablation. Centering, epsilon placement, accumulation precision, affine bias, and residual-add precision all affect the numerical map. A replacement that silently changes several of these cannot isolate “LayerNorm versus RMSNorm.”

## Intuition

**DERIVED.** LayerNorm removes the component along the constant vector before rescaling the remaining vector. RMSNorm rescales the complete vector without removing that component. Their distinction is geometric. It is not equivalent to “one normalizes and the other does not,” nor does removing a reduction prove a fixed speedup.

**DERIVED.** A residual connection provides an additive identity contribution to the local Jacobian. A normalization after the sum transforms that contribution; a normalization inside the branch leaves a direct identity term in the local derivative. A direct term does not guarantee that a product of many block Jacobians remains well-conditioned.

## Formulation

**MATHEMATICALLY-DERIVED — normalization maps, corresponding to [R13.4](references.md#r134), [R13.5](references.md#r135).** For $h\in\mathbb{R}^{d}$, define $\mu=d^{-1}\sum_i h_i$, $c=h-\mu\mathbf{1}$, $s=(d^{-1}\|c\|^2+\epsilon)^{1/2}$, and $r=(d^{-1}\|h\|^2+\epsilon)^{1/2}$, with $\epsilon>0$. Then

$$
\operatorname{LN}(h)=g\odot c/s+u,\qquad
\operatorname{RMS}(h)=g\odot h/r.
$$
*(Eq. 13.10)*

where $g\in\mathbb{R}^d$ is learned gain and $u\in\mathbb{R}^d$ is the LayerNorm affine offset in this chosen convention. An implementation may omit the offset or add one to an RMS variant; record the actual map.

**MATHEMATICALLY-DERIVED — local derivatives.**

$$
J_{\mathrm{LN}}=
\operatorname{diag}(g)
\left(\frac{P}{s}-\frac{cc^\top}{ds^3}\right),
\quad
J_{\mathrm{RMS}}=
\operatorname{diag}(g)
\left(\frac{I}{r}-\frac{hh^\top}{dr^3}\right),
\quad
P=I-\frac{\mathbf{1}\mathbf{1}^\top}{d}.
$$
*(Eq. 13.11)*

where $I$ is the identity matrix and $J$ differentiates outputs with respect to input coordinates. These formulas use the population second moment, not a sample-variance correction.

<details><summary>Derivation of Eq. 13.11</summary>

**MATHEMATICALLY-DERIVED.** For RMS normalization, differentiate $h/r$: the direct derivative is $I/r$, and $\nabla_h r=h/(dr)$ gives the subtraction $hh^\top/(dr^3)$. Multiply on the left by the gain diagonal. For LayerNorm, $c=Ph$ and $Pc=c$; replacing the direct identity by $P$ and the radial vector by $c$ gives the stated expression. The affine offset contributes zero derivative with respect to input.

</details>

**MATHEMATICALLY-DERIVED — residual ordering.** For a branch $f_\ell$, scale $a_\ell$, and normalization $n_\ell$,

$$
J_{\mathrm{pre}}=I+a_\ell J_{f_\ell}J_{n_\ell},
\qquad
J_{\mathrm{post}}=
J_{n_\ell}\left(I+a_\ell J_{f_\ell}\right).
$$
*(Eq. 13.12)*

where each Jacobian is evaluated at the correct intermediate input. The factors cannot be freely reordered.

**MATHEMATICALLY-DERIVED — coordinate variance identity.**

$$
\operatorname{Var}(h_i+a_\ell f_i)=
\operatorname{Var}(h_i)+a_\ell^2\operatorname{Var}(f_i)
+2a_\ell\operatorname{Cov}(h_i,f_i).
$$
*(Eq. 13.13)*

where variance is over a specified input or initialization distribution. Ignoring the covariance is an additional mathematical condition, not an observed property of a trained network.

~~~figure
id: fig-13.12
kind: calculator
title: Residual-variance accounting
caption: Eq. 13.13 exposes the covariance term. Inputs describe an illustrative scalar distribution, not measured activations.
placement: rail
anchor: formulation
states:
  - {anchor: formulation, label: "Uncorrelated example", variables: {vh: 1, vf: 1, a: 0.1, cov: 0}, note: "The illustrative moment specification gives variance 1.01."}
  - {anchor: mechanism, label: "Positive covariance", variables: {vh: 1, vf: 1, a: 0.1, cov: 0.5}, note: "Admissible positive covariance gives variance 1.11."}
  - {anchor: failure-modes, label: "Negative covariance", variables: {vh: 1, vf: 1, a: 0.1, cov: -0.5}, note: "Admissible negative covariance gives variance 0.91; zero covariance cannot be presumed."}
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-13.13
alt: Unit stream variance, unit branch variance, zero covariance, and branch scale 0.1 give updated variance 1.01.
spec:
  tex: v_{\mathrm{next}}=v_h+a^2v_f+2a c_{hf}
  equation: "13.13"
  inputs:
    - {symbol: vh, label: stream variance, default: 1, min: 0, max: 100, format: fixed3}
    - {symbol: vf, label: branch variance, default: 1, min: 0, max: 100, format: fixed3}
    - {symbol: a, label: branch scale, default: 0.1, min: 0, max: 2, format: fixed3}
    - {symbol: cov, label: covariance, default: 0, min: -100, max: 100, format: fixed3}
  outputs:
    - {symbol: vn, label: updated variance, formula: vh+a^2*vf+2*a*cov, format: fixed3}
~~~

**MATHEMATICALLY-DERIVED.** Admissible moment inputs satisfy $|c_{hf}|\le\sqrt{v_hv_f}$. An instrument setting that violates this bound does not describe a probability distribution and must not be interpreted as one.

## Mechanism

**MATHEMATICALLY-DERIVED.** LayerNorm is exactly invariant to adding a constant to every input coordinate in exact arithmetic because $P(h+c_0\mathbf{1})=Ph$. RMSNorm is generally not. On inputs with a nonzero corresponding second moment, both maps have exact positive-rescaling invariance when epsilon is zero and affine parameters are fixed. With fixed positive epsilon, scaling the input changes epsilon's relative contribution; finite-precision arithmetic introduces a separate discrepancy.

**MATHEMATICALLY-DERIVED.** Before the gain diagonal, RMS normalization has eigenvalue $1/r$ in directions orthogonal to $h$ and $\epsilon/r^3$ in the radial direction. LayerNorm additionally annihilates the constant-vector direction. For a constant nonzero input, centered LayerNorm returns its affine offset, while RMSNorm retains a scaled constant component. This fixture distinguishes the mechanisms without any training experiment.

**PAPER-REPORTED — [R13.6](references.md#r136).** Xiong et al. analyze normalization placement under a mean-field initialization framework and relate it to warm-up behavior. **DERIVED.** That result motivates examining Eq. 13.12; it does not justify removing warm-up from every pre-norm architecture, optimizer, or scale.

~~~figure
id: fig-13.13
kind: compare
title: Normalization geometry under a declared convention
caption: The comparison follows Eq. 13.10. Positive epsilon weakens exact scale invariance; neither column claims universal optimization superiority.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: [DERIVED:eq-13.10, DERIVED:eq-13.11]
alt: LayerNorm centers and rescales with gain and offset, whereas the chosen RMSNorm rescales without centering and has gain only. Both need explicit epsilon and reduction precision.
spec:
  axis: Per-token normalization over residual coordinates
  columns:
    - {id: ln, label: LayerNorm}
    - {id: rms, label: RMSNorm}
  rows:
    - {dimension: centering, values: {ln: "subtract coordinate mean", rms: "none"}}
    - {dimension: second moment, values: {ln: "centered", rms: "uncentered"}}
    - {dimension: affine parameters, values: {ln: "2d in stated convention", rms: "d in stated convention"}}
    - {dimension: constant-shift invariance, values: {ln: "yes in exact arithmetic", rms: "generally no"}}
    - {dimension: stability controls, values: {ln: "epsilon and reduction dtype", rms: "epsilon and reduction dtype"}}
~~~

**DERIVED.** Residual scaling can control a simplified variance model without proving training stability. If branch covariances vanish and every branch has fixed variance, scaling $n_{\mathrm{branch}}$ additions by $1/\sqrt{n_{\mathrm{branch}}}$ keeps their summed variance contribution constant. Learned branches are correlated and their variance changes with training; the simplified result is a design hypothesis to inspect, not an empirical law.

**PAPER-REPORTED — [R13.17](references.md#r1317).** DeepNet studies a coupled residual-normalization and initialization design for deep Transformers. **DERIVED.** Its existence reinforces the need to evaluate scaling and initialization jointly. The chapter does not transplant a coefficient from one architecture into another without reconstructing its conditions.

**DERIVED.** The total gradient is a product of local Jacobians. Norm bounds can grow or decay with depth even when every block contains an identity contribution, and nonnormal matrices can amplify directions transiently. Monitoring only the residual RMS misses directional conditioning. Proposed diagnostics include branch-to-stream RMS ratios, layerwise gradient norms, and Jacobian-vector sensitivity on bounded fixtures.

**PAPER-REPORTED — [R13.16](references.md#r1316).** The 2025 Dynamic Tanh work investigates replacing normalization with a learned elementwise transformation. **DERIVED.** This is an alternative branch for controlled evaluation, not evidence that normalization is obsolete. An elementwise replacement changes the cross-coordinate Jacobian structure of Eq. 13.11, so “drop-in” compatibility of shapes does not establish functional equivalence.

## Algorithm

**MATHEMATICALLY-DERIVED — global propagation boundary.** Across a stack, the total input Jacobian is an ordered product of local block Jacobians. The identity term in each pre-norm block does not make that product an identity or guarantee bounded singular values: branch derivatives can reinforce or oppose one another, and their singular directions need not align. Likewise, a small scalar residual coefficient does not by itself bound a branch derivative. The local formulas support targeted diagnostics, but a depth-stability argument needs conditions on initialization, branch maps, and the distribution of states. A final normalization after the stack contributes another Jacobian outside those block products.

**DERIVED — proposed normalization audit.**

~~~text
Algorithm 13.4 — Separate geometry, numerics, and training behavior
INPUT: normalization equation; residual ordering; explicit epsilon and dtype
OUTPUT: Result(operator audit and experiment configuration, contract error)
STATE: bounded test vectors and Jacobian-vector comparisons
INVARIANT: each comparison changes one declared mathematical or numerical factor
1. Validate normalized axes, affine parameters, epsilon placement, and ordering.
2. Evaluate constant, zero, shifted, rescaled, and large-magnitude vectors.
3. Compare analytical Jacobian-vector products with a high-precision reference.
4. Check branch and residual-add dtypes separately from normalization reduction.
5. Repeat the operator checks after fusion with identical mathematical settings.
6. Evaluate stability only through a separately specified training experiment.
~~~

**DERIVED — complexity.** Normalization and a Jacobian-vector product can each be computed in $O(d)$ time per token using reductions and elementwise operations. The dense $d\times d$ Jacobian is a derivation aid, not a production allocation. Across $BT$ tokens, work is $O(BTd)$ and reduction traffic can dominate its runtime despite low parameter count.

## Implementation

**OFFICIAL-DOCUMENTATION — [R13.7](references.md#r137), [R13.11](references.md#r1311).** The inspected PyTorch 2.14 pages define normalization axes and epsilon-related behavior. **DERIVED.** Set epsilon explicitly in a reproduction; do not inherit a moving default. PyTorch belongs to *Model / autograd framework*, NVIDIA Transformer Engine to *Kernels / numerics / collectives*, and Hugging Face Transformers to *Model definition / adaptation*. Inspect the resolved fused path rather than assuming their defaults agree.

**DERIVED.** Squaring large low-precision inputs can overflow before a stable mean is formed; retaining a high-precision accumulator does not repair an already overflowed low-precision square. Record operation promotion, not only final output dtype. Numerical equivalence requires the reference to match epsilon placement and affine convention.

## Experimental design

**PROPOSAL — no measurements reported.**

### Experiment 13.4 — Normalization and residual scaling under depth

- **Hypothesis:** placement and scaling interact with depth and optimizer settings.
- **Setup:** factorial study of normalization, pre/post ordering, and declared branch scaling.
- **Independent variables:** depth, normalization, residual coefficient, initialization, and warm-up.
- **Controlled variables:** parameter budget reporting, data, optimizer search budget, precision, and target tokens.
- **Dataset/workload:** fixed training corpus with independent validation and bounded operator fixtures.
- **Hardware:** record runtime, fused operators, reduction dtype, and device.
- **Metrics:** finite outputs, operator/gradient error, branch RMS, gradient norms, loss trajectory, and failure incidence.
- **Baselines:** fixed reference ordering and explicit unfused operators.
- **Expected result:** geometric fixtures obey Eq. 13.10; training differences remain empirical.
- **Ablation:** change epsilon alone before attributing differences to normalization family.
- **Interpretation:** distinguish initialization theory from long-run learned behavior.
- **Threats to validity:** coupled hyperparameter changes and unreported precision promotion.

## Observations

**What the paper claims.** **PAPER-REPORTED.** R13.5 proposes RMS-based normalization; R13.6 analyzes placement; R13.17 studies depth-oriented scaling.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** Centering and ordering change the exact local Jacobians.

**What we infer.** **DERIVED.** Small parameter differences can conceal substantial propagation changes.

**What remains unknown.** **UNVERIFIED.** Stability and quality of a newly composed normalization recipe require controlled training.

## Failure modes

~~~figure
id: fig-13.14
kind: stat-panel
title: Normalization derivative invariants
caption: Directional eigenvalues refer to the normalization core before gain, using population moments and positive epsilon.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-13.11
alt: Directional eigenvalues refer to the normalization core before gain, using population moments and positive epsilon.
spec:
  header: ACCOUNTING BOUNDARY
  rows:
    - {key: "LayerNorm constant direction", value: "zero"}
    - {key: "RMSNorm radial direction", value: "epsilon / r^3"}
    - {key: "RMSNorm tangent direction", value: "1 / r"}
    - {key: "zero-input fixture", value: "positive epsilon required"}
~~~

> **Failure mode — epsilon mismatch.** **DERIVED.** *Symptom:* converted models disagree near low-variance inputs. *Cause:* different epsilon or placement. *Detection:* constant and near-zero fixtures. *Mitigation:* serialize explicit settings.

> **Failure mode — covariance omitted.** **DERIVED.** *Symptom:* predicted residual growth disagrees with recorded activations. *Cause:* independence approximation applied to correlated branches. *Detection:* estimate the covariance term on the stated population. *Mitigation:* report the full variance identity.

## Siblings

**DERIVED.** LayerNorm and RMSNorm change normalization geometry; pre/post ordering changes placement; residual scaling changes branch magnitude; Dynamic Tanh changes the operator family. They are separate intervention axes. [§13.3](13-3-feed-forward-alternatives.md) changes the branch function and can interact with each.

## Extensions

**DERIVED.** Multimodal branches may have different scale distributions. Per-branch monitoring is more informative than one aggregate activation norm. Very deep models require accounting for the number of residual additions, not merely the count of named blocks.

## Limitations

**DERIVED.** Local Jacobians characterize a specified input and parameter point. They do not establish a global convergence theorem. The scalar moment illustration is conditional and does not claim independent learned branches.

## Reproducibility

**DERIVED — required record.** Preserve normalized axes, population-moment convention, affine tensors, epsilon, residual order, branch coefficients, initialization, reduction/elementwise/addition dtypes, and fusion settings.

## References

[R13.4](references.md#r134); [R13.5](references.md#r135); [R13.6](references.md#r136); [R13.7](references.md#r137); [R13.11](references.md#r1311); [R13.14](references.md#r1314); [R13.16](references.md#r1316); [R13.17](references.md#r1317).
