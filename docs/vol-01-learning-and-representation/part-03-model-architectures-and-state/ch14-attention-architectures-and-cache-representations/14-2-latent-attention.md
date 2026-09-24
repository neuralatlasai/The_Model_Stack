---
id: ms.section.14.2
entity_type: section
title: Latent attention
short_title: Latent attention
section: 14.2
slug: 14-2-latent-attention
parent: ms.chapter.14
prev_sibling: ms.section.14.1
next_sibling: ms.section.14.3
children: []
prerequisites: [ms.chapter.5, ms.chapter.13, ms.section.14.1]
downstream: [ms.chapter.15, ms.chapter.27, ms.chapter.42]
word_count_target: 1900
volume: 1
part: 3
chapter: 14
related: []
relations: []
axes: {lifecycle: [pretraining, inference], mechanism: [attention, cache_representation], feedback_setting: [], modality: [text, image, audio, video]}
papers: [P13, P19, P20]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.flashattention]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 14.2 — Latent attention

## Scope

**DERIVED.** This section derives the state retained by a specified MLA-style attention computation and distinguishes its latent decode path from expanded execution. It uses DeepSeek-V3's documented mechanism as a research anchor, not as a specification of every later DeepSeek model. The artifact names latent width, positional state, precision, and physical layout before calculating bytes. Positional encoding itself belongs to Chapter 15, reached through the [Part III map](../README.md).

## Why this exists

**PAPER-REPORTED — [P13](references.md#p13), §2.1.1.** DeepSeek-V3 uses joint low-rank key/value compression and a separate positional key component. Its report identifies the compressed KV vector and positional key as the state needed during generation.

**DERIVED.** Head sharing reduces the number of independent K/V projections, but still stores explicit vectors in each retained KV head. A different strategy preserves a common latent vector from which head-specific content keys and values can be reconstructed. Whether this reduces decode traffic depends on executing attention against the latent state rather than reconstructing and retaining all expanded heads. The algebra and the cache contract must therefore be developed together.

## Intuition

> **Definition — Latent KV state.** A per-token representation from which the specified attention mechanism's content keys and values are linearly reconstructed, retained together with any independently required positional or auxiliary state.

**DERIVED.** “Compressed” is relative to an expanded representation of this same parameterized mechanism. It does not establish lossless compression of arbitrary previously trained MHA keys and values. Training a model with a latent bottleneck changes its feasible representations; rearranging that trained model's linear operations can preserve its mathematical output.

**DERIVED.** Query-side latent compression is a different object. A new query is formed for the current step; historical queries are not ordinarily needed to attend over the retained past. Adding the query latent width to every token's persistent KV count would conflate an intermediate activation with recurrent state.

## Formulation

**MATHEMATICALLY-DERIVED — explicit reference construction.** Use column vectors. Let $h_s\in\mathbb R^{d_{\mathrm{model}}}$, latent $z_s\in\mathbb R^{d_c}$, content-key width $d_k$, value width $d_v$, and positional width $d_r$. Define

$$
z_s=W_Dh_s,\quad
k^C_{i,s}=U_{K,i}z_s,\quad
v_{i,s}=U_{V,i}z_s,\quad
k^R_s=R_sW_Rh_s,
\qquad
u_{i,t,s}=
\frac{(q^C_{i,t})^\top U_{K,i}z_s+(q^R_{i,t})^\top k^R_s}
{\sqrt{d_k+d_r}}.
$$
*(Eq. 14.5)*

where $U_{K,i}\in\mathbb R^{d_k\times d_c}$, $U_{V,i}\in\mathbb R^{d_v\times d_c}$, $W_R\in\mathbb R^{d_r\times d_{\mathrm{model}}}$, and $R_s$ is the chosen positional rotation. The query's positional transformation is included in $q^R$. Normalize $u$ over exactly the allowed source positions to obtain weights $a_{i,t,s}$.

**MATHEMATICALLY-DERIVED — absorption.**

$$
\widetilde q_{i,t}=U_{K,i}^{\top}q^C_{i,t},\quad
w_{i,t}=\sum_s a_{i,t,s}z_s,\quad
o_{i,t}=U_{V,i}w_{i,t},\quad
y_t=\sum_i W_{O,i}U_{V,i}w_{i,t}.
$$
*(Eq. 14.6)*

where $W_{O,i}\in\mathbb R^{d_{\mathrm{model}}\times d_v}$ is the output-projection block for head $i$. This rearranges a fixed linear computation; it neither removes the softmax nor permits summing latent outputs across heads before their distinct output maps.

<details><summary>Derivation of Eq. 14.6</summary>

**MATHEMATICALLY-DERIVED.** The score identity follows from associativity: $(q^C)^\top U_Kz=(U_K^\top q^C)^\top z$. For values, linearity gives $\sum_sa_sU_Vz_s=U_V\sum_sa_sz_s$. Output projection is linear over concatenated heads, so it can be decomposed into the displayed sum. The identity requires the same weights, mask, score scale, and positional term. Moving a nonlinear transform across the weighted sum is not justified.

</details>

**MATHEMATICALLY-DERIVED.** One unquantized logical latent cache has

$$
M_{\mathrm{latent}}=LBS(d_cb_c+d_rb_r),
$$
*(Eq. 14.7)*

where $b_c,b_r$ are bytes per latent and positional scalar. There is one shared positional key per token in this construction. A variant with head-specific positional state needs a different formula.

**MATHEMATICALLY-DERIVED — specified mixed layout.**

$$
m_{\mathrm{row}}=d_cb_c+n_{\mathrm{scale}}b_{\mathrm{scale}}+d_rb_r+m_{\mathrm{pad}}.
$$
*(Eq. 14.8)*

where $m_{\mathrm{row}}$ is bytes per physical token row, scale count and dtype are explicit, and padding is independent of logical dimensions. Page allocation and other workspaces remain outside this row count.

~~~figure
id: fig-14.6
kind: calculator
title: Latent cache with separate positional state
caption: Eq. 14.7 uses an illustrative unquantized layout. Both latent and positional widths contribute; metadata and allocation overhead are excluded.
placement: rail
anchor: formulation
states:
  - {anchor: formulation, label: Latent plus position, variables: {dc: 512, dr: 64}, note: "At the default workload, the two BF16 components occupy 288 MiB."}
  - {anchor: mechanism, label: Larger latent, variables: {dc: 1024, dr: 64}, note: "Doubling only latent width leaves the positional contribution unchanged."}
  - {anchor: failure-modes, label: Omitting position is invalid, variables: {dc: 512, dr: 0}, note: "256 MiB omits required positional state and is not the baseline's complete cache."}
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-14.7
alt: For 32 layers, one sequence and 8192 tokens, a 512-wide latent and 64-wide positional key at two bytes each occupy 288 MiB.
spec:
  tex: M=LBS(d_cb_c+d_rb_r)
  equation: "14.7"
  inputs:
    - {symbol: L, label: layers, default: 32, min: 1, max: 128, format: integer}
    - {symbol: B, label: sequences, default: 1, min: 1, max: 64, format: integer}
    - {symbol: S, label: cached tokens, default: 8192, min: 1, max: 131072, format: tokens}
    - {symbol: dc, label: latent width, default: 512, min: 32, max: 4096, format: integer}
    - {symbol: dr, label: positional width, default: 64, min: 0, max: 512, format: integer}
    - {symbol: bc, label: latent bytes, default: 2, min: 1, max: 4, options: [1, 2, 4], format: integer}
    - {symbol: br, label: positional bytes, default: 2, min: 1, max: 4, options: [1, 2, 4], format: integer}
  outputs:
    - {symbol: M, label: logical latent state, formula: L*B*S*(dc*bc+dr*br), format: bytes}
~~~

## Mechanism

**DERIVED.** At the illustrative $L=32,B=1,S=8192,d_c=512,d_r=64,b_c=b_r=2$, Eq. 14.7 gives 288 MiB. This fixture shares the layer, batch and length controls of §14.1; it does not identify two equal-quality architectures. A head-independent latent count is not head-independent computation: the transformed query and weighted latent accumulation remain head-specific.

**MATHEMATICALLY-DERIVED.** The latent score and weighted-sum matrix work per new query is approximately $2SH_q(2d_c+d_r)$ FLOPs per layer under direct evaluation of Eq. 14.6, excluding projection and softmax work. It can exceed the corresponding expanded-head inner-product work when $d_c$ is large. The trade changes the dimensions and reuse of operators rather than guaranteeing fewer FLOPs.

~~~figure
id: fig-14.7
kind: diagram
title: Expanded and absorbed paths for one trained mechanism
caption: Both paths use the same attention weights and positional term. The absorbed path retains latent state and moves linear maps around the weighted sum.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-14.6
alt: A cached latent can expand into head-specific keys and values, or interact with a transformed query and form a weighted latent sum before value up-projection.
spec:
  direction: LR
  nodes:
    - {id: z, kind: memory, label: cached latent z}
    - {id: expand, kind: process, label: expand K and V}
    - {id: ordinary, kind: process, label: head-space attention}
    - {id: q, kind: tensor, label: transformed query}
    - {id: sum, kind: process, label: weighted latent sum}
    - {id: up, kind: process, label: value and output maps}
    - {id: out, kind: tensor, label: same real-arithmetic output}
  edges:
    - {from: z, to: expand}
    - {from: expand, to: ordinary}
    - {from: ordinary, to: out}
    - {from: z, to: sum}
    - {from: q, to: sum}
    - {from: sum, to: up}
    - {from: up, to: out}
~~~

**MATHEMATICALLY-DERIVED.** Position-dependent rotations generally obstruct absorbing the whole key projection into a single position-independent query map. If each historical key is rotated after expansion, its effective transformation depends on $s$. Keeping a separate positional term permits content-space absorption without pretending that all historical rotations are one constant matrix. The scale must also remain $1/\sqrt{d_k+d_r}$ for the specified reference; a generic kernel default based on the transformed width $d_c+d_r$ would change logits.

**DERIVED.** Precomputing $W_{O,i}U_{V,i}$ can trade additional transformed-weight storage against runtime projection work. It is not compulsory to materialize that product, and different execution phases may choose different associations. A prefill implementation may favor expanded GEMMs while decode favors latent state. Comparing their peak tensors requires phase-specific lifetimes, including any conversion workspace.

## Algorithm

**DERIVED — proposed algebra and layout audit.**

~~~text
Algorithm 14.2 — Verify a specified latent attention path
INPUT: bounded latent tensors, projection matrices, positional state, mask and scale
OUTPUT: expanded/absorbed discrepancy plus a cache-allocation ledger
STATE: independent expanded reference and latent execution records
INVARIANT: both paths use identical source positions and score normalization
1. Validate all matrix dimensions and the positional-state sharing contract.
2. Form expanded K and V only in the bounded reference.
3. Compute transformed queries and latent weighted sums independently.
4. Apply the same positional term and explicit score scale in both paths.
5. Compare outputs and, for training claims, gradients under a declared tolerance.
6. Inventory latent, positional, scale, padding and temporary allocations separately.
7. Reject any cache total inferred solely from the model-family name.
~~~

**DERIVED — complexity.** Direct latent attention for one query is $O(SH_q(d_c+d_r))$ excluding projection factors, with $O(S(d_c+d_r))$ persistent elements per layer and sequence. Expansion adds $O(SH_q(d_k+d_v))$ temporary elements if fully materialized. Verification bounds $S$ and head count explicitly; the reference is not a production cache recommendation.

## Implementation

**OFFICIAL-DOCUMENTATION — [R14.7](references.md#r147).** The FlashMLA README inspected on 25 September 2026 distinguishes expanded and latent execution modes. Its “MQA mode” describes an MLA kernel representation, not proof that the trained architecture is the MQA construction of §14.1.

**OFFICIAL-DOCUMENTATION — R14.7.** For its documented DeepSeek-V3.2 sparse FP8 format, one row contains 512 FP8 content bytes, four FP32 scales, and 64 BF16 positional values: 656 bytes. This is one named layout, not a universal MLA formula. The inspected README restricts that FP8 option to its sparse path.

**DERIVED.** FlashMLA is routed through DeepSeek's official code surface and the plan's Chapter 27 anchor, at *Kernels / numerics / collectives*. PyTorch supplies the *Model / autograd framework* reference; Hugging Face Transformers supplies *Model definition / adaptation*. A package label does not establish which layout a running model selects. Moving repository contents remain unpinned evidence until a commit and execution check are retained.

## Experimental design

**PROPOSAL — no kernel reproduction reported.**

### Experiment 14.2 — Latent representation and allocation reconciliation

- **Hypothesis:** an absorbed implementation can preserve the specified attention function while storing latent and positional state instead of expanded heads.
- **Setup:** independent expanded and absorbed references followed by a compatible pinned backend.
- **Independent variables:** latent width, positional width, dtype, cache layout and execution phase.
- **Controlled variables:** model weights, mask, score scale, input tensors and output projection.
- **Dataset/workload:** bounded random and adversarial tensors; separate task data for architectural quality.
- **Hardware:** record exact accelerator, backend, driver and runtime when executed.
- **Metrics:** output/gradient error, logical bytes, row stride, scales, peak allocation and phase latency.
- **Baselines:** explicit expanded computation and unquantized latent computation.
- **Expected result:** real-arithmetic equivalence and correctly decomposed bytes; no bitwise or speed guarantee.
- **Ablation:** omit positional state, alter score scale, and exclude scale bytes as failing controls.
- **Interpretation:** algebraic equivalence is within one trained parameterization; quality comparisons between parameterizations are separate.
- **Threats to validity:** hidden expansion, reassociation error, quantization, incompatible backend constraints and unrecorded workspace.

## Observations

**What the paper claims.** **PAPER-REPORTED — P13.** Joint latent KV state and a separate positional key support its MLA mechanism.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** Linear absorption preserves Eq. 14.5 under the stated conditions, while Eq. 14.8 exposes representation overhead.

**What we infer.** **DERIVED.** Naming every retained tensor is more reliable than multiplying a claimed compression factor by a generic cache estimate.

**What remains unknown.** **UNVERIFIED.** Actual dispatch, error, traffic and latency require a pinned reproduction.

## Failure modes

~~~figure
id: fig-14.8
kind: stat-panel
title: Latent cache completeness
caption: Eq. 14.8 separates content storage, positional values and scale metadata before page allocation is considered.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-14.8
alt: A cache ledger includes latent values, positional values, scales and padding. Expanded workspaces are counted separately by lifetime.
spec:
  header: REPRESENTATION AUDIT
  rows:
    - {key: latent, value: dc times bc}
    - {key: position, value: dr times br}
    - {key: scales and padding, value: explicit byte count}
    - {key: expanded temporaries, value: separate lifetime}
~~~

> **Failure mode — default scale substitution.** **DERIVED.** *Symptom:* absorbed and expanded logits disagree systematically. *Cause:* transformed query width used to choose a different scale. *Detection:* compare logits before softmax. *Mitigation:* preserve the reference scale explicitly.

> **Failure mode — hidden expanded cache.** **DERIVED.** *Symptom:* allocated state grows with heads despite a latent formula. *Cause:* reconstructed K/V retained across steps. *Detection:* allocation inventory after temporary release. *Mitigation:* state which layout is actually persistent.

## Siblings

**DERIVED.** [GQA](14-1-mha-mqa-and-gqa.md) shares explicit projections; MLA shares latent source information while reconstructing head-specific maps. [Sparsity](14-3-sparse-and-local-attention.md) selects positions and can compose with either. [Exact execution](14-5-exact-versus-approximate-computation.md) concerns preserving a specified function and is not a substitute for evaluating the architectural bottleneck.

## Extensions

**DERIVED.** A mixed-precision cache can keep different components at different dtypes. Additional selector or compressed-summary state must be inventoried independently. Multiple latent streams, head-specific positional keys, and hybrid attention layers change Eq. 14.7; their existence cannot be inferred from a later model's brand.

## Limitations

**DERIVED.** Reduced persistent state does not establish reduced training activation memory, lower total FLOPs, or improved quality. Finite-precision reassociation and quantization need separate tests. Energy and monetary savings require measured occupancy and operating conditions rather than a byte-ratio extrapolation.

## Reproducibility

**DERIVED.** Retain latent, key, value and positional dimensions; normalization placement before cached values; query transformations; explicit scale; tensor strides; scale format; page size; transformed-weight strategy; cache lifetimes; and kernel revision. Separate source-verified layout facts from the chapter's illustrative configurations.

## References

[P13](references.md#p13); [R14.7](references.md#r147); [R14.5](references.md#r145); [R14.6](references.md#r146).
