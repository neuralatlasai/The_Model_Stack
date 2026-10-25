---
id: ms.section.58.3
entity_type: section
title: "Conditioning"
volume: 3
part: 10
chapter: 58
section: 58.3
slug: 58-3-conditioning
parent: ms.chapter.58
prev_sibling: ms.section.58.2
next_sibling: ms.section.58.4
children: []
prerequisites:
  [
    ms.chapter.4,
    ms.chapter.18,
    ms.chapter.25,
    ms.chapter.26,
    ms.chapter.27,
    ms.chapter.28,
    ms.chapter.37,
    ms.chapter.38,
    ms.chapter.39,
    ms.chapter.40,
    ms.chapter.41,
    ms.chapter.55,
    ms.chapter.56,
    ms.chapter.57,
  ]
downstream: [ms.chapter.59, ms.chapter.60]
related: [ms.chapter.42, ms.chapter.48, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [pretraining, inference, evaluation],
    mechanism: [multimodal_generation, predictive_representation, control],
    feedback_setting: [],
    modality: [image, text, audio, video],
  }
papers: []
implementations: [impl.pytorch]
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
        OFFICIAL-DOCUMENTATION,
        ASSUMED,
        NOT-DISCLOSED,
        UNVERIFIED,
      ],
    empirically_observed: false,
  }
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 58.3 Conditioning

## Scope

[DERIVED] Conditioning specifies which observations and controls may influence a generated variable, at which spatial or physical time coordinates, and through which model interface. This section covers text, reference images, spatial masks/geometry, audio and video features. It distinguishes soft learned control from a hard output constraint and cross-attention from joint attention. The acceptance rule includes instruction adherence, preservation of specified source regions, synchronization and admissible information access. Prompt faithfulness is not established by marginal image/audio quality.

## Why this exists

[DERIVED] A model cannot satisfy an ambiguous instruction by recovering information that was never supplied. A pooled reference embedding can preserve object identity while discarding a local layout or event timestamp. A condition can also be too informative: training on a target image as its own condition can create an identity shortcut that disappears at text-only deployment. The engineering problem is therefore both sufficiency and admissibility. A richer interface is useful only if its added information is available when the output decision is made.

## Intuition

[DERIVED] Conditioning has two independent axes. Content determines what is supplied: words, pixels, coordinates, past waveform or time-indexed frames. Coupling determines how it acts: normalization modulation, attention keys/values, concatenated target/reference blocks, or explicit projection onto a constraint set. A "multimodal prompt" does not specify coupling. A "dynamic condition" does not by itself say whether the index is denoising time or physical media time.

## Formulation

[MATHEMATICALLY-DERIVED] Let $z_u\in\mathbb R^{n_q\times d}$ be generated state at denoising coordinate $u$, and $c\in\mathbb R^{n_c\times d_c}$ the admissible condition. One cross-attention head is

$$
A(z_u,c)=
\operatorname{softmax}\!\left(
\frac{(z_uW_Q)(cW_K)^\top}{\sqrt{d_h}}+M
\right)cW_V .
$$

_(Eq. 58.9)_

[MATHEMATICALLY-DERIVED] The mask $M$ is zero for allowed pairs and minus infinity for forbidden pairs, with at least one valid key for every active query. Its pair interaction count is $n_qn_c$, while dense joint attention on concatenated states has $(n_q+n_c)^2$ pairs. These counts omit projection/MLP cost and assume a dense algorithm. Fused attention can avoid storing the full score array without removing the arithmetic dependency.

[DERIVED] Reusing condition keys/values across denoising evaluations is exact only if their producers are independent of the changing target state, denoising time and all other changed inputs. Joint attention that updates reference tokens using target states usually violates that condition at later layers. A clean chunk-causal prefix can remain reusable when its own attention path excludes current/future targets; a bidirectional multimodal sequence may not.

[MATHEMATICALLY-DERIVED] For physical time $r$, a causal availability relation can be defined independently of $u$:

$$
M_{ij}^{\rm time}=
\begin{cases}
0,&a_j^{\rm available}\le r_i^{\rm decision}
\ \text{and }(i,j)\text{ is permitted by the task},\\
-\infty,&\text{otherwise}.
\end{cases}
$$

_(Eq. 58.10)_

[DERIVED] Availability is not the same as a frame's presentation timestamp. Offline generation may use the full clip; a streaming claim must state its lookahead. Both are legitimate tasks with different information regimes. [Chapter 57](../ch57-video-temporal-reasoning-and-streaming-multimodality/README.md) owns media clocks and temporal evidence. Denoising coordinate $u$ is an algorithmic state, not elapsed real time and not frame index.

[MATHEMATICALLY-DERIVED] For a known-region mask $K\in\{0,1\}^{H\times W}$ and source image $X_{\rm src}$, strict final preservation means

$$
K\odot(\widehat X-X_{\rm src})=0,\qquad
\Pi_K(U)=K\odot X_{\rm src}+(1-K)\odot U.
$$

_(Eq. 58.11)_

[DERIVED] Projection satisfies the displayed pixel equality by construction, after declaring pixel coordinates, color space and rounding. It does not ensure seam quality or instruction success. Applying clean source pixels directly to an intermediate noisy latent is generally not this same operation; a latent consistency rule needs a compatible encoder/noise model. A learned edit-preservation reward is a soft preference and cannot claim Eq.58.11's exact constraint.

```figure
{
  "id": "fig-58.9",
  "kind": "calculator",
  "title": "Cross-attention and joint pair counts",
  "caption": "Analytical dense pair counts per head: cross-attention uses target by condition pairs; joint attention updates the concatenated sequence. Projection, MLP, batching and sparse masks are excluded.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-58.9",
  "alt": "Analytical dense pair counts per head: cross-attention uses target by condition pairs; joint attention updates the concatenated sequence. Projection, MLP, batching and sparse masks are excluded.",
  "spec": {
    "equation": "58.9",
    "tex": "P_{\\rm cross}=n_qn_c,\\quad P_{\\rm joint}=(n_q+n_c)^2",
    "inputs": [
      {
        "symbol": "nq",
        "label": "target positions",
        "default": 1024,
        "min": 1,
        "max": 32768,
        "format": "integer"
      },
      {
        "symbol": "nc",
        "label": "condition positions",
        "default": 256,
        "min": 1,
        "max": 32768,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "pc",
        "label": "cross pairs",
        "formula": "nq*nc",
        "format": "integer"
      },
      {
        "symbol": "pj",
        "label": "joint pairs",
        "formula": "(nq+nc)^2",
        "format": "integer"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] Multimodal Flow uses ordered image and text hyperchunks, shared attention and modality-specific feed-forward networks [R58.2, Sec.2]. Clean prefix chunks condition the current corrupted target; its own clean counterpart and future chunks are hidden during parallel training. Thus the model's shared objective does not imply unrestricted joint visibility. The spatial grid, text order, chunk order and sample isolation are all part of the conditioning contract.

[PAPER-REPORTED] IOMM addresses a separate conditioning shortcut [R58.4, Sec.3]. A frozen multimodal model supplies image-derived semantic conditions during image-only generative pretraining. A residual query adapter refines the condition and random image-token masking prevents complete target exposure. A subsequent mixed image-only/text-image stage supplies text alignment. Its "image-only" claim refers to the expensive stage, not elimination of paired data or inherited pretrained representations from the whole pipeline.

[DERIVED] Reducing a shortcut does not prove it is absent. If masked features remain recoverable from leaked target metadata, deterministic ordering or unmasked duplicates, a model can still avoid learning the intended conditional distribution. A valid test removes the forbidden path while holding legitimate information fixed. An image oracle and a text prompt are incomparable conditions unless the aim explicitly measures the value of additional information.

[PAPER-REPORTED] Foley-Flow is a current video-to-audio conditioning case [R58.5, Secs.3-4]. Masked audio features are reconstructed using remaining audio and corresponding video features; the proposed generator uses time-varying video conditions rather than only a global clip embedding. This motivates separate semantic and rhythmic alignment checks. The report's normalizing-flow language is not enough to reconstruct a complete tractable-likelihood model or a numerical sampler: inspected equations do not disclose all transition/conditioning details.

[DERIVED] Spatial control has a corresponding alignment problem. Reference boxes, poses and masks require a declared source coordinate system and transform into model coordinates. Cropping can move or remove the requested object; source and output resolutions may differ. Preserve transforms through patchification and decoding and evaluate the requested spatial relation in the declared final coordinates. For 3D controls, units, camera convention, depth direction and occlusion handling are required; this chapter does not infer an undocumented geometry encoder.

[DERIVED] A control path is useful when it produces the needed constraint while meeting the resource limit. Cross-attention can preserve a reusable condition stream; joint attention enables reciprocal interaction at potentially higher repeated cost. Either can ignore a condition. Test interventions on that input and inspect output sensitivity, not attention magnitude alone.

```figure
{
  "id": "fig-58.10",
  "kind": "diagram",
  "title": "Two clocks and one admissibility gate",
  "caption": "Physical media time controls evidence availability; denoising time controls iterative generation. The condition is admitted only under the task's declared lookahead, then aligned to generated coordinates.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-58.10",
  "alt": "Physical media time controls evidence availability; denoising time controls iterative generation. The condition is admitted only under the task's declared lookahead, then aligned to generated coordinates.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "media",
        "kind": "dataset",
        "label": "Physical-time media"
      },
      {
        "id": "gate",
        "kind": "boundary",
        "label": "Availability and lookahead"
      },
      {
        "id": "align",
        "kind": "process",
        "label": "Spatial and temporal alignment"
      },
      {
        "id": "noise",
        "kind": "state",
        "label": "Denoising coordinate u"
      },
      {
        "id": "gen",
        "kind": "model",
        "label": "Conditional generator"
      },
      {
        "id": "check",
        "kind": "metric",
        "label": "Control and synchronization"
      }
    ],
    "edges": [
      {
        "from": "media",
        "to": "gate",
        "kind": "flow"
      },
      {
        "from": "gate",
        "to": "align",
        "kind": "flow"
      },
      {
        "from": "align",
        "to": "gen",
        "kind": "dependency"
      },
      {
        "from": "noise",
        "to": "gen",
        "kind": "dependency"
      },
      {
        "from": "gen",
        "to": "check",
        "kind": "flow"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 58.3 — Construct and validate a condition contract

[DERIVED] Inputs are a finite set of condition records, task information regime, output coordinates, pinned processors and deadline. Records carry source hash, modality, presentation/availability times, transforms and authorization scope.

$$
\begin{aligned}
&\textbf{for each }c_j\text{ in the finite input set}:\\
&\quad \text{reject or mark unavailable if access, time or shape is invalid;}\\
&\quad \text{apply the pinned transform and retain its inverse/domain;}\\
&\quad \text{construct allowed query-key pairs from task visibility;}\\
&\text{validate every active query has an admissible key or explicit null path;}\\
&\text{freeze reusable states only if their dependency closure is unchanged;}\\
&\text{generate within the bounded solver/deadline contract;}\\
&\text{check control, preservation and timing; return accepted or failed/incomplete.}
\end{aligned}
$$

[DERIVED] Invariant: every admitted feature retains source identity and availability metadata. A deadline ends processing with incomplete status; it does not authorize inventing a missing condition. Constructing dense masks costs $O(n_qn_c)$ memory unless represented structurally. Feature extraction, transforms and any cross-device transfer are included in latency and memory accounting.

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch (#17, MODEL / AUTOGRAD FRAMEWORK) supplies the tensor/autograd substrate of the inspected originating source paths [R58.11, R58.12]. Dependency inspection does not establish runtime execution.

[DERIVED] Define independent axes for sample, denoising coordinate, media time, channel and spatial position. Do not broadcast one scalar denoising index into a physical-time alignment silently. Null conditions used in training must match the sampler's unconditional branch. For source edits, distinguish preserved conditioning pixels from regenerated outputs; retaining a source token during an unresolved discrete round is not final pixel preservation.

[DERIVED] Foley-Flow's disclosed preprocessing has a material gap [R58.5, Sec.4.1]. Ten seconds at 8kHz contain 80,000 samples; a 50ms window and 25ms hop correspond to 400 and 200 samples. Without padding, the standard frame count is $1+\lfloor(80000-400)/200\rfloor=399$, not the reported 128 temporal bins. Padding conventions change this slightly, not to 128. An undisclosed resampling/cropping transform may explain the difference; do not invent it or present the description as executable.

[DERIVED] Interface cost includes processor/encoder work, condition state storage, repeated attention and decoder output. A frozen encoder consumes compute despite having no optimizer state. A cached condition can save repeated projections while adding persistent HBM and invalidation bookkeeping. Communication depends on where features are produced and consumed; energy/money cannot be inferred from token count.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Foley-Flow reports VGGSound comparisons using KLD, FAD and alignment accuracy; Table 1 reports 0.97, 0.52 and 98.97 respectively [R58.5]. Its setup specifies 224-square video inputs, 100 training epochs, Adam and batch 128. The preprocessing inconsistency, undisclosed hardware/dtype/solver details and absent uncertainty prevent treating the table as a reproducible deployment result. Distributional audio quality and temporal alignment remain different axes.

[PAPER-REPORTED] IOMM Table 2 supplies a negative control: image-only finetuning of an existing Qwen-Image configuration at 512 pixels reduces reported GenEval from 0.85 to 0.42, while mixed finetuning reaches 0.89 [R58.4]. This is a source-reported configured comparison, not a universal penalty for image-only pretraining. It motivates retaining the distinction between learning a visual prior and preserving text-conditioned behavior.

## Observations

**What the papers claim.** [PAPER-REPORTED] Current approaches use structured chunks, masked image conditions or temporal video features to improve conditional generation [R58.2, R58.4, R58.5].

**What the evidence shows.** [PAPER-REPORTED] Their experiments evaluate different information regimes and consumers. Image-only adaptation can damage text-conditioned performance; global feature quality does not subsume temporal synchronization.

**What we infer.** [DERIVED] Input sufficiency, admissibility and coupling should be audited separately. A feature interface can improve one while worsening another.

**What remains unknown.** [NOT-DISCLOSED] A reconstructable Foley-Flow temporal preprocessing/sampling recipe and common resource-normalized comparison across these systems remain unavailable in the inspected texts.

## Failure modes

[DERIVED] Include contradictory text/reference conditions, empty/null inputs, offscreen objects, transformed masks, delayed media, changed lookahead, duplicate targets and variable audio/video frame rates. A semantic match with wrong event timing fails synchronization. A preserved background with an unperformed edit fails control. Report failures per constraint instead of allowing one averaged score to cancel another.

```figure
{
  "id": "fig-58.11",
  "kind": "compare",
  "title": "Soft control and exact output preservation",
  "caption": "A soft model preference and a deterministic final projection establish different properties. Neither alone establishes a successful edit.",
  "placement": "inline",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-58.11",
  "alt": "A soft model preference and a deterministic final projection establish different properties. Neither alone establishes a successful edit.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "soft",
        "label": "Learned condition/reward"
      },
      {
        "id": "hard",
        "label": "Final pixel projection"
      }
    ],
    "rows": [
      {
        "dimension": "Established property",
        "values": {
          "soft": "A learned preference, if evaluated",
          "hard": "Known pixels equal source by construction"
        }
      },
      {
        "dimension": "Possible failure",
        "values": {
          "soft": "Requested region changes incorrectly",
          "hard": "Seams or failed semantic edit"
        }
      },
      {
        "dimension": "Required next check",
        "values": {
          "soft": "Constraint-wise intervention test",
          "hard": "Boundary and requested-edit quality"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] [58.2](58-2-objectives.md) fixes the learned target; [58.4](58-4-sampling-and-acceleration.md) examines guidance and repeated evaluation; [58.6](58-6-evaluation-and-systems.md) evaluates complete release policies. Chapters 55-57 own perception, audio interfaces and temporal evidence; [Chapter 60](../ch60-vision-language-action-policies-and-embodied-learning/README.md) adds physical action coordinates and deadlines.

## Extensions

### Improvements and their evidence

[DERIVED] Prefer a condition mechanism when intervention tests establish dependence on the required input and the complete pipeline meets control/timing constraints. Reverse the choice when an equally informed, lower-cost mechanism preserves more constraints, when alignment is invalid, or when useful gains depend on unavailable future/target evidence. A null-condition ablation can identify dependence; it cannot alone establish correct grounding.

## Limitations

[DERIVED] A learned attention map is not a guarantee of control. The exact projection in Eq.58.11 establishes only its stated equality. No source here proves hard physical constraints or arbitrary any-to-any generation, and incomplete disclosure is not evidence that an unspecified component works.

## Reproducibility

[UNVERIFIED] No conditional model was executed. Store input/condition hashes, processors, transforms, masks, null path, lookahead, cache dependencies, sampler and per-constraint outcomes. Keep the Foley preprocessing ambiguity unresolved until a pinned implementation or author clarification supplies the missing operation.

## References

[R58.2] Multimodal Flow v1, Sec.2. [R58.4] IOMM v1, Secs.3-4, Table 2. [R58.5] Foley-Flow v1, Secs.3-4. See the [ledger](references.md).
