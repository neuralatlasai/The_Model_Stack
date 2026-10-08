---
id: ms.section.19.3
entity_type: section
title: Parameter updates
short_title: Parameter updates
volume: 1
part: 4
chapter: 19
section: 19.3
slug: 19-3-parameter-updates
parent: ms.chapter.19
prev_sibling: ms.section.19.2
next_sibling: ms.section.19.4
children: []
prerequisites: [ms.chapter.3, ms.chapter.5, ms.section.19.2]
downstream: [ms.chapter.20, ms.chapter.29, ms.chapter.30]
related: [ms.chapter.13]
relations: []
axes: {lifecycle: [pretraining], mechanism: [training_loop, optimization], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.pytorch, impl.torchtitan]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 19.3 Parameter updates

## Scope

[DERIVED] The parameter-update contract orders initialization, forward evaluation, differentiation, normalization, numerical checks, clipping, optimizer mutation, and scheduler advancement. The optimizer's mathematical families are owned by Chapter 20; this section explains how an already selected optimizer enters a correct training loop. Success means that one accepted transition agrees with the declared objective and that rejected transitions cannot silently advance moments or schedule state. No optimizer is designated universally optimal.

## Why this exists

[MATHEMATICALLY-DERIVED] An update is a composition of stateful operators. Reordering them changes that composition. Clipping before unscaling changes the effective clipping threshold; clipping before accumulation changes the direction; moving the scheduler before the update can change which learning rate is used. A plausible loss trajectory does not establish that these state transitions match the intended recipe.

[MATHEMATICALLY-DERIVED] Initial parameter values are only part of initialization. A reference run also needs the architecture configuration, tied-parameter identities, trainability mask, optimizer parameter groups, precision policy, random state, and update counter. Duplicating a tied parameter in the optimizer groups can apply a transition twice; omitting a trainable tensor leaves it unchanged despite a valid backward pass. The initialization invariant concerns parameter identities, not just matching tensor shapes.

## Intuition

[MATHEMATICALLY-DERIVED] Reverse-mode differentiation constructs a gradient of a particular forward computation. The optimizer then transforms this gradient using persistent state. A numerical failure can therefore originate in the forward values, backward values, accumulated gradient, adaptive direction, or final parameters. Checking only the scalar objective observes one of these boundaries.

## Formulation

[MATHEMATICALLY-DERIVED] Let $\mathcal P$ be the set of unique trainable parameter identities, $\theta_k$ their values after $k$ accepted updates, $o_k$ optimizer state, and $h_k$ scheduler state. For a positive-count batch, §19.2 returns the normalized unscaled gradient $g_k$. A declared scheduler reads a clock $c_k$ and returns $\eta_k=\mathsf S(h_k,c_k)$. The accepted transition has the form

$$
\widehat g_k=\frac{g_k}{\max(1,\lVert g_k\rVert_2/c_{\mathrm{clip}})},\qquad
(\theta_{k+1},o_{k+1})=\mathsf U(\theta_k,o_k,\widehat g_k;\eta_k),
$$
$$
h_{k+1}=\mathsf H(h_k,c_{k+1}),\qquad
c_{k+1}=c_k+\delta_k.
$$
*(Eq. 19.8)*

[MATHEMATICALLY-DERIVED] Here $c_{\mathrm{clip}}>0$ is a threshold in the same gradient norm convention as $g_k$, and $\delta_k$ is the increment of the declared clock. An update clock uses $\delta_k=1$ on acceptance; a valid-target clock can use $\delta_k=Q_k$. Raw positions read, attempted targets, and accepted targets require distinct counters when batches can be rejected. All group-specific learning rates and decay exclusions belong to the transition configuration.

## Mechanism

### Methodology: initialize once, mutate at a declared boundary

[DERIVED] Initialization first establishes the exact parameter graph and ties, then assigns values under the architecture's declared initializer. It next constructs optimizer groups from unique parameter identities and initializes optimizer/scheduler state. The check is set equality between intended trainable identities and the optimizer's ownership, with disjoint ownership across groups unless the algorithm explicitly requires otherwise. Initializer distributions and depth/width scaling belong to the architecture recipe; this chapter does not substitute a universal variance rule for them.

[MATHEMATICALLY-DERIVED] During one window, forward/backward reads the same $\theta_k$ for every microbatch. A valid cross-entropy implementation evaluates a stable log-sum-exp rather than exponentiating unrestricted logits directly. For logits $z\in\mathbb R^V$ and target $y$, write $u=\max_j z_j$ and

$$
\ell(z,y)=-z_y+u+\log\sum_{j=1}^{V}\exp(z_j-u).
$$
*(Eq. 19.9)*

[MATHEMATICALLY-DERIVED] For finite logits, every exponential argument is nonpositive and the denominator is at least one, avoiding the overflow caused by a large common positive offset. This algebra does not repair NaN inputs or a row containing only negative infinities. The canonical numerical analysis and tolerances belong to Chapter 03. Target masking must avoid invalid indexing before loss selection; multiplying a computed NaN by zero does not remove it.

[OFFICIAL-DOCUMENTATION] PyTorch's norm-clipping API treats the parameter gradients as one concatenated vector, modifies them in place, and can raise on a nonfinite total norm. Its default behavior does not imply a complete rejection transaction for model and optimizer state. [R19.25], function contract and nonfinite option.

[MATHEMATICALLY-DERIVED] A useful post-update diagnostic for parameter group $j$ is

$$
\rho_{kj}=\frac{\lVert\theta_{k+1,j}-\theta_{k,j}\rVert_2}
 {\max(\lVert\theta_{k,j}\rVert_2,\epsilon_{\theta,j})},
\qquad \epsilon_{\theta,j}>0.
$$
*(Eq. 19.10)*

[MATHEMATICALLY-DERIVED] The floor has parameter-norm units and is declared separately from an optimizer epsilon. $\rho_{kj}$ measures the actual relative change, including adaptive preconditioning and decay. A learning rate alone does not determine this change. Preserving a full pre-update copy costs parameter-sized storage; implementations can retain sampled diagnostics or derive exact update norms from the update kernel, but these have different observability contracts.

## Algorithm

**Algorithm 19.3 — Ordered accepted update.** [DERIVED] Let $\mathsf B$ be the batch-gradient procedure in Eq. 19.7 through its pre-clipping finite check, $\mathsf U$ the configured optimizer, and $\mathsf C$ a predicate checking candidate parameter and state validity. The input is $(\theta_k,o_k,h_k,c_k,\mathcal W_k)$. Empty and nonfinite windows return without an accepted update. The schedule below uses an accepted-update clock.

$$
\begin{aligned}
1.\quad &(g_k,\mathcal L_k,Q_k,v_k)\gets\mathsf B(\theta_k,\mathcal W_k).\\
2.\quad &v_k\ne\mathrm{valid}\ \Longrightarrow\
 \operatorname{return}(\theta_k,o_k,h_k,c_k,v_k).\\
3.\quad &\eta_k\gets\mathsf S(h_k,c_k),\quad
 \widehat g_k\gets g_k/\max(1,\lVert g_k\rVert_2/c_{\mathrm{clip}}).\\
4.\quad &(\theta^+,o^+)\gets\mathsf U(\theta_k,o_k,\widehat g_k;\eta_k).\\
5.\quad &\neg\mathsf C(\theta^+,o^+)\ \Longrightarrow\
 \operatorname{return}(\theta_k,o_k,h_k,c_k,\mathrm{rejected}).\\
6.\quad &c^+\gets c_k+1,\quad h^+\gets\mathsf H(h_k,c^+).\\
7.\quad &\operatorname{return}(\theta^+,o^+,h^+,c^+,\mathrm{accepted}).
\end{aligned}
$$
*(Eq. 19.11)*

[MATHEMATICALLY-DERIVED] Every rejection implication terminates immediately. The invariant is that the accepted-update counter, optimizer state, and scheduler state refer to the same committed transition. This pure candidate construction is a specification: an in-place optimizer must restore the old state or terminate from a known checkpoint if its candidate fails. Merely returning a rejection status after mutation does not satisfy the invariant.

```figure
id: fig-19.5
kind: calculator
title: Gradient clipping after normalization
caption: >-
  The norm threshold applies to the normalized, unscaled gradient.
  These analytical inputs show the shared multiplier and resulting norm;
  they are not a stability threshold recommended for a named model.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-19.8
alt: >-
  For incoming gradient norm 4 and threshold 1, all coordinates are
  multiplied by 0.25 and the clipped norm is 1. A gradient below the
  threshold is unchanged.
spec:
  tex: g'=g/\max(1,\lVert g\rVert_2/c)
  equation: "19.8"
  inputs:
    - {symbol: norm, label: unscaled gradient norm, default: 4, min: 0, max: 100}
    - {symbol: threshold, label: clipping threshold, default: 1, min: 0.001, max: 100}
  outputs:
    - {symbol: factor, label: coordinate multiplier, formula: "1/max(1,norm/threshold)"}
    - {symbol: clipped, label: clipped gradient norm, formula: "norm/max(1,norm/threshold)", emphasis: true}
```

## Implementation

[OFFICIAL-DOCUMENTATION] **PyTorch**, the Model / autograd framework layer, documents AdamW as decoupled shrinkage followed by adaptive moment updates and bias-corrected parameter mutation. Its optimizer state and parameter-group configuration are inputs to that mutation. The reference loop calls the selected transition once after accumulation; AdamW's mechanism and alternatives are developed in §20.1. [R19.24], documented algorithm and parameter groups.

[MATHEMATICALLY-DERIVED] A full-coordinate Adam-family transition maintains two parameter-shaped moment arrays; a recipe with a separate master-weight array adds another. Its storage is $N(b_{\mathrm{param}}+b_g+b_1+b_2+b_{\mathrm{master}})$ bytes before activations and workspace, with the master term zero when no separate copy exists. The update requires $O(N)$ elementwise work and traffic; foreach or fused execution changes temporary storage and dispatch, not the requirement to identify the state dtypes. Single-device update communication is zero. Distributed ownership and norm reduction are Part V obligations.

[NOT-DISCLOSED] The unexecuted reference has no measured step latency, energy, or monetary cost. Kernel-specific launch counts, temporary bytes, and numerical deviations are UNVERIFIED until an exact installed path is inspected. No floating-point format is assigned to optimizer state from the name AdamW alone.

## Experimental design

### Reported experiments

[DERIVED] The inspected optimizer and clipping API pages define behavior but do not supply a controlled training experiment comparing all update orderings. Accordingly, no benchmark gain is attributed to Eq. 19.11. The relevant test is an exact one-update comparison under a fixed objective and state: forward loss, unscaled gradient, clipping factor, candidate parameters, persistent moments, and next learning rate must each be checked. The book's proposed protocol is separate from a reported result.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The PyTorch references specify a concrete AdamW transition and a concatenated-gradient norm contract. [R19.24]; [R19.25].

**What the evidence shows.** [DERIVED] These surfaces support interface semantics, not a demonstration that every fused, compiled, or sharded implementation matches the mathematical reference within a selected tolerance.

**What we infer.** [MATHEMATICALLY-DERIVED] Update ordering is observable in parameters and persistent state even when a scalar loss is identical before the update.

**What remains unknown.** [UNVERIFIED] The reader's exact numerical tolerance, kernel path, initializer compatibility, and post-rejection restoration behavior require a versioned execution check.

## Failure modes

[MATHEMATICALLY-DERIVED] Duplicate parameter ownership can create multiple mutations; stale gradients combine distinct windows; an advancing scheduler on a skipped update changes future step sizes; a nonfinite optimizer moment can corrupt a later update despite finite current gradients. Observable checks are identity-set equality, zeroed-window gradient state, learning-rate traces indexed by accepted updates, and finite checks on persistent moments. Recovery must restore the affected state rather than conceal the failing scalar.

## Siblings

[DERIVED] Gradient clipping constrains the supplied gradient norm; update clipping constrains an optimizer-transformed direction. Coupled regularization modifies the differentiated objective; decoupled decay modifies the parameter transition. Mixed-precision loss scaling changes numerical representation; batch normalization changes the statistical denominator. Chapter 03 and §20.1 own these mechanisms; the loop must record which operator appears at each boundary.

## Extensions

[DERIVED] Fused optimizers, graph capture, and sharded updates are execution transformations subject to the same accepted-state contract. Their usefulness requires a disclosed implementation plus matched numerical and resource checks. This chapter asserts no source-reported speedup for an unspecified transformation. An optimized path may eliminate an intermediate allocation while still being required to preserve the declared update and its rejection policy.

## Limitations

[MATHEMATICALLY-DERIVED] Finite values and correct ordering do not guarantee descent for an arbitrary stochastic objective or adaptive optimizer. Even a descent direction can increase a loss at excessive step size. The acceptance predicate here establishes numerical validity and state consistency; optimization effectiveness requires the matched experiments in Chapter 20.

## Reproducibility

[DERIVED] Retain initializer identity, parameter/tie map, group membership and exclusions, all state dtypes, epsilon placement, exact schedule law and clock, clipping norm, loss-scale policy, and before/after state checks. Record missing gradients distinctly from explicit zeros; their optimizer handling is implementation-specific. A reproduced scalar loss is weaker evidence than a reproduced accepted transition.

## References

[R19.20](references.md#r1920), [R19.22](references.md#r1922), [R19.24](references.md#r1924), [R19.25](references.md#r1925).
