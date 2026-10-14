---
id: "ms.section.41.1"
entity_type: "section"
title: "41.1 — Sparsity taxonomy"
volume: 2
part: 7
chapter: 41
section: 41.1
slug: "41-1-sparsity-taxonomy"
parent: "ms.chapter.41"
prev_sibling: null
next_sibling: "ms.section.41.2"
children: []
prerequisites: ["ms.chapter.13","ms.chapter.14","ms.chapter.15","ms.chapter.16","ms.chapter.17","ms.chapter.25","ms.chapter.26","ms.chapter.27","ms.chapter.28","ms.chapter.39","ms.chapter.40"]
downstream: ["ms.chapter.42","ms.chapter.43","ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle":["inference","adaptation"],"mechanism":["pruning","sparsity","adaptive_computation"],"feedback_setting":[],"modality":["text","image"]}
papers: []
implementations: ["impl.pytorch","impl.hugging-face-transformers","impl.nvidia-cutlass","impl.nvidia-cuda"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# 41.1 — Sparsity taxonomy

## Scope

[DERIVED] The object being reduced must be specified before comparing compression methods. This section owns weight-mask granularity, structural removal, and the distinction between sparse storage and executable sparsity. The baseline is the identical dense checkpoint, dtype, workload, and runtime. Success requires three separate records: numerical nonzeros, physically stored bytes, and operations actually skipped by the selected kernel. Selection, recovery, dynamic policies, and hardware realization have their canonical treatments in §§41.2–41.6.

## Why this exists

[MATHEMATICALLY-DERIVED] Multiplying a dense matrix containing zeros by an activation tensor still presents a dense shape to an ordinary dense GEMM. Its contractual arithmetic count does not change because some values vanish. Deleting a channel changes matrix dimensions; compressing a mask changes representation; choosing a sparse kernel changes execution. These transformations may be combined, but none implies the others. A file with half its numerical entries zero can occupy the same bytes and take the same compute path as its source.

[OFFICIAL-DOCUMENTATION] The current NVIDIA Model Optimizer sparsity guide distinguishes sparsification from save/restore and export. Export applies masks to ordinary weights and removes enforcing metadata; later fine-tuning can change the zero entries again [R41.16](references.md), “Save and restore the sparse model.” This is an artifact-state distinction with consequences for recovery and deployment, not a statement about accelerator throughput.

## Intuition

[MATHEMATICALLY-DERIVED] Sparsity is a constraint on admissible support. Unstructured support provides many choices for preserving a linear mapping, whereas a hardware pattern restricts those choices to patterns that a decoder and compute primitive can consume efficiently. Larger removal units simplify indexing but couple more functional contributions. Thus statistical flexibility, representation overhead, and executable regularity are different axes. No total ordering follows without a quality/resource criterion.

## Formulation

> **Definition — Executable sparsity.** [DERIVED] Sparsity whose zero contributions are omitted by the actual operators executed for a declared workload, rather than merely represented as numerical zeros.

> **Definition — Storage sparsity.** [DERIVED] A representation that omits zero payload values and stores enough positional information to reconstruct the tensor; its benefit is measured after indices, alignment, and metadata.

| Symbol | Meaning |
|---|---|
| $W\in\mathbb R^{d_o\times d_i}$ | Dense linear weights; output and input feature dimensions |
| $\mathcal M\in\{0,1\}^{d_o\times d_i}$ | Weight support mask |
| $\rho$ | Retained-entry density, $\|\mathcal M\|_0/(d_od_i)$ |
| $X\in\mathbb R^{d_i\times n}$ | $n$ activation columns; batch and positions flattened |
| $b,b_{\rm idx},b_{\rm ptr}$ | Bytes per payload, column index, and row pointer |
| $u,v$ | Row and column dimensions of a sparse storage block |

[MATHEMATICALLY-DERIVED] For a conventional dense multiply and a compressed-sparse-row representation with no extra padding,

$$
F_{\rm dense}=2nd_od_i,\qquad
M_{\rm dense}=bd_od_i,\qquad
M_{\rm CSR}=\rho d_od_i(b+b_{\rm idx})+(d_o+1)b_{\rm ptr}.
$$
*(Eq. 41.1)*

where one multiply-add counts as two FLOPs. The mask's retained count may exceed the actual nonzero count if selected weights happen to be zero. The formula counts stored weights only, excluding activations, allocator reserve, and workspaces.

[MATHEMATICALLY-DERIVED] Storage wins only when
$$
\rho < \frac{b-(d_o+1)b_{\rm ptr}/(d_od_i)}{b+b_{\rm idx}}.
$$
*(Eq. 41.2)*

With an analytical BF16 payload and four-byte indices, the large-matrix limit is density below one third. Fifty-percent unstructured sparsity therefore does not establish a compressed-byte saving under this particular encoding. A bitmask, entropy code, narrower index, or block encoding changes the inequality.

```figure
{
  "id": "fig-41.3",
  "kind": "diagram",
  "title": "Support, storage, and executed operators",
  "caption": "Each arrow is a separate transformation. Counting zeros does not establish compressed bytes or a sparse dispatch.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.1",
  "alt": "Dense weights are masked, encoded, and dispatched. A dense fallback branches from the execution decision; support validation precedes encoding.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "w",
        "kind": "tensor",
        "label": "dense weights"
      },
      {
        "id": "m",
        "kind": "process",
        "label": "mask selection"
      },
      {
        "id": "e",
        "kind": "memory",
        "label": "encoded payload and indices"
      },
      {
        "id": "k",
        "kind": "branch",
        "label": "supported dispatch"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "sparse operator"
      },
      {
        "id": "d",
        "kind": "process",
        "label": "dense fallback"
      }
    ],
    "edges": [
      {
        "from": "w",
        "to": "m"
      },
      {
        "from": "m",
        "to": "e"
      },
      {
        "from": "e",
        "to": "k"
      },
      {
        "from": "k",
        "to": "s"
      },
      {
        "from": "k",
        "to": "d"
      }
    ]
  }
}
```
```figure
{
  "id": "fig-41.4",
  "kind": "calculator",
  "title": "CSR storage break-even",
  "caption": "Illustrative matrix accounting, not a named model. Four-byte indices make half-density BF16 CSR larger than the dense payload.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.1",
  "alt": "Calculator compares dense payload with retained values, four-byte column indices, and row pointers for an illustrative matrix.",
  "spec": {
    "tex": "M_{CSR}=\\rho d_od_i(b+b_{idx})+(d_o+1)b_{ptr}",
    "equation": "41.1",
    "inputs": [
      {
        "symbol": "do_",
        "label": "output features",
        "default": 4096,
        "min": 64,
        "max": 16384,
        "scale": "log2",
        "format": "integer"
      },
      {
        "symbol": "di",
        "label": "input features",
        "default": 4096,
        "min": 64,
        "max": 16384,
        "scale": "log2",
        "format": "integer"
      },
      {
        "symbol": "rho",
        "label": "retained density",
        "default": 0.5,
        "min": 0.05,
        "max": 1,
        "step": 0.05,
        "format": "fixed2"
      },
      {
        "symbol": "b",
        "label": "payload bytes",
        "default": 2,
        "min": 1,
        "max": 4,
        "options": [
          1,
          2,
          4
        ],
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "Md",
        "label": "dense bytes",
        "formula": "do_*di*b",
        "format": "bytes"
      },
      {
        "symbol": "Ms",
        "label": "CSR bytes",
        "formula": "rho*do_*di*(b+4)+(do_+1)*4",
        "format": "bytes",
        "emphasis": true
      }
    ]
  }
}
```
```figure
{
  "id": "fig-41.5",
  "kind": "stat-panel",
  "title": "Block index amortization",
  "caption": "Illustrative one-block accounting for Eq. 41.3. Increasing block area reduces index bytes per retained scalar while restricting support choices.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.3",
  "alt": "For an illustrative 16 by 16 BF16 block, payload is 512 bytes and one four-byte block index costs one sixty-fourth byte per scalar.",
  "spec": {
    "header": "BLOCK PAYLOAD AND INDEX",
    "variables": {
      "u": 16,
      "v": 16,
      "b": 2
    },
    "rows": [
      {
        "key": "payload bytes",
        "formula": "u*v*b",
        "format": "bytes"
      },
      {
        "key": "index bytes per value",
        "formula": "4/(u*v)",
        "format": "fixed2"
      }
    ]
  }
}
```


## Mechanism

### Methodology

[DERIVED] The taxonomy begins with the tensor and the dimension along which its support is constrained. **Unstructured pruning** chooses individual entries; it can impose a global budget, a per-layer budget, or a per-output-row budget. These are different feasible sets even at equal total density. A globally concentrated mask can eliminate nearly all entries of one output row; a row budget forbids that outcome. **Block sparsity** retains or removes $u\times v$ tiles. Dense computation inside a retained tile includes any numerical zeros within that tile, so block occupancy and scalar occupancy must both be recorded.

[MATHEMATICALLY-DERIVED] If $z$ blocks are retained, a simple block-row encoding requires approximately
$$
M_{\rm BSR}=z(uvb+b_{\rm idx})+
\left(\left\lceil d_o/u\right\rceil+1\right)b_{\rm ptr}.
$$
*(Eq. 41.3)*

where boundary padding is additional when shapes are not divisible by the block dimensions. Increasing $uv$ amortizes the index but reduces mask flexibility. Worst-case storage is dense payload plus metadata when every block is retained. Worst-case arithmetic remains dense if the sparse path expands to a dense buffer.

[DERIVED] For **N:M sparsity**, this chapter writes the pattern as $n_s:m_s$ to avoid reusing the book's global parameter-count symbol $N$. Every consecutive group of $m_s$ entries along the documented contraction dimension retains at most $n_s$. Transposition is consequential: a pattern valid along rows need not remain valid along columns. The source's axis, storage order, and kernel operand position belong in the artifact, not in a verbal claim of “50% sparse.”

[PAPER-REPORTED] MaskLLM explicitly searches the six possible two-of-four supports with frozen base weights, using a differentiable distribution over discrete masks; the hard exported mask differs from the soft training relaxation [R41.9](references.md), §3, Eqs. 1–4. These six patterns explain combinatorial freedom inside 2:4; they do not imply arbitrary half-density support is hardware compatible.

[MATHEMATICALLY-DERIVED] **Channel sparsity** removes a feature and every connected producer/consumer slice. For a gated FFN, one intermediate channel couples rows of both input projections with a column of the output projection. **Head sparsity** removes attention-head subspaces and corresponding output-projection slices; with grouped key/value sharing, query-head removal and KV-head removal are different edits. **Layer sparsity** bypasses complete residual blocks, preserving the external residual width but changing composed computation. **Expert sparsity** removes experts or reduces channels within experts; the router and expert-index map must remain consistent. All four reduce dense shapes only after graph extraction. Merely masking their outputs leaves their producer cost intact.

[DERIVED] A useful artifact therefore records a tuple: support family, counted tensors, retained density, physical encoding, graph transformation, and executing operator. “Thirty percent sparse” omits five of these six fields. Parameter sparsity excludes KV cache unless a different state transformation is explicitly performed. Attention-edge sparsity belongs to the attention architecture chapters; token sparsity is execution-policy state developed in §41.5.

[MATHEMATICALLY-DERIVED] Costs separate into construction and use. Building a scalar mask needs at least one pass over the candidate weights, $\Omega(d_od_i)$ traffic; sorting all scores costs $O(d_od_i\log(d_od_i))$, while selection can avoid full sorting. At inference, a support-aware idealized multiply performs $2n\|\mathcal M\|_0$ arithmetic operations, but index decoding, gathers, padding, and load imbalance are additional. No training tokens are intrinsically required by the taxonomy; data-dependent selection and recovery consume tokens separately. Parameters removed from storage do not automatically remove communication when a distributed runtime still transfers padded dense tensors. Energy and monetary savings require measured execution time, power boundary, and deployment accounting; no numerical values follow from density alone.

## Algorithm

### Algorithm 41.1 — Support and execution contract audit

[DERIVED] Inputs are $W$, mask $\mathcal M$, pattern predicate $\mathcal P$, encoder $\mathsf E$, decoder $\mathsf D$, and an operator descriptor $\kappa$. Outputs are a typed artifact or a rejected compatibility claim. This is an explanatory audit, not a new pruning algorithm.

$$
\begin{aligned}
1.\;&W_s\leftarrow \mathcal M\odot W;\quad
\rho\leftarrow \|\mathcal M\|_0/(d_od_i).\\
2.\;&v_p\leftarrow\mathcal P(\mathcal M,\text{axis},\text{layout});
\quad v_p=0\Rightarrow\mathsf{reject}_{\rm pattern}.\\
3.\;&a\leftarrow\mathsf E(W_s);\quad
\mathsf D(a)\ne W_s\Rightarrow\mathsf{reject}_{\rm representation}.\\
4.\;&v_\kappa\leftarrow
\mathsf{supports}(\kappa,\text{shape},\text{dtype},\text{device},\text{layout}).\\
5.\;&v_\kappa=0\Rightarrow
\mathsf{record}(\text{fallback or unsupported});\quad
v_\kappa=1\Rightarrow\mathsf{record}(\text{dispatch candidate}).\\
6.\;&\mathsf{return}(\rho,|a|,\mathcal P,\kappa,\text{dispatch status}).
\end{aligned}
$$
*(Eq. 41.4)*

[DERIVED] The invariant is exact reconstruction of the masked tensor before any separately declared lossy quantization. The audit terminates after one bounded representation round trip; it does not certify speed. Pattern and decode checks cost $O(d_od_i)$ in the dense reference, with sparse output space proportional to encoded size. A dispatch candidate remains unverified until the profiler or targeted execution establishes which operator ran.

## Implementation

[OFFICIAL-DOCUMENTATION] **PyTorch — Model / autograd framework** exposes semi-structured tensor conversion; its BERT tutorial separates pruning, recovery fine-tuning, and conversion for execution. The tutorial identifies an A100 80GB test environment and warns against transferring its speedup to newer architectures [R41.19](references.md), “Requirements.” **NVIDIA CUDA — Accelerator / driver / compiler**, through cuSPARSELt, exposes matrix descriptors, sparse compression, workspace selection, and repeated matmul execution [R41.18](references.md), “Workflow.” These interfaces illustrate distinct artifact and execution states; neither was run for this manuscript.

[DERIVED] An implementation must retain both original and compressed shape contracts during conversion. Channel extraction requires contiguous newly allocated dense matrices, not a sparse scalar type. Expert extraction additionally needs stable expert identifiers and a router mapping; changing only the weight list silently changes routing semantics. Checkpoint metadata must specify whether zeros are enforced by a parametrization, physically stored in a compressed layout, or absent because dimensions changed. Model Optimizer is outside the numbered stack but explicitly routed by the Chapter 41 plan anchor.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The inspected MaskLLM study evaluates 2:4 masks on LLaMA-2, Nemotron-4, and internal GPT-style models; it compares one-shot criteria with mask learning and reports WikiText perplexity and downstream evaluation [R41.9](references.md), §4, Appendices A–D. This is evidence about a constrained support family and its learned selection, not a controlled comparison of every sparsity granularity. Seed-wise uncertainty and a universal storage-to-speed conversion are NOT-DISCLOSED in that comparison.

[OFFICIAL-DOCUMENTATION] PyTorch's tutorial uses BERT question answering to compare dense and recovered semi-structured variants, reporting F1 values 86.92 and 86.48 [R41.19](references.md), “Overview.” The result concerns that task and training recipe; its executable conversion stage must be distinguished from a dense tensor containing the same zeros.

## Observations

**What the paper claims.** [PAPER-REPORTED] MaskLLM reports that learning support can preserve quality better than the inspected one-shot baselines within 2:4 [R41.9](references.md), §4.2.

**What the evidence shows.** [DERIVED] The experiment varies selection under a fixed pattern. It cannot establish that 2:4 dominates a smaller dense architecture at equal recovery compute, nor that every backend executes its mask.

**What we infer.** [MATHEMATICALLY-DERIVED] Equations 41.1–41.3 demonstrate why equal nonzero counts can yield different storage: positional information has a cost that depends on the encoding unit.

**What remains unknown.** [UNVERIFIED] There is no book-executed dispatch trace, storage audit, energy measurement, or matched-budget comparison across all seven granularities.

## Failure modes

> **Failure mode — Correct zeros, wrong axis.** [DERIVED] *Symptom:* conversion rejects a nominal 2:4 tensor or uses fallback. *Cause:* support was checked along the wrong contraction dimension. *Detection:* verify the post-transpose pattern used by the descriptor. *Mitigation:* select and validate support in the actual packed operand layout.

> **Failure mode — Zero-count accounting.** [MATHEMATICALLY-DERIVED] *Symptom:* claimed compression exceeds file or resident-memory reduction. *Cause:* dense payload, indices, or padding were omitted. *Detection:* reconcile all encoded bytes with Eq. 41.1 or 41.3. *Mitigation:* report numerical, storage, and executable sparsity separately.

## Siblings

[DERIVED] [Quantization](../ch40-quantization-from-numerical-model-to-deployable-artifact/README.md) changes numerical representation; sparsity constrains support. [Distillation](../ch39-knowledge-response-and-policy-distillation/README.md) supplies learning signals; it is not itself a support pattern. [Structural reduction](41-3-structural-reduction.md) deletes dimensions and often uses dense kernels; [adaptive computation](41-5-adaptive-computation.md) changes active work per input while retaining a larger parameter artifact. Their resource boundaries differ even when parameter counts coincide.

## Extensions

### Improvements

[PAPER-REPORTED] PATCH extends fixed 2:4 by selecting dense versus 2:4 tiles, trading a continuously adjustable model-wide sparsity budget against hybrid-kernel requirements [R41.10](references.md), §§3–4. Its mechanism and measured deployment boundary are developed in §41.6. It changes the feasible support family, rather than proving that a fixed-density criterion improved. No universally preferred block size follows from this lineage.

## Limitations

[DERIVED] Taxonomy determines what a claim means, not which mask preserves behavior. Every omitted tensor must be named: embeddings, output heads, normalization, and routers can remain dense. A model-wide sparsity percentage must weight tensors by their actual sizes. This section's storage identities do not predict latency or justify applying a pruning policy to undisclosed proprietary architecture.

## Reproducibility

[UNVERIFIED] No checkpoint or executable artifact was produced here. The proposal in [verification.md](verification.md) specifies the missing representation and dispatch records. Inspected documentation is mutable and unpinned; the references record the actual 2026-10-14 access. Review requires an explicit encoder, contraction axis, kernel descriptor, and round-trip tolerance for each comparison.

## References

[R41.9](references.md), MaskLLM §3–4; [R41.10](references.md), PATCH §3–4; [R41.16](references.md), Model Optimizer sparsity guide; [R41.18](references.md), cuSPARSELt workflow; [R41.19](references.md), PyTorch semi-structured tutorial.
