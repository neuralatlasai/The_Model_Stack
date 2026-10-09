---
id: ms.section.27.4
entity_type: section
title: MLA and sparse kernels
short_title: Latents, selection, and cache ABI
volume: 2
part: 5
chapter: 27
section: 27.4
slug: 27-4-mla-and-sparse-kernels
parent: ms.chapter.27
prev_sibling: ms.section.27.3
next_sibling: ms.section.27.5
children: []
prerequisites: [ms.chapter.14, ms.chapter.15, ms.chapter.25, ms.chapter.26, ms.section.27.3]
downstream: [ms.chapter.42, ms.chapter.45]
related: []
relations: []
axes: {lifecycle: [inference, serving], mechanism: [latent_attention, sparse_selection, cache_representation], feedback_setting: [], modality: [text]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# 27.4 — MLA and sparse kernels

## Scope

[DERIVED] MLA changes the cached representation; sparse selection changes the keys consumed by a query; a kernel determines how those representations execute. These three contracts must be tested separately. Architecture definitions remain owned by [Chapter 14](../../../vol-01-learning-and-representation/part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/README.md). The eligible December 2025 report [R27.2](references.md#r272) describes DSA under MLA; it does not make the earlier mechanism a new December invention. The September 2026 FlashMLA release [R27.4](references.md#r274) supplies an especially consequential compatibility boundary.

## Why this exists

[MATHEMATICALLY-DERIVED] A cache-reduction claim is incomplete without specifying what must be reconstructed to compute scores and values. Compressing storage can add compute, change the matrix dimensions, or require a different projection order. A sparse-attention claim is similarly incomplete without charging for the selector and translating selected logical tokens into physical cache addresses. The attention dot products are only one stage of the resulting system.

[DERIVED] The deployment failure is often an ABI mismatch rather than an abstract architecture error: scale placement changes, a positional component moves, indices switch interpretation, or a release stops supporting the model. The same library name can then denote incompatible tensor contracts. A package upgrade that imports successfully has not demonstrated cache compatibility.

## Intuition

> **Definition — Cache ABI.** [DERIVED] The release-specific binary and semantic contract governing cached components, scale encodings, positional state, page geometry, and selected-index interpretation.

[MATHEMATICALLY-DERIVED] If a key/value is a linear expansion of a shared latent vector, reassociate matrix products to move the expansion from every cached token into the query or output path. This can retain one latent per token instead of one expanded vector per head. Positional transformations complicate that reassociation because their matrices depend on token position. Sparse selection then chooses a subset of latent entries; it does not remove the need for a consistent score normalization on that subset.

## Formulation

| Symbol | Meaning | Shape / units |
|---|---|---|
| $c_j$ | Cached latent token state | $[r_c]$ |
| $U_h^K,U_h^V$ | Head-specific expansion maps | $[d_c,r_c]$, $[d_v,r_c]$ |
| $q_h^C,q_h^R,k_j^R$ | Content query, positional query/key | $[d_c]$, $[d_r]$, $[d_r]$ |
| $\mathcal S_i,k$ | Selected admitted key set and maximum size | Set, tokens |
| $\rho_i$ | Dense attention mass outside $\mathcal S_i$ | Fraction in $[0,1]$ |
| $Q_{\rm scale}$ | Quantization metadata read | Bytes |

[MATHEMATICALLY-DERIVED] For the explicit linear representation $k_{j,h}^C=U_h^Kc_j$, $v_{j,h}=U_h^Vc_j$,

$$
s_{ijh}=\alpha\left[(U_h^{K\mathsf T}q_{ih}^C)^\mathsf Tc_j+(q_{ih}^R)^\mathsf Tk_j^R\right],\qquad
o_{ih}=U_h^V\sum_jp_{ijh}c_j.
$$

*(Eq. 27.14)*

Here $\alpha$ is the model-specified scale. This is an explanatory linear absorption identity, not a complete specification of every MLA model. Biases, normalization, positional conventions, and output projection grouping must match the chosen checkpoint.

## Mechanism

### Latent storage and positional separation

[MATHEMATICALLY-DERIVED] The identity $q^\mathsf TUc=(U^\mathsf Tq)^\mathsf Tc$ follows by matrix associativity. The value identity moves a fixed linear map outside the weighted sum. It is valid only when the map does not depend on the attended token and no intervening nonlinear transformation breaks linearity. If positional rotation $R_j$ acts after key expansion, then $q^\mathsf TR_jUc$ contains a token-dependent matrix. One cannot absorb the same $U$ into every query without accounting for that dependence. A separately represented positional component is one way to keep the content absorption explicit.

[MATHEMATICALLY-DERIVED] For an illustrative unquantized representation, cache bytes per layer are

$$
M_{\rm latent}=BT(r_cb_c+d_rb_r),\qquad
M_{\rm expanded}=BTH_{kv}(d_h+d_v)b.
$$

*(Eq. 27.15)*

The comparison holds only for the stated layouts and stored components. It excludes indexer keys, scales, alignment, and page tables. It is not an architectural quality comparison. The latent attention accumulator can have width $r_c$, so reducing cache bytes may increase the live output accumulator relative to $d_v$. A byte-saving representation can consequently need a new kernel rather than a simple dtype cast of a dense-head implementation.

```figure
id: fig-27.10
kind: tensor-flow
title: Linear latent absorption
caption: The shared latent is read directly after the key expansion is absorbed into the query. The value map is applied after accumulation. Position components remain explicit.
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-27.14
alt: A content query of width Dc is transformed to latent width Rc. Scores combine latent dot products with positional dot products. Attention accumulates a widthRc latent vector before the value expansion produces widthDv.
spec:
  dims: {H: query heads, Dc: content key width, Rc: latent width, T: key tokens, Dv: value width}
  steps:
    - {shape: '[H, Dc]', label: content query}
    - {shape: '[H, Rc]', op: absorb key expansion into query}
    - {shape: '[H, T]', op: latent scores plus explicit positional scores}
    - {shape: '[H, Rc]', op: normalized latent accumulation}
    - {shape: '[H, Dv]', op: apply value expansion after accumulation}
```

### Selector, selected operator, and training boundary

[PAPER-REPORTED] The December report specifies a weighted rectified multihead index score, top-k token selection, and MLA's shared-latent execution mode. It describes indexer-only dense warm-up followed by sparse training, with detached indexer inputs and separate indexer/language-model losses. [R27.2](references.md#r272), §2.1, Eqs. 1–4 and Appendix A. Its §2.2 explicitly labels the parity evaluation as September 2025; those earlier results are excluded from this chapter's current empirical evidence.

[MATHEMATICALLY-DERIVED] Let any declared selector produce $\mathcal S_i\subseteq\mathcal A_i$. The selected operator is

$$
p_{ij}^{\mathcal S}=\frac{\mathbf1[j\in\mathcal S_i]e^{s_{ij}}}{\sum_{u\in\mathcal S_i}e^{s_{iu}}},\qquad
o_i^{\mathcal S}=\sum_{j\in\mathcal S_i}p_{ij}^{\mathcal S}v_j.
$$

*(Eq. 27.16)*

Calling it “exact sparse attention” can mean exact evaluation of Eq. 27.16. It cannot mean equality to dense attention for an arbitrary selected subset. A kernel correctness test must compare against the selected operator; a model-quality test must separately examine the selection policy. Mixing these references lets an inaccurate selector hide behind an accurate kernel, or lets a correct kernel be blamed for deliberate approximation.

[MATHEMATICALLY-DERIVED] If dense attention assigns omitted mass $\rho_i=\sum_{j\notin\mathcal S_i}p_{ij}$ and $\|v_j\|\leq V_{\max}$, then

$$
o_i=(1-\rho_i)o_i^{\mathcal S}+\rho_i o_i^{\rm omitted},\qquad
\|o_i-o_i^{\mathcal S}\|\leq2\rho_iV_{\max}.
$$

*(Eq. 27.17)*

The identity conditions the original distribution on retained and omitted sets; the norm bound is the triangle inequality. Small selected fraction $k/T$ says nothing about $\rho_i$ without a relationship between selector scores and actual attention. Conversely a retained set can be small and preserve most mass on one input but fail on a distribution shift. Multi-layer quality is not bounded by this single-layer estimate without further sensitivity assumptions.

```figure
id: fig-27.11
kind: matrix
title: Selection is distinct from causality
caption: Illustrative query-dependent selected pairs. All marked keys are causal, but many causal keys are omitted. This is an operator pattern, not a measured selector output.
evidence: DERIVED
source: DERIVED:eq-27.16
alt: An eight by eight explicit sparse matrix keeps different subsets for each query. No query attends to a future key; the final query retains the first, fourth, and eighth keys.
spec:
  rows: 8
  cols: 8
  pattern: explicit
  rowLabel: query position
  colLabel: logical key position
  cells:
    - [1, 0, 0, 0, 0, 0, 0, 0]
    - [1, 1, 0, 0, 0, 0, 0, 0]
    - [1, 0, 1, 0, 0, 0, 0, 0]
    - [1, 0, 1, 1, 0, 0, 0, 0]
    - [1, 0, 0, 1, 1, 0, 0, 0]
    - [1, 0, 1, 0, 0, 1, 0, 0]
    - [1, 0, 0, 1, 0, 0, 1, 0]
    - [1, 0, 0, 1, 0, 0, 0, 1]
  legend: filled = selected admitted key; omitted does not mean zero dense mass
```

### Physical sparsity and release-specific cache formats

[DERIVED] Token selection saves physical reads only when the kernel can gather selected entries without reading most unselected blocks. A selector choosing scattered tokens may touch many cache lines or pages. The relevant count is transferred bytes, including index metadata, alignment, scales, and repeated fetches. Indexer scoring that scans all index keys adds its own length-dependent work; top-k selection adds selection and address-translation cost. A small final attention matrix does not establish end-to-end sublinear time.

[OFFICIAL-DOCUMENTATION] FlashMLA commit `2e5429fc5653bab6e081f09477126f731882a6a9`, released 2026-09-30, removes Hopper and earlier-model support and changes the FP8/FP4 cache layout. Its README requires release-specific sparse indices and documents special empty-row returns. [R27.4](references.md#r274), breaking notice, Requirements, and Usage. Compatibility with a V3.2 cache is therefore not implied by installing its latest revision.

[DERIVED] Treat a cache as a typed binary interface: model revision, component order, quantized format, scale encoding/granularity, positional layout, page geometry, and index interpretation. A format conversion needs validation against dequantized values and an attention reference. Retain the original cache or a reversible source until the conversion passes. Silent reinterpretation is a correctness failure, not a tolerable performance regression.

```figure
id: fig-27.12
kind: calculator
title: Latent cache accounting
caption: Illustrative unquantized dimensions from Eq. 27.15, not a named model. The ratio excludes indexer state, scales, page tables, alignment, and reconstruction compute.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-27.15
alt: Compare per-token latent-plus-position bytes with expanded key-value bytes. At latent width512, positional width64, eight KV heads, width128 for keys and values, and two-byte values, the simplified ratio is about3.56.
spec:
  tex: R_M=\frac{H_{kv}(d_h+d_v)b}{r_cb_c+d_rb_r}
  equation: '27.15'
  inputs:
    - {symbol: Hkv, label: expanded KV heads, default: 8, min: 1, max: 64, format: integer}
    - {symbol: dh, label: expanded key width, default: 128, min: 32, max: 512, scale: log2, format: integer}
    - {symbol: dv, label: expanded value width, default: 128, min: 32, max: 512, scale: log2, format: integer}
    - {symbol: rc, label: latent width, default: 512, min: 64, max: 2048, scale: log2, format: integer}
    - {symbol: dr, label: positional width, default: 64, min: 16, max: 256, scale: log2, format: integer}
  outputs:
    - {symbol: expanded, label: expanded bytes per token, formula: Hkv*(dh+dv)*2, format: bytes}
    - {symbol: latent, label: latent bytes per token, formula: (rc+dr)*2, format: bytes}
    - {symbol: ratio, label: simplified storage ratio, formula: expanded/latent, format: ratio, emphasis: true}
```

## Algorithm

### Algorithm 27.4 — Selected latent attention with an ABI gate

[DERIVED] Inputs are a declared model/cache contract, query components, latent cache, selector, physical page map, and bounded $k$. The output is the selected attention result plus a support record:

$$
\begin{aligned}
1.&\quad\mathrm{contract}(\text{cache})=\mathrm{contract}(\text{backend})\ \lor\ \mathrm{reject}.\\
2.&\quad\mathcal S_i\leftarrow\mathrm{TopK}(\mathrm{selector}(q_i),\mathcal A_i,k).\\
3.&\quad\mathrm{validate}(\mathcal S_i\subseteq\mathcal A_i,\ \mathrm{unique}(\mathcal S_i),\ |\mathcal S_i|\leq k).\\
4.&\quad\widehat q_{ih}\leftarrow U_h^{K\mathsf T}q_{ih}^C;\quad c_{\mathcal S_i}\leftarrow\mathrm{gather}(\Lambda,\mathcal S_i).\\
5.&\quad s_{ijh}\leftarrow\alpha(\widehat q_{ih}^{\mathsf T}c_j+q_{ih}^{R\mathsf T}k_j^R),\ j\in\mathcal S_i.\\
6.&\quad u_{ih}\leftarrow\sum_{j\in\mathcal S_i}\mathrm{softmax}(s_{i,:,h})_jc_j.\\
7.&\quad o_{ih}\leftarrow U_h^Vu_{ih};\quad\mathrm{return}(o,\text{backend and ABI identity}).
\end{aligned}
$$

[DERIVED] Duplicate indices are rejected because repeating an entry increases its exponential mass and changes Eq. 27.16. Empty selected rows use a declared convention, not an accidental NaN. The reference complexity is selection cost plus $O(BqH_qk(r_c+d_r))$ scoring/accumulation and projection costs. Gathering can require $O(Bqkr_c)$ temporary storage unless fused. Neither this algorithm nor its asymptotic count asserts a particular released kernel uses the same implementation order.

## Implementation

[DERIVED] FlashMLA and FlashInfer are outside the enumerated reference stack, explicitly routed by the chapter's official attention implementation anchor. Their releases are implementation evidence, not a license to assume interchangeable cache formats. Record support by exact device, cache format, head widths, index shape, causal mode, batch representation, and output/LSE convention. A source example is not a verified code path in this workspace.

## Experimental design

### Reported experiments

[PAPER-REPORTED] R27.2 §2.1.1 discloses dense indexer warm-up and sparse continued training. Its inherited September parity table is outside the requested empirical window and is not used. [OFFICIAL-DOCUMENTATION] R27.4 points to sparse prefill/decode tests, but no test was executed here. A model benchmark, a kernel equivalence test, and a format-conversion test answer different questions.

## Observations

**What the paper claims.** [PAPER-REPORTED] R27.2 describes learned selection under a shared-latent architecture. [OFFICIAL-DOCUMENTATION] R27.4 declares a breaking cache and hardware support change.

**What the evidence shows.** [DERIVED] The disclosures establish specific representation and integration contracts. They do not establish quality preservation for arbitrary selectors or backward compatibility of current FlashMLA.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 27.14 gives conditional linear equivalence; Eq. 27.17 exposes omitted mass as a missing quality variable. Compression ratio and selected fraction alone cannot certify output fidelity.

**What remains unknown.** [UNVERIFIED] Local model quality, selector coverage under distribution shift, transferred bytes, and execution compatibility remain unchecked. Current release claims are not independent empirical reproduction.

## Failure modes

> **Failure mode — Cache ABI drift.** [DERIVED] *Symptom:* finite but wrong outputs after upgrade. *Cause:* old bytes interpreted with new scale/component layout. *Detection:* typed format IDs and dequantized fixture checks. *Mitigation:* reject incompatible cache records before dispatch.

> **Failure mode — Selector-reference confusion.** [DERIVED] *Symptom:* kernel parity passes while retrieval quality collapses. *Cause:* only Eq. 27.16 is tested. *Detection:* separate dense-model quality and selected-kernel parity suites. *Mitigation:* maintain both gates.

## Siblings

[DERIVED] [Dense split decode](27-3-decode-specialized-attention.md) retains every admitted key and changes work assignment. Sparse kernels reduce the key set and add a quality contract. Quantized cache paths retain indices but perturb values/scores; test their error separately from omission. [Chapter 14](../../../vol-01-learning-and-representation/part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/README.md) owns architecture-level alternatives.

## Extensions

[DERIVED] Fusing neighboring normalization or positional operators can remove launches and intermediates only if the order, scaling, and derivative contract remain correct. A changed model's grouped output projection is a new ABI requirement. Do not retrofit a newer model's layout into an older checkpoint by matching tensor sizes alone.

## Limitations

[DERIVED] The linear absorption derivation excludes nonlinear latent reconstruction. The omitted-mass bound is per-layer and needs bounded values. No general quality guarantee, energy saving, or cost saving follows from either identity. Source or release gaps preserve draft status.

## Reproducibility

[DERIVED] Store cache and model revisions, scale bytes, dequantizer specification, positional components, selection scores/indices, page translation, invalid-index policy, empty-row convention, and all supported/unsupported shapes. Keep selection time, attention time, conversion time, and end-to-end time separate in the unexecuted verification design.

## References

[R27.2](references.md#r272), §2.1 and Appendix A; [R27.4](references.md#r274), pinned README/Usage; [R27.3](references.md#r273), §5 for a bounded selection-quality comparison. No earlier parity result is promoted to current-window evidence.
