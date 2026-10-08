---
id: ms.section.20.3
entity_type: section
title: Scheduling
short_title: Scheduling
volume: 1
part: 4
chapter: 20
section: 20.3
slug: 20-3-scheduling
parent: ms.chapter.20
prev_sibling: ms.section.20.2
next_sibling: ms.section.20.4
children: []
prerequisites: [ms.chapter.2, ms.chapter.3, ms.chapter.19]
downstream: [ms.chapter.21, ms.chapter.22, ms.chapter.29, ms.chapter.30]
related: [ms.chapter.6, ms.chapter.13]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P13}
  - {type: implemented_by, target: impl.pytorch}
axes: {lifecycle: [pretraining, continued_training, evaluation], mechanism: [optimization, training_stability], feedback_setting: [], modality: [text, image]}
papers: [P13]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 20.3 Scheduling

[DERIVED] A learning-rate schedule selects a time-dependent update magnitude under a declared clock. Warmup changes early state estimation and transient dynamics; decay changes the noise floor and the weighting of previous updates; a restart changes the future trajectory rather than extending an already completed schedule without consequence. Schedule comparisons must match the endpoint budget, peak-rate search, data exposure, decay convention and checkpoint selection. A lower current training loss during cooldown does not, by itself, establish greater progress per consumed token.

## Formulation

[MATHEMATICALLY-DERIVED] Let $x\in[0,1]$ denote normalized progress after warmup and $\eta_{\max},\eta_{\min}\geq0$. Two common endpoint schedules are

$$
\eta_{\mathrm{linear}}(x)=\eta_{\max}-(\eta_{\max}-\eta_{\min})x,
\quad
\eta_{\mathrm{cosine}}(x)=\eta_{\min}+\frac{\eta_{\max}-\eta_{\min}}2(1+\cos\pi x).
$$
*(Eq. 20.6)*

[MATHEMATICALLY-DERIVED] They share endpoints and the same continuous average rate, $(\eta_{\max}+\eta_{\min})/2$, but have different temporal distributions. Their approximate cumulative decay exposure can therefore agree while their response to evolving gradients differs. Linear warmup over $w$ updates uses $\eta_k=\eta_{\max}k/w$ under an explicitly chosen indexing convention. If $w=0$, there is no warmup segment; blindly evaluating the ratio is invalid. A schedule specified in tokens replaces $k$ by accumulated consumed or accepted tokens, with that choice recorded.

[PAPER-REPORTED] Warmup-stable-decay, WSD, separates an extendable high-rate trunk from an endpoint cooldown. With warmup endpoint $w$ and cooldown start $b$, the schedule is warmup for $k<w$, constant $\eta_{\max}$ for $w\leq k<b$, and a declared decreasing function thereafter. WSD is a family, not one fixed decay shape or fraction. Wen et al. use reciprocal interpolation,

$$
\eta(x)=\left(\frac{1-x}{\eta_{\max}}+\frac{x}{\eta_{\min}}\right)^{-1},\qquad\eta_{\min}>0,
$$
*(Eq. 20.7)*

while other constant-plus-cooldown studies evaluate linear and $1-\sqrt{x}$ shapes, including decay to zero. Eq.20.7 cannot substitute $\eta_{\min}=0$ without a different limiting definition. [R20.7, R20.8]

## Mechanism

### Warmup regulates a transient, not a universal fixed duration

[MATHEMATICALLY-DERIVED] With momentum buffer $v_k=\mu v_{k-1}+g$ and $v_0=0$ under a constant gradient, $v_k=(1-\mu^k)g/(1-\mu)$. The early effective direction changes before the buffer reaches its stationary scale. Adam's bias correction addresses missing initialization mass, but neither it nor a rising scalar rate controls every layer's evolving curvature, activation scale or parameter correlation. The stability limit for deterministic gradient descent on a positive quadratic mode of curvature $h$ is $0<\eta h<2$; this local calculation does not certify momentum or Adam stability.

[PAPER-REPORTED] OLMo 2 deliberately shortens warmup to provoke instabilities in its initialization ablation. Changing initialization then reduces observed spikes in that stress setting, with a slight convergence-speed tradeoff. This demonstrates that an apparent warmup requirement can depend on initialization and architecture. It does not identify a globally sufficient number of warmup steps. [R20.10, Section 3.3]

### Decay lowers stochastic fluctuations and changes historical weights

[MATHEMATICALLY-DERIVED] On a one-dimensional positive quadratic with stochastic gradient $h\theta+\xi_k$, zero-mean independent noise variance $\sigma^2$ and constant $\eta$, the recurrence is $\theta_{k+1}=(1-\eta h)\theta_k-\eta\xi_k$. If $|1-\eta h|<1$, the stationary variance is $\eta\sigma^2/[h(2-\eta h)]$. Reducing the rate lowers this local noise floor, while also changing how quickly mean displacement decays. Time-varying rates, nonstationary noise and adaptive preconditioning break the stationary formula. It explains a possible cooldown effect without proving that all Transformer loss surfaces obey the quadratic model.

[MATHEMATICALLY-DERIVED] Repeated substitution into AdamW's parameter recurrence gives

$$
\theta_K=\left[\prod_{j=1}^K(1-\eta_j\omega)\right]\theta_0
-\sum_{i=1}^K\eta_i\left[\prod_{j=i+1}^K(1-\eta_j\omega)\right]u_i.
$$
*(Eq. 20.8)*

[DERIVED] These coefficients express the contribution of the *realized* directions, which themselves depend on the previous trajectory. They do not make training a fixed linear combination of independently reusable gradients. Still, they expose why schedule and decay are coupled: a late update experiences fewer subsequent shrinkage factors. A schedule comparison that changes decay without recording it changes this weighting twice. Straight to Zero analyzes this relation together with the empirical benefit of vanishing endpoint rates. [R20.9, section 3]

### Branching and restarting have distinct accounting

[PAPER-REPORTED] In ordinary WSD, an endpoint model is produced by branching from a high-rate checkpoint and cooling down. Continuation can return to the trunk rather than start from the cooled endpoint. WSD-S instead retains the cooled model and raises the rate for the next stable stage, reusing the cooldown's progress. Wen et al. compare these trajectories and cyclic cosine under matched total work. Their theoretical explanation assumes a specific anisotropic loss geometry; it is a source model, not a measured global geometry for every language model. [R20.8, sections 3-5]

[MATHEMATICALLY-DERIVED] If a trunk costs $K$ updates and $m$ cooldown branches cost $c_1,\ldots,c_m$, total training is $K+\sum_i c_i$, including branches discarded from the final trunk. Calling each endpoint a $K_i$-update model without reporting the shared ancestry conceals cumulative compute. Conversely, charging the entire shared trunk independently to every endpoint overstates total campaign cost. The ledger needs both marginal endpoint cost and total campaign cost. Restarting from a cooled checkpoint is an optimizer transition whose state, rate, data position and warmup must be specified; resetting moments is an additional intervention.

## Algorithm

```text
Algorithm 20.3 — Evaluate a schedule at an explicit clock
INPUT: schedule segments; clock convention; pre-update counter; parameter-group scales
OUTPUT: rate for the next attempted update and a candidate next clock
STATE: warmup endpoint; decay start/end; branch ancestry; accepted and consumed counters
INVARIANT: segment boundaries and endpoint conventions are unambiguous
1. Select the declared clock value; reject a missing or incompatible resume record.
2. Locate its segment using fixed boundary comparisons.
3. Evaluate warmup, constant, linear, cosine or reciprocal decay under that segment.
4. Apply group-specific multipliers inherited from the parameterization.
5. Record the rate used before calling the optimizer.
6. Advance each clock only according to its stated acceptance or consumption policy.
7. Save schedule and branch state together with optimizer and data state.
TERMINATION: one rate evaluation; no implicit restart after the declared endpoint
COMPLEXITY: O(1) per group for a fixed segment count; O(G) for G parameter groups
```

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch's CosineAnnealingLR is documented as cosine annealing without the restarts of SGDR: its elapsed counter increases monotonically. Calling the scheduler after an optimizer update is the documented general ordering; advancing it before the first optimizer call can skip the first learning-rate value. Epoch-based examples do not imply that language-model schedules must count epochs. A trainer calling the scheduler per update needs $T_{\max}$ expressed in that same unit. [R20.23, R20.24]

[OFFICIAL-DOCUMENTATION] The inspected AdamW state-loading instructions require initializing the scheduler before loading the optimizer state, because scheduler initialization can overwrite loaded rates. Optimizer parameter identifiers are bookkeeping keys; matching them by order without checking the intended names can attach states to the wrong tensors. A successful deserialization is therefore weaker than a scientifically valid resume. PyTorch is the MODEL / AUTOGRAD FRAMEWORK layer; this chapter does not claim a tested installation. [R20.19]

[DERIVED] Schedule arithmetic costs negligible FLOPs compared with model training, but schedule choices change total updates, optimizer calls, checkpoints and rejected work. A branch retains its full restart state, not only weights. CPU-resident averages still consume memory and transfer bandwidth even when asynchronous execution hides their latency. Added memory and asynchronous work must remain in the campaign resource boundary.

## Experimental design

[PAPER-REPORTED] Hagele et al. compare cosine with constant-plus-cooldown using a 210M model on SlimPajama, matched warmup/training length and separate learning-rate sweeps. Their initial cooldown spans 20% of updates with a linear decay to zero. Further ablations vary shape and fraction; for a 200000-update run,10000 cooldown updates can nearly match the cosine endpoint. This supports a duration-dependent cooldown requirement, not a universal 20% rule. Their weight-averaging and schedule-free comparisons also show that removing the need to choose an endpoint does not eliminate hyperparameter sensitivity. The inspected v3 extends the comparison to 1B and short 8B runs, and reports that lower loss from cosine decay to zero can accompany a lower aggregate downstream score than its nonzero-floor recipe; validation loss and downstream quality remain separate outcomes. [R20.7, sections 3-4]

[PAPER-REPORTED] Wen et al. train 0.1B,0.3B,0.6B and 1.2B Llama-style models on the Pile at length 4096 and 1024 sequences per batch, using common model-specific peak rates and a 0.1peak-rate floor. WSD-S is competitive with cosine and generally improves over the other budget-agnostic alternatives at matched campaign work; a small-model short-budget case favors WSD. Cooldown near a loss spike can degrade the result. Their continuation comparison branches from models previously trained for 50B tokens and adds another 50B. This is actual trajectory evidence, not a guarantee about any resumed checkpoint. [R20.8, section 5/AppB]

[PAPER-REPORTED] Straight to Zero studies 111M,610M and 1.7B models on SlimPajama, length 2048, a fixed 1.1B-token validation set and mostly $\mu$P. It compares schedule shape and endpoint floors while sweeping peak rates and token-per-parameter budgets. At 2 tokens per parameter, decay to zero can be worse than a 0.1floor; benefits grow in longer regimes. The 111M/20-token-per-parameter seed study repeats training 5 times and reports standard deviation. These controls restrict the paper's title-level conclusion to its measured regimes. [R20.9, AppA/C]

### A disclosed production schedule is a compound intervention

[PAPER-REPORTED] DeepSeek-V3 uses AdamW with coefficients 0.9/0.95 and decay 0.1, warms to $2.2\times10^{-4}$ over 2000 updates, stays constant through 10T tokens, cosines to $2.2\times10^{-5}$ over 4.3T, then uses two lower-rate constant segments over the final 500B tokens. Batch size grows from 3072 to 15360 sequences in the first 469B tokens. Router-bias speed and multi-token-prediction weight also change. This accurately disclosed recipe is not a controlled ablation attributing final quality to WSD alone. [P13, section 4.2]

## Observations

### Observation 20.3 - Endpoint loss and extendability answer different questions

**What the paper claims.** [PAPER-REPORTED] Cooldown and WSD studies seek competitive endpoints with reusable trunks, while decay-to-zero studies compare endpoint schedules under tuned peak rates. [R20.7; R20.8; R20.9]

**What the evidence shows.** [PAPER-REPORTED] Reusable trunks can reduce repeated training across budgets; the decay-to-zero advantage depends on duration, with a reported negative result at very short training budgets. [R20.7; R20.8; R20.9]

**What we infer.** [DERIVED] Decay changes stochastic fluctuations and historical update weights, whereas branch reuse changes campaign cost. A favorable endpoint must retain its tuning budget, branch ancestry, and any extra training.

**What remains unknown.** [UNVERIFIED] This chapter has not executed a matched campaign comparison across all schedule families or established an architecture-independent optimal cooldown fraction.

## Failure modes

[DERIVED] Off-by-one warmup, a per-epoch scheduler used per batch, resuming with a new total horizon, advancing through skipped updates unintentionally, and applying a closed cosine past its intended domain can change the trajectory while preserving a plausible-looking plot. A rate floor prevents complete annealing; a zero terminal rate prevents further progress unless the schedule changes. Neither endpoint is universally appropriate. Restart decisions should follow the declared objective and retained state rather than the visual impression that loss has flattened.

## Extensions

[PAPER-REPORTED] MiniCPM's scalable training strategy combines a reusable stable stage with a final decay stage and data changes, providing an early production use of this family. Subsequent WSD-S research isolates restart ancestry, while Straight to Zero separates decay shape from the endpoint floor. These developments refine different questions: unknown future budget, reuse of cooldown work, and the final checkpoint at a fixed budget. They do not collapse into one superior schedule for all training regimes. [R20.29, R20.8, R20.9]

## Reproducibility

[DERIVED] Record the rate used at every accepted update, not just its analytic formula; all segment boundaries in their original unit; warmup and endpoint conventions; group multipliers; consumed/accepted clocks; moment and decay policies; branch ancestry; endpoint selection; and tuning/failed-run cost. Figures reconstructed from nominal schedules cannot substitute for these traces. No schedule experiment has been executed for this manuscript.

```figure
id: fig-20.3
kind: diagram
title: Reusable trunk and cooldown ancestry
caption: WSD returns to the stable trunk after producing a cooled endpoint. WSD-S continues from the cooled endpoint. Both retain the work spent on every branch in the campaign ledger.
placement: wide
evidence: PAPER-REPORTED
source: [R20.8]
alt: Warmup leads to a stable trunk. One branch cools to an endpoint. Ordinary WSD continues the trunk; WSD-S continues from the endpoint into a new stable phase.
spec:
  direction: LR
  nodes:
    - {id: warm, kind: process, label: warmup}
    - {id: trunk, kind: state, label: stable checkpoint}
    - {id: cool, kind: process, label: endpoint cooldown}
    - {id: end, kind: node, label: cooled model}
    - {id: cont, kind: state, label: continued stable trunk}
    - {id: simple, kind: state, label: WSD-S continuation}
  edges:
    - {from: warm, to: trunk}
    - {from: trunk, to: cool}
    - {from: cool, to: end}
    - {from: trunk, to: cont}
    - {from: end, to: simple}
```
