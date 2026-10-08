---
id: ms.section.18.5
entity_type: section
title: Sequence and time alignment
short_title: Sequence and time alignment
volume: 1
part: 3
chapter: 18
section: 18.5
slug: 18-5-sequence-and-time-alignment
parent: ms.chapter.18
prev_sibling: ms.section.18.4
next_sibling: ms.section.18.6
children: []
prerequisites: [ms.section.18.4, ms.chapter.13]
downstream: [ms.chapter.19, ms.chapter.55, ms.chapter.56, ms.chapter.57, ms.chapter.58, ms.chapter.59, ms.chapter.60]
related: [ms.chapter.10, ms.chapter.13]
siblings_by_mechanism: []
relations: []
axes:
  lifecycle: [pretraining, adaptation, inference, evaluation]
  mechanism: [multimodal_interfaces]
  feedback_setting: []
  modality: [text, image, audio, video, action]
papers: [P44, P45]
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

# 18.5 Sequence and time alignment

## Scope

Sequence position, physical event time and the time at which information becomes available are separate coordinates. Multimodal temporal alignment maps sampled observations, analysis windows, latent frames and output events onto a declared clock while preserving the causal boundary of the task. This section treats sample rates, timestamps, asynchronous streams, temporal position encodings, clock errors and streaming latency. It distinguishes a timestamp representation from evidence that the streams are synchronized accurately.

## Why this exists

DERIVED: an audio feature can cover a window longer than its hop, a video frame index can advance at a variable physical rate, and a streaming decoder can require future context before producing an output. Flattening all three into consecutive sequence indices discards these distinctions. Temporal reasoning and online causality depend on the physical supports and availability of those inputs, not only the order of their embeddings.

## Intuition

MATHEMATICALLY-DERIVED: every observation $z_i$ has an event support interval $[a_i,b_i]$, an assigned position timestamp $t_i$, and an availability time $r_i$. These quantities need not coincide. A centered audio window may be assigned its midpoint but cannot be computed before its final sample arrives. A remote frame can be captured before another observation yet arrive later. A model intended to act at wall-clock time $T$ must not condition on $z_i$ with $r_i>T$, even if $t_i<T$.

## Formulation

Represent stream $m$ as $\mathcal S_m=\{(z_{mi},a_{mi},b_{mi},t_{mi},r_{mi})\}_i$, with units and clock identity attached. A sample index $s$ at fixed rate $f_s$ maps to $s/f_s$ only after choosing the clock origin and rate convention. For audio windows of $w$ samples and hop $h$,

$$
[a_i,b_i]=\left[\frac{ih}{f_s},\frac{ih+w}{f_s}\right],\qquad
 t_i=\frac{ih+w/2}{f_s} \tag{18.15}
$$

is one unpadded, midpoint-based convention. Endpoint inclusion, padding, centering and resampling are explicit variations. The hop $h/f_s$ determines the nominal frame spacing; the window determines the input support. Neither quantity alone measures a recognition system's timestamp error.

MATHEMATICALLY-DERIVED: approximate conversion from a device clock $\tilde t$ to the reference clock by $t=\alpha\tilde t+\beta$. If the conversion uses incorrect parameters $\hat\alpha,\hat\beta$, the error is

$$
e(\tilde t)=(\hat\alpha-\alpha)\tilde t+(\hat\beta-\beta). \tag{18.16}
$$

Offset error is constant; rate error accumulates with duration. This affine model is a declared local clock approximation. Real clocks can require piecewise calibration or a more complex drift model; Eq. 18.16 is not a universal hardware characterization. Without a shared event or external calibration, an offset and a genuine physical audiovisual delay may be observationally ambiguous.

## Mechanism

### Methodology: sampling and physical time

MATHEMATICALLY-DERIVED: resizing the number of frames in a clip changes the temporal sampling map. A constant sequence increment can represent different elapsed times under variable frame rates. For retained video frames, the interface should use presentation/capture timestamps according to the task, preserve the selected-frame map and identify duplicates or dropped observations. Reconstructing time as $i/f$ is valid only under the declared constant-rate model. Temporal positions that encode frame index alone cannot distinguish two sequences with identical sampled content but different real-time spacing unless other metadata supplies that distinction.

For an asynchronous audio/video pair, define a permissible association by overlapping supports or a declared tolerance on calibrated timestamps. Nearest-timestamp matching is a chosen policy, not proof that the matched content depicts the same physical event. An audio feature spanning several frames may overlap multiple visual observations. A one-to-one alignment imposes an additional restriction that may be inappropriate for that representation. Padding and missing intervals must remain distinguishable from observed silence or repeated visual content.

### Methodology: timestamp tokens and windowed transcription

PAPER-REPORTED · Whisper represents segment timestamps at 20 ms increments within its 30-second windows. Its long-form decoding uses predicted timestamps to move windows, with decoding heuristics for repetition, low-confidence output and silence (R18.3, §§2.3, 4.5). DERIVED: a 20 ms timestamp grid is the output quantization scale; it does not establish 20 ms alignment accuracy. Segment selection, transcript correctness and errors inherited from preceding windows can all affect the final time labels.

MATHEMATICALLY-DERIVED: if a true time lies within a nearest-rounded grid interval of width $\delta$, grid quantization contributes at most $\delta/2$ error under that rounding convention. A model's prediction can choose the wrong grid cell, so the total error is unbounded by this quantization argument. For a local timestamp $\hat t$ emitted in a window with reference start $T_0$, the global time is $T_0+\hat t$ only if both use the same physical clock and the window's preprocessing preserves that map. Resampling or shifting audio without updating $T_0$ yields systematically wrong output despite valid timestamp tokens.

### Methodology: temporal rotary coordinates and block serialization

PAPER-REPORTED · Qwen2.5-Omni's TMRoPE uses temporal, height and width coordinates. Its temporal units correspond to 40 ms; audiovisual input is organized in two-second chunks with visual features preceding audio features within a chunk. Audio encoding is blockwise, and its speech generation path uses bounded contextual blocks (R18.6, §§2.2, 2.4). DERIVED: that serialization is not a global chronological sort of every audio and visual element. Position coordinates carry physical-time information separately from token order.

MATHEMATICALLY-DERIVED: rotary position encoding applies a block-diagonal rotation $R(p)$ to query/key vectors at coordinate $p$. For one scalar coordinate, $R(p)^{\mathsf T}R(q)=R(q-p)$, so the corresponding dot-product term depends on the encoded displacement. Allocating coordinate groups to time and space can expose different displacements, but the conversion from seconds/pixels to those coordinates remains part of the model interface. A quantized time coordinate merges nearby instants at its grid resolution; a shared numerical origin does not correct an unknown device-clock offset.

If a visual frame and acoustic frame are assigned the same temporal coordinate, that states the chosen coordinate relationship. It does not prove semantic co-occurrence, causal direction or accurate capture synchronization. Comparing sequence offsets in the serialized stream would answer a different question. A temporal position system must specify how a new segment's coordinate origin follows preceding modalities, especially when spatial coordinates have different maximum values from temporal coordinates.

### Methodology: causal availability and lookahead

DERIVED: for an online prediction at deadline $T$, an attention mask can admit an observation only if its declared availability $r_i\leq T$, together with any task-specific event-time restrictions. A mask based solely on $t_i\leq T$ can leak future samples through centered windows or block encoders. Likewise, an encoder using bidirectional attention within a completed block is block-causal, not sample-causal. Its latency boundary includes collecting that block.

For a serial pipeline with nonoverlapping collection/lookahead delays $\lambda_j$ and computation times $c_j$, a simple no-overlap model gives

$$
L_{\rm first}=\sum_j(\lambda_j+c_j)+L_{\rm transport}+L_{\rm queue}. \tag{18.17}
$$

MATHEMATICALLY-DERIVED: this equation is conditional on serial execution. With pipelining, steady-state interval is bounded by the slowest stage's service demand under compatible scheduling, while first-output latency still follows the actual dependency path. Summing steady-state reciprocal throughputs does not recover that path. Branches that execute concurrently require a maximum at a join, followed by downstream serial work.

PAPER-REPORTED · EnCodec reports different initial buffering for its 24 kHz streaming and 48 kHz nonstreaming variants and separately measures CPU processing speed; entropy coding introduces an additional buffering dependency (R18.4, §4.6, Table 5). DERIVED: algorithmic lookahead, buffering and compute time should therefore be reported separately. A codec described as faster than real time can still have substantial first-output delay.

## Algorithm

DERIVED: declare the reference clock, origins and units. Preserve the source timestamp map during decoding and resampling. Compute support intervals for every derived frame or latent group. Calibrate device-to-reference conversions, retaining uncertainty and validity intervals. Build association groups using the declared tolerance/support rule. Construct model positions and serialized order separately. For online use, reject or defer observations that violate the availability/deadline rule. Record dropped, late, repeated and missing observations; update output timestamps by the inverse coordinate map. These steps specify the proposed chapter interface, not an executed synchronization service.

## Implementation

MATHEMATICALLY-DERIVED: retaining a stream for buffering horizon $B$ seconds at rate $r$ latent frames/s and feature width $d$ requires approximately $Brdb$ bytes at $b$ bytes per element, excluding boundaries and metadata. If an interface serializes $Q$ codec levels, its symbol rate is $Qr$; if it keeps parallel tracks, frame rate remains $r$ with a larger per-frame object. Padding a batch to its longest temporal span consumes physical work/state unless the runtime exploits ragged structure. Timestamp and mask construction is part of that runtime boundary.

DERIVED: transport jitter is distinct from clock drift. A buffer can wait for late arrivals and reduce ordering errors while increasing latency; it cannot infer lost content or fix an unknown rate calibration. Energy and money depend on the encoder, buffering/runtime placement, sampling rate, clip duration, output workload and hardware. A common measured budget is UNVERIFIED here. Queueing tails also depend on concurrent workload; nominal block duration does not specify p95 end-to-end latency.

## Experimental design

PAPER-REPORTED · Whisper evaluates long-form transcription with concrete decoding and windowing rules; ImageBind tests temporally aligned versus unaligned audio/video pairing in its representation ablations (R18.3, §4.5; R18.9, §5, Table 5g). Qwen2.5-Omni reports audiovisual benchmark performance for the complete system (R18.6, §5). DERIVED: these studies examine different endpoints. Representation alignment ablations do not measure device-clock calibration, and a full-system score does not isolate temporal position encoding without an appropriate controlled comparison.

## Observations

PAPER-REPORTED · ImageBind's audio ablation reports better ESC zero-shot classification for temporally aligned audio/video pairing than for its unaligned variant (R18.9, §5, Table 5g). DERIVED: this is task-performance evidence for the pairing intervention, not a measurement of timestamp error or a guarantee of clock synchronization.

DERIVED: sequence ordering, timestamp quantization and synchronization accuracy are three separate properties. A model can receive temporally meaningful coordinates in a nonchronological block serialization. A fine timestamp grid can coexist with large prediction error. A streaming system can use lookahead inside bounded blocks. These distinctions determine whether an evaluation is offline, block-online or subject to a strict prediction deadline.

## Failure modes

DERIVED: errors include treating decode order as capture time; losing sample-rate changes; assigning midpoint positions without recording support; rounding each conversion repeatedly; interpreting padded zeros as observed silence; and permitting a block encoder's future samples into an earlier deadline. Offset errors affect all events; drift may appear only on long clips. A short-clip benchmark can therefore miss the latter failure.

## Siblings

Section 18.1 owns representation rate/count. Section 18.3 owns dependency masks. Chapters 56–57 develop speech, video and streaming multimodality; the present section owns the shared clock/support/availability contract.

## Extensions

### Improvements and their evidence

DERIVED: physical-time coordinates address ambiguity left by frame index; declared support/availability prevents causal leakage concealed by midpoint labels; explicit clock conversion exposes offset and drift. These are consequences of the stated interface model. The published systems provide implemented examples and task evaluations, not a universal synchronization-error guarantee. A new method needs both alignment measurements and the task outcome it is intended to improve.

## Limitations

NOT-DISCLOSED: the inspected model papers do not establish a shared capture-device clock-error budget across the modalities and benchmarks discussed here. The affine clock, quantization and pipeline equations are conditional accounting models. They do not infer undocumented timestamp precision, buffering or physical delay.

## Reproducibility

Retain original timestamps, resampling maps, frame-selection indices, window supports, block sizes, position conversions, lookahead, clock calibration and latency boundaries. No audiovisual synchronization measurement or streaming timing experiment was executed for this manuscript.

## References

R18.3 §§2.3, 4.5; R18.4 §4.6; R18.6 §§2, 5; R18.9 §5. Exact versions are in [References](references.md).
