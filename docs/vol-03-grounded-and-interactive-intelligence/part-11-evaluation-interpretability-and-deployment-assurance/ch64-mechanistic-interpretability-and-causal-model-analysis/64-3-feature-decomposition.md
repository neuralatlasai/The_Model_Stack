---
id: ms.section.64.3
entity_type: section
title: "Feature decomposition"
volume: 3
part: 11
chapter: 64
section: 64.3
slug: 64-3-feature-decomposition
parent: ms.chapter.64
prev_sibling: ms.section.64.2
next_sibling: ms.section.64.4
children: []
prerequisites:
  [
    ms.chapter.2,
    ms.chapter.5,
    ms.chapter.13,
    ms.chapter.14,
    ms.chapter.15,
    ms.chapter.16,
    ms.chapter.17,
    ms.chapter.18,
    ms.chapter.32,
    ms.chapter.61,
    ms.chapter.62,
  ]
downstream: [ms.chapter.65, ms.chapter.66]
related: [ms.chapter.40, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [evaluation, assurance],
    mechanism:
      [causal_intervention, representation_analysis, feature_decomposition],
    feedback_setting: [],
    modality: [text],
  }
papers: []
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: { maturity: active, disputed: false }
evidence_summary:
  {
    labels_used:
      [
        DERIVED,
        MATHEMATICALLY-DERIVED,
        PAPER-REPORTED,
        CODE-VERIFIED,
        ASSUMED,
        NOT-DISCLOSED,
        UNVERIFIED,
      ],
    empirically_observed: false,
  }
word_count_target: 2200
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 64.3 Feature decomposition

## Scope

[DERIVED] Feature decomposition constructs a sparse analysis basis for activations or computations. The baseline is direct neuron/coordinate analysis; the required result is a decomposition whose reconstruction, selectivity and intervention behavior are measured separately. This section owns sparse autoencoders, dictionary constraints, feature splitting and omission, and the cross-layer-transcoder training contract. Naming a latent is not acceptance. The artifact must retain the residual error and model/feature identity, including cases that the dictionary cannot explain.

## Why this exists

[MATHEMATICALLY-DERIVED] When several latent signals share architectural coordinates, inspecting a neuron mixes their effects. An overcomplete dictionary can represent more candidate directions than the activation dimension, using few at once. This does not uniquely identify the generating causes: multiple dictionaries can fit the same finite observations. A reconstruction objective constrains the sum of contributions; sparsity and normalization constrain how that sum is represented. Neither directly supervises a truthful feature name or downstream causal completeness.

## Intuition

[DERIVED] A sparse autoencoder reconstructs an activation; a transcoder reconstructs an MLP output from its input. A cross-layer transcoder (CLT) lets a feature extracted at one layer contribute to several later MLP outputs. This can represent reuse without assigning every occurrence a new unrelated node. It also increases decoder parameters and changes the computational graph used for analysis. The skip-like explanation edges belong to the replacement model; their existence does not prove that the original transformer contains those literal wires. [R64.2, §2](https://arxiv.org/html/2603.21014v2#S2).

## Formulation

[DERIVED] For activation $h\in\mathbb R^d$, dictionary $U\in\mathbb R^{d\times K}$, nonnegative code $z_\phi(h)\in\mathbb R_+^K$ and bias $b_0$, a book-defined sparse reconstruction objective is

$$
\min_{U,\phi,b_0}\mathbb E\left[\|h-Uz_\phi(h)-b_0\|_2^2+
\alpha_{\mathrm{sp}}\|z_\phi(h)\|_1\right],\qquad \|U_{:,k}\|_2=1.
$$

_(Eq. 64.8)_

[MATHEMATICALLY-DERIVED] Without the column constraint or another scale correction, $U_{:,k}\mapsto cU_{:,k}$ and $z_k\mapsto z_k/c$ preserve reconstruction while reducing the L1 term for $c>1$. The objective can reward scaling rather than a more parsimonious representation. A fixed top-$k$ gate instead constrains support size; deterministic tie handling, nonnegativity and whether exactly or at most $k$ nonzeros survive must be specified. These are different estimators, not interchangeable definitions of sparsity.

[PAPER-REPORTED] CLT-Forge uses a JumpReLU gate on encoder preactivations and inclusive cross-layer decoding. With $L$ layers, feature width $K$ per layer and $d=d_{\mathrm{model}}$, the column-vector convention is

$$
q_\ell=E_\ell h_\ell+b_{\mathrm{enc},\ell},\quad
z_{\ell k}=q_{\ell k}\mathbf1\{q_{\ell k}>\vartheta_{\ell k}\},\quad
\widehat m_r=\sum_{\ell\le r}U_{\ell\to r}z_\ell+b_r,
\quad E_\ell\in\mathbb R^{K\times d},\ U_{\ell\to r}\in\mathbb R^{d\times K}.
$$

_(Eq. 64.9)_

[DERIVED] Here $h_\ell$ is the named MLP-input activation and $m_r$ its target output; positive thresholds $\vartheta=\exp(\xi)$ make the code nonnegative. JumpReLU is discontinuous at a positive threshold. Learning thresholds requires an explicitly chosen surrogate gradient; a classical derivative through the indicator does not supply it. The source code's custom training implementation is identified in the ledger, but its surrogate-gradient implementation was not independently executed. [R64.2, §2.1, Appendix B; R64.3, `CLT.encode`](https://arxiv.org/html/2603.21014v2#S2.SS1).

[CODE-VERIFIED] Static inspection of the CLT-Forge repository at commit c92d83d199899ac88f636310cd90e5c5173c379e found the following. In the pinned `CLT.loss`, reconstruction is a coordinate sum, token mean and layer sum after converting target and prediction to float32. Define $u_{\ell k}=\|[U_{\ell\to\ell,:,k};\ldots;U_{\ell\to L,:,k}]\|_2$. The corresponding objective is

$$
\mathcal L_{\mathrm{CLT}}=\frac1n\sum_{i=1}^n\left[
\sum_{r=1}^L\|m_{ir}-\widehat m_{ir}\|_2^2+
\alpha_{\mathrm{sp}}\sum_{\ell,k}\tanh(c_{\mathrm{gate}}z_{i\ell k}u_{\ell k})+
\alpha_{\mathrm{dead}}\sum_{\ell,k}(\vartheta_{\ell k}-q_{i\ell k})_+u_{\ell k}\right].
$$

_(Eq. 64.10)_

[DERIVED] The source sets $c_{\mathrm{gate}}=4$. The norm-weighted saturating term approaches a support-count penalty for sufficiently large positive products, but is not exact L0. The final term encourages preactivations toward thresholds, including presently inactive features. Because the reconstruction term is not divided by $d$, changing dimension changes its relative scale unless coefficients are retuned. The canonical book symbols $C,D,N,\lambda,\tau$ are not repurposed for feature counts, gate constants or thresholds. [R64.3, `CLT.loss`, lines 414-454](https://github.com/LLM-Interp/CLT-Forge/blob/c92d83d199899ac88f636310cd90e5c5173c379e/src/clt_forge/clt.py#L414).

[MATHEMATICALLY-DERIVED] The inclusive decoder triangle contains $Q=L(L+1)/2$ matrices. The pinned allocation has $L$ encoder matrices and $Q$ decoder matrices, hence

$$
N_{\mathrm{matrix}}=(L+Q)Kd,\quad
N_{\mathrm{all}}=(L+Q)Kd+2LK+Qd,\quad
Q=L(L+1)/2.
$$

_(Eq. 64.11)_

[CODE-VERIFIED] Static inspection of the CLT-Forge repository at commit c92d83d199899ac88f636310cd90e5c5173c379e found the following. The two $LK$ vectors are encoder biases and log thresholds; decoder biases in this implementation have shape $[Q,d]$ and are summed by target layer. Nonparameter buffers are excluded. Appendix B Eq. 5 of the paper counts $QKd$, despite its inclusive decoder definition, and gives approximately 27.4 billion for $L=16,d=2048,K=48d$. The pinned allocation instead requires 30,601,641,984 matrix parameters for that configuration. This source/code discrepancy is unresolved as a paper accounting convention; the book uses the inspected allocations and does not call the smaller count total CLT parameters. [R64.2, Appendix B, Eq. 5; R64.3, `CLT.__init__`, lines 49-98](https://github.com/LLM-Interp/CLT-Forge/blob/c92d83d199899ac88f636310cd90e5c5173c379e/src/clt_forge/clt.py#L49).

```figure
{
  "id": "fig-64.9",
  "kind": "calculator",
  "title": "Inclusive CLT parameter accounting",
  "caption": "Executes Eq. 64.11 for an analytical architecture. Includes encoders, inclusive decoders, encoder biases, thresholds and per-decoder biases; excludes optimizer state and buffers.",
  "alt": "An analytical calculator with explicit inputs. Executes Eq. 64.11 for an analytical architecture. Includes encoders, inclusive decoders, encoder biases, thresholds and per-decoder biases; excludes optimizer state and buffers.",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-64.11",
  "spec": {
    "equation": "64.11",
    "tex": "Q=L(L+1)/2,\\quad N_{\\mathrm{all}}=(L+Q)Kd+2LK+Qd",
    "inputs": [
      {
        "symbol": "layers",
        "label": "layers L",
        "default": 16,
        "min": 1,
        "max": 80,
        "format": "integer"
      },
      {
        "symbol": "width",
        "label": "model width d",
        "default": 2048,
        "min": 64,
        "max": 8192,
        "format": "integer"
      },
      {
        "symbol": "features",
        "label": "features per layer K",
        "default": 65536,
        "min": 1024,
        "max": 262144,
        "format": "integer"
      },
      {
        "symbol": "bytes",
        "label": "bytes per stored parameter",
        "default": 2,
        "min": 1,
        "max": 4,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "params",
        "label": "all allocated parameters",
        "formula": "(layers+layers*(layers+1)/2)*features*width+2*layers*features+layers*(layers+1)/2*width",
        "format": "integer"
      },
      {
        "symbol": "storage",
        "label": "parameter storage GiB",
        "formula": "((layers+layers*(layers+1)/2)*features*width+2*layers*features+layers*(layers+1)/2*width)*bytes/pow(2,30)",
        "format": "fixed2"
      }
    ]
  },
  "placement": "rail",
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] CLT-Forge separates extraction from training: it caches MLP inputs/outputs, estimates per-layer normalization, quantizes cached activations with per-layer scales and compresses chunks, then trains on the cached records. A separate replacement-model evaluation measures consequences of substituting predicted MLP outputs. This avoids recomputing the base model at every dictionary update while introducing cache quantization, normalization and data-version dependencies. Its feature-sharding mode partitions feature columns and combines partial decoded outputs. [R64.2, §§3.1-3.4](https://arxiv.org/html/2603.21014v2#S3).

[MATHEMATICALLY-DERIVED] Decomposition is not identifiable from reconstruction alone. If two columns are equal, replacing $(z_1,z_2)$ by any nonnegative pair with the same sum leaves $Uz$ unchanged. Splitting a broad feature into correlated narrower features can improve an objective while changing the labels and graph. Conversely, a rare mechanism can remain in the reconstruction residual if its expected reconstruction contribution is small. Report per-population residuals and rare-task behavior, not just mean explained variance.

[PAPER-REPORTED] Descriptive Collision studies a second ambiguity: multiple features can receive the same explanation. For a uniform feature identity $F$ and deterministic label $E(F)$ with clusters $\mathcal C_e$, its information reduction is

$$
I(F;E(F))=\log_2 K-\sum_e\frac{|\mathcal C_e|}{K}\log_2|\mathcal C_e|.
$$

_(Eq. 64.12)_

[DERIVED] This identity measures distinguishability of feature identities from their labels, not semantic truth. The paper's equal-detection-score proposition additionally requires identical binarized activation patterns on the evaluation set; an identical name alone is insufficient. Its proposed discrimination score compares a feature against activation-overlap neighbors on feature-exclusive texts. Empty exclusive sets must return undefined, and ties need an explicit scoring convention. [R64.5, §§3, 5-6](https://arxiv.org/html/2605.12874v1#S5).

```figure
{
  "id": "fig-64.10",
  "kind": "diagram",
  "title": "A feature model must retain its unexplained residual",
  "caption": "The learned dictionary is an analysis model with an explicit reconstruction error. Labels and causal tests are separate outputs rather than consequences of a small training loss.",
  "alt": "Text equivalent: Versioned input and output activations. Sparse encoder and gate. Inclusive cross-layer decoder. Target minus reconstruction residual. Hypothesized feature labels. Replacement and intervention tests. Arrows encode the stated dependencies, not measured causal strengths.",
  "evidence": "DERIVED",
  "source": [
    "DERIVED:eq-64.9",
    "DERIVED:eq-64.10"
  ],
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "cache",
        "kind": "dataset",
        "label": "Versioned input and output activations"
      },
      {
        "id": "enc",
        "kind": "model",
        "label": "Sparse encoder and gate"
      },
      {
        "id": "dec",
        "kind": "model",
        "label": "Inclusive cross-layer decoder"
      },
      {
        "id": "res",
        "kind": "tensor",
        "label": "Target minus reconstruction residual"
      },
      {
        "id": "label",
        "kind": "state",
        "label": "Hypothesized feature labels"
      },
      {
        "id": "test",
        "kind": "metric",
        "label": "Replacement and intervention tests"
      }
    ],
    "edges": [
      {
        "from": "cache",
        "to": "enc",
        "label": "fit"
      },
      {
        "from": "enc",
        "to": "dec",
        "label": "codes"
      },
      {
        "from": "cache",
        "to": "res",
        "label": "target"
      },
      {
        "from": "dec",
        "to": "res",
        "label": "subtract"
      },
      {
        "from": "enc",
        "to": "label",
        "label": "inspect examples"
      },
      {
        "from": "dec",
        "to": "test",
        "label": "joint substitution"
      },
      {
        "from": "res",
        "to": "test",
        "label": "omission check"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 64.3 - Train and evaluate a sparse replacement basis.** [DERIVED] Inputs are disjoint cached training/evaluation activations with model/site identities, a finite update budget $U_{\max}$, initialization seed and objective 64.10. Outputs are a checkpoint, residual diagnostics and held-out replacement results; the procedure is an explanatory adaptation of CLT-Forge, not an executed reproduction.

$$
\begin{aligned}
1.&\quad \text{validate cache identities, shapes, finite values and normalization};\quad u\leftarrow0;\\
2.&\quad (E,U,b,\xi)\leftarrow\operatorname{Init}(\mathrm{seed});\quad
 \text{record exact trainable allocations};\\
3.&\quad u\leftarrow u+1;\quad (h,m)\leftarrow\mathcal B_u;\quad
 z\leftarrow\operatorname{JumpReLU}(Eh+b,\exp\xi);\\
4.&\quad \widehat m\leftarrow\operatorname{Decode}_{\ell\le r}(U,z,b_{\mathrm{dec}});
 \quad \mathcal L\leftarrow\mathcal L_{\mathrm{CLT}}(m,\widehat m,z);\\
5.&\quad \operatorname{finite}(\mathcal L,\nabla\mathcal L)=0\Rightarrow\operatorname{return}(\mathrm{failed});
 \quad (E,U,b,\xi)\leftarrow\operatorname{OptimizerStep};\\
6.&\quad u<U_{\max}\Rightarrow\text{return to 3};\quad
 \operatorname{return}(\mathrm{checkpoint},\mathrm{held\text{-}out\ residuals},\mathrm{joint\ replacement}).
\end{aligned}
$$

[DERIVED] Sparse codes remain nonnegative and decoder indices satisfy $\ell\le r$; synchronization and optimizer state are part of the update contract. Dense encoding costs $O(nLdK)$ for $n$ token records; dense triangular decoding costs $O(nQKd)$. If $k$ features are active per source layer, the arithmetic in gathered decoding can approach $O(nQkd)$, but dense encoding remains. The pinned gather implementation first materializes `z.index_select(1,l_idx)` of shape $[n,Q,K_{\mathrm{local}}]$, then nonzero indices and $[\mathrm{nnz},d]$ decoder rows: low arithmetic count does not imply negligible temporary memory.

## Implementation

[CODE-VERIFIED] Static inspection of the CLT-Forge repository at commit c92d83d199899ac88f636310cd90e5c5173c379e found the following. At `c92d83d199899ac88f636310cd90e5c5173c379e`, CLT-Forge's sparse decoder uses gathered decoder rows, weighted contributions and `index_add_`. The paper describes an embedding-bag strategy, so that operator description is not assumed to be the pinned code path. Partial $[n,L,d]$ outputs are summed using an autograd-aware all-reduce before replicated bias addition; penalties are also summed across feature shards. Every rank must use the same activation batch, and feature partition divisibility must be validated. A ring all-reduce's nominal per-rank traffic is approximately $2(P-1)/P$ times the output bytes for $P$ ranks, excluding penalty collectives and protocol overhead. [R64.3, `_sparse_decode_gather_cross_layer`, lines 315-354](https://github.com/LLM-Interp/CLT-Forge/blob/c92d83d199899ac88f636310cd90e5c5173c379e/src/clt_forge/clt.py#L315).

[CODE-VERIFIED] Static inspection of the CLT-Forge repository at commit c92d83d199899ac88f636310cd90e5c5173c379e found the following. PyTorch is the model/autograd framework; the feature-sharding collective is source-specific code, not a demonstrated FSDP2 equivalence. The pinned Llama runner requests bfloat16, expansion 32, 75,000 updates, gradient accumulation 4 and `world_size*128` tokens per microbatch. With eight ranks this implies 4,096 tokens per update and 307.2 million consumed tokens. The paper's Table C batch field is 8,192. The code/config and published run must be treated as distinct until reconciled; neither an inspected comment claiming float32 encoders nor a nominal model name overrides actual allocation dtype and checkpoint identity. [R64.3, `CLT.__init__`, `runners/training/llama1b/config.py`](https://github.com/LLM-Interp/CLT-Forge/blob/c92d83d199899ac88f636310cd90e5c5173c379e/runners/training/llama1b/config.py).

## Experimental design

### Reported experiments

[PAPER-REPORTED] CLT-Forge Appendix C reports GPT-2 with 24,576 features/layer, expansion 32, 209 million tokens, float32, and Llama-3.2-1B with 65,536 features/layer, expansion 32, 307 million tokens and bfloat16. Both list Adam moments 0.9/0.999, learning rate $2\times10^{-4}$, batch 8,192 and eight H100 80 GB GPUs. Reported training times are 5 h 04 min and 17 h 35 min respectively, with final mean L0 10 and 22.51 and explained variance 0.75 and 0.746. These are separate model/configuration results, not a controlled architecture speed comparison; exact cache/model/tokenizer hashes and repeated-run intervals are not supplied in the inspected table. [R64.2, Appendix C](https://arxiv.org/html/2603.21014v2#A3).

## Observations

**What the paper claims.** [PAPER-REPORTED] CLT-Forge's sparsity sweep shows lower activity and more dead features as the penalty increases, with reconstruction quality falling beyond its useful range. Descriptive Collision reanalyzes released human feature labels rather than training a new SAE or executing its proposed discrimination judge. Its source prose and table counts do not fully reconcile; no recalculated population frequency is presented here. [R64.2, Appendix D; R64.5, §§4, 6](https://arxiv.org/html/2605.12874v1#S4).

**What the evidence shows.** [CODE-VERIFIED] Static inspection of CLT-Forge commit c92d83d199899ac88f636310cd90e5c5173c379e allocates L encoder and Q inclusive decoder matrices, validating Eq.64.11 rather than a decoder-only total. This is allocation evidence, not an independently measured training, reconstruction or replacement result.

**What we infer.** [DERIVED] Sparsity is a constrained tradeoff, not a monotone improvement in explanation. Neither explained variance nor a distinctive label establishes that a feature is a unique causal variable. The inspected allocation and reduction rules are sufficient to correct analytical resource accounting, without running model training. [DERIVED] Prefer a sparse basis when held-out selectivity and intervention usefulness improve under the same residual and compute budget. Revert to coarser sites or a different dictionary when missing mechanisms, unstable splitting or joint replacement failure dominate the task. A lower reconstruction error alone cannot settle this preference.

**What remains unknown.** [NOT-DISCLOSED] Exact paper-to-runner batch correspondence, the paper's total parameter-count convention, rare-mechanism recall, and independent causal validation across dictionaries are unresolved. Static source inspection establishes none of the reported runtime or empirical metrics independently.

## Failure modes

[DERIVED] Scale degeneracy lowers an unconstrained penalty without improving content. Dead features reduce effective capacity; threshold-crossing instability can make local derivatives misleading. A cache from the wrong normalization/site can train smoothly on the wrong target. Different source batches on feature shards sum unrelated outputs. Mean metrics conceal minority failures. Duplicate columns and duplicate names are different failure modes and require different tests. Excluding residual/error nodes creates a falsely complete graph.

## Siblings

```figure
{
  "id": "fig-64.11",
  "kind": "compare",
  "title": "Choose the decomposition target",
  "caption": "The target and deployment contract determine which sparse estimator is useful. Sparsity levels alone are not comparable across these targets.",
  "alt": "Text equivalent: The target and deployment contract determine which sparse estimator is useful. Sparsity levels alone are not comparable across these targets.",
  "evidence": "DERIVED",
  "source": [
    "DERIVED:eq-64.8",
    "DERIVED:eq-64.9",
    "DERIVED:eq-64.11"
  ],
  "spec": {
    "axis": "Choose the decomposition target",
    "columns": [
      {
        "id": "sae",
        "label": "Activation SAE"
      },
      {
        "id": "local",
        "label": "Layer-local transcoder"
      },
      {
        "id": "cross",
        "label": "Cross-layer transcoder"
      }
    ],
    "rows": [
      {
        "dimension": "Reconstructs",
        "values": {
          "sae": "An activation at one site",
          "local": "One MLP output from its input",
          "cross": "MLP outputs from current and earlier codes"
        }
      },
      {
        "dimension": "Main extra obligation",
        "values": {
          "sae": "Basis and residual validity",
          "local": "Functional replacement fidelity",
          "cross": "Triangular allocation and joint fidelity"
        }
      },
      {
        "dimension": "Resource tendency",
        "values": {
          "sae": "One encoder and decoder",
          "local": "Per-layer encoder and decoder",
          "cross": "Quadratic decoder-pair growth in L"
        }
      }
    ]
  },
  "placement": "rail",
  "anchor": "siblings"
}
```

[DERIVED] L1, top-$k$ and JumpReLU trade smooth shrinkage, explicit support budgets and learned thresholds. A matched comparison must hold activation data, target, dictionary width, reconstruction normalization and replacement tests fixed. Reported activity counts from different reductions are not interchangeable.

## Extensions

### Improvements

[PAPER-REPORTED] CLT-Forge's 2026 contribution packages cached activation loading, sparse decoding, distributed training and graph extraction. Its paper reports compressed-cache and training savings under its own configurations; the present chapter does not turn those into universal ratios. Descriptive Collision proposes near-neighbor discrimination as a stricter test than a feature-detection score, but does not report executing that proposed new judge experiment. [R64.2, §3; R64.5, §6](https://arxiv.org/html/2603.21014v2#S3).

## Limitations

[DERIVED] An analysis basis can be useful without being unique, and it can remain misleading despite high reconstruction quality. The current evidence does not guarantee discovery of every rare or distributed mechanism, nor that a feature's name is stable across model versions. An omitted distinction, failed intervention, or alternate equally good decomposition can reopen the interpretation. Reconstruction and replacement must therefore travel with every feature-level claim.

## Reproducibility

[DERIVED] Record model/tokenizer/CLT hashes, cache extraction sites and normalization, quantization scales, dictionary width, gate/surrogate, all loss reductions, optimizer/schedule, shard topology and batch identity, plus held-out residuals and joint replacement. The source ledger records the pinned Python environment's remaining unpinned dependencies. Allocation arithmetic fixtures are book-authored checks; no SAE/CLT training, cache generation or GPU timing was executed.

## References

[R64.2] CLT-Forge paper v2, §§2-5 and Appendices B-D. [R64.3] Pinned official implementation/configuration. [R64.5] Descriptive Collision, §§3-6. See [references](references.md).
