---
id: ms.verification.31
entity_type: verification
title: Verification — SFT recipe
short_title: Verification — SFT recipe
volume: 2
part: 6
chapter: 31
section: null
slug: verification
parent: ms.chapter.31
prev_sibling: ms.section.31.6
next_sibling: ms.references.31
children: []
prerequisites:
- ms.chapter.10
- ms.chapter.11
- ms.chapter.12
- ms.chapter.19
- ms.chapter.20
- ms.chapter.21
- ms.chapter.22
- ms.chapter.23
- ms.chapter.24
- ms.chapter.30
downstream:
- ms.chapter.32
- ms.chapter.33
- ms.chapter.34
- ms.chapter.35
- ms.chapter.36
- ms.chapter.39
related: []
relations: []
axes:
  lifecycle:
  - post_training
  mechanism:
  - supervised_fine_tuning
  feedback_setting: []
  modality:
  - text
  - code
  - tool_trajectory
  - image
  - video
papers: []
implementations:
- impl.hugging-face-trl
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used:
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - ASSUMED
  - PAPER-REPORTED
  - OFFICIAL-DOCUMENTATION
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 1400
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# Verification — Supervised fine-tuning and behavior acquisition

[DERIVED] This document is an editorial completeness audit and a proposed falsifiable execution protocol. No model-training experiment, paper reproduction or measured deployment claim was executed for this manuscript. Primary source experiments live at each section's Experimental design and Observations headings; their exact revisions and original dates are in [references](references.md).

## Topic-completeness matrix

[DERIVED] Each row is a canonical concept group from the Chapter 31 plan. The section's exact contract headings supply the twelve depth obligations: problem/prior limitation; formal contract; full methodology; mathematical account; bounded procedure; implementation; resource accounting; source experimental protocol; four-part observations; alternatives; improvements/lineage; validity/failures; and reproducibility closure. Repeated headings do not transfer another method's evidence to this concept. The locators below identify the formal object, procedure and eligible primary evidence used at that location.

| Canonical concept | Problem and formal/mathematical contract | Method, procedure and resource accounting | Source protocol, observations and closure |
|---|---|---|---|
| Conditional maximum likelihood; response/full loss; example/token normalization; weighting | [31.1](31-1-sft-objectives.md#formulation), Eqs.31.1–31.4; Intuition and Mechanism distinguish full-vocabulary normalization from selected positions and detached weighting | Algorithm31.1 defines global mass/numerator and one committed update; Implementation counts projection work, logits memory and scalar reductions | R31.1 tagged SFT docs and preparation/collator; R31.2 §§4–5, Table2, AppB.1/B.6; Experimental design, Observations, Siblings, Extensions, Limitations, Reproducibility |
| Instructions; dialogue; reasoning; coding; tool; multimodal; long context | [31.2](31-2-data-families.md#formulation), seven-family contracts and Eqs.31.5–31.8; available-information and validation boundaries | Algorithm31.2 constrained greedy admission; target/input exposure and preprocessing cost; greedy exhaustion is not an infeasibility proof | R31.3 §§2–3/Table1/AppD; R31.4 §§4–5/AppB/C; family-specific validators, actual ablations and unavailable reproduction details |
| Role/system/assistant/tool semantics; truncation; packed examples | [31.3](31-3-conversation-semantics.md#formulation), Eqs.31.9–31.12; event identity, shifted masks, block-causal visibility and evidence-closed truncation | Algorithm31.3 fixture compilation; independent context/target masks, first-position boundaries, packing pair counts and tensor trace | R31.1 tagged docs/code; R31.5 §§3–6/AppA–D, source perturbed-tool protocol and negative findings; independent executor attestation remains required |
| Full versus PEFT; learning rate; epochs; mixtures; curriculum; sequence lengths | [31.4](31-4-training-choices.md#formulation), Eqs.31.13–31.16; capacity, persistent bytes, exposure and local quadratic stability | Algorithm31.4 finite independent candidate runs; complete search cost, initialization/RNG/state reset and committed-update accounting | R31.6 §§2–4/7/AppA–D; R31.7 §§2–4/AppA–B; conflicting metric/budget results preserved; no universal epoch/rate recommendation |
| Style overfit; base retention; fabricated calls; verbosity; demonstration leakage | [31.5](31-5-behavioral-failure-modes.md#formulation), Eqs.31.17–31.20; local retention conditions, actual-rollout hazard, clustered uncertainty and paired perturbations | Algorithm31.5 outcome-preserving triage; complete tool execution and generation/retry cost; no teacher-forced-error guarantee for rollout | R31.8 §§3–5, Tables1–2/AppA/B; source theorem conditions, optimizer mismatch and residual calibration damage; source-group held-out assessment |
| Utility; compliance; retention; calibration; preference/RL compatibility | [31.6](31-6-validation-and-handoff.md#formulation), Eqs.31.21–31.24; proper score derivation, trace marginal, acceptance vector and complete-sequence KL | Algorithm31.6 immutable package; reference support/prefix/cache identity and explicit invalidation | R31.9 §§2–4/Table1/AppB; R31.10 §§3–4/AppA–C; confidence-event and treatment confounds retained; downstream outcomes unexecuted |

[DERIVED] Every section carries six original native figure blocks, including one adjustable calculator and one analytical rail readout. They encode mass allocation, event/context structure, candidate costs, sensitivity or acceptance distinctions. The chapter page adds source-linked lineage. Their formulas follow the numbered derivations and their accessible equivalents identify axes, conditions and analytical status. None is a fabricated benchmark curve or a decorative substitute for method coverage.

### Variant-specific closure and evidence limits

[DERIVED] The group map is resolved into individual concepts below. Each row inherits its owning section's problem, procedure, execution/cost, observations, alternatives, improvements, failures and reproducibility anchors mapped above. The distinctions and source boundaries here prevent a shared heading from implying shared empirical evidence. Combined interventions do not isolate a variant; pure accounting identities require stated premises rather than invented training results.

| Concept or variant | Specific manuscript object and method | Source locator or mathematical premise | Gap and review consequence |
|---|---|---|---|
| Response-only versus full-sequence MLE | [31.1 Mechanism](31-1-sft-objectives.md#mechanism), disjoint target sets and Algorithm31.1 | R31.1 tagged mask/collator; Eqs.31.1–31.3 | No executed paired masking study; no quality winner claimed |
| Token versus example weighting | [31.1 Formulation](31-1-sft-objectives.md#formulation), empirical measure and global mass | Eqs.31.1–31.4, detached weights and explicit collective averaging | Unequal local means are not interchangeable; numerical parity unexecuted |
| Adaptive token weighting | [31.1 Experimental design](31-1-sft-objectives.md#experimental-design), RankTuner indicator/protocol | R31.2 §§4.1–4.5, 5.1/Table2/AppB.1/B.6 | Fixed-weight derivation does not prove an adaptive estimator's optimum |
| Instruction and dialogue data | [31.2 Mechanism](31-2-data-families.md#mechanism), available-information and event contracts | R31.1 tagged rendering/mask surfaces; R31.6 data/protocol appendices | No isolated universal instruction-versus-dialogue quality claim |
| Reasoning demonstrations | [31.2 Formulation](31-2-data-families.md#formulation), reasoning-family contract; [31.4 study](31-4-training-choices.md#experimental-design) | R31.2 §§4–5; R31.7 §§2–4/AppA–B | Correct final answer does not certify trace faithfulness |
| Coding examples | [31.2 Mechanism](31-2-data-families.md#mechanism), executable specification and independent tests | R31.6 §4 and data/evaluation appendices within its task scope | Available tests cannot establish correctness on all inputs |
| Tool trajectories | [31.2 Mechanism](31-2-data-families.md#mechanism), interaction graph and Algorithm31.2 | R31.4 §§4.2–4.3/AppB.2/C.1–C.2 | Threshold nontransitivity; printed TV/KL guarantees withheld; greedy exhaustion is not infeasibility |
| Multimodal selection | [31.2 Mechanism](31-2-data-families.md#mechanism), likelihood descriptors and feasibility | R31.3 §§2.1–2.4, 3.1–3.5/Table1/AppD | Probe ratios do not prove causal grounding; include descriptor cost |
| Long-context data | [31.2 Mechanism](31-2-data-families.md#mechanism), evidence placement and admission | Available-information premise; Eqs.31.9–31.12; R31.1 length/packing surfaces | A length limit gives no general long-context transfer guarantee |
| Roles, system context and assistant spans | [31.3 Formulation](31-3-conversation-semantics.md#formulation), shifted mask intersection and event offsets | Eq.31.9; R31.1 preparation/collator | Pin template/tokenizer and header conventions before execution |
| Tool observations versus actions | [31.3 Mechanism](31-3-conversation-semantics.md#mechanism), executor events and call/result identity | R31.5 §§3–6/AppC–D; declared observation/action contract | Generated success cannot replace executor attestation |
| Truncation | [31.3 Mechanism](31-3-conversation-semantics.md#mechanism), atomic events and context closure | Eq.31.12, Algorithm31.3 | A retained suffix can be semantically invalid; reject or redefine population |
| Packing | [31.3 Mechanism](31-3-conversation-semantics.md#mechanism), block-causal relation and boundary targets | Eqs.31.10–31.11; R31.1 padding-free collator | Separators do not establish isolation; kernel parity unexecuted |
| Full tuning versus PEFT | [31.4 Formulation](31-4-training-choices.md#formulation), factor and persistent-state accounting | Eqs.31.13–31.14; linked Chapter23; R31.6 §3 | Smaller trainable state does not establish lower peak memory or faster steps |
| Learning rate and optimizer | [31.4 Mechanism](31-4-training-choices.md#mechanism), independent candidate reset and curvature regime | Eq.31.16; R31.6 §§2.1–2.7/AppA–D | Scalar quadratic is not an AdamW stability theorem |
| Epochs and repetition | [31.4 Mechanism](31-4-training-choices.md#mechanism), complete traversal and flushed-batch exposure | Eq.31.15; R31.6 §7; R31.7 §§2–4/AppA–B | Noncomparable budgets/selection rules prevent a universal epoch recommendation |
| Mixtures and curricula | [31.4 Mechanism](31-4-training-choices.md#mechanism), time-dependent sampler and resume state | R31.6 mixture/data appendices; R31.4 selection protocol; declared book sampler | Adaptive sampling changes the measure; no undisclosed curriculum benefit inferred |
| Sequence-length control | [31.4 Mechanism](31-4-training-choices.md#mechanism), population versus layout intervention | Eqs.31.14–31.15; R31.7 §2/AppA–B | Equal steps do not match useful target exposure or actual cost |
| Style and verbosity | [31.5 Mechanism](31-5-behavioral-failure-modes.md#mechanism), task-preserving perturbations and success-conditioned length | Eq.31.20 and declared paired-intervention premises | Style correlation is not causation; no fabricated failure rate |
| Base retention | [31.5 Formulation](31-5-behavioral-failure-modes.md#formulation), smoothness and actual optimizer direction | Eq.31.17; R31.8 §§3–5/Tables1–2/AppA/B | SGD conditions do not certify arbitrary preconditioned neural updates |
| Fabricated calls/returns | [31.5 Mechanism](31-5-behavioral-failure-modes.md#mechanism), syntax/schema/execution separation | R31.5 perturbation protocol; Algorithm31.5 | Executor permissions and side effects remain outside a format guarantee |
| Demonstration leakage | [31.5 Mechanism](31-5-behavioral-failure-modes.md#mechanism), lineage and clustered uncertainty | Eq.31.19 under exchangeable equal-variance clusters | Deduplication cannot certify no semantic overlap; effective count is not a measured leakage rate |
| Utility/compliance/retention decisions | [31.6 Formulation](31-6-validation-and-handoff.md#formulation), acceptance vector and missing-metric rejection | Eqs.31.21–31.24; R31.9 §§2–4/Table1/AppB; R31.10 §§3–4/AppA–C | Aggregate loss cannot replace required outcomes; checkpoint acceptance unexecuted |
| Calibration | [31.6 Mechanism](31-6-validation-and-handoff.md#mechanism), event definition and trace marginalization | R31.9 §2/§4/AppB; R31.10 §4; stated probability conditions | Accuracy and trace-conditional confidence differ; OOD reliability unresolved |
| Preference/RL handoff | [31.6 Algorithm](31-6-validation-and-handoff.md#algorithm), immutable package and reference-cache identity | Eq.31.24, Algorithm31.6; R31.1 tagged interface | Compatibility and reference-score parity require fixture execution |

## Artifact schema

[DERIVED] The plan's deliverable is **an SFT recipe with exact target masks and template fixtures**. The executor supplies the following versioned records; names describe required content rather than an imposed implementation language.

| Record | Required fields and closure condition |
|---|---|
| `sources` | Stable example/source-group identities, provenance/license, task family, immutable split, overlap decisions, source availability and version |
| `rendering` | Base model/tokenizer/processor/template revisions; event offsets, role/channel identifiers, control tokens, media alignment, position convention and termination |
| `fixtures` | Exact tokens, legal context edges, shifted labels, target/weight arrays, expected numerator/mass and expected rejection reasons for every boundary case |
| `objective` | Response/full policy; token/example measure; fixed/detached adaptive weight rule; empty-target handling; global/microbatch/rank reduction semantics |
| `allocation` | Family counts, source-group split, selection descriptors/model versions, realized target/input mass, budgets/floors and complete search-exhaustion records |
| `training` | Trainable parameter identities, adapter/base relation, initialization, optimizer state, LR/schedule, clipping/precision, sampler/RNG, committed/rejected steps, complete candidate cost |
| `evaluation` | Immutable disjoint source-group tasks, utility/compliance/retention/confidence definitions, generation policy, execution attestation, invalid/timeout/retry outcomes, uncertainty procedure |
| `acceptance` | Predeclared thresholds and noninferiority margins, selection/evaluation separation, missing-metric rejection, all candidate outcomes and reasons |
| `handoff` | Checkpoint and base/adapter hashes, merge convention, tokenizer/template/processor identities, support/termination fixtures, reference prefix/cache keys and resume/start-new-optimizer decision |

[MATHEMATICALLY-DERIVED] The minimum golden set includes an assistant answer after a context-only system/user prefix, a two-assistant-turn dialogue with tool returns, a tool call whose observation is not a supervised assistant action, an empty-target example, an incomplete truncated call, two separately packed examples, a boundary position with no legal previous target context, a weighted unequal-length pair and a long-context query whose answer evidence would be removed by truncation. Expected rejection is a positive fixture result; such rows must not silently enter the training population.

## Main falsifiable experiment

**Hypothesis.** [ASSUMED] On one immutable example population, changing response-only to full-sequence supervision changes learned behavior beyond changing the reported training-loss scale. The null outcome is no detectable difference under the declared generated-task and unintended-behavior metrics. The protocol does not assume which mask wins.

**Setup.** [ASSUMED] Choose one independently downloadable base checkpoint, tokenizer and tagged trainer environment. Pin exact revisions, licenses, compiler/runtime and all dependency versions before training. Create disjoint train/selection/final-test source groups, render once with an immutable template and preserve both masks. Train paired independent runs from the same initialization per seed. Pair seeds and sample order across the two treatments; do not initialize one treatment from the other's tuned weights.

**Independent variables.** [ASSUMED] The primary treatment is response-only versus full-sequence target inclusion. Token normalization is fixed for the main study. A separate factorial ablation changes token versus example normalization while keeping the mask fixed. Packing on/off and maximum sequence length are separate interventions after semantic equivalence fixtures pass. Do not vary all choices together and attribute the result to masking.

**Controls.** [ASSUMED] Hold source examples, train/test identities, rendered legal context, base revision, trainable parameter subset, initialization distribution, optimizer type and schedule family, effective example batch, finite update budget and checkpoint-selection procedure fixed. Response/full policies necessarily select different target masses; report both, alongside processed input positions and achieved time. “Equal steps” is not “equal selected-target exposure,” and both cannot generally be held fixed on identical examples with one pass schedule.

**Dataset.** [ASSUMED] Assemble a license-compatible task population covering instruction following, multi-turn dialogue, coding and tool use; add multimodal/long-context strata only when the model and processor contract supports them. Preserve group-level lineage so near-duplicate source problems cannot cross splits. Fix validators and held-out tasks before selection. Report per-family rendered length, selected target mass and rejected/incomplete example counts under both policies.

**Hardware/software.** [ASSUMED] Record accelerator model/count/memory, host RAM, interconnect and placement, precision, attention implementation, checkpointing, optimizer storage, trainer release, model dependencies and deterministic/nondeterministic kernels. No specific hardware allocation is claimed by this manuscript. If a single-rank reference cannot fit, use an explicitly equivalent small fixture model for normalization tests while keeping the trained-model experiment distinct.

**Budget.** [ASSUMED] Predeclare candidate count, seeds, update limit, input-length ceiling and wall-time/resource cap. Count preprocessing, descriptor/probe generation, failed/rejected updates, all candidate fits, held-out generations, verifier execution and retries. Record complete-step latency and peak memory only when measured, with allocation and sampling procedures. Energy and money require explicit measurement/pricing boundaries; leave unavailable fields unresolved.

**Metrics.** [ASSUMED] Report held-out assistant NLL under one common response-only scoring measure, generated task utility, instruction violations, base-domain retention changes, calibration for a declared event, invalid outputs, tool execution integrity, output length, termination and total cost. Preserve missing/timeouts as outcomes according to a predeclared rule. Estimate uncertainty with source-group resampling or another declared paired procedure; repeated generations of one task do not create independent source tasks.

**Baselines.** [ASSUMED] Include the untuned base, response-only SFT and full-sequence SFT. A PEFT comparison is an additional capacity treatment with its own parameter and optimizer budget, not a substitute baseline for masking. Use identical evaluation prompts and policies across candidates. If confidence extraction depends on a reasoning trace, evaluate that conditional event separately from pre-trace decision confidence.

**Expected observations.** [MATHEMATICALLY-DERIVED] The mask policies give different objective numerators and target masses whenever excluded context targets exist. No quality direction follows from this identity. A lower full-sequence mean combined with worse common assistant NLL falsifies the interpretation that the aggregate scalar alone measures better assistant fitting. Generated-task outcomes determine whether any difference matters under the declared deployment population.

**Ablations.** [ASSUMED] Compare exact fixtures with and without packing, response versus full targets, example versus token normalization and a predeclared length cap. For curriculum, change only the sampling schedule and report realized target exposure over time. A source-data selection ablation holds the eligible pool and split fixed, counts descriptor cost and retains all unsuccessful search outcomes. Treat TopoCurate-style merge policies as explicit alternative algorithms rather than an unqualified quotient relation.

**Interpretation.** [DERIVED] A utility increase with a retention decrease is a tradeoff requiring the declared acceptance vector; it is not automatically accepted. A calibration improvement can accompany lower accuracy. A generation-length reduction can reflect early failure rather than efficiency. A successful synthetic tool call without executor attestation fails execution integrity even if its JSON matches the expected format.

**Threats to validity.** [DERIVED] Source-group leakage, checkpoint selection on final tests, unequal update/exposure boundaries, judge dependence, instruction-prompt differences, template changes, unsupported confidence events and incomplete failure accounting can invalidate the comparison. Small task sets restrict statistical conclusions. A finite assessment cannot certify all-domain truthfulness, and source-reported results do not establish the executor's checkpoint behavior.

## Mathematical and systems rejection tests

| Test | Invariant | Rejection condition |
|---|---|---|
| Loss-mask fixture | The target at token index $t$ is predicted from the permitted preceding context and receives the declared weight once | Off-by-one label, context/target confusion, supervised tool observation contrary to policy |
| Global normalization | One logical update uses the global numerator and mass, with explicit AllReduceMean correction | Microbatch/rank means replace unequal-mass global normalization |
| Zero-target rank | Empty local mass still participates in required collectives; globally empty update is rejected without scheduler commit | Rank skips collective, divides by zero or advances state for no supervision |
| Packing | Cross-example attention and boundary-target edges are absent under the declared independent-example objective | Separator token alone is treated as an attention boundary |
| Truncation | Required evidence and call/observation pairing remain for every surviving target | A suffix survives after its necessary context or event mate is removed |
| Candidate isolation | Every independent fit resets intended initialization, optimizer/scheduler, sampler and RNG | Hyperparameter candidate inherits hidden state from a previous fit |
| Acceptance closure | Every required metric and interface fixture is available under a declared uncertainty rule | Missing outcome is treated as a pass or one scalar substitutes for the vector |
| Reference cache | Prefix, token support, termination, template and frozen reference identities agree | Cache keyed only by response text or reused after a rendering migration |

[MATHEMATICALLY-DERIVED] For gradient parity, compare a small complete logical batch with differently partitioned microbatches and ranks using the same selected target mass. Use an explicitly declared numerical tolerance and precision; floating-point summation order can produce small differences even when the real-number objective is identical. Perturbing a prompt-only token should change legal response predictions but should not create a prompt target under response-only supervision. Perturbing another packed example must not change the reference example's logits under independent-example attention semantics.

## Source and visual audit

[DERIVED] The ten admitted records first appeared from 2026-01-19 through 2026-09-10, and all were accessed on 2026-10-09. R31.2 has independently verified archival peer-review identity, while detailed claims remain pinned to its inspected v1; R31.5's acceptance statement remains author-reported. The excluded historical plan anchor and inaccessible primary endpoints are listed explicitly. The mathematics is explanatory reconstruction unless directly attributed with a source locator; no proof is imported solely because a preprint prints it.

[MATHEMATICALLY-DERIVED] TopoCurate's thresholded cosine predicate is not generally transitive. Its Appendix C Eq.13 also cannot supply a general positive total-variation lower bound: identical constant loss under two distinct distributions contradicts the statement. Eq.17 uses an expert-distribution expectation for a policy-to-expert KL label, reversing the measure. These are reasons to withhold the printed guarantees, independently of the source's measured selection outcomes. A corrected clustering/closure policy and valid assumptions would be necessary before a mathematical guarantee could enter the artifact.

[DERIVED] Authoring checks require unique figure/equation identifiers, valid native figure schema, five or more technical figures and a live calculator in each section, reachable integral count inputs, finite calculator boundary outputs, accessible equivalents and matching matrix axes. These checks assess manuscript and instrument structure; they do not execute GPU training or certify a research result. The chapter remains a draft pending scientific review and actual execution of the protocol.

## Completion state

[DERIVED] All nine manuscript files are provided: chapter page, six canonical sections, verification and typed bibliography. Exact target masks, attention boundaries, normalization, controlled recipes, failure predicates and handoff states are specified. Proposed executions remain unperformed. Missing source disclosures remain NOT-DISCLOSED; inaccessible or unexecuted implementation/reproduction claims remain UNVERIFIED. Promotion to reviewed status requires independent scientific review, not a visual score or a successful manuscript compile.
