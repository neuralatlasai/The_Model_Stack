---
id: ms.section.22.3
entity_type: section
title: Optimizer transitions
short_title: Optimizer transitions
volume: 1
part: 4
chapter: 22
section: 22.3
slug: 22-3-optimizer-transitions
parent: ms.chapter.22
prev_sibling: ms.section.22.2
next_sibling: ms.section.22.4
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

# 22.3 Optimizer transitions

## Scope

[DERIVED] This section specifies the boundary between two training stages: full-state continuation, weight-only restart, deliberate schedule reset, learning-rate selection, and checkpoint compatibility. It does not redefine optimizer families, whose canonical treatment is in Chapter 20. Success is a transition whose parameters, moments, counters, scheduler, and data state implement the declared policy, with pilot evidence that the chosen update magnitude is useful and stable.

## Why this exists

[DERIVED] A published checkpoint often provides weights without its full optimizer state. Continuing from those weights is feasible, but it is a new optimization trajectory. Conversely, loading historical optimizer state does not guarantee a correct continuation if parameter ordering, sharding, precision, or trainability has changed. “Resumed successfully” is an I/O outcome; it says nothing about whether moments belong to the intended parameters.

[DERIVED] Schedule policy creates a second boundary. The final rate of a completed run may be too small for a chosen adaptation budget, while a large rewarming rate can disturb retained behavior. The relevant choice is a trajectory of accepted updates under a new exposure law. A fixed fraction of a previous peak rate has no universal meaning across different optimizers, batch sizes, parameter groups, or context costs.

## Intuition

[MATHEMATICALLY-DERIVED] A momentum state is an exponentially weighted history of gradients. After a distribution change, inherited history persists for a finite window whose length depends on the decay factor. Resetting that history changes early updates; preserving it can smooth or misdirect them depending on the old and new gradients. The inherited contribution eventually decays algebraically in the recurrence, but parameters changed by early updates can remain on a different trajectory.

[DERIVED] Scheduler state and optimizer state have related but separate clocks. An optimizer moment counter supplies bias correction; a scheduler counter selects a rate; an exposure counter counts consumed tokens. They need not reset together. Each needs an explicit policy and a reason. Reusing one global step integer for all three hides a scientific decision in an implementation convenience.

## Formulation

[MATHEMATICALLY-DERIVED] Let $m_0,v_0$ be inherited first and second moments at a boundary, with decay factors $0\le\beta_1,\beta_2<1$. After $k$ accepted new-stage gradients $g_1,\ldots,g_k$, componentwise recurrences expand to

$$
\begin{aligned}
m_k&=\beta_1^k m_0+
(1-\beta_1)\sum_{j=1}^k\beta_1^{k-j}g_j,\\
v_k&=\beta_2^k v_0+
(1-\beta_2)\sum_{j=1}^k\beta_2^{k-j}(g_j\odot g_j).
\end{aligned}
$$
*(Eq. 22.7)*

[MATHEMATICALLY-DERIVED] The inherited coefficient falls below a chosen $0<\varepsilon_h<1$ after

$$
k\ge
\left\lceil\frac{\log\varepsilon_h}{\log\beta}\right\rceil,
\qquad 0<\beta<1.
$$
*(Eq. 22.8)*

[MATHEMATICALLY-DERIVED] This bounds a coefficient, not the norm of the inherited term unless the starting moment is also bounded. It does not bound downstream parameter divergence. For $\beta=0$, inherited history disappears after one accepted update.

[DERIVED] Write the transition policy as

$$
\mathcal B_s:
(\theta^-,\omega^-,\sigma^-,r^-,d^-)
\mapsto
(\theta^+,\omega^+,\sigma^+,r^+,d^+),
$$
*(Eq. 22.9)*

[DERIVED] where $r$ is stochastic state and $d$ is the logical data cursor. A full-state continuation restores all compatible coordinates. A weight-only restart sets $\theta^+=\theta^-$ while constructing new optimizer, scheduler, stochastic, and data state as declared. A schedule-only restart preserves optimizer moments and their counters while replacing the schedule. None of these operations implies the others.

[MATHEMATICALLY-DERIVED] A useful measured update diagnostic is

$$
u_{s,k}=
\frac{\|\theta_{s,k+1}-\theta_{s,k}\|_2}
{\max(\|\theta_{s,k}\|_2,\varepsilon_\theta)},
\qquad \varepsilon_\theta>0.
$$
*(Eq. 22.10)*

[DERIVED] Compute this by parameter group or tensor when a global norm hides different scales. It measures the realized transition, including weight decay, clipping, and numerical effects. It is not a proof of a safe learning rate.

## Mechanism

### Methodology

[DERIVED] Start by choosing which trajectory the experiment intends to study. Recovery of an interrupted stage requires the same optimizer, moments, bias-correction counters, schedule position, stochastic states, and logical input cursor within the reproducibility regime specified in Chapter 19. A distribution transition may deliberately reset some of these. Store the transition as Eq. 22.9; do not describe a deliberate reset as an exact recovery.

[MATHEMATICALLY-DERIVED] A moment reset with an unchanged old bias-correction counter is a distinct algorithm. With $m_0=v_0=0$, the first nonzero scalar gradient gives $m_1=(1-\beta_1)g$, $v_1=(1-\beta_2)g^2$. Correct fresh bias correction returns $\hat m_1=g$, $\hat v_1=g^2$. If an old counter is large enough that its correction denominators are approximately one, the normalized direction is approximately $(1-\beta_1)/\sqrt{1-\beta_2}$ times $\operatorname{sign}(g)$, neglecting the stabilizing denominator term. Resetting only arrays therefore does not reproduce a fresh optimizer.

[DERIVED] Next validate parameter-state correspondence. Compare architecture and tokenizer configurations, tensor names, shapes, dtypes, parameter groups, tied identities, and trainability. A new vocabulary may add rows requiring explicitly initialized state. An adapter introduces new tensors and changes the optimized subspace. A resharding conversion changes state placement but should preserve logical tensor values. These changes need a transformation rule, not a permissive load that silently discards unmatched entries.

[DERIVED] Specify the schedule in a declared clock. If it is defined over consumed tokens, changing accepted batch targets changes the number of optimizer steps per token. If it is defined over updates, a changed batch size changes exposure at the same schedule point. Rejected nonfinite updates need a rule for every clock; otherwise the scheduler can advance while moments remain unchanged. The correct rule follows the stated experiment, not an assumed library default.

[DERIVED] Select rates through bounded pilots from the same starting artifact. Keep the new exposure law, clipping, trainability, optimizer definition, and evaluation harness fixed. Compare candidate rates or trajectories using domain validation, retention slices, update ratios, loss spikes, and accepted-token throughput. Reuse equal initial data order where possible to reduce comparison variance, and include repeated runs when stochastic variation can reverse the choice. A pilot chooses among candidates; it does not establish a global optimum.

[DERIVED] A schedule sweep should include the control relevant to the claim: unchanged continuation for a reset claim; a fresh optimizer for an inherited-state claim; a fixed exposure budget for a data-efficiency claim. Avoid selecting the best checkpoint from one long run against the final checkpoint of another. Apply the same selection rule and charge all pilot and evaluation costs to the adaptation decision.

```figure
id: fig-22.9
kind: diagram
title: Three independent transition clocks
caption: Parameter loading does not determine moment history or schedule position. A boundary policy assigns each state explicitly before the first accepted update.
placement: inline
evidence: DERIVED
source: DERIVED:eq-22.9
alt: A checkpoint compatibility gate sends parameters, optimizer moments and counters, schedule state, and random/data state into a boundary policy. The policy produces one complete next-stage state.
spec:
  direction: TB
  nodes:
    - { id: artifact, kind: model, label: Starting artifact }
    - { id: compat, kind: branch, label: Compatibility gate }
    - { id: weights, kind: tensor, label: Parameter identities }
    - { id: moments, kind: state, label: Moments and correction counter }
    - { id: schedule, kind: state, label: Schedule and exposure clocks }
    - { id: data, kind: state, label: RNG and logical data position }
    - { id: policy, kind: process, label: Declared boundary transformation }
    - { id: next, kind: state, label: Complete next-stage state }
  edges:
    - { from: artifact, to: compat }
    - { from: compat, to: weights }
    - { from: compat, to: moments }
    - { from: compat, to: schedule }
    - { from: compat, to: data }
    - { from: weights, to: policy }
    - { from: moments, to: policy }
    - { from: schedule, to: policy }
    - { from: data, to: policy }
    - { from: policy, to: next, kind: emphasis }
```

## Algorithm

[DERIVED] **Algorithm 22.3 — Transactional optimizer boundary.** Inputs are a previous state $X^-$, compatibility map $H$, declared policy $\mathcal B_s$, finite pilot horizon $K$, and acceptance predicate $\mathcal G_s$. The candidate state is isolated from the original artifact. Output is an admitted state or rejection with the starting artifact intact.

$$
\begin{aligned}
1.\quad&
c\gets\mathsf{Compatible}(X^-,H,\mathcal U_s);
\qquad c=0\ \Rightarrow\ r\gets\bot.\\
2.\quad&
X_0\gets\mathcal B_s(H(X^-));
\quad
\mathsf{StateAudit}(X_0)=0\ \Rightarrow\ r\gets\bot.\\
3.\quad&
g_k\gets\nabla_{\theta_k}J_s(\theta_k;\mathcal D_k),
\qquad k=0,\ldots,K-1.\\
4.\quad&
X_{k+1}\gets
\begin{cases}
\mathsf{AcceptedUpdate}(X_k,g_k),&
\mathsf{Finite}(g_k)\land\mathsf{UpdateGate}(X_k,g_k),\\
\mathsf{RejectedAttempt}(X_k),&\text{otherwise}.
\end{cases}\\
5.\quad&
r\gets
\begin{cases}
X_K,&\mathcal G_s(\mathsf{Evaluate}(X_K))=1,\\
\bot,&\text{otherwise}.
\end{cases}
\end{aligned}
$$

[DERIVED] Early rejection terminates the procedure immediately. $\mathsf{RejectedAttempt}$ follows the declared RNG/data policy while preserving parameter and optimizer mutation invariants; its clock behavior is part of $\mathcal B_s$. The finite attempt horizon prevents an endless loop of rejected steps. A source-compatible transformation $H$ must preserve parameter/state identity; it is not an arbitrary tensor cast.

## Implementation

[OFFICIAL-DOCUMENTATION] **PyTorch — core training framework.** The 2.14 optimizer documentation states that loaded parameter IDs are associated with current parameters by group order without additional identity verification. Parameter names do not automatically determine matching. The load-state page also warns about scheduler initialization order and loaded learning rates. These disclosures motivate an explicit compatibility audit rather than trusting a successful load. [R22.6] [R22.7]

[DERIVED] A metadata audit precedes allocation of large moments. For $N_{\mathcal U}$ trainable scalars, two FP32 moment arrays occupy $8N_{\mathcal U}$ bytes before sharding and allocator overhead. Checkpoint I/O also includes parameter bytes and any master copies, scheduler, RNG, and data state. A reset can reduce the input checkpoint size but does not eliminate steady-state optimizer memory after moments are created.

[MATHEMATICALLY-DERIVED] Resharding at least reads and writes the relevant state volume; communication depends on old and new placements. A pilot of $K$ updates incurs model forward/backward work plus optimizer $O(KN_{\mathcal U})$ elementwise work and validation. Exact latency, achieved throughput, energy, and money are UNVERIFIED without the specified hardware, runtime, parallelism, and observation window. Chapter 29 owns distributed state layouts.

```figure
id: fig-22.10
kind: calculator
title: Inherited moment coefficient
caption: Eq. 22.7 isolates the coefficient of the starting moment. A small coefficient does not prove that early parameter changes have disappeared.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-22.7
alt: With decay factor 0.95 and 100 accepted updates, the inherited moment coefficient is about 0.00592. A higher decay factor retains history longer.
states:
  - { anchor: formulation, label: Short boundary window, variables: { beta: 0.95, k: 100 }, note: The initial second moment still has a finite algebraic coefficient. }
  - { anchor: limitations, label: Long boundary window, variables: { beta: 0.95, k: 1000 }, note: Vanishing history weight does not imply identical parameter trajectories. }
spec:
  tex: h_k=\beta^k
  equation: "22.7"
  inputs:
    - { symbol: beta, label: moment decay, default: 0.95, min: 0.8, max: 0.999, step: 0.001, format: fixed3 }
    - { symbol: k, label: accepted updates, default: 100, min: 1, max: 2000, step: 1, format: integer }
  outputs:
    - { symbol: h, label: inherited coefficient, formula: beta^k, format: fixed3, emphasis: true }
```

```figure
id: fig-22.11
kind: stat-panel
title: Restart policy audit
caption: These fields are independent choices. State each one even when the inference weights are unchanged.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-22.9
alt: The audit distinguishes parameter loading, moment carry-over or reset, bias-correction counter, schedule clock, data cursor, and stochastic state.
spec:
  header: BOUNDARY POLICY
  rows:
    - { key: parameters, value: preserve or transform }
    - { key: moments, value: carry or initialize }
    - { key: correction, value: counter policy explicit }
    - { key: schedule, value: clock and horizon explicit }
    - { key: data and RNG, value: restore or restart explicitly }
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] Ibrahim et al. study Pile-to-SlimPajama and English-to-German transitions at 405M parameters, with a larger approximately 10B weak-shift case. Their default transitions drop optimizer state. Appendix A.4 compares keeping versus dropping moments for a 405M model over 40B new tokens, under matched rewarming/decay. The reported losses converge closely in that setting. Main runs use AdamW, sequence length 2,048, and mixed FP16/FP32. [R22.3]

[PAPER-REPORTED] The June 2026 Nemotron 3 Ultra report branches BF16 continuations from 5T, 10T, and 16T checkpoints for 74B tokens to diagnose precision-related loss gaps. It also reports that switching all tensors to BF16 does not resolve its later divergence. This is a precision/state diagnostic, not a domain-adaptation comparison or proof that restart is generally beneficial. [R22.9]

## Observations

**What the paper claims.** [PAPER-REPORTED] The scalable continuation study reports that rewarming and redecaying can improve adaptation while increasing forgetting; combining them with replay can match its retraining baselines in the studied regimes. [R22.3]

**What the evidence shows.** [DERIVED] A matched moment-state ablation can test whether inherited moments matter under that schedule and distribution. It cannot establish that all state may be dropped without consequence, or that a result at one model scale transfers to a changed architecture.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 22.7 explains why moment-state effects can be concentrated near the boundary. It does not explain every observed loss spike; numerical precision, data, and optimizer changes need independent checks.

**What remains unknown.** [NOT-DISCLOSED] The inspected DeepSeekMath and V3 context-extension descriptions do not establish their complete optimizer-state transformations. A reported learning rate is insufficient to reconstruct those transitions. [R22.2] [P13]

## Failure modes

[DERIVED] Observe moment-to-parameter mismatch, stale bias-correction counters after reset, schedule jumps from load order, skipped-update clock drift, and incompatibility after vocabulary or trainability changes. Symptoms include immediate update-ratio discontinuities, unexplained tensor-group divergence, and different next-step behavior from the same nominal checkpoint. A smooth aggregate loss can still hide a state mismatch.

[DERIVED] A small rate can produce a deceptively stable pilot that never adapts; a large rate can improve target loss while degrading retention. Evaluate both axes. A successful checkpoint load is neither a numerical reference comparison nor a scientific acceptance gate.

## Siblings

[DERIVED] Full-state continuation prioritizes trajectory continuity; a weight-only restart prioritizes access from an inference artifact; a schedule-only reset changes update scale while preserving history. Partial resets by group are additional algorithms requiring a rationale and ablation. None is an automatic consequence of “continued pretraining.”

## Extensions

[DERIVED] Checkpoint branches permit paired experiments from the same starting point, including precision changes, rate changes, and replay changes. Their causal value comes from changing one declared coordinate and retaining matched controls. Weight averaging introduces another artifact transformation and belongs to Chapter 23's composition treatment; its moments cannot be assumed to equal an average of constituent optimizer histories.

## Limitations

[DERIVED] Eq. 22.8 characterizes history decay under fixed coefficients. It does not apply unchanged to different optimizers, variable moment coefficients, or transformed moments. Pilot selection remains conditional on the target corpus, horizon, and retention tests. No disclosed case supplies a universal restart rule.

## Reproducibility

[DERIVED] Archive the pre- and post-boundary state manifests, parameter mapping, conversion rules, optimizer definition, moment counter policy, scheduler clock, accepted/rejected-update semantics, and pilot selection rule. Record actual package versions separately from inspected documentation versions. Reading PyTorch 2.14 documentation is not a claim that this workspace ran PyTorch 2.14 or reproduced a training result.

## References

- [R22.3](references.md#r223) — controlled continual-pretraining and moment-state ablation.
- [R22.6](references.md#r226) — optimizer state loading.
- [R22.7](references.md#r227) — AdamW state and parameter association.
- [R22.9](references.md#r229) — 2026 precision continuation diagnostic.
- [R22.2](references.md#r222), [P13](references.md#p13) — disclosure boundaries.
