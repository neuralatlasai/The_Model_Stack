---
id: ms.section.57.2
entity_type: section
title: "Cross-modal alignment"
volume: 3
part: 10
chapter: 57
section: 57.2
slug: 57-2-cross-modal-alignment
parent: ms.chapter.57
prev_sibling: ms.section.57.1
next_sibling: ms.section.57.3
children: []
prerequisites: [ms.chapter.15, ms.chapter.18, ms.chapter.55, ms.chapter.56]
downstream: [ms.chapter.58, ms.chapter.59, ms.chapter.60, ms.chapter.61, ms.chapter.63]
related: [ms.chapter.42, ms.chapter.48, ms.chapter.53]
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [temporal_representation, streaming_state, evidence_grounding], feedback_setting: [], modality: [video, audio, text]}
papers: []
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.vllm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 57.2 Cross-modal alignment

## Scope

[DERIVED] The required result is a temporally and semantically justified association among visual events, audio, speech and subtitles from the admitted media prefix. The baseline concatenates independently processed streams using nominal timestamps. Acceptance requires a declared alignment tolerance, explicit clock and availability boundaries, and an unknown result when the streams do not identify an association. Audio codecs and speech objectives remain in [Chapter 56](../ch56-audio-speech-and-real-time-interaction/README.md); this section owns synchronization, missing-stream handling and cross-modal timing validity.

## Why this exists

[DERIVED] A common container does not make all timestamped fields equivalent. Presentation timestamps locate media; network arrival records locate receipt; ASR completion locates when a textual hypothesis became available. Associating an early image with a transcript generated using the complete recording leaks later evidence into an ostensibly causal answer. Correct semantics can therefore coexist with an invalid temporal experiment.

[DERIVED] Alignment also has two separate targets. A sound can belong to the depicted object yet occur at the wrong time. A temporally synchronized track can contain the wrong speaker or instrument. A model that ranks global semantic similarity can succeed at the first target while being insensitive to the second. The acceptance rule must identify which distinction matters to the application.

## Intuition

[MATHEMATICALLY-DERIVED] Two devices with different clock rates accumulate timing disagreement even after one perfectly aligned start event. If one clock gains one microsecond per second relative to the other, their disagreement grows linearly with elapsed duration. Matching only the start offset removes one degree of freedom, leaving drift unidentified. Conversely, two correspondences at distinct times identify an affine clock map only when those correspondences themselves are valid and sufficiently separated.

[DERIVED] Content cannot always supply those correspondences. Repeated beats can make multiple lags equally plausible; a voice-over need not correspond to visible lip movement; subtitles can paraphrase rather than transcribe. A robust system must represent ambiguity rather than converting the maximum score into a certainty claim.

## Formulation

[DERIVED] For modality $m$, let $s_m$ be media time in seconds and receiver-equivalent time be $t_m=\alpha_m(s_m-s_{\mathrm{ref},m})+\gamma_m$. Here $\alpha_m>0$ is clock scale and $\gamma_m$ is a reference offset. Suppose calibration bounds scale error by $\epsilon_{\alpha,m}$, offset error by $\epsilon_{\gamma,m}$ seconds, and additional timestamp uncertainty by $r_m$ seconds. Then

$$
\epsilon_m(s_m)
\le \epsilon_{\gamma,m}
 + |s_m-s_{\mathrm{ref},m}|\epsilon_{\alpha,m}+r_m,\qquad
\epsilon_{\mathrm{AV}}\le\epsilon_a+\epsilon_v.
$$
*(Eq. 57.5)*

[DERIVED] The second inequality follows by the triangle inequality. It is a bound under declared calibration errors, not an empirical property of a named device. Clock resets, variable drift and incorrect event matching invalidate the affine model and require a new epoch or a broader uncertainty interval.

[DERIVED] Express every support interval and the prefix boundary in the same calibrated media coordinate, carrying clock uncertainty conservatively. Retain the complete media support interval $[\ell_{m,i},r_{m,i}]$ of observation $i$: a feature computed from a clip or audio window depends on its whole input support, even if displayed at its start or center timestamp. Let $a_{m,i}$ be its actual receiver completion/admission time, and $u_t$ the allowed media-prefix boundary at receiver time $t$. The causal observation set for playback evaluation is

$$
\mathcal O_t=
\{(m,i):a_{m,i}\le t,\ r_{m,i}\le u_t,\
\operatorname{valid}(m,i)=1\}.
$$
*(Eq. 57.6)*

[DERIVED] The support-end condition prevents preloaded future frames or a look-ahead tubelet/audio feature from entering a simulated stream before all of its supporting media. Include clock uncertainty in a conservative upper bound on the support end when needed. The availability condition separately prevents an offline-derived transcript from being treated as available at its word onset. Word-level support intervals, derivation dependencies and hypothesis availability must all be retained.

```figure
id: fig-57.6
kind: calculator
title: Clock and lag-grid uncertainty
caption: An illustrative composition of Eqs. 57.5 and 57.8, not measured device synchronization. The lag-grid term applies only after the correct nearest grid candidate is identified. Fixed uncertainty sums both calibration-offset bounds and both timestamp-uncertainty bounds; elapsed time must bound each stream's reference displacement, and drift sums their scale-error bounds in parts per million.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-57.5
alt: Fixed calibration and timestamp uncertainty, relative drift over elapsed media time and half a lag-grid step add to a conservative timing bound. All inputs are explicit analytical values.
spec:
  tex: \epsilon_{\mathrm{total}}=\epsilon_{\mathrm{fixed}}+u\,d_{\mathrm{ppm}}/10^6+\Delta_s/2
  equation: "57.5"
  inputs:
    - {symbol: offset, label: "fixed calibration + timestamp uncertainty seconds", default: 0.01, min: 0, max: 1, format: fixed2}
    - {symbol: elapsed, label: "elapsed time seconds", default: 600, min: 0, max: 7200, format: fixed2}
    - {symbol: drift, label: "combined drift bound parts per million", default: 20, min: 0, max: 1000, format: fixed2}
    - {symbol: grid, label: "lag grid spacing seconds", default: 0.04, min: 0.001, max: 1, format: fixed2}
  outputs:
    - {symbol: bound, label: "conditional timing bound seconds", formula: offset+elapsed*drift/1e6+grid/2, format: fixed2}
```

## Mechanism

### Methodology

[DERIVED] Establish a source epoch and timebase for each stream. Preserve exact integer ticks plus their rational timebase until an explicit conversion to seconds. Fit a clock map only from trusted correspondences; retain residuals and event identities so one can distinguish clock drift from a wrong match. Re-estimate after discontinuities rather than forcing a single affine fit through a reset.

[DERIVED] Next construct aligned candidate windows using the admitted prefix. Keep audio and visual validity masks separate from observed silence and static imagery. A missing audio packet is an unknown observation; a successfully decoded silent packet is a measurement. An absent subtitle track differs from a subtitle interval that contains no words. These distinctions determine which likelihoods, scores or losses are defined.

[PAPER-REPORTED] AV-SyncBench separates temporal perturbations—global offset, local jitter and speed—from semantics-preserving-timing edits of voice/instrument timbre. Its contrastive-model score averages paired 0.64-second chunk similarities; offset classifiers use their zero-offset probability. The comparison asks whether an original pair scores above its edited counterpart [R57.2, §§2.1–2.3].

[MATHEMATICALLY-DERIVED] A general finite-lag reconstruction uses nonzero valid embeddings $v_i,a_j\in\mathbb R^{d_e}$ and candidate lag $d\in\mathcal D_\ell$. With valid-pair set $\mathcal P_d$,

$$
G(d)=\frac{1}{|\mathcal P_d|}
\sum_{(i,j)\in\mathcal P_d}
\frac{v_i^\top a_j}{\|v_i\|\,\|a_j\|},
\qquad |\mathcal P_d|>0.
$$
*(Eq. 57.7)*

[DERIVED] Pair-count normalization avoids automatically favoring lags with more overlapping samples. It does not make a single-pair peak reliable. Require a minimum overlap and examine alternative peaks. If every estimated score has error at most $\epsilon_g$, a winner separated from every competitor by more than $2\epsilon_g$ is stable to those errors. Without a justified error bound, the observed margin is descriptive only.

[MATHEMATICALLY-DERIVED] If the true lag is inside the searched range, the selected candidate is its nearest grid point, and the grid step is $\Delta_s$, then the additional discretization term is at most $\Delta_s/2$. Combining it with Eq. 57.5 gives

$$
|\widehat d-d_*|
\le \Delta_s/2+\epsilon_{\mathrm{AV}}.
$$
*(Eq. 57.8)*

[DERIVED] Correct candidate selection is a premise. Repeated periodic events or a semantically similar off-screen sound can defeat it. Reporting this bound without the premise would convert a clock/quantization calculation into an unsupported model-accuracy guarantee.

[DERIVED] For training or evaluation with missing modalities, normalize only over the declared valid supervised set. With finite per-example loss $\ell_i$ defined only for valid examples, validity $v_i\in\{0,1\}$ and finite batch index set $\mathcal B_v$,

$$
\overline{\ell}
=\frac{\sum_{i\in\mathcal B_v:\,v_i=1}\ell_i}
{\sum_{i\in\mathcal B_v}v_i},
\quad \sum_i v_i>0.
$$
*(Eq. 57.9)*

[DERIVED] Construct or index only valid losses before aggregation; multiplying a missing or NaN loss by zero is not a valid mask. An empty denominator produces a skipped/undefined estimate, not a zero error. The selected valid subset may differ systematically from dropped observations—for example, difficult motion can coincide with poor capture. Masking alone does not justify extrapolation to the missing population. Report modality-availability strata and the acceptance consequence of an unobserved stream.

[DERIVED] **Cost.** Naive search over $k_\ell$ lags, $n_\ell$ aligned chunks and width $d_e$ requires $O(k_\ell n_\ell d_e)$ dot-product work, plus both encoders and valid-pair construction. Feature storage is $O(n_\ell d_eb_e)$ per modality; materializing a full cross-similarity matrix adds $O(n_\ell^2)$ entries. Buffering increases decision age, and resampling adds compute and possible aliasing. Network transfer uses encoded packet sizes, not embedding count. No measured energy, money or tail latency follows from this accounting.

```figure
id: fig-57.7
kind: diagram
title: Alignment requires time and availability
caption: Receipt time and presentation time are distinct gates. A later ASR hypothesis cannot be backdated into an earlier causal decision.
evidence: DERIVED
source: DERIVED:eq-57.6
alt: Video, audio and ASR each carry presentation and availability metadata. They pass an admissible-prefix gate, then clock-aware pairing, then a semantic and timing check. Missing or late data takes an explicit unknown path.
spec:
  direction: LR
  nodes:
    - {id: streams, kind: dataset, label: "Video, audio and ASR records"}
    - {id: gate, kind: branch, label: Received and inside prefix}
    - {id: clock, kind: process, label: Clock-aware valid pairing}
    - {id: judge, kind: metric, label: Temporal and semantic checks}
    - {id: unknown, kind: state, label: "Missing, late or ambiguous"}
  edges:
    - {from: streams, to: gate}
    - {from: gate, to: clock, label: both conditions hold}
    - {from: gate, to: unknown, label: condition fails}
    - {from: clock, to: judge}
    - {from: clock, to: unknown, label: no identifiable pairing}
```

## Algorithm

> **Algorithm 57.2 — Bounded cross-modal alignment.** [DERIVED] Inputs are finite epoch-tagged records, availability metadata, clock calibration, a nonempty finite lag grid, minimum valid overlap and a deadline. Output includes the lag/association, valid-pair count, uncertainty and a valid/ambiguous/incomplete verdict.

$$
\begin{aligned}
1.&\quad \operatorname{ValidateEpochsTimebasesAndDeadline};
\quad\operatorname{Invalid}\Rightarrow\operatorname{Return}(\mathrm{incomplete}).\\
2.&\quad \mathcal O\leftarrow\operatorname{AdmittedRecords}(\mathcal O_t);
\quad\operatorname{ApplySeparateModalityMasks}.\\
3.&\quad \text{For each }d\in\mathcal D_\ell:
\ \mathcal P_d\leftarrow\operatorname{ValidPairs}(d);\\
 &\quad|\mathcal P_d|\ge n_{\min}
\Rightarrow \operatorname{Evaluate}(G(d)).\\
4.&\quad\operatorname{NoEvaluatedCandidate}\lor\operatorname{DeadlineReached}
\Rightarrow\operatorname{Return}(\mathrm{incomplete}).\\
5.&\quad \widehat d\leftarrow\arg\max_{\mathrm{evaluated}\ d}G(d);
\quad\operatorname{CheckAlternativePeaksAndCalibration}.\\
6.&\quad\operatorname{Return}(\widehat d,\mathcal P_{\widehat d},
\mathrm{valid/ambiguous},\mathrm{conditional\ uncertainty}).
\end{aligned}
$$

[DERIVED] The finite grid bounds search. A wait policy can admit a later record only before the original deadline and must then re-evaluate the causal prefix; it cannot silently wait indefinitely. Calibration failures remain separate from content ambiguity. A valid verdict certifies the declared checks, not general physical causality.

## Implementation

[DERIVED] The join key is source epoch plus media interval, with availability as a separate filter. Preserve ASR hypothesis revisions, subtitle language and origin, and whether a word interval came from forced alignment or online decoding. Carry incomplete and late masks into downstream attention and the answer ledger; replacing them with zero vectors without a mask changes the meaning of absence.

[DERIVED] PyTorch (#17, Core training framework) realizes tensor scores and masks; Hugging Face Transformers (#26, Model-definition layer) owns model-specific processors and layouts. This book specifies the data contract and mathematical checks. It does not assert that a default processor aligns independent devices, knows packet loss or enforces Eq. 57.6. Dated system examples in [§57.6](57-6-compute-and-deployment.md) and the pinned card [R57.12] are interface evidence only; source code was not executed.

## Experimental design

### Reported experiments

[PAPER-REPORTED] AV-SyncBench contains 3,269 videos/38,390 edited samples. Its five-model evaluation uses two NVIDIA H20 GPUs, 25-FPS video, 16-kHz audio and identical pairwise decisions. Synchformer global-offset accuracy is0.510 at 50 ms and 0.662 at 500 ms; overall offset accuracy is0.583 [R57.2, §§2.2–3.2, Tables 1–2]. Those values measure original-versus-edited ranking, not lag-estimation error in milliseconds.

[DERIVED] An appropriate deployment comparison separates global lag, local jitter, clock drift, semantic substitution and missing streams. Hold content and the decoder's available prefix fixed. Split by original recording before generating edits so variants of the same recording do not cross training and evaluation. Report the native silence/missing-stream mechanism rather than assigning an empty transcript the meaning “nothing happened.”

## Observations

**What the paper claims.** [PAPER-REPORTED] Semantic and temporal alignment are distinct axes and evaluated representations have different sensitivities across perturbation types [R57.2, §3].

**What the evidence shows.** [DERIVED] Small offset perturbations remain difficult under this pairwise protocol. Chunk averaging and perturbation size constrain what a score establishes.

**What we infer.** [DERIVED] Choose an alignment method only after it meets the target tolerance on the relevant perturbations and availability strata. A strong semantic score cannot substitute for timestamp validity.

**What remains unknown.** [NOT-DISCLOSED] The benchmark's aggregate accuracy does not disclose a calibrated lag-error guarantee for an arbitrary camera/microphone/network combination. Local end-to-end behavior remains unverified.

## Failure modes

> **Failure mode — Future transcript leakage.** [DERIVED] *Symptom:* an online answer depends on a word not yet decoded. *Cause:* transcript onset replaces hypothesis availability. *Detection:* replay the receipt/completion ledger at every decision. *Mitigation:* gate by both times and version partial ASR outputs.

> **Failure mode — Periodic false lock.** [DERIVED] *Symptom:* a large similarity peak aligns to the wrong repeated beat. *Cause:* nonidentifiable content. *Detection:* inspect competing lags and independent clock anchors. *Mitigation:* retain ambiguity or request more evidence within the fixed deadline.

## Siblings

[DERIVED] Timestamp calibration addresses clocks; lag search addresses observable cross-stream correspondence; semantic alignment addresses content; missing-stream inference addresses incomplete evidence. They are complementary. A system can pass any one and fail the others. Compare alternatives under the same media interval and synchronization acceptance rule.

## Extensions

[DERIVED] Piecewise calibration can address clock resets, but adds segmentation and model-selection uncertainty. More frequent synchronization anchors reduce drift exposure while consuming acquisition or communication resources. Reverse a preference for elaborate content alignment if trusted hardware timestamps already meet the tolerance; reverse a clock-only preference when independent streams lack that guarantee.

```figure
id: fig-57.8
kind: compare
title: Separate synchronization failure axes
caption: Timing, semantic identity and availability require different interventions; success on one row cannot establish the other rows.
evidence: DERIVED
source: DERIVED:eq-57.6
alt: The matrix compares offset/drift, semantic substitution and missing packets by what changes and what must remain controlled.
spec:
  axis: isolated alignment failure under a fixed recording
  columns:
    - {id: timing, label: Timing perturbation}
    - {id: semantic, label: Semantic edit}
    - {id: missing, label: Missing stream}
  rows:
    - {dimension: Changed variable, values: {timing: lag or clock scale, semantic: source identity or content, missing: observation availability}}
    - {dimension: Required control, values: {timing: same content, semantic: same event timing, missing: explicit validity mask}}
    - {dimension: Rejection signal, values: {timing: tolerance exceeded, semantic: wrong association, missing: insufficient evidence}}
```

## Limitations

[DERIVED] The bounded conclusion is an association under explicit timing and visibility premises. It is reopened by a clock-model failure, an unmodeled off-screen source, a stronger matched comparator or a new required tolerance. If the correct correspondence is not identifiable from the available streams, additional optimization of the same score cannot justify a unique answer.

## Reproducibility

[DERIVED] Archive original and edited source hashes, timebases, clock epochs, calibration anchors, receipt traces, chunk boundaries, modality masks, resampling filters, lag grid, tie rule and processor revisions. Preserve the complete list of discarded or late windows. No synchronized-device, ASR or decoder experiment was executed here.

## References

[DERIVED] [R57.2](references.md#r57-2), v1; [R57.12](references.md#r57-12), pinned implementation disclosure. Actual inspection date is2026-10-25.
