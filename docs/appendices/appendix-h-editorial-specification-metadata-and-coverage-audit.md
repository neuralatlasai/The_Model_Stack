---
id: ms.appendix.h
entity_type: appendix
title: Editorial specification, metadata, and coverage audit
short_title: Editorial audit
volume: null
part: null
chapter: null
section: null
slug: appendix-h-editorial-specification-metadata-and-coverage-audit
parent: ms.appendices
prev_sibling: ms.appendix.g
next_sibling: ms.appendix.i
children: []
prerequisites: []
downstream: []
related: [ms.chapter.6, ms.chapter.61, ms.chapter.66]
relations: []
axes: {lifecycle: [evaluation, assurance], mechanism: [evidence_audit, scientific_decisions], feedback_setting: [], modality: []}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-24
editorial_status: manuscript_draft
---

# Appendix H — Editorial specification, metadata, and coverage audit

[KNOWN] This appendix makes the book's authoring and review obligations inspectable. Its normative inputs are the user instruction of 24 October 2026, the chapter matrices and Appendix H of `book_plan.md`, the manuscript content contract, the visual grammar, and the shared notation. It records editorial procedures and repository observations. It does not report a model experiment or certify the scientific correctness of every existing chapter.

## Evidence window and source identity

[KNOWN] The continuation uses **1 March–24 October 2026**, inclusive. The lower bound interprets the user's March-2026 instruction; the upper bound is the current authoring date. New evidence must identify both its first public release and the inspected revision. The first release establishes eligibility; the revision identifies the text that supports a claim. Accessing an old work in October does not make its contribution current.

[DERIVED] A useful source record therefore separates the following fields. Conflating them can admit an ineligible work or attribute a result to a revision that did not contain it.

| Field | Required content | Review consequence when absent |
|---|---|---|
| Identity | Exact title, named authors or issuing organisation, primary URL | Cannot establish which work supports the claim |
| First public release | Calendar date and first-party date surface | Eligibility remains unresolved |
| Inspected text | Revision, version, dated release, or explicitly unpinned surface | Claims must be restricted to the surface actually inspected |
| Claim locator | Section, equation, table, figure, appendix, or source-code location | A general bibliography entry does not support a detailed mechanism |
| Claim type | Reported method, reported observation, official artifact disclosure, or book derivation | Prevents treating a proposed check as an experimental result |
| Evaluation context | Task distribution, units, split, baseline, budget, evaluator, uncertainty | Comparative conclusions remain restricted or unresolved |
| Availability | Inspected artifacts and publicly missing elements | Reproduction limits must accompany the result |
| Inspection | Actual date and what was read | Earlier authors' inspection status is not inherited |

[KNOWN] Older plan anchors identify canonical topics and retrieval leads. They do not override the new evidence window. Existing historical chapters require a separate date audit before they can be described as compliant. The continuation links to those chapters for previously owned definitions and states the conditions of its own mathematical deductions.

## Scientific decisions as supporting arguments

[DERIVED] A justified choice needs an acceptance rule before a comparison. Let the declared candidate set be \(\mathcal A\), the possible scientific states be \(\Omega\), and the requirement-satisfying decisions in state \(\omega\) be \(\mathcal A_{\mathrm{ok}}(\omega)\). If current evidence leaves the state in \(\Omega_E\), then a decision that is acceptable throughout that uncertainty must lie in

\[
\bigcap_{\omega\in\Omega_E}\mathcal A_{\mathrm{ok}}(\omega).
\]

[DERIVED] This is a conditional set-theoretic criterion, not a claim that the state set or acceptable-decision sets are known in practice. A nonempty intersection permits a robust acceptable decision without identifying the exact state. An empty intersection means that this particular robust acceptance requirement cannot be met by one candidate under the declared uncertainty. It does not prove that another probabilistic, risk-sensitive, or conditional decision rule is impossible. Those rules require their own declared probabilities, losses, and admissibility conditions.

[KNOWN] Each chapter's method-selection argument must supply the following obligations rather than infer a preferred method from a release date or a lab name.

| Obligation | What the manuscript must establish | What would change the decision |
|---|---|---|
| Target | Required result, evaluation distribution, error tolerance, resource boundary | A different task, tolerance, information regime, or deployment constraint |
| Necessary information | Which uncertainty affects acceptance and which can remain | An observation that excludes or admits a consequential alternative |
| Obstruction | Failure or bottleneck with evidence connecting it to the target | A counterexample to that connection or a competing obstruction |
| Admissibility | Required assumptions, information access, evaluation validity, feasibility | An assumption failure, unavailable input, or exceeded budget |
| Construction | Mechanism and reason it could remove the obstruction | A failed invariant, unsupported approximation, or ineffective intervention |
| Transfer | Mapping from transformed result to original target, error and restrictions | A mapping failure, accumulated error, or task-relevant information loss |
| Alternatives | Common comparison conditions and decisive supported property | A stronger comparator or changed operating regime |
| Further evidence | Possible outcomes and their explicit decision updates | An outcome that materially changes acceptance or candidate ordering |
| Closure | Supported conclusion, remaining obligations, stopping and reopening rules | New evidence that defeats a premise or expands the candidate set |

[DERIVED] Equivalence must be assessed at the claimed contribution level. Two formulations with corresponding optima need not have equal numerical conditioning, information requirements, or runtime. Conversely, changed notation does not establish changed attainable results. A contribution claim should state whether it changes applicability, assumptions, guarantee, explanation, or resource behavior, and compare the corresponding property. Originality alone establishes neither usefulness nor investigation priority.

## Evidence labels and observation boundaries

[KNOWN] A coherent technical paragraph has one applicable evidence label. A mixed paragraph is split so that source-reported results, official implementation statements, and book-derived deductions retain distinct support. The permitted meanings are fixed by the content contract; a label does not supply missing evidence.

| Boundary | Required treatment |
|---|---|
| Paper result | Attribute to the originating paper with its protocol and locator; publication is not independent reproduction |
| Official release statement | Identify release and disclosure surface; leave absent internals undisclosed |
| Conditional derivation | Define symbols, units, premises, approximation regime, and deduction |
| Proposed verification | State chosen inputs and that the study has not been executed |
| Unchecked candidate claim | Keep it outside factual exposition and identify the evidence gap |
| Code-supported assertion | Require repository, commit, and the precise inspection or executed check |

[KNOWN] Every section's Observations distinguishes **what the paper claims**, **what the evidence shows**, **what we infer**, and **what remains unknown**. The second paragraph must identify the actual disclosed support and independence limits; repetition across a paper, blog, and model card is not three independent experiments. No book-authored model measurements are claimed by this edition.

## Topic and artifact completeness

[KNOWN] Each chapter owns six sections and nine Markdown files: the chapter page, six section manuscripts, references, and verification. Coverage follows the plan's individual concepts and substantive variants. A complete treatment connects the problem and baseline to formal objects, full methodology, algorithmic state changes, implementation, resource accounting, source-reported protocol and observations, alternatives, documented extensions, failure modes, limitations, and reproduction constraints. An inapplicable obligation needs a topic-specific reason.

[DERIVED] File existence establishes navigability, not scientific completeness. A heading establishes a document region, not a method. A citation establishes a declared source, not claim entailment. A passing compiler establishes conformity to the implemented grammar, not a valid experiment or a correct theorem. Review must preserve these distinctions.

[KNOWN] Resource analysis states its boundary and separates parameters, media or text tokens, FLOPs, resident memory, memory traffic, communication, latency, throughput, energy, and monetary cost. An unavailable measurement stays unavailable. A source's speedup is accompanied by the compared implementation and workload; it is not transferred to a different deployment by assertion. Algorithms use mathematical state transitions with inputs, outputs, invariants, failure branches, and termination conditions.

[KNOWN] The chapter verification artifact contains a falsifiable, unexecuted protocol. Its topic-completeness audit maps each coverage item to a manuscript anchor, evidence key and exact locator, remaining gap, and review consequence. “Manuscript draft,” “reviewed,” and “released” are separate editorial states. A source-inspection pass or structural validation alone does not authorize the latter two.

## Continuation audit

[KNOWN] The initial repository audit on 24 October 2026 found the following. These are historical observations of that initial state, retained so that completion can be assessed against a concrete baseline.

| Item | Initial state |
|---|---|
| Planned chapter scope | 66 chapters and 396 numbered sections |
| Existing chapter directories | 54, covering Chapters 01–54 |
| Existing section files | 323 of 396 |
| Existing planned chapter files | 479 of 594 |
| Missing whole chapters | 55–66: 72 sections and 108 total chapter files |
| Other missing chapter files | Chapter 08 verification; Chapter 10 chapter page and references; Chapter 11 chapter page, references, verification, and §11.6 |
| Missing original appendices | A–H; the appendix index and supplementary I–J already existed |
| Working tree | Clean at the initial inspection |

[KNOWN] Baseline in-memory compilation produced 812 diagnostics, with no error-severity entries: 262 warnings and 550 informational entries. The warnings comprised 242 unresolved citations, 12 incomplete observation layers, four malformed blocks, and four unresolved links. Informational findings included planned links, unknown regions, unresolved cross-references, conflicting duplicate reference records, and incomplete experiment or sibling fields. This baseline is not a passing scientific review and must not be described as one.

[KNOWN] Validation uses the existing figure validator and the exported in-memory compiler API. It does not call the bundle writer. The application's compile CLI commands write generated artifacts and are outside this manuscript-only validation boundary. No application implementation or production deployment is part of the continuation.

## Release review and reopening

[DERIVED] A release decision combines several logically separate judgments: the content exists, its structure is valid, its source claims are supported, its mathematical deductions hold under stated premises, and its conclusions answer the declared questions. A defect in one judgment should update that judgment and the claims depending on it. For example, an evaluator defect can invalidate a comparison while leaving the mechanism description intact; a failed transfer premise can invalidate deployment applicability while leaving a transformed-problem theorem correct.

[KNOWN] Before advancing a chapter to reviewed, assess taxonomy, dependencies, mathematics, implementation, numerical behavior, experiments, systems costs, operational behavior, security and authorization, exposition, and per-topic completeness. Record the failed component, evidence, probable cause, corrective action, and dependent claims. A stronger newly eligible source can reopen a comparison; an unavailable artifact can restrict reproducibility; neither should silently rewrite the historical reported result.

[DERIVED] Investigation stopping and solution acceptance remain distinct. A finite action or resource cap can guarantee termination of an editorial or experimental procedure. It cannot establish that the resulting scientific claim meets its acceptance rule. Closure therefore records the supported decision, applicable conditions, unresolved obligations, stopping reason, and evidence that would reopen the decision.
