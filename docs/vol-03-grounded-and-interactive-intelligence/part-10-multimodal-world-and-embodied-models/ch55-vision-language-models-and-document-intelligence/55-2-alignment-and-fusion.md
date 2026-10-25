---
id: ms.section.55.2
entity_type: section
title: Alignment and fusion
volume: 3
part: 10
chapter: 55
section: 55.2
slug: 55-2-alignment-and-fusion
parent: ms.chapter.55
prev_sibling: ms.section.55.1
next_sibling: ms.section.55.3
children: []
prerequisites: [ms.chapter.18, ms.chapter.31, ms.chapter.49, ms.chapter.50]
downstream: [ms.chapter.57, ms.chapter.63]
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

# 55.2 - Alignment and fusion

## Scope

[DERIVED] The required result is a visual interface whose distinctions remain usable by the downstream language task after training. This section separates learning a shared image-text geometry from conditioning token generation on visual states. An encoder can excel at pooled retrieval while its patch states support weak OCR, or conversely produce useful dense features while underperforming on zero-shot classification. The acceptance rule must therefore name the intended consumer: pooled similarity, dense prediction or a decoder trained through a bridge. Architectural primitives are owned by [Chapter 18](../../../vol-01-learning-and-representation/part-03-model-architectures-and-state/ch18-multimodal-architectural-primitives/README.md); the present analysis concerns their visual information and optimization contracts.

## Why this exists

[DERIVED] Pair matching supervises whether two observations belong together. Caption likelihood supervises which linguistic details a decoder must predict. Neither objective automatically requires every visible object, relation or character to survive in every patch state. Broad captions can be predicted from a few salient cues; unrelated examples can be separated without accurately binding attributes to objects. The decision-relevant uncertainty is where useful information is missing: the encoder, the fusion interface, the decoder's utilization of that interface, or the target annotations. Unfreezing a backbone cannot repair mislabeled supervision, and a wider bridge cannot recover distinctions already discarded by its input.

## Intuition

[MATHEMATICALLY-DERIVED] Let two images differ only in a relation, while their captions name the same objects. A pooled matching score insensitive to that relation can still separate both pairs from unrelated images. Thus success on pair identification does not logically imply relation recognition. Conversely, a frozen visual encoder can preserve the relation in local states even when its pooled projection does not expose it. A downstream bridge changes the readout; its success does not establish that pooled alignment itself improved. These possibilities motivate interventions at different boundaries instead of assigning every failure to a generic notion of alignment.

## Formulation

[MATHEMATICALLY-DERIVED] For a batch of $B\geq1$ paired observations, let normalized pooled image and text embeddings be $v_i,t_i\in\mathbb R^d$, with temperature $\tau>0$. A symmetric pair-classification construction is

$$
\mathcal L_{\mathrm{pair}}=-\frac1{2B}\sum_{i=1}^{B}\left[
\log\frac{e^{v_i^\top t_i/\tau}}{\sum_j e^{v_i^\top t_j/\tau}}+
\log\frac{e^{t_i^\top v_i/\tau}}{\sum_j e^{t_i^\top v_j/\tau}}\right].
$$
*(Eq. 55.5)*

where the diagonal is designated positive and the off-diagonal pairs are treated as alternatives. This is an objective specification, not a guarantee that alternative captions are semantically false. With identical valid captions appearing twice, the diagonal convention creates competing targets. The temperature changes both concentration and gradient magnitude; batch construction changes the comparison distribution. These consequences follow from the denominator and must be separated from encoder architecture.

[MATHEMATICALLY-DERIVED] For visual states $V\in\mathbb R^{n_v\times d_v}$, a two-layer bridge can form $Z=\operatorname{GELU}(VW_1+b_1)W_2+b_2\in\mathbb R^{n_v\times d}$, with $W_1\in\mathbb R^{d_v\times d_b}$ and $W_2\in\mathbb R^{d_b\times d}$. Conditional caption or instruction training uses

$$
\begin{aligned}
\mathcal L_{\mathrm{gen}}&=-\sum_{t=1}^{n_y}m_t\log p_\theta(y_t\mid Z,q,y_{<t}),
\qquad m_t\in\{0,1\},\\
P_0&=d_vd_b+d_bd,\qquad F_0=2n_vP_0.
\end{aligned}
$$
*(Eq. 55.6)*

where $q$ is the textual context and $m_t$ declares which target positions receive supervision. The companion accounting quantities $P_0,F_0$ count the bridge's weight-matrix parameters and forward matrix-multiply FLOPs per example, omitting biases and activation work and counting multiply-add as two operations. Counting image/prompt tokens in the loss denominator while masking their losses changes loss normalization and effective weighting across examples. A reproducible recipe records both the mask and whether normalization is per token or per example.

[PAPER-REPORTED] LeVLJEPA provides a 2026 alternative to pairwise negative-based learning: both modalities predict detached targets through separate predictors, with distributional regularization on the modality embeddings [R55.2, Sec. 3]. In book notation its cross-modal term is

$$
\mathcal L_{\mathrm{pred}}=\frac1B\sum_i\left(
\|h_v(z_i^v)-\operatorname{sg}(z_i^t)\|_2^2+
\|h_t(z_i^t)-\operatorname{sg}(z_i^v)\|_2^2\right).
$$
*(Eq. 55.7)*

where $z^v,z^t$ are unnormalized training embeddings, $h_v,h_t$ are learned predictors and $\operatorname{sg}$ blocks gradients through its argument. Each encoder still receives gradients from its own prediction branch. The full loss adds modality-wise SIGReg penalties, which compare randomly projected embedding distributions with an isotropic Gaussian target. It is not a captioning objective.

[PAPER-REPORTED] Here $z^v,z^t$ are the outputs of separate modality projection MLPs, not the raw final backbone states. The source uses hidden width 2,048, GELU, BatchNorm and dropout before the shared embedding space and SIGReg. It motivates this projection because final backbone Layer Normalization obstructs its distributional objective. The cross-modal predictors sit above these embeddings; detached targets and the regularizer act on the same projected representation [R55.2, Sec. 3.2, Architecture].

[MATHEMATICALLY-DERIVED] The support issue is explicit in the affine-free, zero-epsilon LayerNorm case: each nonconstant normalized vector has zero coordinate sum and squared norm equal to its width. A full isotropic Gaussian does not have that constrained support. A learned projection changes the feasible representation family before distribution matching. This conditional explanation does not prove that a finite projection/regularizer eliminates every collapse mode.

[MATHEMATICALLY-DERIVED] Writing that mixture as $(1-\lambda_v-\lambda_t)\mathcal L_{\mathrm{pred}}+\lambda_v R(Z_v)+\lambda_t R(Z_t)$ requires $\lambda_v,\lambda_t\geq0$ and $\lambda_v+\lambda_t\leq1$ to retain nonnegative weights. Individual bounds $\lambda\in[0,1]$ alone are insufficient. Distribution matching in finitely many one-dimensional projections cannot certify full population independence or exclude every degenerate finite-sample solution. The relevant claim is the trained representation's measured behavior under the stated regularizer and readout.

```figure
{
  "id": "fig-55.6",
  "kind": "tensor-flow",
  "title": "Projector changes width while retaining positions",
  "caption": "An analytical two-layer pointwise bridge retains B and the visual-position axis Nv. A resampler changes the position axis and needs a separate evidence-preservation test; neither width agreement nor shape validity proves semantic adequacy.",
  "placement": "inline",
  "anchor": "formulation",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-55.6",
  "alt": "An analytical two-layer pointwise bridge retains B and the visual-position axis Nv. A resampler changes the position axis and needs a separate evidence-preservation test; neither width agreement nor shape validity proves semantic adequacy.",
  "spec": {
    "dims": {
      "B": "batch",
      "Nv": "visual positions",
      "Dv": "encoder width",
      "Db": "bridge hidden width",
      "D": "decoder width"
    },
    "steps": [
      {
        "shape": "[B, Nv, Dv]",
        "label": "Encoder states"
      },
      {
        "shape": "[B, Nv, Db]",
        "op": "Linear plus GELU",
        "cost": "2 B Nv Dv Db forward FLOPs"
      },
      {
        "shape": "[B, Nv, D]",
        "op": "Linear projection",
        "cost": "2 B Nv Db D forward FLOPs"
      }
    ]
  }
}
```


## Mechanism

### Methodology

[DERIVED] A pointwise projector changes feature dimension while keeping the number and provenance of visual positions. It cannot exchange information between patches unless the encoder already did so. A resampler instead uses $r$ learned or query-conditioned slots to attend to $n_v$ states; it reduces the interface length while potentially mixing evidence from many locations. Spatial attribution must survive as explicit metadata or be reconstructed and checked. Increasing $r$ changes capacity and decoder cost together, so a comparison must either match emitted tokens or report the quality-cost frontier.

[MATHEMATICALLY-DERIVED] For one cross-attention head, a slot or text state $U\in\mathbb R^{n_q\times d}$ reads visual states through

$$
C=\operatorname{softmax}\left(\frac{(UW_Q)(VW_K)^\top}{\sqrt{d_h}}+M\right)VW_V.
$$
*(Eq. 55.8)*

where $M$ masks unavailable image positions, projected queries/keys have width $d_h$, and the output is subsequently projected into the residual stream. Each evaluated query needs at least one allowed visual key: an all-masked row does not define this softmax. An empty eligible visual set must select a declared image-free or abstention path before evaluation. A fixed resampler has $n_q=r$ and runs before decoding; decoder cross-attention has current text states as queries and recurs at selected layers. Concatenating $Z$ into a causal prefix instead makes its states part of the decoder's self-attention history. These constructions differ in masks, position dependence, parameter initialization, cache state and which weights receive supervision; identical output width does not make them interchangeable.

[DERIVED] Frozen-backbone training limits adaptation to the bridge and any added modules. It reduces trainable parameter/optimizer storage, but gradients may still need to propagate through frozen decoder operations to earlier trainable states. `requires_grad=False` does not make a path equivalent to `no_grad()`: the latter can sever the bridge's gradient. Joint adaptation can change the representation to suit the task, but demands retention tests on the prior task distribution. A staged choice should specify what capability is intentionally transferred and what degradation is acceptable before selecting checkpoints.

[PAPER-REPORTED] LeVLJEPA's controlled study uses ViT-B/16, a GPT-2 text encoder, the same samples-seen budget and a fixed large-scale DataComp configuration; its appendix specifies global batch 4,096 and cross-device gathering for the regularizer [R55.2, Secs. 4-6, Appendix A]. Consequently, absence of a $B\times B$ negative matrix does not imply absence of batch communication. The study also freezes both the chosen visual encoder and downstream language model while training the visual bridge, allowing the readout question to be tested separately.

```figure
{
  "id": "fig-55.7",
  "kind": "compare",
  "title": "Fusion choices preserve different interfaces",
  "caption": "Compare under the same answer/evidence target and information budget. Projectors preserve positions, resamplers compress them, and decoder cross-attention retains a separate read path. This is an interface comparison, not a performance ranking.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-55.8",
  "alt": "Compare under the same answer/evidence target and information budget. Projectors preserve positions, resamplers compress them, and decoder cross-attention retains a separate read path. This is an interface comparison, not a performance ranking.",
  "spec": {
    "axis": "Interface property at matched source evidence and downstream acceptance",
    "columns": [
      {
        "id": "project",
        "label": "Pointwise bridge"
      },
      {
        "id": "resample",
        "label": "Fixed-slot resampler"
      },
      {
        "id": "cross",
        "label": "Decoder cross-attention"
      }
    ],
    "rows": [
      {
        "dimension": "Position count",
        "values": {
          "project": "Nv retained",
          "resample": "r slots, with r chosen",
          "cross": "Nv separate visual states"
        }
      },
      {
        "dimension": "Interaction location",
        "values": {
          "project": "Within encoder; bridge is pointwise",
          "resample": "Slots query visual states before decode",
          "cross": "Text states query visual states at selected layers"
        }
      },
      {
        "dimension": "Controlling obligation",
        "values": {
          "project": "Features already expose needed detail",
          "resample": "Compressed slots preserve required distinctions",
          "cross": "State lifetime, masks and recurrent read cost"
        }
      }
    ]
  }
}
```


## Algorithm

### Algorithm 55.2 — One auditable multimodal optimization step

[DERIVED] Inputs are a finite paired batch, declared loss/mask, trainable-parameter set $\Theta_T$, optimizer state and finite step budget. Output is an updated state or a rejected step. This book procedure applies to the selected objective; it does not mix the objectives without declaring their weights.

$$
\begin{aligned}
1.&\quad \text{validate image/text pairing, target masks, split membership and nonempty supervised support}.\\
2.&\quad V\leftarrow E_v(I);\quad Z\leftarrow A(V);\quad \ell\leftarrow\operatorname{SelectedLoss}(V,Z,T,q,y,m).\\
3.&\quad \ell\notin\mathbb R_{\mathrm{finite}}\Rightarrow\text{reject step and preserve last accepted state}.\\
4.&\quad g\leftarrow\nabla_{\Theta_T}\ell;\quad\text{verify nonempty intended gradient paths and finite }g.\\
5.&\quad (\Theta_T',s')\leftarrow\operatorname{Optimizer}(\Theta_T,s,g);\quad\text{commit only a valid finite state}.\\
6.&\quad \text{record objective denominator, realized tokens, communication and checkpoint digest; consume one attempt}.
\end{aligned}
$$

[DERIVED] The optimizer candidate is private until the finite-state check succeeds; an in-place implementation requires an explicit restore path for rejected updates. This may require additional state storage. The invariant is that frozen parameters and target-only branches are not updated, while every intended trainable branch receives a defined signal. Attempts remain bounded even after rejected steps. Checkpoint selection uses held-out development criteria; the final test does not enter the update loop. A valid gradient is necessary for this algorithm, not sufficient for scientific usefulness.

## Implementation

[MATHEMATICALLY-DERIVED] Ignoring biases, the bridge has $d_vd_b+d_bd$ parameters and costs approximately $2n_v(d_vd_b+d_bd)$ forward FLOPs under the multiply-add convention of the shared notation. Pair scoring costs $O(B^2d)$ arithmetic and $O(B^2)$ stored scores if materialized; fixed-count projected distribution tests can avoid that matrix but retain encoder, projection and collective costs. Exact SIGReg work depends on the number of projection directions and quadrature samples. Those values must be recorded rather than hidden inside a claim of linear complexity.

[MATHEMATICALLY-DERIVED] One dense cross-attention operation costs $O(n_qn_vd)$ interaction work plus projections. A resampler can reduce subsequent prefix length from $n_v$ to $r$ but first pays this interaction. If a dense decoder processes a prefix of $n_t+r$ tokens, its attention interaction term scales quadratically in that combined length; generation also rereads retained state. Parameter storage, optimizer moments, saved activations, encoder traffic and distributed embedding gathers are distinct quantities. Lower pair-scoring memory does not by itself establish lower total training energy or cost.

[UNVERIFIED] The book has not executed LeVLJEPA or a bridge training run. Its reported PyTorch/H100 setup does not establish compatibility with a current local package installation. Pin processor, augmentation, checkpoint, pooling token, projection normalization, distributed gather gradient behavior, bridge mask and optimizer groups before reproducing. The absence of a momentum target encoder must not be generalized into the absence of all target-path state or distributed synchronization.

```figure
{
  "id": "fig-55.8",
  "kind": "calculator",
  "title": "Bridge parameter and forward-work budget",
  "caption": "Illustrative bias-free two-layer bridge, per example. Parameters equal DvDb+DbD; forward matrix-multiply FLOPs count multiply-add as two operations. Activation, optimizer, encoder and decoder costs are excluded and must be added separately.",
  "placement": "rail",
  "anchor": "implementation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-55.6",
  "alt": "Illustrative bias-free two-layer bridge. Parameters equal DvDb+DbD; forward FLOPs count multiply-add as two operations. Activation, optimizer, encoder and decoder costs are excluded and must be added separately.",
  "spec": {
    "tex": "P_0=d_vd_b+d_bd;\\quad F_0=2n_vP_0",
    "equation": "55.6",
    "inputs": [
      {
        "symbol": "Dv",
        "label": "Encoder width",
        "default": 1024,
        "min": 128,
        "max": 4096,
        "format": "integer"
      },
      {
        "symbol": "Db",
        "label": "Bridge hidden width",
        "default": 2048,
        "min": 128,
        "max": 8192,
        "format": "integer"
      },
      {
        "symbol": "D",
        "label": "Decoder width",
        "default": 2560,
        "min": 128,
        "max": 8192,
        "format": "integer"
      },
      {
        "symbol": "Nv",
        "label": "Visual positions",
        "default": 1024,
        "min": 64,
        "max": 16384,
        "format": "tokens"
      }
    ],
    "outputs": [
      {
        "symbol": "params",
        "label": "Bridge parameters",
        "formula": "Dv*Db+Db*D",
        "format": "params"
      },
      {
        "symbol": "flops",
        "label": "Forward bridge FLOPs per example",
        "formula": "2*Nv*(Dv*Db+Db*D)",
        "format": "flops"
      }
    ]
  }
}
```


## Experimental design

### Reported experiments

[PAPER-REPORTED] LeVLJEPA compares negative-based objectives with its prediction objective on global classification/retrieval, frozen linear segmentation and bridge-trained VQA. The VQA experiment uses Llama and Qwen backends and reports variability over three bridge seeds [R55.2, Tables 1-6]. These seeds do not establish independent pretraining-run uncertainty. Equal samples seen controls exposure count, while exact objective FLOPs, successful downloads and downstream optimization remain additional comparability conditions.

## Observations

**What the paper claims.** [PAPER-REPORTED] The source motivates negative-free pretraining for dense downstream use. Its Table 1 also reports lower ImageNet zero-shot accuracy for LeVLJEPA than the listed InfoNCE and SigLIP baselines: 42.45 versus 47.32 and 50.78 [R55.2].

**What the evidence shows.** [PAPER-REPORTED] Table 4 favors its dense segmentation readout. Table 6 also favors LeVLJEPA on the displayed frozen-bridge tasks: Qwen VQAv2 is 54.1 versus InfoNCE's 49.4, and Llama VQAv2 is 54.2 versus 51.6 [R55.2, Tables 4 and 6]. The corresponding reported standard deviations are 0.7/0.4 and 1.4/0.4 over three bridge seeds. These positive task results coexist with the zero-shot negative above; they do not establish transfer to untested encoders or decoders.

**What we infer.** [DERIVED] Objective, spatial representation and decoder readout interact. A global alignment ranking cannot substitute for evaluating the actual bridge/decoder pair. More favorable segmentation does not imply better zero-shot similarity or VQA under every language model.

**What remains unknown.** [NOT-DISCLOSED] Transfer beyond the reported encoder scale, complete independent pretraining-seed variation, deployment energy and matched total compute across objectives remain unresolved by these comparisons.

## Failure modes

> **Failure mode - Detached trainable interface.** [DERIVED] *Symptom:* a bridge's parameters do not change despite falling decoder loss elsewhere. *Cause:* a frozen module was wrapped in `no_grad()` across a required gradient path. *Detection:* inspect bridge gradients and a controlled single-step parameter difference. *Mitigation:* freeze parameters without severing the required computational graph.

> **Failure mode - Collapsed or misleading alignment.** [DERIVED] *Symptom:* a prediction objective becomes small while embeddings cease to distinguish inputs, or retrieval looks strong while relation probes fail. *Cause:* an underconstrained distribution or pooled readout. *Detection:* inspect covariance, per-example variability and task-specific held-out probes. *Mitigation:* restore a justified regularizer/readout and test its ablations; normalization alone is not a collapse proof.

## Siblings

[DERIVED] Prefer a pointwise bridge when existing spatial features already satisfy the task and the emitted-token budget is feasible. A resampler is admissible when its compression survives the evidence tests in Sec. 55.5. Decoder cross-attention or SCVER changes where evidence can be read and requires a corresponding runtime. Frozen versus joint adaptation is decided by target improvement and tolerated retention loss, with identical downstream information and training budget. A stronger matched-budget result or a failed gradient/representation test reverses the preference. The next discriminating evidence is an encoder-frozen, bridge-swapped comparison, followed by joint adaptation only if the frozen representation remains inadequate.

## Extensions

### Improvements

[DERIVED] A useful improvement changes a demonstrated obstruction: a spatially richer encoder supplies missing distinctions; a resampler reallocates limited slots; a decoder-side evidence module changes access; better supervision changes which distinctions optimization rewards. Sec. 55.1 owns SCVER's added access path; Sec. 55.3 examines phrase-sensitive selection and grounded instructions. Applying every change simultaneously leaves attribution unresolved. A factorial or staged ablation should preserve the comparator whenever possible.

## Limitations

[DERIVED] The equations specify objective and interface behavior under their declared shapes. They do not prove semantic alignment, lossless compression or generalization from finite benchmarks. The current evidence supports task-conditioned design, with explicit negative results, rather than a universal encoder objective. Investigation stops at that bounded comparison until broader scale, independent training replications or a changed deployment target justify reopening it.

## Reproducibility

[DERIVED] Save data identities and failed downloads, image/text augmentations, target masks and denominators, trainable parameter names, optimizer state, gather semantics, processor digest, bridge dimensions and downstream seeds. Distinguish encoder pretraining from bridge adaptation in every resource record. All book experiments remain proposed in [verification](verification.md).

## References

[R55.2](references.md#r55-2), method, Tables 1-6 and Appendix A. Foundations: Chapter 18 for fusion primitives and [Chapter 31](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/README.md) for supervised adaptation.
