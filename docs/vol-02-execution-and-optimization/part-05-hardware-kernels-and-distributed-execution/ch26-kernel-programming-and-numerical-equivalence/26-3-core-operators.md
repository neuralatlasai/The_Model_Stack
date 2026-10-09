---
id: ms.section.26.3
entity_type: section
title: Core operators
short_title: Core operators
volume: 2
part: 5
chapter: 26
section: 26.3
slug: 26-3-core-operators
parent: ms.chapter.26
prev_sibling: ms.section.26.2
next_sibling: ms.section.26.4
children: []
prerequisites:
- ms.chapter.3
- ms.chapter.5
- ms.chapter.25
downstream:
- ms.chapter.27
- ms.chapter.28
- ms.chapter.29
- ms.chapter.30
related: []
relations: []
axes:
  lifecycle:
  - pretraining
  - inference
  - serving
  mechanism:
  - kernel_programming
  - numerical_equivalence
  feedback_setting: []
  modality:
  - text
  - image
  - audio
papers: []
implementations:
- impl.nvidia-cuda
- impl.triton-language
- impl.nvidia-cutlass
- impl.amd-hip
- impl.pytorch
- impl.jax
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used:
  - OFFICIAL-DOCUMENTATION
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - ASSUMED
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 1800
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# 26.3 — Core operators

## Scope

[DERIVED] This section specifies the execution contracts for GEMM/GEMV, embedding lookup, normalization, rotary position application, softmax, cross-entropy and optimizer updates. The objective is to identify reusable computation, reductions, mandatory state and numerical boundaries before selecting kernels. These are book-authored mathematical reconstructions, not claims that the operators were invented in the 2025–2026 evidence window. Versioned API disclosures support implementation semantics only.

## Why this exists

[OFFICIAL-DOCUMENTATION] PyTorch 2.14 documents distinct embedding controls, class-index versus probability-target cross-entropy, and optimizer execution options. Its release also extends compiler-generated GEMM epilogues. [R26.13], parameters; [R26.14], parameters and shapes; [R26.15], execution options; [R26.11], NVGEMM heading. [DERIVED] A kernel named “cross-entropy” or “normalization” can implement only one of several materially different contracts. Comparing durations without recording those choices rewards omitted computation, incorrect gradients or a different denominator.

[DERIVED] The dominant resource changes across operators. A reused dense product can amortize weight traffic over rows; a single-vector product cannot obtain that same reuse. An embedding gather has data-dependent addresses; an optimizer update has persistent mutable state. A row reduction can be locally fused only if its entire reduction domain is available to the owning program. These differences determine the valid optimization space more directly than the fact that all operands are tensors.

## Intuition

[MATHEMATICALLY-DERIVED] A kernel is a schedule for an operator's dependency graph. GEMM combines a reduction with reuse across outputs. Softmax combines a maximum, an exponential sum and normalization. Cross-entropy need not materialize every normalized probability when the output is a scalar loss, but its backward still needs either probabilities or a recomputation route. Eliminating an intermediate array removes storage, not the mathematical dependence represented by that array. Persistent optimizer moments cannot be omitted as though they were expendable activation temporaries.

## Formulation

| Symbol | Meaning | Shape/unit |
|---|---|---|
| $M,Q,K$ | Product rows, columns and reduction dimension | Elements |
| $A,W,C$ | Product input, weights and output | $[M,K],[K,Q],[M,Q]$ |
| $V,d$ | Vocabulary rows and embedding/feature width | Elements |
| $J,E,Y$ | Token indices, embedding table and gathered vectors | $[M],[V,d],[M,d]$ |
| $x_i,\gamma_i,\beta_i$ | Row values and affine normalization parameters | $[d]$ |
| $z_{r,v},t_r$ | Logits and class-index targets | $[M,V],[M]$ |
| $\varepsilon$ | Positive normalization/optimizer stabilizer | Operator-dependent units |
| $m_t,v_t,g_t$ | First moment, second moment and gradient | Parameter-shaped |

[MATHEMATICALLY-DERIVED] The dense product is $C_{i,j}=\sum_{k=0}^{K-1}A_{i,k}W_{k,j}$, requiring $2MQK$ conventional FLOPs. A lower-bound single-read traffic model is

$$
F_{\rm gemm}=2MQK,\qquad B_{\rm gemm}=b(MK+KQ+MQ),\qquad I_{\rm gemm}=F_{\rm gemm}/B_{\rm gemm},\qquad M_p=MVb.
$$

*(Eq. 26.3)*

The separate $M_p$ identity counts an optional materialized probability array with $b$ bytes per probability; it is not GEMM traffic. The product model excludes rereads, epilogues, quantization scales and workspace. When $M=1$ and $K,Q$ are large, weight reads dominate and intensity approaches $2/b$ FLOPs/byte. Batching changes this physical reuse opportunity; calling GEMV a small GEMM does not remove it.

## Mechanism

### Dense products and indexed gathers

[DERIVED] GEMM tiles the output and reduces over $K$ with an accumulator type chosen separately from input storage. A bias epilogue adds $Q$ parameters; activation and output scaling alter arithmetic and rounding. GEMV often needs a different mapping because there are fewer output tiles and little reuse over rows. Splitting the reduction dimension creates extra partial sums and combination work; it is useful only when the additional parallelism compensates for these costs. Backward requires $\bar A=\bar C W^\top$ and $\bar W=A^\top\bar C$, with their own shapes and reduction orders. A fast forward tile does not imply a fast or numerically equivalent backward tile.

[MATHEMATICALLY-DERIVED] Embedding lookup is $Y_{r,j}=E_{J_r,j}$ for valid $0\leq J_r<V$. It moves approximately $2Mdb$ useful bytes for one table read and one output write, plus index reads; cache reuse can reduce actual table traffic. The dense gradient is

$$
\bar E_{v,j}=\sum_{r:J_r=v}\bar Y_{r,j}.
$$

Duplicate indices therefore require accumulation. A gather-only forward benchmark does not test the potentially contended scatter/reduction in backward. Sorting indices changes auxiliary storage and preprocessing cost; atomic accumulation changes ordering. [OFFICIAL-DOCUMENTATION] PyTorch 2.14's embedding interface additionally exposes padding, frequency scaling, sparse gradients and optional renormalization. These alter the contract and cannot be silently omitted. [R26.13], parameters and notes.

### Normalization and rotary application

[MATHEMATICALLY-DERIVED] For a row $x\in\mathbb R^d$, define $\mu=d^{-1}\sum_i x_i$, $\sigma^2=d^{-1}\sum_i(x_i-\mu)^2$, and $r=(\sigma^2+\varepsilon)^{-1/2}$. Layer normalization is $y_i=\gamma_i(x_i-\mu)r+\beta_i$. RMS normalization instead uses $r=(d^{-1}\sum_i x_i^2+\varepsilon)^{-1/2}$ and $y_i=\gamma_ix_ir$. They are different functions: removing mean subtraction is not merely a kernel optimization. A two-pass centered variance avoids directly subtracting two large nearly equal moments; a parallel variance-combine algorithm has a different dependency and rounding structure. A small negative computed variance must not be hidden without an explicit policy.

[MATHEMATICALLY-DERIVED] With $h_i=\bar y_i\gamma_i$ and $u_i=(x_i-\mu)r$, layer-normalization backward is

$$
\bar x_i=r\left(h_i-\operatorname{mean}(h)-u_i\operatorname{mean}(hu)\right).
$$

It requires two row reductions beyond the saved statistics, while parameter gradients reduce over rows. RMS-normalization backward is $\bar x_i=rh_i-x_ir^3\operatorname{mean}(hx)$. Saving $r$ costs one scalar per row; saving normalized inputs costs $Md$ values; recomputation trades those bytes for reads and arithmetic. All epsilon positions must remain identical to the reference.

[MATHEMATICALLY-DERIVED] Rotary application to one pair is $\binom{y_0}{y_1}=\begin{pmatrix}\cos\phi&-\sin\phi\\\sin\phi&\cos\phi\end{pmatrix}\binom{x_0}{x_1}$. Its backward is multiplication by the transpose when $\phi$ is fixed. The real-arithmetic norm is preserved because the matrix is orthogonal. Finite-precision sine/cosine tables and multiplies need not preserve the norm exactly. Pair ordering, rotated width, position offset and frequency construction belong in the input contract. Adjacent-pair and split-half layouts cannot share an index map without conversion. Unrotated channels must pass through unchanged.


```figure
id: fig-26.9
kind: tensor-flow
title: Operator shapes determine distinct reductions
caption: 'The trace shows three different contracts: a dense product reduces K, normalization reduces d, and lookup
  selects table rows. Equal output rank does not imply equal memory access or backward behavior.'
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.3
alt: 'The trace shows three different contracts: a dense product reduces K, normalization reduces d, and lookup
  selects table rows. Equal output rank does not imply equal memory access or backward behavior.'
concepts:
- ms.section.26.3
spec:
  dims:
    M: logical rows
    K: product reduction width
    Q: product output columns
    V: vocabulary rows
    d: feature width
  steps:
  - shape: '[M, K]'
    label: Dense inputs
  - shape: '[M, Q]'
    label: Dense outputs
    op: Reduce K against weights [K,Q]
  - shape: '[M, Q]'
    label: Normalized outputs
    op: Reduce features; save row statistics
  - shape: '[M, d]'
    label: Alternative gathered outputs
    op: Lookup indices into table [V,d]
```


### Softmax and cross-entropy

[MATHEMATICALLY-DERIVED] For a nonempty finite row, take $a=\max_v z_v$, $s=\sum_v\exp(z_v-a)$ and $p_v=\exp(z_v-a)/s$. At least one exponential is one, so $s\geq1$ in real arithmetic. Subtracting the maximum prevents positive exponent overflow, but does not define an all-masked row whose entries are negative infinity. Its output policy must be supplied separately. Backward for arbitrary upstream $h$ is $\bar z_v=p_v(h_v-\sum_jh_jp_j)$, making a second reduction necessary. Masked values must contribute zero to both the forward sum and valid backward dependence.

[MATHEMATICALLY-DERIVED] For class target $t_r$ and unweighted mean over $M_a>0$ active rows,

$$
\ell_r=a_r+\log s_r-z_{r,t_r},\quad
\mathcal L=M_a^{-1}\sum_{r\in\mathcal A}\ell_r,\quad
\bar z_{r,v}=M_a^{-1}(p_{r,v}-\mathbf1[v=t_r]).
$$

*(Eq. 26.4)*

The loss output can avoid writing $[M,V]$ probabilities. Backward can recompute them from logits and row statistics, still performing $O(MV)$ work. Probability targets replace the one-hot vector; class weights and label smoothing change the gradient and sometimes the reduction denominator. [OFFICIAL-DOCUMENTATION] PyTorch 2.14 documents ignore-index as applicable to class-index targets and averaging over nonignored targets. [R26.14], `ignore_index` and `reduction`. An all-ignored batch is a boundary requiring the exact reference policy, not an arbitrary division by one.


```figure
id: fig-26.10
kind: calculator
title: Dense-product reuse and materialized probabilities
caption: Illustrative configuration, not a measured model. The product intensity uses a single-read lower-bound
  byte model; probability bytes show one avoidable forward intermediate, not the output-gradient storage.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.3
alt: Illustrative configuration, not a measured model. The product intensity uses a single-read lower-bound byte
  model; probability bytes show one avoidable forward intermediate, not the output-gradient storage.
concepts:
- ms.section.26.3
spec:
  equation: '26.3'
  tex: I=2MQK/[b(MK+KQ+MQ)],\quad M_p=MVb
  inputs:
  - symbol: M
    label: rows
    default: 128
    min: 1
    max: 4096
    format: integer
  - symbol: K
    label: product reduction width
    default: 4096
    min: 1
    max: 32768
    format: integer
  - symbol: Q
    label: product output columns
    default: 4096
    min: 1
    max: 32768
    format: integer
  - symbol: V
    label: vocabulary rows
    default: 32768
    min: 1
    max: 262144
    format: integer
  - symbol: b
    label: bytes per stored value
    default: 2
    min: 1
    max: 8
    format: bytes
  outputs:
  - symbol: I
    label: ideal product FLOPs per byte
    formula: 2*M*Q*K/(b*(M*K+K*Q+M*Q))
    format: ratio
  - symbol: Mp
    label: materialized probability array
    formula: M*V*b
    format: bytes
```


### Stateful optimizer updates

[MATHEMATICALLY-DERIVED] For a declared AdamW-style update with fixed hyperparameters, $m_t=\beta_1m_{t-1}+(1-\beta_1)g_t$, $v_t=\beta_2v_{t-1}+(1-\beta_2)g_t^2$, $\hat m_t=m_t/(1-\beta_1^t)$ and $\hat v_t=v_t/(1-\beta_2^t)$. The parameter becomes $\theta_t=(1-\eta\lambda)\theta_{t-1}-\eta\hat m_t/(\sqrt{\hat v_t}+\varepsilon)$. This reconstructs the update shown in the versioned API; AMSGrad, maximize mode and differentiable optimization are separate variants. [R26.15], algorithm and parameters.

[DERIVED] Each parameter requires reading gradient, parameter and two moments, then writing parameter and two moments: seven value transfers in a uniform-width idealization. Master weights, step counters and mixed moment precision change that count. Fusion can reduce launch and intermediate traffic but cannot remove the moments from the state contract. Applying weight decay before versus after the adaptive update can change finite arithmetic and, under a different formula, even the mathematical method. Step counters must advance on the specified successful-update boundary; gradient-overflow skipping must preserve that state transition.

## Algorithm

[MATHEMATICALLY-DERIVED] A book-authored fused class-index loss procedure receives finite logits, targets, active-row mask and a declared accumulator type. It returns loss, optional saved row statistics and backward capability.

$$
\begin{aligned}
(1)&\quad\mathcal A\gets\{r:\operatorname{active}(r)\};\quad M_a\gets|\mathcal A|;\quad M_a=0\Rightarrow\operatorname{returnDeclaredEmptyPolicy}.\\
(2)&\quad\forall r\in\mathcal A:\ a_r\gets\max_v z_{r,v};\quad s_r\gets\sum_v\exp(z_{r,v}-a_r).\\
(3)&\quad\ell_r\gets a_r+\log(s_r)-z_{r,t_r};\quad\mathcal L\gets\operatorname{Sum}_a(\ell_{\mathcal A})/M_a.\\
(4)&\quad\bar z_{r,v}\gets\bar{\mathcal L}(\exp(z_{r,v}-a_r)/s_r-\mathbf1[v=t_r])/M_a.\\
(5)&\quad\bar z_{r,v}\gets0\ \text{for }r\notin\mathcal A;\quad\operatorname{publish}(\mathcal L,\bar z).
\end{aligned}
$$

Validate targets before indexed access. The invariant is that the same active-row set and normalizer govern forward and backward. Work is $O(MV)$; saved statistics require $O(M)$ values; output gradient itself requires $O(MV)$ when requested. The algorithm excludes weighted and smoothed targets deliberately; their inclusion needs the corresponding formulas rather than reusing this derivative.

## Implementation

[DERIVED] **PyTorch** in *Model / autograd framework* supplies the reference API semantics; **NVIDIA cuBLAS / cuBLASLt**, **NVIDIA CUTLASS** and **Triton language** in *Kernels / numerics / collectives* supply possible product and custom-operator routes. **NVIDIA CUDA** and **AMD HIP** supply accelerator execution. The actual selected kernel is UNVERIFIED until dispatch and generated artifacts are inspected. Parameterize storage, multiplication and accumulation dtypes separately, and record saved tensors for backward. Distributed normalization or vocabulary-parallel loss introduces collectives beyond this section's single-device boundary and belongs to Chapter 29.


```figure
id: fig-26.11
kind: systems-trace
title: Forward outputs and backward obligations
caption: A forward-only speed comparison can omit the most expensive or contended part of an operator. Persistent
  optimizer state is an output of the update and must be validated after every accepted transition.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.3
alt: A forward-only speed comparison can omit the most expensive or contended part of an operator. Persistent optimizer
  state is an output of the update and must be validated after every accepted transition.
concepts:
- ms.section.26.3
spec:
  columns:
  - latency
  - memory
  - compute
  - communication
  - failure
  stages:
  - name: Embedding
    values:
      latency: Gather and gradient separately
      memory: Table reads; gradient representation
      compute: Index selection; duplicate combine
      communication: No network assumed
      failure: Repeated-index gradient race
  - name: Normalization
    values:
      latency: Forward and backward reductions
      memory: Row statistics or recomputation
      compute: Mean and variance reductions
      communication: No network assumed
      failure: Epsilon or variance mismatch
  - name: Softmax and loss
    values:
      latency: All active rows included
      memory: Logits; optional row statistics
      compute: Max; exponent sum; loss reduce
      communication: No network assumed
      failure: Wrong active-row denominator
  - name: Optimizer
    values:
      latency: Successful update boundary
      memory: Parameters and two moments
      compute: Moment and adaptive update
      communication: No network assumed
      failure: Counter advances after skipped step
```


[DERIVED] The operator ledger counts mathematical work and explicit state: GEMM includes weights and activation reuse, embedding includes table and duplicate-index accumulation, normalization/softmax include reductions, and the optimizer includes persistent moments. Valid token count is fixed across equivalent routes; temporary padding is additional executed work. Communication outside local memory is absent only for a locally resident operator with no placement conversion. Actual traffic, achieved throughput, energy and money remain UNVERIFIED; power and billed-resource evidence are required beyond the byte/FLOP identities.

## Experimental design

[NOT-DISCLOSED] No inspected source supplies a matched benchmark covering every operator contract above. API examples establish signatures and semantics; they are not a controlled operator comparison. [ASSUMED] The proposed shape matrix includes tall/wide/single-row products, repeated and unique indices, small/large normalization widths, partial rotary widths, extreme logit spreads, ignored rows and optimizer state restart. Compare forward outputs, vector-Jacobian products, parameter gradients and persistent state separately. Timings include all required reduction stages and casts. Seal correctness cases before selecting the fastest candidate.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The versioned APIs expose contract variants; the 2026 compiler release expands generated-product integration. No all-operator superiority claim is supported.

**What the evidence shows.** [DERIVED] The interface differences are material enough to invalidate duration comparisons that omit masks, reduction denominators or optimizer state. No book-authored operator measurement was run.

**What we infer.** [MATHEMATICALLY-DERIVED] Eqs. 26.3–26.4 connect reuse and reductions to physical work. Removing probability storage does not remove the need to produce an output gradient if the caller requests it.

**What remains unknown.** [UNVERIFIED] Kernel dispatch, low-precision error, source-specific workspace, achieved bandwidth and full training-step effects require execution.

## Failure modes

[DERIVED] Duplicate embedding indices reveal missing atomic/reduction handling. Nearly constant large normalization inputs expose variance cancellation. Rotary layout mismatches produce plausible shapes with incorrect pairs. All-masked softmax rows expose undefined normalization. Loss averages can be wrong while per-row losses appear correct. Optimizer kernels can match one update and diverge after overflow skipping or checkpoint restoration. These tests target distinct state and mathematical failures; one aggregate model loss cannot localize them.

## Siblings

[DERIVED] GEMM versus GEMV changes reuse; layer versus RMS normalization changes the function; logits-to-loss fusion versus materialized probabilities changes storage; dense versus sparse embedding gradients changes the output representation. Their canonical kernel consequences are developed here; general numerical policy is in [§26.6](26-6-correctness-under-optimization.md).

## Extensions

[OFFICIAL-DOCUMENTATION] NVIDIA's June 15, 2026 fused-MLP disclosure combines grouped products with activations and quantization, including weight repacking to colocate GLU halves. [R26.12], “Optimizing GLU activation functions via fused GEMM epilogues”. [DERIVED] This is a dataflow transformation requiring an altered physical layout; it is not permission to change the activation's mathematical contract.

## Limitations

[DERIVED] The formulas exclude quantization error models, sparse-product structure and distributed reductions. All costs are idealized useful work/traffic, not profiler results. Complete operator parity is necessary but does not establish unchanged training convergence under repeated low-precision updates.

## Reproducibility

[DERIVED] Record every semantic switch alongside shape and dtype. Retain reference outputs, gradients, moment states and active-row counts. Pin API release and actual operator dispatch independently. Verification is proposed and unexecuted.

## References

[R26.11] PyTorch 2.14 release; [R26.12] NVIDIA fused MLP disclosure; [R26.13] embedding API; [R26.14] cross-entropy API; [R26.15] AdamW API. All versioned to eligible 2026 releases; see [references.md](references.md).
