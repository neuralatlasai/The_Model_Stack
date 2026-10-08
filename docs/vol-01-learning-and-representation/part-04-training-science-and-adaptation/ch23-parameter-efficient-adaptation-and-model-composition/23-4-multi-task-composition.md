---
id: ms.section.23.4
entity_type: section
title: Multi-task composition
volume: 1
part: 4
chapter: 23
section: 23.4
slug: 23-4-multi-task-composition
parent: ms.chapter.23
prev_sibling: ms.section.23.3
next_sibling: ms.section.23.5
children: []
prerequisites: [ms.section.23.2, ms.section.23.3]
downstream: [ms.section.23.5, ms.section.23.6, ms.chapter.24]
related: [ms.chapter.16]
siblings_by_mechanism: []
relations: [{type: supported_by, target: paper.P14}, {type: implemented_by, target: impl.hugging-face-peft}]
axes: {lifecycle: [adaptation, inference], mechanism: [model_composition], feedback_setting: [], modality: [text]}
papers: [P14]
implementations: [impl.hugging-face-peft]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 23.4 Multi-task composition

## Scope

**MATHEMATICALLY-DERIVED.** Selection, parameter composition, and output ensembling are different operators. Selection activates one compatible task artifact for a request. Parameter composition constructs one effective set of weights from several updates. Ensembling combines predictions and retains multiple function evaluations. This section develops task vectors, exact low-rank concatenation, factor-coordinate ambiguity, merge interference, and shared-base requirements. Serving selection is developed in 23.5; sequential forgetting and deletion claims belong to Chapter 24.

## Why this exists

**MATHEMATICALLY-DERIVED.** Independent task adapters preserve separate artifacts but leave the system with a routing decision. Adding their weight corrections removes that decision only if the resulting function satisfies all required task constraints. Individual task success does not imply success after addition, because network outputs depend nonlinearly on all intermediate weights. Nor does averaging two successful checkpoints imply averaging their output probabilities. The operation must be evaluated as a new model, with its own manifest, quality record and rollback target.

**PAPER-REPORTED.** Task arithmetic constructs a difference from a common pretrained checkpoint and applies scaled combinations of those differences. Its original experiments include image classifiers and text models, with held-out validation for scaling. [R23.11] (§2–5) TIES addresses coordinate-level sign conflicts after trimming small update entries. DARE randomly drops and rescales delta entries before composition. [R23.12] (§4); [R23.13] (§3)

## Intuition

**MATHEMATICALLY-DERIVED.** A shared base supplies a common coordinate origin. Let two adapted checkpoints be $\theta_1=\theta_0+\delta_1$ and $\theta_2=\theta_0+\delta_2$. Their updates can be added in those coordinates. If one checkpoint actually starts from $\theta_0+e$, subtracting the claimed base yields $e+\delta_2$. The merge then includes an unintended base change. Equal parameter count and architecture cannot remove this offset. Even independently trained bases that represent similar functions may permute hidden coordinates, making elementwise addition semantically misaligned.

## Formulation

**MATHEMATICALLY-DERIVED.** Let $\delta_k\in\mathbb R^N$ be task vectors relative to exactly the same base, and $a_k$ explicit composition coefficients. Avoid using the global distillation mixing symbol for this unrelated operation:

$$
\theta_m=\theta_0+\sum_{k=1}^{K}a_k\delta_k,
\qquad \delta_k=\theta_k-\theta_0.
$$
*(Eq. 23.15)*

[DERIVED] Task-vector construction after [R23.11].

**MATHEMATICALLY-DERIVED.** For LoRA targets with identical operator shape, scales can be absorbed into one concatenated factor pair:

$$
\begin{aligned}
\Delta W_m&=\sum_{k=1}^{K}a_ks_k\mathsf B_k\mathsf A_k
=\underbrace{[a_1s_1\mathsf B_1\ \cdots\ a_Ks_K\mathsf B_K]}_{\mathsf B_\oplus}
\underbrace{\begin{bmatrix}\mathsf A_1\\\vdots\\\mathsf A_K\end{bmatrix}}_{\mathsf A_\oplus},\\
\operatorname{rank}(\Delta W_m)&\le\min(d_o,d_i,\sum_kr_k).
\end{aligned}
$$
*(Eq. 23.16)*

**MATHEMATICALLY-DERIVED.** This preserves the selected weighted sum exactly in real arithmetic, including negative $a_k$, but increases branch rank to the sum of ranks. Reducing it again to $r_m$ by truncated SVD introduces error. If singular values of $\Delta W_m$ are $\sigma_j$, the optimal Frobenius residual squared is $\sum_{j>r_m}\sigma_j^2$. That is a tensor reconstruction optimum; the error in model quality still depends on activations and downstream sensitivity.

$$
\left\|(\Delta W_m-\Delta W_{m,r})X\right\|_F
\le\left\|\Delta W_m-\Delta W_{m,r}\right\|_2\|X\|_F.
$$
*(Eq. 23.17)*

**MATHEMATICALLY-DERIVED.** The bound concerns one projection's outputs under the specified $X$. It cannot be extended to final logits without bounds on later operators. Sparse trimming or SVD compression can also change the optimizer restart interpretation; an exported merged artifact is not a continuation state for all original adapters.

```figure
id: fig-23.11
kind: calculator
title: Exact concatenation rank budget
caption: Equal-rank illustrative adapters concatenate to a sum-rank branch. The storage comparison excludes the shared base and treats each factor value as two bytes.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.16
alt: Four rank-16 adapters on a 4096-by-4096 projection concatenate to rank at most 64 and contain 524288 factor scalars. At two bytes per scalar the combined factors occupy one MiB; a dense update occupies 32 MiB.
states:
  - {anchor: formulation, label: Exact sum, highlight: [rt], note: Exact concatenation retains the sum of the branch ranks.}
  - {anchor: mechanism, label: Representation choice, highlight: [mf, md], note: Lower-rank recompression requires a new approximation and evaluation gate.}
spec:
  tex: r_\oplus=Kr,\quad n_\oplus=Kr(d_i+d_o)
  equation: "23.16"
  inputs:
    - {symbol: K, label: adapter count, default: 4, min: 1, max: 64, step: 1, format: integer}
    - {symbol: r, label: rank per adapter, default: 16, min: 1, max: 512, scale: log2, format: integer}
    - {symbol: di, label: input width, default: 4096, min: 256, max: 16384, scale: log2, format: integer}
    - {symbol: do, label: output width, default: 4096, min: 256, max: 16384, scale: log2, format: integer}
  outputs:
    - {symbol: rt, label: concatenated rank bound, formula: "min(K*r,di,do)", format: integer}
    - {symbol: mf, label: factor storage, formula: 2*K*r*(di+do), format: bytes, emphasis: true}
    - {symbol: md, label: dense update storage, formula: 2*di*do, format: bytes}
```

## Mechanism

**MATHEMATICALLY-DERIVED.** Averaging factors is generally incorrect. For two equal-scale adapters,

$$
\frac{\mathsf B_1+\mathsf B_2}{2}\frac{\mathsf A_1+\mathsf A_2}{2}
=\frac14(\mathsf B_1\mathsf A_1+\mathsf B_2\mathsf A_2
+\mathsf B_1\mathsf A_2+\mathsf B_2\mathsf A_1).
$$
*(Eq. 23.18)*

**MATHEMATICALLY-DERIVED.** Cross terms appear, whereas the mean correction is $\tfrac12(\mathsf B_1\mathsf A_1+\mathsf B_2\mathsf A_2)$. Factor coordinates are nonunique: for invertible $R\in\mathbb R^{r\times r}$, $(\mathsf BR)(R^{-1}\mathsf A)=\mathsf B\mathsf A$. Two identical updates can thus have very different factors. Coordinatewise factor operations require additional alignment assumptions; operations on realized $\Delta W$ avoid this particular ambiguity.

**MATHEMATICALLY-DERIVED.** Interference can be expressed with a local task loss. For composition $\delta=\sum_ka_k\delta_k$ around $\theta_0$,

$$
\mathcal L_j(\theta_0+\delta)
\approx\mathcal L_j(\theta_0)+g_j^\top\delta
+\frac12\sum_{k,l}a_ka_l\delta_k^\top H_j\delta_l.
$$
*(Eq. 23.19)*

**MATHEMATICALLY-DERIVED.** $g_j$ and $H_j$ are the gradient and Hessian at the shared base. Cross-task linear terms and cross-curvature terms can worsen task $j$ even when its own update helps. Euclidean orthogonality of two task vectors does not imply $\delta_k^\top H_j\delta_l=0$. Sign agreement is therefore a heuristic for one coordinate-level source of conflict, not a complete criterion for functional compatibility. Large updates or nonsmooth boundaries invalidate the second-order approximation.

**PAPER-REPORTED.** TIES keeps large-magnitude task-vector entries, elects a coordinate sign by aggregate signed magnitude, and averages only surviving values that agree with that sign. The final update receives a validation-selected scale. [R23.12] (§4.2, Algorithm 1) The mathematical reconstruction below specifies empty/tie behavior explicitly for this book's proposed artifact rather than implying an undocumented source implementation rule.

**PAPER-REPORTED.** DARE applies independent Bernoulli dropping to delta parameters and rescales survivors by inverse keep probability. Its comparisons include language, math and code models descended from compatible bases; the paper also reports failures when the chosen reference base creates much larger deltas. [R23.13] (§3.1, §4.2–4.6)

$$
\widehat\delta_i=\frac{z_i\delta_i}{1-p_d},\quad
z_i\sim\operatorname{Bernoulli}(1-p_d),\quad
\mathbb E[\widehat\delta_i]=\delta_i,\quad
\operatorname{Var}(\widehat\delta_i)=\frac{p_d}{1-p_d}\delta_i^2.
$$
*(Eq. 23.20)*

[DERIVED] Expectation/variance derived from the DARE construction.

**MATHEMATICALLY-DERIVED.** Unbiased parameter reconstruction does not give unbiased model outputs or loss under a nonlinear network. The variance diverges as $p_d\to1$ for nonzero entries. Choosing $p_d=1$ is invalid, and a single mask realization can fail despite an unbiased expectation. Dropping trained weights themselves is a different operation from dropping their difference from a shared base. Sparse logical updates also do not reduce dense serving traffic unless the runtime uses their sparse representation.

```figure
id: fig-23.12
kind: diagram
title: Composition compatibility gates
caption: Selection retains task identity; composition produces a new model. Every merge first requires a shared coordinate system and ends with independent per-task and retention evaluation.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.15
alt: Base identity, tokenizer and target layout are checked before updates are admitted. Compatible updates can be selected independently or composed by an explicit operator. Composed outputs pass task, retention and deployment gates before receiving a new version; incompatible updates are rejected.
spec:
  direction: TB
  nodes:
    - {id: id, kind: dependency, label: Base and interface identity}
    - {id: gate, kind: branch, label: Exact compatibility gate}
    - {id: reject, kind: state, label: Reject incompatible artifacts}
    - {id: select, kind: process, label: Select one adapter}
    - {id: comp, kind: process, label: Compose realized updates}
    - {id: eval, kind: metric, label: Per-task and retention evaluation}
    - {id: ver, kind: state, label: New immutable deployment version}
  edges:
    - {from: id, to: gate}
    - {from: gate, to: reject, label: mismatch}
    - {from: gate, to: select, label: compatible}
    - {from: gate, to: comp, label: compatible}
    - {from: select, to: eval}
    - {from: comp, to: eval, kind: emphasis}
    - {from: eval, to: ver}
```

## Algorithm

### Algorithm 23.4 - Compatibility-gated signed composition

**MATHEMATICALLY-DERIVED.** Algorithm 23.4 reconstructs TIES with explicit book-defined zero/tie policy. Inputs are compatible task vectors $\delta_k$, retained fraction $q_t\in(0,1]$, and composition scale $a_m$. $\mathsf Top$ retains the largest $\lceil q_tN\rceil$ absolute entries with a deterministic coordinate tie-break. $\mathcal M$ contains all source hashes and validation-selection records.

$$
\begin{aligned}
1.\;&\neg\mathsf{Compatible}(\theta_0,\{\delta_k\},\mathcal M)
\Rightarrow\operatorname{return}(\mathrm{rejected});\\
2.\;&\forall k:\quad\widetilde\delta_k\leftarrow\mathsf{Top}(\delta_k,q_t);\\
3.\;&\forall i:\quad e_i\leftarrow\operatorname{sgn}\!\left(\sum_k\widetilde\delta_{k,i}\right),
\quad\mathcal K_i\leftarrow\{k:\widetilde\delta_{k,i}\ne0\land\operatorname{sgn}(\widetilde\delta_{k,i})=e_i\};\\
4.\;&\delta_{m,i}\leftarrow
\begin{cases}|\mathcal K_i|^{-1}\sum_{k\in\mathcal K_i}\widetilde\delta_{k,i},&|\mathcal K_i|>0\land e_i\ne0,\\0,&\text{otherwise};\end{cases}\\
5.\;&\theta_m\leftarrow\theta_0+a_m\delta_m;\\
6.\;&\mathsf{Finite}(\theta_m)\land\mathsf{Gates}(\theta_m,\mathcal M)
\Rightarrow\operatorname{return}(\theta_m,\mathcal M);\\
7.\;&\operatorname{return}(\mathrm{rejected},\mathcal M).
\end{aligned}
$$
*(Eq. 23.21)*

**MATHEMATICALLY-DERIVED.** The invariant is that every difference uses the same coordinate origin, and all selected hyperparameters come from validation rather than final test sets. Finite traversal over $KN$ coordinates terminates; missing hashes, invalid fractions, incompatible task heads, nonfinite values or failing quality gates reject the artifact. DARE is a separate preprocessing operator; if used, preserve its mask seed and keep probability before running the merge. Task selection is a simpler branch that performs no coordinate averaging.

## Implementation

**OFFICIAL-DOCUMENTATION.** In the MODEL DEFINITION / ADAPTATION layer, the inspected Hugging Face PEFT LoRA API exposes weighted-adapter composition and merge operations, with combination modes and restrictions described at the API surface. These modes must be named explicitly in an artifact; a call described only as “merge adapters” does not identify the mathematical operator. [R23.5] (v0.21.0, add_weighted_adapter and merge_and_unload)

**MATHEMATICALLY-DERIVED.** Exact dense composition streams $K$ updates across $N$ coordinates and writes a new $N$-coordinate artifact, requiring $O(KN)$ scalar work and corresponding memory traffic before evaluation. Low-rank concatenation avoids materializing a dense correction but increases per-token branch work. TIES top-entry selection adds sorting/selection work and masks; SVD recompression adds dense or iterative factorization workspace. Distributed merging must agree on target ordering, missing modules and scale metadata. Money and energy are not implied by those asymptotic counts; include CPU/GPU evaluation and artifact-transfer duration in the measured lifecycle boundary.

```figure
id: fig-23.13
kind: stat-panel
title: Drop-and-rescale uncertainty
caption: Parameter expectation is preserved under independent Bernoulli dropping. The growing variance explains why this identity alone cannot establish output parity.
placement: rail
anchor: implementation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.20
alt: With drop probability 0.9 and one delta coordinate equal to 0.001, the survivor multiplier is ten, expected delta remains 0.001, and coordinate variance is 0.000009. This is an analytical scalar example.
spec:
  header: ANALYTICAL SCALAR MOMENTS
  variables: {pd: 0.9, delta: 0.001}
  rows:
    - {key: survivor multiplier, formula: 1/(1-pd), format: fixed2}
    - {key: expected coordinate, formula: delta, format: raw}
    - {key: coordinate variance, formula: pd/(1-pd)*delta^2, format: raw}
    - {key: output guarantee, value: absent without further assumptions}
```

## Experimental design

**PAPER-REPORTED.** Task arithmetic evaluates combinations on eight CLIP classification tasks and text-model settings, with validation-selected scales and task/control evaluation. TIES compares full T5, parameter-efficient T0 and CLIP encoder merges, including held-out-task generalization and component ablations. It reports that removing trim, sign election, disjoint mean or scaling changes results under that protocol. [R23.11] (§4, Appendix D); [R23.12] (§6–7, Tables 1–2, 6)

**PAPER-REPORTED.** DARE varies dropping rate, compares rescaled and unrescaled removal, combines with task arithmetic/TIES, and tests incompatible reference choices. Its same-base condition and small-delta regime delimit transfer; no universal permissible drop rate follows. [R23.13] (§4.2–4.7, Figs. 3–10)

## Observations

**What the paper claims.** **PAPER-REPORTED.** The sources show useful model combinations under specified shared-base and validation conditions; sign filtering and randomized sparsification improve their disclosed baselines in particular settings. [R23.11] [R23.12] [R23.13]

**What the evidence shows.** **UNVERIFIED.** This chapter has not independently evaluated the cited merges or established that they retain every safety/domain property of their components.

**What we infer.** **MATHEMATICALLY-DERIVED.** Exact update addition solves a representation problem, while Eq. 23.19 shows that task compatibility remains a loss-landscape problem. A correct merge can still be a poor multi-task model.

**What remains unknown.** **NOT-DISCLOSED.** The cited protocols do not establish this book's acceptable per-task regression, data permissions, or operational rollback constraints.

## Failure modes

**MATHEMATICALLY-DERIVED.** Reject base-hash mismatches, tokenizer/embedding changes, missing trained modules, target-order disagreements and scale loss before numerical merging. Detect functional interference with per-task vectors rather than an average score that hides a failed task. A merge can lower the mean loss while violating a critical slice. A compressed adapter whose rank fits a serving limit can still fail parity. Negating a task vector can reduce observed task performance but does not certify deletion or unlearning; Chapter 24 supplies the separate deletion threat model.

## Siblings

**MATHEMATICALLY-DERIVED.** Selection has a routing error surface and retains modular rollback. Dense composition removes per-request adapter selection at the cost of a new combined function. Output ensembling adds model evaluations and a probability-combination rule. Input-dependent mixtures have token-dependent weights and generally cannot be replaced by one constant merged matrix. None is equivalent to jointly training all tasks under a common objective.

## Extensions

**MATHEMATICALLY-DERIVED.** The token-conditional adapter in 23.5 changes composition from one weight vector to a position-dependent operator. Shared-cache validity then depends on the complete active-history prefix, not merely the currently selected adapter name. That extension is useful where a task-specific operation starts late in a conversation, but requires its own trained activation convention and parity tests.

## Limitations

**MATHEMATICALLY-DERIVED.** Coordinate algebra assumes aligned tensors and a meaningful common base. Neither matching shapes nor matching model-family labels establishes that condition. Validation-selected composition can overfit a small multi-task validation suite, and data-free weight manipulation is not evaluation-free deployment. Independent final tests and rollback artifacts remain necessary for the chapter's proposed acceptance rule.

## Reproducibility

**UNVERIFIED.** Save source/base hashes, all coefficients, target layouts, trim/tie policies, sparse masks, factorization tolerances, validation-search budget, trained-head handling, output hashes and per-task results. The manuscript explains inspected source studies; the book's composition experiment remains unexecuted in [verification](verification.md).

## References

- [R23.5](references.md#r235) — PEFT LoRA API.
- [R23.11](references.md#r2311) — task arithmetic.
- [R23.12](references.md#r2312) — TIES-Merging.
- [R23.13](references.md#r2313) — DARE.
