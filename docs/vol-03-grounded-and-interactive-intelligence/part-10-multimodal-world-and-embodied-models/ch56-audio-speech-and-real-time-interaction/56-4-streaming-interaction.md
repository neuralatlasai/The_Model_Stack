---
id: ms.section.56.4
entity_type: section
title: "Streaming interaction"
volume: 3
part: 10
chapter: 56
section: 56.4
slug: 56-4-streaming-interaction
parent: ms.chapter.56
prev_sibling: ms.section.56.3
next_sibling: ms.section.56.5
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

# 56.4 Streaming interaction

## Scope

[DERIVED] This section owns chunking, partial hypotheses, endpointing, turn decisions, interruptions, and full-duplex control. Representation support is defined in [56.1](56-1-audio-representation.md); packet buffering and device scheduling belong to [56.6](56-6-systems-constraints.md). Here the scientific object is a causal policy that decides when uncertain input licenses a committed transcript, an answer, or cancellation of audible speech.

## Why this exists

[DERIVED] A live system must act before it has the evidence an offline recognizer receives. Waiting can resolve an ambiguous word, but also delays a response and can conceal an interruption. Acting early can truncate a request, mistake an acknowledgment for a new turn, or commit a wrong entity. Endpointing addresses whether an utterance has ended; response intent addresses whether the assistant should act. Acoustic silence establishes neither conclusion with certainty. The controller needs explicit alternatives and a loss for each wrong action.

[DERIVED] Output has several commitment levels. A partial transcript can be revised. A committed transcript is an interface promise that downstream consumers may already have used. Generated audio can be discarded while buffered, but played audio cannot be withdrawn. A full-duplex system must keep listening during playback and coordinate these commitments. A cancellation event is ineffective if the client continues playing a queued old response.

## Intuition

[DERIVED] Separate perception state from playback state. A system can hear valid speech, infer that it is a backchannel, and continue speaking. It can hear an incomplete request yet have enough evidence to stop its output. Conversely, a complete third-party statement may require no response. A controller whose sole state is speech detection cannot represent these distinctions. The policy decides over a timestamped history; a distinct executor enforces that decision at playback.

```figure
{
  "id": "fig-56.12",
  "kind": "diagram",
  "title": "Perception and playback controller",
  "caption": "Intent may authorize, block, or defer an action. A mute request becomes a confirmed playback fence only after acknowledgment; timeout remains unresolved.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.10",
  "alt": "Audio and playback update validity, completion, and intent. No-response and blocked or uncertain decisions wait or retain playback. Authorized interruption fences the epoch and requests mute. Acknowledgment confirms the client playback fence; timeout or rejection enters bounded recovery. Neither outcome proves device-buffer quiescence.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "tensor",
        "label": "Admitted audio and history"
      },
      {
        "id": "b",
        "kind": "state",
        "label": "Playback speaking/listening"
      },
      {
        "id": "c",
        "kind": "process",
        "label": "Validity, completion, intent"
      },
      {
        "id": "w",
        "kind": "state",
        "label": "Wait/clarify or retain playback"
      },
      {
        "id": "i",
        "kind": "branch",
        "label": "Interruption authorized"
      },
      {
        "id": "blocked",
        "kind": "state",
        "label": "Blocked or uncertain"
      },
      {
        "id": "f",
        "kind": "process",
        "label": "Fence epoch and request mute"
      },
      {
        "id": "ack",
        "kind": "branch",
        "label": "Client acknowledgment before deadline"
      },
      {
        "id": "ok",
        "kind": "state",
        "label": "Playback fence confirmed",
        "sub": "Not device-use completion"
      },
      {
        "id": "timeout",
        "kind": "state",
        "label": "Unknown stop: bounded recovery"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "c"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "c",
        "to": "w",
        "label": "No response needed"
      },
      {
        "from": "c",
        "to": "i"
      },
      {
        "from": "i",
        "to": "f",
        "label": "Authorized"
      },
      {
        "from": "i",
        "to": "blocked",
        "label": "Blocked / uncertain"
      },
      {
        "from": "blocked",
        "to": "w"
      },
      {
        "from": "f",
        "to": "ack",
        "label": "Request sent"
      },
      {
        "from": "ack",
        "to": "ok",
        "label": "Confirmed"
      },
      {
        "from": "ack",
        "to": "timeout",
        "label": "Timeout / rejected"
      }
    ]
  }
}
```

## Formulation

> **Definition — Causal speech commitment.** [DERIVED] A commitment is an irreversible interface event whose decision depends only on evidence admitted by that event's time. Audio commitment occurs at playback, not token generation.

[MATHEMATICALLY-DERIVED] Let $\mathcal F_t$ contain admitted microphone samples, earlier events, acknowledgments, and clocks through time $t$. A causal action is measurable with respect to $\mathcal F_t$. For a chunk grid of width $\Delta>0$, an event at phase $\phi\in[0,\Delta)$ waits until the next boundary:

$$
W_{\rm grid}=\Delta-\phi,\qquad 0<W_{\rm grid}\le\Delta,\qquad
\mathbb E[W_{\rm grid}]=\Delta/2\quad\text{if }\phi\sim\operatorname{Uniform}[0,\Delta).
$$
*(Eq. 56.9)*

[MATHEMATICALLY-DERIVED] The expectation is $\Delta^{-1}\int_0^\Delta(\Delta-\phi)d\phi$. This is an analytical phase model, not measured latency. An event exactly on a boundary requires an admission convention; admitting it immediately gives zero wait there. Correlated speech events, adaptive chunks, and batching invalidate the uniform-phase expectation. Feature look-ahead, network delay, computation, and playback add separate terms.

[MATHEMATICALLY-DERIVED] For a binary decision, let $I_t$ indicate that immediate interruption is warranted and define the full-information posterior $p_t=P(I_t=1\mid\mathcal F_t)$, $C_f>0$ the cost of a false interruption, and $C_m>0$ the cost of missing a warranted interruption. If these are the only losses, conditional-risk minimization gives

$$
R(\mathrm{stop})=C_f(1-p_t),\qquad R(\mathrm{continue})=C_m p_t,\qquad
\mathrm{stop}\iff p_t>\frac{C_f}{C_f+C_m}.
$$
*(Eq. 56.10)*

[DERIVED] Comparing the risks yields the threshold; ties need a declared action. The formulation does not license invented application utilities. Real policies may include wait, clarification, target-speaker rejection, hard stop commands, and safety constraints. These change the admissible actions and losses. A model score is not this full-information posterior merely because it lies between zero and one or is calibrated in score bins. The condition $\mathbb E[I_t\mid p_t]=p_t$ alone supports conditional risk minimization only within score-measurable policies; it need not make that policy Bayes-optimal among all $\mathcal F_t$-measurable actions. The equation uses the stated posterior, and a learned approximation needs separate validation.

```figure
{
  "id": "fig-56.13",
  "kind": "calculator",
  "title": "Chunk-grid waiting time",
  "caption": "Illustrative phase model, not a named system. Mean assumes uniform event phase; compute, network, and playback are excluded.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.9",
  "alt": "A chunk width of 0.24 seconds gives a uniform-phase mean of 0.12 seconds and upper grid-wait bound of 0.24 seconds. Adaptive or event-aligned chunking changes the expectation.",
  "spec": {
    "equation": "56.9",
    "tex": "E[W]=\\Delta/2,\\quad W_{max}=\\Delta",
    "inputs": [
      {
        "symbol": "delta",
        "label": "chunk width",
        "default": 0.24,
        "min": 0.01,
        "max": 2,
        "format": "seconds"
      }
    ],
    "outputs": [
      {
        "symbol": "mean",
        "label": "uniform-phase mean",
        "formula": "delta/2",
        "format": "seconds"
      },
      {
        "symbol": "bound",
        "label": "grid-wait upper bound",
        "formula": "delta",
        "format": "seconds"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Chunking chooses when features and controller updates are released. Endpointing combines evidence for acoustic cessation and semantic completion, often with a time threshold. The threshold changes false completion versus delay. A turn policy additionally conditions on target speaker, history, and system playback. Hysteresis uses different entry/exit thresholds; debounce requires sustained evidence. Both can reduce oscillation while adding delay. Repeated correlated predictions do not yield independent error probabilities, so multiplying per-frame confidence is unjustified without a dependence model.

[PAPER-REPORTED] HiThink Turn conditions turn labels on playback state, separates completeness from response intent, and labels an earliest intent-sufficient prefix as interruption. Annotation combines transcript-based models, forced alignment, and boundary-truncated audio [R56.4, §§2.2–2.4]. The prefix label is model-assisted supervision, not an oracle proof of user intent.

[DERIVED] Partial recognition needs a revision protocol. Let tentative string $y^{(k)}$ share a longest common prefix of length $\ell_k$ with $y^{(k-1)}$. The changed suffix remains provisional until committed. Store a revision and committed boundary; consumers must accept revisions or wait. A controller may use provisional evidence to mute playback while delaying an answer. This separates a reversible protective action from an irreversible content decision. Hard-commit recognizers instead trade revision freedom for a simpler downstream interface.

[PAPER-REPORTED] X2Streaming-ASR samples wait/emit trajectories per utterance but assigns character-relative accuracy/latency credit to commit segments, rather than broadcasting one sentence reward [R56.3, §2.2, Eqs. 4–9]. Its capped normalization writes $H+1$ with $H$ specified in milliseconds. A unit-explicit reconstruction must interpret the added unit as one millisecond, rather than an untyped scalar.

[MATHEMATICALLY-DERIVED] A dimensionally explicit capped penalty is $d(\ell)=\min(\max(\ell,0),H)/(H+\delta)$ for times $\ell,H,\delta$ in the same unit and $H,\delta>0$; then $0\le d<1$. Compare the same reference item across trajectories, and specify insertion credit separately because insertions have no reference item. This can distinguish useful from superfluous waits; it does not guarantee correct credit assignment when alignment or reward proxies are wrong.

[DERIVED] Interruption execution must fence every old-response stage. Increment the response epoch, cancel or mark old generation, discard unplayed old blocks, send a client stop event, and await acknowledgment. Preserve microphone continuity. Generate a replacement answer from history stating which words were heard, rather than treating a canceled answer as delivered. Echo from system playback is a separate source-attribution problem; text history alone cannot remove it.

## Algorithm

### Algorithm 56.4 — Versioned full-duplex turn controller

[DERIVED] Input is causally admitted audio chunks and playback acknowledgments. State is $(e,b,c,y^{\rm tentative},y^{\rm committed},q)$: response epoch, playback status, controller belief, transcript versions, and pending queue. Output is a timestamped continue/wait/respond/stop/recover event.

$$
\begin{aligned}
1.\;&\text{Admit the chunk; reject clock gaps or report them explicitly.}\\
2.\;&(c,y^{\rm tentative})\leftarrow\operatorname{update}(\mathcal F_t,b);\quad\text{retain version and support.}\\
3.\;&\text{If stop is authorized: }e\leftarrow e+1;\ \operatorname{fence}(e);\ \operatorname{request\_mute}().\\
4.\;&\text{Record pending acknowledgment; continue input admission; gate new playback on the fence.}\\
5.\;&\text{If response is licensed and resources admitted, start a response under epoch }e.\\
6.\;&\text{Before each publish/play: reject stale epochs; preserve the committed prefix.}\\
7.\;&\text{On ambiguity, wait or clarify within bounds; on exhaustion, declare fallback.}
\end{aligned}
$$

[DERIVED] An old epoch cannot add audible output after a confirmed fence, provided the client enforces that fence at its final queue. Remote cancellation without client enforcement gives no such invariant. The controller never equates absent evidence with a completed request. Session closure terminates after acknowledgment or a bounded timeout recording uncertain playback; a live session continues. Per-update cost includes perception, policy inference, and queue operations; linear bookkeeping does not bound model inference.

## Implementation

[DERIVED] Timestamp capture, admission, feature availability, controller decision, cancellation dispatch, client receipt, and final audible sample. Use a local monotonic clock and an explicit mapping with uncertainty across devices. Backpressure must preserve microphone/control events when synthesis is expensive. Log queue occupancy and played offsets. A client may mute while generation finishes: remaining compute and money still count, while user-perceived stop time is the last played sample.

[DERIVED] HiThink's reported **ms-swift** training route is outside the reference-stack systems list; the chapter attributes that report without claiming executable inspection. Algorithm 56.4 introduces no runtime API. Turn control adds session state, listening while speaking, and wasted generation after cancellation. Memory includes hypotheses, encoder history, and unplayed waveforms. Communication includes small control messages whose delay can dominate their byte size. Energy and money are unmeasured here; neither a token rate nor training hardware fills that gap.

## Experimental design

### Reported experiments

[PAPER-REPORTED] HiThink evaluates English/Chinese turn control with boundary-data and playback-state ablations [R56.4, §§3.1–3.5]. Holding predictions fixed, adding interruption triggers raises response success from 89% to 98%; mean decision latency changes from 3.380 s to 1.322 s **among successful cases** [§3.3]. Its training uses eight H100 GPUs, BF16, LoRA rank 32, and two epochs; training hardware establishes no serving speed.

[PAPER-REPORTED] X2 reports corpus CER and forced-aligned character-boundary timing. In the inspected v4, AISHELL-1 streaming CER is 1.53% with 32 ms mean boundary-relative delay; WenetSpeech Meeting CER is 8.67% versus Zipformer's 7.88% [R56.3, §3.1, Table 1]. It distinguishes public baseline configurations from paper-quoted comparators. Hardware, precision, concurrency, and runtime revision sufficient for end-user latency transfer are NOT-DISCLOSED by that table.

[DERIVED] The source-local context for the adjacent timing claims is:

| Field | HiThink trigger comparison | X2Streaming-ASR v4 commit timing |
|---|---|---|
| Hardware | Serving hardware NOT-DISCLOSED for this comparison; eight-H100 training is a separate boundary | Timing hardware NOT-DISCLOSED in the inspected benchmark table |
| Model/configuration | HiThink Turn; predictions fixed, response-only versus interruption-or-response trigger | X2Streaming-ASR v4; hard-commit streaming; named baselines use their public configurations |
| Precision | Serving precision NOT-DISCLOSED; BF16 is disclosed for training | Timing precision NOT-DISCLOSED |
| Sequence/support | 240-ms streaming setup; individual utterance lengths NOT-DISCLOSED | 16-kHz input, 80-ms audio-frame advance; full test utterance lengths vary |
| Input/output distribution | Interruption v1.5 events; successful cohorts differ between policies | AISHELL-1 characters for the 32-ms example; WenetSpeech Meeting for the stated CER comparison |
| Concurrency | NOT-DISCLOSED for the trigger comparison | NOT-DISCLOSED for the timing table |
| Runtime/version | Serving revision NOT-DISCLOSED; ms-swift training is not a serving-version pin | Runtime revision NOT-DISCLOSED; public baseline configuration does not pin a local runtime |
| Measurement boundary | Mean decision latency **among successful cases**; not microphone-to-physical-stop time | Emission minus forced-aligned character endpoint; not spoken-response or client playback delay |

## Observations

**What the paper claims.** [PAPER-REPORTED] HiThink motivates earlier intent-triggered control; X2 motivates selective waiting [R56.4, §3.3; R56.3, §3.3].

**What the evidence shows.** [PAPER-REPORTED] HiThink's 0.933 aggregate averages rate metrics and excludes latencies; its stop latency is not the lowest comparator entry [Table 3]. X2's low boundary-relative delay coexists with recognition regressions [Table 1]. Neither is uniform quality-and-latency dominance.

**What we infer.** [DERIVED] Changing the successful-case denominator prevents treating HiThink's two conditional means as a paired latency improvement on every offered interruption. Report success and delay together, retain failures, and compare a fixed cohort before claiming system-wide speedup. Character-relative ASR timing cannot establish microphone-to-response delay.

**What remains unknown.** [UNVERIFIED] Independent reproduction, language transfer, noise/echo rejection, and client-fence delay remain unresolved here. Annotation judges and aligners are fallible instruments; their errors can alter both labels and timing.

## Failure modes

> **Failure mode — Premature floor taking.** [DERIVED] *Symptom:* an answer begins inside a hesitation. *Cause:* silence or a partial phrase is treated as completion. *Detection:* replay within-utterance pauses and incomplete requests. *Mitigation:* preserve wait and calibrate completion separately from intent.

> **Failure mode — Stale playback.** [DERIVED] *Symptom:* canceled speech continues or restarts. *Cause:* generation and client queues use different epochs. *Detection:* correlate played samples with acknowledgments. *Mitigation:* enforce the same fence at publication and playback; report acknowledgment failures.

```figure
{
  "id": "fig-56.14",
  "kind": "systems-trace",
  "title": "Cancellation reaches physical playback",
  "caption": "A server cancel is a request. Client cessation and safe device-buffer reclamation are separate boundaries.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.13",
  "alt": "Cancellation increments the epoch, rejects old blocks, reaches the client, and stops its queue. Acknowledgment and the last played sample separate dispatch from actual cessation.",
  "spec": {
    "columns": [
      "latency",
      "memory",
      "communication",
      "failure"
    ],
    "stages": [
      {
        "name": "Controller stop",
        "values": {
          "latency": "Decision time",
          "memory": "Increment response epoch",
          "failure": "Wrong source/intent"
        }
      },
      {
        "name": "Generation fence",
        "values": {
          "memory": "Fence old blocks; reclaim after device-use completion",
          "failure": "Late result publishes stale output"
        }
      },
      {
        "name": "Client stop",
        "values": {
          "communication": "Mute request and acknowledgment",
          "latency": "Last audible sample",
          "failure": "Old packet restarts playback"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Fixed chunks give predictable update opportunities but incur grid delay. Adaptive commitment can wait selectively but needs calibrated evidence and a correctly specified reward. Hard commits simplify integration; revisable hypotheses preserve alternatives at the cost of version handling. Endpoint-first control is admissible when delayed yielding meets acceptance. Intent-first muting is preferable when waiting violates a mandatory stop requirement, provided false interruption remains acceptable. Full-duplex names simultaneous operation, not demonstrated turn competence.

## Extensions

### Improvements

[DERIVED] HiThink's boundary-aware labels and playback conditioning have explicit ablations. Its trigger-only comparison separates policy change from retraining. X2 changes credit assignment and exposes a wait/accuracy trade-off. These interventions act at different layers; combining them is an unexecuted proposal. Reopen the controller if source-directed speech, rare interruptions, or playback delay violates accepted errors/deadlines. A diagnostic improvement is not a warrant to remove the other axes from evaluation.

## Limitations

[DERIVED] A satisfactory controller jointly meets correctness, rejection, stop behavior, and clock-specific delay. Prefer the simplest admissible controller under matched evidence and compute; reverse that choice when counterexamples require additional context or a different commit policy. Missing playback acknowledgment makes audible stop time unknown. Unchecked alignment quality limits character timing. The next decisive evidence is a fixed offered-event cohort with complete outcomes and local playback traces. Stop when a mandatory requirement is falsified rather than optimizing an aggregate around the failure.

## Reproducibility

[DERIVED] Preserve chunk boundaries, transcript revisions, controller labels/probabilities, history, speaker condition, thresholds, decision times, epochs, acknowledgments, and played offsets. Save successes and failures. Keep reference aligner and judge revisions separate from online signals. Findings above are source reports; [verification](verification.md) contains unexecuted interruption and causal-support protocols.

## References

[R56.3 — X2Streaming-ASR](https://arxiv.org/html/2609.08672v4), §§2.1–3.3, Tables 1–3; [R56.4 — HiThink Turn](https://arxiv.org/html/2609.34096v1), §§2–3.5, Tables 1–4; full texts inspected 2026-10-25.
