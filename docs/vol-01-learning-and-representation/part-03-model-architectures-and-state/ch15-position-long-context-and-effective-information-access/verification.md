---
id: ms.verification.15
entity_type: verification
title: Chapter 15 verification
short_title: Chapter 15 verification
section: null
slug: verification
parent: ms.chapter.15
prev_sibling: ms.section.15.6
next_sibling: ms.references.15
children: []
prerequisites: [ms.chapter.10, ms.chapter.13, ms.chapter.14]
downstream: [ms.chapter.27, ms.chapter.42, ms.chapter.49]
word_count_target: 1500
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

# Chapter 15 — Verification and long-context experiment matrix

## Artifact contract

**PROPOSAL.** Produce a long-context experiment matrix that varies evidence position, distractor density and type, and the number of required facts. The artifact must separate runtime admissibility, operator correctness, evidence coverage, answer quality, and resource feasibility.

No model experiments were executed for this manuscript. The schemas below specify future records; they are not populated results. Mathematical fixture checks validate the manuscript's accounting and identities only.

| Record | Required fields | Invariant |
|---|---|---|
| Configuration | Checkpoint and tokenizer revisions; position settings by layer; numerical dtypes; cache strategy; context constructor; runtime revision; generation policy | A changed field creates a distinct evaluated configuration |
| Source ledger | Source identifier; revision/hash; eligibility timestamp; extraction method; required fact identifiers; supporting spans | Every required fact maps to source evidence |
| Cell | Task family; serialized token length; evidence-position vector; distractor density/type; fact count; output reserve; quality threshold | Cell membership is fixed before examining outcomes |
| Example | Source/generator seed; independent sampling unit; final prompt; token offsets; ground-truth answer and support | All required spans survive final serialization |
| Execution | Raw output; errors; retries; abstention; generated tokens; cache condition; measured resources | Failed attempts remain visible |
| Score | Answer correctness; support completeness; freshness; evaluator revision; adjudication | Scoring is independent of candidate selection |
| Aggregate | Cell counts; success estimate; uncertainty method; resource acceptance; passing tested lengths | Untested lengths are not inferred from passing neighbors |

Store source offsets both before and after serialization. For multi-fact tasks, positions are ordered by stable fact identifiers rather than by their order in the prompt. This prevents a position permutation from silently changing the identity of a required component.

## Experimental design

The following levels are **authored experimental choices**, not claims about any named checkpoint.

| Axis | Proposed levels | Control |
|---|---|---|
| Input length | 4096, 8192, 16384, 32768 tokens where admitted | Count the fully serialized input; mark unsupported levels explicitly |
| Evidence layout | Early, central, late, clustered, distributed | Preserve fact content and surrounding interpretation |
| Distractor fraction | 0, 0.5, 0.9 of the designated document-content token budget | Hold instructions and evidence fixed; record other filler separately |
| Distractor type | Unrelated text, lexical look-alikes, contradictory revisions with explicit precedence | Never confuse a changed answerability condition with simple density |
| Required facts | 1, 2, 4 where the task supports them | Provide an explicit dependency ledger |
| Task | Retrieval, reference tracing, aggregation, cross-document composition | Use separate scoring rules per family |
| Context construction | Evidence-only diagnostic, broad context, retrieval, declared hybrid | Use the same eligible source snapshot |
| Cache condition | Cold, valid shared prefix, changed-prefix invalidation control | Keep model and source revisions fixed within valid-reuse comparisons |

Not every Cartesian combination is meaningful. For example, a single-fact retrieval cell cannot test a four-fact aggregation requirement. Publish the eligible cell list before execution and count that list when selecting a simultaneous uncertainty procedure.

Exact token-length targets can conflict with exact distractor fractions because tokenization and evidence-span sizes are discrete. Predeclare acceptable length bins or a deterministic padding rule, and retain realized values. Do not change a task's decisive fact to meet a length target.

## Formulation

**MATHEMATICALLY-DERIVED — illustrative configurations, not model results.**

| Fixture | Inputs | Expected result |
|---|---|---|
| Rotary phase, Eq. 15.4 | Rotary width 128; base 10000; pair 32; offset 4096 | Frequency 0.01; phase 40.96 radians |
| Uniform interpolation, Eq. 15.5 | Reference length 8192; target 32768; coordinate 16000 | Stretch factor 4; transformed coordinate 4000 |
| Magnitude scaling, Eq. 15.7 | Both query and key scaled by 1.2 | Dot-product contribution multiplied by 1.44 |
| Fixed-token causal pairs, Eq. 15.8 | 65536 tokens; sequence length 4096 | 16 sequences; 134250496 pairs per head/layer |
| Longer fixed-token stage, Eq. 15.8 | 65536 tokens; sequence length 16384 | 4 sequences; 536903680 pairs per head/layer |
| Packed boundaries, Eq. 15.9 | Two documents of 3 and 2 tokens | Concatenated 15 pairs; isolated 9; removed 6 |
| Global token mean, Eq. 15.10 | Rank counts 1 and 3; loss sums 2 and 3 | Global mean 1.25; incorrect mean of local means 1.5 |
| Joint coverage, Eq. 15.14 | Three components, each with marginal 0.9 | Complete coverage bounded by 0.7 and 0.9 |
| Ideal prefix payload, Eq. 15.18 | 65536 bytes/token; 4 requests; prefix 8192; suffix 1024 | Separate 2304 MiB; shared 768 MiB; saved 1536 MiB |
| Overlapping chunks, Eq. 15.19 | 10000 source tokens; width 4096; overlap 512 | 3 chunks; 11024 source-token appearances |

Boundary checks are part of the fixture contract. One request produces no cross-request sharing saving. Zero overlap produces no repeated source tokens. A source shorter than the chunk width produces one shorter chunk. Invalid overlap at or above width is rejected before division. A zero valid-target count cannot enter the loss denominator.

The rotary identity must also be checked numerically with independent coordinate construction over several bounded vectors and offsets. Include an intentionally wrong coordinate pairing or frequency to verify that the check can detect a failure. This is an editorial mathematical check, not a claim of checkpoint equivalence.

## Verification

**PROPOSAL — outcome fields remain UNVERIFIED.**

### Experiment 15.7 — From position contract to deployment envelope

- **Hypothesis:** A system's passing context conditions depend on evidence layout, distraction, and composition, even after its positional and cache implementation passes correctness checks.
- **Setup:** Freeze one admissible baseline and a finite set of declared context-extension or context-construction alternatives; evaluate the sealed matrix.
- **Independent variables:** Length, position layout, distractor fraction/type, required facts, task family, and candidate policy.
- **Controlled variables:** Source eligibility, checkpoint lineage, tokenizer, scoring rules, output allowance, and failure denominator.
- **Dataset/workload:** Held-out synthetic tasks and separately annotated natural document tasks; independent source groups define the sampling unit.
- **Hardware:** Record local hardware and runtime or the hosted endpoint's disclosed identity; keep unavailable fields NOT-DISCLOSED.
- **Metrics:** Position-reference residuals, complete support coverage, supported answer success, per-cell uncertainty, resource feasibility, and non-admission rate.
- **Baselines:** Evidence-only, no-evidence, counterfactual-evidence, unchanged short-context checkpoint, and no-cache-reuse controls.
- **Expected result:** The matrix yields a qualified tested envelope; no benchmark score or ranking is predicted.
- **Ablation:** Change one mechanism at a time and retain intermediate failing configurations.
- **Interpretation:** Attribute failure to input construction, operator fidelity, evidence use, scoring, or resource policy only when the corresponding control supports that attribution.
- **Threats to validity:** Adaptive test-set reuse, dependent examples, incomplete annotations, hidden service changes, and a selection policy tuned on final outcomes.

## Algorithm

~~~text
Algorithm 15.7 — Verify a long-context claim end to end
INPUT: sealed matrix, finite candidate list, source ledger, acceptance criteria
OUTPUT: qualified claim register and reproducible execution records
STATE: immutable configuration identifiers and per-cell outcome ledger
INVARIANT: no unmeasured outcome is entered as success or zero failure
1. Validate the mathematical and serialization fixtures.
2. Validate the position, mask, and incremental-cache contracts.
3. Check candidate admissibility before allocating long-sequence work.
4. Freeze candidate selection using development data only.
5. Execute held-out cells and all predeclared controls.
6. Score answer and support separately; adjudicate ambiguous cases.
7. Aggregate at the declared independent sampling unit.
8. Apply uncertainty and resource criteria to every eligible cell.
9. Publish passing and failing tested conditions with all unresolved fields.
~~~

Stage 2 has a deliberately bounded dense reference. Stage 5 may require substantial model computation; budget it using actual token lengths and candidate counts. The algorithm does not imply that a finite experiment establishes correctness for all inputs.

## Failure modes

**DERIVED.** Accept an operator implementation only when its independent reference tests pass under the declared tolerance and its negative controls fail as intended. Accept a context-quality claim only for the cells satisfying the predeclared quality and resource criteria. A passing mathematical fixture cannot substitute for a task-quality result.

A claim that an advertised limit equals usable context is falsified by an admissible cell that fails the declared quality threshold. A claim of complete evidence selection is falsified by a missing required component. A claim of valid cache reuse is falsified by a mismatch after changing a supposedly irrelevant cache identity field.

Report cases in which the evidence is insufficient to decide. If the uncertainty interval crosses the acceptance threshold, the cell is unresolved under that procedure; it is not automatically a failure of the model's true capability, nor is it a demonstrated pass.

## Reproducibility

The chapter is eligible for manuscript completion after frontmatter, local links, figure schemas, equation numbering, required section anatomy, source records, and mathematical fixtures pass their checks. That status is separate from empirical validation of the proposed experiments. The chapter's evidence summary remains **empirically_observed: false**.

## References

[15.1 position contract](15-1-position-representations.md); [15.4 effective-context estimand](15-4-effective-context.md); [15.5 joint evidence coverage](15-5-long-context-versus-retrieval.md); [15.6 admission and resource accounting](15-6-deployment-consequences.md); [primary reference register](references.md).
