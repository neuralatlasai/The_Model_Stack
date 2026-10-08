---
id: ms.section.5.2
entity_type: section
title: Attention calculation
short_title: Attention
volume: 1
part: 1
chapter: 5
section: 5.2
slug: 05-2-attention-calculation
parent: ms.chapter.5
prev_sibling: ms.section.5.1
next_sibling: ms.section.5.3
children: []
prerequisites: [ms.section.3.2, ms.section.5.1]
downstream: [ms.section.5.5, ms.section.5.6, ms.section.14.1, ms.section.14.5, ms.section.27.1, ms.section.42.2]
related: [ms.section.15.1]
siblings_by_mechanism: [ms.section.14.1, ms.section.14.2, ms.section.14.3]
relations:
  - {type: supported_by, target: paper.P01}
  - {type: supported_by, target: paper.P19}
  - {type: implemented_by, target: impl.pytorch}
  - {type: implemented_by, target: impl.flashattention}
axes:
  lifecycle: [pretraining, inference]
  mechanism: [attention]
  feedback_setting: []
  modality: [text]
papers: [P01, P19]
implementations: [impl.pytorch, impl.flashattention]
benchmarks: []
datasets: []
status:
  maturity: foundational
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED]
  empirically_observed: false
word_count_target: 1050
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 5.2 Attention calculation

## Scope

Scaled dot-product attention computes a mask-restricted, normalized weighted combination of value vectors. The query/key projections determine scores, the mask determines which conditional dependencies are permitted, and the value/output projections determine the result's representation. Multi-head attention partitions projected channels into independently normalized groups before combining their outputs. The calculation below includes the forward function, its derivatives, exact dense and causal arithmetic counts, materialized tensor sizes, and the difference between a logical score matrix and an allocated one. (PAPER-REPORTED: P01 section 3.2; MATHEMATICALLY-DERIVED: Eq. 5.4-5.8 and derivatives.)

## Why this exists

An attention branch provides input-dependent interaction between positions without a recurrent state transition along the training sequence. This interaction is nonlinear even before a feed-forward activation is added: Q and K depend on the input, their product is bilinear, and softmax changes the normalized weights. Describing attention as only a linear map would therefore give an incorrect account of the Transformer's representational function. For fixed probabilities P, the map V to PV is linear; that restricted statement does not make the complete attention branch linear. (MATHEMATICALLY-DERIVED.)

The computation also separates architectural dependence from execution. A dense causal mask defines all allowed past-position pairs. Evaluating that function by first producing a full T-by-T score array is one implementation; a tiled exact implementation can process blocks and combine normalization statistics without storing the full array in HBM. Both retain the arithmetic dependence on the number of allowed query-key pairs. A memory reduction is not evidence of linear-time full attention. (PAPER-REPORTED: P19 section 3/Theorems1-2.)

## Intuition

For one query row i, the allowed logits are normalized by their shared partition function. Adding a common finite constant to all allowed logits changes neither their probabilities nor the attention output. Multiplying the logits by a scalar generally does change the probabilities: it changes their relative differences and therefore the distribution's concentration. A mask operates before normalization; deleting a forbidden value after an unmasked softmax would leave its probability mass in the denominator and would not compute the intended conditional distribution. (MATHEMATICALLY-DERIVED.)

The usual inverse-square-root head scaling follows a stated source model for initialization: independent, centered unit-variance query and key components give a dot product with variance d_h. Dividing by sqrt(d_h) then gives unit variance. Learned queries and keys need not satisfy those premises after training, and a particular logit distribution or training outcome cannot be inferred from the scaling constant alone. (PAPER-REPORTED: P01 section 3.2.1 footnote; MATHEMATICALLY-DERIVED: variance sum.)

## Formulation

Let n have shape `[B, T, d]`; take H heads of width d_h with `d=H*d_h`. In the equal-query/KV-head reference, each of W_Q, W_K, W_V, W_O has shape `[d, d]`. Head splitting transforms `[B, T, d]` to `[B, H, T, d_h]` by a declared channel ordering. It is a layout operation, not additional model arithmetic. The symbols V and P in equations below denote value vectors and attention probabilities locally; vocabulary size is used only in the output-head discussion.

$$
Q=nW_Q,\quad K=nW_K,\quad V=nW_V,\qquad Q,K,V\mapsto\mathbb R^{B\times H\times T\times d_h}.
$$
*(Eq. 5.4)*

$$
S_{b,h,i,j}=\frac{Q_{b,h,i,:}K_{b,h,j,:}^{\top}}{\sqrt{d_h}}+M_{b,i,j}.
$$
*(Eq. 5.5)* Here M is 0 for an allowed pair and negative infinity for a forbidden pair. A batch-specific mask can combine causality, padding, and document boundaries. For ordinary unpadded self-attention, a pair is allowed exactly when j is no greater than i.

$$
P_{b,h,i,j}=\frac{\exp(S_{b,h,i,j}-m_{b,h,i})}{\sum_{k\in\mathcal A_{b,i}}\exp(S_{b,h,i,k}-m_{b,h,i})},\quad
C_{b,h}=P_{b,h}V_{b,h},\quad m_{b,h,i}=\max_{j\in\mathcal A_{b,i}}S_{b,h,i,j}.
$$
*(Eq. 5.6)* This definition requires a nonempty allowed set and finite allowed scores. Forbidden positions have probability0. A fully masked row does not define a categorical distribution; returning zero for it is an explicit extension of the operator, not a consequence of this quotient.

$$
a=\operatorname{merge}(C)W_O\in\mathbb R^{B\times T\times d}.
$$
*(Eq. 5.7)* Merge restores the declared head/channel ordering.

$$
M_{\mathrm{one\ score\ copy}}=BH T^2 b_s\quad\text{bytes}.
$$
*(Eq. 5.8)* The dtype-specific b_s need not equal the residual or cache element size. One array's size is distinct from peak live memory, allocator reserve, or HBM traffic. (MATHEMATICALLY-DERIVED.)

```figure
id: fig-5.7
kind: tensor-flow
title: Shape trace of one causal attention block
caption: >-
  Only two steps change the shape class: the score product turns
  [B, H, T, Dh] into [B, H, T, T], and P·V turns it back. Every step with a
  weight costs a multiple of D² per token; the two weight-free matmuls cost
  2·T·D each, and the two [B, H, T, T] tensors are where the bytes go.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.4", "DERIVED:eq-5.5", "DERIVED:eq-5.6", "DERIVED:eq-5.7"]
alt: >-
  Eight-step tensor trace for Eq. 5.4 to 5.7 with D = H·Dh. The normalised
  stream [B, T, D] goes through the packed QKV projection (6·D² FLOPs per
  token, 3·D² parameters) to [B, T, 3, H, Dh]; it is split and transposed
  without arithmetic into Q, K and V, [3, B, H, T, Dh]; Q·Kᵀ/√Dh plus the
  causal mask gives the scores [B, H, T, T] (2·T·D FLOPs per token, B·H·T²·b
  bytes); a max-subtracted row softmax gives the probabilities [B, H, T, T]
  (another B·H·T²·b bytes, kept for the backward pass); P·V gives the context
  [B, H, T, Dh] (2·T·D FLOPs per token); a transpose and merge gives
  [B, T, D]; and W_O (2·D² FLOPs per token, D² parameters) gives the
  attention output a, [B, T, D].
spec:
  dims: { B: "sequences", T: "positions", D: "model width, D = H·Dh", H: "heads", Dh: "head dimension" }
  steps:
    - { shape: "[B, T, D]", label: "n, normalised residual stream" }
    - { shape: "[B, T, 3, H, Dh]", label: "qkv, packed", op: "n · [W_Q W_K W_V], Eq. 5.4", cost: "6·D² FLOPs/token · 3·D² params" }
    - { shape: "[3, B, H, T, Dh]", label: "Q, K, V", op: "split + transpose, no arithmetic", cost: "3·B·T·D·b bytes" }
    - { shape: "[B, H, T, T]", label: "scores S", op: "Q·Kᵀ/√Dh + M, Eq. 5.5", cost: "2·T·D FLOPs/token · B·H·T²·b bytes" }
    - { shape: "[B, H, T, T]", label: "probabilities P", op: "row softmax, max-subtracted, Eq. 5.6", cost: "B·H·T²·b bytes, kept for backward" }
    - { shape: "[B, H, T, Dh]", label: "context C", op: "P · V, Eq. 5.6", cost: "2·T·D FLOPs/token" }
    - { shape: "[B, T, D]", label: "merge(C)", op: "transpose + merge, no arithmetic" }
    - { shape: "[B, T, D]", label: "a, attention output", op: "· W_O, Eq. 5.7", cost: "2·D² FLOPs/token · D² params" }
```

```figure
id: fig-5.8
kind: calculator
title: Score-matrix bytes per layer
caption: >-
  Eq. 5.8 at the §5.6 defaults (illustrative, not a named model) gives
  192 MiB per copy, and Algorithm 5.2 holds two copies, S and P. The last
  output is T/Dh: the score tensor measured in units of one [B, T, D]
  activation. Move T one notch and it doubles; the preset at T = 8192 reaches
  the 12 GiB per layer of §5.6.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.8"
alt: >-
  Calculator for Eq. 5.8, M = B·H·T²·b bytes per layer per materialised copy.
  With B = 8, H = 12, Dh = 64, T = 1024 and b = 2 (illustrative reference
  configuration, not a named model) one copy is 192 MiB, S and P together are
  384 MiB, one [B, T, D] tensor with D = H·Dh = 768 is 12 MiB, and the ratio
  is 16. Preset T = 8192 gives 12 GiB per copy and ratio 128; preset B = 1,
  H = 32, T = 8192 gives 4 GiB per copy.
spec:
  tex: >-
    M_{\text{scores}} = B\,H\,T^{2}\,b
  equation: "5.8"
  inputs:
    - { symbol: B, label: "sequences", default: 8, min: 1, max: 64, scale: log2, format: integer }
    - { symbol: H, label: "heads", default: 12, min: 1, max: 128, options: [1, 4, 8, 12, 16, 32, 64, 128], format: integer }
    - { symbol: Dh, label: "head dimension", default: 64, min: 32, max: 256, options: [32, 64, 128, 256], format: integer }
    - { symbol: T, label: "sequence length", default: 1024, min: 128, max: 131072, scale: log2, format: tokens }
    - { symbol: b, label: "bytes per value", default: 2, min: 1, max: 4, options: [1, 2, 4], format: bytes }
  outputs:
    - { symbol: M, label: "scores per layer, one copy", formula: "B*H*T^2*b", format: bytes, emphasis: true }
    - { symbol: M2, label: "S and P held, Algorithm 5.2", formula: "2*M", format: bytes }
    - { symbol: X, label: "one [B, T, D] tensor, D = H·Dh", formula: "B*T*H*Dh*b", format: bytes }
    - { symbol: R, label: "scores ÷ [B, T, D], = T/Dh", formula: "M/X", format: ratio }
  presets:
    - { label: "reference, T = 8192", values: { T: 8192 } }
    - { label: "B = 1, H = 32, T = 8192", values: { B: 1, H: 32, T: 8192 } }
```

## Mechanism

### Methodology

The three input projections cost6d^2 multiply-add FLOPs per token and contain3d^2 parameters; the output projection contributes2d^2 FLOPs and d^2 parameters. With dense square QK-transpose and PV products, each product costs2BH*T^2*d_h FLOPs, giving4B*T^2*d for the pair. The per-token attention total is therefore8d^2+4Td, excluding scale, mask, probability normalization, and dropout. These excluded operators still execute and can matter for runtime. The exact scalar multiply/add count2mnp-mp differs from the conventional2mnp GEMM reporting convention; this chapter consistently uses the latter. (MATHEMATICALLY-DERIVED.)

A causal sequence has T(T+1)/2 allowed pairs per head. If an implementation skips precisely the forbidden work, the two attention products average2(T+1)d FLOPs per token, rather than 4Td. A dense product followed by masking still executes the dense product. Tile boundaries can introduce padding or partially masked blocks, so a real kernel's issued instructions need not equal the allowed-pair ideal. Softmax and masking operate on O(BHT^2) entries in the materialized path; their omission from a matmul table does not make them free.

For the dense reference, the ratio of score-product work to projection work is T/(2d). With d=768 it is 2/3 at T=1024 and 16/3 at T=8192. This is an arithmetic ratio, not a measured runtime ratio. The size of one score array relative to one residual array is T/d_h when element sizes agree: at d_h=64 it is 16 for T=1024 and 128 for T=8192. Neither ratio by itself identifies the device's first capacity limit or the performance bottleneck; saved activations across layers, logits, weight storage, workspaces, and bandwidth must also be counted.

The backward computation makes the nonlinearity explicit. For one head let G be the upstream derivative with respect to C, with mask and scale held fixed. Differentiate C=PV to obtain `dV=P^T G` and `dP=G V^T`. The softmax vector-Jacobian product is

$$
\bar S=P\odot\left(\bar P-\operatorname{rowsum}(P\odot\bar P)\right),\qquad
\bar Q=\bar S K/\sqrt{d_h},\qquad
\bar K=\bar S^{\top}Q/\sqrt{d_h}.
$$
Bars denote cotangents, and the row sum is broadcast along the key axis. Every row of barS sums to0 because adding a common score offset leaves softmax unchanged. For forbidden entries P=0, so their score derivatives vanish. This does not imply that an input token with no direct prediction loss receives no gradient: it can contribute keys or values to later supervised queries. The projection derivatives then use the ordinary dense-layer rule, accumulating contributions from Q, K, and V into the shared input. (MATHEMATICALLY-DERIVED.)

A materialized backward can retain P along with Q, K, V and necessary projection inputs. P19 instead recomputes tiled probabilities from stored normalization statistics and applies the same mathematical derivatives. Its online-normalization state combines a running maximum, rescaled denominator, and weighted numerator; changing the maximum requires rescaling both accumulated quantities. Omitting that rescaling would combine blocks normalized on incompatible scales. The complete IO-aware kernel and proof belong to27.1, while this section defines the function they must preserve. (PAPER-REPORTED: P19 section 3 and AppendixB.)

```figure
id: fig-5.9
kind: chart
title: Attention FLOPs per token, projections against score matmuls
caption: >-
  The projection term 8·D² is flat in T; the two score matmuls grow as 4·T·D
  and overtake it at T = 2D, which is 1536 for D = 768. Their ratio T/(2D) is
  2/3 at T = 1024 and 16/3 at T = 8192. A kernel that skips masked work
  follows the lower rising line, 2·(T+1)·D.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.4", "DERIVED:eq-5.5", "DERIVED:eq-5.6", "DERIVED:eq-5.7"]
alt: >-
  Log–log line chart of attention FLOPs per token per block against sequence
  length T from 128 to 65,536, at D = 768. The projections, 8·D², are
  constant at 4,718,592 FLOPs. The score matmuls under a full mask, 4·T·D, are
  3,145,728 FLOPs at T = 1024 (two thirds of the projections), equal the
  projections at T = 1536, and reach 25,165,824 FLOPs at T = 8192 (about 5.3
  times). The causal-skipping line, 2·(T+1)·D, runs just above half of the
  full-mask line.
spec:
  type: line
  x: { label: "sequence length T", scale: log2, format: tokens, domain: [128, 65536] }
  y: { label: "FLOPs per token per block", scale: log2, format: flops }
  variables: { D: 768 }
  series:
    - { id: proj, label: "projections, 8·D²", formula: "8*D^2", sample: { from: 128, to: 65536, count: 10 }, dashed: true }
    - { id: full, label: "score matmuls, full mask, 4·T·D", formula: "4*x*D", sample: { from: 128, to: 65536, count: 10 }, emphasis: true }
    - { id: causal, label: "score matmuls, masked work skipped", formula: "2*(x+1)*D", sample: { from: 128, to: 65536, count: 10 } }
  annotations:
    - { x: 1024, label: "T/(2D) = 2/3" }
    - { x: 1536, label: "T = 2D: equal" }
    - { x: 8192, label: "T/(2D) = 16/3" }
```

```figure
id: fig-5.10
kind: chart
title: Score-matrix bytes against the linear attention tensors
caption: >-
  The score-to-residual allocation ratio is T/d_h:16 at T=1024,128 at
  T=8192. S-plus-P counts two copies, and Q/K/V/C four residual-sized tensors.
  Their sum is a partial inventory only if their lifetimes overlap; it omits
  inputs, outputs, mask, softmax temporaries, backward state, and workspace.
  It does not determine the complete measured peak of Algorithm 5.2.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.8"
alt: >-
  Log–log line chart of bytes per layer against sequence length T from 128 to
  65,536, at B = 8, H = 12, Dh = 64 (D = 768) and 2 bytes per value. One score
  copy, B·H·T²·b, is 192 MiB at T = 1024 and 12 GiB at T = 8192; S and P held
  together are twice that. Q, K, V and C together, 4·B·T·D·b, are 48 MiB at
  T = 1024. One [B, T, D] tensor is 12 MiB at T = 1024 and 96 MiB at T = 8192,
  so the score copy is 16 and 128 times larger at those lengths.
spec:
  type: line
  x: { label: "sequence length T", scale: log2, format: tokens, domain: [128, 65536] }
  y: { label: "bytes per layer, BF16", scale: log2, format: bytes }
  variables: { B: 8, H: 12, Dh: 64, b: 2 }
  series:
    - { id: sp, label: "S and P held, 2·B·H·T²·b", formula: "2*B*H*x^2*b", sample: { from: 128, to: 65536, count: 10 }, dashed: true }
    - { id: s, label: "one score copy, B·H·T²·b (Eq. 5.8)", formula: "B*H*x^2*b", sample: { from: 128, to: 65536, count: 10 }, emphasis: true }
    - { id: qkvc, label: "Q, K, V, C together, 4·B·T·D·b", formula: "4*B*x*H*Dh*b", sample: { from: 128, to: 65536, count: 10 } }
    - { id: one, label: "one [B, T, D] tensor", formula: "B*x*H*Dh*b", sample: { from: 128, to: 65536, count: 10 }, dashed: true }
  annotations:
    - { x: 1024, label: "S = 16 × one [B, T, D]" }
    - { x: 8192, label: "S = 128 × one [B, T, D]" }
```

```figure
id: fig-5.11
kind: matrix
title: Causal mask at T = 8
caption: >-
  Row i admits key j when j<=i. At T=8 there are 36 allowed pairs out of 64,
  a fraction9/16. This counts useful causal pairs; a dense product followed
  by masking still computes64, and tiled execution may compute boundary
  entries. Pair counts do not establish a measured speedup.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.5"
alt: >-
  Eight by eight grid with query position i from 0 to 7 down the rows and key
  position j from 0 to 7 across the columns. Cells on and below the diagonal
  are filled (admitted); cells above it are empty (masked to minus infinity).
  Row 5 is highlighted across columns 0 to 5, six admitted keys. In total 36 of
  the 64 cells are admitted.
spec:
  rows: 8
  cols: 8
  pattern: causal
  rowLabel: "query position i"
  colLabel: "key position j"
  rowTicks: ["0", "1", "2", "3", "4", "5", "6", "7"]
  colTicks: ["0", "1", "2", "3", "4", "5", "6", "7"]
  highlight:
    - { row: 5, col: 0 }
    - { row: 5, col: 1 }
    - { row: 5, col: 2 }
    - { row: 5, col: 3 }
    - { row: 5, col: 4 }
    - { row: 5, col: 5 }
  legend: "admitted j ≤ i: 36 of 64 pairs, (T+1)/(2T) = 9/16 at T = 8"
```

## Algorithm

```text
Algorithm 5.2 - Materialized causal multi-head attention
INPUT: n[B,T,d]; W_Q,W_K,W_V,W_O[d,d]; H with d divisible by H; allowed[B,T,T]
OUTPUT: a[B,T,d]
STATE: Q,K,V[B,H,T,d_h]; S,P[B,H,T,T]; C[B,H,T,d_h]
INVARIANT: every scored query has a nonempty allowed set; forbidden probabilities are zero
1. Project n into Q,K,V, then split channels into H declared heads.
2. Compute S = Q K^T / sqrt(d_h) in the declared numerical policy.
3. Replace forbidden scores by negative infinity; reject unsupported empty rows.
4. Compute stable softmax over allowed keys using a finite row maximum.
5. Compute C = P V; transpose and merge the heads in the original channel order.
6. Return a = merge(C) W_O.
TERMINATION: a finite straight-line calculation.
```

The dense arithmetic is O(B*T*d^2+B*T^2*d); explicit score/probability storage is O(B*H*T^2). The algorithm specifies its rejection of unsupported empty rows. A backend that defines their output as zero must state and test that extension separately. Dropout is disabled here, so normalized rows sum to1 within numerical tolerance. Applying dropout to P changes that per-realization row-sum property. (MATHEMATICALLY-DERIVED.)

## Implementation

The inspected PyTorch 2.14 SDPA documentation lists three supported implementations: FlashAttention-2, memory-efficient attention, and the PyTorch C++ mathematical implementation. The C++ path is one of the three, rather than a fourth implementation after three fused kernels. Dispatch depends on input constraints. The interface's Boolean attention mask uses True for an allowed entry; `MultiheadAttention` uses True for a masked-out entry. Copying a Boolean mask between those APIs without changing its meaning can invert visibility. (OFFICIAL-DOCUMENTATION: R5.13 Notes.)

Non-square causality needs special care. PyTorch's documented `is_causal=True` alignment is upper-left for non-square attention; a cached chunk with T_q new positions after an old prefix instead needs `j <= old_length+i`. R5.20 constructs the lower-right triangular bias with diagonal offset `T_k-T_q`. With a single new query and only valid past/current keys, every stored key is allowed, so no causal mask is necessary. Padding and document masks still apply where relevant. FlashAttention's inspected README documents its own lower-right alignment; a Boolean `causal` argument must therefore be interpreted through the selected API rather than assumed universal. (OFFICIAL-DOCUMENTATION: R5.13; R5.15; R5.20.)

SDPA applies dropout according to the supplied `dropout_p`; a caller must pass0 during deterministic evaluation instead of assuming that `model.eval()` changes a functional argument. Its documented reference path also rejects simultaneous explicit `attn_mask` and `is_causal`; combine the intended causal, padding, and document policy into one explicit mask when needed. The softmax reduction policy and QK accumulation policy are separate: subtracting a row maximum cannot repair a score that already overflowed to infinity.

Memory accounting distinguishes simultaneous S/P copies, saved tensors, allocator buffers, and temporary kernel workspace. A single-copy bound is not a peak-memory guarantee. Device traffic also depends on tiling and reuse; dividing FLOPs by the size of one output tensor is not a roofline arithmetic-intensity estimate for the complete operator. No latency or bandwidth result is claimed without a concrete trace.

## Experimental design

### Reported experiments

P01 section 6.2 changes the head configuration within its translation model and evaluates source-defined perplexity and BLEU. It distinguishes the complete model's reported outcome from the simplified equal-width arithmetic account. Changing the number of heads while fixing total projected width changes normalization groups and head dimensions even when projection parameters remain fixed. (PAPER-REPORTED: P01 Table 3.)

P19 section 4 evaluates kernel execution and end-to-end training in its stated hardware and model settings. The mechanism being tested is an IO-aware exact evaluation, whereas task outcomes and runtime measurements depend on the complete configuration. Its asymptotic IO analysis and empirical speedups are separate evidence: the former follows a memory model and size regime; the latter is measured for specific implementations. This chapter does not transplant a speedup into an unmeasured reference. (PAPER-REPORTED: P19 sections 3-4.)

## Observations

**What the paper claims.** P01 defines scaled multi-head attention; P19 gives an exact tiled implementation with lower HBM traffic in its analyzed regime. PyTorch documents API-specific masking, dropout, and dispatch semantics. (PAPER-REPORTED; OFFICIAL-DOCUMENTATION.)

**What the evidence shows.** Full attention retains quadratic allowed-pair arithmetic even when the score array is not materialized in HBM. Equal projected width can preserve projection parameter counts while changing the learned function through different heads and normalization groups. (MATHEMATICALLY-DERIVED.)

**What we infer.** Correctness checks must cover probabilities, output values, derivatives, masks, and cached-position alignment. Equal tensor shapes or equal parameter totals cannot establish these properties. (MATHEMATICALLY-DERIVED.)

**What remains unknown.** The selected backend, measured traffic, numerical error, and latency for the chapter's reference have not been executed or measured. Unsupported backend shapes and empty-row behavior require a version-specific check. (UNVERIFIED.)

## Failure modes

An inverted or post-softmax mask can preserve plausible output shapes while changing the conditional model. A deterministic future-perturbation test and an explicit probability inspection distinguish visibility errors from ordinary training variation. In cached chunks, an upper-left mask can ignore valid prefix keys; inspect the allowed absolute index pairs before comparing final logits.

A fully masked row can yield an undefined normalization or backend-specific extension. Validate which queries are scored and ensure that each has a valid key; explicitly define ignored-row outputs when padding creates empty rows. Logit overflow before normalization is a separate numerical failure from exponent overflow after normalization, and needs a compatible accumulation policy.

A head/channel permutation error changes the function while preserving all dimensions. Intermediate comparison of projected and merged tensors localizes it. An out-of-memory event in an explicit score allocation is explained by Eq. 5.8, but replacing the kernel does not guarantee the entire model fits: retained FFN tensors, logits, and optimizer state can remain limiting. These are analytical failure mechanisms and proposed diagnostics, not measurements from an executed reference.

## Siblings

Shared-key/value attention changes the number and width of K/V projections and cache entries while retaining query heads. Latent attention introduces a compressed state and a different projection decomposition. Sparse or sliding attention changes the allowed-pair set and therefore the conditional dependencies. Their scientific treatments are in 14.1-14.3; a changed state representation or mask must be specified before importing the formulas above.

Exact IO-aware execution preserves the defined dense attention function in real arithmetic while changing tiling, saved state, and recomputation. It belongs to27.1. Floating-point output differences still depend on reduction order and numerical policy. An execution optimization and a changed attention architecture therefore require different equivalence criteria. (PAPER-REPORTED: P19 section 3.)

```figure
id: fig-5.12
kind: compare
title: Attention siblings as differentials of the reference trace
caption: >-
  Shared-KV heads alter projections and cache dimensions while leaving the
  number of materialized query-head scores unchanged. Local masking reduces
  work/storage only with execution exploiting sparsity. P19 changes exact
  attention execution, with possible rounding differences. A latent cache
  may include positional state beyond its compressed content vector.
  These alternatives have source-specific layouts and quality evidence.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.8", R5.6, P19]
alt: >-
  Comparison of five attention forms on K, V bytes per token per layer and
  score bytes per layer at fixed D, H_q and T. Reference MHA: 2·H·Dh·b and
  B·H·T²·b. MQA and GQA: 2·H_kv·Dh·b, a reduction by H_q/H_kv, with scores
  unchanged. Latent, MLA-style: the cache stores a compressed content plus any required positional state per token,
  layout implementation-dependent, scores unchanged if materialised. Sparse or
  sliding-window: K, V row unchanged, stored/computed pairs become O(T*w) only with sparse execution.
  IO-aware exact execution (FlashAttention): K, V unchanged, no [B, H, T, T]
  tensor in HBM, O(T) bytes, identical function. The rows also list the
  changed primitive, the function computed and the new failure mode.
spec:
  axis: >-
    K, V bytes per token and score bytes per layer at fixed D, H_q and T, plus
    whether the function computed is unchanged; quality is not an axis here
  columns:
    - { id: mha, label: "MHA, reference (§5.2)", node: ms.section.5.2 }
    - { id: gqa, label: "MQA / GQA", node: ms.section.14.1 }
    - { id: mla, label: "Latent (MLA-style)", node: ms.section.14.2 }
    - { id: sparse, label: "Sparse / sliding-window", node: ms.section.14.3 }
    - { id: io, label: "IO-aware exact (FlashAttention)", node: ms.section.27.1 }
  rows:
    - { dimension: "changed primitive", values: { mha: "per-head W_K, W_V; full causal mask", gqa: "W_K, W_V shared across query heads", mla: "K, V [B, H, T, Dh] → latent [B, T, d_c]", sparse: "full causal mask → banded or block mask", io: "two GEMMs + stored P → one tiled kernel with recomputation" } }
    - { dimension: "K, V bytes per token per layer", values: { mha: "2·H·Dh·b", gqa: "2·H_kv·Dh·b, ÷ H_q/H_kv", mla: "compressed content plus positional state; layout-specific", sparse: "2·H·Dh·b, unchanged", io: "2·H·Dh·b, unchanged" } }
    - { dimension: "score bytes per layer", values: { mha: "B·H·T²·b (Eq. 5.8)", gqa: "B·H_q·T²·b, unchanged", mla: "B·H·T²·b if materialised, unchanged", sparse: "O(T*w) per head only with sparse storage", io: "no [B, H, T, T] in HBM; O(T) bytes" } }
    - { dimension: "score FLOPs per token per layer", values: { mha: "4·T·D, full mask", gqa: "4·T·D, unchanged", mla: "not derived here (§14.2)", sparse: "O(w*D) with sparse execution", io: "4·T·D forward, plus recomputation in backward" } }
    - { dimension: "function computed", values: { mha: "reference", gqa: "a different model (shared K, V)", mla: "a different model (latent K, V)", sparse: "a different model (subset of keys)", io: "same real-arithmetic attention; rounding may differ" } }
    - { dimension: "new failure mode", values: { mha: "score OOM as T grows", gqa: "reduced K, V capacity at H_kv = 1", mla: "implementation-dependent cache layout", sparse: "coverage gaps for distant evidence", io: "shape, dtype and hardware support limits" } }
```

## Extensions

### Improvements

For cross-attention, Q has T_q positions and K/V have T_k positions, so the score shape becomes `[B, H, T_q, T_k]` and the two products cost4B*T_q*T_k*d when projected widths agree. The projections can also use different source and target widths. The positional and masking contract must be re-established; a causal self-attention triangle is not a generic cross-attention mask. (MATHEMATICALLY-DERIVED.)

Packed QKV projections and fused attention are compatible when their channel ordering, mask, scale, and numerical policies agree. Neither eliminates the need to compare gradients for training use. P19's improvement concerns HBM movement and saved state under a particular memory model, rather than an unconditional improvement for every device, sequence length, or dtype. (PAPER-REPORTED: P19 sections 3-4.)

## Limitations

The formulas assume equal query/KV head counts, equal query/key head widths, and dense projections without biases. The materialized reference excludes attention dropout and rejects unsupported empty rows. Its leading GEMM counts omit scalar/reduction work and backend padding; its byte formulas describe explicitly named arrays rather than measured peak allocation. The inverse-square-root scaling argument uses a stated initialization distribution and does not describe every learned logit distribution.

## Reproducibility

Record head ordering, projection shapes, masks in absolute indices, scale, dtype and accumulation policy, dropout, position IDs, and the selected backend. Compare a deterministic reference forward and backward over square, padded, and cached non-square cases. Proposed numerical checks remain in [verification.md](verification.md); no external attention implementation has been executed for this revision. Exact inspected source versions and locators are in [references.md](references.md).

## References

P01 ? P19 ? R5.6 ? R5.13 ? R5.15 ? R5.20 ? [references.md](references.md)
