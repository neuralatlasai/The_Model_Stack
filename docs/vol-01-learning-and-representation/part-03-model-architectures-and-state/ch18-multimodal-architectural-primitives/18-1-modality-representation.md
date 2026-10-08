---
id: ms.section.18.1
entity_type: section
title: Modality representation
short_title: Modality representation
volume: 1
part: 3
chapter: 18
section: 18.1
slug: 18-1-modality-representation
parent: ms.chapter.18
prev_sibling: null
next_sibling: ms.section.18.2
children: []
prerequisites: [ms.chapter.4, ms.chapter.10, ms.chapter.13]
downstream: [ms.chapter.19, ms.chapter.55, ms.chapter.56, ms.chapter.57, ms.chapter.58, ms.chapter.59, ms.chapter.60]
related: [ms.chapter.10, ms.chapter.13]
siblings_by_mechanism: []
relations: []
axes:
  lifecycle: [pretraining, adaptation, inference, evaluation]
  mechanism: [multimodal_interfaces]
  feedback_setting: []
  modality: [text, image, audio, video, action]
papers: [P44, P45, P47]
implementations: []
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used: [PAPER-REPORTED, DERIVED, MATHEMATICALLY-DERIVED, UNVERIFIED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 2000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 18.1 Modality representation

## Scope

A modality interface specifies what one sequence element represents, which physical coordinates it covers, how it is encoded, and what the receiving model can reconstruct or condition on. Image patches, continuous encoder features, discrete codec indices, timestamped video observations, spatial measurements, and quantized robot commands have different semantics even when their tensors share the shape $[n,d]$. This section develops their representation contracts. Encoder adaptation, fusion, objectives, and temporal synchronization are developed separately in Sections 18.2–18.5.

## Why this exists

PAPER-REPORTED · ViT linearly embeds image patches; EnCodec quantizes a learned audio representation; RT-2 serializes robot commands as vocabulary entries (R18.1, §3; R18.4, §3; R18.10, §3). These operations differ in reversibility, sampling rate, and supervision. DERIVED: naming every resulting element a token conceals those differences. A model input specification needs the source coordinates, tensor type, codebook or projection, position convention, and output interpretation alongside its sequence length.

## Intuition

MATHEMATICALLY-DERIVED: the receiving network operates on the interface output, not on information discarded before that output. For deterministic preprocessing $z=E(x)$, two observations satisfying $E(x_1)=E(x_2)$ induce identical downstream conditional distributions when the remaining context and model state coincide. Increasing decoder size cannot distinguish these two inputs through this interface. This is a statement about a particular map and context; it does not assert that ordinary images or sounds necessarily collide, or measure which distinctions matter for a task.

## Formulation

Define a representation record

$$
\mathcal I_m=(\mathcal X_m,E_m,\mathcal Z_m,\Omega_m,\rho_m,\nu_m), \tag{18.1}
$$

where $\mathcal X_m$ is the source domain, $E_m$ the exact preprocessing/encoding map, $\mathcal Z_m$ the output domain, $\Omega_m$ the coordinate and support metadata, $\rho_m$ the order and position convention, and $\nu_m$ the versioned parameters, normalization, and decoding convention. This is a book-defined accounting object, not a standardized format. A discrete index $k\in\{0,\ldots,K-1\}$ and a continuous vector $z\in\mathbb R^d$ require different $\mathcal Z_m$, even if an embedding lookup subsequently maps the index to $\mathbb R^d$.

MATHEMATICALLY-DERIVED: for an image with height $H$, width $W$, and $C$ channels, assume nonoverlapping square patches of side $P$ and exact divisibility. Patchification alone is a permutation/reshape into $N=HW/P^2$ vectors of dimension $P^2C$. With projection $A\in\mathbb R^{P^2C\times d}$,

$$
Z_j=\operatorname{vec}(X_j)A+b,\qquad Z\in\mathbb R^{N\times d}. \tag{18.2}
$$

The patch partition itself retains every pixel under these conditions. The linear projection is injective on all patch vectors only if $\operatorname{rank}(A)=P^2C$, requiring $d\geq P^2C$. When this condition fails, a nonzero vector in the left nullspace yields indistinguishable patches. This algebraic condition says nothing about invariance or usefulness on a restricted image distribution. A convolution with kernel and stride $P$, no overlap, and matching weights implements the same projection. Cropping, resizing, padding, and color transforms are additional maps whose effects belong in $E_m$.

| Representation | Sequence element | Coordinates that must remain interpretable | Distinction preserved in the contract |
|---|---|---|---|
| Image patch embedding | projected pixel block | row/column, crop/scale, valid area | patch width and embedding width are separate |
| Continuous latent feature | encoder output vector | receptive field or latent-slot convention | no finite codebook is implied |
| Audio analysis frame | spectral/learned feature | sample rate, window support, hop | hop is not temporal resolution or latency by itself |
| Codec index | selected codeword at one residual level | frame time, codebook level, codec revision | index values have no ordered acoustic distance |
| Video token | frame patch or space-time tubelet | presentation timestamp, spatial cell, temporal support | frame order alone does not specify elapsed time |
| Spatial measurement | state/object/sensor vector | coordinate frame, units, calibration, uncertainty | normalization cannot replace a coordinate definition |
| Action symbol | command component or action-code index | actuator convention, scale, execution time | language subgoal and actuator command are different outputs |

## Mechanism

### Methodology: patches, latent sequences, and space-time support

PAPER-REPORTED · ViT adds a class embedding and learned position embeddings to projected patches before its Transformer; resolution transfer interpolates the patch-position grid (R18.1, §§3.1–3.2). DERIVED: interpolation defines a new numerical position field; it does not recover pixels removed by an earlier resize. Token count rises quadratically with spatial resolution at fixed patch size. If height and width both increase by $a$, $N$ increases by $a^2$ and the dense attention score count by $a^4$, with unchanged depth and head configuration.

MATHEMATICALLY-DERIVED: a space-time partition with temporal extent $P_t$ and spatial extent $P_h\times P_w$ gives $N=(T/P_t)(H/P_h)(W/P_w)$ under divisibility and nonoverlap. Its index must identify all three coordinates. A feature that averages or jointly projects several frames has a temporal support interval; assigning it a single timestamp is a convention, not a claim that it measures an instantaneous state. Image duplication to satisfy a video encoder's input shape creates repeated observations, not observed motion. Temporal positions and information availability are formalized in Section 18.5.

### Methodology: audio frames and residual codec indices

PAPER-REPORTED · Whisper's inspected configuration uses 16 kHz audio, 80 log-Mel channels, 25 ms analysis windows and 10 ms hops, followed by a stride-two convolutional stem (R18.3, §2.2). EnCodec's 24 kHz encoder reduces time by a factor of 320 and applies residual vector quantization (R18.4, §§3.1–3.2). These are distinct interfaces: recognition features need not provide a waveform decoder, whereas the codec is trained with an audio reconstruction path.

MATHEMATICALLY-DERIVED: an unpadded analysis of $S$ samples using window length $w$ and hop $h$ has $1+\lfloor(S-w)/h\rfloor$ complete frames when $S\geq w$. Centering, endpoint padding and resampling change this count. For a codec with latent rate $r$, $Q$ codebooks of size $K$, and fixed-width code indices, the payload rate is

$$
R_{\rm fixed}=rQ\lceil\log_2K\rceil\quad\text{bits/s}. \tag{18.3}
$$

It excludes headers, scale factors, packet framing and error protection. Substituting EnCodec's reported $r=24000/320=75$ and $K=1024$ gives $750Q$ bits/s; eight codebooks therefore account for 6 kb/s of index payload. This is an arithmetic consequence, not a measured network bitrate or an entropy-coding result.

For codebooks $\{e_{q,k}\}$, residual quantization selects $k_q$ nearest to the current residual, subtracts $e_{q,k_q}$, and reconstructs the latent as $\sum_q e_{q,k_q}$. Serializing all levels produces $QF$ symbols for $F$ frames; retaining parallel codebook tracks produces $F$ time steps with $Q$ components. These layouts can represent the same indices while inducing different autoregressive factorizations and decoding dependencies. A downstream model must declare which layout it uses. Equal payload bitrate does not imply equal Transformer token count.

### Methodology: spatial observations and action outputs

PAPER-REPORTED · PaLM-E inserts continuous state/image representations among language embeddings and produces language plans for separate low-level policies. RT-2 instead maps an eight-component robot action to discrete symbols, with continuous components uniformly discretized into 256 bins (R18.7, §§3–4, 6.3; R18.10, §3.2). DERIVED: a common embedding dimension does not make their output interfaces interchangeable. A sentence describing a subgoal requires a policy interpreter; a discretized actuator command requires component order, scaling and an execution contract.

MATHEMATICALLY-DERIVED: for an explicitly chosen nearest-center uniform quantizer over a bounded scalar range, bin width $\Delta$ implies absolute reconstruction error at most $\Delta/2$ for in-range inputs. Clipping outside the range invalidates that bound relative to the original value. This bound is for the stated quantizer, not an attribution of an undocumented RT-2 inverse convention. Coordinatewise bounds do not by themselves bound a robot trajectory: dynamics, delay, contact, controller response and rotation conventions intervene. For spatial input $p$, transformation $p'=Rp+t$ changes its numerical representation unless the interface or model explicitly accounts for the frame transformation. Omitting units or reference frames leaves physically different interpretations consistent with the same input vector.

## Algorithm

DERIVED: interface construction proceeds in a fixed dependency order. First decode the source and validate dimensions, timestamps, calibration and units. Apply the declared resampling/crop/normalization map. Construct patches, frames or state vectors with their valid supports. Run the specified encoder and select the declared output layer. Apply codebooks or projections where required. Attach coordinates, modality and missingness indicators, then serialize using the declared attention/order convention. Check count, dtype, finite values and codebook ranges before fusion. For generated actions, invert the declared code mapping and validate the command domain before scheduling execution. These steps define the artifact; they are not claims about an inspected implementation.

## Implementation

MATHEMATICALLY-DERIVED: storing $n$ continuous vectors of width $d$ at $b$ bytes per element requires $ndb$ bytes before padding and allocator overhead. A width projection requires approximately $2nd_ed_l$ floating-point operations under multiply-plus-add counting, and contains $d_ed_l+d_l$ affine parameters. Codec-index storage uses the actual integer packing; storing each 10-bit index in a 16-bit tensor consumes more memory than its coded payload. Moving encoder outputs across devices transfers their physical tensor representation, not their theoretical entropy. Encoder costs, compression costs and backbone costs therefore require separate ledgers. Kernel layouts, runtime traffic, energy and money are UNVERIFIED for a new deployment until measured; they cannot be inferred from Eq. 18.3.

## Experimental design

PAPER-REPORTED · ViT studies supervised pretraining and downstream classification across data scales; its evidence concerns transfer accuracy under those protocols, not reconstruction of every input distinction (R18.1, §4). EnCodec evaluates audio quality with objective measures and listening tests, while RT-2 evaluates robot task execution (R18.4, §4; R18.10, §4). DERIVED: those outcome axes must remain distinct. Codec fidelity does not establish semantic recognition, and action discretization alone does not establish control success. Comparisons need a target task and the complete decode/encode/inference path.

## Observations

PAPER-REPORTED · ViT's data-scale experiments show that large patch-based models underperform the compared BiT ResNets with smaller pretraining datasets, while larger-data pretraining changes that relationship (R18.1, §4.3, Figures 3–4). DERIVED: the patch interface alone therefore does not identify the observed transfer result; training exposure and adaptation remain part of the explanation.

DERIVED: representation is both a scientific and a systems choice. Increasing patch density may preserve smaller spatial distinctions but adds sequence work; increasing codec levels reduces residual quantization error only to the extent that trained codebooks and the decoder use them, while increasing payload and possibly autoregressive steps. A continuous latent is neither inherently lossless nor inherently more semantic than a discrete code. Those properties require the map, objective and evaluation evidence.

## Failure modes

DERIVED: common interface failures are an incorrect crop-to-original coordinate transform; a valid tensor carrying the wrong sample rate; a flattened codec stream with lost codebook levels; duplicated video timestamps interpreted as motion; padded samples treated as observations; and action symbols decoded with the wrong normalization or actuator frame. These failures can survive shape checks. Their prevention requires semantic invariants at the interface boundary, not only tensor dimensions.

## Siblings

Section 18.2 owns the encoder/connector training boundary; Section 18.4 owns the objectives that determine what the representation retains; Section 18.5 owns clocks and temporal support. Chapter 10 develops sequence representation, and Chapters 55–60 develop modality-specific and embodied models beyond these shared primitives.

## Extensions

### Improvements and their evidence

DERIVED: an interface improvement is task-relative. A fixed-query connector changes downstream length without changing the raw visual grid; a learned codec changes the rate–distortion trade-off without establishing language alignment; an explicit timestamp changes available temporal information without making synchronization exact. Source-supported connector and alignment improvements are examined in Sections 18.2 and 18.5. The comparison must report which distinction is preserved, which cost changes, and what evaluation detects the benefit.

## Limitations

NOT-DISCLOSED: there is no single cross-paper, matched-workload measurement of the representation choices discussed here. MATHEMATICALLY-DERIVED: rank and count bounds characterize declared maps; they do not estimate natural-data information content, task sufficiency, or actual accelerator throughput.

## Reproducibility

The chapter artifact records preprocessing, layer selection, codebook revision, coordinate supports, serialization, padding and inverse action maps. Reproducing a paper requires its corresponding weights, data and evaluation protocol as well. No encoder, codec, robot trial or book-designed interface test was executed for this manuscript.

## References

R18.1 §§3–4; R18.3 §2.2; R18.4 §§3–4; R18.7 §§3–4, 6.3; R18.10 §§3–4. Exact inspected versions and access dates are in [References](references.md).
