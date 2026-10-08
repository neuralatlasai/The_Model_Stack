---
id: ms.section.24.3
entity_type: section
title: Mechanism families
short_title: Retention mechanisms
volume: 1
part: 4
chapter: 24
section: 24.3
slug: 24-3-mechanism-families
parent: ms.chapter.24
prev_sibling: ms.section.24.2
next_sibling: ms.section.24.4
children: []
prerequisites: [ms.chapter.19, ms.chapter.20, ms.chapter.23, ms.section.24.1, ms.section.24.2]
downstream: [ms.section.24.4, ms.section.24.5]
related: [ms.chapter.39]
relations: []
axes: {lifecycle: [continued_training, adaptation], mechanism: [replay, regularization, distillation, parameter_isolation], feedback_setting: [], modality: [text, image]}
papers: []
implementations: [impl.hugging-face-peft, impl.hugging-face-trl]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2500
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# 24.3 — Mechanism families

## Scope

[DERIVED] A retention mechanism preserves selected information through examples, a parameter-space surrogate, a function-space constraint, or isolated computation. This section derives representative mechanisms rather than treating “continual learning” as a single objective. Each method is evaluated on retention and acquisition under the same permissions and resource boundary. Low-rank parameterization itself is owned by Chapter 23; general distillation by Chapter 39.

## Why this exists

[MATHEMATICALLY-DERIVED] An update using only current-task gradients has no explicit measurement of historical risk. Retention therefore requires either information about old behavior, a structural restriction that leaves old execution unchanged, or a distributional property making current updates compatible with historical tasks. Every family spends a different resource: stored records, model/statistic memory, additional forward passes, restricted plasticity, or growing capacity. “Rehearsal-free” does not eliminate this tradeoff.

[DERIVED] The design question is which approximation to historical risk is affordable and permitted. An exemplar buffer estimates risk on actual old records. A curvature anchor replaces it locally in parameter space. Distillation constrains outputs on a chosen input distribution. Isolation protects an old computation path while adding a new one. None of these objects automatically represents all previously useful behavior.

## Intuition

[MATHEMATICALLY-DERIVED] For historical loss $\mathcal L_{\mathrm{old}}$ and current gradient $g$, a small update $-\eta g$ changes historical loss by approximately $-\eta\nabla\mathcal L_{\mathrm{old}}^{\mathsf T}g$. Conflict occurs when the inner product is negative. Replay measures historical gradients directly on a sample; regularization approximates their geometry near an anchor; output matching measures change at selected inputs; isolation makes the old path's parameter derivative zero with respect to the new trainable state. These are distinct controls over the same interference channel.

## Formulation

| Symbol | Meaning | Shape or condition |
|---|---|---|
| $\theta^-$ | Checkpoint before the current phase | $\mathbb R^N$ |
| $\mathcal M$ | Authorized replay buffer | Finite records with provenance |
| $\rho$ | Replay mixture probability | $[0,1]$ |
| $\Omega$ | Diagonal accumulated precision | Nonnegative vector in $\mathbb R^N$ |
| $\kappa$ | Anchor strength | Nonnegative; distinct from global KL coefficient |
| $q_A$ | Input distribution for output anchors | Declared support |
| $\phi_k$ | Parameters allocated to phase $k$ | Adapter/module-specific shape |
| $\bar\theta$ | Teacher parameters | Frozen during an individual gradient calculation |

[MATHEMATICALLY-DERIVED] A representative combined objective is

$$
\mathcal J_k(\theta)=(1-\rho)\mathcal L_k(\theta)
+\rho\widehat{\mathcal L}_{\mathcal M}(\theta)
+\frac\kappa2\sum_i\Omega_i(\theta_i-\theta_i^-)^2
+\xi\mathbb E_{x\sim q_A}\mathrm{KL}(p_{\theta^-}(\cdot\mid x)\Vert p_\theta(\cdot\mid x)).
$$

*(Eq. 24.12)*

[DERIVED] This is a book-defined interface for comparing mechanisms, not the original objective of every cited method. $\xi\geq0$ is an output-anchor weight. Terms require compatible normalization and authorized data access. Full token distributions and response-only imitation are different estimators; their canonical distinction is in Chapter 39.

## Mechanism

### Methodology

#### Replay and gradient constraints

[MATHEMATICALLY-DERIVED] If current and replay examples are sampled independently according to the declared mixture, their weighted loss gradient is an unbiased estimator of that mixture's empirical objective. It is not necessarily unbiased for all historical data: selection and weighting determine the target. For a fixed buffer of $m$ records from $n$ arrivals, reservoir inclusion probability $m/n$ follows inductively when the $n$th record replaces a uniformly selected slot with probability $m/n$. This book-derived sampling rule provides equal record inclusion, not balanced tasks or rare-event coverage.

[PAPER-REPORTED] GEM uses stored old-task examples to constrain gradient directions rather than simply add their loss. It projects the proposed gradient so its inner product with each remembered-task gradient is nonnegative. [R24.3], §3, Eqs. 6–11. [MATHEMATICALLY-DERIVED] For old gradient $g_j$, $\mathcal L_j(\theta-\eta\tilde g)\approx\mathcal L_j(\theta)-\eta g_j^{\mathsf T}\tilde g$; hence the constraint is first-order nonincrease on the sampled memories. Curvature and unsampled inputs can still increase actual historical risk. With $K-1$ constraints and $N$ parameters, storing all task gradients costs $O(KN)$ values before solving the quadratic projection.

[PAPER-REPORTED] Deep Generative Replay trains a generator and solver using current inputs mixed with generated historical inputs labeled by the previous solver. Both generator and solver are updated, so future replay depends on previous generative fidelity. [R24.7], §3.1, Eq. 1. [MATHEMATICALLY-DERIVED] For bounded loss $0\leq\ell\leq M$, replacing historical distribution $q$ by generator distribution $\tilde q$ introduces risk error at most $M\operatorname{TV}(q,\tilde q)$ under the convention $\operatorname{TV}=\sup_A|q(A)-\tilde q(A)|$. Repeated replacement has no guarantee of small accumulated error without controlling each generator's approximation. Synthetic replay also requires permission for its data-derived generator.

#### Quadratic anchors and their Bayesian boundary

[PAPER-REPORTED] EWC replaces an old posterior with a local Gaussian approximation and penalizes departure from important parameters using a diagonal Fisher estimate. Its two-task construction motivates parameter-specific rather than uniform anchoring. [R24.4], §2, Eqs. 1–3.

[MATHEMATICALLY-DERIVED] For differentiable likelihoods satisfying the regularity conditions that permit differentiation under the integral, the **model Fisher** is

$$
F(\theta)=\mathbb E_{x\sim q(x),\ y\sim p_\theta(\cdot\mid x)}
\left[\nabla\log p_\theta(y\mid x)\nabla\log p_\theta(y\mid x)^{\mathsf T}\right].
$$

*(Eq. 24.13)*

The corresponding expected negative log-likelihood Hessian agrees under the model expectation. Squared gradients using observed labels define an empirical Fisher and need not equal the actual data-loss Hessian. A Laplace approximation additionally needs a sufficiently regular local posterior mode and an adequate local quadratic approximation. Neural-network symmetries, flat directions, misspecification, and substantial movement violate a naive positive-definite Gaussian account; diagonalization discards correlations even when the local quadratic exists.

[PAPER-REPORTED] Huszár derives a recursive Laplace treatment with one accumulated precision anchored at the most recent posterior mode, and identifies double-counting when successive posterior modes are all retained as independent penalties. [R24.5], Eqs. 8–11. [MATHEMATICALLY-DERIVED] An explanatory recursion is

$$
\theta_k=\arg\min_\theta\left\{\mathcal L_k(\theta)
+\frac12(\theta-\theta_{k-1})^{\mathsf T}\operatorname{diag}(\Omega_{k-1})(\theta-\theta_{k-1})\right\},
\quad \Omega_k=\Omega_{k-1}+\kappa_k\operatorname{diag}(F_k).
$$

*(Eq. 24.14)*

Here $\kappa_k$ includes the declared dataset-size/temperature convention. The precision summarizes previous likelihood curvature once; re-centering at the new mode follows the recursive approximation. Arbitrarily summing penalties at all historical posterior modes defines a different objective. A decayed precision introduces intentional forgetting of old constraints and loses the literal cumulative-posterior interpretation unless a corresponding probabilistic model is supplied. Two additional length-$N$ vectors cost $2Nb$ bytes at storage dtype $b$, irrespective of phase count, excluding the current model and optimizer.

#### Function anchors and self-distillation

[PAPER-REPORTED] Learning without Forgetting records old-task outputs on **new-task inputs**, then jointly optimizes new labels and softened old outputs. Its input support therefore differs from replaying old examples. [R24.6], §III, Fig. 3 and distillation loss. [MATHEMATICALLY-DERIVED] Matching two functions on $\operatorname{supp}(q_A)$ places no constraint outside that support. If current inputs omit the old decision boundary, zero anchor divergence can coexist with arbitrarily large old-domain disagreement. A rehearsal-free anchor is a support-limited surrogate, not recovered old data.

[PAPER-REPORTED] SDFT constructs a demonstration-conditioned teacher, samples student trajectories, and trains toward that teacher; its default teacher is an exponential moving average. The inspected 2026 paper contrasts this with demonstration-only SFT. [R24.9], §3 and Appendix A.1. [MATHEMATICALLY-DERIVED] At a fixed sampled prefix $s$, define a local reverse KL

$$
j_s(\theta)=\sum_{v\in V}p_\theta(v\mid s)
\log\frac{p_\theta(v\mid s)}{p_{\bar\theta}(v\mid s,c)},\qquad
\nabla j_s=\sum_v p_\theta(v\mid s)\log\frac{p_\theta(v\mid s)}{p_{\bar\theta}(v\mid s,c)}\nabla\log p_\theta(v\mid s).
$$

*(Eq. 24.15)*

The omitted $+1$ term vanishes because $\sum_v\nabla p_\theta(v\mid s)=0$. This identity is exact for a fixed prefix and teacher. Averaging it over prefixes sampled from the current student while stopping gradients through those prefix samples defines a local on-policy surrogate; it is not automatically the full gradient of a sequence-level objective whose state distribution also depends on $\theta$. Reproduce the source's estimator and stop-gradient contract rather than silently exchanging sequence KL, local KL, and response imitation. Full-vocabulary KL consumes $O(BTV)$ logit values if materialized; streaming reductions can reduce peak auxiliary storage without eliminating the arithmetic.

#### Parameter isolation and modular adapters

[PAPER-REPORTED] Progressive networks freeze earlier columns and add a new column with lateral connections to prior features. [R24.8], §2, Eq. 1. [MATHEMATICALLY-DERIVED] If all parameters and persistent buffers used by an old path remain unchanged and inference selects that same path, its deterministic function is unchanged. The proof is equality of every operator input and parameter along the path, not a statistical retention theorem. Shared normalization updates, mutable routing, or merging new weights into the base invalidate the premise.

[MATHEMATICALLY-DERIVED] For frozen base $\theta_0$ and separate adapters $\phi_j$, training $\phi_k$ cannot modify $f_{\theta_0,\phi_j}$ for $j\ne k$ if execution is isolated. It also cannot provide backward transfer to those frozen paths. A router without oracle task identity must be evaluated as part of the predictor. With $n_\phi$ parameters per adapter, storage grows as $K n_\phi b$; full new columns grow roughly as $KNb$ plus lateral parameters. Adapter size is not the total resident model memory.

```figure
id: fig-24.9
kind: diagram
title: Four locations of retained information
caption: >-
  Replay retains samples, quadratic anchoring retains local parameter
  geometry, distillation retains function values on selected inputs, and
  isolation retains an execution path. Each protects a different object.
placement: wide
evidence: DERIVED
source: DERIVED:eq-24.12
alt: >-
  Historical information branches into authorized records, precision and
  anchor parameters, teacher outputs on chosen inputs, and frozen modules.
  These produce mixture gradients, quadratic penalties, output divergence,
  and path isolation respectively before the next update is evaluated.
spec:
  direction: TB
  nodes:
    - {id: past, kind: state, label: Historical information}
    - {id: records, kind: dataset, label: Authorized examples}
    - {id: geometry, kind: tensor, label: Precision and parameter anchor}
    - {id: teacher, kind: model, label: Teacher on anchor inputs}
    - {id: frozen, kind: memory, label: Frozen modules and routing}
    - {id: replay, kind: objective, label: Mixture loss}
    - {id: quad, kind: objective, label: Local quadratic penalty}
    - {id: kl, kind: objective, label: Support-limited output match}
    - {id: path, kind: boundary, label: Unchanged old execution path}
    - {id: eval, kind: metric, label: Acquisition and retention under equal budgets}
  edges:
    - {from: past, to: records}
    - {from: past, to: geometry}
    - {from: past, to: teacher}
    - {from: past, to: frozen}
    - {from: records, to: replay}
    - {from: geometry, to: quad}
    - {from: teacher, to: kl}
    - {from: frozen, to: path}
    - {from: replay, to: eval}
    - {from: quad, to: eval}
    - {from: kl, to: eval}
    - {from: path, to: eval}
```

## Algorithm

**Algorithm 24.3 — Bounded retention update.** [DERIVED] This comparison procedure instantiates Eq. 24.12; it is not a claim that combining every term is optimal. Inputs are the previous parameters, optimizer state $o^-$, precision, buffer, teacher, current data, permission predicate, and budget. $\mathsf B$ samples permitted current/replay/anchor inputs, $\mathsf O$ returns candidate parameters and persistent optimizer state, and $\mathsf Q$ estimates new precision only when that mechanism is enabled. $U_k$ is a finite accepted-update budget; $\mathsf G$ validates numerical state and declared validation gates. Output is the complete accepted state with its counted cost.

$$
\begin{aligned}
1.\quad&\theta^{(0)}\gets\theta^-,\quad o^{(0)}\gets o^-,\quad\mathcal S^{(0)}\gets(\theta^-,o^-,\Omega^-,\mathcal M^-,\bar\theta^-).\\
2.\quad&(X_u,X_u^{\mathrm{rep}},X_u^A)\gets\mathsf B(\mathcal D_k,\mathcal S^{(u)};\Gamma_k).\\
3.\quad&g_u\gets\nabla_\theta\widehat{\mathcal J}_k(\theta^{(u)};X_u,X_u^{\mathrm{rep}},X_u^A).\\
4.\quad&(\widetilde\theta,\widetilde o)\gets\mathsf O(\theta^{(u)},o^{(u)},g_u),\quad
 \neg\mathsf G(\widetilde\theta,\widetilde o)\Longrightarrow\operatorname{return}(\mathrm{rejected},\mathcal S^{(0)}).\\
5.\quad&(\theta^{(u+1)},o^{(u+1)})\gets(\widetilde\theta,\widetilde o),\quad
\mathcal S^{(u+1)}\gets(\widetilde\theta,\widetilde o,\Omega^-,\mathcal M^-,\bar\theta^-),\quad 0\leq u<U_k.\\
6.\quad&\Omega_k\gets\Omega^-+\mathsf Q(\theta^{(U_k)},\mathcal D_k),\quad
 \mathcal M_k\gets\operatorname{retain}_{\Gamma_k,m}(\mathcal M^-\cup\mathcal D_k).\\
7.\quad&\operatorname{return}(\theta^{(U_k)},o^{(U_k)},\Omega_k,\mathcal M_k,\bar\theta^-,\operatorname{cost}_{0:U_k}).
\end{aligned}
$$

*(Eq. 24.16)*

[DERIVED] Lines 2–5 repeat; disabled terms have zero weight and create no corresponding state. Consolidation occurs after accepted updates, never from rejected candidates. An isolation variant restricts $\mathsf O$ to the new module and asserts equality of old-path parameters and buffers. A self-distillation variant substitutes Eq. 24.15 and a declared teacher-update rule. Each variant requires its own retained-state and execution contract.

## Implementation

```figure
id: fig-24.10
kind: calculator
title: Two-coordinate quadratic anchor
caption: >-
  Execute Eq. 24.12's quadratic term with all other terms omitted. Illustrative
  coordinates show that equal displacement receives different penalties when
  diagonal precision differs; this is not a measured posterior estimate.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-24.12
alt: >-
  Precision values one and four, equal displacements 0.1, and strength one
  give penalty 0.025. Setting both precisions to one reduces it to 0.01.
states:
  - { anchor: formulation, label: Weighted coordinates, variables: { p2: 4 }, note: Precision weights coordinate displacement. }
  - { anchor: mechanism, label: Uniform anchor, variables: { p2: 1 }, note: Uniform precision defines a different geometry. }
spec:
  tex: J_q=\frac{\kappa}{2}(\Omega_1 d_1^2+\Omega_2 d_2^2)
  equation: "24.12"
  inputs:
    - { symbol: kappa, label: anchor strength, default: 1, min: 0, max: 10, step: 0.1 }
    - { symbol: p1, label: first precision, default: 1, min: 0, max: 10, step: 0.1 }
    - { symbol: p2, label: second precision, default: 4, min: 0, max: 10, step: 0.1 }
    - { symbol: d1, label: first displacement, default: 0.1, min: -1, max: 1, step: 0.01 }
    - { symbol: d2, label: second displacement, default: 0.1, min: -1, max: 1, step: 0.01 }
  outputs:
    - { symbol: penalty, label: quadratic penalty, formula: kappa*(p1*d1^2+p2*d2^2)/2, emphasis: true }
```

[OFFICIAL-DOCUMENTATION] **Hugging Face PEFT**, Model definition / adaptation, documents adapter loading and activation separately: loading does not automatically activate an adapter. The inspected `PeftModel.set_adapter` interface also exposes `inference_mode`; activation can otherwise enable gradients. [R24.10], `load_adapter` and `set_adapter`, unpinned documentation accessed 2026-10-08. This is an interface disclosure, not a verified execution of a continual-learning pipeline.

[MATHEMATICALLY-DERIVED] Replay adds forward/backward work proportional to replay tokens; anchoring adds an $O(N)$ elementwise pass and precision-estimation backward work; output distillation adds teacher forwards and logit matching; generators add generation and generator-training work; isolated columns add model storage and possibly old-feature forwards. In distributed training, gradient synchronization applies to trainable tensors, while teachers and precision vectors must follow declared sharding ownership. Optimizer and checkpoint state can dominate small adapter payloads. Achieved latency, throughput, communication overlap, energy, and price require measurement; no universal multiplier is implied by these arithmetic counts.

## Experimental design

### Reported experiments

[PAPER-REPORTED] EWC reports permuted-MNIST and sequential Atari studies, including perturbation tests exposing limitations of its uncertainty approximation. [R24.4], §§2.1–2.2 and appendices. Huszár's correction is an analytical derivation, not an independent benchmark replication. [R24.5].

[PAPER-REPORTED] LwF compares old/new vision-task pairs using AlexNet and VGG; its results include degradation for dissimilar domains. Deep Generative Replay evaluates image-classification task/domain/class sequences. Progressive networks test transfer on Pong variants and other reinforcement-learning domains. [R24.6], §IV, Table 4; [R24.7], §4; [R24.8], §5. Their historical architectures and datasets do not establish language-model scaling behavior.

[PAPER-REPORTED] SDFT evaluates science, tool-use, medical, and new-knowledge tasks, including sequential learning. Its appendix reports full tuning with Hugging Face TRL on a single NVIDIA H200, validation-based selection, three seeds, and confidence intervals. [R24.9], §§4.1–4.6, Appendices B.1–B.2. Precision/runtime revision and an independently reproduced cost comparison remain UNVERIFIED here; no wall-clock speedup is quoted.

## Observations

**What the paper claims.** [PAPER-REPORTED] The cited mechanisms improve their own reported retention/acquisition tradeoffs; SDFT reports a favorable tradeoff against SFT in its evaluated settings, while its EMA ablation addresses teacher stability. [R24.9], §§4.3, 4.6.

**What the evidence shows.** [DERIVED] Different permissions, support distributions, architectures, and budgets prevent a common ranking across these papers. No source establishes that one family dominates every sequential regime.

**What we infer.** [MATHEMATICALLY-DERIVED] Protection is restricted to the retained object: sampled loss, local geometry, selected function values, or an unchanged path. Increasing protection can reduce plasticity or increase persistent resources.

**What remains unknown.** [UNVERIFIED] Long-horizon scaling of these mechanisms under a common modern language-model protocol, matched compute, and explicit artifact permissions has not been independently tested in this manuscript.

## Failure modes

> **Failure mode — False curvature certainty.** [MATHEMATICALLY-DERIVED] *Symptom:* large old-task degradation despite a small diagonal penalty. *Cause:* omitted cross-parameter curvature, wrong Fisher estimator, or departure from the local approximation. *Detection:* compare actual old loss with predicted quadratic change on authorized probes. *Mitigation:* revise the surrogate or use another permitted retention object.

[DERIVED] A replay buffer can omit rare tasks; a generator can propagate its own errors; a teacher can preserve an incorrect answer; an adapter router can select the wrong path. Frozen weights with changing shared buffers do not satisfy isolation. These failures require distinct diagnostics rather than a single “forgetting” alert.

## Siblings

```figure
id: fig-24.11
kind: stat-panel
title: Retained object and guarantee boundary
caption: >-
  The retained object identifies what a mechanism constrains. None of these
  finite objects automatically establishes global function preservation.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-24.12
alt: >-
  Replay protects sampled examples; precision anchoring protects a local
  parameter geometry; distillation protects chosen input support; isolation
  protects a frozen execution path only when routing and buffers also stay fixed.
spec:
  header: RETENTION BOUNDARIES
  rows:
    - { key: replay, value: sampled historical support }
    - { key: quadratic anchor, value: local diagonal geometry }
    - { key: distillation, value: chosen input and teacher support }
    - { key: isolation, value: unchanged complete old path }
    - { key: router, value: part of evaluated predictor }
```

[DERIVED] Replay changes the training distribution; regularization changes the objective geometry; distillation changes the output constraint; isolation changes the trainable execution graph. [Model editing](24-4-model-editing.md) narrows the intervention target. [External memory](24-6-parametric-versus-external-memory.md) moves selected information to a separately versioned store rather than preserving it through parameter updates.

## Extensions

### Improvements

[DERIVED] The documented lineage moves from local parameter anchoring to function and execution constraints, with SDFT changing the trajectory distribution and teacher conditioning. These are alternative branches, not a historical sequence proving automatic superiority. Combining mechanisms creates new normalization, permission, and cost interactions; it requires a controlled ablation rather than inheriting each component's reported benefit.

## Limitations

[MATHEMATICALLY-DERIVED] Full preservation and unconstrained acquisition need not be jointly feasible. A local posterior approximation is not a global model of neural-network uncertainty. A function anchor with incomplete support is not a global preservation guarantee. Isolated paths guarantee only unchanged execution under unchanged routing and buffers, while their persistent capacity grows.

## Reproducibility

[DERIVED] Record buffer identities and sampling weights, generator and teacher revisions, Fisher label-sampling convention, per-example rather than batch-mean gradient squares, precision normalization, anchor center, consolidation order, trainable masks, routing, and complete memory accounting. Source revisions and inspected locators are in [references.md](references.md); proposed comparisons remain unexecuted in [verification.md](verification.md).

## References

[R24.3](references.md#r243), [R24.4](references.md#r244), [R24.5](references.md#r245), [R24.6](references.md#r246), [R24.7](references.md#r247), [R24.8](references.md#r248), [R24.9](references.md#r249), [R24.10](references.md#r2410).
