---
id: "ms.verification.35"
entity_type: "verification"
title: "Chapter35 verification"
short_title: "Chapter35 verification"
volume: 2
part: 6
chapter: 35
section: null
slug: "verification"
parent: "ms.chapter.35"
prev_sibling: "ms.section.35.6"
next_sibling: "ms.references.35"
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.32", "ms.chapter.33", "ms.chapter.34"]
downstream: ["ms.chapter.36", "ms.chapter.38", "ms.chapter.39", "ms.chapter.62", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "evaluation", "assurance"], "mechanism": ["reinforcement_learning", "verification", "policy_optimization"], "feedback_setting": ["verifiable_reward", "environment_return"], "modality": ["text", "code"]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["DERIVED", "MATHEMATICALLY-DERIVED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "ASSUMED", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 1600
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# Chapter35 — Verification and topic-completeness audit

[DERIVED] This file separates editorial coverage, finite mathematical checks and proposed empirical work. The proposed verifier-grounded RL experiment has not been executed. Manuscript compilation and figure validation establish structural/rendering properties, not scientific truth or a review score.

## Artifact contract

[DERIVED] The deliverable is **a verifier-grounded RL experiment with failure analysis**, represented by the following immutable records:

| Record | Required fields |
|---|---|
| Experiment | Split lineage; task definition; policy/tokenizer/decoder identities; checker/parser/environment hashes; metric and selection contract |
| Initialization | Base checkpoint; optional SFT examples, teacher identity and search/filter costs; pure-RL branch declaration |
| Attempt | Unique occurrence/group/attempt IDs; prompt lineage; behavior probabilities; generated tokens; termination; checker status; consumed/reserved work |
| Group | Exact members; raw rewards; finite/missing counts; sample/population SD; epsilon; detached advantages; zero-variance status |
| Update | Loss normalization axes; clipping; KL; entropy weighting; optimizer state; policy version; failure/abstention |
| Sampler | Proposal state; difficulty beliefs; selection probabilities or explicit approximation; refill cap; rejected groups |
| Evaluation | Frozen selected checkpoint; independent fixtures; candidates; pass1/passk; selected accuracy; diversity map; uncertainty and missingness |
| Integrity | Access boundaries; trusted result collector; contamination checks; formal statements/axioms; checker disagreement cases |
| Cost | All generation, rejected attempts, verifier work, retries, teacher/SFT work, training work and final evaluation |
| Failure report | Observed categories; source limitations; unsupported claims; exact versions before/after repair |

[DERIVED] Each record has a schema version and owner. An incomplete group is retained in the attempt ledger and excluded from group statistics under a frozen rule. Repeated prompts have separate occurrence/group identities. An unsuccessful, capped or errored attempt still consumes budget.

## Topic-completeness audit

[DERIVED] Every row below maps a concept or substantive variant to its canonical treatment and primary locators. “F/M/A” means Formulation, Mechanism and Algorithm, “I/R” means Implementation and Reproducibility, and “E/O/L” means Experimental design, Observations and Limitations. Each row's scope/why headings state its problem and baseline; each mechanism declares its estimator and approximation; its algorithm supplies bounded transitions; its implementation states work/state costs; its experiments/observations retain actual source findings; its siblings/extensions compare alternatives and documented successors; its failure/limits/repro headings close the validity contract. This common mapping is supplemented by topic-specific anchors rather than used to substitute one variant's method for another.

| Topic / variant | Formal/method/algorithm anchors | Implementation and resource boundary | Actual evidence/protocol and improvement locators | Limits/gaps |
|---|---|---|---|---|
| Reward source and typed RLVR | §35.1 F/M; Eqs35.0–35.3; Alg35.1 | §35.1 I; capped generation/checker; $O(BGL_{\max})$ storage | R35.8 §2–3, Appendix A,C; §35.1 E/O; R35.2 mixed-source boundary | Acceptance differs from correctness; stochastic/learned sources stay typed |
| Answer checking | §35.1 M: parsing, units, tolerance, symbolic domains | Parser/version and nonfinite handling; bounded checker work | R35.8 game oracle comparison; R35.3 §7 exact/substr boundary | No universal equivalence checker; gold substring is weaker than semantic correctness |
| Execution verification | §35.1 M; §35.6 M/A | Sandbox, fixtures, process limits, collector; all failures charged | R35.10 setup/controls; §35.6 E/O | Isolation is distinct from test completeness |
| Proof verification | §35.1 M; §35.6 M | Statement/elaboration/kernel/axioms identities | R35.9 §3.1–3.2, Figure2, §4, Appendix A–D | Learned grader is not kernel; S3 validation wording conflicts |
| Task sampling | §35.1 M; §35.3 Eq35.11; §35.4 Eq35.14/Alg35.4 | Proposal/group ledger; bounded refill | R35.4 §4, Appendix B.2,D–F | Accepted frequency and expected gradient direction are separate |
| GRPO own-mean baseline | §35.2 Eqs35.4–35.8; Alg35.2 | Detached $[B,G]$ statistics and $[B,G,L]$ ratios; $O(BGL)$ auxiliary work | R35.1 grouped rewards/reduction; R35.5/R35.4 comparison protocols in §35.4 E/O | iid own-mean factor; actual processed probabilities required |
| Leave-one-out baseline | §35.2 Eq35.5–35.6 | Same group sum, excluding self; $O(BG)$ | R35.3 §6.1.3, Appendix D.1; local exact derivation | Independence and uncoupled reward conditions; variance differs |
| Group SD and epsilon | §35.2 Eqs35.4–35.7 | Sample versus population; count1 undefined; finite guards | R35.1 utils789–820/trainer2591–2637; R35.4 Appendix C | Random denominator couples samples; epsilon is not an unbiasedness proof |
| PPO clipping and reference variants | §35.2 Eq35.8; §35.4 M | Asymmetric bounds; reference optional at beta0; token masking | R35.1 trainer2962–3037; R35.2 §3.2; R35.5 Appendix E | Clipping is not hard KL; no raw/processed probability substitution |
| Cold-start/SFT versus pure RL | §35.3 F/M; Eqs35.9–35.12; Alg35.3 | Initial checkpoint and teacher/SFT cost; finite stage caps | R35.2 §3.1–3.2; R35.3 §6–7 and Appendix C–D | Gold-answer likelihood is extra supervision; single-seed/confounded comparisons |
| GARL/PAFT boundary | §35.3 Eq35.12 and joint-score/ratio derivation; Observations warm-start stability | Prior pool, answer likelihood and normalized resampling; token forcing/cost | R35.3 §6.1–6.2, Appendix D; §7 Tables1–3; §7.3 Table3/Figure4 peak versus stable outcomes | Finite same-pool ratio bias; single seed; unresolved collapse mechanism; validation-peak text/caption disagree; no total-compute parity proof or pure binary-RL equivalence |
| Curriculum and accepted/rejected trajectories | §35.3 Eq35.11/Alg35.3; §35.4 Eq35.19 | $O(N)$ beliefs; append-only all-attempt ledger | R35.4 §4, Appendix D–F; R35.2 §3.1 loss-masked wrong segments | Difficulty staleness; rejected work cannot disappear |
| Length penalty, cap, truncation | §35.3 M; §35.4 F/M | Reward coefficient versus censored status versus loss mask | R35.1 truncated masks2334–2344; R35.3 §7 rationale budget | A cap is not natural termination; masking does not reveal terminal reward |
| DrGRPO-style reconstruction | §35.4 Eq35.13/M/Alg35.4 | Disable reward scaling and fixed-length denominator separately | R35.1 dr_grpo code3014–3037; R35.5 Table 1 comparator protocol | Older origin excluded; release loss flag does not reproduce all historical recipe choices |
| DAPO-style reconstruction | §35.4 Eq35.13–35.14/M/Alg35.4 | Global-token denominator; clipping/refill/truncation independent | R35.1 dapo reduction; R35.4 dynamic-sampling comparator and costs | Exact original 2025 recipe not admitted; current components explicitly bounded |
| Dynamic sampling / zero variance | §35.3 Eq35.11; §35.4 Eq35.14/Alg35.4 | All candidates retained; finite refill cap; partial batch rule | R35.4 Appendix B.2 proof versus E cap 8 and F costs | Unbounded iid Wald identity does not prove capped/adaptive neutrality |
| AsymGRPO | §35.4 Eq35.15/M; exponent branch Alg35.4 | Positive/negative exponents; boundary group branch; clipped token update | R35.5 v1 §2,4, Appendix D–F; actual model/data/optimizer table | Main zero-group handling not inferred; MATH500 checkpoint selection |
| ARCUS | §35.4 Eq35.19/M; belief/select branches Alg35.4 | $O(N|\Psi|)$ scalar scoring + $MG$ rollouts; approximate inclusion | R35.4 §4, Appendix D–F;3seeds/BF16/8 H100/300updates | Gaussian beliefs not calibrated by definition; capped selection not unbounded proof |
| OPEFO | §35.4 Eqs35.16–35.18/M; detached weighting Alg35.4 | Full-vocabulary diagnostic cost; zero-total branch; no direction guarantee | R35.6 §3–6/Appendix A/Figure 3; exact protocol/table conflict | Cross-action derivation gap; LR/update confound; benchmark selection |
| Pass1/passk and verifier selection | §35.5 Eqs35.20–35.22/Alg35.5 | All candidates/statuses; stable hypergeometric computation; bounded evaluation | R35.7 §2–4; R35.4 E–F; R35.6 §6.4 | iid required for product; oracle coverage differs from deployable selection |
| Diversity/generalization/new capability | §35.5 Eqs35.10,35.23–35.24/M | Count/length controls; solution-family map; lineage-level split | R35.7 hard-slice controls and three-seed findings | Finite absence never proves zero base support; lexical entropy is insufficient |
| Reward gaming and insufficient tests | §35.6 Eqs35.25–35.26/M/Alg35.6 | Versioned challenge loop and one final audit; full search costs | R35.10 model organism; R35.9 learned-judge errors | Initial error bounds do not transport automatically to optimized policies |
| Leakage/isolation/independent audit | §35.6 M/A/I | Separate trusted collector and final credentials; retained query history | R35.10 simulated setup/controls; proposed artifact boundary | Binary repeated feedback is adaptive; container name is not isolation proof |
| Nonverifiable transfer / trace causality | §35.6 Eqs35.27–35.28/M | Task-slice weighting and intervention definition | R35.11 proxy limitation; R35.10 ordinary/beyond-episode controls | Text association is not causal proof; no universal transfer guarantee |

[DERIVED] This audit maps source-supported treatments and explicit gaps. It does not assert that every source discloses a fully reproducible training recipe. A NOT-DISCLOSED cell limits the claim rather than excusing an invented parameter.

## Finite mathematical checks

[DERIVED] Independent finite checks are deterministic calculations, not training experiments. The existing ignored helper checks group-mean bias, token normalization, dynamic-filter weighting, correlated coverage, entropy cross-action effects and neighboring mathematical contracts. At the2026-10-09 author check, the shared helper passed19 finite checks and the chapter-local helper passed8. Their ignored JSON reports retain the calculations; no GPU or source benchmark reproduction is implied.

[DERIVED] The executed chapter-local checks enumerate Bernoulli groups to verify Eq35.6, compare sample/population SD with positive epsilon, calculate hypergeometric-estimator expectations, test entropy derivatives by finite differences, and verify token reservations under failures. A length-dependent stopping counterexample gives expected c/n=0.625 when fixed-policy pass1=0.5, while the budget-defined any-success event is 0.75. The mathematical statements remain conditional on their explicit premises; a successful finite check does not prove an unrestricted neural-network theorem.

## Proposed empirical verification

### Experiment 35.1 — Matched estimator and sampling study

**Hypothesis.** [ASSUMED] Estimator/reduction/sampling choices produce measurable differences in accepted-update yield and fixed-budget correctness; the direction is left open.

**Setup.** [ASSUMED] Start all arms from one publicly available checkpoint with the same tokenizer, initialization, prompt template, checker and action-probability contract. Freeze a development-selected configuration before one independent final evaluation.

**Independent variables.** [ASSUMED] Own-mean versus leave-one-out; sample/population/no SD; response/fixed/token reduction; symmetric/asymmetric clipping; no-refill versus capped mixed-group sampling. Change one variable at a time before testing any combined recipe.

**Controlled variables.** [ASSUMED] Task pool, candidate/token/checker budgets, learning-rate schedule, optimizer, seeds, update reuse, decoding, response cap, reference coefficient, precision and evaluator.

**Dataset/workload.** [ASSUMED] A lineage-separated finite mathematics and code-task pool with independent hidden tests. Publish task construction and leakage review before running. No claim is made that a proposed task pool is already collected.

**Hardware.** [ASSUMED] Select and record an available accelerator/CPU/sandbox configuration; no hardware run has occurred.

**Metrics.** [ASSUMED] Unconditional pass1, passk at fixed candidate and token budgets, independent selected accuracy, correct-only diversity, zero-variance fractions, rejected generation, attempts per accepted update, checker disagreement, total tokens/time/energy if measured.

**Baselines.** [ASSUMED] Untrained checkpoint; specified ordinary GRPO; one-at-a-time DrGRPO-style and DAPO-style component reconstructions; no claim of historical-paper replication.

**Expected result.** [ASSUMED] No accuracy winner is prespecified. Exact mathematical invariants should hold within numerical tolerance, and finite budget caps should never be exceeded.

**Ablation.** [ASSUMED] Disable scaling, reference KL, refill, truncation masking and entropy weights separately. Test incomplete groups and all-fail/all-pass groups explicitly.

**Interpretation.** [DERIVED] A source-style accuracy increase without matched total cost or independent correctness does not establish a superior method. Report per-prompt differences and seed-aware uncertainty.

**Threats to validity.** [DERIVED] Limited task support, checker errors, contamination, unequal information, decoding mismatch, optimizer confounds, adaptive test feedback and insufficient seeds can invalidate attribution.

### Experiment 35.2 — Verifier disagreement and integrity study

**Hypothesis.** [ASSUMED] Optimized candidates can expose checker errors absent from an initial ordinary-output audit.

**Setup.** [ASSUMED] Use a bounded development challenge pool with inert test artifacts; keep final hidden fixtures and trusted result collector inaccessible to candidates. Freeze a version before one final audit.

**Independent variables.** [ASSUMED] Candidate source: initial policy, trained policy and bounded adversarial-development search; checker version before/after a documented repair.

**Controlled variables.** [ASSUMED] Task identities, execution caps, independent correctness criteria, candidate work budget and evaluator access boundary.

**Dataset/workload.** [ASSUMED] Benign synthetic programs, formal statements and numerical-answer cases covering parser, test, translation and collector failure categories. No real external service is attacked.

**Hardware.** [ASSUMED] Record isolated CPU/container and optional generation hardware; this study remains unexecuted.

**Metrics.** [ASSUMED] False acceptance/rejection by slice, semantic disagreement, timeout/error rates, collector-integrity failures, consumed work and independent final-audit risk.

**Baselines.** [ASSUMED] Ordinary random candidates and unoptimized policy candidates under matched budgets.

**Expected result.** [ASSUMED] No failure rate is asserted in advance. Any unauthorized access to trusted evaluator state violates the proposed integrity contract.

**Ablation.** [ASSUMED] Vary parser strictness, test coverage and candidate-visible information separately. Keep final audit outcomes unavailable to development.

**Interpretation.** [DERIVED] A repaired checker defines a new reward version. Old training results remain associated with the original checker and cannot be retrospectively upgraded.

**Threats to validity.** [DERIVED] A finite challenge taxonomy cannot establish universal soundness, independence or deployment assurance.

## Editorial closure

[DERIVED] Required review checks are nine canonical files, all 15 section headings, four exact observation paragraphs, six native figures/section, an adjustable calculator tied to a numbered derivation, two rail instruments, bounded aligned algorithms, monotone equation numbers, valid source keys, original-date histories, topic/variant audit, valid sibling chains and no unsupported empirical claims.

[UNVERIFIED] Independent source reproduction and GPU experiments remain unexecuted. Chief-scientist review and any numerical quality score are external judgments; this file does not certify them.
