---
id: "ms.section.41.3"
entity_type: "section"
title: "41.3 — Structural reduction"
volume: 2
part: 7
chapter: 41
section: 41.3
slug: "41-3-structural-reduction"
parent: "ms.chapter.41"
prev_sibling: "ms.section.41.2"
next_sibling: "ms.section.41.4"
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

# 41.3 — Structural reduction

## Scope

[DERIVED] Structural reduction changes tensor dimensions or the computation graph so a smaller architecture can execute without scalar sparse kernels. This section owns width/depth pruning, head and expert removal, low-rank factorization, and architecture extraction. The baseline is the parent architecture at identical precision and evaluation protocol. Success requires a valid extracted graph, a bounded quality loss, and measured resource benefits; lower parameter count alone is insufficient.

## Why this exists

[PAPER-REPORTED] SliceGPT targets the execution difficulty of irregular masks by replacing weights with smaller dense matrices after rotating the residual representation [R41.4](references.md), §3. Puzzle targets a different limitation: parameter count and FLOPs do not uniquely determine hardware latency, so it searches block alternatives using measured resource tables [R41.8](references.md), §§2–4. Both alter the architecture, but their selection objective and recovery budget differ.

[MATHEMATICALLY-DERIVED] Graph consistency makes structural deletion consequential. Removing an FFN feature from only one input matrix leaves the other gate and down projection inconsistent. Removing a residual coordinate from one block leaves adjacent additions undefined. A structurally valid change is a coupled transformation across a dependency graph, not a list of independent low-score rows.

## Intuition

[MATHEMATICALLY-DERIVED] Structural methods exchange flexibility for regular dense execution. A reduced intermediate width removes a set of nonlinear basis functions; depth pruning removes an entire composed residual update; rank reduction restricts a linear operator to an intermediate subspace. The three constraints have different function classes. They cannot be compared by a common “pruning percentage” without specifying the counted parameters and retained computational paths.

## Formulation

| Symbol | Meaning |
|---|---|
| $d=d_{\rm model}, f=d_{\rm ff}$ | Residual and intermediate widths |
| $W_u,W_g\in\mathbb R^{f\times d}, W_d\in\mathbb R^{d\times f}$ | Up, gate, and down projections of a gated FFN |
| $J\subseteq\{1,\ldots,f\}$ | Retained intermediate channels, $|J|=f'$ |
| $F_\ell$ | Residual update at layer $\ell$ |
| $A\in\mathbb R^{d_o\times r}, B_r\in\mathbb R^{r\times d_i}$ | Rank-$r$ factors; $B_r$ is not global batch $B$ |
| $Q,P_r$ | Orthogonal residual transform and retained-coordinate selector |

[MATHEMATICALLY-DERIVED] A coupled FFN extraction is
$$
F_J(h)=W_d[:,J]\left[\phi(W_g[J,:]h)\odot W_u[J,:]h\right].
$$
*(Eq. 41.12)*

It has $3df'$ rather than $3df$ weights and approximately $6df'$ versus $6df$ projection FLOPs per token, excluding nonlinearities and biases. The residual output stays $d$ dimensional; reducing $f$ does not intrinsically reduce KV state.

[MATHEMATICALLY-DERIVED] Low-rank factorization changes a dense mapping to
$$
Wh\approx A(B_rh),\qquad
N_{\rm fact}=r(d_i+d_o),\qquad
F_{\rm fact}=2nr(d_i+d_o).
$$
*(Eq. 41.13)*

Compression of weights and projection arithmetic requires $r<d_id_o/(d_i+d_o)$. For a square matrix this means rank below half its width, before overheads. An algebraically rank-deficient matrix need not have a smaller resident artifact unless its factors are stored and executed separately.

```figure
{
  "id": "fig-41.9",
  "kind": "diagram",
  "title": "Coupled gated-FFN channel extraction",
  "caption": "The same channel set J slices both input projections and the matching output-projection columns. The external residual width stays fixed.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.12",
  "alt": "Residual input feeds gate and up projections. Both retain the same channels J; their elementwise product feeds the down projection with the matching columns J, returning the original residual width.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "h",
        "kind": "tensor",
        "label": "residual input",
        "sub": "d features"
      },
      {
        "id": "g",
        "kind": "process",
        "label": "gate rows J"
      },
      {
        "id": "u",
        "kind": "process",
        "label": "up rows J"
      },
      {
        "id": "p",
        "kind": "tensor",
        "label": "gated product",
        "sub": "f prime features"
      },
      {
        "id": "d",
        "kind": "process",
        "label": "down columns J"
      },
      {
        "id": "o",
        "kind": "tensor",
        "label": "residual output",
        "sub": "d features"
      }
    ],
    "edges": [
      {
        "from": "h",
        "to": "g"
      },
      {
        "from": "h",
        "to": "u"
      },
      {
        "from": "g",
        "to": "p"
      },
      {
        "from": "u",
        "to": "p"
      },
      {
        "from": "p",
        "to": "d"
      },
      {
        "from": "d",
        "to": "o"
      }
    ]
  }
}
```
```figure
{
  "id": "fig-41.10",
  "kind": "calculator",
  "title": "Factorization compression threshold",
  "caption": "Analytical dense linear-layer accounting before intermediate traffic and launch overhead. Rank must be below the displayed threshold for fewer weights.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.13",
  "alt": "Calculator compares dense weights d input times d output to rank times the sum of input and output dimensions, showing the rank threshold for fewer parameters.",
  "spec": {
    "tex": "N_{fact}=r(d_i+d_o),\\quad r_{threshold}=d_id_o/(d_i+d_o)",
    "equation": "41.13",
    "inputs": [
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
        "symbol": "do_",
        "label": "output features",
        "default": 4096,
        "min": 64,
        "max": 16384,
        "scale": "log2",
        "format": "integer"
      },
      {
        "symbol": "r",
        "label": "rank",
        "default": 1024,
        "min": 32,
        "max": 4096,
        "scale": "log2",
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "Nd",
        "label": "dense parameters",
        "formula": "di*do_",
        "format": "params"
      },
      {
        "symbol": "Nf",
        "label": "factor parameters",
        "formula": "r*(di+do_)",
        "format": "params",
        "emphasis": true
      },
      {
        "symbol": "rt",
        "label": "threshold rank",
        "formula": "di*do_/(di+do_)",
        "format": "fixed2"
      }
    ]
  }
}
```
```figure
{
  "id": "fig-41.11",
  "kind": "stat-panel",
  "title": "Gated FFN retained width",
  "caption": "Illustrative projection-only accounting with residual width fixed. Width reduction does not itself remove attention KV heads.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.12",
  "alt": "At illustrative residual width 4096 and intermediate width 8192, gated FFN weights count three times both widths and projection FLOPs count twice the weight count per token.",
  "spec": {
    "header": "GATED FFN PROJECTIONS",
    "variables": {
      "d": 4096,
      "f": 8192
    },
    "rows": [
      {
        "key": "parameters",
        "formula": "3*d*f",
        "format": "params"
      },
      {
        "key": "FLOPs per token",
        "formula": "6*d*f",
        "format": "flops"
      }
    ]
  }
}
```


## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] Width extraction first assigns a shared channel ordering to $W_u,W_g,W_d$, then materializes the retained slices in contiguous tensors. Bias entries, quantization groups, adapter factors, and optimizer state follow the same map. Residual-width reduction is broader: embeddings, normalization parameters, all block input/output maps, residual additions, and the output head must share a compatible coordinate system. Attention inner width need not equal residual width; querying $H_qd_h$ features from a smaller residual vector is a valid rectangular projection. Treating $H_qd_h=d$ as an inviolable architectural identity can invalidate otherwise legitimate extraction.

[PAPER-REPORTED] SliceGPT proves orthogonal invariance for its normalized transformer representation and chooses blockwise principal components before slicing [R41.4](references.md), §3.1–3.4, Theorem 1 and Appendix A.1. Learned normalization scaling and LayerNorm mean subtraction require the source's conversion/absorption steps. The exact rotation precedes the lossy deletion; the deletion is not itself invariant.

[MATHEMATICALLY-DERIVED] For a scale-free RMS normalization, $\|Qh\|_2=\|h\|_2$ implies $\mathsf{norm}(Qh)=Q\mathsf{norm}(h)$. This commutation generally fails for an arbitrary nonorthogonal transform, or an unabsorbed learned diagonal scale that does not commute with $Q$. After rotation, retaining $P_r^\top Qh$ incurs projected activation error
$$
\|(I-Q^\top P_rP_r^\top Q)h\|_2^2.
$$
*(Eq. 41.14)*

Choosing principal components minimizes average squared projection error on the sampled representation, but does not minimize final task loss unless additional conditions connect that projection to downstream sensitivity.

[MATHEMATICALLY-DERIVED] Depth pruning replaces $h_{\ell+1}=h_\ell+F_\ell(h_\ell)$ by $h_{\ell+1}=h_\ell$. For a fixed input, its immediate perturbation is $-F_\ell(h_\ell)$. If subsequent maps have Lipschitz constants $a_j$, the propagated norm is bounded by $\|F_\ell(h_\ell)\|\prod_{j>\ell}a_j$. This bound explains why small local residual updates can still matter downstream; it is often loose and supplies no empirical guarantee. Several deletions interact through changed inputs, so ranking blocks once and removing many need not preserve the single-deletion ordering.

[DERIVED] Head removal preserves the residual output by deleting the relevant query projection rows and output-projection columns. For grouped-query attention, deleting a KV head also affects every query head that consumes that KV group, or requires an explicitly changed grouping. Rotary-coordinate pairs and head dimensions must remain legal. Removing a query head alone does not necessarily reduce KV storage. Replacing many query heads by fewer shared KV groups is an architecture change owned by [Chapter 14](../../../vol-01-learning-and-representation/part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/README.md), not an equivalent name for arbitrary head pruning.

[MATHEMATICALLY-DERIVED] Expert removal is different from zeroing an expert's contribution after dispatch. If the router selects top-$k$ among $E$ experts, restricting its candidate set to $E'<E$ can change every selected index and renormalized gate. Holding the original gates while removing an output yields perturbation $-g_ez_e$; rerouting to replacement experts adds further terms. Thus a first-order fixed-router attribution is a local proxy, not the exact effect of rebuilding the router. Total parameter memory can fall even if top-$k$ activated parameters stay constant. Token traffic and load balance can worsen when the remaining experts attract more tokens.

[PAPER-REPORTED] The 2026 attribution/coverage method estimates expert loss impact from output-gradient attribution, then assigns per-expert channel counts by score coverage and redistributes counts to aligned multiples [R41.15](references.md), §§4.1–4.3, Appendix A. Its important differential is retaining different portions of important experts rather than deciding only whole-expert survival. Fine-tuning and quantization are separate stages in its experiments.

[MATHEMATICALLY-DERIVED] For calibration-aware rank reduction, let $G=XX^\top/n\succ0$ and $G=RR^\top$. Then
$$
\frac1n\|(W-\widehat W)X\|_F^2
=\|(W-\widehat W)R\|_F^2.
$$
*(Eq. 41.15)*

Writing $WR=U\Sigma V^\top$, a rank-$r$ optimum for this weighted linear objective is
$$
\widehat W=U_r\Sigma_rV_r^\top R^{-1},\qquad
\mathcal E_{\min}=\sum_{j>r}\sigma_j^2.
$$
*(Eq. 41.16)*

The result follows by truncating the singular expansion of $WR$ in Euclidean Frobenius norm and undoing the invertible whitening map. Damping $G$ changes the metric; a singular $G$ needs a supported-subspace formulation and does not justify an inverse. Two balanced factors can split $\Sigma_r^{1/2}$ to avoid assigning all scale to one factor.

[PAPER-REPORTED] SVD-LLM applies Cholesky-based whitening before truncation [R41.5](references.md), §3.1. Its 2024 v3 uses a closed-form left-factor update; the inspected 2025 v5 instead uses sequential factor-wise LoRA recovery (§3.2), developed in §41.4. These revisions must not share an unspecified recovery recipe or result table.

[MATHEMATICALLY-DERIVED] Architecture extraction adds a discrete systems objective. Given layer candidates $a\in\mathcal A_\ell$, estimated quality penalty $q_{\ell a}$, measured resource costs $t_{\ell a},m_{\ell a}$, and binary selection $z_{\ell a}$, one explanatory formulation is
$$
\min_z\sum_{\ell,a}q_{\ell a}z_{\ell a},\quad
\sum_a z_{\ell a}=1,\quad
\sum_{\ell,a}t_{\ell a}z_{\ell a}\le t_{\max},\quad
\sum_{\ell,a}m_{\ell a}z_{\ell a}\le m_{\max}.
$$
*(Eq. 41.17)*

Additivity is an approximation: fused kernels, pipeline placement, workspace reuse, and multi-block quality interactions can violate it. The assembled graph must therefore be evaluated after solving; a feasible table estimate is not an accepted deployment artifact.

[MATHEMATICALLY-DERIVED] Structural construction costs include statistics, decompositions, candidate recovery, and search. A full SVD of a $d_o\times d_i$ matrix costs $O(d_od_i\min(d_o,d_i))$ with dense algorithms, plus $O(d_i^2)$ whitening state. Factorized execution writes/reads an additional $r\times n$ intermediate unless fused. Width/depth extraction can reduce weight traffic and activation sizes, but network collectives depend on the new parallel partition and padding. Energy and money require charging extraction and recovery as well as inference; neither follows from the parameter ratio.

## Algorithm

### Algorithm 41.3 — Dependency-closed extraction

[DERIVED] Inputs are a parent graph $\mathcal G$, retained coordinates $J_v$ for each affected tensor axis, a bounded candidate set, and acceptance constraints. Output is a structurally valid candidate or a rejected edit.

$$
\begin{aligned}
1.\;&\mathcal J\leftarrow\mathsf{closure}(\{J_v\},\text{producer/consumer dependencies}).\\
2.\;&\exists(u,v):\mathsf{edgeShape}(u,\mathcal J)\ne
\mathsf{edgeShape}(v,\mathcal J)\Rightarrow\mathsf{reject}_{\rm shape}.\\
3.\;&W'_v\leftarrow\mathsf{slice}(W_v,\mathcal J);
\quad \mathcal G'\leftarrow\mathsf{rewrite}(\mathcal G,\{W'_v\}).\\
4.\;&\text{router, head-group, position, or normalization contract invalid}
\Rightarrow\mathsf{reject}_{\rm semantic}.\\
5.\;&(q',t',m')\leftarrow\mathsf{evaluate}(\mathcal G');
\quad(q',t',m')\notin\mathcal C_{\rm accept}\Rightarrow\mathsf{reject}.\\
6.\;&\mathsf{return}(\mathcal G',\mathcal J,\text{configuration and provenance}).
\end{aligned}
$$
*(Eq. 41.18)*

[DERIVED] Every surviving edge has consistent dimensions; that is the invariant. The finite graph closure and bounded candidate set guarantee termination. This extraction contract is not a proposed experiment or a source-specific NAS solver. Copying retained weights costs $O(N')$ time/space; candidate evaluations dominate when search is broad.

## Implementation

[PAPER-REPORTED] SVD-LLM and SliceGPT realize their reductions through ordinary linear layers, while Puzzle trains a library of alternatives before mixed-integer selection [R41.5](references.md), §3; [R41.4](references.md), §3; [R41.8](references.md), §§3–4. **PyTorch — Model / autograd framework** and **Hugging Face Transformers — Model definition / adaptation** provide the model/operator layer; **NVIDIA CUTLASS — Kernels / numerics / collectives** support is discussed in §41.6. No exact current backend was executed.

[OFFICIAL-DOCUMENTATION] The inspected Model Optimizer pruning guide exposes Minitron, Puzzletron, and FastNAS modes and states that pruning mutates the model in place [R41.17](references.md), “Introduction” and “Perform pruning.” This is a version-sensitive interface disclosure, not an executed compatibility claim. Preserve a separate parent artifact before invoking such a transformation.

[DERIVED] Extraction must also rewrite configuration fields and checkpoint loading maps. Tied embeddings require one consistent retained representation; LoRA factors need compatible slicing before merging. A low-rank factor pair cannot be silently rematerialized into a full dense matrix during export without losing its parameter-storage advantage. Static shapes help compilation, but unsupported head counts, widths, or expert heterogeneity can still trigger slow paths.

## Experimental design

### Reported experiments

[PAPER-REPORTED] SVD-LLM v5 compares seven checkpoints across ten datasets, using 256 WikiText-2 calibration samples and 50K Alpaca examples for recovery. Its Table 1 distinguishes whitening-only LLaMA-7B perplexity 7.94 from recovered 7.73 at 20% compression, versus ASVD 11.14 and dense 5.68 [R41.5](references.md), §§4–4.1. Recovery therefore changes the compared intervention; improvements over ASVD coexist with degradation from the parent.

[PAPER-REPORTED] The 2026 MoE study uses DeepSeek and Qwen MoEs, C4 for general calibration and domain-matched math/code data, followed by lightweight fine-tuning. It evaluates 50% channel pruning and a distinct 25%-pruning/4-bit configuration [R41.15](references.md), §5.1, Appendix C.1. These configurations cannot isolate pruning from quantization or recovery by themselves. Independent reproduction and book-run energy measurements remain unavailable.

## Observations

**What the paper claims.** [PAPER-REPORTED] SliceGPT reports that rotated dense slicing preserves substantial zero-shot performance on its evaluated models without sparse runtime extensions [R41.4](references.md), §4.

**What the evidence shows.** [DERIVED] The methods demonstrate several realizable smaller architectures, not an architecture-independent redundancy fraction. Rank, residual width, intermediate width, and expert count constrain different operators.

**What we infer.** [MATHEMATICALLY-DERIVED] Equations 41.13 and 41.16 separate a rank approximation's error criterion from its compression threshold. A low reconstruction error at rank above the threshold does not yield a parameter saving.

**What remains unknown.** [UNVERIFIED] Quality under production long contexts, tool execution, changed routing workloads, and the current runtime's exact support for each extracted graph has not been established here.

## Failure modes

> **Failure mode — Unclosed channel deletion.** [DERIVED] *Symptom:* shape errors or changed gate pairing. *Cause:* independently selected producer/consumer slices. *Detection:* dependency maps and reference outputs. *Mitigation:* extract complete coupled groups with stable coordinate identifiers.

> **Failure mode — Additive search surrogate fails.** [DERIVED] *Symptom:* assembled latency or quality misses a candidate-table estimate. *Cause:* block interactions, fusion, or changed input distributions. *Detection:* evaluate the assembled artifact. *Mitigation:* restrict search claims to the measured final graph.

## Siblings

[DERIVED] [Scalar sparsity](41-1-sparsity-taxonomy.md) keeps dense shapes but constrains support; structural reduction changes shapes. [Adaptive execution](41-5-adaptive-computation.md) retains optional paths and selects them per input. [LoRA adaptation](../../../vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch23-parameter-efficient-adaptation-and-model-composition/README.md) has a different canonical objective; using a low-rank update does not itself compress the base matrix.

## Extensions

### Improvements

[PAPER-REPORTED] Puzzle adds hardware-constrained architecture search and local block distillation to a pruning-only reduction, with final global recovery [R41.8](references.md), §§3–5, §8 ablations. Its measured resource tables address a limitation of parameter-only search; the quality contributions of local distillation and global recovery must remain separate. The 2026 MoE alignment redistribution addresses kernel-compatible dimensions, a deployment constraint not solved by minimizing raw channel scores [R41.15](references.md), §4.3.

## Limitations

[DERIVED] Calibration optimality for a single linear operator does not establish global task optimality. Orthogonal invariance depends on normalization and graph transformations; it cannot be assumed for arbitrary architectures. Head/expert removal changes state interfaces and routing semantics, so validation of weights alone is inadequate.

## Reproducibility

[OFFICIAL-DOCUMENTATION] The inspected Puzzle repository calls itself a demonstration of the MIP search stage and explicitly excludes a complete block-library construction/distillation release [R41.22](references.md), README “Overview.” Its existence does not establish end-to-end reproduction of the paper.

[UNVERIFIED] Paper versions and inspected locators are recorded in [references.md](references.md). No extracted checkpoint, mixed-integer search, factorization tolerance, or target-kernel execution was produced. The artifact specification requires retained-axis maps, normalization conversions, factor ranks, router changes, and resource-table provenance.

## References

[R41.3](references.md), LLM-Pruner §3; [R41.4](references.md), SliceGPT §3–4; [R41.5](references.md), SVD-LLM §3–4; [R41.8](references.md), Puzzle §2–5; [R41.15](references.md), 2026 structural MoE method §4–5.
