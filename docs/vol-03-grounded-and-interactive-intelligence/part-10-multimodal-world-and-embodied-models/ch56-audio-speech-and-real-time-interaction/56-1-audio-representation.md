---
id: ms.section.56.1
entity_type: section
title: "Audio representation"
volume: 3
part: 10
chapter: 56
section: 56.1
slug: 56-1-audio-representation
parent: ms.chapter.56
prev_sibling: null
next_sibling: ms.section.56.2
children: []
prerequisites: [ms.chapter.18, ms.chapter.31, ms.chapter.42, ms.chapter.46, ms.chapter.47]
downstream: [ms.chapter.57, ms.chapter.60, ms.chapter.61, ms.chapter.63, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [audio_streaming, temporal_alignment], feedback_setting: [], modality: [audio, text]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 56.1 Audio representation

## Scope

[DERIVED] The representation must preserve information required by the downstream task while admitting the task's temporal and resource budget. This section owns waveforms, spectrograms, learned audio features, codec tokens, sample rates, and temporal resolution. It derives their accounting without asserting that an old transform became a 2026 contribution. Newly cited research is restricted to first public contributions from 1 March through 24 October 2026. General multimodal fusion belongs to [Chapter 18](../../../vol-01-learning-and-representation/part-03-model-architectures-and-state/ch18-multimodal-architectural-primitives/README.md).

## Why this exists

[DERIVED] An audio sample clock is a physical coordinate; a language-model position is an execution coordinate. Equating them obscures two different constraints. A waveform has many samples per second because it specifies an acoustic signal. A compact feature stream can require fewer model positions because it represents only selected properties. That reduction can discard the exact timing, speaker cues, or quiet events that a later task needs. Reconstruction fidelity and suitability for question answering therefore require separate acceptance rules.

[DERIVED] Compression also has several meanings. Fewer bytes on a network link, fewer positions in a decoder, smaller embeddings, and shorter codec look-ahead are independent outcomes. A representation with fewer frames can still carry many codebooks per frame. A codec with a low transport bitrate can require expensive neural decoding. A narrow feature stream can reduce memory while retaining a long receptive field that prevents low-delay interaction. The controlling obstruction must be named before choosing the representation.

## Intuition

[DERIVED] Treat the representation as a mapping from a timestamped signal to a task-relevant state. Reducing sample precision changes amplitude quantization. Increasing the hop between features changes temporal sampling. Quantizing a learned latent changes representation capacity. Restricting future context changes information availability. These interventions need separate controls; otherwise an observed quality change cannot be assigned to one mechanism. A useful design first specifies which distinctions the output must preserve, then measures which distinctions the mapping collapses.

```figure
{
  "id": "fig-56.3",
  "kind": "diagram",
  "title": "Audio coordinates and representations",
  "caption": "Capture time, feature support, and model position are distinct coordinates. Every handoff retains its support interval.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.2",
  "alt": "A captured waveform becomes windowed features, learned features, codec indices, and optional reconstruction. The clock/support contract accompanies every representation.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "w",
        "kind": "tensor",
        "label": "Waveform: samples and channels"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "Window and spectral transform"
      },
      {
        "id": "e",
        "kind": "model",
        "label": "Learned feature encoder"
      },
      {
        "id": "q",
        "kind": "tensor",
        "label": "Frames and codebook indices"
      },
      {
        "id": "d",
        "kind": "process",
        "label": "Waveform decoder"
      },
      {
        "id": "t",
        "kind": "dependency",
        "label": "Clock and support contract"
      }
    ],
    "edges": [
      {
        "from": "w",
        "to": "s"
      },
      {
        "from": "s",
        "to": "e"
      },
      {
        "from": "e",
        "to": "q"
      },
      {
        "from": "q",
        "to": "d"
      },
      {
        "from": "t",
        "to": "w"
      },
      {
        "from": "t",
        "to": "q"
      }
    ]
  }
}
```

## Formulation

> **Definition — Audio sample clock.** [DERIVED] A waveform sample $u[n]$ has capture time $n/f_s$ relative to a declared origin, where $f_s$ is samples per second; the clock and channel layout are part of its data contract.

[MATHEMATICALLY-DERIVED] Let duration be $d_a$ seconds, channel count $c_a$, and storage precision $b_a$ bits per sample. Excluding container headers and padding,

$$
n_a=\lfloor f_s d_a\rfloor,\qquad M_{\rm PCM}=n_a c_a b_a/8.
$$
*(Eq. 56.1)*

where $n_a$ = samples per channel and $M_{\rm PCM}$ = waveform bytes. Here $b_a$ is byte-aligned fixed-width storage; bit-packed storage instead requires the ceiling of the total bit count divided by eight. Padding and container bytes must be counted separately.

[MATHEMATICALLY-DERIVED] Define a window $w[j]$ of length $n_w$, hop $h_a$, and transform length $n_f\ge n_w$. For windows fully inside the signal,

$$
U[m,k]=\sum_{j=0}^{n_w-1}u[mh_a+j]w[j]e^{-2\pi i k j/n_f},\quad
n_{\rm frames}=\max\!\left(0,1+\left\lfloor\frac{n_a-n_w}{h_a}\right\rfloor\right).
$$
*(Eq. 56.2)*

where $m$ = frame index, $k$ = frequency-bin index, and $U$ = complex short-time spectrum. This is a constructed mathematical transform, not an attribution to a newly published method.

[DERIVED] The frame advance is $h_a/f_s$ seconds; the observed support is $n_w/f_s$ seconds. Zero-padding to a larger $n_f$ adds spectral evaluation points without adding captured samples. A magnitude or power spectrogram discards phase unless it is retained separately. A nonnegative frequency aggregation followed by a log produces a compressed feature statistic, not an invertible waveform encoding in general. Learned features replace this fixed map with an encoder, but their receptive field still determines when an output can first exist.

```figure
{
  "id": "fig-56.4",
  "kind": "calculator",
  "title": "PCM payload bytes",
  "caption": "Illustrative configuration, not a named model. Byte-aligned storage excludes headers, padding, and compression.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.1",
  "alt": "For 10 seconds at 16000 samples/s, mono, 16-bit storage, Eq. 56.1 gives 320000 payload bytes. Change sample rate, duration, channels, and precision independently.",
  "spec": {
    "equation": "56.1",
    "tex": "M=\\lfloor f_s d_a\\rfloor c_a b_a/8",
    "inputs": [
      {
        "symbol": "fs",
        "label": "samples per second",
        "default": 16000,
        "min": 8000,
        "max": 96000,
        "format": "integer",
        "step": 1
      },
      {
        "symbol": "dur",
        "label": "duration in seconds",
        "default": 10,
        "min": 0.01,
        "max": 3600,
        "format": "seconds"
      },
      {
        "symbol": "ch",
        "label": "channels",
        "default": 1,
        "min": 1,
        "max": 8,
        "format": "integer",
        "step": 1
      },
      {
        "symbol": "bits",
        "label": "bits per sample",
        "default": 16,
        "min": 8,
        "max": 32,
        "format": "integer",
        "step": 1,
        "options": [
          8,
          16,
          24,
          32
        ]
      }
    ],
    "outputs": [
      {
        "symbol": "M",
        "label": "PCM payload",
        "formula": "floor(fs*dur)*ch*bits/8",
        "format": "bytes"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] For a causal implementation, right-align the analysis window with the latest admitted sample. A centered window containing future samples cannot be computed at the current timestamp without either delay or padding that changes the computation. The window timestamp must state whether it denotes start, center, or end. Resampling must low-pass content above the destination's representable band before decimation; this follows because different higher-frequency sinusoids can produce identical samples on the lower-rate grid. Once aliased, their original identities cannot be recovered from those samples alone.

[DERIVED] A learned encoder maps waveform blocks or spectral frames to $e_m\in\mathbb R^{d_e}$. A quantizer maps $e_m$ to one or more finite indices; a decoder maps those indices and optional conditioning to reconstructed audio. Define $q_a$ codebooks per frame, each with $v_a$ possible indices, and frame rate $r_a$. Fixed-length packing and serial token count obey

$$
R_{\rm packed}=r_a q_a\lceil\log_2 v_a\rceil,\qquad
r_{\rm serial}=r_a q_a,\qquad
R_{\rm joint}=r_a q_a\log_2 v_a.
$$
*(Eq. 56.3)*

where rates are bits/s and positions/s respectively; $R_{\rm joint}$ is the idealized log-cardinality rate, not a measured entropy-coded bitrate. Nonuniform probabilities can reduce an actual entropy code's average length; packet headers and framing increase transport overhead. Parallel prediction of codebooks changes the decoding schedule without changing the number of represented indices.

[PAPER-REPORTED] Qwen-Audio-3.0-TTS uses a supervised 12.5 Hz tokenizer, with continuous training followed by finite scalar quantization. Its final bottleneck has ten ternary dimensions, giving $3^{10}=59{,}049$ possible codes [R56.1, §§2.1, 3.1]. This is a concrete design within the chapter's research window; it does not establish that 12.5 Hz is sufficient for every acoustic task.

[DERIVED] A useful representation experiment holds the downstream model, data, and optimizer fixed while varying rate and quantization capacity independently. Otherwise fewer positions and a wider output head change at once. If a softmax head has width $d_e$ and vocabulary $v_a$, its dense projection alone costs approximately $2d_ev_a$ FLOPs per prediction, counting multiply and add separately. Lower frame rate can reduce recurrent decoder steps while a larger vocabulary increases output work and parameter storage. The decision concerns their combined quality and execution cost.

## Algorithm

### Algorithm 56.1 — Timestamp-preserving feature emission

[DERIVED] Inputs are contiguous samples with sequence identifiers, $f_s>0$, and positive integer $n_w,h_a$ (with $n_f\ge n_w$ for the transform); state is a ring buffer and next start index $j_a=0$. Output is feature plus support interval, never an unqualified tensor. The procedure is an explanatory construction.

$$
\begin{aligned}
1.\;&\text{Admit samples only if their sequence and clock contract match.}\\
2.\;&\text{While }j_a+n_w\le n_{\rm received}:\ e\leftarrow F(u[j_a:j_a+n_w]);\\
3.\;&\qquad\operatorname{emit}\big(e,[j_a/f_s,(j_a+n_w)/f_s)\big);\quad j_a\leftarrow j_a+h_a.\\
4.\;&\text{If insufficient samples remain, wait; retain the earliest required support.}\\
5.\;&\text{On end-of-stream, emit only the explicitly padded final frames, then terminate.}
\end{aligned}
$$

[DERIVED] The invariant is that every emitted feature uses only admitted samples and has one unique support interval. Missing packets branch to an explicit gap event rather than silently joining nonadjacent samples. For a direct spectral implementation, each frame requires transform work $O(n_f\log n_f)$ and auxiliary state $O(n_w+n_f)$; the chosen encoder replaces that cost with its own operator graph. The waveform and feature buffers are distinct allocations.

## Implementation

[DERIVED] Store clock, channel order, amplitude scale, dtype, padding policy, feature normalization, and encoder revision beside the tensors. A batch layout can be `[batch, channels, samples]`, followed by `[batch, frames, features]` and then `[batch, frames, codebooks]`. Strided views can avoid a waveform copy, but a subsequent kernel may materialize its input; only a profiler can establish the traffic. Codec state must be separate per session and reset on discontinuity. No reference-stack runtime compatibility is inferred from the mathematical layout.

[NOT-DISCLOSED] A complete deployment cost for the inspected tokenizer, including device energy, encoder/decoder traffic, and money per accepted dialogue, is not supplied by its representation description. Parameter count, token rate, and transport bitrate cannot fill those missing dimensions. Quantitative serving choices remain conditional on local profiling with the required precision and concurrency.

## Experimental design

### Reported experiments

[PAPER-REPORTED] R56.1 evaluates rate and codebook variants on recognition and SEED-TTS-Eval; reducing rate with unchanged capacity hurts some content and speaker metrics, while increased capacity recovers much of that loss [§4.1, Tables 1–2]. R56.7 probes frozen invariant representations and compares reconstruction on LibriTTS, VCTK, and multilingual EMILIA [§§3–4]. These are source experiments; the book has not run them.

## Observations

**What the paper claims.** [PAPER-REPORTED] R56.7 motivates separating global conditioning from the temporal stream; its Dual-TIRE branch combines encoder levels [§2.2].

**What the evidence shows.** [PAPER-REPORTED] Its out-of-domain comparison improves average speaker similarity while PESQ decreases [§4.4, Table 4]. This is a metric trade-off. Its frozen-feature probes and reconstruction comparisons do not establish end-to-end spoken-dialogue performance.

**What we infer.** [MATHEMATICALLY-DERIVED] Rate reduction changes the temporal bottleneck; capacity changes the distinctions a frame can encode. An attribute absent from the retained state cannot be recovered from that state without additional information or a prior. A plausible reconstruction does not establish the original attribute.

**What remains unknown.** [NOT-DISCLOSED] The inspected representation studies do not supply a complete microphone-to-playback profile or device energy per accepted task. These quantities cannot be inferred from code rate.

## Failure modes

> **Failure mode — Clock relabeling.** [DERIVED] *Symptom:* audio pitch, duration, or alignment shifts. *Cause:* samples captured at one rate are interpreted at another. *Detection:* compare sample counts with recorded clock intervals. *Mitigation:* perform an explicit, versioned resampling operation and retain the original clock metadata.

> **Failure mode — Disguised future context.** [DERIVED] *Symptom:* offline results collapse when streamed. *Cause:* centered windows or noncausal encoder context use unavailable samples. *Detection:* perturb only the not-yet-admitted suffix and compare prior features. *Mitigation:* declare look-ahead and include it in delay, or use a causally admissible encoder.

```figure
{
  "id": "fig-56.5",
  "kind": "compare",
  "title": "Representation cost boundaries",
  "caption": "Compare what is retained and what is counted before choosing compression. No row ranks task quality.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.3",
  "alt": "Waveforms count samples/bytes, spectral features count windows/values, and codec indices count frames/codebooks. Transport rate, model positions, and receptive field remain independent axes.",
  "spec": {
    "axis": "Information and cost at a fixed supplied audio interval",
    "columns": [
      {
        "id": "pcm",
        "label": "Waveform"
      },
      {
        "id": "spec",
        "label": "Spectral features"
      },
      {
        "id": "codec",
        "label": "Codec indices"
      }
    ],
    "rows": [
      {
        "dimension": "Stored coordinate",
        "values": {
          "pcm": "Samples × channels",
          "spec": "Frames × bins",
          "codec": "Frames × codebooks"
        }
      },
      {
        "dimension": "Potential loss",
        "values": {
          "pcm": "Sample quantization",
          "spec": "Phase/aggregation",
          "codec": "Quantized learned state"
        }
      },
      {
        "dimension": "Delay requires",
        "values": {
          "pcm": "Capture/buffer rule",
          "spec": "Window support",
          "codec": "Encoder and decoder support"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] At fixed task acceptance, waveform storage preserves the supplied sample sequence but spends transport and memory; spectrograms offer explicit time-frequency statistics with known phase loss; learned features offer task-conditioned compression; codec tokens add reconstruction and a finite interface. These are alternative representation contracts, not ordered capability levels. A text transcript may suffice for lexical retrieval while failing a speaker comparison. A waveform can preserve the needed evidence yet still be infeasible under device compute limits.

## Extensions

### Improvements

[PAPER-REPORTED] Dual-TIRE adds two extraction levels with independent quantization and decoder reinjection while retaining the temporal RVQ stream [R56.7, §2.2, Figure 2]. Its streaming test concatenates contiguous 660 ms blocks without overlap or smoothing [§5]. The block duration is not a measured microphone-to-speaker delay.

[DERIVED] The changed property is representation factorization, not a guarantee that speaker and environment are perfectly disentangled. A classifier's weak performance cannot prove information is absent: its hypothesis class, optimization, and sample size limit the probe. Reopen the design if a stronger controlled probe extracts task-critical information from a stream that was about to be discarded.

## Limitations

[DERIVED] The required result is preservation of declared task distinctions at an admissible delay. Uncertainty about hidden encoder context or codebook packing prevents a justified deployment choice. Prefer a compact representation only when controlled reconstruction and task tests meet acceptance and total execution fits the budget. Reverse that preference when timing, rare events, or speaker discrimination fails; retain waveform evidence when a later audit requires distinctions the compact state omits. Source inspection establishes documented candidates and mathematical constraints, while investigation stops short of a universal winner.

## Reproducibility

[DERIVED] Record raw and resampled sample counts; source and destination rates; channel mapping; spectral window, hop, and transform lengths; padding; encoder checkpoint; quantizer capacity; codebook layout; and exact timestamp convention. Preserve a decodeable fixture with silence, impulses, channel asymmetry, and a truncated final block. Its expected values follow from the chosen input, not a reported model benchmark. All source versions and remaining disclosure gaps appear in [references](references.md) and [verification](verification.md).

## References

[R56.1 — Qwen-Audio-3.0-TTS](https://arxiv.org/html/2607.23938v1), §§2.1, 3.1, 4.1; [R56.7 — Streaming neural speech codecs](https://arxiv.org/html/2607.05250v1), §§2–5. Both full texts re-inspected 2026-10-25.
