---
id: ms.section.24.4
entity_type: section
title: Model editing
short_title: Local interventions
volume: 1
part: 4
chapter: 24
section: 24.4
slug: 24-4-model-editing
parent: ms.chapter.24
prev_sibling: ms.section.24.3
next_sibling: ms.section.24.5
children: []
prerequisites: [ms.chapter.5, ms.chapter.6, ms.chapter.23, ms.section.24.2, ms.section.24.3]
downstream: [ms.section.24.5, ms.section.24.6]
related: [ms.chapter.50]
relations: []
axes: {lifecycle: [adaptation, evaluation, assurance], mechanism: [model_editing, knowledge_update, null_space_projection], feedback_setting: [], modality: [text]}
papers: []
implementations: []
benchmarks: [CounterFact, zsRE, MQuAKE]
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# 24.4 — Model editing

## Scope

[DERIVED] Model editing applies a targeted intervention to change selected predictions while limiting collateral effects. Success requires efficacy on the requested change, generalization across equivalent queries, locality outside the intended change, composition with other changes, and persistence through later interventions. Editing a behavior is not a proof that a training record's influence was deleted; that stronger counterfactual is owned by [§24.5](24-5-unlearning.md).

## Why this exists

[PAPER-REPORTED] ROME uses activation interventions to identify computations mediating factual recall, then writes a rank-one change into an MLP projection using a selected key and optimized target value. [R24.11], §§2–3.1. MEMIT extends the associative-memory approach to batches of edits distributed across multiple layers. [R24.12], §§4.2–4.3.

[DERIVED] The bottleneck is interference, not merely update duration. A factual edit can succeed on its construction prompt while failing on aliases or related questions. Repeated edits can change the representation on which later edits rely. The scientific object is therefore an intervention plus its declared neighborhood of desired and undesired effects, rather than an isolated successful completion.

## Intuition

[MATHEMATICALLY-DERIVED] In a linear map $A\in\mathbb R^{d_o\times d_i}$, changing an association $Ak=v$ requires an update $\Delta$ with $\Delta k=v-Ak$. Every other input key $k'$ changes by $\Delta k'$. A small matrix rank does not imply a small affected input set: a rank-one update acts on every key with a nonzero projection onto its input direction. “Local parameter edit” and “local functional effect” are different properties.

[MATHEMATICALLY-DERIVED] A transformer compounds this distinction because keys are activations computed by other layers. Even perfect preservation of a fixed set of vectors at one edited projection does not prove preservation of the end-to-end function on every query. Future edits can change the upstream keys; subsequent layers can amplify a small local perturbation. The fixed-vector algebra is useful precisely when its boundary is retained.

## Formulation

| Symbol | Meaning | Shape or condition |
|---|---|---|
| $e=(s,r,o^\star)$ | Requested subject/relation/new object | Typed intervention record |
| $A$ | Edited linear projection | $[d_o,d_i]$ |
| $K_0$ | Sampled keys to preserve | $[d_i,m_0]$ |
| $K_1,V_1$ | New keys and desired values | $[d_i,m_1]$, $[d_o,m_1]$ |
| $K_p$ | Keys from previously accepted edits | $[d_i,m_p]$ |
| $U_0$ | Orthonormal basis for a chosen null/near-null subspace | $[d_i,r_0]$ |
| $P_0=U_0U_0^{\mathsf T}$ | Orthogonal projector | $[d_i,d_i]$ |
| $\zeta$ | Positive ridge coefficient | Scalar $>0$ |
| $\mathcal Q_e,\mathcal Q_{\mathrm{loc}}$ | Edit and collateral query distributions | Explicit finite suites or distributions |

> **Definition — Editing locality.** [DERIVED] Bounded functional change on a declared non-target query distribution and observation interface.

[DERIVED] Define efficacy as the score on $\mathcal Q_e$, and functional locality by a declared output-distance measure:

$$
\mathcal L_{\mathrm{loc}}(\theta',\theta)=
\mathbb E_{x\sim\mathcal Q_{\mathrm{loc}}}
d\big(p_{\theta'}(\cdot\mid x),p_\theta(\cdot\mid x)\big).
$$

*(Eq. 24.17)*

Exact-answer agreement, probability change, and sequence KL measure different properties. A locality suite excludes questions whose correct answer should change as an entailed consequence of the edit; otherwise preserving them rewards inconsistency. Define aliases, temporal scope, conflicting edits, and desired dependency changes before optimization.

## Mechanism

### Methodology

#### Selecting the intervention and target

[PAPER-REPORTED] ROME obtains a subject key from contextualized MLP activations and optimizes a value that promotes the requested object while constraining selected other predictions. Its closed-form write uses an estimated key second moment to reduce disturbance to other associations. [R24.11], §3.1, Eqs. 2–4 and Appendix E.5.

[MATHEMATICALLY-DERIVED] For positive-definite key second moment $G_0$, a constrained quadratic write has solution

$$
\min_\Delta\operatorname{tr}(\Delta G_0\Delta^{\mathsf T})
\quad\mathrm{s.t.}\quad\Delta k=r,
\qquad
\Delta=\frac{r(G_0^{-1}k)^{\mathsf T}}{k^{\mathsf T}G_0^{-1}k},
\quad r=v-Ak.
$$

*(Eq. 24.18)*

The Lagrangian derivative gives $2\Delta G_0=\nu k^{\mathsf T}$; applying the constraint gives $\nu=2r/(k^{\mathsf T}G_0^{-1}k)$. Singular or poorly conditioned $G_0$ requires a declared generalized-inverse or regularization policy. A linear solve is preferable to an explicit matrix inverse. An exact write at $k$ does not establish efficacy on a different activation produced by an alias prompt.

#### Batch and null-space updates

[MATHEMATICALLY-DERIVED] A soft batch-preservation objective is

$$
\min_\Delta\|\Delta K_1-(V_1-AK_1)\|_F^2
+\alpha\|\Delta K_0\|_F^2+\zeta\|\Delta\|_F^2.
$$

*(Eq. 24.19)*

Its stationary equation is $\Delta(K_1K_1^{\mathsf T}+\alpha K_0K_0^{\mathsf T}+\zeta I)=(V_1-AK_1)K_1^{\mathsf T}$. This book-derived ridge form makes the update/preservation tradeoff explicit. Exact new associations may be infeasible alongside exact old associations when their keys overlap and values conflict.

[PAPER-REPORTED] AlphaEdit constrains the update using a projector estimated from the null space of sampled preserved-key second moments, and adds a term limiting changes to earlier edited keys. Its practical projector uses an eigenvalue threshold rather than requiring exact zeros. [R24.13], §§3.2–3.3, Eqs. 8–14 and threshold footnote.

[MATHEMATICALLY-DERIVED] The exact algebraic guarantee is

$$
P_0K_0=0\quad\Longrightarrow\quad
(A+\Delta P_0)K_0=AK_0.
$$

*(Eq. 24.20)*

This preserves the linear map on the fixed columns of $K_0$. It does not establish global language-model preservation. If $K_0$ spans all $d_i$ directions, the exact null space is trivial and a nonzero exactly preserving update is unavailable. Selecting a near-null subspace restores capacity by accepting a bounded local error:

$$
\|\Delta P_0K_0\|_F\leq\|\Delta\|_2\|P_0K_0\|_F.
$$

*(Eq. 24.21)*

The spectral threshold, covariance scale, sample count, and dtype therefore influence the retention/plasticity tradeoff. A fixed numeric threshold has no scale-invariant meaning if the key normalization or second-moment normalization changes.

[MATHEMATICALLY-DERIVED] An equivalent reduced-coordinate explanatory solver sets the actual update $E=BU_0^{\mathsf T}$, $\widehat K_1=U_0^{\mathsf T}K_1$, $\widehat K_p=U_0^{\mathsf T}K_p$, and $R_1=V_1-AK_1$. Then

$$
\begin{aligned}
&\min_B\ \|B\widehat K_1-R_1\|_F^2
+\|B\widehat K_p\|_F^2+\zeta\|B\|_F^2,\\
&B\big(\widehat K_1\widehat K_1^{\mathsf T}
+\widehat K_p\widehat K_p^{\mathsf T}+\zeta I\big)
=R_1\widehat K_1^{\mathsf T},\\
&E=BU_0^{\mathsf T}.
\end{aligned}
$$

*(Eq. 24.22)*

The positive ridge gives an invertible reduced system. This derivation exposes the preserved subspace and implements the quadratic constraint, but it is not a claim that a particular released repository uses this coordinate solver. Earlier edited keys are softly constrained, so their outputs are not automatically unchanged. Across multiple edited layers, recompute the downstream keys affected by preceding writes; treating them as immutable silently changes the method.

#### Composition and persistence

[MATHEMATICALLY-DERIVED] Let $\mathsf E_a$ and $\mathsf E_b$ be edit operators. Their order effect can be measured by a query-distance comparison between $\mathsf E_b(\mathsf E_a(\theta))$ and $\mathsf E_a(\mathsf E_b(\theta))$. Additive fixed-matrix updates commute algebraically, but recomputed keys and target values make actual editors state-dependent, so the operators need not commute. Satisfying two direct facts also does not prove the model composes them in a multi-hop query.

[DERIVED] Persistence has two axes: survival through subsequent edits and survival through later fine-tuning or deployment transformations. For edit $e_i$, retain a column of efficacy, paraphrase, locality, and composition scores at every later checkpoint. Evaluate the final deployed artifact, including adapter merge or quantization if applied. A pre-transformation edit benchmark does not establish post-transformation persistence.

```figure
id: fig-24.12
kind: diagram
title: Matrix preservation and functional scope
caption: >-
  A null-space identity protects sampled fixed keys at one projection.
  End-to-end locality additionally depends on upstream activations, later
  layers, query coverage, and subsequent interventions.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-24.20
alt: >-
  Sampled preserved keys determine a projector. The projected update leaves
  those fixed key outputs unchanged, while new queries and upstream changes
  enter a separate full-model evaluation for locality, composition, and persistence.
spec:
  direction: TB
  nodes:
    - {id: keys, kind: tensor, label: Sampled preserved keys K0}
    - {id: project, kind: process, label: Null or near-null projector}
    - {id: write, kind: process, label: Projected matrix update}
    - {id: fixed, kind: boundary, label: Fixed-key linear preservation}
    - {id: upstream, kind: dependency, label: Upstream keys may change}
    - {id: queries, kind: dataset, label: Aliases and dependency queries}
    - {id: full, kind: model, label: Entire edited language model}
    - {id: evaluate, kind: metric, label: Locality composition persistence}
  edges:
    - {from: keys, to: project}
    - {from: project, to: write}
    - {from: write, to: fixed, kind: emphasis}
    - {from: write, to: full}
    - {from: upstream, to: full, kind: dependency}
    - {from: queries, to: evaluate, kind: dependency}
    - {from: full, to: evaluate}
```

## Algorithm

**Algorithm 24.4 — Transactional local edit.** [DERIVED] $\mathsf K$ extracts keys using a pinned template and layer; $\mathsf V$ optimizes target values under a bounded iteration budget; $\mathsf P$ computes the declared spectral subspace; $\mathsf Q$ applies sealed efficacy/locality/composition tests. Acceptance thresholds are explicit protocol inputs, not paper guarantees. Every write starts from a restorable snapshot.

$$
\begin{aligned}
1.\quad&\theta^-\gets\operatorname{snapshot}(\theta),\quad
 \operatorname{conflict}(e,\mathcal E_{\mathrm{accepted}})\Longrightarrow\operatorname{return}(\mathrm{rejected}).\\
2.\quad&(K_0,K_1,K_p)\gets\mathsf K(\theta^-,\mathcal D_0,e,\mathcal E_{\mathrm{accepted}}),
 \quad V_1\gets\mathsf V(\theta^-,e;U_v).\\
3.\quad&U_0\gets\mathsf P(K_0;\varepsilon_{\mathrm{spec}}),\quad
 r_0=0\Longrightarrow\operatorname{return}(\mathrm{no\ feasible\ subspace}).\\
4.\quad&E\gets\operatorname{solve}_{24.22}(A,K_1,V_1,K_p,U_0;\zeta).\\
5.\quad&\neg\operatorname{finite}(E)\Longrightarrow\operatorname{return}(\mathrm{numerical\ failure},\theta^-).\\
6.\quad&\widetilde\theta\gets\theta^-[A\leftarrow A+E],\quad q\gets\mathsf Q(\widetilde\theta,\theta^-).\\
7.\quad&\theta'\gets\begin{cases}\widetilde\theta,&q\in\mathcal A_{\mathrm{accept}},\\\theta^-,&q\notin\mathcal A_{\mathrm{accept}},\end{cases}
\quad\operatorname{return}(\theta',q,\operatorname{edit\ ledger}).
\end{aligned}
$$

*(Eq. 24.23)*

[DERIVED] The invariant is that rejected edits leave the deployed checkpoint unchanged. The finite value-optimization budget and bounded linear solve make termination explicit. A multilayer editor repeats the extraction/write in its declared order; Eq. 24.23 shows the single-layer subproblem rather than silently claiming the full AlphaEdit implementation.

## Implementation

```figure
id: fig-24.13
kind: calculator
title: Near-null local residual bound
caption: >-
  Eq. 24.21 multiplies the update spectral norm by the projected-key residual.
  Illustrative norms produce a local matrix bound, not a measured residual or
  a global language-model preservation guarantee.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-24.21
alt: >-
  An update norm of two and projected-key residual 0.01 bound the local
  output residual by 0.02. An exact zero key residual gives a zero bound.
states:
  - { anchor: formulation, label: Exact nullspace, variables: { residual: 0 }, note: Exact fixed-key preservation requires zero projected-key residual. }
  - { anchor: mechanism, label: Near-null approximation, variables: { residual: 0.01 }, note: Approximate preservation trades residual error for update capacity. }
  - { anchor: failure-modes, label: Larger local write, variables: { update: 8, residual: 0.01 }, note: Increasing the update norm enlarges the bound. }
spec:
  tex: \|\Delta P_0K_0\|_F\leq\|\Delta\|_2\|P_0K_0\|_F
  equation: "24.21"
  inputs:
    - { symbol: update, label: update spectral norm, default: 2, min: 0, max: 10, step: 0.1 }
    - { symbol: residual, label: projected-key residual, default: 0.01, min: 0, max: 0.1, step: 0.001 }
  outputs:
    - { symbol: bound, label: local residual upper bound, formula: update*residual, emphasis: true }
```

[MATHEMATICALLY-DERIVED] For $m_0$ keys of width $d_i$, a dense second moment costs $O(m_0d_i^2)$ arithmetic and $O(d_i^2)$ storage; dense eigendecomposition costs $O(d_i^3)$. Reduced solves cost $O(r_0^3+d_or_0^2)$ after constructing Gram matrices, and the dense updated projection occupies $d_od_ib$ bytes. Key extraction and value optimization require model forwards and, for optimized values, backwards through the affected computation. These can dominate the local solve. Sequential prior-key storage grows with accepted edits unless sufficient Gram statistics replace explicit keys under the chosen objective.

[DERIVED] The cited research implementations are outside the reference-stack system list; their paper-linked repositories are provenance artifacts, not separately verified frameworks in this manuscript. No code path or commit is claimed as executed. Precision for spectral decomposition and solves must be recorded independently of inference-weight dtype. Distributed extraction requires aggregation of sampled statistics, and consistent deployment requires one accepted edit identity across replicas. Latency, throughput, energy, and monetary cost for this chapter's solver are unmeasured; a rank-one formula is not a measured service-time claim.

## Experimental design

### Reported experiments

[PAPER-REPORTED] ROME evaluates efficacy, generalization, specificity, and generated text on zsRE and CounterFact using GPT-2 XL and GPT-J; MEMIT evaluates larger edit batches and generalization/specificity/fluency. [R24.11], §§3.2–3.7; [R24.12], §5. AlphaEdit evaluates sequential edits on LLaMA3, GPT-J, and GPT-2 XL, including CounterFact/zsRE and general-capability probes. Its appendices specify metrics and implementation settings. [R24.13], §4 and Appendix A. Exact released-environment replay remains UNVERIFIED here.

[PAPER-REPORTED] MQuAKE constructs multi-hop queries whose answers should change after factual edits and evaluates whether direct edit success propagates to those consequences. Its memory-based MeLLo alternative checks generated intermediate answers against stored edits. [R24.14], §§3–5. This protocol tests composition beyond direct recall; it is not a comprehensive truth-maintenance benchmark.

## Observations

**What the paper claims.** [PAPER-REPORTED] AlphaEdit reports improved sequential-edit behavior under its tested preservation constraint; MQuAKE reports that direct fact recall can coexist with poor multi-hop consistency. [R24.13], §4; [R24.14], §4.

**What the evidence shows.** [DERIVED] Reported finite benchmark gains support those datasets and interventions. The null-space proof supports the specified key-matrix constraint, while full-model preservation remains an empirical question outside that algebra.

**What we infer.** [MATHEMATICALLY-DERIVED] Exact preservation capacity vanishes for a full-rank preserved-key space; near-null selection permits nonzero updates by accepting approximation error. An edit that changes dependencies must change some related answers, so locality requires a semantically scoped target set.

**What remains unknown.** [UNVERIFIED] Persistence under arbitrary future fine-tuning, global functional locality, reliable handling of all conflicting edits, and independent replication of the cited benchmark results are not established here.

## Failure modes

> **Failure mode — Matrix guarantee promoted to model guarantee.** [MATHEMATICALLY-DERIVED] *Symptom:* preserved sampled associations coexist with changed generations elsewhere. *Cause:* the proof constrains fixed keys at one map, not the entire nonlinear model. *Detection:* separate linear residual checks from full-query tests. *Mitigation:* state both scopes and retain end-to-end collateral evaluation.

[DERIVED] Nearly singular solves produce large updates; contaminated locality prompts give optimistic preservation; repeated subject edits can overwrite earlier time scopes; target-value optimization can induce generic repetition. Check residuals, update norms, paraphrases, neighborhood subjects, unconstrained generation, and delayed edit columns. An evaluation suite containing inconsistent ground truth invalidates composition conclusions regardless of editor quality.

## Siblings

```figure
id: fig-24.14
kind: stat-panel
title: Edit acceptance dimensions
caption: >-
  A direct target score answers only one acceptance question. Evaluate
  held-out language, collateral behavior, entailed consequences, and later
  checkpoint survival as separate dimensions.
placement: rail
anchor: experimental-design
evidence: DERIVED
source: DERIVED:eq-24.17
alt: >-
  Five acceptance dimensions are direct efficacy, paraphrase generalization,
  neighborhood locality, multi-hop composition, and persistence through later
  edits or deployment changes. None substitutes for another.
spec:
  header: EDIT TRANSACTION GATES
  rows:
    - { key: efficacy, value: direct target request }
    - { key: generalization, value: held-out paraphrases }
    - { key: locality, value: declared non-target queries }
    - { key: composition, value: entailed multi-hop queries }
    - { key: persistence, value: later accepted artifacts }
```

[DERIVED] [Full or adapter adaptation](../ch23-parameter-efficient-adaptation-and-model-composition/README.md) optimizes a broader dataset objective. [External edit memory](24-6-parametric-versus-external-memory.md) changes retrieved context and has distinct provenance and routing costs. [Unlearning](24-5-unlearning.md) compares against an absent-data training counterfactual; replacing one answer with another does not establish it.

## Extensions

### Improvements

[DERIVED] ROME's single association, MEMIT's multilayer batches, and AlphaEdit's preserved-key projection change respectively edit multiplicity, intervention distribution, and feasible update subspace. Their documented lineage motivates controlled comparisons on the same sequence and budget; it does not establish that the newest method retains every global capability. MQuAKE adds a different evaluation axis: entailed consequences rather than only direct prompt generalization.

## Limitations

[MATHEMATICALLY-DERIVED] Exact conflicting associations at the same key are infeasible. Locality on a finite query suite is weaker than functional equality. A causal activation intervention identifies mediation under its corruption/restoration procedure; it does not prove that all storage of a fact is confined to the selected parameter matrix. Editing scope and causal interpretation must remain separately testable.

## Reproducibility

[DERIVED] Preserve base checkpoint, edit order, entity and alias resolution, templates, token positions, layers, key sample provenance, moment normalization, spectral threshold, solve tolerance, value-optimization budget, old/new residuals, acceptance decisions, and deployed artifact identity. No editor was run for this edition; [verification.md](verification.md) specifies a bounded analytical and model-level protocol.

## References

[R24.11](references.md#r2411), [R24.12](references.md#r2412), [R24.13](references.md#r2413), [R24.14](references.md#r2414).
