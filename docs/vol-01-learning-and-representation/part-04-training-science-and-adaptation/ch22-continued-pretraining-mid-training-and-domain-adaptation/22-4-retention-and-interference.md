---
id: ms.section.22.4
entity_type: section
title: Retention and interference
short_title: Retention and interference
volume: 1
part: 4
chapter: 22
section: 22.4
slug: 22-4-retention-and-interference
parent: ms.chapter.22
prev_sibling: ms.section.22.3
next_sibling: ms.section.22.5
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

# 22.4 Retention and interference

## Scope

[DERIVED] This section owns retention during one adaptation decision: general-skill regression, replay/mixing, capability balance, and targeted validation. The full sequential-task theory and retention matrices belong to Chapter 24. Success requires a domain gain together with bounded degradation on every required retained population. Aggregate language-model loss and a single general benchmark are insufficient release criteria.

## Why this exists

[DERIVED] Specialization changes the optimization population. A model may reduce loss on a target corpus while becoming less useful on general tasks, a previously supported language, or a required output protocol. The problem is multiobjective even when training uses one scalar loss. A weighted mean of evaluation metrics can hide a severe regression if another slice improves enough.

[DERIVED] Retention comparisons also depend on the starting artifact. Comparing an adapted model with the exact checkpoint from which it began measures the intervention. Comparing it with another checkpoint from the same family measures a different difference. A pre-decay checkpoint and a final decayed checkpoint can already have different capabilities. Preserve both if both are operationally relevant, but do not silently substitute one baseline for the other.

## Intuition

[MATHEMATICALLY-DERIVED] In a local smooth approximation, a target-domain gradient changes retained loss according to its inner product with the retained gradient. Positive alignment decreases both losses under a descent step; negative alignment creates a first-order conflict. Replay contributes a retained-data gradient that can offset that conflict. The required contribution depends on gradient geometry, not just a corpus percentage.

[DERIVED] This local picture is diagnostic. Neural-network training is nonlinear, gradients are noisy, and capability metrics need not track next-token loss. A retained-loss proxy is useful only to the extent that its population and objective cover the required behavior. A small aggregate loss change cannot certify stable instruction following, tool formatting, or safety behavior.

## Formulation

[DERIVED] Let $J_D(\theta)$ and $J_G(\theta)$ be target and retained token-mean objectives defined on fixed populations using the normalization of Chapter 19. Let $\rho\in[0,1]$ denote the retained supervised-token fraction. Then

$$
J_\rho(\theta)=(1-\rho)J_D(\theta)+\rho J_G(\theta),
\qquad
g_\rho=(1-\rho)g_D+\rho g_G,
$$
*(Eq. 22.11)*

[DERIVED] where $g_D=\nabla J_D$ and $g_G=\nabla J_G$. This expression presumes actual token-objective weights; example-sampling weights require Section 22.2's conversion.

[MATHEMATICALLY-DERIVED] For a gradient-descent step $\theta'=\theta-\eta g_\rho$, $\eta>0$, and $J_G$ differentiable,

$$
J_G(\theta')-J_G(\theta)
=-\eta\bigl[(1-\rho)a+\rho c\bigr]+O(\eta^2),
\quad
a=\langle g_G,g_D\rangle,\quad c=\|g_G\|_2^2.
$$
*(Eq. 22.12)*

[MATHEMATICALLY-DERIVED] If $a<0$ and $c>0$, the first-order retained-loss change is nonpositive when

$$
\rho\ge\rho_{\mathrm{local}}=
\frac{-a}{c-a}.
$$
*(Eq. 22.13)*

[MATHEMATICALLY-DERIVED] If $J_G$ has $\kappa_G$-Lipschitz gradient over the update segment, the descent lemma gives the stronger finite-step bound

$$
J_G(\theta')-J_G(\theta)
\le-\eta\langle g_G,g_\rho\rangle
+\frac{\kappa_G\eta^2}{2}\|g_\rho\|_2^2.
$$
*(Eq. 22.14)*

[MATHEMATICALLY-DERIVED] The condition in Eq. 22.13 alone does not control the second term. At $g_G=0$, the first-order term vanishes for every $\rho$; curvature can still increase retained loss. For an adaptive optimizer, substitute the actual update direction into Eq. 22.14. Raw-gradient alignment is not the same as alignment after diagonal preconditioning and clipping.

## Mechanism

### Methodology

[DERIVED] Begin with the retained capability contract. List the populations the current release must continue to support and define an oriented utility $U_j$ for each: larger is better. Loss-based tests can use negative loss; accuracy-based tests use their exact task metric. Preserve units and evaluator details. Avoid an average that treats a point of exact-match accuracy as interchangeable with a point of another metric without an explicit utility model.

[DERIVED] For the exact starting checkpoint $\theta_0$, define $\Delta_j=U_j(\theta)-U_j(\theta_0)$ and a chosen tolerance $\delta_j\ge0$. Domain acceptance requires a lower confidence bound on its gain above a chosen useful threshold $\gamma_D$. Retention requires lower bounds $\mathrm{LCB}(\Delta_j)\ge-\delta_j$ for all required slices. Selecting the checkpoint on a development set and then reporting that set as independent evidence invalidates the stated selection/test separation.

[DERIVED] Replay can use original pretraining data when permission and availability allow, or a declared proxy population when they do not. A proxy is a different distribution. Matching its loss does not imply matching the original pretraining distribution. Maintain source rights and retention conditions separately from a model-retention metric; “retain capability” does not authorize retaining restricted data.

[MATHEMATICALLY-DERIVED] At total stage budget $D_s$, replay consumes $D_G=\rho D_s$ targets and leaves $D_D=(1-\rho)D_s$ for new-domain exposure. If new-domain targets are held fixed instead, the total becomes $D_s=D_D/(1-\rho)$ for $\rho<1$. The compute overhead under equal per-target cost is $1/(1-\rho)$. Thus replay is a reallocation under one boundary and extra expenditure under the other.

[DERIVED] Choose the smallest feasible replay design through a bounded grid or other declared search, evaluating domain utility and retention at each candidate. Feasibility is an empirical outcome. Do not plug a minibatch estimate of Eq. 22.13 into production as a guarantee: gradient estimation noise, curvature, and changed optimizer state can reverse its prediction. The equation clarifies the mechanism and why one percentage cannot be universal.

[DERIVED] Monitor transient and final behavior separately. A candidate may recover retained performance after decay while experiencing a large intermediate regression. If intermediate checkpoints are never served, the release implication differs from a continuously updated deployment. The retained metrics and archive still need to capture that trajectory, since early stopping or interruption can otherwise publish an unsafe intermediate artifact.

```figure
id: fig-22.12
kind: diagram
title: Retention as a conjunction of gates
caption: Domain improvement and every required retention bound must hold. A favorable average cannot cancel a failed capability constraint.
placement: inline
evidence: DERIVED
source: DERIVED:eq-22.15
alt: An adapted candidate is compared with the exact starting checkpoint on a domain test and several retained populations. Their confidence bounds enter one conjunction; a single failed required slice rejects the release.
spec:
  direction: TB
  nodes:
    - { id: candidate, kind: model, label: Adapted candidate }
    - { id: start, kind: model, label: Exact starting checkpoint }
    - { id: domain, kind: metric, label: Useful domain gain }
    - { id: retained, kind: metric, label: Per-capability retention bounds }
    - { id: gate, kind: branch, label: All required constraints hold }
    - { id: accept, kind: state, label: Accept or reject artifact }
  edges:
    - { from: candidate, to: domain }
    - { from: start, to: domain, kind: dependency }
    - { from: candidate, to: retained }
    - { from: start, to: retained, kind: dependency }
    - { from: domain, to: gate }
    - { from: retained, to: gate, kind: emphasis }
    - { from: gate, to: accept }
```

## Algorithm

[DERIVED] **Algorithm 22.4 — Retention-constrained checkpoint selection.** Inputs are finite candidates $\Theta=\{\theta_1,\ldots,\theta_M\}$, exact baseline $\theta_0$, development populations, gain threshold $\gamma_D$, retained tolerances $\delta_j$, and a fixed interval procedure. Final test populations remain sealed until selection.

$$
\begin{aligned}
1.\quad&
\hat\Delta_{m,j}\gets
\widehat U_j(\theta_m)-\widehat U_j(\theta_0),
\qquad m=1,\ldots,M,\quad j=D,1,\ldots,J.\\
2.\quad&
l_{m,j}\gets\mathsf{LCB}(\hat\Delta_{m,j};
\text{declared pairing and multiplicity rule}).\\
3.\quad&
\mathcal F\gets
\{m:l_{m,D}\ge\gamma_D\ \land\
               \forall j\le J,\ l_{m,j}\ge-\delta_j\}.\\
4.\quad&
m^\star\gets
\begin{cases}
\arg\min_{m\in\mathcal F}\mathsf{LifecycleCost}(m),&
\mathcal F\ne\varnothing,\\
\bot,&\mathcal F=\varnothing.
\end{cases}\\
5.\quad&
r\gets
\begin{cases}
\mathsf{TestOnce}(\theta_{m^\star},\theta_0),&m^\star\ne\bot,\\
\bot,&m^\star=\bot.
\end{cases}
\end{aligned}
$$
*(Eq. 22.15)*

[DERIVED] Use a deterministic tie-break rule. Test failure rejects the candidate; it does not permit repeated tuning against the same final test under a “test once” claim. All required slices remain explicit, and no scalar average replaces their conjunction. The procedure terminates after $M(J+1)$ development evaluations and at most one final selected-model test.

## Implementation

[DERIVED] **PyTorch — core training framework; Hugging Face Transformers — model-definition layer.** A replay sampler feeds the same tensor and loss interfaces as target data, while source tags allow separate sum/count accounting. Required state includes source cursors and replay randomness. Evaluation must restore the same inference serialization and decoding settings across baseline and candidates. A retained skill can regress through a template mismatch even when weights alone are adequate.

[MATHEMATICALLY-DERIVED] Replay storage is proportional to the retained corpus representation; tokenized integer storage is $b_{\mathrm{id}}U_G$ bytes before metadata and compression, where $b_{\mathrm{id}}$ is bytes per token ID. Streaming trades local capacity for network and storage access. Additional replay does not inherently add trainable parameters. It adds exposure, and under fixed target exposure it adds compute and elapsed time.

[DERIVED] Gradient alignment diagnostics require two gradient estimates at compatible parameter state. Materializing both can add $O(N_{\mathcal U})$ memory; separate passes add forward/backward work. This cost can exceed the usefulness of the diagnostic for a large model. It is optional evidence, not a prerequisite for implementing ordinary replay. State exact memory/communication boundaries if collecting it.

```figure
id: fig-22.13
kind: calculator
title: Local replay threshold under conflicting gradients
caption: Analytical configuration for Eq. 22.13 with negative alignment. The threshold controls only the first-order term of retained loss under plain gradient descent.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-22.13
alt: For retained-target gradient inner product minus two and retained gradient squared norm four, the first-order threshold is one third retained target weight.
states:
  - { anchor: formulation, label: Moderate conflict, variables: { a: -2, c: 4 }, note: The first-order threshold is one third. }
  - { anchor: limitations, label: Stronger conflict, variables: { a: -8, c: 4 }, note: More conflict raises the local threshold but does not bound finite-step curvature. }
spec:
  tex: \rho_{\mathrm{local}}=-a/(c-a)
  equation: "22.13"
  inputs:
    - { symbol: a, label: gradient inner product, default: -2, min: -10, max: -0.1, step: 0.1, format: fixed3 }
    - { symbol: c, label: retained gradient squared norm, default: 4, min: 0.1, max: 10, step: 0.1, format: fixed3 }
  outputs:
    - { symbol: rho, label: first-order retained fraction, formula: -a/(c-a), format: percent, emphasis: true }
```

```figure
id: fig-22.14
kind: stat-panel
title: Retention comparison contract
caption: Keep the starting checkpoint and operational release baseline separate. The gate names which one defines each comparison.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-22.15
alt: The contract records exact starting artifact, required populations, oriented metrics, per-slice tolerances, uncertainty method, and checkpoint selection rule.
spec:
  header: RETENTION GATE
  rows:
    - { key: baseline, value: exact starting artifact }
    - { key: populations, value: each required capability }
    - { key: thresholds, value: gain and regression bounds }
    - { key: uncertainty, value: paired and multiplicity-aware }
    - { key: selection, value: development then sealed test }
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] Béthune et al.'s ICML 2025 study trains GPT-style models from 41M to 1.27B parameters on RedPajamaV2, then continues on 12 Pile domains with 300K–30M available tokens. It varies injected pretraining data over 0%, 0.1%, 0.5%, 1%, and 5%, using 12K adaptation steps and selecting the minimum target-validation-loss checkpoint. Sequence length is 1,024; arithmetic is BF16 except FP32 normalization and attention softmax, on A100-80GB GPUs. Outcomes are train/validation losses, not a comprehensive behavioral retention suite. [R22.5]

## Observations

**What the paper claims.** [PAPER-REPORTED] The injection study reports that even 1% pretraining data can prevent pretraining-loss forgetting in its tested regime; the best target-domain mixture depends on domain, data size, and model scale. Repetition of a small replay pool can itself overfit. [R22.5]

**What the evidence shows.** [DERIVED] These measurements support retention of a specific distributional loss proxy at a selected checkpoint. They do not establish preservation of every general skill or supply a 1% rule for a different model, data regime, or objective.

**What we infer.** [DERIVED] The retention claim must name both the metric and baseline artifact. In DeepSeekMath, the source's Table 4 marks the pre-decay checkpoint used for continuation separately from the final code checkpoint; code scores equal the former but fall below the latter. [R22.2]

**What remains unknown.** [NOT-DISCLOSED] The studies do not supply a universal, independently replicated replay fraction that preserves all deployment-critical behavior. The book's deployment gate in Eq. 22.15 is a proposed contract, not a reported training outcome.

## Failure modes

[DERIVED] Aggregate masking can hide losses in a rare language or a low-frequency task. Proxy mismatch can preserve general corpus loss while breaking required behavior. Replay-pool concentration can overfit retained documents. Checkpoint-selection asymmetry can inflate the apparent advantage of one intervention. Observe per-slice curves, document-level repetition, exact baseline hashes, and selection histories.

[MATHEMATICALLY-DERIVED] If $\rho=1$, there is no new-domain supervision in Eq. 22.11. If $\rho=0$, there is no explicit retained-population gradient. Neither endpoint guarantees the corresponding capability outcome, because transfer and interference depend on the learned representation and optimization. A mixture coefficient is an intervention parameter, not a capability probability.

## Siblings

[DERIVED] Replay uses retained examples; a retained-loss constraint expresses an acceptance requirement; parameter anchoring constrains parameter movement; gradient projection changes update geometry. These are different mechanisms. Chapter 24 owns the sequential-learning methods and their derivations. Freezing a subset or using an adapter changes the update subspace, as developed in Chapter 23, but does not logically guarantee behavioral retention.

## Extensions

[DERIVED] Extend a single general-skill gate into domain/language/length/format slices chosen before training. If the final model is to undergo SFT or RL, repeat retention checks after that stage; retention before post-training does not imply retention afterward. Charge each added evaluation to the experiment budget and preserve the intermediate artifact lineage.

## Limitations

[DERIVED] The local analysis assumes differentiability and plain gradient descent, with a smoothness condition only for Eq. 22.14. It does not establish global convergence or a safe replay controller. Finite evaluation has limited power for rare failures, and tolerances encode the intended utility of the deployment. Report the power and acceptable effect size rather than calling an inconclusive comparison “no forgetting.”

## Reproducibility

[DERIVED] Preserve the exact baseline, every selected checkpoint, replay source snapshots and rights, realized retained target fractions, per-slice predictions, confidence procedure, and selection rule. Report both target and retained trajectories at fixed evaluation intervals. The verification protocol in this chapter is unexecuted; no measured retention result is attributed to the book.

## References

- [R22.5](references.md#r225) — pretraining-data injection study and scope.
- [R22.2](references.md#r222) — exact pre-decay comparison baseline in Table 4.
