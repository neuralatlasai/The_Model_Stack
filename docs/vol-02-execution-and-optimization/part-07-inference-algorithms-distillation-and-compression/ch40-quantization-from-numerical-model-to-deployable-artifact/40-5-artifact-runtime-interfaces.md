---
id: ms.section.40.5
entity_type: section
title: Artifact/runtime interfaces
volume: 2
part: 7
chapter: 40
section: 40.5
slug: 40-5-artifact-runtime-interfaces
parent: ms.chapter.40
prev_sibling: ms.section.40.4
next_sibling: ms.section.40.6
children: []
prerequisites: [ms.chapter.26, ms.chapter.28, ms.section.40.4]
downstream: [ms.chapter.43, ms.chapter.45]
related: []
relations: []
axes: {lifecycle: [inference, serving], mechanism: [artifact_contract, quantized_kernel_dispatch], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.llama-cpp, impl.vllm, impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 40.5 — Artifact/runtime interfaces

## Scope

[DERIVED] A deployable artifact must preserve tensor semantics and select an executable operator. The baseline is a BF16 checkpoint loaded without a quantized transformation. Success means that export/reload preserves the intended decoded model, dispatch is known for actual shapes, and end-to-end evaluation covers the resulting numerical and resource behavior. This section owns packing, metadata, dequantization, GGUF/safetensors boundaries and compatibility.

## Why this exists

[DERIVED] A quantizer can be scientifically valid while its exported artifact is unusable. Packed codes omit information unless group axes, scales and decoder conventions survive serialization. A runtime can parse the container yet ignore a quantization configuration, repack it incorrectly or execute a slower fallback. Changes in tokenizer or chat template can overwhelm a small quantization difference. The deployable object is consequently a bundle of model semantics, numerical representation and runtime requirements.

[OFFICIAL-DOCUMENTATION] GGUF specifies model metadata and typed tensor records; safetensors specifies tensor storage and metadata without serializing arbitrary model computation [R40.13, file structure; R40.14, “Format”]. Neither filename alone proves the execution kernel.

## Intuition

[DERIVED] Packing is a reversible change of representation if its decoder exactly recovers the same quantized values. Requantization is different: decoding one grid and projecting onto another can add a new error. Runtime fusion is a third transformation: it computes with packed values without materializing the entire decoded tensor. These transformations need different equivalence checks.

## Formulation

> **Definition — Quantized artifact contract.** [DERIVED] The packed values, numerical decoding metadata and runtime requirements that jointly identify an executable quantized model.

| Local symbol | Meaning |
|---|---|
| $q_i\in[0,2^k-1]$ | Unsigned code index, not necessarily signed numerical value |
| $r_p$ | Number of codes per storage word |
| $u_w$ | Storage-word width in bits |
| $\mathcal P,\mathcal U$ | Packing and unpacking maps |
| $\mathcal D$ | Numerical decoder including scales, zero points and codebook |
| $\mathcal R$ | Runtime operator selected for the artifact/device tuple |
| $F_q$ | Intended decoded quantized weight |

[MATHEMATICALLY-DERIVED] For $kr_p\le u_w$ and a declared low-bit-first convention,

$$
p_j=\sum_{h=0}^{r_p-1}q_{jr_p+h}2^{kh},
\qquad q_{jr_p+h}=
\left\lfloor p_j/2^{kh}\right\rfloor\bmod 2^k .
$$
*(Eq. 40.18)*

where the last word's unused slots are padding. Integer code interpretation, word endianness and tensor-axis permutation are additional conventions; this formula alone does not define a named checkpoint layout.

[MATHEMATICALLY-DERIVED] The contracts separate:

$$
\mathcal U(\mathcal P(q))=q,\qquad
\mathcal D(\mathcal U(\text{artifact}),\text{metadata})=F_q,\qquad
\mathcal R(\text{artifact},u)\approx F_qu .
$$
*(Eq. 40.19)*

where exact equality applies to code identity; approximate operator equality has dtype-specific tolerance. A round trip can satisfy the first equality and violate the second through wrong scale axes.

## Mechanism

### Methodology

[DERIVED] Construction starts with logical tensors and a quantizer record. Packing maps codes into bytes or words, optionally permutes tiles and stores scales separately. Export records original dimensions, physical padded dimensions, grouping axis, layout version, codebook, scale dtype and zero-point convention. Reload interprets those records and chooses a compatible operator. A conversion that changes tile order is lossless only if unpacking composes with the inverse permutation.

[OFFICIAL-DOCUMENTATION] The inspected GGUF specification describes a version-three structural header, metadata key/value pairs, tensor names/dimensions/types/offsets and aligned tensor data [R40.13, “File structure”]. It separately records quantization version. GGUF is the artifact format, GGML is a tensor implementation ecosystem, and llama.cpp is an inference implementation. These are distinct identities.

[OFFICIAL-DOCUMENTATION] The inspected safetensors format has a little-endian eight-byte header length, a JSON header with dtype/shape/data offsets and a contiguous byte buffer; its optional metadata is string-to-string [R40.14, “Format”]. Quantizer semantics can reside in companion configuration files. The format does not infer them from an integer tensor dtype.

[DERIVED] For example, a packed unsigned integer tensor can store indices into NF4, signed INT4 codes with an offset, or arbitrary bit fields. Its raw dtype does not distinguish these meanings. Loading it as ordinary integers produces a structurally valid tensor and an invalid model. The companion configuration is therefore part of the artifact's scientific identity, not optional deployment decoration.

[MATHEMATICALLY-DERIVED] Requantizing from grid $\mathcal Q_1$ to $\mathcal Q_2$ yields

$$
\mathcal Q_2(\mathcal Q_1(F))-F
=\left[\mathcal Q_2(\mathcal Q_1(F))-\mathcal Q_1(F)\right]
+\left[\mathcal Q_1(F)-F\right].
$$
*(Eq. 40.20)*

where the triangle inequality bounds the new norm by the sum, not the maximum, of the two errors. Converting packed layouts can preserve codes exactly; changing group size or codebook generally cannot. Rebuilding from the original high-precision source removes inherited first-stage error but changes the calibration task.

[MATHEMATICALLY-DERIVED] Dequantization can be whole-tensor, layerwise or tiled inside the multiply. Whole-tensor decoding restores high-precision resident weights and can erase capacity savings. Layerwise decoding retains compressed persistent weights but needs a large temporary tensor. Tiled decoding limits temporary storage and can avoid writing expanded weights back to HBM. It adds decode instructions and scale loads to the multiply, so reduced traffic competes with arithmetic and occupancy overhead.

$$
M_{\rm peak}\ge M_{\rm packed}+M_{\rm workspace}+M_{\rm activations}+M_{\rm cache},
\qquad
\Delta M_{\rm full\ decode}\approx N(b_{\rm compute}-k_{\rm eff}/8).
$$
*(Eq. 40.21)*

where the second expression assumes simultaneous retained packed and decoded weights and excludes metadata details already included in $k_{\rm eff}$. A runtime that discards packed tensors after loading has a different peak/resident boundary.

[DERIVED] Offline packing costs $O(N)$ code visits and payload reads/writes. A tiled weight-only multiply preserves the dense arithmetic count while adding unpacking; native low-bit arithmetic changes the realized instruction path. Tensor-parallel sharding can require repacking aligned groups or distributing scale metadata. Model conversion does not change token count. Startup latency, steady-state throughput, energy and money require separate measurements.

```figure
id: fig-40.15
kind: systems-trace
title: Export to executed operator
caption: Structural validity, decoded-value validity and kernel selection are separate boundaries in the same deployment path.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.19
alt: Logical codes are packed and serialized, then loaded, decoded and dispatched. Failures can occur in layout, metadata, scale interpretation or unsupported kernels.
spec:
  columns: [memory, compute, failure]
  stages:
    - {name: pack, values: {compute: permutation and bit operations, failure: code order}}
    - {name: serialize, values: {memory: codes plus metadata, failure: missing scale semantics}}
    - {name: reload, values: {memory: packed or expanded tensors, failure: wrong decoder}}
    - {name: dispatch, values: {compute: native or dequantizing kernel, failure: unsupported shape}}
    - {name: execute, values: {memory: workspace and cache, failure: numerical divergence}}
```

## Algorithm

### Algorithm 40.5 — Bounded compatibility decision

[MATHEMATICALLY-DERIVED] Inputs are artifact schema, runtime/device capabilities and a finite tensor list. Output is a dispatch manifest or rejection. This is an analytical validation procedure, not a claim that a named loader performs every check.

$$
\begin{aligned}
1.\;&\operatorname{ParseSchema}(\text{artifact})\text{ fails}\Rightarrow\text{reject}.\\
2.\;&\forall t:\ \operatorname{ValidateOffsetsShapesMetadata}(t)\text{ fails}\Rightarrow\text{reject}.\\
3.\;&\forall t:\ \mathcal U(\mathcal P(q_t))\ne q_t\Rightarrow\text{reject layout}.\\
4.\;&\forall t:\ \operatorname{Dispatch}(t,\text{device,runtime})\leftarrow
\begin{cases}\text{supported native},&\text{matching contract}\\
\text{declared fallback},&\text{valid alternate contract}\\
\text{reject},&\text{otherwise}.\end{cases}\\
5.\;&\operatorname{CompareDecodedAndOperatorOutputs}\text{ exceeds tolerance}
\Rightarrow\text{reject numerical path}.\\
6.\;&\text{return exact dispatch manifest and independent end-to-end acceptance requirement}.
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] The tensor loop terminates after the finite inventory. Its invariant is that every accepted tensor has a complete decoder and a declared execution path. Structural checks scale with metadata; complete code checks require $O(N)$ work. Operator checks add their explicitly selected workload cost. A fallback is acceptable only when recorded and evaluated.

## Implementation

[OFFICIAL-DOCUMENTATION] llama.cpp and vLLM occupy **Inference engine**; PyTorch occupies **Model / autograd framework**; Hugging Face Transformers occupies **Model definition / adaptation**. The llama.cpp quantization tool documents named GGUF quantization types and conversion usage [R40.23, quantize README]. vLLM documents hardware compatibility and per-quantization backend selection [R40.15, “Selecting Linear Backends per Quantization”]. These mutable surfaces are explicitly unpinned.

[MATHEMATICALLY-DERIVED] Export compatibility is a tuple of architecture, quantizer, schema revision, shapes, runtime, device and kernels. A supported quantizer on one architecture can still fail for tied embeddings, expert tensors or unsupported projections. Retaining the source checkpoint and a conversion manifest makes rollback concrete; caching only a generated engine can lose the provenance necessary to reconstruct the numerical model.

## Experimental design

### Reported experiments

[PAPER-REPORTED] TorchAO's 2025 report presents tensor-subclass integration and benchmarks spanning inference and training [R40.11, §2–4]. AWQ's TinyChat studies packing and fused dequantization as part of its deployment implementation [P34, §4.2]. These establish that layout and fusion are consequential experimental variables. They do not establish compatibility for this chapter's unexecuted artifact.

[NOT-DISCLOSED] Neither inspected container specification contains a benchmark of all quantizer/runtime combinations. For a format specification, training data and task splits are not applicable: it defines a representation, not a trained model. Performance evidence must come from a particular implementation study.

## Observations

**What the paper claims.** [PAPER-REPORTED] TorchAO describes a common framework representation that supports multiple lower-precision operators [R40.11, §2–3].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] The vLLM page explicitly restricts implementations by hardware and notes that its chart changes [R40.15, “Supported Hardware”]. GGUF and safetensors describe containers rather than universal kernel support.

**What we infer.** [MATHEMATICALLY-DERIVED] A readable file is insufficient evidence of a deployed low-bit operator, because Eqs. 40.18–19 impose successively stronger conditions.

**What remains unknown.** [UNVERIFIED] No exported checkpoint, conversion round trip or actual dispatch trace was produced for this chapter.

## Failure modes

> **Failure mode — Silent expansion.** [MATHEMATICALLY-DERIVED] *Symptom:* checkpoint size shrinks but resident memory does not. *Cause:* loader materializes high-precision weights. *Detection:* compare live tensor inventory and operator trace. *Mitigation:* use a supported packed path or report expansion honestly.

[MATHEMATICALLY-DERIVED] Wrong code signedness, missing activation-order maps, scales attached to physical rather than logical axes and tokenizer changes can each invalidate comparisons. Arbitrary executable model code is a separate loading boundary; tensor serialization alone does not authorize it.

## Siblings

[MATHEMATICALLY-DERIVED] The comparison axis is interface responsibility. GGUF carries a model-oriented tensor/metadata container; safetensors carries tensor storage with configuration elsewhere; [quantizer methods](40-4-method-families.md) construct codes; runtimes execute operators. Containers are not optimization algorithms, and runtime support is not task-quality evidence.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] ModelOpt's 2026 KV export examples preserve quantization configuration and expose a deployment-support flag; unsupported exported combinations require additional runtime support [R40.20, “Combining KV and GEMM AutoQuant”]. This advances composition metadata without proving joint execution. Per-format backend selection in vLLM makes mixed operator assignments explicit [R40.15]. It increases the need to retain a layerwise dispatch manifest.

## Limitations

[MATHEMATICALLY-DERIVED] Exact packed-code equality does not imply bitwise operator equality when reduction order or accumulator differs. Numerical tolerances must depend on the declared operation and downstream requirement. A finite trace establishes only exercised shapes; unseen batch/context combinations can select different paths.

## Reproducibility

[MATHEMATICALLY-DERIVED] Save source/artifact hashes, converter commit, quantizer config, scale tensors, permutation/index maps, tokenizer/template, loader version, kernel names, device/driver and fallback decisions. Record file bytes, peak loading memory and steady-state memory separately. No compatibility check was executed in this edition.

## References

[P34](references.md#p34), [R40.11](references.md#r40-11), [R40.13](references.md#r40-13), [R40.14](references.md#r40-14), [R40.15](references.md#r40-15), [R40.20](references.md#r40-20), [R40.23](references.md#r40-23).

```figure
id: fig-40.16
kind: calculator
title: Expanded-weight memory risk
caption: Analytical simultaneous packed and decoded storage excludes cache and activations. Full decoding can erase most capacity savings.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.21
alt: An illustrative seven-billion-value model at 4.5 bits per value occupies about 3.94 billion packed bytes; a simultaneous two-byte decoded copy adds fourteen billion bytes.
states:
  - {anchor: formulation, label: Packed only, variables: {expanded: 0}, note: Persistent payload only.}
  - {anchor: mechanism, label: Full decode, variables: {expanded: 1}, note: The decoded copy is additional.}
  - {anchor: failure-modes, label: Peak load, variables: {expanded: 1}, note: Source tensors and workspace can add still more.}
spec:
  tex: M=N(k_{\rm eff}/8+e\,b)
  equation: "40.21"
  inputs:
    - {symbol: N, label: eligible values, default: 7000000000, min: 1000000000, max: 70000000000, scale: log2, format: integer}
    - {symbol: keff, label: effective bits, default: 4.5, min: 2, max: 16, format: fixed2}
    - {symbol: b, label: decoded bytes, default: 2, min: 1, max: 4, format: integer}
    - {symbol: expanded, label: decoded copy retained, default: 0, min: 0, max: 1, options: [0, 1], format: integer}
  outputs:
    - {symbol: mem, label: weight bytes, formula: N*(keff/8+expanded*b), format: bytes}
```

```figure
id: fig-40.17
kind: stat-panel
title: Deployment identity
caption: A reproducible artifact includes numerical semantics and the runtime tuple that consumes them.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.19
alt: Retain architecture and template, codebook and groups, packing and decoder, runtime and device, and actual native or fallback dispatch.
spec:
  header: ARTIFACT TO RUNTIME
  rows:
    - {key: semantics, value: architecture and template}
    - {key: numerics, value: codebook groups scales}
    - {key: bytes, value: packing and decoder}
    - {key: execution, value: actual dispatch}
```
