---
id: ms.section.15.2
entity_type: section
title: Context extension
short_title: Context extension
section: 15.2
slug: 15-2-context-extension
parent: ms.chapter.15
prev_sibling: ms.section.15.1
next_sibling: ms.section.15.3
children: []
prerequisites: [ms.chapter.10, ms.chapter.13, ms.chapter.14, ms.section.15.1]
downstream: [ms.chapter.27, ms.chapter.42, ms.chapter.49]
word_count_target: 1900
volume: 1
part: 3
chapter: 15
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [position_representation, long_context], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P01, P46]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 15.2 — Context extension

## Scope

Context extension changes the operating range of an existing position contract. This section covers position interpolation, frequency adjustment, YaRN-style scaling, adaptation data, and compatibility with cached state. The baseline is a checkpoint trained under a known coordinate transformation and length distribution. Success requires an explicit transformation, a reproducible adaptation procedure where used, preservation checks at shorter lengths, and independent long-context evaluation. Increasing an allocation limit alone satisfies none of those requirements.

## Why this exists

**DERIVED.** A checkpoint's supported tensor shape and its training distribution are different constraints. Enlarging an attention mask or cache permits a longer computation, but positions, distances, and evidence configurations can become unfamiliar. The extension problem is therefore a distribution change coupled to a numerical and systems change.

A uniform position rescaling compresses a longer coordinate interval into a shorter interval. This addresses one source of distribution shift while changing distances between nearby tokens. Frequency-dependent schemes seek a different compromise: preserve some local phase behavior while adjusting dimensions associated with broader spatial scales. Adaptation then teaches the model under the resulting geometry.

**PAPER-REPORTED.** Position Interpolation investigates rescaled rotary positions with fine-tuning [R15.3]. YaRN combines frequency-dependent treatment with attention scaling [R15.4]. LongRoPE2 investigates a further search-and-training procedure, including mixed context windows [R15.5]. These are dated mechanisms, not a ranking of universally superior extension recipes.

## Intuition

**MATHEMATICALLY-DERIVED.** Under a uniform stretch factor \(\alpha>1\), a token separation of one becomes a transformed separation of \(1/\alpha\). A formerly familiar long separation may return to the original phase range, but the model must resolve compressed local differences. Extension cannot be understood only at the final token.

Frequency adjustment makes this trade-off nonuniform across rotary pairs. A high-frequency pair and a low-frequency pair have different numbers of rotations over the training window. Treating them identically is one design; selectively rescaling them is another. Neither follows from the maximum target length alone.

> **Definition — Context-extension contract.** The combination of target length, positional transformation, adaptation distribution, numerical implementation, and cache compatibility rules under which an existing checkpoint is extended and evaluated.

## Formulation

**MATHEMATICALLY-DERIVED.** Let \(T_0>0\) be the reference training length and \(T_1\ge T_0\) a target length, both in tokens. For coordinate \(p\in[0,T_1)\), uniform interpolation uses

$$
\alpha=\frac{T_1}{T_0},\qquad p'=\frac{p}{\alpha},\qquad
\omega'_j=\frac{\omega_j}{\alpha}.
$$
*(Eq. 15.5)*

The transformed half-open interval lies within \([0,T_0)\). This ratio maps intervals; it does not equate the last integer coordinate in each interval. Position scaling and frequency scaling are equivalent inside the rotary phase product when every other operation is unchanged.

To reason about selective scaling, define the following illustrative family:

$$
\omega'_j=\omega_j
\left(\frac{1-\gamma_j}{\alpha}+\gamma_j\right),
\qquad 0\le\gamma_j\le1.
$$
*(Eq. 15.6)*

This is a chapter-authored interpolation family, **not the complete YaRN implementation**. A zero coefficient interpolates that frequency; a unit coefficient preserves it. Reproducing a named method additionally requires its actual band boundaries, ramp, magnitude treatment, and training procedure [R15.4].

If both transformed query and key vectors are multiplied by \(\eta>0\), then

$$
\frac{(\eta R(t)q)^\top(\eta R(s)k)}{\sqrt{d_k}}
=\eta^2\frac{q^\top R(s-t)k}{\sqrt{d_k}}.
$$
*(Eq. 15.7)*

Scaling both operands by \(\eta\) multiplies the dot-product contribution by \(\eta^2\). It does not scale independently added biases unless the implementation explicitly does so. This distinction prevents conflating a positional change with a softmax-temperature change.

~~~figure
id: fig-15.6
kind: calculator
title: Interpolated coordinate interval
caption: "Illustrative uniform interpolation maps coordinates, not measured model competence. The target endpoint remains a half-open interval boundary."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-15.5
alt: "With reference length 8192, target length 32768, and position 16000, the factor is four and the transformed position is 4000."
spec:
  tex: p'=pT_0/T_1
  equation: "15.5"
  inputs:
    - {symbol: T0, label: reference length, default: 8192, min: 1024, max: 8192, format: tokens}
    - {symbol: T1, label: target length, default: 32768, min: 32768, max: 131072, format: tokens}
    - {symbol: p, label: logical position, default: 16000, min: 0, max: 32767, format: integer}
  outputs:
    - {symbol: factor, label: stretch factor, formula: T1/T0, format: fixed2}
    - {symbol: mapped, label: transformed position, formula: p*T0/T1, format: fixed3}
states:
  - {anchor: formulation, label: Fourfold interval, variables: {T0: 8192, T1: 32768, p: 16000}, note: "The phase product uses a compressed coordinate."}
  - {anchor: mechanism, label: Larger extension, variables: {T0: 8192, T1: 65536, p: 16000}, note: "The same physical offset receives a different transformed distance."}
  - {anchor: failure-modes, label: Local resolution, variables: {T0: 8192, T1: 131072, p: 1}, note: "Adjacent coordinates are compressed as well."}
~~~

## Mechanism

**DERIVED.** There are three distinct levers. Coordinate interpolation changes the argument of each rotary pair. Base adjustment changes the frequency spectrum: replacing the base in \(\omega_j=a^{-2j/d_r}\) affects different indices differently. Attention magnitude adjustment changes logit concentration. Combining them requires recording the composed operator, not merely a method label.

A useful dimensionless diagnostic is the number of rotations over the reference interval, \(T_0\omega_j/(2\pi)\). Frequencies with many rotations and frequencies with less than one rotation present different extrapolation geometry. This diagnostic motivates inspecting bands; it does not determine optimal boundaries without training or evaluation.

**PAPER-REPORTED.** YaRN develops a particular combination of interpolation choices and attention scaling [R15.4]. LongRoPE2 uses a search objective and mixed-window training to address its investigated extension setting [R15.5]. Neither paper supplies a theorem that arbitrary checkpoints retain all shorter-context capabilities after extension.

**DERIVED.** Adaptation data must make long-range information useful. Concatenating unrelated documents creates long tensors but does not necessarily create supervised dependencies across their boundaries. A defensible dataset design distinguishes naturally coherent sequences, explicitly linked evidence, independent packed examples, and synthetic long-range tasks. Preserve the semantics of boundaries and supervision in every category.

There is also a cache compatibility boundary. If frequencies depend on the current total length and change after prefill, stored keys may have been rotated under an earlier configuration. Rephasing those keys can restore a local geometric relationship only under appropriate conditions; it does not recompute hidden states produced by earlier layers under the old attention operator. Full-prefix equivalence therefore cannot be assumed from a key-rotation patch.

~~~figure
id: fig-15.7
kind: diagram
title: Extension changes three coupled contracts
caption: "The adaptation and evaluation paths share a frozen candidate specification; evaluation findings do not retroactively become independent training evidence."
placement: inline
evidence: DERIVED
source: DERIVED:eq-15.6
alt: "A base checkpoint and explicit position transformation form a candidate. Adaptation data produces an extended checkpoint, which is evaluated for both short and long contexts with a cache-compatibility check."
spec:
  direction: LR
  nodes:
    - {id: base, kind: model, label: Base checkpoint}
    - {id: transform, kind: dependency, label: Position and magnitude configuration}
    - {id: data, kind: dataset, label: Adaptation distribution}
    - {id: train, kind: process, label: Bounded adaptation}
    - {id: candidate, kind: model, label: Extended checkpoint}
    - {id: evaluate, kind: metric, label: Short and long evaluation}
    - {id: cache, kind: boundary, label: Cache compatibility}
  edges:
    - {from: base, to: train, kind: flow}
    - {from: transform, to: train, kind: dependency}
    - {from: data, to: train, kind: flow}
    - {from: train, to: candidate, kind: flow}
    - {from: candidate, to: evaluate, kind: flow}
    - {from: cache, to: evaluate, kind: dependency}
~~~

Extension does not reduce the number of input tokens processed. Dense attention arithmetic, training activation storage, and inference cache occupancy still depend on the physical sequence, even if transformed coordinates are compressed. Training cost also includes candidate search, rejected runs, and shorter-context preservation checks. No energy, latency, or monetary improvement follows from a lower position index.

## Algorithm

**DERIVED — controlled extension protocol.**

~~~text
Algorithm 15.2 — Select an extension without test-set adaptation
INPUT: base checkpoint; finite candidate configurations; adaptation corpus;
       development matrix; sealed test matrix; token and compute budgets
OUTPUT: selected configuration, checkpoint, compatibility record, test report
STATE: immutable base checkpoint and per-candidate budget ledger
INVARIANT: sealed test examples do not influence candidate selection
1. Validate every candidate's coordinate, frequency, and magnitude conventions.
2. Reject candidates whose bounded memory estimate exceeds the experiment budget.
3. Run transformation correctness fixtures before any adaptation.
4. Adapt each retained candidate under its predeclared data and token budget.
5. Evaluate short and long development cells, including cache continuation.
6. Select using the predeclared quality constraints and resource objective.
7. Freeze checkpoint, tokenizer, configuration, and evaluator.
8. Evaluate the sealed matrix once; report failures as well as accepted cells.
~~~

For \(C\) bounded candidates, total work is the sum of their adaptation and evaluation costs, not the cost of the selected checkpoint alone. Candidate selection itself can use a linear scan over precomputed metrics. Budgeting by successful candidates conceals search expenditure.

## Implementation

**OFFICIAL-DOCUMENTATION.** Hugging Face Transformers, **Model definition / adaptation**, lists default, linear, dynamic, YaRN, LongRoPE, and Llama 3 rotary options on its inspected main documentation surface [R15.10]. These configuration names are not guarantees that every architecture accepts every variant or that a checkpoint has been adapted accordingly.

**DERIVED.** Use PyTorch, **Model / autograd framework**, to validate phase and magnitude operations on bounded tensors. Use NVIDIA Megatron-Core, **Distributed training**, to execute supported distributed adaptation configurations while retaining global position semantics. This chapter does not claim that these three systems expose identical method names or interchangeable configuration fields.

Persist the fully resolved per-layer settings. If a model uses different attention layer types, a single top-level factor is insufficient to reconstruct its computation. Record the original reference length separately from the chosen target length and from any runtime allocation limit. Verify checkpoint reload behavior and incremental continuation after serialization.

## Experimental design

**PROPOSAL — no adaptation run or resulting quality measurement is claimed.**

### Experiment 15.2 — Extension and preservation frontier

- **Hypothesis:** Extension quality depends jointly on positional transformation and adaptation exposure, with possible short-context regressions.
- **Setup:** Freeze a base checkpoint and compare a finite, predeclared set of compatible candidates.
- **Independent variables:** Scaling method, target length, adaptation token mixture, and magnitude treatment where supported.
- **Controlled variables:** Base weights, tokenizer, optimizer budget, source data eligibility, and evaluator.
- **Dataset/workload:** Disjoint adaptation, development, and test documents with both local and distributed-evidence tasks.
- **Hardware:** Record actual devices, interconnect, precision, runtime revision, and memory boundary.
- **Metrics:** Per-cell task success, short-context loss, evidence attribution, non-finite events, training tokens, and measured resource costs.
- **Baselines:** Unchanged checkpoint within its valid range; configuration-only extension; adapted extension.
- **Expected result:** Any gain or regression is conditional on the measured configuration, rather than implied by the scaling factor.
- **Ablation:** Remove adaptation, frequency selectivity, or magnitude adjustment one at a time where the operator remains valid.
- **Interpretation:** Accept a candidate only if its predeclared short and long constraints are jointly satisfied.
- **Threats to validity:** Unequal search budgets, benchmark leakage, different source distributions, and reused test sets.

## Observations

**What the paper claims — PAPER-REPORTED.** Position Interpolation, YaRN, and LongRoPE2 investigate extension procedures under their own experimental regimes [R15.3–R15.5].

**What the evidence shows — MATHEMATICALLY-DERIVED.** Coordinate compression changes local phase separations; magnitude scaling changes logits independently.

**What we infer — DERIVED.** A reproducible extension artifact must include resolved configuration, adaptation provenance, and cache continuation tests.

**What remains unknown — UNVERIFIED.** The best candidate and its preservation frontier for the reader's checkpoint require the proposed experiment.

## Failure modes

**DERIVED.** A configuration can deserialize successfully while silently using the wrong reference length. Another can pass full-sequence tests and fail incremental continuation because its frequency schedule changes with length. A third can improve long synthetic retrieval while degrading short code or mathematical tasks.

~~~figure
id: fig-15.8
kind: stat-panel
title: Extension acceptance gates
caption: "These gates define independent failure boundaries; a larger allocation limit passes none of them by itself."
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-15.7
alt: "Require transformation fidelity, independent long-context quality, shorter-context preservation, and cache compatibility."
spec:
  header: Candidate acceptance
  rows:
    - {key: Geometry, value: "Verify frequencies and magnitude"}
    - {key: Adaptation, value: "Data contains the claimed dependencies"}
    - {key: Preservation, value: "Short-context constraints are evaluated"}
    - {key: Continuation, value: "Compatible cached and full-prefix paths"}
~~~

## Siblings

**DERIVED.** Training a new model on a longer distribution differs from adapting an existing checkpoint. Sparse attention changes the interaction graph; interpolation changes positional geometry. Retrieval changes which evidence enters the context. These choices can be combined but require separate ablations.

## Extensions

**DERIVED.** For multimodal inputs, identify which axes are extended and whether a scalar stretch preserves their meaning. For agents, evaluate growing histories under actual tool-message serialization rather than plain-text approximations. Both cases need model-specific evidence before adopting a text-only scaling recipe.

## Limitations

**DERIVED.** The illustrative frequency family is explanatory, not a drop-in reproduction of a named method. A successful endpoint evaluation does not establish quality at all intermediate lengths or under a different runtime. Deployment decisions require the matrix in [Section 15.4](15-4-effective-context.md).

## Reproducibility

Archive candidate definitions, rejected configurations, adaptation corpus hashes, token counts by length, loss weighting, seeds, checkpoints, and source versions. State whether documentation was pinned. Keep search and final-test ledgers separate so the final result has an auditable selection history.

## References

[R15.3](references.md#r153); [R15.4](references.md#r154); [R15.5](references.md#r155); [R15.10](references.md#r1510).
