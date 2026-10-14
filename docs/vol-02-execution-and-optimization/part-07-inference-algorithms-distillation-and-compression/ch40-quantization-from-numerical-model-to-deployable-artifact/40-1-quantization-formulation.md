---
id: ms.section.40.1
entity_type: section
title: Quantization formulation
volume: 2
part: 7
chapter: 40
section: 40.1
slug: 40-1-quantization-formulation
parent: ms.chapter.40
prev_sibling: null
next_sibling: ms.section.40.2
children: []
prerequisites: [ms.chapter.3, ms.chapter.25, ms.chapter.26]
downstream: [ms.section.40.2, ms.section.40.3, ms.chapter.42]
related: [ms.chapter.23]
relations: []
axes: {lifecycle: [inference, adaptation], mechanism: [quantization, numerical_representation], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1900
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 40.1 — Quantization formulation

## Scope

[DERIVED] The object being designed is a representable set together with an encoder, decoder and execution contract. The baseline stores every operand in BF16 and performs the corresponding floating-point operation. Success means that the reduced representation satisfies a declared distortion or task constraint and that its runtime realizes the intended storage and arithmetic. This section owns scale, zero point, granularity, clipping and quantization error; [§40.4](40-4-method-families.md) owns particular optimizers and codebooks.

## Why this exists

[DERIVED] A bit count alone says neither how values are represented nor which values lose precision. With sixteen codes, uniformly covering a large interval spends most resolution away from a concentrated distribution. Narrowing that interval improves central resolution but saturates tails. Dividing a tensor into groups reduces this competition within each group while increasing metadata and scale applications. The difficulty is a constrained allocation of representational resolution, coupled to the reduction axes of the computation.

[PAPER-REPORTED] Jacob et al. make exact representation of zero part of their affine integer contract and develop integer-only matrix multiplication around it [R40.5, §2.1–2.4]. That historical result remains useful in 2026 because padding, residual additions and biases still have algebraic requirements. It does not establish that every modern low-bit checkpoint executes integer arithmetic.

## Intuition

[DERIVED] Quantization projects onto a finite lattice, then an operator consumes the projected operands. Two distances matter: distance in the stored tensor and distance after multiplication by actual inputs. They coincide only for special input covariance. A large error in a direction never excited by the workload can be harmless locally; a small error aligned with a frequently excited direction can dominate output distortion. This explains why calibration-dependent objectives differ from weight MSE.

## Formulation

> **Definition — Affine quantizer.** [DERIVED] An encoder mapping a real scalar to a bounded integer code through a positive scale and integer zero point, paired with a decoder mapping that code back to a real approximation.

| Local symbol | Meaning |
|---|---|
| $k,q_-,q_+$ | Code width in bits and minimum/maximum integer code |
| $s>0,z$ | Scale in real-value units/code; integer zero point |
| $u,\widehat u,e$ | Real value, decoded approximation, and $\widehat u-u$ |
| $g,n_g$ | Values/group and number of groups |
| $F\in\mathbb R^{d_o\times d_i},U\in\mathbb R^{d_i\times n_c}$ | Linear weight and calibration inputs; $n_c$ calibration positions |
| $a_-,a_+$ | Intended clipping interval |
| $p(u),n_a$ | Scalar-value probability density and number of clipping candidates |
| $b_s,b_z$ | Bytes per stored scale and zero point |

[MATHEMATICALLY-DERIVED] With an explicitly chosen tie rule,

$$
q(u)=\operatorname{clip}_{[q_-,q_+]}\!\left(\operatorname{round}(u/s)+z\right),
\qquad \widehat u=s(q(u)-z).
$$
*(Eq. 40.1)*

where the decoded endpoints are $s(q_--z)$ and $s(q_+-z)$. An endpoint initialization is $s=(a_+-a_-)/(q_+-q_-)$ and $z=\operatorname{clip}(\operatorname{round}(q_--a_-/s))$. Because $z$ is integral, decoded endpoints need not equal requested endpoints exactly. That discrepancy belongs in the error calculation.

[DERIVED] A symmetric signed choice uses $z=0$ and an absolute bound. A range $[-7,7]$ for four bits sacrifices one code to symmetric endpoints; $[-8,7]$ uses every signed code but has unequal endpoint magnitudes. Both conventions exist algebraically, so the format must specify its convention. “Symmetric INT4” is insufficient metadata.

## Mechanism

### Methodology

> **Definition — Quantization granularity.** [DERIVED] The partition of tensor values that share scale, zero-point or codebook metadata, including its logical axis.

[MATHEMATICALLY-DERIVED] Inside decoded endpoints, nearest rounding gives $|e|\le s/2$ without a distribution assumption. The often used variance $s^2/12$ is stronger: it follows by integrating a uniform error density over $[-s/2,s/2]$. It is not an identity for deterministic weights. Errors can correlate with inputs and adjacent weights, especially after optimizing rounding.

$$
\mathbb E[e^2]
=\int_{r_-}^{r_+}(\mathcal Q(u)-u)^2p(u)\,du
+\int_{-\infty}^{r_-}(r_--u)^2p(u)\,du
+\int_{r_+}^{\infty}(r_+-u)^2p(u)\,du .
$$
*(Eq. 40.2)*

where $r_-,r_+$ are actual decoded endpoints and $\mathcal Q$ is Eq. 40.1's decoder-after-encoder. The first term measures rounding inside range; the remaining terms measure saturation. Reducing $s$ can reduce the first term while enlarging the tails. There is no distribution-free optimum clipping percentile.

[MATHEMATICALLY-DERIVED] The relevant linear reconstruction objective is

$$
\frac1{n_c}\|(F-\widehat F)U\|_F^2
=\operatorname{tr}\!\left[(F-\widehat F)\widehat\Sigma(F-\widehat F)^\top\right],
\qquad \widehat\Sigma=UU^\top/n_c .
$$
*(Eq. 40.3)*

where $\widehat\Sigma$ is an uncentered second moment, because the layer acts on inputs rather than centered residuals. Expanding the norm and cyclically permuting the trace proves equality. Replacing $\widehat\Sigma$ by identity removes input dependence and recovers weight MSE. Replacing it by its diagonal discards cross-channel cancellations.

[DERIVED] Tensor granularity uses one $(s,z)$ for all entries. Channel granularity assigns pairs along a declared axis; group granularity partitions an axis into contiguous or indexed blocks. Per-token activation scales vary along the outer matrix dimension, whereas per-input-channel scales vary along the reduction dimension. Outer scales can multiply an integer dot product afterward. Reduction-axis scales must occur inside partial sums unless an exact preceding reparameterization removes them.

```figure
id: fig-40.3
kind: diagram
title: Quantization and execution contracts
caption: The decoded tensor and executed operator are separate checks; a valid code stream alone does not establish a valid matrix product.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.1
alt: Real tensor values pass through clipping and rounding to codes plus scales and zero points. A decoder reconstructs approximations, which a runtime combines with inputs to produce outputs.
spec:
  direction: LR
  nodes:
    - {id: real, kind: tensor, label: real tensor}
    - {id: enc, kind: process, label: clipping and rounding}
    - {id: codes, kind: memory, label: codes and metadata}
    - {id: dec, kind: process, label: decode or fused operator}
    - {id: out, kind: tensor, label: numerical output}
  edges:
    - {from: real, to: enc}
    - {from: enc, to: codes}
    - {from: codes, to: dec}
    - {from: dec, to: out}
```

[MATHEMATICALLY-DERIVED] For $N$ values and a full-group layout, payload storage is

$$
M_{\rm payload}=\lceil Nk/8\rceil+n_g(b_s+b_z)+M_{\rm extra},
\qquad n_g=\lceil N/g\rceil .
$$
*(Eq. 40.4)*

where $b_s,b_z$ are bytes per scale and zero point; $M_{\rm extra}$ includes alignment and indices. Four-bit values with two scale bytes and two zero-point bytes per 128 values require approximately $4.25$ bits/value before other overhead. This analytical example is not a named artifact.

[MATHEMATICALLY-DERIVED] Encoding touches $O(N)$ values for a fixed quantizer, reads the source, and writes codes and metadata. Searching $n_a$ clipping candidates adds $O(n_aN)$ scalar-distortion work, or matrix reconstruction work for Eq. 40.3. Parameters and inference tokens do not decrease. Energy, latency and money cannot be inferred from stored bits; deployment measurements are absent here.

## Algorithm

### Algorithm 40.1 — Bounded affine encoding

[MATHEMATICALLY-DERIVED] Inputs are a finite tensor, explicit groups, $k$, tie rule, and finite interval set $\mathcal A$. Output is codes plus sufficient metadata. State is the group index and best distortion.

$$
\begin{aligned}
1.\;&j\leftarrow1;\quad\text{reject nonfinite inputs or empty }\mathcal A.\\
2.\;&(s_a,z_a)\leftarrow\operatorname{EndpointInit}(a,k),\quad a\in\mathcal A.\\
3.\;&s_a\le0\Rightarrow\text{use declared constant-group representation or reject}.\\
4.\;&a_j^\star\leftarrow\arg\min_{a\in\mathcal A}
       \sum_{u\in G_j}(\mathcal Q_{s_a,z_a}(u)-u)^2 .\\
5.\;&(q_{G_j},s_j,z_j)\leftarrow
       (\operatorname{Encode}(G_j;s_{a_j^\star},z_{a_j^\star}),s_{a_j^\star},z_{a_j^\star}).\\
6.\;&j<n_g\Rightarrow j\leftarrow j+1,\;\text{return to 2};
       \quad j=n_g\Rightarrow\text{return artifact}.
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] Completed groups remain decodable, codes remain in range, and at most $n_g|\mathcal A|$ candidate evaluations occur. A zero-valued group needs a convention such as a positive scale and all-zero decoded codes; division by zero is invalid. This is explanatory mathematical pseudocode, not an exact package implementation.

## Implementation

[OFFICIAL-DOCUMENTATION] TorchAO, routed by the plan's explicit anchor rather than a numbered stack entry, documents tensor subclasses and configurations in the PyTorch ecosystem [R40.11, §2–3]. PyTorch occupies **Model / autograd framework**. Reading interfaces does not verify packed kernels on a particular device.

[MATHEMATICALLY-DERIVED] Preserve group-axis identity through transposes and sharding. If parallelism splits a group, either the partition must align with group boundaries or the encoder must define new scale ownership and reduction. A shared scalar can be replicated; collecting a maximum across devices adds a collective that independent-group encoding avoids. Packing can pad the final group. These consequences follow from which values jointly determine $s$.

[MATHEMATICALLY-DERIVED] Asymmetric integer multiplication also introduces zero-point corrections. For a reduction of length $d_i$, $\sum_j(q_j-z_x)(p_j-z_w)$ expands to $\sum_jq_jp_j-z_w\sum_jq_j-z_x\sum_jp_j+d_i z_xz_w$. Static weight sums can be prepared offline; activation sums depend on the request. A symmetric weight zero point removes one correction. Whether a kernel fuses the remaining correction determines extra reads and launches.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Jacob et al. compare integer and floating MobileNet variants on ImageNet/mobile processors, and detection separately [R40.5, §4.2]. Disclosed cores include Snapdragon 835 big/LITTLE and Snapdragon 821 big. This tests a joint representation/runtime design, not tensor MSE alone. Its historical setup does not establish modern compiler equivalence.

## Observations

**What the paper claims.** [PAPER-REPORTED] Affine integer representation supports integer-only inference with practical accuracy/latency tradeoffs in the studied mobile networks [R40.5, §4].

**What the evidence shows.** [PAPER-REPORTED] Results distinguish cores and architectures; the paper attributes weaker acceleration on one platform to its floating-point implementation [R40.5, §4.2.1]. No 2026 LLM result follows.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 40.3 proves why equal tensor error need not imply equal layer error. Eq. 40.4 proves why equal code width need not imply equal artifact size.

**What remains unknown.** [UNVERIFIED] No encoder/kernel round trip was executed here. Tolerances, realized bandwidth, energy and task retention remain artifact-specific.

## Failure modes

> **Failure mode — Axis mismatch.** [MATHEMATICALLY-DERIVED] *Symptom:* decoded rows appear reasonable but matrix outputs differ sharply. *Cause:* scales use the wrong post-transpose axis. *Detection:* compare group membership before execution. *Mitigation:* serialize logical axis and physical layout separately.

[MATHEMATICALLY-DERIVED] Saturation invalidates the $s/2$ bound; a constant range invalidates naïve endpoint initialization; tie rules alter midpoint codes. One-sided tensors can waste codes under symmetric intervals. These cases require explicit contracts.

## Siblings

[MATHEMATICALLY-DERIVED] On representable geometry, uniform integers give constant absolute spacing; [nonuniform formats](40-4-method-families.md#mechanism) redistribute spacing; [mixed precision](40-2-quantization-targets.md) changes operator assignments. Finer groups exchange metadata and reduction cost for local dynamic range. None changes the likelihood objective by itself.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] NVFP4 adds block and tensor scales to a nonuniform four-bit codebook [R40.17, “What is NVFP4?”]. The changed primitive is local scaling plus supported low-bit floating multiplication. Its rationale is representational flexibility, not a theorem that floating codebooks dominate integers for every distribution. [§40.4](40-4-method-families.md) analyzes the format; [§40.3](40-3-ptq-and-qat.md) analyzes learned scales.

## Limitations

[MATHEMATICALLY-DERIVED] Local distortion is a surrogate. Exact equality of calibration outputs leaves inputs outside the span of $U$ unconstrained. If $v$ lies in the null space of $U^\top$, adding a row proportional to $v^\top$ preserves calibration outputs and changes other outputs. This counterexample blocks generalization guarantees from reconstruction alone.

## Reproducibility

[MATHEMATICALLY-DERIVED] Retain endpoints, stored scale dtype, zero-point dtype, code range, axis, rounding, padding and source hash. Numerical analysis must use the rounded stored scale rather than its pre-export value. These formulas are analytical claims; no model experiment was executed.

## References

[R40.5](references.md#r40-5), [R40.11](references.md#r40-11), [R40.17](references.md#r40-17).

```figure
id: fig-40.4
kind: calculator
title: Effective storage per value
caption: Illustrative complete-group payload from Eq. 40.4 excludes padding and indexes. Group size exposes the metadata floor.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.4
alt: Four-bit codes with four metadata bytes per 128 values require 4.25 bits per value before padding. Smaller groups increase metadata cost.
states:
  - {anchor: formulation, label: Groups of 128, variables: {g: 128}, note: Four-bit payload is not four effective bits.}
  - {anchor: mechanism, label: Groups of 32, variables: {g: 32}, note: Metadata rises to one bit per value.}
  - {anchor: failure-modes, label: Small groups, variables: {g: 8}, note: Metadata can equal the code payload.}
spec:
  tex: k_{\rm eff}=k+8m/g
  equation: "40.4"
  inputs:
    - {symbol: k, label: code bits, default: 4, min: 2, max: 8, format: integer}
    - {symbol: m, label: metadata bytes per group, default: 4, min: 0, max: 8, format: integer}
    - {symbol: g, label: group values, default: 128, min: 8, max: 256, scale: log2, format: integer}
  outputs:
    - {symbol: eff, label: effective bits per value, formula: k+8*m/g, format: fixed2}
```

```figure
id: fig-40.5
kind: stat-panel
title: Numerical contract boundaries
caption: These checks distinguish a lattice projection from its eventual runtime behavior.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.1
alt: The numerical contract specifies endpoints, scale dtype, zero point, grouping axis and rounding. Runtime validity is checked separately.
spec:
  header: AFFINE CONTRACT
  rows:
    - {key: interior error, value: at most scale divided by two}
    - {key: saturated error, value: no such bound}
    - {key: grouping, value: axis must be explicit}
    - {key: execution, value: separate contract}
```
