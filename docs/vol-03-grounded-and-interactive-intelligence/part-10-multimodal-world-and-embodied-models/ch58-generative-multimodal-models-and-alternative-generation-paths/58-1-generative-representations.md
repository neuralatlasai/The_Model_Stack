---
id: ms.section.58.1
entity_type: section
title: "Generative representations"
volume: 3
part: 10
chapter: 58
section: 58.1
slug: 58-1-generative-representations
parent: ms.chapter.58
prev_sibling: null
next_sibling: ms.section.58.2
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

# 58.1 Generative representations

## Scope

[DERIVED] A generative representation connects an observed signal to a distribution that a generator can learn. This section compares raw pixels, spatial patches, continuous autoencoder latents, discrete visual codes and audio codec frames. Its acceptance rule is preservation of the distinctions required by the output task within a declared training and execution budget. The encoder, generator and decoder must be evaluated together; a short latent sequence establishes neither reconstruction quality nor lower end-to-end cost. Architectural fusion belongs to [Chapter 18](../../../vol-01-learning-and-representation/part-03-model-architectures-and-state/ch18-multimodal-architectural-primitives/README.md); perceptual input geometry belongs to [Chapter 55](../ch55-vision-language-models-and-document-intelligence/README.md).

## Why this exists

[DERIVED] Representation loss occurs before sampling. If two source images map to the same code and the conditioning contains no distinguishing information, a generator cannot recover which original was intended. A stochastic decoder may produce plausible alternatives, but plausibility does not restore source identity. Retaining more detail increases sequence length, activation traffic and the positions updated at every denoising evaluation. The useful question is which detail this consumer can discard, with which measurable consequences.

## Intuition

> **Definition — Generative codec boundary.** [DERIVED] The encoder-state-decoder contract, including its information loss and complete resource cost.

[DERIVED] A patch projection groups coordinates without necessarily creating a probabilistic latent model. A variational tokenizer additionally samples a posterior and regularizes it toward a prior. A vector quantizer replaces an encoded vector with an index into a finite alphabet. These operations have different failure modes: dimensional bottlenecks, posterior collapse and quantization/code utilization, respectively. Audio codecs add a temporal frame rate and often multiple codebooks; counting one frame as one token can conceal the number of predicted categorical symbols.

## Formulation

[MATHEMATICALLY-DERIVED] Let signal $X$ have $n_{\rm raw}$ scalar values. An encoder emits $z\in\mathbb R^{n_z\times d_z}$, decoded by $D_\psi$. For diagonal Gaussian posterior $q_\phi(z|X)=\mathcal N(\mu_\phi,\operatorname{diag}\sigma_\phi^2)$, define the analytical objective

$$
\mathcal J_{\rm AE}=
\mathbb E_X\!\left[\frac{\mathbb E_{q_\phi}\|X-D_\psi(z)\|_2^2}{n_{\rm raw}}
+\frac{\kappa}{2n_zd_z}\sum_{j=1}^{n_zd_z}
(\mu_j^2+\sigma_j^2-\log\sigma_j^2-1)\right].
$$

_(Eq. 58.1)_

[MATHEMATICALLY-DERIVED] Here $\kappa\ge0$ is local regularization strength. The displayed per-coordinate normalization is a declared analytical convention; a source that sums KL and averages pixel loss has a different effective tradeoff. Compute variance through a bounded log-variance parameterization and accumulate KL in adequate precision. Zero variance gives infinite KL; clipping changes the objective.

[MATHEMATICALLY-DERIVED] For discrete codebook $\{e_j\}_{j=1}^{V_z}\subset\mathbb R^{d_z}$, let $c_i=\arg\min_j\|h_i-e_j\|_2^2$. A representative commitment construction is

$$
\mathcal J_{\rm VQ}=\mathcal J_{\rm rec}
+\sum_i\|\operatorname{sg}(h_i)-e_{c_i}\|_2^2
+\eta_{\rm com}\sum_i\|h_i-\operatorname{sg}(e_{c_i})\|_2^2.
$$

_(Eq. 58.2)_

[DERIVED] This specifies a possible optimizer interface, not every current tokenizer. Discrete assignment has zero derivative almost everywhere; a straight-through surrogate is an estimator choice. The maximum fixed-length code payload is $n_z\lceil\log_2 V_z\rceil$ bits before headers. Continuous tensors require $n_zd_zb$ bytes at $b$ bytes/value; latent-position count does not equate those payloads.

[MATHEMATICALLY-DERIVED] Storage and the information penalty expose separate bottlenecks:

$$
M_z=B\,n_zd_zb,\qquad
\mathbb E_X\mathrm{KL}(q_\phi(z|X)\|p(z))
=I_q(X;z)+\mathrm{KL}(q_\phi(z)\|p(z)).
$$

_(Eq. 58.3)_

[MATHEMATICALLY-DERIVED] The identity uses joint distribution $p_{\rm data}(X)q_\phi(z|X)$ and finite divergences. Add and subtract $\log q_\phi(z)$ inside the integral to obtain it. KL regularization penalizes information retained about an example and mismatch of the aggregated posterior to the prior. Small average KL bounds mutual information; high KL does not prove utility for typography, geometry or control.

```figure
{
  "id": "fig-58.3",
  "kind": "calculator",
  "title": "Latent positions and stored values",
  "caption": "Analytical storage only: equal position counts can have different channel widths and bytes. Weights, codebooks, decoder activations and headers are excluded.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-58.3",
  "alt": "Analytical storage only: equal position counts can have different channel widths and bytes. Weights, codebooks, decoder activations and headers are excluded.",
  "spec": {
    "equation": "58.3",
    "tex": "M_z=B n_z d_z b",
    "inputs": [
      {
        "symbol": "B",
        "label": "examples",
        "default": 1,
        "min": 1,
        "max": 64,
        "format": "integer"
      },
      {
        "symbol": "nz",
        "label": "latent positions",
        "default": 128,
        "min": 1,
        "max": 16384,
        "format": "integer"
      },
      {
        "symbol": "dz",
        "label": "channels",
        "default": 32,
        "min": 1,
        "max": 4096,
        "format": "integer"
      },
      {
        "symbol": "b",
        "label": "bytes per value",
        "default": 2,
        "min": 1,
        "max": 8,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "Mz",
        "label": "latent storage bytes",
        "formula": "B*nz*dz*b",
        "format": "bytes"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] MacTok is a current continuous-tokenizer case [R58.1]. A ViT processes image patches concatenated with learned latent tokens; latent outputs parameterize a Gaussian representation. A decoder reconstructs from sampled latents and reconstruction tokens. Training alternates random image-patch masking and DINO-guided masking with equal probability; the latter masks patches with high class-token cosine similarity. Reconstruction, perceptual/adversarial, KL and local/global alignment losses are distinct interventions, so a final system comparison cannot isolate masking.

[MATHEMATICALLY-DERIVED] A corruption channel $\widetilde X\sim C(\cdot|X)$ changes the encoder input to $q_\phi(z|\widetilde X)$. An informative solution beats a particular collapsed comparator only if its reduction in reconstruction and auxiliary losses exceeds its added regularization cost. Masking provides no unconditional anti-collapse guarantee: if $\widetilde X$ is independent of $X$, it contains no recoverable source-specific information; sufficiently large $\kappa$ can still favor collapse. Data processing gives $I(X;z)\le I(X;\widetilde X)$.

[DERIVED] MacTok Appendix A.2 is treated as motivation, not a general proof. Its Eq.13 replaces a joint likelihood of visible and masked regions with marginal factors without an independence condition. The valid chain rule uses $p(X_{\rm masked}|X_{\rm visible})$. Its collapsed-posterior discussion also equates an expected log conditional density with a log marginal density without establishing equality. These defects narrow the theory without erasing the reported ablations.

[PAPER-REPORTED] An alternative is SenseNova-U1.5 [R58.6, Sec.3.1]: convolutional projections produce one token per $32\times32$ region, and a spatial decoder reconstructs pixels using Pixel Shuffle and convolution. Absence of an external VAE does not mean absence of a learned bottleneck. "Near-lossless" is the report's description, not a measured lossless-compression guarantee.

[MATHEMATICALLY-DERIVED] For dimensions divisible by spatial stride $p$, $n_z=HW/p^2$. Doubling both image dimensions multiplies positions by four and dense attention pairs by sixteen. Reducing positions can save attention while increasing decoder work or channel width. Encoder/decoder cost, teacher cost and latent extraction must accompany any saving.

```figure
{
  "id": "fig-58.4",
  "kind": "diagram",
  "title": "Four places detail can disappear",
  "caption": "Sampling, encoder compression, discrete assignment and reconstruction introduce distinct errors. Localize fidelity failures before changing the sampler.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-58.1",
  "alt": "Sampling, encoder compression, discrete assignment and reconstruction introduce distinct errors. Localize fidelity failures before changing the sampler.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "x",
        "kind": "dataset",
        "label": "Source signal"
      },
      {
        "id": "view",
        "kind": "process",
        "label": "Sampling and coordinates"
      },
      {
        "id": "enc",
        "kind": "model",
        "label": "Encoder bottleneck"
      },
      {
        "id": "q",
        "kind": "branch",
        "label": "Continuous or discrete state"
      },
      {
        "id": "dec",
        "kind": "model",
        "label": "Reconstruction decoder"
      },
      {
        "id": "test",
        "kind": "metric",
        "label": "Required distinctions"
      }
    ],
    "edges": [
      {
        "from": "x",
        "to": "view",
        "kind": "flow"
      },
      {
        "from": "view",
        "to": "enc",
        "kind": "flow"
      },
      {
        "from": "enc",
        "to": "q",
        "kind": "flow"
      },
      {
        "from": "q",
        "to": "dec",
        "kind": "flow"
      },
      {
        "from": "dec",
        "to": "test",
        "kind": "flow"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 58.1 — Audit a generative representation

[DERIVED] Inputs are immutable source groups, target distinctions, codec revisions, a bounded development budget and held-out acceptance rule. This is a proposed audit, not MacTok's training loop.

$$
\begin{aligned}
&\textbf{for }r=1,\ldots,R_{\max}:\\
&\quad \text{validate units, coordinate transforms and codec shapes;}\\
&\quad z\leftarrow E_r(X),\quad \widehat X\leftarrow D_r(z);\\
&\quad \text{record reconstruction, required distinctions and complete cost;}\\
&\quad \text{fit the generator on the declared training split;}\\
&\quad \text{evaluate decoded generations with frozen conditioning and sampler;}\\
&\quad \text{mark inadmissible if an acceptance constraint fails;}\\
&\textbf{return }\text{admissible Pareto set, or unresolved if none qualifies.}
\end{aligned}
$$

[DERIVED] The invariant is immutable source identity and evaluation semantics. Failed decoding, nonfinite posteriors and unsupported shapes remain failure records. Finite candidate/training budgets ensure termination, not quality. Cost comprises all codec evaluations plus generator training; peak memory and cumulative work are distinct.

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch (#17, MODEL / AUTOGRAD FRAMEWORK) supplies the tensor/autograd substrate of the inspected originating source paths [R58.11, R58.12]. Dependency inspection does not establish runtime execution.

[OFFICIAL-DOCUMENTATION] Pinned SenseNova source [R58.12] contains multiple decoder classes; presence alone does not identify the loaded checkpoint path. Its ConvDecoder applies Pixel Shuffle factors 2, 2 and 8, with channel-divisibility constraints and $3\times3$ convolutions. This is static inspection without checkpoint execution or a compatibility claim.

[MATHEMATICALLY-DERIVED] Pixel Shuffle maps $[B,cr^2,h,w]$ to $[B,c,rh,rw]$; it rearranges values. For a 4096-channel token field, factors 2, 2 and 8 restore a 32-fold spatial stride only if intermediate projections supply matching channel dimensions. A channel mismatch is an interface defect, not a tolerance issue.

[DERIVED] Persist codec hashes, normalization moments, pixel range/color order, stride, padding/crop, latent layout, posterior sampling and codebook indexing. Audio also needs sample rate, hop, codebook count and flattened prediction order; [Chapter 56](../ch56-audio-speech-and-real-time-interaction/README.md) owns codec reconstruction. Changing latent scale changes signal-to-noise ratio and therefore the learned denoising problem. Decode time and output transfers belong inside latency; energy and monetary cost remain UNVERIFIED until measured or priced under a declared boundary.

## Experimental design

### Reported experiments

[PAPER-REPORTED] MacTok evaluates ImageNet class-conditional generation, not unrestricted prompt following. Its 256-pixel default tokenizer has ViT-Base encoder/decoder, 176M parameters, 32 latent channels and 250K iterations at batch 256; its SiT-XL generator trains for 4M iterations [R58.1, Sec.4; Appendix B]. Table 1 reports 128-token SiT-XL gFID 1.44 with CFG versus 2.82 without. These are distinct operating points. Hardware, latency quantiles and independent-training uncertainty are NOT-DISCLOSED in this result context.

[DERIVED] An attribution study holds generator, exposure and sampler fixed while varying codec rate, then repeats at matched total compute. Measure text exactness, small-object/count preservation and edit consistency alongside reconstruction/generation features. Separate decoder-only gains from generator gains; low reconstruction error does not imply an easy latent distribution.

## Observations

**What the paper claims.** [PAPER-REPORTED] MacTok attributes compressed generation improvements to masking and alignment [R58.1].

**What the evidence shows.** [PAPER-REPORTED] Its reported improvements concern specified ImageNet/guidance choices; comparison rows have different codec capacities and training schedules.

**What we infer.** [DERIVED] A compact semantic latent can be useful even when reconstruction and generation metrics prefer different settings. The appendix does not prove universal collapse prevention.

**What remains unknown.** [NOT-DISCLOSED] Open-vocabulary typography robustness, exact bit-rate comparability, energy, latency distributions and independent replications are not established by those tables.

## Failure modes

[DERIVED] Test posterior independence rather than using one KL threshold as a complete detector. Detect inactive code entries and assignment instability. Construct paired sources differing only in a required feature to expose compression ambiguity. For temporal media, check event timing and future-context leakage. Scale/crop mismatches can imitate modeling failures.

## Siblings

[DERIVED] [58.2](58-2-objectives.md) compares objectives conditional on the representation; [58.5](58-5-joint-understanding-and-generation.md) tests different consumers of a shared space. Chapters 18 and 55 own fusion and discriminative alignment. [59.2](../ch59-predictive-representations-jepa-and-world-models/59-2-predictive-learning.md) studies intentionally discarding unpredictable detail for planning.

## Extensions

### Improvements and their evidence

[DERIVED] Prefer a compact codec if required distinctions survive and generator savings exceed added codec expense. Reverse the choice if matched total-cost evaluation favors a richer latent, or compression erases a required distinction. An oracle recovering missing information diagnoses the bottleneck without becoming an admissible production input.

```figure
{
  "id": "fig-58.5",
  "kind": "compare",
  "title": "Representation preference and reversal",
  "caption": "Selection depends on preserved distinctions and complete cost; neither column is universally preferable.",
  "placement": "inline",
  "anchor": "extensions",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-58.3",
  "alt": "Selection depends on preserved distinctions and complete cost; neither column is universally preferable.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "compact",
        "label": "Compact state"
      },
      {
        "id": "rich",
        "label": "Richer state"
      }
    ],
    "rows": [
      {
        "dimension": "Admissibility",
        "values": {
          "compact": "Required details survive",
          "rich": "Compact state loses required detail"
        }
      },
      {
        "dimension": "Unknown",
        "values": {
          "compact": "Difficulty of latent distribution",
          "rich": "Benefit of additional detail"
        }
      },
      {
        "dimension": "Reversal",
        "values": {
          "compact": "Decoder cost removes savings",
          "rich": "Extra detail does not improve acceptance"
        }
      }
    ]
  }
}
```

## Limitations

[DERIVED] No distortion metric proves semantic sufficiency. A finite test can falsify preservation, not certify every prompt. The derived objectives specify their premises; they do not assert that all current implementations use identical regularizers or estimators.

## Reproducibility

[UNVERIFIED] No checkpoint was executed by the book. Record source splits, codec/generator hashes, latent dimensions, loss reductions, noise convention, guidance, sample count, metric revision and resource boundary. Missing transforms leave the choice unresolved.

## References

[R58.1] MacTok v1, Secs.3-4, Appendices A-C. [R58.6] SenseNova-U1.5 v1, Sec.3.1. [R58.12] Pinned decoder source. See the [ledger](references.md).
