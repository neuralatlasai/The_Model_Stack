---
id: ms.section.56.3
entity_type: section
title: "Architecture"
volume: 3
part: 10
chapter: 56
section: 56.3
slug: 56-3-architecture
parent: ms.chapter.56
prev_sibling: ms.section.56.2
next_sibling: ms.section.56.4
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

# 56.3 Architecture

## Scope

[DERIVED] This section owns the speech-specific choice between cascaded, integrated, and hybrid architectures: which intermediate variables exist, what their alignment means, how their losses are applied, and which dependencies constrain streaming. Fusion primitives and general alignment objectives are canonical in [Chapter 18](../../../vol-01-learning-and-representation/part-03-model-architectures-and-state/ch18-multimodal-architectural-primitives/README.md); the present question is their execution under an audio clock. “End-to-end” must specify the training gradient path, inference boundary, and exposed control interface separately.

## Why this exists

[DERIVED] A cascade supplies inspectable interfaces but makes an early decision about what to discard. A transcript can expose a wrong numeral before speech is synthesized; it can also remove the intonation that distinguishes a question from a quotation. Integrated conditioning retains a route for acoustic evidence but does not guarantee that the model uses it while generating. A hybrid can keep a text plan, acoustic conditioning, and a dedicated renderer. The architectural choice is therefore an information and dependency decision, followed by an implementation and evaluation decision.

[DERIVED] Training modular components independently introduces another mismatch: the downstream component sees clean reference conditions during training and uncertain upstream predictions during execution. Joint training can move gradients across that boundary, but a lower joint objective does not establish better interruption handling or calibrated intermediate uncertainty. The architecture must expose enough state to distinguish a representation error, response error, rendering error, and control error. Otherwise a fast, fluent response can conceal the failing subsystem.

## Intuition

[DERIVED] Draw two graphs. The probabilistic graph states conditional dependencies; the execution graph states when a tensor becomes available and which operations must wait. Two models can share the same factorization yet differ in chunking, codebook scheduling, context caching, and output commitment. Conversely, a single executable model can implement several probabilistic heads. Count the critical path in the execution graph and preserve uncertainty in the probabilistic graph; neither graph can substitute for the other.

```figure
{
  "id": "fig-56.9",
  "kind": "diagram",
  "title": "Mediation boundaries and acoustic bypass",
  "caption": "A text-only boundary discards acoustic distinctions unless text is sufficient for the target. A bypass changes this restriction.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.6",
  "alt": "Audio enters perception and a transcript mediator. The response can depend on text alone or additionally on acoustic context. A renderer produces waveform; architecture and commitment remain separate.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "tensor",
        "label": "Admitted acoustic prefix"
      },
      {
        "id": "p",
        "kind": "model",
        "label": "Perception"
      },
      {
        "id": "y",
        "kind": "tensor",
        "label": "Text hypotheses and uncertainty"
      },
      {
        "id": "r",
        "kind": "model",
        "label": "Response generation"
      },
      {
        "id": "c",
        "kind": "tensor",
        "label": "Retained acoustic context"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "Speech renderer"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "p"
      },
      {
        "from": "p",
        "to": "y"
      },
      {
        "from": "y",
        "to": "r"
      },
      {
        "from": "p",
        "to": "c"
      },
      {
        "from": "c",
        "to": "r"
      },
      {
        "from": "r",
        "to": "s"
      }
    ]
  }
}
```

## Formulation

> **Definition — Speech mediation boundary.** [DERIVED] A mediation boundary is the variable passed between perception and response generation, together with its support interval, uncertainty representation, and commitment policy. Text, continuous features, semantic indices, and acoustic indices define different boundaries.

[MATHEMATICALLY-DERIVED] Let $X$ be an admitted acoustic prefix, $H$ prior state, $Y$ a transcript-like mediator, and $Z$ an output decision. A text-only downstream interface imposes

$$
p(Z\mid X,H)=\sum_y p(Z\mid y,H)p(y\mid X,H).
$$
*(Eq. 56.6)*

[MATHEMATICALLY-DERIVED] This factorization is valid for a general target law only when $Z$ is conditionally independent of $X$ given $(Y,H)$. In a deliberately text-mediated model it is a modeling restriction. Replacing the sum by $p(Z\mid y^*,H)$, where $y^*=\arg\max_y p(y\mid X,H)$, adds an approximation. A small change in transcript probability can change the selected hypothesis abruptly. Passing multiple hypotheses can reduce that approximation while preserving the text-only information restriction.

[MATHEMATICALLY-DERIVED] More generally, for acoustic input $X$, generated semantic frames $S_{1:M}$, acoustic frames $C_{1:M}$, and permitted context $H$, one possible hybrid law is

$$
p(S,C\mid X,H)=\prod_{m=1}^{M}p(S_m\mid S_{<m},X_{\le a_m},H)\,
 p(C_m\mid C_{<m},S_{\le m},X_{\le b_m},H).
$$
*(Eq. 56.7)*

[DERIVED] Here $a_m$ and $b_m$ are admitted input boundaries, not forced-alignment timestamps available only after the clip ends. Eq. 56.7 defines an explanatory causal family; it is not an assertion that every inspected model has these exact heads. The waveform decoder additionally has its own causal support and state. If a renderer conditions on future semantic frames, its chunk look-ahead must appear in the execution graph and measured delay.

## Mechanism

### Methodology

[DERIVED] In a cascade, train perception on audio/reference transcripts, the response model on declared text/history, and the renderer on its text and speaker/style conditions. During integration, retain alternative upstream hypotheses or calibrated uncertainty where a wrong entity changes the answer. Evaluate both reference-transcript and recognized-transcript inputs to localize the perception contribution. The difference is conditional on those interventions and the response model; it is not a universal causal decomposition of all errors, because components can compensate for or amplify one another.

[DERIVED] In an integrated architecture, audio embeddings or indices enter the same context used to predict response text/audio. Its training mask must distinguish conditioning tokens from targets and silence/control tokens from semantic content. A target token may condition only on information available at its designated training time if the claim concerns causal streaming. Teacher forcing supplies previous target tokens; it must not silently supply a later acoustic chunk. A support audit perturbs the unavailable suffix and checks whether earlier outputs change. A failure invalidates the streaming interpretation even if the offline likelihood is correct.

[PAPER-REPORTED] X2Streaming-ASR couples a causal encoder and adapter to a decoder, with asynchronous listening and decoding. A wait/emit decision controls hard transcript commitment; emitting starts autoregressive text decoding, while waiting admits more audio [R56.3, §2.1]. This illustrates that an integrated recognition network still requires an explicit commit policy. Its reward construction and empirical latency trade-off are analyzed in [56.4](56-4-streaming-interaction.md#mechanism).

[DERIVED] Alignment must distinguish three objects: an acoustic feature's support, a text symbol's reference interval, and the decoder's attention weights. Soft attention is a learned information-routing distribution, not automatically an accurate timestamp. A monotone alignment path constrains text progress to follow the acoustic axis; unrestricted attention allows revisiting earlier frames. Both require masks for padding and unavailable future frames. Forced alignment can construct training labels and evaluation clocks, but an online system cannot use its future-derived boundaries as an inference oracle.

[MATHEMATICALLY-DERIVED] For a constructed monotone path with frame index $m$ and target index $j$, permit only staying at $j$ or advancing from $j-1$. Given nonnegative local scores $w_{mj}$, the sum of path weights obeys

$$
F_{mj}=w_{mj}\big(F_{m-1,j}+F_{m-1,j-1}\big),\qquad
F_{0,0}=1,\quad F_{0,j>0}=0.
$$
*(Eq. 56.8)*

[MATHEMATICALLY-DERIVED] For the illustrated nonblank path, set $F_{m,0}=0$ for $m>0$, evaluate $1\le j\le\min(m,J)$, and set other out-of-range entries to zero. Alternative start/end blanks or skipped targets must be specified; those choices change the modeled path set. Induction on $m$ proves the recurrence by partitioning paths according to their previous cell. Dense evaluation costs $O(MJ)$ arithmetic and $O(J)$ rolling state when only the final sum is needed; recovering a path or differentiating all scores requires retained state, recomputation, or a separate backward recurrence. This explanatory recurrence does not claim to reproduce a particular paper's alignment objective.

[DERIVED] A semantic/acoustic split introduces another interface. The semantic stream is intended to carry content useful for prediction; the acoustic stream supplies realization detail. Such names do not prove disentanglement or speaker invariance. Probe content and speaker dependence independently, and test whether deleting the acoustic condition changes a task-relevant answer. In a renderer trained to predict a vector field, an explicit conditional squared-error objective specifies the noise path, target velocity, conditioning, and time sampling; a solver then integrates that field at inference. The solver evaluation count changes numerical approximation and work, not the probabilistic definition of a semantic frame. For a declared linear interpolation $x_t=(1-t)x_0+tx_1$, with noise $x_0$ and target latent $x_1$, a conditional renderer can minimize $\mathbb E_{t,x_0,x_1,c}\lVert v_\theta(x_t,t,c)-(x_1-x_0)\rVert_2^2$. The chosen distribution of $t$, noise, target scaling, and condition $c$ defines that training problem. This book construction makes the target explicit without attributing this exact path or loss to every hybrid model.

```figure
{
  "id": "fig-56.10",
  "kind": "diagram",
  "title": "Monotone alignment recurrence",
  "caption": "Each cell sums paths arriving by stay or advance. Local weights and boundary rules determine the path set.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.8",
  "alt": "A previous stay cell and previous advance cell feed a path-sum cell multiplied by its local score. Rolling rows save sum state; path reconstruction or training can require additional state.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "s",
        "kind": "state",
        "label": "Previous frame, same target"
      },
      {
        "id": "a",
        "kind": "state",
        "label": "Previous frame, previous target"
      },
      {
        "id": "w",
        "kind": "tensor",
        "label": "Nonnegative local score"
      },
      {
        "id": "f",
        "kind": "process",
        "label": "Weighted path sum"
      },
      {
        "id": "o",
        "kind": "state",
        "label": "Current path mass"
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "f"
      },
      {
        "from": "a",
        "to": "f"
      },
      {
        "from": "w",
        "to": "f"
      },
      {
        "from": "f",
        "to": "o"
      }
    ]
  }
}
```

[PAPER-REPORTED] Qwen3.5-Omni's Thinker supplies representations/text to a speech Talker with residual-codebook prediction and incremental waveform decoding. ARIA constrains prefix speech/text token ratios relative to an item-level global ratio [R56.10, §§2.1, 2.4–2.5]. Its Table 2 reports an internal-runtime critical path and explicitly cautions that Flash/Plus use different resource allocation; it does not isolate ARIA's contribution.

[MATHEMATICALLY-DERIVED] With final item counts $N_s,N_t>0$ and prefix counts $C_s(k),C_t(k)$, the stated ratio constraint can be written without division as $C_s(k)N_t\le C_t(k)N_s$. When no text has arrived, it admits no speech under this formulation. Counters make a given bound inexpensive to check, but a streaming executor must obtain or estimate the global ratio and enforce a bound without future leakage. The inspected description does not establish that estimator or every empty-prefix rule. This prevents presenting a complete executable ARIA implementation from the ratio statement alone.

## Algorithm

### Algorithm 56.3 — Causal execution of a speech stage graph

[DERIVED] Input is an acyclic stage graph $\mathcal G$, block support rules, bounded buffers, and a response epoch $e$. Unroll the finite admitted blocks and capped output slots into a finite job set $\mathcal K_e$ with keys $k=(v,b,e)$ and acyclic predecessor sets $\operatorname{pred}(k)$. An autoregressive or iterative stage requires an explicit output/iteration cap; unused slots become canceled at end-of-output. Each job has a finite execution deadline and each request has a finite wait/retry budget. State contains admitted support, a status $\sigma_k\in\{\mathrm{pending},\mathrm{running},\mathrm{done},\mathrm{failed},\mathrm{canceled}\}$, immutable versioned results, remaining consumers, and committed prefixes. Output is timestamped blocks or an explicit incomplete/degraded outcome.

$$
\begin{aligned}
1.\;&\text{Validate the unrolled DAG and caps; initialize each admitted job as pending.}\\
2.\;&\text{On an epoch change, mark old pending/running jobs canceled and fence publication.}\\
3.\;&\mathcal R\leftarrow\{k:\sigma_k=\mathrm{pending},\ e_k=e,\
 \text{support admitted},\ \sigma_p=\mathrm{done}\ \forall p\in\operatorname{pred}(k)\}.\\
4.\;&\mathcal R=\varnothing\Rightarrow\text{await input/completion only within the remaining deadline;}\\
 &\text{closed input with no runnable/running job returns drained or unresolved/incomplete.}\\
5.\;&k\in\mathcal R:\ \text{reserve resources; atomically claim pending}\to\text{running, then launch once.}\\
 &\text{No feasible reservation within budget}\Rightarrow\text{incomplete or declared degradation.}\\
6.\;&\text{On completion, check epoch again; stale}\Rightarrow\sigma_k\leftarrow\mathrm{canceled};\\
 &\text{otherwise publish the versioned result and set }\sigma_k\leftarrow\mathrm{done}.\\
 &\text{Failure/timeout}\Rightarrow\sigma_k\leftarrow\mathrm{failed}\text{ and apply the declared failure policy.}\\
7.\;&\text{Advance successor readiness; retire predecessor buffers only after all consumers finish.}\\
8.\;&\text{Commit only permitted prefixes; check epoch at playback; repeat from step 3.}
\end{aligned}
$$

[DERIVED] A job is claimed at most once under its key; completed jobs never re-enter the ready set. Successor readiness changes only after prerequisite results are published, and a running consumer pins its inputs until completion or confirmed cancellation. A timed-out call that can still finish must retain its publication fence and defer unsafe buffer reclamation. Retries use distinct keys within the finite retry allowance; they do not reset a completed key to pending. If an input is still open, the wait branch preserves the input loop until its deadline rather than spinning on an unchanged ready set.

[MATHEMATICALLY-DERIVED] For fixed $e$ and finite $\mathcal K_e$, at most $|\mathcal K_e|$ launches occur, because each launch removes one pending key permanently. Finite execution/wait bounds turn every running job terminal or end the request with an explicit incomplete result. Closed input therefore yields finite scheduler termination, conditional on the executor enforcing those bounds; returning incomplete does not require waiting indefinitely for an unresponsive device. Status and dependency bookkeeping uses $O(|\mathcal K_e|+|E_e|)$ records for the unrolled DAG edges $E_e$, separately from model/buffer memory. An open dialogue has no finite global-session termination claim.

[DERIVED] Every published result has a causal dependency path and every audible block belongs to one response epoch. Checking epoch only at launch is insufficient because canceled work can finish later. A true cyclic dependency must be resolved by an explicitly bounded autoregressive or iterative unrolling, rather than hidden in a readiness loop. These scheduler invariants establish bounded execution and publication eligibility, not correctness of the generated content.

## Implementation

[DERIVED] Each handoff carries shape, dtype, sample clock, feature support, speaker condition, stream ID, and epoch. Keep the transcript's tentative and committed prefixes separate. A renderer must know whether an upstream revision invalidates pending audio; waveform already played cannot be revised. A continuous hidden-state interface can avoid discrete quantization loss but couples model widths, checkpoint revisions, and numerical precision. A token interface is easier to serialize but requires an exact vocabulary and frame-layout agreement. Neither interface permits mixing incompatible checkpoints merely because the tensor dimensions match.

[MATHEMATICALLY-DERIVED] For $M$ acoustic frames, $q$ codebooks, model width $d$, $L$ causal layers, and $H$ retained history positions, serializing all indices gives $Mq$ model positions; a frame-level model gives $M$ positions plus its intra-frame heads. A dense attention kernel's score/value work is proportional to $LMqHd$ in the serialized case when $H$ is measured in serialized positions, while KV capacity scales with retained positions and KV width. If the horizon is a fixed audio duration, serialization also expands $H$, producing a quadratic codebook factor for the attention term. Output heads and parallel codebook dependencies remain additional work. General attention accounting stays canonical in Chapter 14.

[DERIVED] Model parameters, KV state, encoder caches, codec context, pending hypotheses, and waveform queues coexist. Shared weights can serve sessions; their temporal state cannot. More parallel heads can shorten a dependency path while increasing instantaneous workspace and memory traffic. A multi-stage runtime also pays scheduling and transfer costs. Energy and money require measured device residency and utilization; they cannot be inferred from frame count. No executable framework API is introduced here, so no compatibility claim is attached to PyTorch or another model-definition layer.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The state-inertia study evaluates PersonaPlex, Moshi, and Raon-SpeechChat with no interruption, interruption, and interruption plus steering on its Zero-Buffer Benchmark. It puts the critical subject at interruption onset; transcription and an LLM judge score correctness and initial-word occurrence. Calibration conversations used to construct steering vectors are disjoint from evaluation [R56.6, §§4–6.1]. This probes a specific integrated-model failure rather than a matched cascade-versus-integrated architecture trial.

## Observations

**What the paper claims.** [PAPER-REPORTED] R56.6 associates delayed stream-specific predictive focus with interruption comprehension and constructs a perception-direction intervention [§§3.3–5].

**What the evidence shows.** [PAPER-REPORTED] PersonaPlex correctness is 0.28 under interruption and 0.45 with steering, compared with 0.49 without interruption; source Table 2 reports standard errors. The study uses model-specific layers, strengths, and finite steering spans [Table 3]. These are judged benchmark outcomes, not device latency measurements.

**What we infer.** [DERIVED] Simultaneous input/output streams do not ensure that incoming evidence affects the answer promptly. Logit-lens affinity is a diagnostic projection; its association alone does not identify a unique internal causal mechanism. The intervention strengthens the case for a useful direction under the tested setup, while alternative directions, onset errors, and unrelated tasks remain necessary controls for transfer.

**What remains unknown.** [UNVERIFIED] This chapter has not independently reproduced the steering result or established that it transfers to a different checkpoint, language, noise distribution, or turn controller. No universal integrated-architecture advantage follows.

## Failure modes

> **Failure mode — Oracle alignment at inference.** [DERIVED] *Symptom:* online latency is excellent only with reference boundaries. *Cause:* forced-aligned future information enters the commit schedule. *Detection:* remove references and replay causally. *Mitigation:* separate offline label construction from runtime signals.

> **Failure mode — Interface collapse.** [DERIVED] *Symptom:* correct acoustic evidence produces a confidently wrong entity. *Cause:* a one-best text boundary discards a competing interpretation. *Detection:* compare retained alternatives and reference-text controls. *Mitigation:* preserve uncertainty or request clarification before irreversible output.

```figure
{
  "id": "fig-56.11",
  "kind": "compare",
  "title": "Frame scheduling versus serialization",
  "caption": "Count positions and dependencies for the same frame/codebook layout. Parallel heads can shorten depth while adding workspace.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.7",
  "alt": "Frame scheduling uses M temporal positions and separate heads; serialization uses M times q positions. Both represent the same index count. History and intra-frame dependencies determine actual work.",
  "spec": {
    "axis": "Position count and dependencies for M frames and q codebooks",
    "columns": [
      {
        "id": "frame",
        "label": "Frame-level schedule"
      },
      {
        "id": "serial",
        "label": "Serialized indices"
      }
    ],
    "rows": [
      {
        "dimension": "Temporal positions",
        "values": {
          "frame": "M",
          "serial": "M × q"
        }
      },
      {
        "dimension": "Within-frame dependency",
        "values": {
          "frame": "Declared parallel or sequential heads",
          "serial": "Explicit sequence order"
        }
      },
      {
        "dimension": "Additional work",
        "values": {
          "frame": "Output heads / acoustic solver",
          "serial": "Per-index decoder/head"
        }
      },
      {
        "dimension": "Unproven property",
        "values": {
          "frame": "Quality equivalence",
          "serial": "Quality equivalence"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Compare a cascade and an integrated system at matched input support, language, task, controller, and playback boundary. Choose a cascade when inspectable interfaces and independent component replacement meet quality and latency acceptance. Retain acoustic conditioning when the task depends on information that the selected text boundary removes. A hybrid is admissible when it preserves those distinctions without violating resource caps. A preference for fewer modules is not a scientific comparator; modularity, perceptual evidence, and causal delay are separate axes.

## Extensions

### Improvements

[DERIVED] The documented steering intervention changes a hidden state at interruption onset; it does not retrain the whole architecture. Its predecessor condition, altered state, and held-out comparison are explicit above. Treat it as a conditional mitigation, with extra onset detection and hidden-state access costs. The inspected sources do not isolate a universal gain from replacing a cascade with a single integrated model. Reverse an integrated choice if onset-critical meaning is lost while speaking; reverse a text-only choice if matched acoustic ablations expose indispensable evidence.

## Limitations

[DERIVED] Accept an architecture only when task quality, causal support, interruption behavior, and the measured critical path pass jointly. Stop the comparison when a design violates a mandatory information or deadline constraint; averaging an inadmissible design into a ranking conceals that obstruction. If both survive, the next evidence is a matched end-to-end profile and counterexamples separating their mediation boundaries. A missing alignment mask, hidden codec context, or inaccessible intermediate state limits what can be concluded about failure localization.

## Reproducibility

[DERIVED] Preserve the stage graph, input-support masks, target masks, alignment policy, mediator vocabulary, checkpoint pairings, hypothesis versions, epoch transitions, and per-stage buffers. Save reference-text and recognized-text outcomes separately. For steering, preserve calibration/evaluation separation, selected layer, vector construction, scale, onset detector, and decay schedule; a different checkpoint requires recalibration. The book has performed no model execution. Source revisions and protocol gaps are recorded in [references](references.md), and proposed architecture controls in [verification](verification.md).

## References

[R56.3 — X2Streaming-ASR](https://arxiv.org/html/2609.08672v4), §§2.1–2.2; [R56.6 — State inertia and activation steering](https://arxiv.org/html/2606.11386v1), §§3–6, Tables 2–3; full texts inspected 2026-10-25. [R56.10 — Qwen3.5-Omni](https://arxiv.org/html/2604.15804v2), §§2.1, 2.4–2.5, Table 2. Equations 56.6–56.8 and Algorithm 56.3 are book derivations with explicit premises.
