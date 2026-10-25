---
id: ms.section.55.1
entity_type: section
title: Visual representations
volume: 3
part: 10
chapter: 55
section: 55.1
slug: 55-1-visual-representations
parent: ms.chapter.55
prev_sibling: null
next_sibling: ms.section.55.2
children: []
prerequisites: [ms.chapter.18, ms.chapter.31, ms.chapter.49, ms.chapter.50]
downstream: [ms.section.55.2, ms.section.55.6, ms.chapter.57]
related: [ms.chapter.15, ms.chapter.42]
relations: []
axes: {lifecycle: [inference, evaluation], mechanism: [visual_representation, spatial_sampling], feedback_setting: [], modality: [image, text]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 55.1 — Visual representations

## Scope

[DERIVED] The required result is a representation that preserves the evidence needed for an image-conditioned answer within a declared token and memory budget. The baseline resizes a whole image once and passes a fixed visual sequence to a decoder. This section develops patch sampling, multi-resolution tiling, coordinate transfer and state-conditioned access to retained features. Generic multimodal interfaces belong to Chapter 18; attention and KV accounting belong to Chapters 14 and 42. A representation is acceptable only when downstream evidence tests pass; token count alone cannot certify information preservation.

## Why this exists

[DERIVED] A page can contain a large title, a small footnote and a thin table border. Uniformly shrinking its raster gives those features different prospects of survival. If two originals become the same processed image, every deterministic downstream encoder receives identical observations. Increasing the language model's reasoning budget cannot identify which original was present. This is a failure of available information before it is a failure of reasoning. The relevant uncertainty is whether the target distinguishes details destroyed by the preprocessing map.

[PAPER-REPORTED] SCVER addresses a narrower obstruction: detail retained in pre-downsampling encoder features is poorly accessible through a compact shared visual prefix. It adds token-conditioned sparse retrieval from those features during decoding, rather than requiring every detail to pass through the compressed prefix [R55.3, §3.1–3.2]. This distinction matters: its method does not establish recovery of details absent from the retained feature map.

## Intuition

[MATHEMATICALLY-DERIVED] Write preprocessing and encoding as a map $z=g(I)$. For a required answer function $a(I,q)$, exact answer recovery from $z$ requires $a(I_1,q)=a(I_2,q)$ whenever $g(I_1)=g(I_2)$. Necessity follows because an answer rule receiving identical $z,q$ has identical inputs. Sufficiency follows by defining its answer on each equivalence class of images. This conditional statement identifies the transfer obligation: compression must preserve answer-relevant distinctions, rather than merely retain visually plausible global semantics.

```figure
{
  "id": "fig-55.3",
  "kind": "diagram",
  "title": "Compressed prefix and retained-feature access",
  "caption": "Current-image features can feed a compact prefix and a retained feature map. SCVER reads the retained map from the current decoder state. Neither path can recover information absent from the source or retained features.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": [
    "R55.3",
    "DERIVED:eq-55.4"
  ],
  "alt": "Current-image features can feed a compact prefix and a retained feature map. SCVER reads the retained map from the current decoder state. Neither path can recover information absent from the source or retained features.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "src",
        "kind": "dataset",
        "label": "Current source image"
      },
      {
        "id": "enc",
        "kind": "model",
        "label": "Visual encoder"
      },
      {
        "id": "fine",
        "kind": "tensor",
        "label": "Pre-merger features"
      },
      {
        "id": "merge",
        "kind": "process",
        "label": "Spatial compression"
      },
      {
        "id": "prefix",
        "kind": "tensor",
        "label": "Compact prefix"
      },
      {
        "id": "decode",
        "kind": "model",
        "label": "Current decoder state"
      },
      {
        "id": "read",
        "kind": "process",
        "label": "Sparse evidence retrieval"
      }
    ],
    "edges": [
      {
        "from": "src",
        "to": "enc"
      },
      {
        "from": "enc",
        "to": "fine"
      },
      {
        "from": "fine",
        "to": "merge"
      },
      {
        "from": "merge",
        "to": "prefix"
      },
      {
        "from": "prefix",
        "to": "decode"
      },
      {
        "from": "fine",
        "to": "read"
      },
      {
        "from": "decode",
        "to": "read",
        "label": "query"
      },
      {
        "from": "read",
        "to": "decode",
        "label": "residual evidence"
      }
    ]
  }
}
```


## Formulation

[MATHEMATICALLY-DERIVED] Let an RGB image have height $h$ and width $w$ pixels. Pad it to patch multiples with patch side $p$, and let a spatial merger combine $m_h$ by $m_w$ patch positions. Under this explicit regular-grid construction,

$$
n_{\mathrm{patch}}=\left\lceil h/p\right\rceil\left\lceil w/p\right\rceil,
\qquad n_v=\left\lceil\left\lceil h/p\right\rceil/m_h\right\rceil
\left\lceil\left\lceil w/p\right\rceil/m_w\right\rceil.
$$
*(Eq. 55.1)*

where $n_v$ counts emitted visual tokens, excluding optional global views, separators and other model-specific tokens. The ceiling at the merger boundary requires padded or explicitly admitted partial edge groups; a processor that drops those groups has a different count.

[DERIVED] A patch is a sampling unit, not an object or guaranteed character. A $p\times p\times3$ block may be flattened and linearly projected, but its spatial extent still reflects the resized image. With isotropic resize factor $r$, a character originally $s$ pixels high occupies $rs$ pixels before patching. Resampling kernels, antialiasing and source quality affect whether its strokes remain distinguishable. A patch-count formula therefore predicts sequence size under a specified processor, not OCR accuracy.

[MATHEMATICALLY-DERIVED] A crop with original top-left $(x_0,y_0)$, width $w_c$ and height $h_c$, resized to $(w_r,h_r)$, maps a local coordinate $(u,v)$ back by

$$
\begin{bmatrix}x\\y\\1\end{bmatrix}=
\begin{bmatrix}w_c/w_r&0&x_0\\0&h_c/h_r&y_0\\0&0&1\end{bmatrix}
\begin{bmatrix}u\\v\\1\end{bmatrix}.
$$
*(Eq. 55.2)*

where all four coordinates are continuous pixel-edge coordinates: an image of width $w$ occupies $[0,w]$, and its pixel centers lie at $i+1/2$. Under this declared convention Eq. 55.2 is exact for the geometric resize, independently of which interpolation kernel approximates the raster. If an API instead indexes pixel centers by integers, the corresponding equation is

$$
x_{\mathrm{index}}=x_0+(u_{\mathrm{index}}+1/2)w_c/w_r-1/2,
\qquad y_{\mathrm{index}}=y_0+(v_{\mathrm{index}}+1/2)h_c/h_r-1/2.
$$
*(Eq. 55.3)*

where index zero denotes the first pixel center and integer crop boundaries define $(x_0,y_0)$. This is the half-pixel mapping. An endpoint-aligned resize instead maps the first and last center indices to the first and last source centers, giving $x_0+u_{\mathrm{index}}(w_c-1)/(w_r-1)$ when $w_r>1$; the single-pixel case needs its own specified policy. These conventions are not interchangeable. Padding requires subtracting its offset first; rotations require an additional transform. Matrix multiplication composes recursive crops without repeatedly rounding intermediate coordinates. A named processor's convention remains UNVERIFIED until its exact implementation is inspected; this mathematical contract is not an attribution to Qianfan-OCR.

```figure
id: fig-55.4
kind: calculator
title: Regular-grid visual token budget
caption: Illustrative padded-grid construction for Eq. 55.1, not a named model processor. Global views and separators are excluded.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-55.1
alt: Height and width are padded to patch multiples. Spatial merging reduces the grid before it enters the language model; this calculator estimates tokens, not recognition quality.
spec:
  tex: n_v=\lceil\lceil h/p\rceil/m\rceil\lceil\lceil w/p\rceil/m\rceil
  equation: "55.1"
  inputs:
    - {symbol: height, label: Height in pixels, default: 1024, min: 128, max: 4096, format: integer}
    - {symbol: width, label: Width in pixels, default: 768, min: 128, max: 4096, format: integer}
    - {symbol: patch, label: Patch side in pixels, default: 16, min: 8, max: 32, format: integer}
    - {symbol: merge, label: Merge side in patches, default: 2, min: 1, max: 4, format: integer}
  outputs:
    - {symbol: tokens, label: Emitted grid tokens, formula: ceil(ceil(height/patch)/merge)*ceil(ceil(width/patch)/merge), format: tokens}
```

## Mechanism

### Methodology

[DERIVED] Whole-image resizing preserves global coverage while reducing local sampling density. Fixed-size tiling preserves greater local sampling density at the price of multiple encodings and possible loss of cross-tile relations. A global thumbnail can supply page-level context, but duplicates some evidence. Overlap can keep boundary-crossing characters intact, but also duplicates content. The output contract must retain page identity, crop bounds, ordering and the resize transform; otherwise two correct local detections can be assembled into an incorrect global statement.

[PAPER-REPORTED] Qianfan-OCR reports dynamic 448-by-448 tiles with a 14-by-14 patch size, a maximum of sixteen tiles, 256 emitted visual tokens per tile and a 4,096-token maximum visual representation [R55.1, §3.1]. These are reported interface quantities. The simple pre-merger grid would contain 1,024 patch positions per tile; the inspected section does not explain the complete reduction producing 256. The book therefore does not infer its pooling implementation from those numbers.

[DERIVED] Spatial position has at least three coordinate spaces: source-page pixels, local encoder grid positions and decoder sequence positions. Flattening tiles in an order determines sequence positions but does not by itself encode where each tile lies on the page. Repeating the same local grid in every tile makes local position ambiguous unless a tile identity or global offset is available. Conversely, rescaling every crop to a unit square preserves within-crop relative position while losing absolute scale. The accepted representation must preserve the coordinate information used by the requested task.

[PAPER-REPORTED] SCVER keeps high-resolution features $\tilde F$ alongside compressed tokens $F$. At selected decoder blocks, the post-attention hidden state predicts a reference point, per-head offsets and sampling weights. Offsets are divided by feature-map width and height; bilinear samples are weighted and added through a residual before the feed-forward transformation [R55.3, Eqs. 1–4]. In book notation its sampled contribution is

$$
\ell_{a,j}=\sigma(tW_{\mathrm{ref}})+\frac{\Delta_{a,j}}{(w_f,h_f)},
\qquad u_a=\sum_{j=1}^{P_s}\omega_{a,j}\operatorname{Bilinear}(\tilde F,\ell_{a,j}).
$$
*(Eq. 55.4)*

where $t$ is the current hidden state, $a$ indexes sampling heads, $P_s$ is samples per head, and $(w_f,h_f)$ is feature-map width and height. The source's equation writes predicted weights directly; a particular normalization, clipping or out-of-range policy is not inferred here.

[PAPER-REPORTED] Training freezes the pretrained backbone and uses two shared-weight streams: a no-gradient stream with retrieval disabled and a stream with retrieval enabled. Attention to visual tokens in the base stream supplies a detached spatial target for the learned reference point. Cross-entropy plus a weighted squared reference error trains the added modules. SCVER is inserted every four layers in the main setup [R55.3, §3.3, Eqs. 5–8, §4.1].

[DERIVED] There is a source-level normalization obligation. The visual subset of a causal attention row need not sum to one. A spatial centroid requires division by its visual mass unless that subset has already been renormalized. R55.3 Eq. 6 writes the weighted coordinate sum without specifying that division; its result therefore cannot be treated as a normalized centroid solely from the printed formula.

[OFFICIAL-DOCUMENTATION] The originating repository resolves this point for its MinerU implementation. At commit `f1ea200abc69d6b48e070639c2b93b06014672ec`, `_record_teacher_target` averages attention over heads in FP32, sums the visual mass, divides the coordinate-weighted sum by `mass.clamp_min(1e-8)`, and excludes queries with mass at most $10^{-8}$. Coordinates are $(i+1/2)/W_f,(j+1/2)/H_f$ [R55.13, `modeling_scver.py`, lines 627-657]. This is an inspected implementation detail missing from the paper equation, not a book repair attributed to the paper. Its attention targets remain weak supervision: a centroid can lie between two disjoint regions and need not identify a ground-truth evidence box.

```figure
{
  "id": "fig-55.5",
  "kind": "stat-panel",
  "title": "Why the visual subset needs normalization",
  "caption": "Analytical example: attention weights 0.1 and 0.3 at coordinates 0.25 and 0.75 have visual mass 0.4. Their raw weighted sum 0.25 is not the conditional centroid 0.625. The originating implementation explicitly divides by visual mass.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": [
    "DERIVED:eq-55.4",
    "R55.13"
  ],
  "alt": "Analytical example: attention weights 0.1 and 0.3 at coordinates 0.25 and 0.75 have visual mass 0.4. Their raw weighted sum 0.25 is not the conditional centroid 0.625. The originating implementation explicitly divides by visual mass.",
  "spec": {
    "header": "ILLUSTRATIVE VISUAL ATTENTION",
    "variables": {
      "a": 0.1,
      "b": 0.3,
      "x": 0.25,
      "y": 0.75
    },
    "rows": [
      {
        "key": "visual mass",
        "formula": "a+b",
        "format": "fixed3"
      },
      {
        "key": "raw weighted sum",
        "formula": "a*x+b*y",
        "format": "fixed3"
      },
      {
        "key": "normalized centroid",
        "formula": "(a*x+b*y)/(a+b)",
        "format": "fixed3"
      }
    ]
  },
  "states": [
    {
      "anchor": "mechanism",
      "label": "centroid normalization",
      "highlight": [
        "visual mass",
        "normalized centroid"
      ],
      "note": "A centroid conditions on visual mass, not full causal-row mass."
    },
    {
      "anchor": "implementation",
      "label": "pinned implementation",
      "highlight": [
        "normalized centroid"
      ],
      "note": "Static source inspection resolves this normalization for its supported backbone."
    }
  ]
}
```


## Algorithm

### Algorithm 55.1 — Representation with auditable coordinate transfer

[DERIVED] Inputs are an immutable image, processor specification, finite crop plan, deadline and token cap. Output is either a validated visual sequence with source transforms or an explicit representation failure. This is a book reconstruction of the interface obligations, not a claim about a released processor.

$$
\begin{aligned}
1.&\quad \text{reject expired/cancelled requests};\quad \mathcal C\leftarrow\operatorname{ValidateCrops}(I,\mathcal C_0);\quad\text{reject empty or invalid geometry}.\\
2.&\quad (J_k,A_k)\leftarrow\operatorname{ResizePad}(\operatorname{Crop}(I,C_k));\quad k=1,\ldots,K.\\
3.&\quad \text{check deadline/cancellation before each }E;\quad (Z_k,n_k)\leftarrow E(J_k);\quad\text{retain grid and page ids}.\\
4.&\quad n\leftarrow\sum_k n_k+n_{\mathrm{special}};\quad n>n_{\max}\Rightarrow\text{return budget failure}.\\
5.&\quad \text{recheck deadline/cancellation};\quad Z\leftarrow\operatorname{Pack}(Z_1,\ldots,Z_K);\quad\text{return }(Z,\{A_k\},\text{processor digest}).
\end{aligned}
$$

[DERIVED] The invariant is that every spatial output can be traced to exactly one immutable page and a declared transform. The crop count bounds execution; a rejected budget triggers an explicit change of plan, never silent truncation. Processing/encoding failure returns an explicit representation failure; a deadline does not itself establish device completion. Transform bookkeeping costs $O(K)$ space. Pixel processing scales with total processed crop area; encoder and decoder costs are accounted separately because overlapping crops increase the former even when later tokens are compressed.

## Implementation

[PAPER-REPORTED] SCVER's inspected implementation account names **PyTorch**, reference-stack §4 entry 17, Model / autograd framework layer, and NVIDIA H100 hardware [R55.3, Appendix B.1]. It documents sparse feature sampling, retained high-resolution features and KV-compatible decoding. The official adapter was also inspected statically at R55.13. Its configuration requires Transformers 4.57.6, selects decoder layers 3, 7, 11, 15, 19 and 23, and specializes to MinerU2.5-Pro-2604-1.2B with one still image per example. It delegates sampling to Transformers Deformable DETR rather than defining all sampler numerics locally. No repository execution or delegated-kernel inspection was performed, so exact sampler boundary behavior, graph capture and runtime/backend compatibility remain UNVERIFIED. These restrictions cannot be generalized to every backbone evaluated in the paper.

[DERIVED] Retained features require approximately $\tilde n_v\tilde d b$ bytes per image for one stored map; multiple maps and batch elements multiply that amount. A sampling operator with $H_sP_s$ points reads at most four neighboring vectors per bilinear point before reuse, plus location and weight projections. The apparent linearity in sample count does not imply regular contiguous memory traffic. Dense-prefix attention costs, sparse gathers and image encoding must be timed separately. Parameter/state costs, host-to-device traffic and feature lifetime remain relevant even when the visual sequence sent to the decoder shrinks. Energy and monetary savings cannot be deduced without measured service time and the deployment tariff.

## Experimental design

### Reported experiments

[PAPER-REPORTED] R55.3 §4.2 evaluates text with edit distance, formulas with character-detection matching, tables with TEDS and page parsing with an aggregate over text, table and formula scores. Table 1 changes each image dimension by ratios 0.5 or 0.7 in two dynamic-resolution backbones. Table 5 removes the spatial guidance term; Appendix B.6 further fine-tunes baselines on the same added data to test a data-volume explanation. Efficiency tests use H100 and batch one; seeds, complete package versions and several timing details are NOT-DISCLOSED in the inspected text.

## Observations

**What the paper claims.** [PAPER-REPORTED] At ratio 0.5, MonkeyOCR-Pro's PubTabNet TEDS changes from 58.3 without SCVER to 92.8 with it; at native ratio the listed baseline is 87.4 [R55.3, Table 1]. This is a reported dataset score under the source's processor, not a universal recognition gain.

**What the evidence shows.** [PAPER-REPORTED] The matched-resolution comparison and guidance ablation support the added mechanism on those tasks. The same-data fine-tuning control improves some baselines without closing all reported gaps [R55.3, Tables 5 and 8]. It does not prove absence of contamination in undisclosed backbone data.

**What we infer.** [DERIVED] Side-length reduction approximately squares the area reduction, subject to rounding, while retained high-resolution features create a second information path. Therefore a smaller prefix does not imply an equally small total visual memory footprint.

**What remains unknown.** [UNVERIFIED] Independent reproduction, delegated sampler boundary semantics and performance under shared serving load remain unresolved; the pinned code resolves centroid normalization for its supported backbone. No inspected experiment establishes equivalence between sparse sampling and lossless access to the original raster.

## Failure modes

> **Failure mode — Coordinate drift.** [DERIVED] *Symptom:* locally plausible boxes land on adjacent rows after assembly. *Cause:* padding or recursive crop scales were omitted. *Detection:* round-trip known landmarks through every transform. *Mitigation:* retain and compose transforms without intermediate integer rounding.

> **Failure mode — Irrecoverable sampling loss.** [DERIVED] *Symptom:* both compact-prefix and retrieved-feature paths miss the same small glyph. *Cause:* the source raster or retained encoder features never resolved it. *Detection:* compare original, processed view and independently supplied oracle text. *Mitigation:* acquire higher-quality evidence or abstain; more decoder steps do not restore absent observations.

## Siblings

[DERIVED] Choose whole-image resizing when accepted answers survive its compression and global coverage dominates. Choose tiling when localized detail is decisive and total token/encoder cost is feasible. Consider SCVER when retained features contain that detail and training/module access is available. External zoom, treated in §55.6, acquires pixels through tools instead. A matched-budget test showing lower selective error for a different option reverses the preference. The consequential next evidence is an oracle-text and controlled-resolution comparison: a persistent oracle gap points toward reasoning or evaluation; an image-only gap points toward the observation path.

## Extensions

### Improvements

[PAPER-REPORTED] R55.3 Table 4 extends retrieval to text-rich VQA and reports mixed comparisons against OCR-assisted alternatives; SCVER does not dominate them on every task or budget. Appendix B.4 varies heads, sample points and feature scales. The documented contribution is decoding-state access to detail with spatially guided training, not a demonstrated guarantee of information preservation.

## Limitations

[DERIVED] The sufficiency condition above is exact and usually untestable over all possible images. Finite evaluation supports a stated distribution only. A passed coordinate check establishes geometry, not semantic recognition. Stop the present argument at a conditional representation contract and bounded reported evidence; reopen the decision when source quality, task distribution, budget or a stronger matched comparator changes.

## Reproducibility

[DERIVED] Retain source image hashes, rasterization settings, orientation/color policy, crop rectangles, transforms, patch/merger settings, realized token counts and feature-map dtypes. R55.1 and R55.3 are pinned v1 primary texts first released inside the research window. The additional pinned implementation R55.13 is a static inspection, without a CODE-VERIFIED runtime claim. Their exact source locators and unresolved implementation obligations are in [references](references.md); the proposed checks are in [verification](verification.md). No training or model benchmark was executed here.

## References

[R55.1](references.md#r55-1), §§3.1–3.2; [R55.13](references.md#r55-13), pinned implementation; [R55.3](references.md#r55-3), §§3–4, Tables 1, 4–5 and Appendix B. Foundations: [Chapter 18](../../../vol-01-learning-and-representation/part-03-model-architectures-and-state/ch18-multimodal-architectural-primitives/README.md), [Chapter 42](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/README.md).
