---
id: ms.verification.55
entity_type: verification
title: Chapter 55 verification and topic audit
volume: 3
part: 10
chapter: 55
section: null
slug: verification
parent: ms.chapter.55
prev_sibling: ms.section.55.6
next_sibling: ms.references.55
children: []
prerequisites: [ms.chapter.18, ms.chapter.31, ms.chapter.49, ms.chapter.50]
downstream: [ms.section.55.2, ms.section.55.6, ms.chapter.57]
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

# Chapter 55 - Verification and topic audit

## Artifact specification

[DERIVED] The planned artifact is **a vision/document evaluation with component ablations**. These protocols are unexecuted proposals. They specify conditional decisions, not expected performance measurements.

| Joined record | Required fields |
|---|---|
| sources.jsonl | Document/image id, original byte hash, physical/logical page map, licensing/access scope, source group and split |
| views.jsonl | Decoder/rasterizer/processor revision; orientation/color; crop rectangle; coordinate convention; transform; realized grid/tiles/tokens |
| models.jsonl | Model and adapter hashes; visual encoder/fusion/decoder shapes; trainable groups; dtype; exact runtime/kernel versions or UNVERIFIED |
| evidence.jsonl | Element ids/types/boxes; OCR; header/span/reading/reference graph; selected pages; query variants and fallbacks; oracle status |
| outputs.jsonl | Raw/normalized answer; reference; evidence citations; operation result; acceptance; timeout/invalid/abstention; original condition/cohort |
| resources.jsonl | Offered/admitted/start/first/final/cleanup times; pixels/tokens; feature/KV/reservation peak; transfers; cache type/sets; meter boundary |
| decision.md | Acceptance target, coverage/resource cap, comparator, uncertainty, consequential next evidence, reversal and stopping rule |

## Acceptance and uncertainty

[ASSUMED] Proposed study parameters are chosen before running: grouped held-out test; minimum accepted coverage $C_{\min}$; upper acceptable answer/support risk $R_{\max}$; memory/cost caps and service deadlines. Their numerical values depend on the intended application and are not invented here. *Sensitivity:* changing those targets can change which candidate is admissible; it cannot retrospectively change measured outcomes.

[DERIVED] Use paired outcomes on immutable ids. Bootstrap or resample source documents/latent scenes rather than individual paraphrases when observations share evidence. Report confidence intervals and the number of independent groups. The all-attempt denominator retains failed processing, invalid outputs, timeouts and abstentions. Define missing telemetry separately from zero consumption. Select thresholds/hyperparameters on development data and evaluate once on held-out data; a failed evaluator invalidates attribution rather than the model alone.

### Experiment 55.1 — Pixel geometry and observation sufficiency

**Hypothesis.** [ASSUMED] A declared crop/resize transform preserves source-coordinate identity, while some target distinctions fail below a controlled sampling level.

**Setup.** Freeze immutable source rasters, processor and answer rules. Include integer crop boundaries, odd sizes, padding, rotations, recursive crops and single-pixel output cases. Maintain pixel-edge and integer-center reference calculations separately.

**Independent variables.** Crop/tiling policy, interpolation/antialiasing, resolution, source quality and coordinate convention.

**Controlled variables.** Original pixels, question, model/fusion weights, decoder/evaluator, answer semantics and token caps.

**Dataset/workload.** Programmatically generated landmarks/glyph pairs plus held-out real document pages grouped by source. Each target remains labeled answerable, illegible or changed after processing.

**Hardware.** CPU reference geometry; selected inference device/runtime pinned before execution. No device is assumed already validated.

**Metrics.** Round-trip coordinate error, box/landmark agreement, realized visual tokens, answer/support error, selective coverage and complete processing cost.

**Baselines.** Whole-image resize, fixed tiles with transforms, larger view and oracle OCR/structure; SCVER only if the supported pinned implementation is executable.

**Expected result.** No accuracy value is presumed. A half-pixel implementation mismatch should produce a geometric counterexample under the corresponding nonidentity resize. Semantic loss may persist after geometrically correct transfer.

**Ablation.** Drop padding offsets, change center convention, remove global view, vary overlap and compare retained-feature access separately from acquiring new pixels.

**Interpretation.** A geometry failure requires implementation repair. Correct geometry with an oracle-only gain motivates observation/interface investigation. Wrong oracle answers redirect work toward operation/evaluator. Better matched-resource views reverse the preferred policy.

**Threats to validity.** Synthetic rendering bias, answerability changes, oracle localization leakage, source compression artifacts and unspecified sampler boundary semantics.

### Experiment 55.2 — Objective, bridge and readout attribution

**Hypothesis.** [ASSUMED] Pooled similarity performance does not determine dense downstream performance under every bridge/decoder.

**Setup.** Freeze the data split, samples-seen budget and evaluator. Compare objective families with explicit masks/denominators, trainable groups and regularizer gather semantics. Distinguish encoder pretraining runs from bridge seeds.

**Independent variables.** Pair objective versus prediction/distributional objective, pointwise bridge versus fixed-slot resampler, frozen versus joint adaptation and downstream language model.

**Controlled variables.** Encoder scale, source data identities/download availability, visual resolution, downstream examples and checkpoint-selection rule; report unmatched compute rather than hiding it.

**Dataset/workload.** Global matching/classification, dense recognition and document/VQA tasks using source-group holdouts and relation-sensitive examples.

**Hardware.** Exact training topology, framework, precision, optimizer and communication implementation pinned before any run; no reproduced configuration is claimed here.

**Metrics.** Task-specific accuracy, representation variability, bridge gradients, retention loss, samples/tokens, actual FLOPs where measurable, peak state, collective bytes and complete training time/energy.

**Baselines.** Same encoder with common readout; same bridge with swapped encoders; stronger matched-budget supervised model; joint adaptation with retention constraints.

**Expected result.** No ordering is assumed. A readout-dependent rank reversal would reject a universal encoder ranking; zero bridge gradients would invalidate the corresponding training comparison.

**Ablation.** Predictor/regularizer removal, detached path mistakes, resampler slot count, loss normalization and independent pretraining seeds where resources permit.

**Interpretation.** Accept a candidate only on its intended consumer and retained-capability rule. A stronger equal-resource readout or failed distribution/gradient condition reverses preference. Insufficient independent runs leave uncertainty unresolved.

**Threats to validity.** Different downloaded corpora, hidden optimizer tuning, correlated bridge seeds, unequal training FLOPs and frozen-module gradient mistakes.

### Experiment 55.3 — Grounded instructions and compositional control

**Hypothesis.** [ASSUMED] Executable targets and paired relevant-content changes expose shortcut solutions that answer-only metrics miss.

**Setup.** Split by source/latent scene before generating variants. Preserve $(I,q,e,o,y,\pi)$ and separate human, executable and teacher-derived label tiers.

**Independent variables.** Instruction/data selection rule, detector prompt features/threshold, chart complexity, diagram topology, ordinal stride and lexical paraphrase.

**Controlled variables.** Source group, latent quantities, question intent, rendering budget, model and evaluator; identify target-changing interventions explicitly.

**Dataset/workload.** Counting with instance identities, ordinal loops/mazes, chart pairs with source values, diagram path queries, OCR scripts and attribute/relation binding.

**Hardware.** Pinned rendering environment plus selected model device/runtime; detector overhead and teacher calls included rather than assumed negligible.

**Metrics.** Answer and instance correctness, operation/trace validity, content-change sensitivity, style invariance, rejected-record coverage, annotation effort and complete pipeline cost.

**Baselines.** Random/size-matched selection, alignment-only selection, direct VQA, detector-only and oracle object/graph/table evidence.

**Expected result.** No selection gain is assumed. FP/FN cancellation can produce correct counts with wrong grounding. A nonce sensitivity score may fail to transfer to a different scorer.

**Ablation.** Nonce realizations and unrelated replacements, no-position/no-confidence detector prompts, diagram-label swaps, chart-axis scales and group-split controls.

**Interpretation.** A source-group leak invalidates transfer claims. Correct oracle structure but wrong rendered answers motivates perception; wrong oracle operations motivate computation. A cheaper matched-information baseline can reverse augmentation preference.

**Threats to validity.** Teacher/scorer dependence, nonce distribution shift, generated-image artifacts, accepted-only label bias, malformed-output exclusions and unverified latent-source deduplication.

### Experiment 55.4 — Document structure and retrieval versus reading

**Hypothesis.** [ASSUMED] Retrieving all annotated pages does not guarantee correct structural binding or answer use.

**Setup.** Freeze PDFs and physical/logical page maps. Validate graph consistency and table span/header associations before comparing retrieved pages, oracle pages, plain transcription and oracle structure.

**Independent variables.** Parser path, query variants/candidate depth, context distractors, page count and structural oracle condition.

**Controlled variables.** Reader, source rendering, answer prompt and evidence budget; log every fallback and changed condition.

**Dataset/workload.** Held-out real documents with tables, formulas, figures, footnotes, multi-column order and multi-page evidence; split and bootstrap by byte/source group.

**Hardware.** Index build and serving hardware/runtime pinned separately, with storage, memory and query-generation costs recorded.

**Metrics.** Retrieval coverage, answer/support error, header/value binding, reference resolution, parser validity, index bytes, retrieval/reading service cost and paired confidence intervals.

**Baselines.** Original-query deeper retrieval at matched cost, text retrieval, visual late interaction, direct page reading and gold structure/pages.

**Expected result.** No overall gain is assumed. A correct page citation with a wrong extracted value would falsify citation-as-support equivalence. More query variants may increase distractors despite better recall.

**Ablation.** Remove header hierarchy, units, footnotes or caption associations one at a time; vary rank fusion and duplicate expansions; separate annotation granularity from semantic content.

**Interpretation.** A gold-page gain motivates evidence access; a gold-structure gain motivates parser/binding; persistent oracle failure motivates operation/evaluator. A fixed-query stronger comparator can reverse query-expansion preference.

**Threats to validity.** Nonexhaustive gold evidence, question-specific oracle leakage, PDF aliases, all-page batching/synthesis differences and evaluator partial-credit artifacts.

### Experiment 55.5 — Fixed-cohort visual conflict and selective reliability

**Hypothesis.** [ASSUMED] Lower model-specific prior adherence can coexist with unchanged full-population correctness or altered filtered membership.

**Setup.** Freeze all original item ids and the blank-answer protocol. Report full set, base-fixed conflicts, preregistered shared conflicts and each model's own conflicts, with an explicit empty-cohort policy.

**Independent variables.** Model adaptation, source resolution/crop, visual distractors, answer language and acceptance threshold selected on development data.

**Controlled variables.** Reference semantics, immutable question/image pairing, answer normalization, probability extraction and evaluator; mark language translations independently checked or unresolved.

**Dataset/workload.** Rare prior-conflict items and representative document questions, including more than two choices, invalid outputs and abstentions.

**Hardware.** Pinned model runtime or exact provider model/version; inaccessible logits are unavailable evidence, not estimated by verbal confidence.

**Metrics.** Full/cohort paired correctness, blank-answer transitions, prior/correct/other partition, support error, risk-coverage, log-odds shift and grouped uncertainty.

**Baselines.** Base model, unchanged prior elicitation, image-free/shuffled-image controls and fresh oracle-evidence conditions; compare at equal coverage and resource constraints.

**Expected result.** No adaptation gain is presumed. A move from prior to another wrong answer lowers adherence without improving correctness. Changing filter membership can alter the aggregate without a same-item gain.

**Ablation.** Fixed versus moving cohorts, alternate valid answer serialization, language variants, content-preserving visual edits and threshold sweep with fixed test membership.

**Interpretation.** A moving-cohort effect requires reanalysis before adaptation claims. An evaluator/language mismatch requires measurement repair. A fixed-population risk reduction at acceptable coverage/resource is actionable; overlapping uncertainty remains inconclusive.

**Threats to validity.** Model-dependent filtering, stochastic membership, answer-token versus sequence probabilities, translation artifacts, selective refusal and reused development/test priors.

### Experiment 55.6 — Visual cache, resolution and admitted-service frontier

**Hypothesis.** [ASSUMED] Approximate visual reuse has model/workload-dependent amortization and a separate evidence-risk cost.

**Setup.** Replay a fixed request sequence/arrival process with immutable source/processor/model versions. Include paired small edits and complete event/resource accounting from admission to cleanup.

**Independent variables.** Resolution/tiles, batch buckets, exact/approximate/fresh path, cache capacity/locality, warmup/recompute/reuse policy and bounded zoom.

**Controlled variables.** Questions and source edits, output cap, model precision, hardware/topology, evaluator and accepted-coverage rule; distinguish cache warmth and request subsets.

**Dataset/workload.** Documents/screenshots with single-cell, glyph, unit and color changes; repeated and novel requests; mixed input/output lengths and concurrency; cancel/OOM/expired-version cases.

**Hardware.** Exact accelerator/CPU/storage/network and pinned runtime/kernel configuration selected before execution, including cache and feature capacities.

**Metrics.** Paired fresh-reference answer/support differences, complete latency quantiles, goodput, occupancy/transfers, orphan/quarantined state, energy and full lifecycle cost where measured.

**Baselines.** Fresh computation, exact function-equivalent reuse, fixed larger view, no-zoom policy and stronger matched-budget approximation.

**Expected result.** No speedup or parity is presumed. Approximate reuse may lose on short inputs or changed fine details. A logical timeout must not permit premature reclamation or late publication.

**Ablation.** Encoder versus KV reuse, current-image versus historical features, masks, lookup/warmup/transfer, complete versus wait-only I/O timing and fixed-population cache comparisons.

**Interpretation.** A dependency mismatch invalidates exact reuse; a paired evidence error can exclude approximate reuse; a negative complete-cost result reverses the optimization. A stronger larger-view baseline can invalidate adaptive zoom's claimed advantage.

**Threats to validity.** Changing hit-subset composition, undisclosed engine precision, trace locality, hidden background work, unmetered failures, incomplete asynchronous cleanup and evaluator insensitivity to small edits.

## Topic-completeness matrix

[DERIVED] The manuscript gives mechanism/formulation, state/procedure, implementation/cost, reported protocol/negative observations and conditional decisions for the following planned groups. Reported evidence is bounded; a missing matched ablation is an explicit gap rather than an invented result.

| Required concept / variants | Canonical treatment | Method / mathematical control | Reported evidence and remaining limit |
|---|---|---|---|
| Patches, token budgets |55.1 | Padded-grid count; encoder versus prefix accounting | Qianfan interface quantities; reduction implementation NOT-DISCLOSED |
| Multi-resolution, crop/tiling, spatial positions |55.1 | Pixel-edge and center maps; composed transforms; bounded crop procedure | SCVER resolution/guidance studies; exact released sampler boundary still uninspected |
| Contrastive pretraining and captioning |55.2 | Pair denominators; conditional masked token likelihood | LeVLJEPA global/dense comparisons; Qianfan supervised pipeline; no universal objective ordering |
| Projectors, resamplers, cross-attention |55.2 | Typed bridge; slot compression; recurrent read equation and costs | Bridge-trained source VQA and SCVER access; independent matched resampler/cross-attention ablations remain a proposed obligation |
| Backbone adaptation |55.2 | Frozen gradients versus no-grad, trainable state and retention | LeVLJEPA frozen bridge protocol; GroundCount adaptation comparisons are finite and confounded by training variants |
| VQA, grounding and OCR |55.3 | Typed evidence/operation records; answer and instance metrics | Qianfan/GroundCount/VELD-QA; broad multilingual OCR transfer not reproduced |
| Counting, diagrams, ordinal operations |55.3 | FP-FN cancellation; modular loop; explicit graph/rule extraction | GroundCount and OrdinalBench; generic unseen diagram grammars lack matched evidence |
| Charts and compositional instructions |55.3 | Axis-calibration error bound; relevant-content/style controls; nonce proxy limits | ChartDiff/CPI with negative metrics, scorer/judge dependence and two-seed limits |
| Layout, reading order, page references |55.4 | Typed graph; DAG condition; physical/logical identifiers | Paddle/VELD protocols; graph consistency does not prove correct reading order |
| Tables, formulas, figures |55.4 | Header/span/unit bindings; serialization versus semantics; bounded refinement | Paddle source stage/reward account; Table 8/prose discrepancy retained; independent labels absent |
| Multimodal retrieval |55.4 | Multi-vector MaxSim/RRF and width-aware cost | LITTA and VELD-QA; added queries not always equal compute or better reading |
| Hallucinated visual evidence and distractors |55.5 | Answer/support separation; gold-page/structure interventions | VELD-QA coverage-conditioned analysis; source answer judge is not a citation-faithfulness measure |
| Resolution/spatial failures |55.1/55.5 | Landmarks, crop conventions, answerability and oracle controls | SCVER reported gains; observation loss and internal reasoning are not uniquely identified |
| Answer-language confounds |55.5 | Paired semantic/normalization controls | Methodological treatment is conditional; current-source multilingual causal effect remains UNVERIFIED |
| Preprocessing and token estimates |55.6 | Versioned processor, estimate/reconcile/admit | Source interface quantities plus proposed edge-case tests; named processor numerics incomplete |
| Batching and cache boundaries |55.6 | Padding amplification, full dependencies, exact versus approximate, quiescent cleanup | VisMemo reported mechanism/setup; independent runtime and fresh-reference parity absent |
| Quality/latency under resolution |55.6 | Resource frontier, bounded acquisition, complete service boundary | VisMemo amortization examples and SCVER resolution tests; no book latency/energy run |

## Current review and stopping boundary

[DERIVED] Current authoring inspected primary methods, tables and the stated appendices, reconstructed equations with local premises, wrote six mathematical procedures and 20 purposeful figures, and retained source conflicts/negative results. In-memory manuscript/figure diagnostics are recorded in the current-run audit log. These checks establish structural/renderability conditions; they do not establish independent model performance.

[UNVERIFIED] This remains `manuscript_draft`. Missing execution, numerical kernel parity, source data/license/contamination audit, unseen-language/diagram transfer, fixed-cohort reproduction and loaded-service failure tests prevent a stronger status. Investigation stops at a reviewable current-evidence reference and executable proposal, with reopening conditions above.
