---
id: ms.section.56.2
entity_type: section
title: "Task families"
volume: 3
part: 10
chapter: 56
section: 56.2
slug: 56-2-task-families
parent: ms.chapter.56
prev_sibling: ms.section.56.1
next_sibling: ms.section.56.3
children: []
prerequisites: [ms.chapter.18, ms.chapter.31, ms.chapter.42, ms.chapter.46, ms.chapter.47]
downstream: [ms.chapter.57, ms.chapter.60, ms.chapter.61, ms.chapter.63, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [audio_streaming, temporal_alignment], feedback_setting: [], modality: [audio, text]}
papers: []
implementations: [impl.vllm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 56.2 Task families

## Scope

[DERIVED] This section separates recognition, synthesis, audio understanding, spoken dialogue, and speech-to-speech by their input, output, information, and acceptance contracts. A system can perform one without establishing the others. The target is a task-quality profile whose axes remain interpretable under streaming and resource limits. Generic likelihood and post-training objectives are owned by earlier chapters; here their masks, temporal supports, and task-specific consequences are developed.

## Why this exists

[DERIVED] A transcription measures a particular textual rendering of an audio signal. It does not measure whether an answer uses the right speaker's statement, whether a synthesized voice follows the requested content, or whether a dialogue yields the floor at the appropriate time. Treating these as one speech score creates invalid substitutions. A semantically correct answer may use a badly transcribed intermediate representation; an exact transcript may accompany an irrelevant or temporally inappropriate response. Both observations are possible without contradiction because the success events differ.

[DERIVED] The dominant constraint also changes across task families. Offline recognition can inspect an entire clip; live dialogue cannot inspect a future interruption. Synthesis must produce acoustic detail not specified by text, whereas recognition must suppress many acoustic differences that do not change the desired words. Audio understanding may need exactly those suppressed differences. The correct methodology therefore begins by declaring which distinctions are relevant, whose evidence is available, and when the output becomes committed.

## Intuition

[DERIVED] Write the pipeline as conditional maps rather than a product label. Recognition maps acoustics to linguistic symbols. Synthesis maps linguistic symbols and speaker/style conditions to acoustics. Understanding maps acoustics and a query to an answer or structured decision. Dialogue adds history and a policy over timing, speech, and actions. Speech-to-speech names an acoustic input/output boundary and can contain any combination of these maps. It does not by itself specify an integrated architecture, translation, or simultaneous listening.

```figure
{
  "id": "fig-56.6",
  "kind": "diagram",
  "title": "Speech task contracts",
  "caption": "The same acoustic input can support different targets. Audio input/output alone does not specify the task or architecture.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.4",
  "alt": "Recognition produces a transcript; understanding answers a query; dialogue adds history and turn actions; synthesis realizes content as audio. A speech-to-speech boundary may combine these paths.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "tensor",
        "label": "Admitted audio"
      },
      {
        "id": "r",
        "kind": "process",
        "label": "Recognition"
      },
      {
        "id": "u",
        "kind": "process",
        "label": "Understanding with query"
      },
      {
        "id": "h",
        "kind": "state",
        "label": "Dialogue history and turn state"
      },
      {
        "id": "y",
        "kind": "tensor",
        "label": "Text or structured answer"
      },
      {
        "id": "t",
        "kind": "process",
        "label": "Synthesis with voice conditions"
      },
      {
        "id": "o",
        "kind": "tensor",
        "label": "Output waveform"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "r"
      },
      {
        "from": "a",
        "to": "u"
      },
      {
        "from": "r",
        "to": "y"
      },
      {
        "from": "u",
        "to": "y"
      },
      {
        "from": "h",
        "to": "u"
      },
      {
        "from": "y",
        "to": "t"
      },
      {
        "from": "t",
        "to": "o"
      }
    ]
  }
}
```

## Formulation

> **Definition — Speech task contract.** [DERIVED] A speech task contract specifies admitted input streams, target outputs, temporal availability, permitted conditioning, and an acceptance event; a task name without those fields is insufficient for comparison.

[MATHEMATICALLY-DERIVED] Let $A$ be admitted audio, $Q$ a query, $H$ prior interaction state, $Y$ a text target, and $\widehat A$ synthesized audio. A consistent factorization for a text-mediated spoken response is

$$
p(\widehat A,Y\mid A,Q,H)=p(Y\mid A,Q,H)\,p(\widehat A\mid Y,A,Q,H).
$$
*(Eq. 56.4)*

where the expression describes a joint law, not a commitment that any named implementation exposes these two modules. Marginalizing $Y$ yields a speech-to-speech distribution; replacing the sum by one decoded transcript or response introduces a decision approximation.

[DERIVED] Recognition targets can include punctuation, speaker labels, timestamps, or disfluencies; these must be specified independently. Synthesis requires text normalization conventions for numerals, symbols, abbreviations, and mixed languages. Understanding labels must say whether answers require lexical content, acoustic events, speaker attributes, or temporal relations. Dialogue outputs need a speech/text action and a time. A valid task record also distinguishes reference-speaker conditioning from a target speaker who is expected to speak in the incoming stream.

## Mechanism

### Methodology

[DERIVED] For recognition, define an allowed transcript equivalence relation before scoring: case, punctuation, numerical forms, and language-specific segmentation alter the target. Supervised token training uses the earlier likelihood contract, but audio and prompt tokens have zero target mask when only the transcript is supervised. For understanding, vary the query while holding audio fixed and vary audio while holding the query fixed. This separates response priors from dependence on evidence. For synthesis, compare intended content with a transcript of the generated speech and assess perceptual properties separately; one recognizer's agreement is an instrument, not ground truth. A controlled audio-understanding task can hold spoken words fixed while changing a timestamped non-speech event, then require the answer to change only when that event is task-relevant. Formally, compare $p(Z\mid A_P+A_E+A_B,Q)$ across declared interventions on speech $A_P$, event $A_E$, and background $A_B$. The additive composition is a constructed test condition, not a claim that arbitrary real recordings separate into identifiable sources.

[PAPER-REPORTED] CASU composes script-controlled speech, retrieved events, and background into aligned audio, with human filtering. It tests contextual reasoning, entity extraction, role inference, and counterfactual questions [R56.11, §2]. This supplies a current audio-understanding task family whose target depends on more than a transcript.

[DERIVED] For dialogue, construct targets over event histories. A user may pause inside a request, acknowledge the system, address another person, correct a value, or request silence. The same waveform fragment can require different actions under different histories. Training labels must therefore preserve the event boundary and the contemporaneous history, rather than assigning one universal action to a short phrase. A speech-to-speech dataset must additionally distinguish translation, conversational answering, repetition, and acoustic transformation; all produce audio but preserve different content.

[MATHEMATICALLY-DERIVED] Let $G_1$ be the event that the correct input meaning is retained, $G_2$ that the response is semantically acceptable, and $G_3$ that speech realization is acceptable. Then

$$
P(G_1\cap G_2\cap G_3)=P(G_1)P(G_2\mid G_1)P(G_3\mid G_1,G_2).
$$
*(Eq. 56.5)*

where no independence is assumed. This identity does not imply that overall task success always requires an exact transcript: replace $G_1$ by preservation of task-relevant meaning when lexical identity is unnecessary. Multiplying standalone benchmark accuracies would require matching the conditional populations and their interfaces, which the identity does not provide.

[PAPER-REPORTED] Voxtral TTS predicts semantic tokens autoregressively and acoustic latents with conditional flow matching, then decodes a hybrid codec representation [R56.2, §2]. Target-audio tokens alone receive the training loss; its post-training adapts preference optimization to both streams [§3]. This supplies a synthesis example, not evidence of dialogue or non-speech understanding competence.

[DERIVED] To analyze an iterative acoustic renderer, let $n_g$ be generated frame count, $n_e$ vector-field evaluations per frame, and $f_e$ FLOPs per evaluation. Its counted work is $n_gn_ef_e$, before the semantic decoder and waveform decoder. Changing $n_e$ is an algorithmic cost-quality choice. Reducing it requires a matched test of intelligibility, voice fidelity, and perceptual acceptability; it cannot be justified by a desirable latency number alone. Conditioning on a speaker sample also adds encoder work and a risk that the sample's noise is reproduced.

```figure
{
  "id": "fig-56.7",
  "kind": "calculator",
  "title": "Conditional pipeline acceptance",
  "caption": "Illustrative conditional probabilities, not model benchmark accuracies. Conditioning events have positive probability; no independence is required.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.5",
  "alt": "Eq. 56.5 multiplies meaning retention, semantic acceptance conditional on retention, and acoustic acceptance conditional on both. Defaults 0.95, 0.9, and 0.98 give 0.8379 joint acceptance.",
  "spec": {
    "equation": "56.5",
    "tex": "P(G_1\\cap G_2\\cap G_3)=p_1p_{2|1}p_{3|12}",
    "inputs": [
      {
        "symbol": "p1",
        "label": "meaning retained",
        "default": 0.95,
        "min": 0.001,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "p2",
        "label": "semantic acceptance given meaning",
        "default": 0.9,
        "min": 0.001,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "p3",
        "label": "acoustic acceptance given both",
        "default": 0.98,
        "min": 0,
        "max": 1,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "joint",
        "label": "joint acceptance",
        "formula": "p1*p2*p3",
        "format": "percent"
      }
    ]
  },
  "anchor": "mechanism"
}
```

## Algorithm

### Algorithm 56.2 — Task-preserving speech pipeline

[DERIVED] Inputs are a task contract $\mathcal T$, admitted audio, conditioning, and budget. State records evidence support, pending outputs, and commitments. Outputs carry task identity and support. This construction supports either modular or integrated implementations.

$$
\begin{aligned}
1.\;&E_k\leftarrow\operatorname{admit}(A_{\le k},Q,H;\mathcal T).\\
2.\;&Z_k\leftarrow\operatorname{infer}(E_k;\mathcal T),\quad\operatorname{support}(Z_k)\subseteq E_k.\\
3.\;&(Y_k,\widehat A_k,a_k)\leftarrow\operatorname{realize}(Z_k;\mathcal T).\\
4.\;&\operatorname{commit}\text{ only the outputs permitted by the task's causal and acceptance rules.}\\
5.\;&\text{If evidence or budget is insufficient, emit a declared incomplete result or recovery event.}
\end{aligned}
$$

[DERIVED] Recognition terminates on an admitted endpoint or a declared duration limit; synthesis terminates on its end marker and drained decoder state; dialogue remains active until session closure. The invariant is that an output never silently changes task type when a subsystem fails. A system that loses audio understanding may offer a transcript, but it must label that output as a different contract. Model compute, input state, and synthesis buffers determine complexity; this procedure imposes no architecture-specific FLOP estimate.

## Implementation

[DERIVED] Synthesis implementation needs a generation interface and a waveform realization interface even when one process hosts both. The source-specific serving reconstruction belongs to [56.6](56-6-systems-constraints.md#implementation); keep its measurements at that boundary.

[DERIVED] The relevant reference-stack entry is **vLLM**, §4 entry 41, layer **LLM inference engine**. vLLM-Omni is the report's extension name, not a separate reference-stack entry. The counted representation path is prompt audio to codec tokens, text/context to semantic and acoustic predictions, and tokens to waveform blocks. Each handoff needs sequence IDs, task ID, sample clock, end marker, and cancellation generation. Shared memory reduces copying only for data actually exchanged through that path; network transfer and client playback remain additional boundaries.

[DERIVED] Account task costs per accepted output: recognition includes encoder and transcript decoding; understanding adds context/query processing; synthesis adds acoustic rendering and waveform decoding; dialogue additionally consumes continual listening and controller work while no answer is being emitted. Parameter storage, KV state, and decoder buffers coexist. FLOPs alone omit launch overhead and memory traffic. No disclosed model-only latency establishes device energy or money per successful conversation.

## Experimental design

### Reported experiments

[PAPER-REPORTED] R56.2 compares generated speech on automatic metrics and blinded human preference. The flagship study uses 77 prompts, three native-dialect annotators per pair, and 24 kHz resampling [§4.3]. Its preference results exclude ties; model identity is hidden from raters. Source seeds and a full end-user workload distribution are not established by that protocol.

[PAPER-REPORTED] CASU compares integrated and caption/transcript-mediated systems on four-option questions, with separate transcription/event measures. Its layer ablation replaces selected layers with Gaussian noise [R56.11, §3, Tables 1–2]. That intervention changes acoustic statistics as well as information; it is not a clean guarantee of natural-scene transfer.

## Observations

**What the paper claims.** [PAPER-REPORTED] R56.2 proposes a hybrid semantic/acoustic synthesis model and preference adaptation [§§2–3].

**What the evidence shows.** [PAPER-REPORTED] The Hindi WER entry increases from 3.39% to 4.99% after preference post-training although its UTMOS increases [§5.1, Table 6]. The checkpoint therefore does not improve every axis for every language. CASU Table 1 separates strong transcription from weaker scene-question accuracy; Table 2 retains substantial accuracy with speech alone, so the introductory claim that removing any single layer causes collapse is stronger than the table uniformly supports [R56.11, §§4.1–4.2].

**What we infer.** [DERIVED] Accept a synthesis checkpoint only when target-language content and perceptual requirements pass separately. An aggregate gain cannot waive a mandatory subgroup failure. The chain rule in Eq. 56.5 further prevents multiplying marginal subsystem scores as though they were conditional acceptance probabilities.

**What remains unknown.** [NOT-DISCLOSED] That synthesis comparison does not establish dialogue comprehension or full-duplex behavior. The inspected study does not disclose the complete application population needed to transport its preference rate to a deployment.

## Failure modes

> **Failure mode — Task substitution.** [DERIVED] *Symptom:* an agent returns fluent speech that answers a different question. *Cause:* output fluency is used as the success label. *Detection:* score semantic acceptance independently of voice preference. *Mitigation:* bind evaluation and runtime outputs to the original task contract.

> **Failure mode — Normalization disagreement.** [DERIVED] *Symptom:* correct verbalization is scored as a recognition error, or a code is spoken as a number. *Cause:* target normalization differs from the application. *Detection:* retain raw and normalized references plus the transformation log. *Mitigation:* evaluate both linguistic accuracy and application-specific entity fidelity.

```figure
{
  "id": "fig-56.8",
  "kind": "systems-trace",
  "title": "Task-specific execution obligations",
  "caption": "Count continual listening and control even when no response tokens are emitted. A fallback must retain or explicitly change the task contract.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.5",
  "alt": "Recognition requires encoder and text decoding, synthesis requires acoustic and waveform generation, and dialogue adds continuous control. Buffers, transfers, and acceptance differ per task.",
  "spec": {
    "columns": [
      "compute",
      "memory",
      "communication",
      "failure"
    ],
    "stages": [
      {
        "name": "Recognition",
        "values": {
          "compute": "Audio encoder and transcript decoding",
          "memory": "Audio context and text state",
          "failure": "Wrong normalization/entity"
        }
      },
      {
        "name": "Synthesis",
        "values": {
          "compute": "Semantic/acoustic and waveform generation",
          "memory": "Reference voice and output queues",
          "failure": "Content or voice mismatch"
        }
      },
      {
        "name": "Dialogue",
        "values": {
          "compute": "Listening/control during playback",
          "communication": "Epochs and playback acknowledgments",
          "failure": "Wrong speaker or turn"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Compare tasks under the same information regime. An offline recognizer is a useful quality ceiling for a streaming recognizer but not a latency-matched competitor. A transcript-plus-text-model path can be appropriate for lexical questions; direct acoustic conditioning becomes necessary when the target depends on information absent from the transcript. Repeating the user's words, translating them, and answering them must be separate speech-to-speech rows. Conflating their scores produces an uninterpretable mean.

## Extensions

### Improvements

[DERIVED] Preference optimization and reinforcement learning are training constructions whose general definitions live in the post-training chapters. Their speech-specific contribution must be demonstrated by what changed in content, acoustic realization, control, or cost. The inspected synthesis study supports a bounded checkpoint comparison, including regressions; it does not justify importing the older methods it cites as newly eligible research. No broad task-family successor comparison was established in this chapter's inspected window.

## Limitations

[DERIVED] Required result and stopping rule come from the task contract. Choose text mediation when lexical evidence is sufficient and its measured end-to-end cost meets acceptance; choose retained acoustic evidence when nonlexical distinctions are essential. Reverse either choice when controlled removal of its supposedly unnecessary information changes accepted outcomes. Missing task labels, unspecified normalization, or hidden future context prevents a justified comparison. The next useful evidence is the counterexample that separates competing information requirements, followed by a matched execution profile; another broad model score does not resolve that uncertainty.

## Reproducibility

[DERIVED] The artifact needs task ID, language, speaker condition, normalization rules, waveform support, input/output duration, output type, evaluator revision, and per-axis acceptance. Synthesis must retain decoding settings and voice prompts; recognition must retain timestamp and segmentation policies; dialogue must retain event history. Do not retain only the final transcript, because it cannot reconstruct playback overlap or acoustic questions. Exact source revisions are pinned in [references](references.md); book-designed cross-task checks remain unexecuted in [verification](verification.md).

## References

[R56.2 — Voxtral TTS](https://arxiv.org/html/2603.25551v2), §§2–6, Tables 4–6; first report 2026-03-26, inspected v2 2026-04-06, accessed 2026-10-25.
