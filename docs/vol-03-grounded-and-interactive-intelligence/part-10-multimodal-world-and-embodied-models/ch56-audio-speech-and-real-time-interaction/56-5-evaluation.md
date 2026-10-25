---
id: ms.section.56.5
entity_type: section
title: "Evaluation"
volume: 3
part: 10
chapter: 56
section: 56.5
slug: 56-5-evaluation
parent: ms.chapter.56
prev_sibling: ms.section.56.4
next_sibling: ms.section.56.6
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

# 56.5 Evaluation

## Scope

[DERIVED] This section owns the joint audio-language quality profile: transcription, semantic correctness, speaker/acoustic robustness, perceptual quality, and response delay. General statistical comparison belongs to [Chapter 6](../../../vol-01-learning-and-representation/part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/README.md); audio adds alignment instruments, multiple clocks, reference ambiguities, and repeated speaker/listener observations. No scalar score alone establishes acceptance on all axes.

## Why this exists

[DERIVED] A low transcription error does not establish a correct answer, and an attractive voice does not establish faithful content. A speech system can also pass both while interrupting the wrong speaker or missing the first word of a correction. Delay is equally ambiguous: feature availability, transcript emission, response generation, first received audio, and first audible audio have different boundaries. Comparing numbers from those clocks as if they were one quantity can reverse a deployment decision.

[DERIVED] Evaluation instruments contribute errors. A generated waveform transcribed by ASR is assessed through another model. A semantic judge can fail on a dialect or entity. A VAD can shift the reference onset or endpoint. Filtering troublesome references can improve a reported score by changing the population rather than improving the model. Scientific evaluation retains these transformations and tests the instruments against human-audited examples.

## Intuition

[DERIVED] Construct a ledger with one row per offered task or conversational event. Attach content, acoustic, speaker, control, and clock outcomes to that row. Preserve the language, speaker, recording condition, task, and split. Aggregate only after specifying the denominator and missing-outcome policy. The same ledger supports subgroup analysis, paired comparisons, and failure inspection; saving only a mean discards the evidence needed for each.

```figure
{
  "id": "fig-56.15",
  "kind": "diagram",
  "title": "One offered event, several acceptance axes",
  "caption": "Retain every offered event, including failures. Distinct quality axes meet at a joint predicate.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.14",
  "alt": "An offered event leads to transcript, semantic, speaker/acoustic, control, and audible-delay results. All meet at joint acceptance; failures remain in the ledger.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "e",
        "kind": "dataset",
        "label": "Offered event and subgroup"
      },
      {
        "id": "t",
        "kind": "metric",
        "label": "Transcript fidelity"
      },
      {
        "id": "m",
        "kind": "metric",
        "label": "Semantic correctness"
      },
      {
        "id": "a",
        "kind": "metric",
        "label": "Speaker/acoustic quality"
      },
      {
        "id": "c",
        "kind": "metric",
        "label": "Control and audible delay"
      },
      {
        "id": "j",
        "kind": "objective",
        "label": "Joint acceptance and failures"
      }
    ],
    "edges": [
      {
        "from": "e",
        "to": "t"
      },
      {
        "from": "e",
        "to": "m"
      },
      {
        "from": "e",
        "to": "a"
      },
      {
        "from": "e",
        "to": "c"
      },
      {
        "from": "t",
        "to": "j"
      },
      {
        "from": "m",
        "to": "j"
      },
      {
        "from": "a",
        "to": "j"
      },
      {
        "from": "c",
        "to": "j"
      }
    ]
  }
}
```

## Formulation

> **Definition — Audio acceptance profile.** [DERIVED] An audio acceptance profile is a vector of task-quality and timing outcomes, with a common offered-workload denominator, declared measurement instruments, subgroup membership, and explicit acceptance predicates.

[MATHEMATICALLY-DERIVED] Given normalized reference symbols $r_{1:N}$ and hypothesis $h_{1:M}$, let $D_{ij}$ be minimum unit-cost edit distance between their prefixes. With $D_{i0}=i$ and $D_{0j}=j$,

$$
D_{ij}=\min\{D_{i-1,j}+1,\ D_{i,j-1}+1,\ D_{i-1,j-1}+\mathbf1[r_i\ne h_j]\},\qquad
\operatorname{ER}=\frac{D_{NM}}{N}=\frac{S+D+I}{N},\quad N>0.
$$
*(Eq. 56.11)*

[MATHEMATICALLY-DERIVED] Word tokenization gives WER; character tokenization gives CER after an explicit Unicode/segmentation policy. The recurrence partitions an optimal path by its last edit and costs $O(NM)$ time and $O(\min(N,M))$ rolling state for distance alone. Insertion counts can make the rate exceed one. Empty references need a declared silence/false-output metric instead of division by zero. Different minimum-cost paths can change the separate substitution/deletion/insertion counts while preserving their sum.

[MATHEMATICALLY-DERIVED] For clips $i$ with positive reference counts $N_i$ and edit totals $E_i$, corpus and macro-utterance rates differ:

$$
\operatorname{ER}_{\rm corpus}=\frac{\sum_i E_i}{\sum_i N_i},\qquad
\operatorname{ER}_{\rm macro}=\frac1n\sum_i\frac{E_i}{N_i}.
$$
*(Eq. 56.12)*

[DERIVED] The corpus rate weights long references more heavily; macro averaging weights clips equally. Macro-language averaging additionally gives each language equal weight regardless of hours. None is a universal fairness or utility guarantee. A change in punctuation, word segmentation, number normalization, or reference truncation changes the estimand. Retain raw and normalized forms, and report exact-entity fidelity separately when one incorrect digit can fail the task.

```figure
{
  "id": "fig-56.16",
  "kind": "calculator",
  "title": "Edit ratio and insertions",
  "caption": "Illustrative edit distance, not a model score. Positive reference counts are required; insertions can push the ratio above 100%.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.11",
  "alt": "Minimum edit distance four over ten reference symbols gives 40 percent. The distance must first be computed from a declared alignment/normalization; this calculator divides that valid distance by a positive reference count.",
  "spec": {
    "equation": "56.11",
    "tex": "ER=E/N,\\quad E=S+D+I",
    "inputs": [
      {
        "symbol": "edits",
        "label": "minimum edit distance",
        "default": 4,
        "min": 0,
        "max": 1000,
        "step": 1,
        "format": "integer"
      },
      {
        "symbol": "ref",
        "label": "reference symbols",
        "default": 10,
        "min": 1,
        "max": 10000,
        "step": 1,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "er",
        "label": "edit rate",
        "formula": "edits/ref",
        "format": "percent"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Measure semantic correctness using a task-specific reference or rubric rather than transcript similarity alone. Audio question answering needs an audio-evidence test: hold the query fixed while replacing or removing relevant acoustic evidence, and include text-only or transcript-only controls. If the answer remains unchanged when decisive evidence changes, inspect whether a response prior or leaked annotation explains it. A model can compensate for transcription errors, so oracle-text performance is a localization control rather than a simple additive decomposition of end-to-end error.

[DERIVED] Speaker robustness requires held-out identities or recording sessions according to the intended deployment. Prevent the same source recording from entering train and test through different cuts. Speaker verification similarity measures an embedding relation, not consent, identity truth, or naturalness. Accent and language tests require competent references, adequate subgroup support, and separate noise/microphone conditions; otherwise acoustic quality and language membership are confounded. A multilingual aggregate cannot establish performance for an untested accent.

[DERIVED] Synthesis evaluation separates content fidelity, speaker similarity, naturalness, style adherence, and acoustic defects. A perceptual proxy trained on one distribution may fail on unfamiliar languages or voices. In human studies, randomize model order, blind identity, equalize playback settings, and preserve ties. If $w,l,t$ are win, loss, and tie counts, a tie-excluding rate $w/(w+l)$ answers a different question from $w/(w+l+t)$. Repeated ratings from the same listener and prompt are clustered observations; treating them as independent trials understates uncertainty.

[MATHEMATICALLY-DERIVED] Let $t_u$ be the reference end of the relevant user event, $t_c$ controller decision, $t_g$ first generated audio, $t_a$ first audible audio, and $t_s$ last audible old-response sample after an interruption whose onset is $t_i$. Distinct delays include

$$
L_c=t_c-t_u,\qquad L_g=t_g-t_u,\qquad L_a=t_a-t_u,\qquad L_{\rm stop}=t_s-t_i.
$$
*(Eq. 56.13)*

[DERIVED] Define the exact event for $t_u$: a forced-aligned character end, semantic-completion boundary, or utterance end. These cannot be interchanged. Anticipatory responses can yield a negative boundary-relative difference; clipping negatives changes the statistic and must be disclosed. Cross-device clocks require an offset/skew mapping and an uncertainty interval. Stop metrics must distinguish cancel dispatch from last played audio, and a refusal or timeout remains an outcome even when no first-audio timestamp exists.

[MATHEMATICALLY-DERIVED] For $n$ offered events, let $A_i$ denote joint semantic, acoustic, control, and deadline acceptance. An all-offered success rate is

$$
\widehat p_{\rm joint}=\frac1n\sum_{i=1}^{n}\mathbf1[A_i],\qquad
\widehat p_{\rm joint}\le\min_k\frac1n\sum_{i=1}^{n}\mathbf1[A_{ik}],
\quad A_i=\bigcap_k A_{ik}.
$$
*(Eq. 56.14)*

[MATHEMATICALLY-DERIVED] The inequality follows because each joint indicator is bounded by every component indicator. No independence is used. Conditional latency among successes should be reported beside the all-offered success rate and the missing/failure counts; it cannot replace them. For an accepted deadline $B$, count “correct and audible by $B$” directly. This yields an interpretable probability without assigning arbitrary finite latency to timeouts.

## Algorithm

### Algorithm 56.5 — Offered-event audio evaluation ledger

[DERIVED] Inputs are immutable audio/events, split and subgroup manifests, evaluator versions, acceptance rules, and a replay schedule. State is a ledger with offered, completed, failed, and missing outcomes; output is a profile with uncertainty and auditable counterexamples.

$$
\begin{aligned}
1.\;&\text{Freeze references, normalization, splits, clocks, and acceptance before comparison.}\\
2.\;&\text{Assign every offered event an ID; execute the same admitted evidence for each system.}\\
3.\;&\text{Retain raw output, revisions, playback trace, failures, and evaluator decisions.}\\
4.\;&\text{Audit a stratified sample with competent human listeners; record disagreements.}\\
5.\;&\text{Compute per-axis, joint, subgroup, and clock-specific quantities on declared denominators.}\\
6.\;&\text{Resample the independent unit and preserve paired comparisons and clusters.}\\
7.\;&\text{Accept only if mandatory bounds pass; otherwise report the violating cases.}
\end{aligned}
$$

[DERIVED] The invariant is one offered ID with an outcome even when inference, networking, judging, or playback fails. Retrying may be another policy outcome, not an erased first attempt. Edit-distance work is separate from expensive judge and human evaluation. Termination requires bounded system/evaluator timeouts; unresolved cases remain missing with a stated policy. Stopping after an attractive mean without auditing mandatory strata violates the acceptance design.

## Implementation

[DERIVED] Version the normalized transcript, raw waveform hash, speaker/session group, packet trace, generated sample count, decoding configuration, and every evaluator. Use deterministic edit-distance fixtures for insertions, empty references, number forms, and script normalization; executable library compatibility remains unverified unless a revision is pinned and run. A joint speech benchmark has no mandatory reference-stack inference engine: these metrics evaluate outputs rather than prescribe model serving.

[DERIVED] Evaluation storage can exceed transcript size because waveform, intermediate revisions, and playback traces must remain available. Human rating cost depends on listening duration, repeats, and adjudication. Automatic judge cost includes context, generated speech transcription, and retries. Report those costs per offered and accepted task. Hardware, precision, and concurrency belong beside timing measurements; parameter count alone does not establish edge-device feasibility. Energy and financial cost are NOT-DISCLOSED for the book's unexecuted protocol.

## Experimental design

### Reported experiments

[PAPER-REPORTED] HumDial records acted English/Chinese dialogues from generated scripts and evaluates interruption/rejection behavior using ASR and a DeepSeek-V3 judge, with VAD timing [R56.5, §§3–4]. Table 1 enumerates nine scenarios although §3.1 says eight. Its overall score weights interruption, rejection, and normalized delay by 0.4/0.4/0.2 [Eq. 3]. Table 2's fastest row is not the highest overall score. This is controlled acted interaction, not uncontrolled spontaneous deployment.

[PAPER-REPORTED] WaxalNet v2 scores shared test utterances with a common normalization and paired utterance bootstrap (2,000 resamples). It also compares CTC and LLM decoders with encoder pretraining held fixed [R56.8, §§3, 5]. Its native-speaker audit samples high/low-WER quartiles with joint review [§8], supporting exploratory error analysis rather than population prevalence. The matched test excludes clips outside 1.5–40 s and any clip where a model fails; failures therefore require a separate offered-workload account.

## Observations

**What the paper claims.** [PAPER-REPORTED] HumDial broadens interaction evaluation. WaxalNet v2 controls more of the model/pretraining comparison and distinguishes domain transfer from in-language adaptation [R56.5, §§3–4; R56.8, §§3–7].

**What the evidence shows.** [PAPER-REPORTED] WaxalNet's shared-encoder LLM decoder has lower WER on 18 of 19 languages, but adds model capacity; each training condition is run once, so bootstrap intervals omit training-seed variation [§5, Limitations]. Its four-words/s cleaning rule remains a selection criterion, not a physical law [§3]. HumDial's delay scale depends on the minimum observed comparator delay [Eq. 2].

**What we infer.** [MATHEMATICALLY-DERIVED] A one-second utterance containing five short words disproves a universal four-words/s impossibility claim. Rate filtering can remove genuine fast speech and change the target population. WER is an edit ratio that can exceed one, not a Bernoulli probability: substituting it into $p(1-p)/n$ can produce a negative variance. WaxalNet v2 uses paired bootstrap instead; that addresses a different uncertainty from variation across training runs. Preserve selection exclusions and resample the genuinely independent unit.

**What remains unknown.** [UNVERIFIED] The chapter has not re-executed these benchmarks or calibrated their judge/aligner errors for the intended application. Accent-specific transfer, rare-event uncertainty, independent replication, and physical-device delay remain open. The excluded ELARSpeech candidate was withdrawn before the evidence cutoff; its results are not used to establish coverage [R56.9].

## Failure modes

> **Failure mode — Successful-case speedup.** [DERIVED] *Symptom:* mean delay improves while completion falls. *Cause:* failures disappear from the denominator. *Detection:* reconcile offered IDs, successes, and timing availability. *Mitigation:* report joint deadline success and conditional delay together.

> **Failure mode — Evaluator-induced ranking.** [DERIVED] *Symptom:* preference reverses under human audit or a new normalizer. *Cause:* ASR, judge, segmentation, or selection artifacts. *Detection:* audit disagreements on fixed audio. *Mitigation:* retain instrument outputs and report sensitivity rather than silently replacing the evaluator.

```figure
{
  "id": "fig-56.17",
  "kind": "compare",
  "title": "Incompatible latency clocks",
  "caption": "Name both endpoints before comparing delay. These quantities describe different paths.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-56.13",
  "alt": "Character emission excludes response rendering and playback. Generated-audio latency excludes later transfer and playout. Audible delay includes them when clocks are mapped.",
  "spec": {
    "axis": "Measurement endpoints for the same admitted interaction",
    "columns": [
      {
        "id": "char",
        "label": "Character emission"
      },
      {
        "id": "gen",
        "label": "Generated audio"
      },
      {
        "id": "play",
        "label": "Audible response"
      }
    ],
    "rows": [
      {
        "dimension": "Reference event",
        "values": {
          "char": "Aligned character end",
          "gen": "Declared user-event end",
          "play": "Same user-event end"
        }
      },
      {
        "dimension": "End boundary",
        "values": {
          "char": "Transcript emit time",
          "gen": "First generated waveform",
          "play": "First played waveform"
        }
      },
      {
        "dimension": "Extra path",
        "values": {
          "char": "Commit policy",
          "gen": "Response/render path",
          "play": "Transfer and device playback"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] WER/CER tests symbolic fidelity, task rubrics test intended meaning, speaker metrics test a chosen representation relation, and listening studies test human judgments under a protocol. None subsumes the others. Choose corpus versus macro aggregation according to the intended population, then expose rare or mandatory strata. A reference-free perceptual proxy is economical for screening, but reverse that choice when human calibration fails. Use matched replay for systems comparison and reserve live interaction studies for effects that prerecorded replay cannot represent.

## Extensions

### Improvements

[DERIVED] HumDial adds scenario coverage and an explicit delay component; the new score's dependence on comparator-set minimum should be retained when comparing editions. WaxalNet v2 adds paired significance and a shared-encoder comparison, improving on its earlier cross-model attribution. Its cleaning and failure exclusions still require retained denominators, and its own limitations retain training-seed uncertainty. These are distinct evaluation improvements; none establishes universal robustness. A stronger result would retain the same offered cohort while improving a mandatory quality/deadline predicate with uncertainty, not merely change the evaluator or denominator.

## Limitations

[DERIVED] Accept a system when the declared joint requirements and mandatory subgroup bounds pass with adequate support. Reverse acceptance when new recordings, speakers, accents, or packet conditions violate them. Unknown judge reliability and sparse strata are obstructions to confident generalization. The next useful evidence is adjudicated failure cases and an independent, matched cohort. Stop claiming transfer at the boundary of tested languages, acoustic conditions, interaction scripts, and playback instrumentation; the profile makes that boundary visible.

## Reproducibility

[DERIVED] Publish the offered-event manifest, references and excluded records, normalization, split grouping, model/evaluator revisions, decoding settings, clock mappings, human instructions, tie handling, aggregation, uncertainty procedure, and raw failure counts. Distinguish runtime execution from editorial math checks. Source-local methods are pinned in [references](references.md), and the proposed microphone/noise/accent/packet-delay evaluation remains unexecuted in [verification](verification.md).

## References

[R56.5 — HumDial full-duplex study](https://arxiv.org/html/2604.21406v2), §§3–5, Tables 1–2, Eqs. 1–3; [R56.8 — WaxalNet](https://arxiv.org/html/2606.02375v2), §§3, 5, 7–8 and Limitations; full texts inspected 2026-10-25. [R56.9 — ELARSpeech withdrawal](https://arxiv.org/abs/2610.19388v2), current withdrawal metadata inspected only to document exclusion; its research findings are not used.
