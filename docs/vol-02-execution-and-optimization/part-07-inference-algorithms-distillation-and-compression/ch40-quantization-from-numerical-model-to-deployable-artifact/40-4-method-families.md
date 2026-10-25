---
id: ms.section.40.4
entity_type: section
title: Method families
volume: 2
part: 7
chapter: 40
section: 40.4
slug: 40-4-method-families
parent: ms.chapter.40
prev_sibling: ms.section.40.3
next_sibling: ms.section.40.5
children: []
prerequisites: [ms.section.40.1, ms.section.40.2, ms.section.40.3]
downstream: [ms.section.40.5, ms.chapter.43]
related: [ms.chapter.23]
relations: []
axes: {lifecycle: [adaptation, inference], mechanism: [quantization, second_order_compensation, channel_scaling], feedback_setting: [], modality: [text]}
papers: [P15, P33, P34]
implementations: [impl.pytorch, impl.vllm, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2600
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 40.4 — Method families

## Scope

[DERIVED] GPTQ, AWQ and SmoothQuant are procedures for constructing quantized operators; NF4, INT4 and NVFP4 are representation choices; bitsandbytes is an implementation library. This section compares their changed primitives against nearest rounding under a fixed model and workload. It does not treat names from these different categories as interchangeable competitors.

## Why this exists

[DERIVED] There are three distinct ways to improve a frozen operator: compensate a rounding error with remaining weights, change coordinates before rounding, or change the representable codebook. Compensation needs input correlations; coordinate scaling trades error between channels or operands; a codebook encodes a distributional prior. The first two can share the same integer format while producing different codes. Conversely, the same recovery algorithm can use different formats and kernels.

[PAPER-REPORTED] GPTQ targets scalable second-order weight reconstruction [P33, §4]. AWQ protects activation-salient channels through scaling [P34, §3]. SmoothQuant redistributes magnitude between weights and activations for W8A8 [R40.3, §4]. Their objectives and deployment regimes differ.

## Intuition

[DERIVED] If two input channels are correlated, a rounding error on one weight can be offset by changing another weight before it is quantized. If one channel has large activation magnitude, its weight error is amplified; scaling the weight up and activation down can reduce effective error, provided shared quantizer ranges do not grow too much. If activations themselves must be quantized, moving magnitude into weights can improve their usable resolution while making weights harder to represent. These are consequences of multiplication, not interchangeable claims about “outlier removal.”

## Formulation

| Local symbol | Meaning |
|---|---|
| $F,U$ | Weight and input matrices as in §40.1 |
| $H=2UU^\top$ | Hessian of unnormalized row reconstruction loss |
| $A=H^{-1}$ | Inverse Hessian on currently unquantized coordinates |
| $w,\delta,j$ | One weight row, its compensating change, selected coordinate |
| $D_s=\operatorname{diag}(s_1,\ldots,s_{d_i})$ | Positive channel-scaling matrix; unrelated to training-token count $D$ |
| $k,\mathcal B_k$ | Code width and finite nonuniform codebook |
| $r$ | GPTQ lazy-update block width, distinct from quantization group size |

[MATHEMATICALLY-DERIVED] For row loss $\|(w-\widehat w)U\|_2^2$, forcing coordinate $j$ to a code value gives the constrained quadratic

$$
\min_\delta\tfrac12\delta H\delta^\top,\quad
\delta_j=\mathcal Q(w_j)-w_j
\quad\Rightarrow\quad
\delta=\frac{\mathcal Q(w_j)-w_j}{A_{jj}}A_{j,:}.
$$
*(Eq. 40.13)*

where $H$ must be positive definite on the active coordinates. The Lagrange condition $H\delta^\top+\mu e_j=0$ gives $\delta^\top=-\mu A e_j$; enforcing the selected change determines $\mu$. The resulting incremental loss is $(\mathcal Q(w_j)-w_j)^2/(2A_{jj})$.

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] After fixing one coordinate, the inverse on remaining coordinates follows a Schur elimination:

$$
A_{\rm new}=
\left(A-\frac{A_{:,j}A_{j,:}}{A_{jj}}\right)_{\neg j,\neg j}.
$$
*(Eq. 40.14)*

where already quantized coordinates cannot be adjusted again. A fixed shared coordinate order allows every output row to reuse the same inverse geometry. Dense input Gram formation costs $O(n_cd_i^2)$, factorization costs $O(d_i^3)$ and all row updates cost $O(d_od_i^2)$. These bounds exclude model passes and packing; matrix storage is $O(d_i^2+d_od_i)$ plus captured inputs if retained.

$$
M_H=d_i^2b_Hn_{\rm copies}.
$$
*(Eq. 40.28)*

[DERIVED] Here $b_H$ is bytes per curvature entry and $n_{\rm copies}$ counts simultaneously retained dense copies. Workspace and weights remain additional. This explicit accounting identity drives Fig. 40.11.

[PAPER-REPORTED] GPTQ shares a column order across rows, batches deferred updates and uses a Cholesky-based reformulation; damping addresses numerical instability [P33, §4, Algorithm 1]. The algorithm's block of columns controls update scheduling, whereas quantization groups control shared scales. They need not have the same width.

[DERIVED] Damping $H$ by $\alpha I$ changes the objective to include a penalty proportional to $\|\delta\|_2^2$ and makes inversion possible when calibration has deficient rank. It trades fidelity to measured correlations for numerical stability. An activation-order permutation must be applied consistently to weights, scales and runtime indexing. An unrecorded permutation can preserve a plausible histogram while implementing the wrong linear map.

[MATHEMATICALLY-DERIVED] For any positive diagonal $D_s$,

$$
FU=(FD_s)(D_s^{-1}U),\qquad
\widehat Y=\mathcal Q_w(FD_s)D_s^{-1}U,\qquad
\widehat Y-FU=E_sD_s^{-1}U
$$
*(Eq. 40.15)*

where $E_s=\mathcal Q_w(FD_s)-FD_s$. The equality before quantization is exact. A weight error in channel $j$ is divided by $s_j$ afterward, but its quantizer's step can increase because scaled channels share a group range. Therefore larger scales do not give monotonically better reconstruction.

[PAPER-REPORTED] AWQ searches channel scales from activation statistics and evaluates output discrepancy without updating the original weights through backpropagation [P34, §3.2, Eqs. 4–5]. It uses a restricted power-law search rather than an unrestricted optimum. The paper's salient-channel experiments motivate the mechanism; retaining selected weights in FP16 is a diagnostic, not the final all-low-bit method.

[DERIVED] A previous normalization's affine parameters can sometimes absorb $D_s^{-1}$, eliminating an extra runtime multiply. That fusion requires graph equivalence: branches sharing the same activation must receive compatible transforms, and a nonlinear operation cannot generally be crossed by arbitrary diagonal scaling. A graph-level transform is valid only if every consumer preserves the original function.

[MATHEMATICALLY-DERIVED] For simultaneous activation and weight quantization, write $\widehat F=FD_s+E_w$ and $\widehat U=D_s^{-1}U+E_a$. Then

$$
\widehat F\widehat U-FU
=E_wD_s^{-1}U+FD_sE_a+E_wE_a .
$$
*(Eq. 40.16)*

where the first two terms reveal the operand tradeoff and the final term is second order. Choosing $s_j=a_j^\rho/f_j^{1-\rho}$ from channel maxima $a_j,f_j$ approximately balances normalized ranges; $\rho$ is a searched or chosen migration exponent, not a guarantee.

[PAPER-REPORTED] SmoothQuant applies this offline equivalent scaling and uses different static/dynamic activation quantization variants [R40.3, §4, Eq. 3; Table 2]. Per-token activation and per-output-channel weight scales remain outside the reduction dimension, permitting integer GEMM with output rescaling. The recipe aims at W8A8, unlike weight-only AWQ.

[MATHEMATICALLY-DERIVED] A general nonuniform representation is

$$
c_i=\arg\min_{c\in\mathcal B_k}|u_i/a_g-c|,\qquad
\widehat u_i=a_gc_i .
$$
*(Eq. 40.17)*

where $a_g>0$ normalizes a group and $k$ bits index the codebook. Uniform INT4 has equal decoded spacing; a floating codebook changes spacing with exponent; a quantile codebook allocates levels according to a chosen distribution. Equal occupancy of bins is not generally the same optimization as minimum squared error: the latter has centroid conditions depending on the within-bin distribution.

[PAPER-REPORTED] QLoRA introduces NF4 for approximately normal weight distributions, quantizes scale constants again, and computes with a higher-precision dequantized base while training adapters [P15, §3]. This establishes a storage/computation distinction, not native four-bit GEMM. Its normality premise is a model of weight statistics and not a theorem for all block-normalized tensors.

[OFFICIAL-DOCUMENTATION] bitsandbytes Linear4bit exposes FP4/NF4 choices, compute dtype and compressed statistics [R40.16, Linear4bit]. The library name does not identify which method was selected.

[PAPER-REPORTED] LLM.int8() instead decomposes activation outlier dimensions into a higher-precision path and uses vectorwise integer multiplication for the rest [R40.8, §3].

[OFFICIAL-DOCUMENTATION] NVFP4 uses E2M1 values with an E4M3 scale per sixteen values and a tensor-level FP32 scale; MXFP4 uses a power-of-two shared scale per thirty-two values [R40.17, Table 1, “What is NVFP4?”]. Before alignment, NVFP4 block payload is $4+8/16=4.5$ bits/value plus tensor scale; MXFP4's corresponding arithmetic is $4+8/32=4.25$. These are storage calculations, not accuracy or speed rankings.

[DERIVED] GPTQ adds Gram/factorization work; AWQ adds candidate forward replays and graph transforms; SmoothQuant adds statistics and offline rescaling; nonuniform codes add lookup/decode requirements unless hardware implements them. None reduces parameter count or sequence length. Runtime FLOPs, traffic and communication depend on operand format and fusion. Calibration/recovery energy and deployment money remain workload-specific.

```figure
id: fig-40.12
kind: compare
title: Changed primitives across quantization families
caption: Compare mechanisms with task and workload held fixed; format names alone do not identify the construction procedure.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.13
alt: Compensation changes remaining weights, channel scaling changes coordinates, smoothing balances two operands, and codebooks change representable values. Each has a different calibration object.
spec:
  axis: primitive changed before executing a fixed linear operator
  columns:
    - {id: comp, label: compensation}
    - {id: scale, label: weight scaling}
    - {id: smooth, label: operand balancing}
    - {id: code, label: codebook}
  rows:
    - {dimension: changed object, values: {comp: remaining weights, scale: channel coordinates, smooth: both operand ranges, code: representable levels}}
    - {dimension: statistics, values: {comp: input correlations, scale: activation salience, smooth: operand maxima, code: distribution or format}}
    - {dimension: runtime requirement, values: {comp: correct packing, scale: valid graph fusion, smooth: native operand pair, code: matching decoder}}
```

## Algorithm

### Algorithm 40.4 — Shared-order quadratic compensation

[MATHEMATICALLY-DERIVED] This explanatory inverse-form procedure implements Eqs. 40.13–14; it is not GPTQ's optimized Cholesky code. Inputs are $F,U$, fixed code grids and damping $\alpha>0$. Output is $\widehat F$. State is active coordinates $\mathcal J$, working weights and inverse $A$.

$$
\begin{aligned}
1.\;&A\leftarrow(2UU^\top+\alpha I)^{-1};\
\mathcal J\leftarrow(1,\ldots,d_i);\ \widehat F\leftarrow0.\\
2.\;&A\text{ nonfinite or not positive definite}\Rightarrow\text{return numerical failure}.\\
3.\;&j\leftarrow\operatorname{first}(\mathcal J);\
\widehat F_{:,j}\leftarrow\mathcal Q(F_{:,j});\
e\leftarrow F_{:,j}-\widehat F_{:,j}.\\
4.\;&F_{:,\mathcal J}\leftarrow F_{:,\mathcal J}
-e\,A_{j,\mathcal J}/A_{jj}.\\
5.\;&A\leftarrow\left(A-A_{:,j}A_{j,:}/A_{jj}\right)_{\neg j,\neg j};\
\mathcal J\leftarrow\mathcal J\setminus\{j\}.\\
6.\;&\mathcal J\ne\varnothing\Rightarrow\text{return to 3};\
\text{otherwise return }\widehat F.
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] Fixed coordinates never change again; there are exactly $d_i$ selections. The active-set inverse and its indices must be renumbered consistently at line 5. Direct inverse updates are susceptible to roundoff; the optimized source's factorization is consequential numerical engineering.

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch (**Model / autograd framework**) hosts construction; Hugging Face Transformers (**Model definition / adaptation**) loads model graphs; vLLM (**Inference engine**) documents quantized-linear dispatch and hardware restrictions [R40.15, “Supported Hardware”]. bitsandbytes, TorchAO and NVIDIA ModelOpt are explicitly plan-routed outside the numbered stack. Interface support is not a code-verified speed claim.

[MATHEMATICALLY-DERIVED] Hardware-supported variants require a complete tuple: operand codebook, block layout, scale encoding, accumulator, tile shape and device capability. An INT4 checkpoint decoded into BF16 GEMM is a valid weight-compressed implementation; it does not exercise native INT4 arithmetic. A floating four-bit checkpoint may also use a dequantizing fallback. Unsupported shapes can break expected acceleration without invalidating the quantized numerical model.

## Experimental design

### Reported experiments

[PAPER-REPORTED] GPTQ calibrates with 128 C4 segments of 2,048 tokens and studies OPT/BLOOM perplexity and zero-shot tasks, using an A100-80GB for quantization [P33, §5]. AWQ's scaling diagnostic uses OPT-6.7B, INT3 groups of 128 and WikiText-2; SmoothQuant's granularity comparison uses OPT sizes and four zero-shot tasks [P34, Tables 1–2; R40.3, Table 1]. These are distinct protocols.

## Observations

**What the paper claims.** [PAPER-REPORTED] The three methods reduce errors through their respective compensation/scaling changes [P33, §5; P34, §5; R40.3, §5].

**What the evidence shows.** [PAPER-REPORTED] GPTQ Table 5 reports OPT-175B WikiText-2 perplexity 8.34 for FP16, 10.54 for four-bit nearest rounding and 8.37 for four-bit GPTQ. AWQ Table 2 reports 23.54 to 11.92 when scaling salient channels by two, then 12.36 at four. SmoothQuant Table 1 reports OPT-175B average accuracy 71.6% FP16, 32.3% per-tensor INT8 and 71.4% per-channel INT8; the latter is a diagnostic with kernel restrictions, not its final runtime.

**What we infer.** [MATHEMATICALLY-DERIVED] The nonmonotonic scaling result agrees with Eq. 40.15's competing range effects. The perplexity result establishes a benefit under one reconstruction protocol, not universal task retention.

**What remains unknown.** [UNVERIFIED] This edition did not reproduce these comparisons or establish their ordering for 2026 models, different calibration distributions or modern kernels.

## Failure modes

> **Failure mode — Compensation singularity.** [MATHEMATICALLY-DERIVED] *Symptom:* unstable inverse or extreme updates. *Cause:* rank-deficient inputs and tiny active curvature. *Detection:* factorization failures and sensitivity to damping. *Mitigation:* documented damping, finite checks and source-supported factorization.

[MATHEMATICALLY-DERIVED] Excess channel scaling can enlarge shared ranges; transformations across an incompatible branch can change the unquantized function; a normal-distribution codebook can misallocate levels for a different distribution; outlier decomposition can require expensive small auxiliary operations.

## Siblings

[MATHEMATICALLY-DERIVED] The axis is what changes while the original architecture is held fixed. Compensation changes remaining weights; AWQ-style scaling changes coordinates; SmoothQuant-style scaling balances both operands; [QAT](40-3-ptq-and-qat.md) changes latent parameters with task or teacher supervision. Codebooks sit beneath these choices, while [artifact/runtime interfaces](40-5-artifact-runtime-interfaces.md) determine executable realizations.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] The 2026 AutoQuantize disclosure adds output-gradient-weighted sensitivity and runtime-coupled assignments [R40.18, “Deployment-restriction-aware search”]. This extends uniform recipe selection rather than replacing every layer optimizer. Scale learning adds trainable NVFP4 block scales [R40.19]. Their additional calibration or training work must be charged separately; this chapter does not infer superiority from recency.

## Limitations

[MATHEMATICALLY-DERIVED] Local quadratic compensation is exact for its layer surrogate, not the full nonlinear network. Coordinate equality is exact before quantization but approximate afterward. Codebook optimality depends on a specified distribution and distortion. Hardware support changes the attainable runtime, not the validity of these mathematical distinctions.

## Reproducibility

[MATHEMATICALLY-DERIVED] Record group size separately from lazy block width, damping separately from activation order, scaling exponent separately from activation quantization, and codebook separately from compute dtype. Retain transformed graph, original hash and exact packed representation. Source revisions and inspected locators are in the ledger; no implementation execution is claimed.

## References

[P33](references.md#p33), [P34](references.md#p34), [R40.3](references.md#r40-3), [P15](references.md#p15), [R40.8](references.md#r40-8), [R40.15](references.md#r40-15), [R40.16](references.md#r40-16), [R40.17](references.md#r40-17), [R40.18](references.md#r40-18), [R40.19](references.md#r40-19).

```figure
id: fig-40.13
kind: calculator
title: Inverse-geometry state size
caption: Analytical dense curvature storage grows quadratically with input width; this is not a measured GPTQ memory peak.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.28
alt: A dense 4096 by 4096 matrix with four-byte entries occupies 64 MiB. Doubling input width quadruples this state.
states:
  - {anchor: formulation, label: Width 4096, variables: {di: 4096}, note: One dense curvature matrix.}
  - {anchor: mechanism, label: Width 8192, variables: {di: 8192}, note: Four times the storage.}
  - {anchor: failure-modes, label: Additional copies, variables: {copies: 2}, note: Factorization workspace and copies are additional.}
spec:
  tex: M_H=d_i^2 b_H n_{\rm copies}
  equation: "40.28"
  inputs:
    - {symbol: di, label: input width, default: 4096, min: 512, max: 32768, scale: log2, format: integer}
    - {symbol: bh, label: curvature bytes, default: 4, min: 2, max: 8, format: integer}
    - {symbol: copies, label: copies, default: 1, min: 1, max: 4, format: integer}
  outputs:
    - {symbol: mem, label: curvature bytes, formula: di^2*bh*copies, format: bytes}
```

```figure
id: fig-40.14
kind: stat-panel
title: Method versus format
caption: A reproducible record names each layer of the construction and execution stack.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.17
alt: Record construction algorithm, codebook, packing, arithmetic and kernel separately. A method name does not specify the format or runtime.
spec:
  header: REPRESENTATION STACK
  rows:
    - {key: construction, value: algorithm and calibration}
    - {key: representation, value: codes and scale encoding}
    - {key: execution, value: arithmetic and kernel}
    - {key: evidence, value: task and workload}
```
