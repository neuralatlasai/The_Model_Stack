---
id: ms.verification.22
entity_type: verification
title: Verification — Chapter 22
short_title: Verification — Chapter 22
volume: 1
part: 4
chapter: 22
section: null
slug: verification
parent: ms.chapter.22
prev_sibling: ms.section.22.6
next_sibling: ms.references.22
children: []
prerequisites: [ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.chapter.12, ms.chapter.19, ms.chapter.20, ms.chapter.21]
downstream: [ms.chapter.23, ms.chapter.24, ms.chapter.31]
related: [ms.chapter.49, ms.chapter.50, ms.chapter.63]
relations: []
axes: {lifecycle: [continued_training, adaptation], mechanism: [distribution_transition, retention, adaptation_decision], feedback_setting: [], modality: [text]}
papers: [P13, P40]
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# Verification — Chapter 22

## Artifact specification

[DERIVED] The chapter artifact is an **adaptation decision record and retention evaluation**. Each record carries stable IDs connecting data, stage, candidate, evaluation, and release. The following schemas define the deliverable; they are not claims that the corresponding training was performed.

| Record | Required fields |
|---|---|
| Stage manifest | stage ID; original release label; input checkpoint hash; architecture configuration; tokenizer/serialization hash; objective and target mask; normalization; trainable tensor identities; optimizer definition; moment/counter policy; scheduler clock/horizon; RNG/data-cursor policy; consumed-token budget; stop/failure rules |
| Data/exposure ledger | source ID and snapshot; origin and permission; train/development/test membership; generator provenance if synthetic; filtering/dedup/leakage rules; available unique tokens and bytes; sampling unit; intended and realized fractions; consumed positions; supervised targets; length/boundary histograms; repetitions |
| Intervention ledger | prompt configuration; evidence/index snapshot; retrieval policy and context budget; training objective; parameterization; fixed and recurring budgets; candidate-selection rule; rejected trial costs |
| Retention record | exact starting artifact; additional operational baseline if different; domain and retained populations; oriented metrics; per-slice tolerances; raw predictions; uncertainty and multiplicity procedures; checkpoint-selection history; acceptance/rejection |
| Lifecycle record | data/index preparation; every pilot and training run; evaluation; release conversion; inference/retrieval/retry costs; demand horizon; freshness/refresh assumptions; runtime/hardware; measured energy if available; currency/rates; excluded costs |
| Rollback manifest | prior model and tokenizer; prior index and access policies where relevant; serving configuration; compatibility checks; rollback trigger; rollback validation; retained storage |
| Evidence-gap record | source key; inspected revision/locator; missing detail; NOT-DISCLOSED or UNVERIFIED status; affected claim; required future check |

[DERIVED] A rejection record is complete when it identifies the failed gate, evidence, likely cause, and corrective action without silently replacing the test set or success criterion.

## Verification task

### Experiment 22.1 — Fixed-domain intervention and retention comparison

**Hypothesis.** [ASSUMED] A specialization is admitted only if it improves the chosen domain task by a useful margin, preserves every required retained capability within its tolerance, and meets the same deployment constraints as competing interventions. This is a proposed decision hypothesis, not a claim that continued pretraining must win.

**Setup.** [ASSUMED] Select one legally usable base checkpoint supporting a 4,096-token input context under a pinned tokenizer and runtime. Use one versioned collection of technical manuals, divided by document family into training, development, and sealed test partitions; add a temporal holdout of later documents when freshness is part of the task. The task is question answering with correct source attribution and a constrained response schema.

**Independent variables.** [ASSUMED] Minimum arms are: tuned prompt baseline; retrieval with a frozen generator; response SFT; continued pretraining; and retrieval plus continued pretraining for the complementarity contrast. Compare adapter and full updates under the same continued-pretraining objective in a separate ablation. For training arms, use three independently recorded seeds.

**Controlled variables.** [ASSUMED] Hold the base artifact, tokenizer, task acceptance rule, development/test membership, decoding policy, permitted evidence corpus, serving workload, and quality/service gates fixed. Freeze arm-specific prompts using only development data. Permit the evidence-access difference intentionally, because the operational comparison asks how to solve the task; isolate parameter adaptation separately with matched evidence policies.

**Dataset/workload.** [ASSUMED] Use 2,000 sealed domain requests and at least 5,000 examples for each retained slice. Slices cover the chosen general task, supported language, short and long input regimes, and required response format; overlap is recorded. These are planning sample sizes, not a guarantee of statistical power. Increase sample size or report inconclusive intervals if the predeclared useful effect cannot be resolved.

**Hardware.** [ASSUMED] Choose and record a device topology that passes the base model's memory and inference gates before training. Pin accelerator model/count, memory, driver, framework, attention implementation, dtype, distributed topology, and container or equivalent environment. No exact hardware or package execution is asserted here.

**Metrics.** [ASSUMED] Record accepted-task fraction, task-specific correctness, source attribution, schema validity, target and retained token-mean losses, per-slice utility differences, p50/p95/p99 end-to-end latency, accepted-task cost, consumed targets, available unique tokens, and all trial device time. Keep source-reported loss proxies separate from behavioral metrics.

**Baselines.** [ASSUMED] Compare each adapted artifact with the exact starting checkpoint. Also retain the current operational release as a separately named baseline if it differs. The prompt baseline must be tuned under the same development budget. The retrieval arm's index and access rules are frozen before final evaluation.

**Expected result.** [ASSUMED] No winning intervention or score is predicted. A useful outcome is either one or more feasible arms with supported gains, or rejection/inconclusiveness with an explicit evidence gap. The hypothesis is rejected for a candidate if domain improvement, retention, or service feasibility fails its declared gate.

**Ablation.** [ASSUMED] Test no replay versus retained target fractions 1%, 5%, and 10% at fixed total consumed-target budget; separately report a fixed-new-domain-exposure comparison. Compare weight-only reset and full-state continuation only when compatible historical state actually exists. Never fill missing optimizer history with invented values. Add sufficient-evidence diagnostic context to distinguish retrieval from evidence-use failures, without using that privileged arm as the production score.

**Interpretation.** [DERIVED] The factorial retrieval-plus-training contrast isolates complementarity under matched evidence policy. Adapter/full-update comparison isolates parameterization only with the same objective and selection rule. A lower target corpus loss without task improvement rejects the proposed loss-to-task mechanism for this setup.

**Threats to validity.** [DERIVED] Document-family leakage, synthetic derivatives of held-out questions, repeated test-driven prompt selection, baseline-checkpoint substitution, shared evaluator bias, unequal search budgets, proxy replay mismatch, latency measured outside the service boundary, and stale index caches can invalidate the comparison. Record them before unsealing the test.

## Acceptance criteria

[ASSUMED] Thresholds below are chosen verification inputs. Their sensitivity must be reported; they are not source findings or universal deployment requirements.

| Gate | Proposed criterion | Rejection or unresolved consequence |
|---|---|---|
| Domain utility | Simultaneous 95% lower confidence bound on accepted-task improvement at least 3 percentage points over the tuned prompt baseline | Smaller or inconclusive gain does not admit specialization on this criterion. |
| Retention | Every required slice has 95% lower bound on utility difference at least −2 percentage points relative to the exact starting artifact | One failed slice rejects the candidate; an average cannot compensate. |
| Uncertainty | Paired document-family bootstrap, 10,000 resamples, fixed seed, with a predeclared family-wise procedure across required comparisons | Unknown or unpowered intervals remain inconclusive. |
| Exposure accounting | Realized source target fractions sum to one within $10^{-6}$; no positive-share source has zero supervised targets | Reject the sampler/configuration if normalization is inconsistent. |
| Objective parity | Direct aggregate loss versus partitioned sum/count computation differs by at most $10^{-6}+10^{-5}|L_{\mathrm{reference}}|$ in the selected reference precision | Investigate normalization or numerical mismatch before a training comparison. |
| State boundary | Tensor identities, shapes, parameter groups, tied weights, moments/counters, scheduler, and data/RNG policy match the declared transition | A successful file load alone does not pass. |
| Resource boundary | Every candidate and rejected trial appears in the ledger; serving and accepted-task denominators share one window | Do not publish a cost winner with missing expenditures. |
| Deployment | Chosen hardware passes predeclared memory, p99 latency, authorization, schema, and coherent rollback checks | Offline domain gain does not override infeasibility. |

[DERIVED] A bootstrap interval is conditional on its resampling unit and population. Multiple training seeds characterize optimization variability; resampling task examples does not replace that evidence. If seed and task uncertainty are combined, specify the hierarchy and estimand.

### Experiment 22.2 — Analytical and boundary checks

**Hypothesis.** [ASSUMED] The chapter's equations and transition contracts behave correctly at their stated boundaries.

**Setup.** [ASSUMED] Evaluate the analytical configurations with a trusted high-precision arithmetic reference; inspect a complete state manifest without training.

**Independent variables.** [ASSUMED] Source target lengths and sampling fractions; moment coefficient and accepted-step count; replay gradient alignment; request horizon and accepted fraction.

**Controlled variables.** [ASSUMED] Keep equation definitions and units fixed.

**Dataset/workload.** [ASSUMED] Synthetic scalar inputs only; no fabricated model benchmark.

**Hardware.** [ASSUMED] Any recorded local arithmetic environment suffices; no accelerator claim.

**Metrics.** [ASSUMED] Absolute/relative arithmetic error and explicit boundary rejection.

**Baselines.** [ASSUMED] Closed-form values: equal sequence weights with 1,024 versus 4,096 targets produce 20% target share; $a=-2,c=4$ gives replay threshold $1/3$; fixed cost 10,000, one million requests, variable cost 0.01, accepted fraction 0.8 gives cost 0.025 per accepted task.

**Expected result.** [ASSUMED] Values agree within $10^{-10}$ relative error or $10^{-12}$ absolute error for these ordinary scalar inputs.

**Ablation.** [ASSUMED] Test equal lengths; zero source share; unavailable source; $\beta=0$; a moment reset with a stale correction counter; $q=0$; zero break-even denominator; and $\nu=0$ in the freshness limit.

**Interpretation.** [DERIVED] Arithmetic consistency checks the derivation and instrument, not training efficacy.

**Threats to validity.** [DERIVED] Matching a formula implementation to itself is circular. Retain an independent derivation or arithmetic reference and inspect units and limiting cases.

## What this edition did not do

[DERIVED] No model was pretrained, adapted, instruction-tuned, or deployed for this chapter. No retention score, benchmark reproduction, device throughput, money, or energy measurement is attributed to the book. Browser/render checks, when performed by the website workstream, establish presentation behavior only. The experiments above remain proposals.

## Topic-completeness audit

[DERIVED] Each row maps the plan's required coverage to the manuscript. The standard obligations—problem, formal contract, mechanism, mathematical account, procedure, execution/resources, reported protocol/observations, alternatives/lineage, failure/validity, and reproducibility—are developed under the fixed H2 headings in each linked section. Explicit gaps prevent a stronger claim; they are not invented completion.

| Plan concept or substantive variant | Manuscript anchors | Primary evidence/locator | Remaining gap and review consequence |
|---|---|---|---|
| Continued, domain-adaptive, task-adaptive stages | [22.1 Formulation](22-1-stage-definitions.md#formulation), [Mechanism](22-1-stage-definitions.md#mechanism), [Algorithm](22-1-stage-definitions.md#algorithm), reported protocol and observations | R22.1 §§3–4/Table 3/Appendix B; R22.2 §2.3 | No common objective is inferred from labels. Historical encoder evidence does not certify a decoder recipe. |
| Release-dependent mid-training | [22.1](22-1-stage-definitions.md), [22.2 screening](22-2-distribution-transitions.md#experimental-design) | R22.4 §§2.1,3.5.1–3.5.4 | Full release state history is not reconstructed. Classification procedure has no training dataset because it audits records. |
| New domains/languages and code/math emphasis | [22.2 Formulation/Mechanism](22-2-distribution-transitions.md#formulation) and observations; Eq. 22.4–22.6 | R22.2 §§2.1–2.3/Table 1; R22.3 §§5–6 | A universal source ratio or pilot transfer rule is unavailable. |
| Long context and changing sequence structure | [22.2 Mechanism](22-2-distribution-transitions.md#mechanism), implementation and failures | P13 §§4.2–4.3/Figure 8; R22.4 §3.6 inspected as context | Attention and positional mechanics remain canonical in earlier architecture chapters. Stage-specific communication is not disclosed for an unspecified system. |
| Restart, continuation, scheduler reset, LR choice | [22.3](22-3-optimizer-transitions.md), Eqs. 22.7–22.10 and Algorithm 22.3 | R22.3 §§4–6, Appendix A.4/Figure 13 | Controlled ablation does not establish a universal optimizer restart policy. |
| Checkpoint compatibility | [22.3 Implementation](22-3-optimizer-transitions.md#implementation), state-audit procedure | R22.6 warning/name note; R22.7 state_dict note; R22.8 train/save interfaces | API reading does not verify a runtime; DeepSeek moment carry-over remains NOT-DISCLOSED. |
| General-skill regression and baseline identity | [22.4 Mechanism/Observations](22-4-retention-and-interference.md#mechanism) | R22.2 Table 4; R22.5 §§2–4 | Loss retention is not complete behavioral retention. |
| Replay, capability balance, targeted validation | [22.4](22-4-retention-and-interference.md), Eqs. 22.11–22.15 | R22.5 §3.1/Table 1/Figures 1,3,6 | Local gradient threshold is a derived diagnostic, not an empirically validated controller. Sequential-task methods belong to Chapter 24. |
| Retrieval and prompt/context interventions | [22.5](22-5-alternative-interventions.md), Eqs. 22.16,22.18 | P40 §§2–4/Tables 1–2 | No complete head-to-head comparison is claimed. A prompt information-bound statement needs no reported dataset because it is conditional analysis. |
| SFT, adapters, full updates under matched objective | [22.5 Mechanism/Siblings](22-5-alternative-interventions.md#mechanism), Eq. 22.17 | Canonical Chapter 23 and Chapter 31 destinations; original synthesis here | Specific adapter and SFT methods are not duplicated; finite-budget outcomes remain unmeasured. |
| Data, frequency, freshness, amortization | [22.6](22-6-adaptation-economics.md), Eqs. 22.19–22.21 | Derived accounting; R22.9 §§2.4,2.7 for budget-revision case | Named deployment prices, demand, and energy UNVERIFIED. Poisson freshness is an explicit sensitivity scenario. |
| Rollback and deployment constraints | [22.6 Mechanism/Implementation](22-6-adaptation-economics.md#mechanism), Algorithm 22.6 | R22.9 §2.7/Figures 5–7; derived release contract | Recovery example is not a domain-task cost comparison. Coherent rollback must be tested for the chosen deployment. |

## Improvement lineage and evidence boundary

[DERIVED] The chapter's dated lineage connects historical domain/task adaptation, mixed decoder specialization, controlled replay/schedule studies, later data-injection scaling, staged mixture integration, and 2026 recovery diagnostics. These works study different populations and mechanisms. No single comparison establishes that each later work supersedes its predecessor on the same objective. The manuscript explicitly restricts claimed improvements to their disclosed protocol.

## Editorial status

[DERIVED] Manuscript draft. Structural completeness, equation/figure validation, source inspection, and coverage mapping support reviewability. Scientific review still requires expert assessment of the synthesis and any future execution evidence. The draft carries the evidence gaps in [references](references.md#evidence-gaps).
