---
id: ms.section.55.3
entity_type: section
title: Instruction and reasoning data
volume: 3
part: 10
chapter: 55
section: 55.3
slug: 55-3-instruction-and-reasoning-data
parent: ms.chapter.55
prev_sibling: ms.section.55.2
next_sibling: ms.section.55.4
children: []
prerequisites: [ms.chapter.18, ms.chapter.31, ms.chapter.49, ms.chapter.50]
downstream: [ms.chapter.57, ms.chapter.63]
related: [ms.chapter.15, ms.chapter.42]
relations: []
axes: {lifecycle: [inference, evaluation], mechanism: [visual_representation, spatial_sampling], feedback_setting: [], modality: [image, text]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 55.3 - Instruction and reasoning data

## Scope

[DERIVED] The required result is a training and evaluation distribution that distinguishes visual recognition, binding, evidence access and computation. This section owns visual instruction construction for VQA, grounding, counting, diagrams, charts, OCR and compositional queries. It does not equate a generated reasoning trace with the model's internal computation. Generic supervised/post-training objectives belong to the earlier learning chapters; Sec. 55.2 supplies their multimodal interface. Acceptance requires correct answers and, where the task demands it, correct evidence and valid transformations under controlled perturbations.

## Why this exists

[DERIVED] An instruction dataset can inadvertently reward answering from the question alone, copying annotation artifacts, or treating a teacher's plausible explanation as evidence. The same answer string may result from reading the image, memorizing a document, guessing from choices, or exploiting a template. A successful training run does not identify which route was learned. The controlling obstruction is supervision that fails to distinguish the desired behavior from these shortcuts. Adding more examples of an ambiguous target can reinforce the ambiguity.

## Intuition

[MATHEMATICALLY-DERIVED] Consider a question asking whether one displayed series exceeds another. A counterfactual image with the series values exchanged should reverse the answer while preserving question wording and style. A paraphrase that keeps the requested comparison unchanged should preserve the answer. These two interventions test different invariances: dependence on relevant visual content and independence from irrelevant linguistic form. They do not establish an internal causal mechanism, but they rule out some incorrect input-output rules on the tested pairs.

```figure
{
  "id": "fig-55.9",
  "kind": "diagram",
  "title": "Construct and challenge one grounded instruction",
  "caption": "Structured source data yields a rendered observation, question, evidence and executable operation. Relevant-content changes should alter the answer when specified; irrelevant-style changes should preserve it. Failed checks enter a rejection ledger rather than silently changing the target.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-55.11",
  "alt": "Structured source data yields a rendered observation, question, evidence and executable operation. Relevant-content changes should alter the answer when specified; irrelevant-style changes should preserve it. Failed checks enter a rejection ledger rather than silently changing the target.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "latent",
        "kind": "dataset",
        "label": "Source group and latent data"
      },
      {
        "id": "render",
        "kind": "process",
        "label": "Render observation"
      },
      {
        "id": "record",
        "kind": "state",
        "label": "Question evidence operation answer"
      },
      {
        "id": "change",
        "kind": "process",
        "label": "Content / style interventions"
      },
      {
        "id": "check",
        "kind": "branch",
        "label": "Validate target and visibility"
      },
      {
        "id": "keep",
        "kind": "dataset",
        "label": "Accepted record"
      },
      {
        "id": "reject",
        "kind": "state",
        "label": "Rejected with reason"
      }
    ],
    "edges": [
      {
        "from": "latent",
        "to": "render"
      },
      {
        "from": "render",
        "to": "record"
      },
      {
        "from": "record",
        "to": "change"
      },
      {
        "from": "change",
        "to": "check"
      },
      {
        "from": "check",
        "to": "keep",
        "label": "passes"
      },
      {
        "from": "check",
        "to": "reject",
        "label": "fails"
      }
    ]
  }
}
```


## Formulation

[DERIVED] Represent a supervised instance as $(I,q,e,o,y,\pi)$: image, question, evidence elements, required operation, target answer and provenance. Evidence may include object identities/boxes, OCR spans, chart series or table cells. The operation specifies what must be computed after evidence is read: counting a set, selecting an ordinal position, comparing aligned quantities, following a diagram path or composing relations. Provenance includes original data, rendering parameters, annotator/teacher identities and split group. Missing evidence is distinct from a deliberately answer-only annotation.

[MATHEMATICALLY-DERIVED] For a visible object set $\mathcal O$, a count query with predicate $P$ requires

$$
y=\sum_{o\in\mathcal O}\mathbf1[P(o)],\qquad
\widehat y-y=\mathrm{FP}-\mathrm{FN}
$$
*(Eq. 55.9)*

where FP and FN count spurious and missed qualifying instances under a one-to-one matching convention. Correct total count can result from cancellation, so counting accuracy alone does not certify grounding. Overlapping detections, occlusion and class ambiguity must be evaluated before treating a detector's list as oracle evidence. If the question adds relations such as 'left of the red object', $P$ depends on correctly bound identities and coordinates, not just class frequencies.

[MATHEMATICALLY-DERIVED] On a directed loop with $M$ distinct positions, start index $s$, stride $k\geq1$ and the start counted first, the $N$-th counted position is

$$
j_N=(s+(N-1)k)\bmod M.
$$
*(Eq. 55.10)*

where indices are zero-based and direction is absorbed into signed $k$ if needed. A maze requires extracting a valid successor relation before this reduction applies. Failure at large $N$ may reflect graph extraction, modular arithmetic, output length or format compliance. It cannot be attributed uniquely to a finite 'working memory' capacity from final accuracy alone.

[PAPER-REPORTED] OrdinalBench varies loop/maze arrangement, object count, ordinal magnitude and stride, with 39,000 generated questions. Its metrics include final answer, valid-trace coverage, longest correct prefix and step accuracy; some API models use stratified subsets rather than the complete test [R55.6, Secs. 3-4]. Reported Qwen2.5-VL-7B single-loop accuracy drops from 42.62% at stride one to 11.80% at stride two. The source's procedural interpretation is a hypothesis; structured output failures and the different evaluated subsets constrain attribution.

[MATHEMATICALLY-DERIVED] For a chart reading $v=a+br$ from a calibrated linear axis, where $r$ is a raster coordinate, coordinate error $\delta r$ gives $\delta v=b\delta r$. Comparing two readings gives

$$
\widehat\Delta-\Delta=b_1\delta r_1-b_2\delta r_2,\qquad
|\widehat\Delta-\Delta|\leq |b_1|\epsilon_1+|b_2|\epsilon_2.
$$
*(Eq. 55.11)*

where $|\delta r_i|\leq\epsilon_i$ and both calibration maps are valid. The sign of a difference is certified only if its error interval excludes zero. Log axes require transforming through the logarithmic calibration; comparing bar heights from differently scaled panels without calibration is inadmissible. Units, baselines, legends and missing values are part of the evidence, not presentation details.

```figure
{
  "id": "fig-55.10",
  "kind": "calculator",
  "title": "When a chart difference is numerically resolved",
  "caption": "Analytical bound for two linear calibrated axes: value error is bounded by the sum of absolute units-per-pixel slopes times coordinate error bounds. A predicted difference must exceed this bound in magnitude to certify its sign under these premises.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-55.11",
  "alt": "Analytical bound for two linear calibrated axes: value error is bounded by the sum of absolute units-per-pixel slopes times coordinate error bounds. A predicted difference must exceed this bound in magnitude to certify its sign under these premises.",
  "spec": {
    "tex": "\\epsilon_\\Delta=|b_1|\\epsilon_1+|b_2|\\epsilon_2",
    "equation": "55.11",
    "inputs": [
      {
        "symbol": "b1",
        "label": "First axis units per pixel",
        "default": 0.5,
        "min": 0.01,
        "max": 10,
        "format": "fixed2"
      },
      {
        "symbol": "e1",
        "label": "First coordinate error pixels",
        "default": 1,
        "min": 0,
        "max": 10,
        "format": "fixed1"
      },
      {
        "symbol": "b2",
        "label": "Second axis units per pixel",
        "default": 0.5,
        "min": 0.01,
        "max": 10,
        "format": "fixed2"
      },
      {
        "symbol": "e2",
        "label": "Second coordinate error pixels",
        "default": 1,
        "min": 0,
        "max": 10,
        "format": "fixed1"
      }
    ],
    "outputs": [
      {
        "symbol": "bound",
        "label": "Difference error bound in value units",
        "formula": "b1*e1+b2*e2",
        "format": "fixed2"
      }
    ]
  }
}
```


## Mechanism

### Methodology

[DERIVED] VQA annotations should specify answer equivalence and whether image-free success is allowed. Grounding adds a page/object/region reference and a matching rule. OCR requires normalization policies for whitespace, Unicode, ligatures and mathematical notation without silently rewriting the source. A diagram task needs node identities, edge direction and the particular relation queried; nearby labels need not belong to the nearest shape. Chart tasks need underlying values, rendering parameters and a question operation whose answer can be recomputed. Compositional instructions must bind attributes and relations to entities; testing individual object names does not test their composition.

[DERIVED] A defensible synthesis pipeline begins with structured latent data and an executable answer function, renders it, then verifies that the rendered observation still exposes the requested evidence. The same latent scene should not appear across train/test with only colors, fonts or paraphrases changed unless that transfer is the explicit target. Split by source document, latent scene, template family or entity group as required. Rejecting hard cases because annotators disagree changes the distribution; record the rejected fraction and audit which phenomena disappear.

[PAPER-REPORTED] Qianfan-OCR constructs document, chart, table, multilingual and information-extraction data, with optional layout-before-answer supervision and coordinate-aware augmentation [R55.1, Sec. 3.2]. Its stage ablation is performed on a Qianfan-VL-8B configuration, whereas the main OCR model uses a 4B language backbone [Sec. 4.2, Table 2]. That ablation cannot be presented as an isolated causal estimate for the final model. Teacher agreement and rendering validity reduce some label errors without establishing independent ground truth.

[PAPER-REPORTED] Counterfactual Phrase Intervention first removes coarse mismatches, then ranks surviving pairs by similarity drops after controlled nonce substitutions. Replacement controls tokenizer length and surface form; its score is scorer sensitivity, explicitly not mutual information or causal identification [R55.4, Secs. 4-5]. In book notation,

$$
\Delta_{ij}=s(I_i,T_i)-s(I_i,T_i^{(j)}),\qquad\mu_i=K_i^{-1}\sum_{j=1}^{K_i}\Delta_{ij}.
$$
*(Eq. 55.12)*

where $T_i^{(j)}$ changes one selected lexical target and $K_i>0$ counts valid substitutions. Ranking by a z-score of $\mu_i$ gives the same order as ranking by $\mu_i$ when its standard deviation is positive; zero variance needs an explicit policy. This normalization cannot add identification power. For $N$ pairs and $K_i$ substitutions, scoring requires $N$ image encodings and roughly $\sum_i(1+K_i)$ text encodings when image states are reused. Selection overhead belongs in the training-economics comparison.

[DERIVED] Equal subtoken count controls sequence length but does not bound movement in embedding space. A Taylor interpretation of a finite replacement additionally needs a differentiable interpolation path and a bound on curvature/remainder. Nonce text can be out of distribution. Therefore a large score drop can indicate scorer sensitivity to unnatural text rather than a correctly grounded phrase. Check alternative nonce realizations, content-preserving edits and unrelated-phrase controls; transfer to an independently trained scorer is consequential next evidence, not a guaranteed property.

## Algorithm

### Algorithm 55.3 — Bounded construction of grounded instruction records

[DERIVED] Inputs are finite source groups, allowed render/annotation operations, a task validator, a split policy and a finite attempt cap. Output is an accepted provenance-preserving dataset plus a rejection ledger.

$$
\begin{aligned}
1.&\quad \text{freeze source groups and split assignments before generating variants}.\\
2.&\quad \text{for each bounded attempt: construct }(I,q,e,o,y,\pi)\text{ from one allowed group}.\\
3.&\quad \text{recompute }y\text{ from structured evidence when possible; validate rendering and coordinate transfer}.\\
4.&\quad \text{apply relevant-content and irrelevant-style interventions; record failures rather than relabel silently}.\\
5.&\quad \text{if evidence, answer, license or split checks fail: append a rejection; consume the attempt; continue}.\\
6.&\quad \text{otherwise append one immutable record; deduplicate within the permitted split; stop at cap or exhaustion}.
\end{aligned}
$$

[DERIVED] The invariant is that no accepted record loses its source group or answer derivation. Annotation refinement has its own finite round cap and routes unresolved cases to review. A rejected example consumes work and stays in coverage accounting. Costs include rendering, OCR/teacher calls, human adjudication and scoring; a smaller retained training set is not automatically a cheaper complete pipeline.

## Implementation

[DERIVED] Store task answers in typed fields before serializing natural language. For tables retain numeric value, displayed string, unit, row/column spans and footnotes; for counting preserve detection identities rather than only totals. A detector prompt should identify its threshold, duplicate suppression, coordinate convention and class ontology. Do not concatenate a confidence number without a meaning the decoder was trained to interpret. Masks must distinguish absent evidence, illegible evidence and a legitimate negative answer.

[PAPER-REPORTED] GroundCount tests detector-to-text prompts and feature fusion, including a 3-by-3 position encoding and a default detector confidence threshold of 0.5 [R55.5, Sec. IV]. This supplies an explicit intermediate observation rather than making the detector infallible. The study reports gains for four of five model families, while full augmentation reduces InternVL3.5-1B accuracy from 64.0% to 62.5% [Sec. V]. A lower threshold harms its tested configurations; the evidence supports a task-specific precision/recall tradeoff, not a theorem that detector precision always outweighs recall.

[MATHEMATICALLY-DERIVED] Prompt augmentation adds detector execution, transfer and text-prefill cost, but may change generated length. Feature fusion adds trainable projections/attention and activation storage. If $D$ detected objects each produce $c$ tokens, prompt length grows by approximately $cD$ before tokenizer-dependent variation. Detector errors can therefore affect both answer quality and service time. Hardware-specific latency claims require the complete boundary in Sec. 55.6; this section infers no speedup from fewer output tokens alone.

## Experimental design

### Reported experiments

[PAPER-REPORTED] CPI compares full data, random half data, global-alignment half data and its curated half data from a 2.22M-pair pool, with two training seeds [R55.4, Secs. 6-7]. ChartDiff instead evaluates comparative summaries of paired rendered charts, including lexical-overlap and model-judged scores, with a 300-summary human-rating comparison [R55.7, Secs. 3-4]. These protocols answer different questions: curation transfer and comparative chart summarization.

## Observations

**What the paper claims.** [PAPER-REPORTED] CPI reports improved compositional transfer at half retention; its stricter SugarCrepe++ overall metric remains below alignment-only filtering, 45.60 versus 45.75 [R55.4, Table 3]. This is not uniform dominance.

**What the evidence shows.** [PAPER-REPORTED] ChartDiff's specialized models can score higher on ROUGE while scoring lower under its judge [R55.7, Table 2]. The source acknowledges model-generated annotations and an imperfect automatic evaluator. Agreement with human ratings does not independently certify every extracted numerical claim.

**What we infer.** [DERIVED] Evidence, answer computation and evaluator behavior need separate tests. A model can improve a textual similarity metric without improving the requested visual operation. A structured evidence path makes counterexamples inspectable.

**What remains unknown.** [UNVERIFIED] Independent reproduction of these current reports, robustness to unseen diagram grammars and the fidelity of generated traces to hidden computation remain unresolved. The chapter does not convert benchmark errors into a unique cognitive diagnosis.

```figure
{
  "id": "fig-55.11",
  "kind": "stat-panel",
  "title": "Count agreement can conceal instance errors",
  "caption": "Analytical count example: two missed qualifying objects and two spurious detections cancel in the total. Instance-level matching still exposes four errors. Correct counts alone do not certify visual grounding.",
  "placement": "rail",
  "anchor": "observations",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-55.9",
  "alt": "Analytical count example: two missed qualifying objects and two spurious detections cancel in the total. Instance-level matching still exposes four errors. Correct counts alone do not certify visual grounding.",
  "spec": {
    "header": "ILLUSTRATIVE COUNT CANCELLATION",
    "variables": {
      "trueCount": 8,
      "falsePos": 2,
      "falseNeg": 2
    },
    "rows": [
      {
        "key": "True qualifying instances",
        "formula": "trueCount",
        "format": "integer"
      },
      {
        "key": "Predicted total",
        "formula": "trueCount+falsePos-falseNeg",
        "format": "integer"
      },
      {
        "key": "Count error",
        "formula": "falsePos-falseNeg",
        "format": "integer"
      },
      {
        "key": "Instance errors",
        "formula": "falsePos+falseNeg",
        "format": "integer"
      }
    ]
  }
}
```


## Failure modes

> **Failure mode - Correct number, wrong instances.** [DERIVED] *Symptom:* the count is right while cited objects include duplicates and omissions. *Cause:* FP and FN cancel in Eq. 55.9. *Detection:* score instance matches and count jointly. *Mitigation:* retain object identities and evaluate the predicate before aggregation.

> **Failure mode - Template leakage.** [DERIVED] *Symptom:* answer-only evaluation improves while counterfactual images leave outputs unchanged. *Cause:* source scenes or question templates leak answer cues across splits. *Detection:* image-free, shuffled-image and source-group holdouts. *Mitigation:* split before variant generation and test paired relevant-content edits.

## Siblings

[DERIVED] Use source-derived executable targets when latent structure is available and rendering faithfully preserves it. Use human adjudication when the requested semantics exceed the executable validator. Teacher consensus is admissible as a labeled reliability tier, not as independent truth. A detector route is preferred only if its task errors and complete service cost beat direct VQA under the same information regime. Oracle evidence that fails to help redirects investigation toward the operation/evaluator; improvement only with oracle evidence redirects it toward perception or retrieval. These outcomes determine the next change.

## Extensions

### Improvements

[DERIVED] Current methods improve different interfaces: CPI changes which paired examples are seen; GroundCount changes the observation available to a decoder; Qianfan's layout supervision changes the intermediate target. Their gains are not additive by logical necessity. A combined experiment should preserve a fixed base corpus, downstream evaluator and source split while changing one mechanism at a time, then test the interaction. Diagram transfer needs held-out topology and labeling rules, since a chart or OCR score does not supply that evidence.

## Limitations

[DERIVED] Synthetic control isolates selected factors at the cost of a restricted visual distribution. Real photographs introduce occlusion and ambiguous categories; documents introduce scanning defects and shared templates. Neither distribution alone certifies broad visual reasoning. Stop at the task-specific acceptance rule and reopen when a new input class, stronger matched comparator or failed annotation assumption changes the decision.

## Reproducibility

[DERIVED] Publish render seeds, latent records, source-group split hashes, annotation rules, teacher versions, nonce generator/tokenizer, exclusions, detector settings and evaluator prompts. Retain invalid outputs in the denominator under the declared policy. The book's component interventions and oracle tests are proposed in [verification](verification.md), with no model execution claimed.

## References

[R55.1](references.md#r55-1), Secs. 3-4; [R55.4](references.md#r55-4), Secs. 4-7; [R55.5](references.md#r55-5), Secs. IV-V; [R55.6](references.md#r55-6), Secs. 3-4; [R55.7](references.md#r55-7), Secs. 3-4 and limitations.
