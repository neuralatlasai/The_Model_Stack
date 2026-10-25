---
id: ms.section.57.1
entity_type: section
title: "Temporal representations"
volume: 3
part: 10
chapter: 57
section: 57.1
slug: 57-1-temporal-representations
parent: ms.chapter.57
prev_sibling: null
next_sibling: ms.section.57.2
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

# 57.1 Temporal representations

## Scope

[DERIVED] The objective is to preserve task-relevant temporal evidence under a finite observation and token budget. The baseline samples frames uniformly and treats their features as an unordered set. Success requires distinguishing histories whose appearances coincide but whose transitions or event order differ. This section owns sampling, clips, motion evidence, event boundaries, media timestamps and temporal compression. Encoder families and fusion are owned by [Chapter 18](../../../vol-01-learning-and-representation/part-03-model-architectures-and-state/ch18-multimodal-architectural-primitives/README.md); clock alignment is developed in [§57.2](57-2-cross-modal-alignment.md).

## Why this exists

[DERIVED] Observation loss precedes model error. A contact that occurs entirely between sampled frames cannot be uniquely reconstructed from those frames merely by increasing decoder depth. Event duration, visibility and sampling phase therefore constrain the admissible question family before model selection. Uniform coverage is a transparent baseline because it exposes this constraint; a learned selector must demonstrate its benefit against that baseline at the same admitted-token and selection-compute budgets.

[DERIVED] Temporal indexing and temporal discrimination are separate properties. Attaching increasing timestamps to pooled features does not ensure that the pooling retains which object moved first, whether contact occurred, or which state persisted afterward. Representation choice must be tested with content-controlled temporal interventions. A correct static-object answer establishes little about transition sensitivity.

## Intuition

[MATHEMATICALLY-DERIVED] Let an encoder be invariant to permutations of its selected frames. Two orderings then produce the same representation. If their correct answers to an order-sensitive question differ, a deterministic decoder cannot answer both correctly. For a balanced pair, even randomized prediction conditioned only on that representation has expected accuracy at most one half. This is an information obstruction, independent of optimization quality. Additional temporal information or a narrower answer contract is required.

[DERIVED] Motion additionally requires correspondence and elapsed time. Feature differences can reflect camera movement, illumination or a scene cut. Clip encoding can expose local relations, but it cannot determine an occluded trajectory without further premises. Preserve the distinction between an observed transition, a state inferred between observations and a physically predicted future state.

## Formulation

[DERIVED] Let media duration be $U_v$ seconds, candidate images be $I_i\in\mathbb R^{h_v\times w_v\times c_v}$, presentation times be $s_i$ seconds and source identities be $d_i$. Selected indices form $J$, with frame cost $p_i>0$ visual tokens and budget $Q_v$. Local feature width is $d_e$ and storage precision is $b_e$ bytes/value. These local symbols do not redefine the shared training-token count $D$, model parameter count $N$ or inference-context length $S$.

[MATHEMATICALLY-DERIVED] Suppose sampling instants are separated by $\delta_s>0$ seconds and an event is continuously visible for $\ell_s>0$ seconds. With event-start phase uniform modulo $\delta_s$ and complete interior grid coverage,

$$
P_{\mathrm{hit}}=\min(1,\ell_s/\delta_s).
$$
*(Eq. 57.1)*

[DERIVED] The favorable phase interval has length $\ell_s$ when $\ell_s\le\delta_s$; otherwise every phase is hit. This is a sampling-intersection probability, not detection accuracy. Visibility, encoding and interpretation remain additional conditions. Nearest-grid timestamp estimation has error at most $\delta_s/2$ only within the covered grid interval; first-observation triggering can instead wait almost $\delta_s$.

[MATHEMATICALLY-DERIVED] For fixed $p$ tokens/frame, the uniform grid $\{j\delta_s:0\le j\le\lfloor U_v/\delta_s\rfloor\}$ over the closed interval $[0,U_v]$ has $\lfloor U_v/\delta_s\rfloor+1$ frames and token demand

$$
S_v=p\bigl(\lfloor U_v/\delta_s\rfloor+1\bigr),\qquad S_v\le Q_v.
$$
*(Eq. 57.2)*

[DERIVED] This grid includes zero and includes the final endpoint only when $U_v/\delta_s$ is an integer. Appending $U_v$ when it is not already on the grid adds one frame and $p$ tokens. A decoded recording with timestamps in $[0,U_v)$ requires its own last-frame convention; the closed-interval analytical count must not be substituted for an actual decoder trace.

[DERIVED] Endpoint convention matters near a budget boundary. Cropping the last sample changes coverage; silently replacing a requested rate with a maximum-frame cap changes the experiment. Variable-resolution frames require the exact sum $\sum_{i\in J}p_i$, including the actual processor's temporal merging and special tokens.

```figure
id: fig-57.3
kind: calculator
title: Event intersection with a sampling grid
caption: Uniform random event phase and an interior grid are analytical conditions. A hit supplies an observation, not a guarantee of perception or correct reasoning.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-57.1
alt: The calculator evaluates the fraction of event start phases that contain a sample. At duration 0.2 seconds and spacing one second the fraction is 20 percent.
spec:
  tex: P_{\mathrm{hit}}=\min(1,\ell_s/\delta_s)
  equation: "57.1"
  inputs:
    - {symbol: ell, label: "visible event duration seconds", default: 0.2, min: 0.01, max: 5, format: fixed2}
    - {symbol: delta, label: "sample spacing seconds", default: 1, min: 0.01, max: 10, format: fixed2}
  outputs:
    - {symbol: hit, label: "phase intersection probability", formula: "min(1,ell/delta)", format: percent}
```

## Mechanism

### Methodology

[DERIVED] Construct an observation ledger before encoding: media hash, frame identity, presentation time, validity, resolution and any correspondence annotation. A uniform reserve gives declared temporal coverage; additional candidates can be selected by novelty or question relevance. Selection itself consumes decode, feature and scoring work. A detector running on the same sparse observations cannot guarantee discovery of an event wholly between them. Boundary refinement therefore requires either denser candidate access or an explicit uncertainty interval.

[DERIVED] A clip groups consecutive observations so local temporal interaction occurs before global compression. With $k_f$ frames and $p$ patches/frame, dense joint attention forms $(k_fp)^2$ score pairs/head; independent frame attention forms $k_fp^2$ before aggregation. Their difference is a structural cost, not a measured speed ratio or a statement about HBM materialization. A factorized encoder changes which cross-frame interactions are available and must be evaluated on the same motion and ordering tasks.

[PAPER-REPORTED] VT-Contrast uses chronological anchors, frame-drop positives and same-frame reordered negatives; it grades negatives by normalized inversions and pools selected late-layer last-frame tokens. It adds representation contrast to language loss without changing the answer format [R57.1, §§3.2–3.4, Eqs. 3–12].

[MATHEMATICALLY-DERIVED] In a local transcription of that objective, $r_a,r_+$ and $r^-_m$ denote the three view representations, $\kappa$ is cosine similarity, $\vartheta_c>0$ is contrastive temperature, and $m_-$ is the number of negatives:

$$
\mathcal L_{\mathrm{temp}}
=-\log\frac{\exp(\kappa(r_a,r_+)/\vartheta_c)}
{\exp(\kappa(r_a,r_+)/\vartheta_c)+
\sum_{m=1}^{m_-}\exp(\kappa(r_a,r^-_m)/\vartheta_c)}.
$$
*(Eq. 57.3)*

[DERIVED] Differentiating with respect to a similarity logit gives its softmax probability minus its positive-target indicator. The objective pushes the positive relative to the chosen negatives; it does not certify that the representation preserves every answer-relevant distinction. Dropping the only decisive frame can violate the positive-pair premise for a fine-grained task. A nonidentity permutation of visually identical frames can remain semantically unchanged. Negative construction and task labels must therefore be audited together.

[DERIVED] Compression is admissible only relative to the required query family. Let $H_v$ be an observed history and $g_v(H_v)$ its retained state. Instantiating the memory collision argument owned by [§53.1](../../part-09-retrieval-context-and-agent-systems/ch53-agent-memory-persistent-state-and-long-horizon-consistency/53-1-memory-taxonomy.md), exact answer preservation requires

$$
g_v(H_1)=g_v(H_2)
\ \Longrightarrow\
A_v(H_1,q)=A_v(H_2,q)
\quad\text{for every admitted }q.
$$
*(Eq. 57.4)*

[DERIVED] Event-name summaries can satisfy a narrow classification contract while failing later count, timing or object-state queries. Unknown future questions make aggressive irreversible compression a decision under uncertainty. Retaining source references enables later retrieval only while the source remains available and the retrieval deadline is feasible.

[DERIVED] **Cost.** Selection over $n_c$ candidates requires candidate decoding and feature construction even if few frames are admitted. Naive repeated feasible-maximum selection is $O(n_c^2)$ after scoring; fixed scores and costs permit sorting once in $O(n_c\log n_c)$ because an unaffordable candidate cannot become affordable as budget decreases. Selected feature storage is $\sum_{i\in J}p_id_eb_e$ bytes plus provenance. Multi-view training adds encoder/decoder passes and activation retention; exact FLOPs depend on the selected backbone and layer set. Transfer bytes, energy and money remain workload measurements, not consequences of token count alone.

```figure
id: fig-57.4
kind: diagram
title: Where temporal information can disappear
caption: Sampling, encoding and retention remove different distinctions. A later stage cannot restore a uniquely missing observation without additional evidence or assumptions.
evidence: DERIVED
source: DERIVED:eq-57.4
alt: Source frames and timestamps feed sampling, then local temporal encoding, then bounded retained evidence, then a task check. A separate source-reference path may support later retrieval if still available.
spec:
  direction: LR
  nodes:
    - {id: src, kind: dataset, label: Source and presentation times}
    - {id: sample, kind: process, label: Observation selection}
    - {id: enc, kind: model, label: Local temporal encoding}
    - {id: state, kind: memory, label: Retained evidence and gaps}
    - {id: check, kind: metric, label: Task-specific temporal check}
    - {id: ref, kind: dependency, label: Retrievable source identity}
  edges:
    - {from: src, to: sample}
    - {from: sample, to: enc}
    - {from: enc, to: state}
    - {from: state, to: check}
    - {from: src, to: ref, kind: dependency}
    - {from: ref, to: check, kind: dependency, label: only if available in time}
```

## Algorithm

> **Algorithm 57.1 — Budgeted temporal observation selection.** [DERIVED] Inputs are finite candidates with valid source identities/timestamps, positive integer costs $p_i$, finite utility scores $u_i$, coverage set $J_0$ and integer budget $Q_v$. Output is a chronological selected ledger or an explicit infeasible result. This is a book procedure, not a named model implementation.

$$
\begin{aligned}
1.&\quad \operatorname{InvalidInputs}\ \lor\
\sum_{i\in J_0}p_i>Q_v
\Rightarrow\operatorname{Return}(\mathrm{infeasible}).\\
2.&\quad J\leftarrow J_0,\quad q_{\mathrm{used}}\leftarrow\sum_{i\in J_0}p_i.\\
3.&\quad \text{For }k=1,\ldots,n_c:\quad
\mathcal F\leftarrow\{i\notin J:p_i\le Q_v-q_{\mathrm{used}}\}.\\
4.&\quad \mathcal F=\varnothing\Rightarrow\operatorname{Return}(\operatorname{SortByTime}(J)).\\
5.&\quad i^\star\leftarrow\arg\max_{i\in\mathcal F}u_i/p_i
\quad\text{with fixed tie rule};\\
 &\quad J\leftarrow J\cup\{i^\star\},\quad
q_{\mathrm{used}}\leftarrow q_{\mathrm{used}}+p_{i^\star}.\\
6.&\quad \operatorname{Return}(\operatorname{SortByTime}(J)).
\end{aligned}
$$

[DERIVED] The empty-feasible-set guard precedes the first maximization. The invariant is $q_{\mathrm{used}}\le Q_v$, and at most $n_c-|J_0|$ additions occur. Greedy utility density has no general guarantee for nonlinear decoder loss. Invalid decoded candidates remain recorded gaps; they do not acquire invented frames or timestamps.

## Implementation

[DERIVED] The tensor contract is selected images $[B,n_f,h_v,w_v,c_v]$, presentation times $[B,n_f]$, validity masks and source identities. Variable frame rates use source presentation times rather than index divided by a guessed rate. Spatial padding remains masked, and model position coordinates remain separate from seconds. Device transfers, decode workspace and rejected candidate features belong in the resource ledger.

[OFFICIAL-DOCUMENTATION] The pinned April-release NVIDIA model card lists video sampling limits and supported runtimes; these are release-specific interface disclosures, not evidence that arbitrary frame counts or a particular streaming controller are supported [R57.12, Input(s); Software Integration]. PyTorch (reference stack §4 #17, Core training framework), Hugging Face Transformers (#26, Model-definition layer) and the serving layer have distinct roles. No executable integration was run here.

## Experimental design

### Reported experiments

[PAPER-REPORTED] VT-Contrast trains on SSv2 and evaluates TOMATO, TempCompass and Vinoground with view/token/difficulty ablations. Its matched 2B objective comparison reports TOMATO 29.45→31.47 at weight 0.1; Table 1 also contains regressions for 4B settings, including 8-frame Vinoground Video 31.80→29.00 [R57.1, §4, Tables 1–3; Appendix B]. These are source results, not book measurements.

[DERIVED] For model choice, prioritize the matched objective comparison over cross-backbone ranking. Reordered views preserve static frame content but can alter task validity; the evaluation must identify tasks for which labels should change. Model-specific layer sets, extra training views, token budgets and selection overhead are part of the comparator, rather than free improvements.

## Observations

**What the paper claims.** [PAPER-REPORTED] Direct video-token supervision improves overall temporal understanding in its evaluated backbones and tasks [R57.1, §4].

**What the evidence shows.** [DERIVED] Gains are conditional, and individual task regressions remain visible. Neither the auxiliary objective nor ordered inputs remove the observation bound in Eq. 57.1.

**What we infer.** [DERIVED] Adopt temporal supervision only when same-information, same-budget held-out temporal distinctions improve enough to meet the target acceptance rule. Prefer a simpler observation contract if both satisfy it.

**What remains unknown.** [UNVERIFIED] Independent reproduction and the deployment-specific distribution of brief, occluded events remain unmeasured. These gaps block a universal sampling or compression recommendation.

## Failure modes

> **Failure mode — Timestamped duplicates.** [DERIVED] *Symptom:* apparent motion coverage increases without new evidence. *Cause:* repeated decoded frames receive new times. *Detection:* source frame identities and presentation times disagree. *Mitigation:* validate identities and retain a gap when decoding fails.

> **Failure mode — Invalid temporal counterfactual.** [DERIVED] *Symptom:* reordered training pairs preserve the answer or frame-drop positives remove decisive evidence. *Cause:* augmentation semantics do not match the task. *Detection:* audit paired labels and transition visibility. *Mitigation:* restrict augmentations or exclude ambiguous pairs.

## Siblings

[DERIVED] Uniform sampling controls coverage; novelty selection reallocates observation budget; clip encoders control local interaction; retained-state compression controls future accessibility. They intervene at different stages and can compose, but a gain from one does not establish another's value. Keep the observed media prefix, admitted tokens and target questions fixed when comparing their effects.

## Extensions

[DERIVED] Representation-level contrast is an alternative to simply adding frames. Its decisive advantage would be improved transition discrimination at matched observation cost. Reopen the choice if denser clips recover brief events that the contrastive representation still misses; that result identifies observation coverage, rather than a failure of the contrastive loss alone, as the controlling obstruction.

```figure
id: fig-57.5
kind: compare
title: Temporal interventions and retained distinctions
caption: Compare intervention level before comparing scores. No row asserts a universal ranking or recovery of unseen evidence.
evidence: DERIVED
source: DERIVED:eq-57.4
alt: The comparison separates uniform sampling, clips and retained summaries by their controlled variable, preserved information and failure boundary.
spec:
  axis: location of the temporal information intervention at a fixed task
  columns:
    - {id: grid, label: Uniform grid}
    - {id: clip, label: Local clips}
    - {id: summary, label: Retained summary}
  rows:
    - {dimension: Controls, values: {grid: observation spacing, clip: cross-frame interaction, summary: historical state size}}
    - {dimension: Preserves, values: {grid: declared time coverage, clip: local adjacency, summary: selected task distinctions}}
    - {dimension: Cannot certify, values: {grid: event detection, clip: occluded trajectory, summary: arbitrary future answers}}
```

## Limitations

[DERIVED] A defensible stopping condition is a declared query family with acceptable error and resource bounds, not exhaustion of a frame budget. The preferred representation reverses when another method meets that same rule with lower complete cost, or when a counterexample violates a required temporal distinction. Unrestricted future questions leave Eq. 57.4 unresolved for finite lossy memory.

## Reproducibility

[DERIVED] Retain media checksum, timebase, decoded IDs, sampling phase, clip boundaries, resolution, processor revision, actual token counts, contrastive layer/view choices and seeds. Preserve rejected candidates and their costs. [Verification](verification.md) specifies unexecuted interventions; no decoder, encoder or benchmark run was performed for this chapter.

## References

[DERIVED] [R57.1](references.md#r57-1), inspected v1 on 2026-10-25; [R57.12](references.md#r57-12), immutable card revision. All new research uses the declared March–October 2026 evidence window.
