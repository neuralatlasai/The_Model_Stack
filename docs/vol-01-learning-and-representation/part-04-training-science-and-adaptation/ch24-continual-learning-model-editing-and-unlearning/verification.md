---
id: ms.verification.24
entity_type: verification
title: Verification — Sequential-task evaluation with retention constraints
short_title: Verification 24
volume: 1
part: 4
chapter: 24
section: null
slug: verification
parent: ms.chapter.24
prev_sibling: ms.section.24.6
next_sibling: ms.references.24
children: []
prerequisites: [ms.chapter.6, ms.chapter.12, ms.chapter.19, ms.chapter.23]
downstream: [ms.chapter.49, ms.chapter.53, ms.chapter.65, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [evaluation, assurance], mechanism: [continual_learning, model_editing, machine_unlearning], feedback_setting: [], modality: [text, image]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: true}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, ASSUMED, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# Verification — Chapter 24

[DERIVED] This page specifies the chapter artifact, proposed falsification experiments, and topic-completeness audit. **No proposed model, editing, deletion, privacy, or service experiment below was executed for this edition.** Mathematical checks and manuscript validation establish only their explicitly counted editorial or analytical boundaries.

## Artifact contract

| Record | Required fields | Failure that invalidates a comparison |
|---|---|---|
| Regime | Ordered phase distributions, input/target definitions, task-identity visibility, prediction space, boundary signals, repetitions/epochs | Oracle routing or label masking supplied only to one method |
| Permission manifest | Historical artifact type, source/descendant lineage, allowed purpose, retention expiry, reader and retained-byte count | Undeclared old records, teacher, generator, or statistics |
| State/checkpoint | Base and candidate hashes, optimizer, teacher/generator, precision/anchor, adapter/router, data position, RNG identity | Weights preserved while another prediction-relevant buffer changes |
| Evaluation ledger | Initial row; all phase/task cells; inherited panels; raw outputs, counts, scorer/version, orientation/normalization | Missing cells converted to zeros or selection feedback leaked from sealed test rows |
| Resource ledger | Current/replay/generated/evaluation tokens, FLOPs convention, state bytes, hardware/precision, latency boundary | Additional replay or generation compute silently treated as equal budget |
| Edit ledger | Target/paraphrase/neighborhood/composition sets; fixed keys/projector threshold; edit order; deployment transformations | Fixed-key equality represented as global functional preservation |
| Deletion ledger | Forget/retain/descendant sets, randomized training map, retraining comparator, release/attack interface, recovery budgets | Refusal or forget loss represented as absent-data equivalence |
| External-state ledger | Generator/encoder/document/index/cache/history/policy versions, source validity times, descendant map, publication pointer | Mixed manifests, stale derived records, or unauthorized retrieval |

[DERIVED] Store candidates immutably; publish only accepted artifacts under an implementation-supplied transaction contract. Preserve rejected candidates' evaluation identities when retention policy permits. A deleted or expired artifact may require a non-content audit tombstone rather than retention of its original payload. Authorization is a supplied system policy, not a mathematical inference from method names.

## Analytical acceptance checks

[ASSUMED] The following inputs are illustrative analysis fixtures, not measured benchmark outcomes. Tolerances for model experiments must be selected before observing the test data and justified by the intended use; the numerical fixtures do not choose them.

| Check | Inputs and exact expected identity | Rejection condition |
|---|---|---|
| Weighted risk | Two risks $0.2,0.8$, mixture $0.75,0.25$: Eq. 24.2 gives $0.35$ | Denominator/mixing implementation yields another value |
| Backward change versus peak forgetting | Acquisition $0.7$, historical peak $0.9$, final $0.8$: signed change $+0.1$, peak forgetting $0.1$ | The metrics are identified or the peak is less than the final score |
| Recursive anchor | Two nonnegative diagonal precisions $\Omega_a,\Omega_b$: accumulated precision is their sum, centered at the latest mode under Eq. 24.14 | Earlier posterior modes are added again as independent posteriors |
| Fixed-key preservation | Synthetic matrices with $P_0K_0=0$: $(A+\Delta P_0)K_0=AK_0$ exactly in real arithmetic | Equality is asserted for arbitrary new keys or nonlinear downstream outputs |
| Near-null bound | Eq. 24.21 uses $\|\Delta\|_2=2$, $\|P_0K_0\|_F=0.01$: local residual is bounded by $0.02$ | The bound is presented as an empirical residual or a global language-model bound |
| NPO derivative | At log-ratio zero, Eq. 24.26 multiplier is one; as ratio tends to negative infinity it tends to zero | Gradient-descent update increases the probability of the targeted response |
| Lifetime cost | $U=10$, $c_{\mathrm{train}}=100$, $c_{\mathrm{index}}=1$, $c_{\mathrm{ext}}=0.01$: Eq. 24.32 gives $Q^*=99{,}000$ | Units differ or the crossover is described as quality equivalence |

[MATHEMATICALLY-DERIVED] Numerical verification uses dtype-appropriate relative/absolute tolerances after specifying matrix conditioning; exact real-arithmetic statements do not imply bitwise equality. A pure identity has no training dataset, baseline model, or empirical seed requirement. The interactive figures execute selected identities with their declared example inputs, not a simulated benchmark.

## Proposed experiments

### Experiment 24.1 — Permission-constrained sequential adaptation

- **Hypothesis.** [DERIVED] Methods with different retained objects can trade acquisition, retention, and resource cost differently under the same legal information access; no universal winner is assumed.

- **Setup.** [DERIVED] Start from one hashed initial checkpoint. Define a finite sequence with separate task-conditioned and task-identity-hidden variants. Seal all test rows, including future tasks and inherited capability panels. Construct permitted replay, quadratic-anchor, output-anchor, and isolated-adapter branches separately; compare only compatible interfaces.

- **Independent variables.** [ASSUMED] Mechanism family, buffer size, anchor strength, phase order, and whether task identity is supplied. These are proposed experimental inputs.

- **Controlled variables.** [DERIVED] Initial checkpoint, tokenizer, current training data, selection rule, evaluation prompts/scorer, optimizer policy, trainable mask where relevant, current-token budget, and separately matched total compute or total token budget. These last resource conditions define different comparison panels rather than a single ambiguous budget.

- **Dataset/workload.** [ASSUMED] Four or more licensed task distributions with distinct held-out sets and a fixed inherited panel. Use multiple predeclared orders and seeds; exact datasets and counts remain UNVERIFIED until an executor supplies a versioned manifest.

- **Hardware.** [UNVERIFIED] Accelerator type/count, precision, runtime versions, and communication topology are not selected. Report peak allocated/resident memory and all teacher/generator/evaluation work before comparing cost.

- **Metrics.** [DERIVED] Full $\mathbf R$, task-native acquisition, signed BWT, FWT relative to the initial checkpoint, peak forgetting, inherited deltas, worst-task change, retained bytes, tokens, and FLOPs. Keep raw paired outputs and uncertainty clustered by the true independent unit.

- **Baselines.** [DERIVED] Frozen initial model, sequential full fine-tuning, and joint/offline training only when full historical access is permitted and clearly labeled as a different access condition. Compare corrected recursive anchoring with the historical multi-anchor objective as distinct methods, not interchangeable implementations.

- **Expected result.** [UNVERIFIED] No ranking or improvement magnitude is predicted. A frozen model should preserve its deterministic unchanged path under the exact same evaluation configuration; its acquisition can remain inadequate.

- **Ablation.** [DERIVED] Remove replay, remove the precision weighting while retaining penalty scale, change anchor-input support, remove oracle routing, and include/exclude generation cost in separate correctly labeled ledgers.

- **Interpretation.** [DERIVED] An effect is attributable only under the corresponding interface, access, and budget panel. Order sensitivity cannot be estimated by seed variation alone. A successful short sequence does not establish indefinite retention.

- **Threats to validity.** [DERIVED] Pretraining contamination, future-test feedback, unmatched initialization/optimizer reset, task-dependent score scales, correlated examples, selection on test retention, and hidden historical artifacts.

### Experiment 24.2 — Targeted edit locality, composition, and persistence

- **Hypothesis.** [DERIVED] Exact fixed-key matrix preservation can coexist with changed behavior outside those keys; direct edit efficacy need not imply multi-hop consistency or later persistence.

- **Setup.** [DERIVED] Use one original checkpoint and authorized factual edits. Record keys and chosen layers. Evaluate direct requests, held-out paraphrases, neighbors, unrelated capabilities, and entailed multi-hop consequences before/after every accepted edit. Add a separately declared later adaptation or deployment transformation.

- **Independent variables.** [ASSUMED] Rank-one versus batch versus projected update, projector threshold, edit-batch size, edit order, and later transformation.

- **Controlled variables.** [DERIVED] Model/tokenizer, requested edits, key-sampling corpus, target-value construction, evaluator, locality distribution, candidate-selection budget, and final release interface.

- **Dataset/workload.** [ASSUMED] Benign synthetic entity/relation facts with consistent multihop chains and disjoint paraphrases; optional version-pinned CounterFact/MQuAKE replication is a separate protocol. No actual benchmark instance was executed here.

- **Hardware.** [UNVERIFIED] Matrix factorization dtype, device/runtime, and accelerator resources remain unspecified. Record factorization time, peak temporary storage, and model-evaluation cost.

- **Metrics.** [DERIVED] Direct/paraphrase efficacy, fixed-key residual, held-out-neighbor distribution change, multi-hop item and per-query scores separately, edit-survival matrix, and order effects. Use independent entity groups for uncertainty.

- **Baselines.** [DERIVED] Original checkpoint, parameter fine-tuning under a comparable budget, independently implemented constrained real-arithmetic fixture, and external-memory editing only in a labeled different-state-boundary panel.

- **Expected result.** [MATHEMATICALLY-DERIVED] The exact projector fixture preserves its selected linear-map outputs. [UNVERIFIED] Functional locality and all named-method rankings remain empirical questions.

- **Ablation.** [DERIVED] Exact versus near-null projection, soft prior-edit penalty removed, keys recomputed versus deliberately frozen after prior layer edits, single versus multiple requests, and deployment transformation absent/present.

- **Interpretation.** [DERIVED] A local matrix identity supports its stated subspace only. Multi-hop failures falsify a broad consistency claim even when direct efficacy is high. Transformation-induced failures limit persistence to the pre-transformation artifact.

- **Threats to validity.** [DERIVED] Contradictory target facts, alias leakage, correlated neighborhoods, scorer aliases, ill-conditioned moments, model-dependent keys, and unequal editor search budgets.

### Experiment 24.3 — Absent-data deletion and matched benign relearning

- **Hypothesis.** [DERIVED] Standard suppression scores can fail to distinguish an unlearned candidate from residual information exposed by alternate tests; matched retraining is needed to interpret the difference.

- **Setup.** [DERIVED] Train a small model on versioned benign canaries plus retained content. Produce an original model, approximate-unlearning candidates, and models retrained without the full declared canary lineage under the same randomized training map. Specify fixed-base versus all-training scope. Test before and after matched benign relearning budgets.

- **Independent variables.** [ASSUMED] Forget-method objective, retain weight, forget-set size, repeated-request order, unlearning depth, and relearning budget.

- **Controlled variables.** [DERIVED] Training map/configuration, initialization-seed distribution, retain data, duplicated/derived-record policy, validation selection, evaluation prompts, attacker access, nonmember sampling, and recovery-data exposure.

- **Dataset/workload.** [ASSUMED] Synthetic non-sensitive identities and strings with a documented duplicate/paraphrase graph. Recovery data must exclude held-out canary answers and be applied identically to candidate and retrained models.

- **Hardware.** [UNVERIFIED] Device, precision, runtime, and total training budget remain unselected. Charge original training, unlearning, retraining, attack fitting/calibration, and recovery separately.

- **Metrics.** [DERIVED] Verbatim and semantic recovery, retained utility, signed membership-score distributions and retraining-relative AUC, repeat-request trajectory, and matched recovery gap $\delta_b$. Predeclare equivalence tolerances and test power; failure to reject a difference is insufficient.

- **Baselines.** [DERIVED] Original model, retained-only retraining, refusal-only wrapper, and, when evaluated, SISA retraining against the same sharded algorithm. A wrapper is an output-control comparator, not a deletion baseline.

- **Expected result.** [UNVERIFIED] No method is assumed to satisfy global deletion. [MATHEMATICALLY-DERIVED] A wrapper leaves parameters unchanged; exact retraining implements the specified absent-data algorithm by construction, subject to its stated pipeline boundary.

- **Ablation.** [DERIVED] Fixed versus removed hyperparameter-selection influence; retain likelihood versus output KL; reference ratio versus length-normalized suppression; matched versus intentionally unmatched relearning controls; direct versus duplicate-lineage deletion.

- **Interpretation.** [DERIVED] Excess recovery or membership discrepancy falsifies the corresponding bounded deletion claim. Recovery shared by the retrained comparator does not by itself prove residual training influence. Passing all finite tests still cannot certify equality over arbitrary observations.

- **Threats to validity.** [DERIVED] Unknown pretraining copies, contaminated nonmembers, recovered answers present in relearning data, reverse membership signal hidden by AUC orientation, utility collapse, adaptive test selection, and mismatched randomization.

### Experiment 24.4 — Versioned external evidence and deletion scope

- **Hypothesis.** [DERIVED] Coherent external updates can change service answers with fixed generator tensors; consistency, answer freshness, and parametric removal remain separate properties.

- **Setup.** [DERIVED] Build two temporal evidence snapshots and compatible indexes. Pin each request to a complete manifest. Update a benign record, invalidate descendants, validate, and publish using an implementation-supplied atomic pointer. Inject a concurrent update and an index/encoder-version mismatch to test rejection paths.

- **Independent variables.** [ASSUMED] Evidence version, cache/history invalidation, retrieval correctness, publication concurrency, and update/query frequency.

- **Controlled variables.** [DERIVED] Generator hash, encoder convention, question set, caller permissions, decoding, evaluator, deployment load, and cost unit.

- **Dataset/workload.** [ASSUMED] Synthetic temporal records with known validity intervals and cross-tenant access fixtures. Include answerable, contradictory, deleted, stale-cache, and unsupported questions.

- **Hardware.** [UNVERIFIED] Store/index deployment, network topology, device, precision, and concurrency remain unspecified. The CAS algorithm is a required abstract contract, not evidence that a selected storage service supplies it.

- **Metrics.** [DERIVED] Manifest coherence, reachable deleted descendants, unauthorized evidence count, evidence coverage, answer freshness, source faithfulness, latency quantiles, and horizon cost. Weight hashes verify unchanged parameters only.

- **Baselines.** [DERIVED] Old evidence with fixed weights, fresh evidence with fixed weights, cache-disabled fresh evidence, and a separately trained parameter-update branch if resources permit a matched comparison.

- **Expected result.** [MATHEMATICALLY-DERIVED] Publication rejects a stale observed pointer when CAS semantics hold. [UNVERIFIED] Correct evidence does not guarantee a correct answer; actual cost crossover requires measurement.

- **Ablation.** [DERIVED] Disable descendant invalidation, mix index versions, omit permissions from cache identity, replace retrieved evidence with an oracle supporting record, and remove the response wrapper.

- **Interpretation.** [DERIVED] Oracle-evidence improvement isolates retrieval failure; persistent wrong answers under correct evidence expose evidence-use failure. Store deletion establishes its reachable-state boundary, never automatic parameter unlearning.

- **Threats to validity.** [DERIVED] Unenumerated summaries/caches, in-flight old-version requests, hidden generator knowledge, inaccurate source records, changed answer lengths, shared infrastructure accounting, and correlated temporal questions.

## Topic-completeness audit

[DERIVED] Each row below maps its own required treatment to canonical manuscript anchors and inspected primary locators. **Contract** means Scope/Why this exists/Formulation; **method** means Mechanism/Algorithm/Implementation and their resource boundary; **evidence** means Experimental design/Observations; **closure** means Siblings/Extensions/Failure modes/Limitations/Reproducibility/References. These groups instantiate all thirteen obligations of CONTENT_CONTRACT §4.1 for each row rather than substituting one method's experiments for another's. Where a concept is a book-defined interface or identity, its empirical protocol is explicitly not applicable; its proposed falsification is above. All empirical reproduction and executable paths remain UNVERIFIED.

| Required concept or substantive variant | Contract | Method and mathematical account | Reported evidence / primary locator | Alternatives, lineage, validity, closure |
|---|---|---|---|---|
| Task-, domain-, class-incremental interfaces | [24.1 formulation](24-1-sequential-learning-regimes.md#formulation) | [24.1 mechanism](24-1-sequential-learning-regimes.md#mechanism), Eq. 24.3, Alg. 24.1 | R24.1 §2.2/Table 1, §§3–4; R24.2 §§3–4 | 24.1 Siblings–References: oracle masks/routing and classification-to-LLM boundary |
| Stationarity, evolving distributions, recurring/boundary-free phases | 24.1 Scope/Formulation | 24.1 Mechanism, risk mixture and boundary detector distinctions | R24.1 §2; changing-distribution interface is book-defined | 24.1 Failure modes/Limitations; detector accuracy not established |
| Replay permissions, data lineage, statistics/teachers/generators | 24.1 Formulation | Eq. 24.4, Alg. 24.1, retained-byte accounting | Source methods R24.3–R24.9; permission predicate is a supplied contract | 24.1 Reproducibility; synthetic status does not establish authorization |
| Retention matrix, acquisition, BWT/FWT, peak forgetting | [24.2 formulation](24-2-forgetting-and-transfer.md#formulation) | Eqs. 24.6–24.11, Alg. 24.2, evaluation-token count | R24.3 §2/Eqs. 2–4, §§4.1–4.4.1 | 24.2 Closure: metric normalizations, signs, initial baseline, no global theorem |
| Plasticity/stability, inherited capability, order/seed, long horizon | 24.2 Scope/Intuition | 24.2 Mechanism/Implementation: separate constraints and resource clocks | R24.2 §§4.2–4.4; R24.3 §4.4.1 | 24.2 Observations/Extensions/Limitations: long-horizon extrapolation UNVERIFIED |
| Raw replay/reservoir and GEM gradient constraints | [24.3 formulation](24-3-mechanism-families.md#formulation) | 24.3 Replay subsection, mixture/unbiasedness, first-order projection and $O(KN)$ | R24.3 §3/Eqs. 6–11, §4/Appendix B | 24.3 Closure: remembered sample and first-order support boundaries |
| Generative replay | 24.3 Formulation | Coupled solver/generator, bounded-loss TV reconstruction and generator cost | R24.7 §3.1/Eq. 1, §§4.1–4.3 | 24.3 Observations/Limitations: fidelity and privacy not inherited |
| EWC, Fisher/Hessian distinctions, Laplace conditions | 24.3 Formulation | Eqs. 24.13–24.14; geometry/diagonal restrictions, $2Nb$ auxiliary bytes | R24.4 §2/Eqs. 1–3, §§2.1–2.2, Appendix 4 | 24.3 Closure: local approximation, conditioning, no neural posterior exactness |
| Recursive EWC correction and precision decay | 24.3 Quadratic anchors | Latest-mode single anchor and cumulative precision; decay changes interpretation | R24.5 Eqs. 8–13; pure mathematical correction, benchmark N/A | 24.3 Extensions/Limitations: no double-counted historical posteriors |
| Rehearsal-free LwF function anchoring | 24.3 Formulation | Current-input cached outputs, softened distillation, support counterexample | R24.6 §III/Fig. 3, §IV/Table 4 | 24.3 Closure: no off-support preservation claim |
| SDFT on-policy distillation and teacher choices | 24.3 Function anchors | Eq. 24.15 fixed-prefix gradient, stop-gradient boundary, EMA and logit cost | R24.9 §3, §§4.1,4.3,4.6; Appendices A.1,B.1–B.2 | 24.3 Experimental design/Observations/Extensions; inspected v1 only |
| Progressive columns, isolated adapters, hidden-task routing | 24.3 Parameter isolation | Conditional path-equality proof, trainability/routing, storage growth | R24.8 §2/Eq. 1, §5/appendix; R24.10 API entries | 24.3 Siblings/Limitations; API mutable, no runtime claim; Ch23 owns adapter algebra |
| ROME local edit and key/value construction | [24.4 formulation](24-4-model-editing.md#formulation) | Eqs. 24.17–24.18 constrained solve/derivation, Alg. 24.4 | R24.11 §§2–3.1/Eqs. 2–4; §§3.2–3.7, Appendix E.5 | 24.4 Closure: causal intervention not unique global storage; key alias failures |
| MEMIT batch/multilayer edits | 24.4 Batch updates | Batch residual and changing downstream keys; Eq. 24.19 explanatory ridge | R24.12 §§4.2–4.3/Eqs. 7–14, §5 | 24.4 Extensions/Limitations: conflict feasibility and source-specific execution |
| AlphaEdit exact/near-null preservation and prior-edit soft term | 24.4 Batch updates | Eqs. 24.20–24.22, reduced-space solver, threshold and $O(d^3)$ factorization | R24.13 §§3.2–3.3/Eqs. 8–14, §4/Appendices A–B | 24.4 Closure: fixed keys only, trivial full-rank nullspace, no global guarantee |
| Locality, edit composition, order, persistence | 24.4 Scope/Formulation | Target and held-out distributions, sequential survival ledger, transactional rollback | R24.11 §§3.2–3.7; R24.14 §§3–5/Appendix H | 24.4 Observations/Closure: MQuAKE item metric, post-transformation reevaluation |
| Retraining counterfactual and pipeline scope | [24.5 formulation](24-5-unlearning.md#formulation) | Eqs. 24.24–24.25 randomized map and restricted discrepancy, Alg. 24.5 | R24.16 §III; counterfactual tests book-defined | 24.5 Closure: fixed contaminated base and hyperparameter-selection boundary |
| SISA dependency isolation | 24.5 Retraining subsection | Shards, slices, preceding unaffected checkpoint, same-algorithm comparator | R24.16 §§IV–VII/Appendix C | 24.5 Implementation/Limitations: shard utility/storage and request regime |
| Gradient ascent, NPO, SimNPO | 24.5 Loss-method subsection | Unbounded ascent; Eqs. 24.26–24.27 softplus derivatives/length conventions | R24.17 §3/Eq. 3, §§4–5/App D; R24.18 §§4–6/App I | 24.5 Closure: no retraining equivalence; SimNPO revision UNVERIFIED |
| Memorization, privacy, scale, repeated requests | 24.5 Scope and tests | Continuation/semantic/membership interfaces, signed attacks, paired uncertainty | R24.15 §§3–5/Appendices B.1,C.1 | 24.5 Observations/Closure: retraining-relative signal, utility collapse, no universal privacy |
| Benign relearning and residual information | 24.5 Residual tests | Eq. 24.28 matched recovery map/budget and retraining gap | R24.19 §§2–4/Appendices A,I | 24.5 Closure: recovery alone not proof; weight/service access differs |
| Conformal inference-time suppression | 24.5 Inference-time subsection | Finite verifier refinement, marginal i.i.d. event, unchanged weights | R24.20 §§3.1–3.2/Algorithm 1/Lemma 1/App A | 24.5–24.6 Limitations: verifier error, distribution shift, no parameter deletion |
| Parameter versus external persistence, freshness/provenance | [24.6 formulation](24-6-parametric-versus-external-memory.md#formulation) | Eqs. 24.30–24.31 full service manifest and three consistency predicates | R24.21 §§2,4.5; external transaction is book-derived | 24.6 Closure: descendants, in-flight requests, hidden parametric copies |
| External edit reconciliation and cost crossover | 24.6 Mechanism | MeLLo branch, Eq. 24.32 horizon identity, Alg. 24.6 atomic publication | R24.14 §§4–5.2/App H; R24.21 §4.5 | 24.6 Extensions/Limitations: quality constraints, no measured cost claim; forward ownership49/50/53 |

## Review state

[DERIVED] Required chapter-matrix topics have canonical manuscript locations and source-bounded treatments. This audit does not mark the chapter scientifically reviewed. The chapter contains mathematical procedures and source-reported protocols, not independent reproductions. Source gaps and revision qualifications are in [references.md](references.md#evidence-gaps-and-review-consequence).

| Gate | Current evidence | Review consequence |
|---|---|---|
| Editorial/topic coverage | Six substantive sections, exact H2 grammar, separate mathematical algorithms and mechanism figures; mapped variants above | Eligible for substantive review after local manuscript checks |
| Mathematical account | Explicit shapes/conditions; Fisher, projection, suppression, and comparator boundaries; analytical fixtures | Numerical implementation and conditioning remain UNVERIFIED |
| Primary provenance | 21 inspected originating texts/API pages with date/revision/locator | SimNPO pin and SDFT archival-text reconciliation remain open |
| Experiments | Source-reported studies; four bounded unexecuted proposals | No book empirical claim or benchmark ranking |
| Systems | State/byte/operation/cost boundaries and failure branches | Hardware/runtime, latency/throughput, energy, price, atomic store semantics UNVERIFIED |
| Global assurance | Explicit finite observation and release interfaces | No unrestricted preservation, privacy, or all-pretraining deletion guarantee |

## Manuscript validation record

[DERIVED] The local figure validator checked **20 authored figure blocks with zero problems**. The six section files have the exact fifteen required H2 headings in order, six numbered mathematical algorithms, and 33 separately tagged equations. All 21 citation keys have primary reference records. Read-only atlas compilation produced **zero Chapter 24 errors and zero warnings**; informational diagnostics identify canonical planned chapter links and verification-specific headings. Planned links point to manifest-owned Chapters 23,49,50,53, rather than invented paths. Chapter 23 is part of the concurrent authoring task; later chapters remain planned. Browser layout and interaction verification belong to the parent integration pass and are not inferred from this manuscript check.
