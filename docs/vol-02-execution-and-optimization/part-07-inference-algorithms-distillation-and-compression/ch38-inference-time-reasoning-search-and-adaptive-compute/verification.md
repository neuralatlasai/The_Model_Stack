---
id: "ms.verification.38"
entity_type: "verification"
title: "Chapter38 verification"
short_title: "Chapter38 verification"
volume: 2
part: 7
chapter: 38
section: null
slug: "verification"
parent: "ms.chapter.38"
prev_sibling: "ms.section.38.6"
next_sibling: "ms.references.38"
children: []
prerequisites: ["ms.chapter.6", "ms.chapter.32", "ms.chapter.35", "ms.chapter.37"]
downstream: ["ms.chapter.39", "ms.chapter.47", "ms.chapter.61", "ms.chapter.63", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["inference", "evaluation", "assurance"], "mechanism": ["search", "verification", "adaptive_compute"], "feedback_setting": ["verifiable_reward", "environment_return"], "modality": ["text", "code"]}
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

# Chapter38 verification

## Artifact specification

[DERIVED] The artifact is **a quality-versus-inference-budget frontier**, as fixed by the chapter matrix. Its unit is a frozen inference policy evaluated on a declared task measure, with every consumed resource inside an explicit boundary. The following files are proposed research outputs, not existing executed benchmark artifacts:

| File / table | Required fields |
|---|---|
| `experiment.json` | Immutable experiment ID; task/split lineage; authorized evidence; model/tokenizer/processor/checker/tool identities; hardware/precision/runtime; metric/selection rules; preparation/deployment boundary |
| `policy-configs.jsonl` | Policy ID; serial/parallel/search/router/latent variant; all caps and thresholds; randomization law; priors; score reductions; stop law; development freeze hash |
| `attempt-ledger.parquet` | Task, group, attempt and parent IDs; submitted and completed time; terminal status; requested/reserved/actual resource vector; prompt/context/answer lengths; cancellation acknowledgement; scorer/tool/evaluator calls |
| `search-events.parquet` | Node/edge/cache/environment IDs; expansion lineage; visits and in-flight updates; backup observations; pruning premises; particle weights and ancestry where applicable |
| `labels.parquet` | Candidate hash; independent evaluator identity; known outcome or unknown/error status; fixture/proof/test identity; selection-versus-audit distinction |
| `frontier.parquet` | Policy/task-mixture/budget coordinate; unconditional selected-answer quality; oracle coverage admission status; uncertainty; work, time quantiles, currency and memory; missingness bounds |
| `preparation.parquet` | Oracle-response pools; feature generation; scorer/router training; tuning and evaluation costs; amortization assumptions |
| `reproduction.md` | Exact environment/checkpoint hashes; seed schedule; source deviations; unavailable fields; instructions to regenerate each table |

[DERIVED] Unknown hardware/FLOP fields remain unknown metadata, not zeros in a numerical total. An implementation can define a valid token-budget frontier without claiming a FLOP frontier. An attempt is never removed merely because it was cancelled, invalid, truncated, rejected by selection or independently unlabeled.

## Verification task

> **Experiment — Matched-budget serial versus parallel inference.** [ASSUMED] This is the proposed falsifiable protocol, not a report of executed GPU experiments.
>
> **Question.** Does an apparent quality gain survive matching total declared cost after including selection, verifier, unsuccessful-attempt and preparation costs? The chapter's central measurement claim is rejected if its complete-ledger frontier cannot be independently reconstructed, if statuses disappear from denominators, or if its nominally matched arms consume materially different declared budgets without disclosure.
>
> **Arms.** Freeze a common checkpoint, tokenizer, processed generation distribution and independent evaluator. Compare a serial chain; independent candidate sampling with plurality; best-of-$N$ with a fixed scorer; bounded tree search; and a development-trained adaptive router. Treat ATF/LRT as separate representation-specific studies because they change weights/modules and cannot inherit the common-checkpoint causal comparison. Include an unscored candidate-coverage diagnostic where a valid independent checker is available; do not present oracle selection as a deployable arm.
>
> **Task measure and splits.** Separate preparation/training, policy selection and final audit by task lineage, including near-duplicate and answer/template contamination checks. Predeclare easy/hard strata and mixture weights. A task may be used to tune one policy but cannot then serve as its untouched audit. Publish all eligible task IDs before final collection; no performance-based post hoc deletion.
>
> **Budgets.** Run separate studies for generated tokens, accelerator work, elapsed time and currency. A match in one coordinate is not a match in the others. Include prefill/context dependence, scoring, retrieval/tools and independent evaluation in the appropriate coordinate. Define whether final evaluator cost is inside deployment accounting or separately reported; include it in total scientific experiment cost either way. Charge all consumed cancelled work. Add per-query hard caps and absolute deadlines even when a router is optimized against an average budget.
>
> **Collection.** Use immutable attempt IDs, pre-reserved evaluator allowances and bounded cancellation/draining. Preserve known failures and unknown labels separately. For a fixed-$n$ iid coverage estimator, require all prespecified candidates and labels. For a budget-stopped collection, report the budget-defined event or bounds as a distinct estimand. Record actual processed behavior probabilities if a method uses importance weights.
>
> **Controls.** Match model/evidence/checker access and task records. Separately ablate scorer quality versus candidate count, process versus outcome guidance, irreversible proxy pruning versus heuristic futility, dynamic versus static concurrency, no-refinement versus bounded revision, and feature/oracle preparation costs. For mode learning, compare rounded/unrounded discount and training/evaluation cap conventions without claiming the source already isolated each effect. For latent methods, retain the source-specific flow/refiner computation, answer length and measured latency boundary.
>
> **Statistics.** Use paired task-level resampling retaining every arm/candidate for each resampled task. Report training seeds, inference draws and task uncertainty separately. Predeclare the comparison family and uncertainty method. Publish both unconditional quality and conditional complete-label diagnostics. Show unknown-label lower/upper bounds and budget-overrun/tail distributions beside means.
>
> **Output.** Publish nondominated points under each declared resource axis, source/raw-record reconstruction scripts, preparation-amortization curves and mixture-sensitive rankings. A result showing no advantage is a valid outcome. No proposed method is assigned a guaranteed winning arm.

## Acceptance criteria

[ASSUMED] The proposed ledger must account for100% of submitted immutable attempt IDs with exactly one terminal record. Duplicate finalization must change neither consumed cost nor in-flight counts. Active counts and reservations must remain nonnegative; budgeted actual cost must not exceed its admitted enforceable allowance. Unreclaimed/quarantined capacity remains unavailable until an explicit release. A denied reservation cannot execute its dependent call.

[ASSUMED] A nominal budget match should use the same hard bound and disclose realized consumption; if comparing an average match, publish the measured difference and uncertainty instead of silently accepting a fixed tolerance. For a numerical serving study, a preregistered tolerance such as1% aggregate token/work difference may be used only if all counted coordinates and overshoots are published. Deadline compliance and p95/p99 behavior are separate outcomes. No match is accepted by comparing response length alone.

[ASSUMED] All final audit tasks remain in the unconditional denominator. Missing labels produce bounds or NOT_ESTIMABLE, never fabricated successes/failures. Fixed-$n$ iid pass@$k$ is admitted only under its stated collection and label conditions. Every reported point identifies task mixture, evaluator, cost boundary and uncertainty; incomplete physical-resource fields cannot support superiority on that coordinate.

## What this edition did not do

[DERIVED] This edition inspected primary full texts, original histories, selected official metadata and a pinned author implementation. It derived analytical contracts and checked native figures. It did **not** execute GPU training, benchmark inference, a hosted-provider experiment, service-load collection or the proposed matched-budget study. It does not independently reproduce any paper-reported score, certify a review rating or establish universal policy dominance. Browser/UI checks performed elsewhere in the project evaluate presentation, not these scientific outcomes.

## Topic-completeness audit

[DERIVED] This matrix records concept and substantive-variant coverage. “Derived” means the mathematics is taught from stated premises without a newness claim or an inadmissible historical citation. Source locators identify the actual recent study; absence of an isolated empirical comparison remains an explicit gap. Each section also includes implementation/resources, source protocol, observations, alternatives, failure modes and reproduction fields under its15 fixed headings.

| Canonical concept / variant | Manuscript method, mathematics and algorithm anchor | Primary evidence / exact locator | Resource and limitation closure; remaining gap |
|---|---|---|---|
| Serial deliberation | [38.1 Formulation](38-1-computation-dimensions.md#formulation), Eqs38.0–38.3; Algorithm38.1 | R38.8 §5.2/AppE.8; R38.2 Method/AppC | Work/span, context/answer cost and deadlines explicit; no common-model causal study across all variants |
| Parallel candidates / orchestration |38.1 Intuition/Mechanism; Algorithm38.1 | R38.8 §§3,5.2,Table6 | Critical steps distinguished from work/wall time; matched total compute and raw uncertainty gap |
| Retrieval/tool computation |38.1 Mechanism/Implementation | R38.8 §5.2,AppE.8 | New information and external side effects retained; no isolated retrieval/tool efficacy claim |
| Verifier calls / external search |38.1 Eq38.2/Algorithm38.1;38.3 Mechanism | R38.3 §4–5 | Scoring queues and evaluation costs included; correctness contract depends on Chapter32 checker validity |
| Self-consistency / plurality | [38.2 Formulation](38-2-candidate-aggregation.md#formulation), Eq38.4; Algorithm38.2 | R38.7 §§3–6,AppA/B | Normalization, ties, abstentions and all attempts explicit; prompt heterogeneity limits pooled interpretation |
| Strict binary majority |38.2 Eq38.5; Mechanism | R38.7 §3 as recent comparison context; mathematical derivation owns binary premise | Binary correctness model not substituted for multiclass plurality; no recent original novelty claim |
| Best-of-$N$ / noisy scorer |38.2 Eq38.8/9; Algorithm38.2 | R38.7 §§5–7,AppD/H | Scorer exploitation/selection exposure and cost explicit; source does not establish universal verifier-error bound |
| Weighted voting |38.2 Eq38.7; Algorithm38.2 finite nonnegative admission | R38.7 §§5–7 and multiplicity appendix | Actual weight validity and OOD selection limits explicit; calibration alone insufficient |
| Correlated errors / wrong-answer concentration |38.2 Eq38.6 and reported experiments | R38.7 §§3–8,AppA/B/D | Exchangeable variance is not coverage; wrong-answer collision not sampling dependence; only two matched weight pairs |
| Tree search / retained state | [38.3 Formulation](38-3-guided-search.md#formulation), Eq38.10; Algorithm38.3 | R38.3 §§2–5,AppA/B | Expansion insertion, cache/environment identity, cancellation and exactly-once finalization taught |
| Beam / diverse beam / best-first |38.3 Mechanism and Eq38.10 | R38.3 §5, beam8 comparison | Derived priorities/diversity objective and expansion costs; no isolated diverse-beam experiment in admitted set |
| MCTS / WU-PUCT / backup |38.3 Eq38.11/13; Algorithm38.3 | R38.3 §4,AppA/B | Mean versus maximum backup, in-flight effects and slot invariants explicit; no serial trajectory-equivalence guarantee |
| SMC / approximate twists |38.3 Eq38.14; Algorithm38.4 | R38.10 §§3–6,Theorem5.1,AppE.6 | Target, proposal support, ancestry, ESS, finite-$N$ and all calls explicit; theory-only; optional stratified proof concern excluded |
| Process / outcome scorer and pruning |38.3 Eq38.12; Algorithm38.3 | R38.3 §§4.2–4.3,Table1 | Proxy bound versus correctness; selective heuristic loses guarantee; negative quality regime preserved |
| Environment feedback |38.3 Mechanism/Implementation | R38.8 AppE.8; R38.3 state/search protocol | Legal transitions, side effects and stale-cache risk explicit; no passing-test⇒general-correctness inference |
| Critique / refinement | [38.4 Mechanism](38-4-revision-and-adaptive-stopping.md#mechanism); Algorithm38.5 | R38.2 mode/control context; mechanisms derived | Promotion requires complete admissible known score, absent initial artifact and empty return handled; isolated critique protocol gap |
| Uncertainty-driven allocation / diminishing returns |38.4 Eq38.19,Mechanism | R38.1 §§2–5; R38.2 Method | Value of further information is expected utility minus full cost, not entropy alone; feature calibration and hard caps remain requirements |
| Deterministic / randomized budget policies |38.4 Eqs38.15–38.17 and counterexamples | R38.1 AppB.4/C.4/E.3 | Randomized LP duality separated from deterministic gap; corrected slack bound derived; unavailable source repo |
| Mode-based learned stopping |38.4 Eq38.18 and protocol table | R38.2 Eq8,Tables3–5,AppsB–D | Positive/negative reward balance, warmup/cap inconsistencies and OOD failures explicit; rounded pin gap |
| Textual traces / reasoning controls | [38.5 Scope](38-5-representation-and-evidence.md#scope), Eq38.25 | R38.9 §§9.1–9.2.2,Figures28–30 | Controllability and causal faithfulness separated; unpinned official card and undisclosed internals remain gaps |
| ATF / CR-VAE / flow integration |38.5 Eqs38.20/38.21; Algorithm38.6 ATF branch | R38.4 §§3–4,AppsA–F,Table1 | Flow-head calls, backbone/cache, guidance, stopping, answer tokens and separate profile boundary taught |
| Latent RL transition surrogate |38.5 Eq38.22 and Mechanism | R38.4 AppA | Dimension-root ratio and squared-error alternative; not exact trajectory/marginal ratio; implementation pin gap |
| LRT proposer / recurrent refinement |38.5 Eqs38.23/38.24; Algorithm38.6 LRT branch | R38.5 §3,Table3,AppsA/E; pinned modules/decoder/train files |45 passes, truncated gradients, frozen activation work,32→4 slot shift and factorial comparison explicit |
| Undocumented provider behavior |38.5 Limitations/Reproducibility | R38.9 disclosure boundary | No architecture, latent-step count or hidden compute invented; not-applicable empirical internals claim |
| Token/FLOP/time/currency budgets | [38.6 Formulation](38-6-evaluation-and-economics.md#formulation), Eq38.26; Algorithm38.7 | R38.3 §5; R38.4 AppE | Separate physical units/matching, full statuses, evaluator reservation; hosted FLOP fields may remain unknown |
| Verifier cost / answer length / preparation |38.6 Eq38.27,Implementation | R38.1 AppE; R38.4 AppE; R38.5 AppI | Preparation amortization and selection/evaluation overhead explicit; no universal conversion or portable latency claim |
| Hard/easy mixtures / routing |38.6 Eq38.28 | R38.1 §§4–5; R38.2 AppD | Deployment mixture and tails explicit; development shift not assumed solved |
| Fixed-$n$ coverage versus budget event |38.6 Eq38.29; Algorithm38.7 | R38.6 §§2–5,Table2 | Fixed-$n$ iid/all-label admission, budget-stopped event and unknown-label bounds distinct |

## Sourcing and reproduction gap register

[DERIVED] All10 canonical records satisfy the original-date window and are from primary scholarly/official routes;100% are original2026 artifacts. Their detailed version/date/code boundaries appear in [references.md](references.md). Source prestige does not close the following gaps:

| Gap | Consequence for interpretation | Required resolution before an empirical/theorem reproduction claim |
|---|---|---|
| R38.1 deterministic duality and omitted slack | Source's unrestricted guarantee is not admitted | Resolve premises and independently prove/validate the corrected randomized and slack statements |
| R38.1 unavailable author repository | No inspected executable reproduction | Obtain immutable implementation and compare oracle labels/features/splits |
| R38.2 forced counts and rounded discounts | Training policy cannot be reconstructed uniquely from all prose | Author code/config pin and exact warmup/crossover convention |
| R38.3 missing software/seeds/uncertainty | Serving and quality variation cannot be independently decomposed | Full environment, raw trajectories and matched-cost/accuracy controls |
| R38.4 incomplete flow/RL implementation pins | Source surrogate and profile cannot be rerun exactly here | Frozen checkpoints, numerical/stochastic transition configs and raw saved outputs |
| R38.5 paper/code caching and dependency ranges | Claimed memory/latency path is not established by one code reading | Identify exact experiment commit/container and cached-versus-recomputed configuration |
| R38.6/7 limited model/task/seed records | No universal diversity/correlation law | Preserve actual independent units, missing records and prospective OOD tests |
| R38.8 hosted system cost boundary | No matched-total-compute causal attribution to concurrency | Full subagent/tool work ledger and service conditions |
| R38.9 mutable web disclosure | No immutable internal-mechanism reproduction | Dated archived card plus disclosed implementation, if released |
| R38.10 optional AppendixE.10 normalization concern | Stratified extension rate excluded | Independent proof audit or source correction; main conditional SMC theorem separately assessed |

## Internal analytical checks and editorial status

[DERIVED] The ignored review helper checks native figure schemas, calculator boundary configurations, chart values, integral count-axis samples, source keys, section anatomy, control characters and in-memory compilation. Independent finite analytical fixtures additionally exercise aggregation identities, proxy bounds, cancellation conservation, deterministic/randomized budget gaps, oracle-price slack, latent transition ratios, recurrence cost, workload ranking and fixed-versus-stopped coverage estimands. These are analytical checks, not GPU experiments. Final counts and diagnostic status are recorded in the author handoff and ignored reports after execution.

[DERIVED] `editorial_status: manuscript_draft` remains appropriate. Topic closure means the manuscript teaches and bounds each required concept and variant; it does not mean every proposed experiment or missing source reproduction has been completed.
