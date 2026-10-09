---
id: ms.verification.34
entity_type: verification
title: Verification — Policy gradients and RLHF
short_title: Verification — Policy gradients and RLHF
volume: 2
part: 6
chapter: 34
section: null
slug: verification
parent: ms.chapter.34
prev_sibling: ms.section.34.6
next_sibling: ms.references.34
children: []
prerequisites:
- ms.chapter.2
- ms.chapter.30
- ms.chapter.31
- ms.chapter.32
downstream:
- ms.chapter.35
- ms.chapter.36
- ms.chapter.38
- ms.chapter.39
related: []
relations: []
axes:
  lifecycle:
  - post_training
  mechanism:
  - policy_optimization
  feedback_setting: []
  modality:
  - text
  - code
  - tool_trajectory
  - image
  - video
papers: []
implementations:
- impl.verl
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

# Verification — Chapter 34

[ASSUMED] This is an unexecuted protocol for **a transparent rollout-to-update implementation specification**. It separates deterministic mathematical checks, source protocol reconstruction and a proposed neural systems study. No GPU result, source reproduction, throughput measurement or review score is claimed.

## Hypothesis and acceptance boundary

[ASSUMED] The implementation reproduces a declared episodic estimator and PPO surrogate when processor, support, mask, return and reduction contracts match. Violating one contract should produce the predicted finite counterexample rather than an unexplained learning curve. A neural update may improve an independent task metric while changing diversity, length or resource use; acceptance is a predeclared vector, not a single selected reward maximum.

## Setup and deterministic controls

[ASSUMED] Construct a finite two-action environment and an explicit categorical three-action state. Enumerate exact trajectory probabilities and gradients. Use rational or high-precision arithmetic for expected values, then compare a floating-point implementation at a declared tolerance. Fix prompts, environment transitions, tokenizer/action identities, reward and ending semantics. A CPU mathematical check is sufficient for these identities; no accelerator is necessary or implied.

| Check | Chosen fixture / expected analytic result |
|---|---|
| Probability support | Raw (.6,.3,.1), admitted first two → processed (2/3,1/3,0); raw chosen score differs by normalization |
| Observation mask | Prompt/request/tool/answer: context [1,1,1,1], actor [0,1,0,1] |
| Discount clock | Unit reward at action H gives first return $\gamma^{H-1}$; shifting reward changes discounted objective |
| Baseline cancellation | Enumerate $\sum_a\pi(a|s)b(s)\nabla\log\pi(a|s)=0$; action-dependent baseline need not cancel |
| Prefix counterexample | $p=.5,q=.8,q_b=.2$: true first-logit gradient .20; prefix terminal estimator .05; exact conditional target restores .20 |
| GAE terminal | $\gamma=.99,\lambda=.95,r_1=0,r_2=1,v_1=.2,v_2=.4$: $\delta_1=.196,\delta_2=.6,A_1=.7603$ |
| GAE censored | Same observed data, valid $v_3=.7,b_2=1,c_2=0$: $\delta_2=1.293,A_1=1.4120665$ |
| GAE telescoping | At trace decay one, complete $A_1=.99-.2=.79$; censored retains $\gamma^2v_3$ |
| PPO sign branch | Unit positive advantage: flat above1.2; unit negative: flat below.8; corrective sides remain active |
| No hard KL | $(.2,.4,.4)\to(.2,.8-\eta,\eta)$ retains first-action ratio1 while full old-to-new KL diverges as $\eta\to0$ |
| Entropy derivative | Finite-difference full categorical entropy versus Eq34.18, including off-action terms; test both signs of A |
| Partition TV | Merge categories with opposite signed shifts; reduced TV can be0 while full TV is positive |
| Reward scaling | Terminal $aR+c$ versus per-token offset; only terminal constant cancels from exact episodic score |
| Distributed reduction | Unequal admitted episode counts; summed numerator/global count invariant to rank/microbatch partition |
| Model-state bytes | Each own N/dtype/optimizer; independent rollout copy added once; activation/KV deliberately excluded from model-state subtotal |

[DERIVED] Tests must check the stated quantity rather than mirror code branches. A failure of the expected identity blocks that claim. A biased surrogate that performs well remains labeled a surrogate. Correct finite arithmetic does not validate a neural reward model or guarantee an optimizer's generalization.

## Proposed neural experiment

| Field | Predeclared design |
|---|---|
| Hypothesis | Boundary/probability correctness removes identifiable estimator errors; loss controls have workload-dependent quality/cost tradeoffs |
| Model/version | Frozen open checkpoint/tokenizer hash; exact choice and release remain a preregistration field, not an invented deployment |
| Dataset/splits | Group-disjoint train/selection/final prompts; deterministic finite controls plus independent mathematical and preference tasks |
| Independent variables | One at a time: trace decay, clip asymmetry, reuse, critic family, reference coefficient, residency/cache schedule |
| Controls | Same initialization, generated workload budget, reward/verifier/judge versions, processing order, ending policy and independent final set |
| Hardware/precision | Record exact accelerators/topology/backend/lockfile/dtypes before execution; presently NOT-DISCLOSED |
| Optimizer/budget | Predeclare optimizer, LR schedule, gradient/dual clipping, updates, tokens, retries and accepted/attempted denominator |
| Seeds | At least three independently initialized training random streams; publish sampling seeds and uncertainty method |
| Metrics | Independent quality, proxy/judge conflict, full/qualified drift, fixed-prefix entropy, diversity, length/caps, per-device peak, total GPU-seconds |
| Baselines | Exact finite estimator; on-policy score; basic declared PPO; one loss intervention per comparison; identical decoding |
| Ablations | Terminal/censored flags, raw/processed scores, full/prefix correction, sequence/token reductions, sampled/full divergence, role caching |
| Expected observations | Contract violations match finite counterexamples; neural quality direction remains a hypothesis |
| Interpretation | Accept only predeclared vector conditions and uncertainty; selected validation checkpoint receives a separate final assessment |
| Threats | Support mismatch, reward exploitation, judge bias/override, group filtering, cap selection, unequal reuse, missing seed traces, evaluator reuse |

[ASSUMED] Stop on nonfinite state, exhausted budget or a predeclared quality/drift condition. Restoring a rejected update restores weights, optimizer, scheduler and random state. Keep failures and discarded candidates in the total cost. A changed reward/reference creates a new objective phase and cannot be treated as a continuation of the same controlled comparison.

## Source protocol reconstruction

[DERIVED] Reconstruct source claims only to the extent their disclosed fields allow. §34.1 records OpenAgent's environment and unequal training budgets; §34.2 records CTPO's tool/math comparison; §34.3 records SAE's trace experiment and stopped baseline; §34.4 records categorical critics and the conflicting evaluation description; §34.5 records CPPO/DRPO/OPEFO and the artifact-based judge study; §34.6 records the fixed-decoding diversity study. Their ND fields remain missing and prohibit a claim of exact reproduction.

[DERIVED] Distinguish selected validation maxima from an independent final test, row bootstraps from independent training seeds, and source outcomes from book measurements. The critic tool reward contradiction and disputed entropy proof cannot be repaired by silently substituting prose for a printed formula. Retain exact source locators and the qualified interpretation beside any comparison.

## Topic-completeness audit

[DERIVED] Closure codes identify the actual review obligations: **O** ownership/objective, **I** mechanism intuition, **F** formulation/derivation, **M** methodology, **A** bounded algorithm/state, **R** representation/invariants, **C** cost, **S** implementation route, **E** actual source experimental design, **B** observations, **L** alternatives/lineage, **V** failure/limits and **P** reproducibility. Each row maps a substantive variant to specific manuscript anchors and exact primary locators. The source columns identify current evidence, not historical invention. Original finite derivations need no pre-window empirical citation.

| Concept / substantive variant | Manuscript closure | Primary source / exact locator | Gap and review consequence |
|---|---|---|---|
| History and environment kernel | §34.1 Formulation Eq1; Mechanism; Algorithm34.1; O I F M A R C S E B L V P | R34.10 §§3.1–3.2, AppC–D | Hidden environment snapshots not supplied; no deterministic replay claim |
| Assistant actions versus observations | §34.1 Mechanism/mask matrix; Implementation; O I F M A R C S E B L V P | R34.1 core_algos GAE216–259; R34.10 process | Observation tokens consume context, not score terms |
| Processed temperature/top-p behavior | §34.1 Eq3; §34.2 Eq7; O I F M A R C S E B L V P | R34.1 FSDP98–106/1350–1505; rollout1200–1207 | Actual processed chosen score not established by raw-score logging |
| Missing action support | §34.1 Mechanism; §34.2 Limits; O I F M A R C S E B L V P | R34.3 §3.1/AppA | No importance correction for absent target support |
| Terminal EOS and task failure | §34.1 Eq4/ending comparison; Algorithm34.1; O I F M A R C S E B L V P | R34.10 task setup; R34.1 GAE helper boundary | A collector cap is not automatically task failure |
| Administrative censoring | §34.1 Eq4; §34.3 Eq10–11/flag matrix; O I F M A R C S E B L V P | R34.1 GAE216–259; R34.2 AppA | Valid next state required; source helper final value is zero |
| Discount and reward placement | §34.1 Eq2/calculator/chart; §34.2 Eq5; O I F M A R C S E B L V P | R34.2 γ1 experiment §5; R34.10 reward setup | General γ derivation is explanatory, not claimed new result |
| Causal score estimator | §34.2 Eq5/Algorithm34.2; O I F M A R C S E B L V P | R34.3 §2–3/AppA | Differentiability/integrability fixed-process assumptions |
| Action-independent baseline | §34.2 Eq6/Implementation; O I F M A R C S E B L V P | R34.2 §3; R34.4 §2 | Same-sample fitting dependence must be disclosed |
| Variance-optimal scalar baseline | §34.2 Eq6/Intuition; O I F M A R C S E B L V P | Original conditional covariance derivation; R34.4 critic context | Not universally equal to conditional mean |
| Full trajectory importance correction | §34.2 Eq7/Algorithm34.2; O I F M A R C S E B L V P | R34.3 §3/AppA | Requires common prompt/process/support; may have high variance |
| Prefix identity and terminal counterexample | §34.2 Eq7/calculator/dependency matrix; O I F M A R C S E B L V P | R34.3 §3.1 versus3.3/AppA | Implemented terminal surrogate does not inherit theorem |
| Correlated ratio increments | §34.2 Eq8/chart; O I F M A R C S E B L V P | R34.3 position clipping §3 | Square-root scaling needs covariance assumptions |
| Episode/token/length aggregation | §34.2 Mechanism/reducer/stat; O I F M A R C S E B L V P | R34.1 agg_loss/core_algos; R34.3 implemented length mean | Different empirical measures; future-dependent H blocks casual causality cancellation |
| PPO positive/negative/asymmetric clipping | §34.3 Eq9/compare/chart/Algorithm34.3; O I F M A R C S E B L V P | R34.1 vanilla1286–1380 | Actual tag also dual-clips and clamps log ratios |
| No hard KL guarantee | §34.3 three-action counterexample; §34.5 comparison; O I F M A R C S E B L V P | R34.5 conditional bound/gating; original finite construction | Shared parameter updates not projected feasible policies |
| TD residual and GAE trace | §34.3 Eq10–11/calculator/flag matrix; O I F M A R C S E B L V P | R34.2 §3–4/AppA; R34.1 GAE | Critic error and censor boundary; no universal trace optimum |
| Value clipping and critic alignment | §34.3 Eq12/Implementation; O I F M A R C S E B L V P | R34.1 value2125–2185; R34.4 §3/AppD | Loss clipping is not prediction clipping; pre-action alignment required |
| Segmented trace successor | §34.3 Experimental design/Observations/Extensions; O I F M A R C S E B L V P | R34.2 Eq5/8/10, Table1, AppA/B | Assumed bound decreasing does not establish actual bias decrease |
| Categorical critic successor | §34.3 Extensions; §34.4 protocol/Observations; O I F M A R C S E B L V P | R34.4 §3/Table1/AppA–D | MSE mean remains consistent; target/head/budget effects not universal |
| Actor/reference/critic/reward interfaces | §34.4 role table/Algorithm34.4/matrix; O I F M A R C S E B L V P | R34.1 trainer/core_algos; R34.9 §4 | Sharing and moving-role versions must be explicit |
| Reference KL and occupancy derivative | §34.4 Eq13–15; O I F M A R C S E B L V P | R34.1 KL2188–2248; original trajectory derivation | Detached-prefix conditional autograd is not full trajectory gradient |
| Adaptive beta and reward scale | §34.4 Eq16; §34.5 Eq17; O I F M A R C S E B L V P | R34.9 Table3 scale/penalty; original controller example | Controller illustrative, no hard-bound guarantee |
| DRPO smooth corrective shift | §34.5 Eq19/calculator/chart/experiments; O I F M A R C S E B L V P | R34.6 Eq8–11, §4, AppB–D | Scalar stationary point and bounded multiplier not global constraint/gradient bound |
| CPPO cumulative and reduced divergence | §34.5 Mechanism Eq20; O I F M A R C S E B L V P | R34.5 §3/AppB.7/C/D | True-TV theorem conditions not certified by lower-bound gradient gates |
| Entropy collapse and flow reweighting | §34.5 Eq18/Mechanism/Observations; O I F M A R C S E B L V P | R34.7 Eq6–9/AppA, §6 | Dropped off-action proof terms excluded; heuristic outcomes retained |
| Length/cap exploitation and proxy conflict | §34.5 Mechanism/failures/Algorithm34.5; O I F M A R C S E B L V P | R34.7 §6.3; R34.9 Tables2–4/§7 | Judges not ground truth; mitigation intervals include zero |
| Separate four-model state and rollout copies | §34.6 Eq21–22/calculator/role table; O I F M A R C S E B L V P | R34.1 tagged engine paths; analytical inventory | No measured fit; own N/dtypes/residency and activation/KV terms |
| Generation/train/reuse compute | §34.6 Eq23/chart/Algorithm34.6; O I F M A R C S E B L V P | R34.7 §6.1/6.6; R34.6 AppD | Dense approximate factors do not predict throughput |
| Synchronization and accepted-update cost | §34.6 Eq24/stage diagram; O I F M A R C S E B L V P | R34.1 release weight-sync surface; analytical ledger | Transfer lower bound; retries and rejected work counted |
| Evaluation cadence, diversity and selection | §34.6 Eq24/stat/protocol/Observations; O I F M A R C S E B L V P | R34.8 §§2–5/repro appendix | Missing raw seed0/per-sample entropy; high-k success not diversity |

## Deliverables and what this edition did not do

[DERIVED] Deliver a versioned event ledger, finite-state arithmetic checks, sealed target/loss example, role/tensor inventory, source protocol tables, rejection and restore ledger, and independent evaluation plan. Native figures have textual equivalents and analytical sources. This edition does not execute training, resolve absent source fields, certify exact author-code reproduction or assign a 10/10 score. Remaining scientific gaps are explicitly listed in [references](references.md).
