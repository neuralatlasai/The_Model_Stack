---
id: ms.section.40.2
entity_type: section
title: Quantization targets
volume: 2
part: 7
chapter: 40
section: 40.2
slug: 40-2-quantization-targets
parent: ms.chapter.40
prev_sibling: ms.section.40.1
next_sibling: ms.section.40.3
children: []
prerequisites: [ms.chapter.3, ms.chapter.23, ms.chapter.25, ms.chapter.29]
downstream: [ms.chapter.42, ms.chapter.43]
related: [ms.chapter.39]
relations: []
axes: {lifecycle: [pretraining, adaptation, inference], mechanism: [quantization, precision_allocation], feedback_setting: [], modality: [text]}
papers: [P15]
implementations: [impl.pytorch, impl.vllm, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 40.2 — Quantization targets

## Scope

[DERIVED] A precision configuration assigns representations separately to weights, forward activations, backward gradients, optimizer state and persistent inference state. The baseline assigns BF16 forward operands, the declared training accumulator precision and an uncompressed cache. Success is lower resource use while preserving stated training or inference outcomes. The section owns target selection and mixed-precision allocation; cache organization itself is developed in Chapter 42.

## Why this exists

[DERIVED] Compressing the largest static tensor need not compress the dominant live state. A training process can retain gradients, master weights, moments and saved activations after weight storage is reduced. A serving process with long contexts can retain more cache bytes than weight bytes. Dynamic activation quantization adds work every request; offline weight quantization pays that work once. Quantizing persistent optimizer states repeats its numerical perturbation across updates, whereas quantizing a frozen checkpoint introduces a fixed perturbation.

[PAPER-REPORTED] The 8-bit optimizer study explicitly separates state storage from update arithmetic [R40.4, §2]. KIVI separately targets the growing cache [R40.9, §3]. Their improvements address different lifetimes and cannot be combined into a universal “four-bit model” specification.

## Intuition

[DERIVED] Precision should follow the lifetime and sensitivity of each object. Static weights can amortize calibration and packing across many requests. Activations need runtime encoding unless their ranges were fixed offline. Gradients transmit small corrective signals, so rounding away a small update changes optimization even when the forward pass is stable. Keys alter attention probabilities; values alter their weighted sum. The same reconstruction metric need not reflect these different uses.

## Formulation

> **Definition — Mixed-precision allocation.** [DERIVED] A constrained assignment of numerical representations to distinct operators or state tensors under a declared quality and resource criterion.

| Local symbol | Meaning |
|---|---|
| $n_\ell,k_{\ell,f}$ | Eligible values and effective bits for candidate format $f$ at operator $\ell$ |
| $a_{\ell,f}\in\{0,1\}$ | Candidate selection indicator |
| $\epsilon_{\ell,f}$ | Measured or explicitly approximated sensitivity score |
| $K_c,V_c,\delta K_c,\delta V_c$ | Cache matrices and their representation errors |
| $q_c$ | One attention query |
| $m_j,v_j$ | Optimizer first and second moments at step $j$ |
| $g_j$ | Gradient at optimization step $j$ |

[MATHEMATICALLY-DERIVED] Account for all live states:

$$
M_{\rm live}=M_{\rm weights}+M_{\rm gradients}+M_{\rm optimizer}
+M_{\rm saved}+M_{\rm cache}+M_{\rm workspace}+M_{\rm communication}.
$$
*(Eq. 40.5)*

where each term uses its own dtype, sharding and replication factor. A target absent from a lifecycle contributes zero for a specific reason: ordinary inference has no training gradients or optimizer moments. A frozen quantized base used for adapters still needs input gradients through its operations, but not base-parameter optimizer state.

[MATHEMATICALLY-DERIVED] A separable allocation surrogate is

$$
\min_a\sum_{\ell,f}a_{\ell,f}\epsilon_{\ell,f},
\quad \sum_fa_{\ell,f}=1,\quad
\sum_{\ell,f}n_\ell k_{\ell,f}a_{\ell,f}\le K_{\rm budget},
\quad a\in\mathcal C_{\rm runtime}.
$$
*(Eq. 40.6)*

where $K_{\rm budget}$ counts bits in the eligible domain and $\mathcal C_{\rm runtime}$ encodes supported combinations. This is not the exact end-to-end task objective: it neglects interactions unless scores or constraints incorporate them.

## Mechanism

### Methodology

[DERIVED] Weight-only execution stores compressed $F$, decodes tiles, and multiplies by higher-precision activations. It reduces weight traffic without promising native low-bit multiplication. Weight-and-activation execution additionally encodes request-dependent inputs; it can use native reduced-precision arithmetic if the hardware and kernel implement that operand pair. Gradients require an independent contract for accumulation, scaling and communication. Compressing a gradient buffer does not automatically compress the collective, because the transport can upcast or sum in a different dtype.

[PAPER-REPORTED] Gupta et al. study stochastic rounding for low-precision training on MNIST and CIFAR10 [R40.6, §3–4]. This is historical evidence for preserving small updates statistically, not evidence that every LLM can train with a particular low-bit gradient format.

[MATHEMATICALLY-DERIVED] For adjacent representable points $u_0<u_1$, stochastic rounding sends $u$ upward with probability $(u-u_0)/(u_1-u_0)$ and downward otherwise. Substitution gives expected output $u$ before saturation. The variance is $(u-u_0)(u_1-u)$. Unbiasedness is conditional on an in-range value and a correct random source; a nonlinear optimizer does not become unbiased merely because its input quantizer is.

[MATHEMATICALLY-DERIVED] For an Adam-type update, stored moment errors have unequal consequences:

$$
\frac{m+\delta m}{\sqrt{v+\delta v}+\varepsilon}
-\frac{m}{\sqrt v+\varepsilon}
\approx \frac{\delta m}{\sqrt v+\varepsilon}
-\frac{m\,\delta v}{2\sqrt v(\sqrt v+\varepsilon)^2}.
$$
*(Eq. 40.7)*

where $v>0$, perturbations are small, and the expression concerns the uncorrected ratio for one coordinate. The second-order moment error can be amplified near zero; epsilon and higher-precision exceptions therefore belong to the method. Bias correction and decay are separate operations. Negative reconstructed second moments are invalid even if overall MSE is small.

[PAPER-REPORTED] The 8-bit optimizer method uses blockwise nonlinear state coding, dequantizes for a 32-bit update and requantizes for storage; a stable embedding treatment addresses a sensitive component [R40.4, §2]. Its cost is recurring state reads/writes and local encoding; it is not a four-bit inference format.

[MATHEMATICALLY-DERIVED] For attention $p=\operatorname{softmax}(K_cq_c/\sqrt{d_h})$, a first-order expansion yields

$$
\delta o\approx
V_c^\top\!\left(\operatorname{diag}(p)-pp^\top\right)
\frac{\delta K_cq_c}{\sqrt{d_h}}
+\delta V_c^\top p .
$$
*(Eq. 40.8)*

where $K_c,V_c$ have shape $[S,d_h]$, $q_c$ shape $[d_h]$, and $o$ shape $[d_h]$. The omitted cross-term is second order. Key error is filtered through the softmax Jacobian and all value vectors; value error is directly weighted by attention. This derivation explains why the optimal grouping axes can differ without asserting a universal distribution of cache outliers.

[PAPER-REPORTED] KIVI uses per-channel key coding, per-token value coding, grouped historical keys and a higher-precision recent residual [R40.9, §3.2–3.3]. Groups make channel statistics available in streaming decode. Residual length is a resource/accuracy choice, not missing compression.

[DERIVED] For $n_{\rm old}$ compressed cache values and $n_{\rm recent}$ retained values, storage is $n_{\rm old}k_{\rm eff}/8+n_{\rm recent}b+M_{\rm indices}$. Thus a short prefix may see little savings. Every append can trigger encoding; attention must process compressed history plus residual state. Parameter count and semantic sequence length are unchanged. Actual latency, energy and cost are NOT-DISCLOSED by this analytical accounting.

[MATHEMATICALLY-DERIVED] For an illustrative fixed-width cache with $S>0$ positions and a recent residual of at most $r_c$ positions, the payload-only average is

$$
b_{\rm avg}=\frac{\max(S-r_c,0)b_q+\min(S,r_c)b}{S}.
$$
*(Eq. 40.26)*

where $b_q$ is old-value payload bytes, $b$ recent-value bytes, and scale/page metadata is excluded. This is an analytical configuration, not a model specification.

```figure
id: fig-40.6
kind: systems-trace
title: Precision by state lifetime
caption: Each target creates a different encoding schedule and numerical boundary; reducing one buffer does not remove the others.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.5
alt: Weights encode offline, activations per operator, optimizer moments each update, and cache entries as tokens arrive. Each has different persistent storage and failure conditions.
spec:
  columns: [compute, memory, communication, failure]
  stages:
    - {name: weights, values: {compute: offline encoding, memory: persistent packed codes, failure: wrong group layout}}
    - {name: activations, values: {compute: runtime scale reduction, memory: transient operands, failure: unseen range}}
    - {name: gradients, values: {compute: accumulation and scaling, communication: actual collective dtype, failure: erased updates}}
    - {name: optimizer, values: {compute: decode update encode, memory: persistent moments, failure: denominator sensitivity}}
    - {name: cache, values: {compute: append and tiled decode, memory: grows with context, failure: attention perturbation}}
```

## Algorithm

### Algorithm 40.2 — Constrained target allocation

[MATHEMATICALLY-DERIVED] Inputs are a finite candidate set for each target, runtime constraints, sensitivity measurements and a bit budget. State is the feasible assignment set; output is an assignment or explicit infeasibility.

$$
\begin{aligned}
1.\;&\mathcal F_\ell\leftarrow\{f:\operatorname{Supported}(\ell,f,\text{device,layout})\}.\\
2.\;&\exists\ell:\mathcal F_\ell=\varnothing\Rightarrow\text{return unsupported}.\\
3.\;&\epsilon_{\ell,f}\leftarrow
 \operatorname{Score}(\text{frozen reference},\ell,f,\text{calibration}),\quad f\in\mathcal F_\ell.\\
4.\;&\mathcal A\leftarrow
 \{a:\text{one choice/target, budget and coupling constraints hold}\}.\\
5.\;&\mathcal A=\varnothing\Rightarrow\text{return infeasible};\quad
 a^\star\leftarrow\arg\min_{a\in\mathcal A}\sum_{\ell,f}a_{\ell,f}\epsilon_{\ell,f}.\\
6.\;&\text{return }a^\star\text{ with joint validation required}.
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] Exact enumeration terminates after at most $\prod_\ell|\mathcal F_\ell|$ assignments; integer optimization is a practical alternative without a universal polynomial runtime guarantee. The invariant is runtime feasibility, not end-to-end quality. Capturing scores may require $O(n_c)$ full-model passes per candidate or cheaper surrogates, so the search budget must be reported.

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch (**Model / autograd framework**) and Hugging Face Transformers (**Model definition / adaptation**) host the transformation; vLLM (**Inference engine**) documents separate quantized-linear and KV-cache surfaces [R40.15, “Quantization”]. TorchAO and NVIDIA ModelOpt are plan-anchored tools outside the numbered stack. Their formats must be matched to the intended engine, not only to their export utility.

[MATHEMATICALLY-DERIVED] Distributed allocation must preserve fused-operator compatibility. Choosing different formats for Q, K and V can prevent their joint execution; a mixture that saves bits can increase kernel launches and intermediate traffic. Optimizer-state compression reduces state memory under actual sharding, but not saved activations. Communication and checkpoint compression must be measured separately from parameter encoding.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The 8-bit optimizer study changes state precision while retaining baseline hyperparameters and other tensor precisions. It reports medians over ten GLUE seeds, three seeds for most other tasks and one for large language modeling [R40.4, §3, Table 1]. The stochastic-rounding study uses MNIST/CIFAR10; its MNIST dense-network setup uses batch-100 SGD, cross entropy and fixed-point updates [R40.6, §4.1].

[PAPER-REPORTED] KIVI evaluates Llama-2, Falcon and Mistral with CoQA, TruthfulQA and GSM8K under LM-Eval defaults, and separately evaluates LongBench and retrieval [R40.9, §4.1–4.2]. Its fake all-token two-bit baselines differ from KIVI's high-precision recent residual. That control distinguishes grouping geometry from the residual's preservation effect.

[OFFICIAL-DOCUMENTATION] The October 2026 AutoQuant KV disclosure uses Qwen3-8B with BF16 weights, comparing uniform cache formats and mixed assignments under effective-bit budgets [R40.20, “Mixed-precision results”]. It reports RULER at 128K and task results separately. The starter recipe uses 128 CNN/DailyMail examples of 512 tokens; it is presented as a workflow example, not a complete disclosure of every reported evaluation configuration.

[OFFICIAL-DOCUMENTATION] The 25 October reinspection identifies a development vLLM image with TP1/DP4 and matched settings within each benchmark. The reported asymmetric FP8-key/NVFP4-value assignments use a broader menu than the starter recipe. Study checkpoints and the runtime image are not distributed with the post; SciCode counts missing or unsuccessful generations as failures in 2,704 trials, and only the fixed Native 6.25 comparator averages three runs [R40.20, “Mixed-precision results”].

[NOT-DISCLOSED] Complete evaluator seeds, repeated-run uncertainty for every assignment, hardware identity and executable runtime provenance remain absent. The disclosed point differences are not significance claims, and modeled cache payload is not measured peak process memory.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] At 5.76 effective KV bits, AutoQuant reports 64.0% modeled payload reduction relative to BF16 and a 1.04 percentage-point RULER-128K decrease, compared with 6.54 points for uniform NVFP4 [R40.20, “Mixed-precision results”].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] Weights remain BF16 in that comparison, and scales are default constants. It does not evaluate the separately documented composed GEMM-plus-KV search.

[PAPER-REPORTED] The historical optimizer comparison reports language-model perplexity 9.0 for both 32-bit and 8-bit Adam on its 1.5B model [R40.4, Table 1]. Gupta et al. report that nearest rounding erases small updates while stochastic rounding preserves learning over a wider tested fractional-precision range [R40.6, §4.1]. Neither establishes arbitrary-precision convergence.

[PAPER-REPORTED] KIVI's Llama-2-13B GSM8K score is 22.67 for 16-bit cache, 12.21 for all-token fake two-bit channel-key/token-value coding, and 20.77 for KIVI-2 [R40.9, Table 3]. The residual substantially changes the result; grouping alone is not the complete method.

**What we infer.** [MATHEMATICALLY-DERIVED] $1-5.76/16=0.64$ reproduces the payload arithmetic. It excludes residual buffers, allocator overhead and throughput.

**What remains unknown.** [UNVERIFIED] Independent replication, transfer to different head geometries and joint quality under simultaneous weight/cache perturbation remain untested here.

## Failure modes

> **Failure mode — Independent scores, interacting errors.** [MATHEMATICALLY-DERIVED] *Symptom:* jointly quantized quality falls beyond single-layer predictions. *Cause:* cross-layer perturbations and altered inputs violate separability. *Detection:* evaluate the assembled artifact. *Mitigation:* revise scores or retain precision where interaction is observed.

[MATHEMATICALLY-DERIVED] Reusing cache sensitivity after changing weight quantizers invalidates its reference distribution. A small average error can hide a large error on rare routing or retrieval positions. Low-bit moment values can erase small updates even while forward logits match.

## Siblings

[MATHEMATICALLY-DERIVED] [Weight-only](40-4-method-families.md) changes static traffic; weight-and-activation quantization changes operand arithmetic; cache coding changes growing state; optimizer coding changes training state. [LoRA](../../../vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch23-parameter-efficient-adaptation-and-model-composition/README.md) changes trainable parameterization and must not be treated as a competing compression codebook.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] AutoQuantize scores operator errors with squared output gradients and solves a constrained mixed-precision assignment; AutoQuant KV instead measures output KL for layerwise cache candidates [R40.18, “How AutoQuantize works”; R40.20, “How KV AutoQuant works”]. The first reduces scoring work through a surrogate; the second uses forward evaluations. Both retain a separability limitation. The KV export excludes one asymmetric candidate pair, illustrating that runtime compatibility changes the feasible research space.

## Limitations

[MATHEMATICALLY-DERIVED] A bit-budget optimum is not a latency optimum. Effective-bit averages must be weighted by the number of eligible values; they cannot be averaged over layer names. Sensitivity depends on workload and source model. The gradient approximation additionally requires small perturbations and justified omission of first-order/cross-coordinate effects.

## Reproducibility

[MATHEMATICALLY-DERIVED] Save the target inventory, eligible-domain denominator, scores, candidate exclusions, coupling constraints and assembled assignment. Keep weight, activation, gradient, moment and cache dtypes separately. Mark arithmetic accumulation and communication dtypes independently. No executed training or serving result is claimed.

## References

[P15](references.md#p15), [R40.4](references.md#r40-4), [R40.6](references.md#r40-6), [R40.9](references.md#r40-9), [R40.15](references.md#r40-15), [R40.18](references.md#r40-18), [R40.20](references.md#r40-20).

```figure
id: fig-40.7
kind: calculator
title: Compressed history and recent residual
caption: Analytical cache values at two precisions exclude scales and paging. The recent residual imposes a length-dependent floor.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.26
alt: A cache with 8192 positions, 128 recent full-precision positions, two bytes per recent value and half a byte per old value averages about 0.52 bytes per value.
states:
  - {anchor: formulation, label: Long history, variables: {S: 8192}, note: Most values can be compressed.}
  - {anchor: mechanism, label: Short history, variables: {S: 256}, note: The recent residual dominates.}
  - {anchor: failure-modes, label: All recent, variables: {S: 128}, note: No historical payload is compressed.}
spec:
  tex: b_{\rm avg}=(\max(S-r,0)b_q+\min(S,r)b)/S
  equation: "40.26"
  inputs:
    - {symbol: S, label: cache positions, default: 8192, min: 128, max: 131072, scale: log2, format: integer}
    - {symbol: r, label: recent positions, default: 128, min: 0, max: 128, format: integer}
    - {symbol: bq, label: old bytes per value, default: 0.5, min: 0.25, max: 2, format: fixed2}
    - {symbol: bf, label: recent bytes per value, default: 2, min: 1, max: 4, format: integer}
  outputs:
    - {symbol: avg, label: average bytes per value, formula: "(max(S-r,0)*bq+min(S,r)*bf)/S", format: fixed2}
```

```figure
id: fig-40.8
kind: stat-panel
title: Allocation validity
caption: Keep representation cost, task sensitivity and executable combinations distinct.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.6
alt: The allocation needs an eligible-value denominator, a fixed scoring reference, feasible kernels and joint validation. A bit optimum does not establish a latency optimum.
spec:
  header: MIXED PRECISION
  rows:
    - {key: budget, value: eligible values only}
    - {key: scores, value: fixed reference}
    - {key: feasibility, value: coupled kernels}
    - {key: acceptance, value: joint artifact}
```
