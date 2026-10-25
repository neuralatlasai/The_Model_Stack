---
id: ms.section.57.5
entity_type: section
title: "Evaluation"
volume: 3
part: 10
chapter: 57
section: 57.5
slug: 57-5-evaluation
parent: ms.chapter.57
prev_sibling: ms.section.57.4
next_sibling: ms.section.57.6
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

# 57.5 Evaluation

## Scope

[DERIVED] The objective is to determine whether a video system uses the required temporal evidence under a reproducible information and resource boundary. The baseline reports aggregate QA accuracy. Acceptance additionally requires grounding, order sensitivity where labels demand it, causal prefix enforcement, source-level uncertainty and complete failure accounting. This section owns temporal grounding tests, counterfactual clips, sampling sensitivity, distractors and text/audio leakage. General statistical methodology remains in Chapter 06 and end-to-end agent evaluation in Chapter 61.

## Why this exists

[DERIVED] A model can answer a video question from a recent frame, a subtitle, common scene knowledge or an answer-option shortcut. That can be legitimate for some tasks and invalid for a claim of long-horizon visual reasoning. The benchmark must distinguish the required capability from merely supplying many frames. Otherwise an expensive memory system can receive credit for a strong decoder on a recency-heavy distribution.

[DERIVED] Streaming evaluation adds opportunities for hidden temporal access. Pre-extracted ASR, full-clip embeddings, precomputed scene boundaries or future-selected key frames can leak information even if the final prompt contains only early images. The evaluation harness is part of the scientific method: it must expose when each artifact became available and how each decision was triggered.

## Intuition

[DERIVED] An intervention is informative only if its expected label behavior is specified. Reversing a sequence may reverse “which happened first” while preserving “how many times.” A model that changes every answer is sensitive but unreliable; one that preserves every answer can be correct on invariant tasks and fail order-dependent tasks. Evaluate these two families separately.

[MATHEMATICALLY-DERIVED] Correctness on both members of a task-distinct pair rules out a deterministic content-only answer that is invariant to their ordering. It does not prove a particular internal temporal algorithm or physical causal model. The bounded conclusion concerns the tested input distinction.

## Formulation

[DERIVED] For curated pairs $(H_i,\pi_iH_i)$ with distinct verified answers $(a_i,a_i^\pi)$ and normalized model answers $(\widehat a_i,\widehat a_i^\pi)$, define

$$
T_{\mathrm{pair}}=\frac{1}{n_p}\sum_{i=1}^{n_p}
\mathbf1\{\widehat a_i=a_i,\ \widehat a_i^\pi=a_i^\pi\},
\qquad
D_{\mathrm{change}}=\frac{1}{n_p}\sum_i
\mathbf1\{\widehat a_i\ne\widehat a_i^\pi\}.
$$
*(Eq. 57.21)*

[DERIVED] $D_{\mathrm{change}}$ alone can reward arbitrary instability. $T_{\mathrm{pair}}$ requires correctness under both labels. Pair acceptance must verify that the edit creates a meaningful task under the intended media convention; an impossible reordered physical history is an input-robustness probe, not an established real-world counterfactual.

[PAPER-REPORTED] LiveProBench evaluates one-second decisions under a standing request without an explicit event cue, using at most the preceding30 seconds of context. Its Event Sensitivity combines alert responses and complete silence segments on the same recording [R57.6, §§2.1–2.4].

[MATHEMATICALLY-DERIVED] With response fraction $r_{\mathrm{ES}}\in[0,1]$ and silence-segment success fraction $q_{\mathrm{ES}}\in[0,1]$, that metric is

$$
S_{\mathrm{ES}}=\sqrt{r_{\mathrm{ES}}q_{\mathrm{ES}}}.
$$
*(Eq. 57.22)*

[DERIVED] Always responding or always remaining silent gives zero when both kinds of condition are present. The geometric score is at most their arithmetic mean and falls with imbalance. It still reflects the benchmark's selected segment lengths and aggregation rule; it is not a calibrated deployment utility.

```figure
id: fig-57.15
kind: calculator
title: Joint response and silence score
caption: A metric illustration using the LiveProBench geometric aggregation. Segment definitions and recording distribution remain part of the protocol.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-57.22
alt: The score is the square root of response fraction times silence success fraction. A policy with either fraction zero has score zero even if the other fraction is perfect.
spec:
  tex: S_{\mathrm{ES}}=\sqrt{r_{\mathrm{ES}}q_{\mathrm{ES}}}
  equation: "57.22"
  inputs:
    - {symbol: response, label: "alert response fraction", default: 0.6, min: 0, max: 1, format: percent}
    - {symbol: silence, label: "silence segment success fraction", default: 0.8, min: 0, max: 1, format: percent}
  outputs:
    - {symbol: joint, label: "geometric response and silence score", formula: "sqrt(response*silence)", format: percent}
```

## Mechanism

### Methodology

[DERIVED] Start from a claim-to-intervention map. For temporal grounding, retain interval convention and localization tolerance. For event ordering, use task-distinct pairs with independently checked edited labels. For state tracking, vary identity ambiguity and occlusion while keeping the requested time fixed. For memory, stratify evidence-to-query gap and distinguish recent-only from truly historical questions. For proactivity, score every eligible silence and response opportunity.

[PAPER-REPORTED] SimpleStream applies an off-the-shelf VLM to the last2/4/8 observed frames at 1FPS. Its Qwen3-VL8B four-frame condition reports 67.70% on the selected OVO-Bench categories and 80.59% on StreamingBench's real-time subset. The study includes model-specific baseline pipelines and reports a perception/memory trade-off [R57.11, §§3–5, Table 1].

[DERIVED] This is a strong baseline requirement, not a theorem that memory is unnecessary. Hold the backbone, available media prefix and evaluator fixed when testing an added memory mechanism. Cross-system comparisons that retain different prompts, input resolutions or frame budgets remain practical comparisons with those confounders, even under a common prefix.

[DERIVED] Sampling sensitivity should vary both rate and phase. A model can appear robust at one phase while consistently missing a brief transition at another. Retain candidate decode cost and actual tokens; increasing rate under a fixed maximum-frame cap can shrink temporal coverage. A controlled test states which quantity remains fixed rather than labeling both changes “more frames.”

[DERIVED] Distractor tests require a provenance map. Inserting unrelated frames changes timeline length unless the evaluation explicitly preserves original event times through a composite-media mapping. A duplicated decisive frame can change a counting label. Curate admissible distractors and keep their media IDs, timing relation and expected answer invariance. Distinguish attention distraction from a genuinely altered task.

[DERIVED] Modality ablations need video-only, audio-only, subtitle-only, text-only and appropriately combined conditions. A subtitle-only success is a shortcut only when the claimed capability requires visual evidence. Speech-content questions can legitimately be answered from speech or its valid transcript. Audit answer options, file names, metadata, precomputed captions and judge prompts as additional leakage channels.

[DERIVED] Split original recordings and near-duplicate families before constructing edits. All frame samplings, subtitle variants and temporal permutations of one source remain in the same split. Public availability creates a contamination possibility, not proof that a model memorized an item. Record what provenance checks were performed and leave undisclosed training overlap unresolved.

[MATHEMATICALLY-DERIVED] With $n_v$ videos and $n_q(v)$ questions/video, the video-weighted and question-weighted means are

$$
\widehat\mu_v=\frac1{n_v}\sum_v
\frac1{n_q(v)}\sum_j s_{vj},
\qquad
\widehat\mu_q=
\frac{\sum_{v,j}s_{vj}}{\sum_vn_q(v)}.
$$
*(Eq. 57.23)*

[DERIVED] They estimate different target weightings when question counts differ. Consecutive decisions, shared source material and multiple queries from one recording are correlated. Treating them as independent videos can create an artificially narrow uncertainty interval. Report source-level units, task strata and the exact weighting rule.

[MATHEMATICALLY-DERIVED] For a predeclared finite family of $K_c$ comparisons, let each independent video yield a paired score difference $D_v\in [-1,1]$. A union-bound form of Hoeffding gives, with probability at least $1-\delta_c$,

$$
\left|\overline D-\mathbb E[D_v]\right|
\le
\sqrt{\frac{2\log(2K_c/\delta_c)}{n_v}}
\quad\text{simultaneously over the fixed family}.
$$
*(Eq. 57.24)*

[DERIVED] The range width is two. The result assumes independent video-level units and fixed comparisons, not adaptive test-set selection or correlated reposted clips. It describes uncertainty around an expected paired difference and does not remove bias from an incorrect evaluator. General estimation and sequential-test choices remain in Chapter 06.

[DERIVED] Missing outputs, parser failures and timeouts remain in the offered-work denominator. Apply the conservative success bounds developed in [§53.6](../../part-09-retrieval-context-and-agent-systems/ch53-agent-memory-persistent-state-and-long-horizon-consistency/53-6-long-horizon-evaluation.md) when outcomes are unknown. Report completed-only scores separately; do not silently replace a failed temporal answer with a static multiple-choice guess.

[DERIVED] **Cost.** A factorial modality/rate/phase study multiplies inference and evaluation work. A source with $n_p$ temporal edits is not $n_p$ independent videos. Store exact prompts, processed tokens, source masks, decisions and judge calls; charge rejected outputs and retries. Offline preprocessing can dominate media decode/transfer, while a judge can dominate monetary cost. Measured energy and serving latency remain unverified without executing the complete protocol.

```figure
id: fig-57.16
kind: diagram
title: Temporal capability evaluation with controlled access
caption: The split precedes every edit. Each decision is replayed from its allowed prefix and failures remain in the denominator.
evidence: DERIVED
source: DERIVED:eq-57.21
alt: Source-family splitting feeds paired temporal and modality interventions. A causal replay gate supplies the model. Grounding and timing checks feed video-level comparison with all failures retained.
spec:
  direction: LR
  nodes:
    - {id: split, kind: dataset, label: Source-family split}
    - {id: edit, kind: process, label: Curated temporal and modality edits}
    - {id: replay, kind: branch, label: Causal prefix and availability gate}
    - {id: model, kind: model, label: Fixed model and budget}
    - {id: check, kind: metric, label: "Answer, grounding and timing checks"}
    - {id: stats, kind: metric, label: Video-level paired comparison}
    - {id: fail, kind: state, label: "Missing, timeout and parse failures"}
  edges:
    - {from: split, to: edit}
    - {from: edit, to: replay}
    - {from: replay, to: model, label: admitted evidence}
    - {from: model, to: check}
    - {from: check, to: stats}
    - {from: model, to: fail, label: unsuccessful attempt}
    - {from: fail, to: stats, label: retained denominator}
```

## Algorithm

> **Algorithm 57.5 — Preregistered temporal capability comparison.** [DERIVED] Inputs are a fixed hypothesis family, source-disjoint splits, verified edit labels, finite configuration/seed budgets, causal replay harness and frozen evaluator. Output is a complete offered-work ledger and a bounded comparison, including inconclusive outcomes.

$$
\begin{aligned}
1.&\quad \operatorname{FreezeTasksSplitsLabelsMetricsAndBudgets}.\\
2.&\quad \text{For each admitted source/configuration/seed:}\\
 &\quad\operatorname{ReplayOnlyAvailablePrefix};
\quad\operatorname{RecordActualInputsAndDecisions}.\\
3.&\quad \operatorname{EvaluateGroundingOrderSilenceAndAnswer};
\quad\operatorname{RetainFailuresAndUnknowns}.\\
4.&\quad \operatorname{AggregateWithinSource};
\quad\operatorname{ApplyDeclaredWeightsAndUncertainty}.\\
5.&\quad \operatorname{CheckComparatorAccessAndCompleteCost};
\quad\operatorname{UnsupportedComparison}\Rightarrow\mathrm{inconclusive}.\\
6.&\quad\operatorname{Return}(\mathrm{accept/reject/inconclusive},
\mathrm{effect\ boundary},\mathrm{reopening\ evidence}).
\end{aligned}
$$

[DERIVED] The finite test plan bounds execution. A new hypothesis discovered in test results belongs in a new evaluation split or an explicitly exploratory analysis. Repeating the same held-out benchmark until a preferred ranking appears changes the inference problem.

## Implementation

[DERIVED] The harness records bytes/tokens actually delivered to the model, including metadata and derived artifacts, rather than only the requested sample rate. Use immutable source IDs and an availability replay clock. Store first response, later responses and silence decisions separately, with the benchmark's matching and duplicate rules versioned.

[DERIVED] PyTorch (#17, Core training framework) and Hugging Face Transformers (#26, Model-definition layer) can run model-specific candidates; the evaluator and causal harness are separate programs. An official inference script can preserve native silence behavior while still differing structurally from another model's mechanism. Static inspection does not establish equal computation, calibration or runtime compatibility.

## Experimental design

### Reported experiments

[PAPER-REPORTED] LiveProBench includes18,146 one-second decisions and six subtasks. Four window tasks classify the first non-silent response as early, in-window or missed; Duplicate Counting scores exact total counts. Audio-disabled rows define the primary model comparison. Prompted silence and gate-head probabilities remain structurally different [R57.6, §§2–3].

[DERIVED] Its Table 2 reports Human Agent AVG 90.42, while adjacent prose states 92.99. The displayed six component scores average to90.42, so this chapter does not repeat the prose figure as a resolved result. Such a discrepancy is an evidence issue to clarify, not a reason to replace either number with an invented correction.

[PAPER-REPORTED] CaST-Bench's grounding and answer metrics separate correct answers from well-grounded answers, while SimpleStream diagnoses recency-heavy streaming benchmarks [R57.3, §4.3; R57.11, §5]. Their evaluation axes differ; no combined model ranking is constructed here.

## Observations

**What the papers claim.** [PAPER-REPORTED] Current video evaluation can overstate memory or proactive capability when it omits simple recency baselines, preceding silence or grounded evidence [R57.6, §3; R57.11, §§5–6].

**What the evidence shows.** [DERIVED] A high aggregate score can coexist with premature responses, poor grounding or weak long-range recall. Native silence differences and source discrepancies limit comparisons.

**What we infer.** [DERIVED] Require the intervention that targets the claimed capability and a comparator with the same information regime. A failed checker or mismatched observation path makes the result inconclusive for that claim.

**What remains unknown.** [UNVERIFIED] Training contamination, judge calibration on new domains and transfer from benchmark timing windows to deployment utility remain unresolved.

## Failure modes

> **Failure mode — Future-selected preprocessing.** [DERIVED] *Symptom:* a causal prompt contains only early frames but keyframe selection used the full clip. *Cause:* hidden future information in preprocessing. *Detection:* replay preprocessing at each prefix. *Mitigation:* freeze causal selection or label the condition offline.

> **Failure mode — Pseudoreplicated certainty.** [DERIVED] *Symptom:* tiny confidence intervals arise from many nearby decisions on few recordings. *Cause:* correlated units are counted as independent. *Detection:* source-cluster analysis. *Mitigation:* report video-level uncertainty and the target weighting.

## Siblings

[DERIVED] Answer matching measures selected response correctness; temporal overlap measures localization; pair tests measure a curated temporal distinction; full-sequence trigger tests measure response policy; modality interventions diagnose information use. No single metric identifies all these capabilities.

## Extensions

[DERIVED] A benchmark should be extended when its best simple comparator exposes a missing stressor, not merely to make scores lower. Longer evidence gaps reopen retention choices; narrow response windows reopen latency/trigger calibration; edited modality controls reopen shortcut hypotheses. An inconclusive result from few independent sources calls for new sources rather than more correlated edits of the same clips.

```figure
id: fig-57.17
kind: chart
title: Independent-video uncertainty under a fixed comparison family
caption: The conditional bound in Eq. 57.24 uses eight predeclared comparisons and error probability 0.05. It assumes independent video-level differences in [-1,1]; it is not a measured benchmark confidence interval.
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-57.24
alt: A line shows the concentration radius decreasing with the number of independent videos. More frames or questions from one source do not increase this source count.
spec:
  type: line
  x: {label: independent source videos, scale: log2, format: integer, domain: [16, 8192]}
  y: {label: paired mean difference radius, format: percent}
  variables: {Kc: 8, dc: 0.05}
  series:
    - {id: radius, label: "conditional concentration radius", formula: "sqrt(2*ln(2*Kc/dc)/x)", sample: {from: 16, to: 8192, count: 10}, emphasis: true}
```

## Limitations

[DERIVED] The conclusion concerns the declared source distribution, task labels, information access and evaluator. A correct paired distinction does not identify a neural mechanism. A stronger matched comparator, an invalid edit label, a leaked artifact or an inconsistent source result reopens the claim. The benchmark budget ending is not proof of general temporal competence.

## Reproducibility

[DERIVED] Release source IDs/checksums, split groups, edit scripts/seeds, annotation decisions, all processed inputs, availability traces, evaluator prompts/versions, outcome categories, aggregation and uncertainty code. Preserve unresolved source inconsistencies. The book-designed protocols in verification.md remain unexecuted.

## References

[DERIVED] [R57.3](references.md#r57-3), [R57.6](references.md#r57-6), [R57.11](references.md#r57-11), primary versions inspected 2026-10-25.
