---
id: ms.section.13.3
entity_type: section
title: Feed-forward alternatives
short_title: Feed-forward alternatives
section: 13.3
slug: 13-3-feed-forward-alternatives
parent: ms.chapter.13
prev_sibling: ms.section.13.2
next_sibling: ms.section.13.4
children: []
prerequisites: [ms.chapter.5, ms.chapter.10, ms.section.13.2]
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

# 13.3 Feed-forward alternatives

## Scope

**KNOWN — chapter matrix.** This section compares GELU feed-forward blocks, GLU variants, SwiGLU, expansion ratios, activation retention, and fused execution. The elementary position-wise block is defined in [§5.3](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/05-3-feed-forward-computation.md). Here the focus is a controlled change in nonlinear parameterization, with width and execution costs held to explicit budgets.

## Why this exists

**DERIVED.** Replacing a two-matrix feed-forward block with a gated block at the same hidden width adds a third projection. A quality improvement under that substitution can therefore reflect both the mechanism and increased parameters or compute. A useful comparison must decide whether it matches hidden width, parameters, matrix FLOPs, memory, or wall time; those controls do not all coincide.

**DERIVED.** Even after matrix parameters are matched, a gated block produces two projected activation streams before multiplication. Fusion can reduce temporary traffic, but training may still need values for backward or recompute them. The hidden width alone does not determine peak memory.

## Intuition

**DERIVED.** A gated block computes two input-dependent quantities and combines them elementwise. One is conventionally called a gate, but SwiGLU's gate is not restricted to a probability interval. The name describes multiplication, not a probabilistic selection of hidden units or a sparse-expert router.

**DERIVED.** The design question is whether this multiplicative interaction improves the useful function class and optimization behavior enough to justify its complete executed cost. Parameter matching removes one confound; it does not answer that question automatically.

## Formulation

> **Definition — Projection-matched feed-forward comparison.** A comparison equating parameters of the chosen feed-forward projection matrices; activation work, retained state, biases, and execution costs remain separate controls.

**MATHEMATICALLY-DERIVED — generalized form, following [R13.2](references.md#r132).** For a row vector $h\in\mathbb{R}^{d}$, define the bias-free two-matrix and gated alternatives as

$$
f_{\mathrm{plain}}(h)=\phi(hW_u)W_d,\qquad
f_{\mathrm{gated}}(h)=
\left[\psi(hW_g)\odot(hW_v)\right]W_d.
$$
*(Eq. 13.7)*

where $W_u\in\mathbb{R}^{d\times f_0}$ and the plain $W_d\in\mathbb{R}^{f_0\times d}$; the gated $W_g,W_v\in\mathbb{R}^{d\times f_g}$ and $W_d\in\mathbb{R}^{f_g\times d}$. The two uses of $W_d$ denote alternative parameter objects.

**MATHEMATICALLY-DERIVED — matching projection parameters.**

$$
N_{\mathrm{plain}}=2df_0,\quad
N_{\mathrm{gated}}=3df_g,\quad
f_g=\frac{2}{3}f_0.
$$
*(Eq. 13.8)*

where equality is exact only when dimensions are integral and biases are absent. If $f_0=4d$, the algebraic matched gated width is $8d/3$. This is a matching construction, not proof of an optimal expansion ratio.

**MATHEMATICALLY-DERIVED — projected activation storage.** Under a deliberately simple retention model storing the preactivations required by an unfused backward,

$$
M_{\mathrm{plain,proj}}=bBTf_0,\qquad
M_{\mathrm{gated,proj}}=2bBTf_g.
$$
*(Eq. 13.9)*

where $B,T$ are batch and sequence dimensions and $b$ is bytes per stored activation. At Eq. 13.8's width match, the second quantity is $4/3$ of the first. Inputs, outputs, nonlinear outputs, gradient buffers, allocator overhead, and recomputation policy are excluded.

~~~figure
id: fig-13.9
kind: calculator
title: Matched feed-forward projection capacity
caption: Eq. 13.8 derives the bias-free match. Fractional widths indicate that an actual implementation must choose and report an integer rounding rule.
placement: rail
anchor: formulation
states:
  - {anchor: formulation, label: "Exact projection match", variables: {d: 1536, f0: 6144}, note: "The matched gated width is 4096 under the bias-free equation."}
  - {anchor: mechanism, label: "Double both dimensions", variables: {d: 3072, f0: 12288}, note: "Projection equality persists, but it does not imply equal activation storage."}
  - {anchor: failure-modes, label: "Baseline exclusions", variables: {d: 1536, f0: 6144}, note: "Biases, alignment, fusion, and saved intermediates need separate accounting."}
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-13.8
alt: At residual width 1536 and plain hidden width 6144, the matched gated width is 4096 and both projection sets contain 18,874,368 parameters.
spec:
  tex: f_g=2f_0/3,\quad N=2df_0
  equation: "13.8"
  inputs:
    - {symbol: d, label: residual width, default: 1536, min: 64, max: 16384, format: integer}
    - {symbol: f0, label: plain hidden width, default: 6144, min: 64, max: 65536, format: integer}
  outputs:
    - {symbol: fg, label: algebraic gated width, formula: 2*f0/3, format: fixed3}
    - {symbol: Nff, label: matched projection parameters, formula: 2*d*f0, format: params}
~~~

## Mechanism

**PAPER-REPORTED — [R13.2](references.md#r132), §2.** Shazeer compares GLU-family feed-forward variants and reduces hidden width by a factor of two-thirds to control projection parameters and computation. **DERIVED.** That control motivates Eq. 13.8, but it leaves elementwise operations and actual kernel execution as separate costs.

**PAPER-REPORTED — [R13.3](references.md#r133).** GELU uses the input multiplied by a Gaussian cumulative probability. **OFFICIAL-DOCUMENTATION — [R13.8](references.md#r138).** PyTorch's GELU interface distinguishes the default formulation from a tanh approximation. **DERIVED.** Comparing checkpoints or gradients requires the approximation choice to be explicit; equal activation names in configuration do not guarantee identical numerical functions.

**DERIVED — gate alternatives.** Substituting sigmoid, ReLU, GELU, or $z\,\sigma(z)$ for $\psi(z)$ yields sigmoid-GLU, ReGLU, GEGLU, or SwiGLU within Eq. 13.7. Sigmoid gates are bounded between zero and one; the others have different ranges and derivatives. A bilinear variant uses an identity gate. Their shared three-matrix topology makes them mechanism siblings, but their optimization and saturation behavior differ.

~~~figure
id: fig-13.10
kind: diagram
title: Two projected streams in a gated block
caption: The gate and value projections share the input but have independent parameters; fusion can combine execution without identifying the weights.
placement: inline
evidence: DERIVED
source: DERIVED:eq-13.7
alt: A residual vector feeds independent gate and value projections. The gate receives a nonlinearity, the streams multiply elementwise, and a down projection restores residual width.
spec:
  direction: LR
  nodes:
    - {id: h, kind: tensor, label: residual input, sub: "[B, T, d]"}
    - {id: gate, kind: process, label: gate projection}
    - {id: act, kind: process, label: gate nonlinearity}
    - {id: val, kind: process, label: value projection}
    - {id: mul, kind: process, label: elementwise product, sub: "[B, T, fg]"}
    - {id: down, kind: process, label: down projection}
    - {id: out, kind: tensor, label: residual-width output, sub: "[B, T, d]"}
  edges:
    - {from: h, to: gate}
    - {from: gate, to: act}
    - {from: h, to: val}
    - {from: act, to: mul}
    - {from: val, to: mul}
    - {from: mul, to: down}
    - {from: down, to: out}
~~~

**MATHEMATICALLY-DERIVED.** The matrix forward cost is $4BTdf_0$ for the plain block and $6BTdf_g$ for the gated block. They match at Eq. 13.8. Elementwise work remains $O(BTf)$ with a nonlinearity-dependent constant. For SwiGLU, evaluating sigmoid and multiplying by its argument is additional work; counting each transcendental operation as one hardware FLOP does not provide a reliable latency estimate.

**DERIVED.** Bias terms break the simple exact match. A plain block with two affine projections adds $f_0+d$ biases. A gated block with three adds $2f_g+d$. If a comparison includes biases, record the residual mismatch or solve the full integer budget. Likewise, padding $f_g$ to an alignment multiple changes stored and executed dimensions even if the nominal formula remains $8d/3$.

**DERIVED.** Fusion operates at several levels. Concatenating gate and value weights into one larger projection can compute both streams in one matrix multiplication without changing the function. Fusing the nonlinearity with multiplication can avoid writing an intermediate gate output. Fusing normalization with a projection can eliminate additional memory traffic. None of these facts implies that all intermediate tensors disappear from training state: backward requirements and kernel recomputation determine retention.

**DERIVED.** Backward explains the memory sensitivity. If $u=hW_g$, $v=hW_v$, and $z=\psi(u)\odot v$, then $\partial z/\partial v$ depends on $\psi(u)$ and $\partial z/\partial u$ depends on $v\psi'(u)$. A backend can retain values, retain sufficient transformed values, or recompute them. The choice exchanges memory for additional work. Eq. 13.9 names one explicit policy so its ratio is not mistaken for a universal training-memory multiplier.

**DERIVED.** A width sweep must also respect residual mixing. The down projection maps every expanded channel back into a shared residual space. Increasing expansion does not increase the width of that interblock space. Treating the hidden expansion as an equivalent increase in model width ignores attention and vocabulary effects described in adjacent sections.

## Algorithm

**DERIVED — gradient retention.** For a gated intermediate written as a product of a gate output and a value projection, the gradient of either factor depends on the other factor. A backward schedule can retain those factors, retain enough inputs to reconstruct them, or recompute projections. These choices trade live storage against extra arithmetic and reads. Eq. 13.9 isolates one declared retention boundary; it is neither a universal lower bound nor an estimate of total training memory. A fusion claim must specify which intermediate writes disappear and which values remain available to backward before a memory saving can be inferred.

**DERIVED — proposed matched-block audit.**

~~~text
Algorithm 13.3 — Audit an FFN substitution
INPUT: baseline block; alternative gate; candidate aligned widths; execution policy
OUTPUT: Result(cost-matched candidate records, configuration error)
STATE: parameter, forward-work, and retained-tensor inventories
INVARIANT: parameter matching and execution matching remain separate claims
1. Record baseline matrices, biases, activation, and exact hidden width.
2. Derive the algebraic gated match and enumerate nearby supported integer widths.
3. Count unique parameters including biases and padding.
4. Trace gate/value/product shapes for each candidate.
5. Record which tensors backward saves and which it recomputes.
6. Compare unfused and fused implementations against the same mathematical function.
7. Report budget residuals, numerical differences, and measured costs separately.
~~~

**DERIVED — complexity.** Per-token forward projection work is linear in the number of stored dense matrix parameters used by that token. Accounting over $n_{\mathrm{cand}}$ bounded candidates takes $O(n_{\mathrm{cand}})$ scalar evaluations; actual matrix computation follows the expressions above. An exhaustive search over arbitrary graph rewrites is unnecessary for this controlled substitution.

## Implementation

**OFFICIAL-DOCUMENTATION — [R13.14](references.md#r1314).** NVIDIA Transformer Engine's official repository documents Transformer-oriented execution components, and its inspected example exposes a LayerNormMLP integration point. Its stack layer is *Kernels / numerics / collectives*. This does not establish a particular fusion or precision path for every shape.

**DERIVED.** PyTorch (*Model / autograd framework*) provides the unfused reference operators. Hugging Face Transformers (*Model definition / adaptation*) exposes model-specific activation and intermediate-width configuration [R13.10](references.md#r1310). Resolve gate ordering, weight concatenation order, bias settings, and activation approximation before moving weights between implementations. Matching state-dictionary shapes does not prove that two concatenated halves have the same semantic order.

## Experimental design

**PROPOSAL — no measurements reported.**

### Experiment 13.3 — Gate, width, and fusion as separate factors

- **Hypothesis:** gated parameterization and execution fusion have separable effects.
- **Setup:** compare plain GELU, GEGLU, and SwiGLU under explicit width and parameter controls.
- **Independent variables:** gate, integer hidden width, fusion, and saved-activation policy.
- **Controlled variables:** data, depth, residual width, optimizer tuning budget, precision, and token budget.
- **Dataset/workload:** held-out general and specialist text; short and long sequence shapes.
- **Hardware:** record device, runtime, compiler, and resolved kernel path.
- **Metrics:** exact parameter residual, matrix FLOPs, retained bytes, gradient agreement, and held-out loss.
- **Baselines:** plain width-matched and plain parameter-matched blocks.
- **Expected result:** arithmetic matches its contract; quality and wall-time effects remain experimental.
- **Ablation:** keep gate fixed while changing only fusion.
- **Interpretation:** attribute quality to the trained model comparison and speed to the execution comparison.
- **Threats to validity:** width rounding, unequal tuning, and different activation approximations.

## Observations

**What the paper claims.** **PAPER-REPORTED — R13.2.** Some gated variants improve the evaluated text-to-text setup. No universal superiority or transported numerical gain is claimed here.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** Projection matching requires the two-thirds width relation for the stated bias-free blocks.

**What we infer.** **DERIVED.** Matched projections leave retention, elementwise work, and kernel eligibility as live differences.

**What remains unknown.** **UNVERIFIED.** The best gate and expansion ratio for a new domain, scale, and hardware require controlled measurement.

## Failure modes

~~~figure
id: fig-13.11
kind: stat-panel
title: What projection matching leaves unmatched
caption: At the bias-free width match, two retained gated projection outputs contain four-thirds the elements of one plain projection output; fusion and recomputation can change retention.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-13.9
alt: At the bias-free width match, two retained gated projection outputs contain four-thirds the elements of one plain projection output; fusion and recomputation can change retention.
spec:
  header: ACCOUNTING BOUNDARY
  rows:
    - {key: "projection match", value: "3dfg = 2df0"}
    - {key: "gated width", value: "2f0 / 3"}
    - {key: "projection-output elements", value: "4/3 of plain branch"}
    - {key: "actual peak memory", value: "requires lifetime ledger"}
~~~

> **Failure mode — unmatched third projection.** **DERIVED.** *Symptom:* quality gains accompany an undisclosed parameter increase. *Cause:* same hidden width used for two- and three-matrix blocks. *Detection:* Eq. 13.8 inventory. *Mitigation:* state the matching axis.

> **Failure mode — swapped gate and value.** **DERIVED.** *Symptom:* converted weights load but outputs differ. *Cause:* concatenation-order mismatch. *Detection:* isolated block comparison. *Mitigation:* record and test the projection order.

## Siblings

**DERIVED.** Plain GELU changes the nonlinearity in a two-matrix path; GLU variants introduce an additional learned multiplicative path. Fusion changes execution of a specified function. Sparse-expert routing changes conditional parameter activation and belongs to Chapter 16. [§13.2](13-2-width-depth-and-heads.md) supplies the broader allocation model.

## Extensions

**DERIVED.** Low-precision gated execution must account for activation outliers, quantizer scales, and multiplication order. Multimodal or domain-specific quality differences are hypotheses for a stratified ablation, not reasons to select a gate from its popularity.

## Limitations

**DERIVED.** The simple storage model counts selected projected tensors, not total training memory. A fused backend can change that retention graph. The original gated-block experiments do not establish a 2026 universal ranking across model scales and tasks.

## Reproducibility

**DERIVED — required record.** Retain exact dimensions, biases, gate equation, activation approximation, projection ordering, padded sizes, tensor-retention policy, precision, fusion backend, and budget mismatch.

## References

[R13.2 — GLU variants](references.md#r132); [R13.3 — GELU](references.md#r133); [R13.8 — PyTorch GELU](references.md#r138); [R13.10 — model configuration](references.md#r1310); [R13.14 — Transformer Engine](references.md#r1314).
