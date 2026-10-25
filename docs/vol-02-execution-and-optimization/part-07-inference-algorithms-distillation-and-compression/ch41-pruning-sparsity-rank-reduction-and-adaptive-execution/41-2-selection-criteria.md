---
id: "ms.section.41.2"
entity_type: "section"
title: "41.2 — Selection criteria"
volume: 2
part: 7
chapter: 41
section: 41.2
slug: "41-2-selection-criteria"
parent: "ms.chapter.41"
prev_sibling: "ms.section.41.1"
next_sibling: "ms.section.41.3"
children: []
prerequisites: ["ms.chapter.13","ms.chapter.14","ms.chapter.15","ms.chapter.16","ms.chapter.17","ms.chapter.25","ms.chapter.26","ms.chapter.27","ms.chapter.28","ms.chapter.39","ms.chapter.40"]
downstream: ["ms.chapter.42","ms.chapter.43","ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle":["inference","adaptation"],"mechanism":["pruning","sparsity","adaptive_computation"],"feedback_setting":[],"modality":["text","image"]}
papers: []
implementations: ["impl.pytorch","impl.hugging-face-transformers","impl.nvidia-cutlass","impl.nvidia-cuda"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-25"
editorial_status: "manuscript_draft"
---

# 41.2 — Selection criteria

## Scope

[DERIVED] Selection estimates which deletions damage a specified objective least. This section owns magnitude, activation and gradient sensitivity, local second-order reconstruction, and calibration dependence. The baseline uses the same support family and retained budget with magnitude selection. The evaluation axis is held-out loss and task quality at a declared construction cost. A saliency score is a surrogate for a counterfactual deletion, not a causal explanation of model knowledge.

## Why this exists

[PAPER-REPORTED] Wanda selects small weight-times-activation scores per output row without weight updates [R41.2](references.md), arXiv v2 §3. SparseGPT compensates removal using local reconstruction curvature [R41.1](references.md), §3. Both target one-shot compression but spend different construction budgets.

[MATHEMATICALLY-DERIVED] Magnitude is invariant to neither input units nor equivalent reparameterizations. If feature $j$ is rescaled by $a>0$ while its weight is divided by $a$, the linear function remains unchanged but raw weight magnitude changes. A criterion that ignores feature scale can therefore assign different saliency to identical functions. Calibration-weighted scores correct this particular defect; they do not remove dependence on the calibration distribution.

## Intuition

[MATHEMATICALLY-DERIVED] Deleting a weight creates an output perturbation proportional to the input carried by that weight. Other input features can compensate when they are correlated. A diagonal score measures the direct perturbation but ignores compensation; an inverse-curvature score measures how cheaply the remaining coordinates can absorb it. A gradient score instead measures downstream task sensitivity, including nonlinear propagation. These answer different questions and can disagree legitimately.

## Formulation

| Symbol | Meaning |
|---|---|
| $W\in\mathbb R^{d_o\times d_i},X\in\mathbb R^{d_i\times n}$ | Layer weights and calibration inputs |
| $\widehat W$ | Modified layer weights, constrained by support |
| $G=XX^\top/n$ | Calibration second moment; not automatically task-loss Hessian |
| $\eta>0,\widetilde G=G+\eta I$ | Damping and regularized positive-definite moment |
| $g,H$ | Gradient and Hessian of a separately specified scalar loss |
| $e_j$ | Coordinate basis vector; one at coordinate $j$ |

[MATHEMATICALLY-DERIVED] A layer-reconstruction objective is
$$
\mathcal E(\widehat W)=\frac1n\|(W-\widehat W)X\|_F^2
=\operatorname{tr}\!\left[(W-\widehat W)G(W-\widehat W)^\top\right].
$$
*(Eq. 41.5)*

where averaging is over activation columns, which are correlated within sequences. Task-loss curvature and $G$ are not interchangeable. Damping adds $\eta\|W-\widehat W\|_F^2$; it changes the objective as well as stabilizing a solve.

[MATHEMATICALLY-DERIVED] If all other weights stay fixed, deleting $W_{ij}$ incurs exactly $W_{ij}^2G_{jj}$ under Eq. 41.5. Ranking its square root yields
$$
s^{\rm mag}_{ij}=|W_{ij}|,\quad
s^{\rm act}_{ij}=|W_{ij}|\sqrt{G_{jj}},\quad
s^{\rm grad}_{\mathcal G}=
\left|\sum_{a\in\mathcal G}g_a\theta_a\right|.
$$
*(Eq. 41.6)*

where $\mathcal G$ is a coupled parameter group. The third score is the absolute first-order deletion effect for a common group gate. Taking absolute values before summation gives a different score; it prevents cancellation and changes group rankings.

```figure
{
  "id": "fig-41.6",
  "kind": "diagram",
  "title": "Selection surrogates and compensation",
  "caption": "Direct perturbation, downstream sensitivity, and constrained reconstruction are different estimators with different information requirements.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.8",
  "alt": "Weights and calibration inputs produce moments. A diagonal moment yields direct scores; a full solve yields compensating updates. Task loss gradients are a separate branch.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "w",
        "kind": "tensor",
        "label": "weights and inputs"
      },
      {
        "id": "g",
        "kind": "tensor",
        "label": "input moment G"
      },
      {
        "id": "d",
        "kind": "process",
        "label": "diagonal score"
      },
      {
        "id": "f",
        "kind": "process",
        "label": "constrained solve"
      },
      {
        "id": "t",
        "kind": "objective",
        "label": "downstream task loss"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "gradient sensitivity"
      }
    ],
    "edges": [
      {
        "from": "w",
        "to": "g"
      },
      {
        "from": "g",
        "to": "d"
      },
      {
        "from": "g",
        "to": "f"
      },
      {
        "from": "t",
        "to": "s"
      }
    ]
  }
}
```
```figure
{
  "id": "fig-41.7",
  "kind": "calculator",
  "title": "Correlation and deletion loss",
  "caption": "Analytical two-feature moment has unit diagonal and correlation r. Compensation reduces squared reconstruction cost; no neural accuracy is predicted.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.8",
  "alt": "Calculator compares direct deletion loss w squared with compensated loss w squared times one minus correlation squared for an analytical positive-definite two-feature moment.",
  "spec": {
    "tex": "\\mathcal E_{direct}=w^2,\\quad\\mathcal E_{comp}=w^2(1-r^2)",
    "equation": "41.8",
    "inputs": [
      {
        "symbol": "w",
        "label": "deleted weight",
        "default": 0.5,
        "min": 0.1,
        "max": 2,
        "step": 0.1,
        "format": "fixed2"
      },
      {
        "symbol": "r",
        "label": "input correlation",
        "default": 0.8,
        "min": 0,
        "max": 0.99,
        "step": 0.01,
        "format": "fixed2"
      }
    ],
    "outputs": [
      {
        "symbol": "Ed",
        "label": "direct squared error",
        "formula": "w^2",
        "format": "fixed2"
      },
      {
        "symbol": "Ec",
        "label": "compensated squared error",
        "formula": "w^2*(1-r^2)",
        "format": "fixed2",
        "emphasis": true
      }
    ]
  }
}
```
```figure
{
  "id": "fig-41.8",
  "kind": "stat-panel",
  "title": "Curvature memory growth",
  "caption": "Illustrative FP32 input-moment storage before factors and weights. Doubling feature width quadruples the moment bytes.",
  "placement": "rail",
  "anchor": "implementation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.5",
  "alt": "A 4096 by 4096 FP32 moment requires 64 MiB. This excludes factors, weights, and activation buffers.",
  "spec": {
    "header": "ONE INPUT MOMENT",
    "variables": {
      "di": 4096
    },
    "rows": [
      {
        "key": "moment values",
        "formula": "di^2",
        "format": "integer"
      },
      {
        "key": "FP32 moment bytes",
        "formula": "4*di^2",
        "format": "bytes"
      }
    ]
  }
}
```


## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] For one row $w$, choose a perturbation $\delta$ that deletes coordinate $j$ while minimizing regularized reconstruction:
$$
\min_\delta \delta^\top\widetilde G\delta
\quad\text{subject to }e_j^\top\delta=-w_j.
$$
*(Eq. 41.7)*

Introducing a Lagrange multiplier $\mu$ gives $2\widetilde G\delta+\mu e_j=0$. Substituting the constraint determines $\mu=2w_j/(\widetilde G^{-1})_{jj}$, hence
$$
\delta^\star=-\frac{w_j}{(\widetilde G^{-1})_{jj}}\widetilde G^{-1}e_j,\qquad
\mathcal E_j^\star=\frac{w_j^2}{(\widetilde G^{-1})_{jj}}.
$$
*(Eq. 41.8)*

This is an exact constrained quadratic solution, not an exact neural-network pruning optimum. If $\widetilde G$ is diagonal, it reduces to the squared activation-weighted score. If features are strongly correlated, off-diagonal compensation can radically reorder deletions. A singular undamped moment requires a pseudoinverse with range conditions; blindly inverting it is invalid.

[MATHEMATICALLY-DERIVED] For a full model loss and a deletion group, Taylor expansion yields
$$
\Delta\mathcal L =
g^\top\delta+\tfrac12\delta^\top H\delta+
O(\|\delta\|^3)
$$
*(Eq. 41.9)*

provided sufficient local smoothness. Removing a whole channel need not be a small perturbation. Stationarity on original pretraining data does not establish $g=0$ on a new calibration set. A diagonal empirical Fisher is an approximation with its own sampled-gradient definition; it is not generally the exact Hessian. These qualifications determine whether first-order, second-order, or finite ablation evidence is relevant.

[PAPER-REPORTED] LLM-Pruner groups dependent structures and estimates importance with gradient/Taylor terms, then performs recovery; it explicitly retains the possibility of nonzero calibration gradients [R41.3](references.md), §§3.1–3.3, Eqs. 3–5. This differs from minimizing a frozen layer's output error. Its grouping changes the deletion unit, and its recovery budget must accompany quality comparisons.

[DERIVED] A reconstruction solve requires choosing whose inputs are reconstructed. Using the dense teacher's inputs isolates an individual layer under teacher context. Passing calibration examples through already compressed earlier layers tests a changed input distribution and partially exposes accumulated drift. Recomputing targets from the dense layer on those changed inputs is different again from matching the dense network's original hidden states. An artifact must declare both input producer and target producer; the shorthand “layerwise reconstruction” is insufficient.

[PAPER-REPORTED] SparseGPT synchronizes a shared sequence of remaining input coordinates across output rows, uses blocked mask decisions and lazy updates, and preserves computational tractability by restricting compensation to not-yet-processed coordinates [R41.1](references.md), §§3.1–3.4, Algorithm 1. Exact per-row regression with arbitrary masks would require different restricted inverses. Its practical solver is therefore an approximation to the joint support-and-weight problem, even though each local constrained update has a quadratic interpretation.

[MATHEMATICALLY-DERIVED] Calibration itself is an estimator. If $G_{\rm cal}$ and $G_{\rm test}$ are the calibration and deployment second moments and $\Delta=W-\widehat W$, then
$$
|\mathcal E_{\rm test}-\mathcal E_{\rm cal}|
\leq\|G_{\rm test}-G_{\rm cal}\|_2\|\Delta\|_F^2.
$$
*(Eq. 41.10)*

This follows from the trace inequality applied to $\Delta^\top\Delta\succeq0$. It explains how a larger perturbation amplifies moment mismatch, without asserting that a finite sample estimates a heavy-tailed deployment distribution accurately. Rare domains, long contexts, and previously absent modalities can change $G_{\rm test}$; averaging more adjacent tokens is not equivalent to obtaining more independent domain coverage.

[MATHEMATICALLY-DERIVED] Construction costs for one layer are $O(nd_i^2)$ to form a dense $G$, $O(d_i^3)$ to factor it, and $O(d_id_o)$ weight storage plus $O(d_i^2)$ curvature state. Activation-norm accumulation uses $O(nd_i)$ operations and $O(d_i)$ statistics before per-weight scoring. Gradient criteria add a backward pass and retained activation or recomputation cost. Recovery and inference are separate accounting stages. Multi-device calibration may all-reduce moments or scores; a dense moment reduction communicates $O(d_i^2)$ scalars per layer. Time, energy, and money for these stages are NOT-DISCLOSED for a generic model and cannot be extrapolated from source runtimes.

## Algorithm

### Algorithm 41.2 — Bounded sequential quadratic reconstruction

[DERIVED] This explanatory scalar-column reference reconstructs the local update; production blocked SparseGPT details remain in its cited Algorithm 1. Inputs are $W,X$, a column ordering, positive damping, a support-budget rule, and a maximum $d_i$ iterations. State comprises unfrozen columns $U$, current weights, and the corresponding curvature solve.

$$
\begin{aligned}
1.\;&U\leftarrow\{1,\ldots,d_i\},\quad \widehat W\leftarrow W,\quad
\widetilde G\leftarrow XX^\top/n+\eta I.\\
2.\;&\operatorname{chol}(\widetilde G)\text{ fails}
\Rightarrow\mathsf{stop}_{\rm conditioning}.\\
3.\;&j\leftarrow\text{next column in }U;\quad K\leftarrow(\widetilde G_{UU})^{-1}.\\
4.\;&q_i\leftarrow
\begin{cases}0,&(i,j)\text{ selected for deletion},\\
\widehat W_{ij},&\text{otherwise};
\end{cases}
\quad a_i\leftarrow(\widehat W_{ij}-q_i)/K_{jj}.\\
5.\;&\widehat W_{i,U}\leftarrow\widehat W_{i,U}-a_iK_{j,U};
\quad \widehat W_{ij}\leftarrow q_i.\\
6.\;&U\leftarrow U\setminus\{j\};\quad
U\ne\varnothing\Rightarrow 3;\quad
\mathsf{return}(\widehat W,\mathcal M).
\end{aligned}
$$
*(Eq. 41.11)*

[DERIVED] The invariant is that frozen columns no longer change and each local update enforces the selected coordinate value. No global optimality invariant is claimed. This literal repeated-inverse reference costs $O(d_i^4+d_od_i^2)$; reusing inverse updates or the source's Cholesky/blocking reduces that construction cost. It is deliberately not presented as efficient SparseGPT pseudocode. Finite values and pattern validity must be checked before committing each block; a failure returns the original artifact.

## Implementation

[PAPER-REPORTED] SparseGPT uses **PyTorch — Model / autograd framework** and **Hugging Face Transformers — Model definition / adaptation**, processing transformer layers sequentially to bound resident model memory [R41.1](references.md), §4. Wanda computes activation statistics through a forward pass without weight reconstruction [R41.2](references.md), §2 and Appendix A. Framework names specify the source implementation family, not executable compatibility with current releases.

[DERIVED] Moment accumulation should separate operand dtype from accumulator dtype; loss of positive definiteness after rounding is observable through factorization failure. Normalization by valid calibration tokens prevents padded positions from altering scores. Group selection must use the same channel indexing in all producer/consumer tensors. A saved calibration manifest needs tokenizer revision, prompt construction, sequence length, target mask, domain counts, random seeds, and whether prior layers were compressed. These are necessary conditions for reproducing the estimator.

## Experimental design

### Reported experiments

[PAPER-REPORTED] SparseGPT uses 128 randomly sampled 2048-token C4 segments, sequential one-shot pruning on an A100 80GB, and matched dense/sparse evaluation code. Table 1 reports OPT-175B raw-WikiText2 perplexities 8.35 dense, 8.21 at 50% unstructured sparsity, and 8.74 for 2:4 [R41.1](references.md), §4, Table 1. These are source-reported quality values; construction hardware is not an inference-speed boundary.

[PAPER-REPORTED] Wanda's LLaMA-7B comparison at 50% unstructured sparsity reports WikiText perplexity 7.26 versus magnitude pruning 17.29 [R41.2](references.md), arXiv v2 §4.2, Table 3; §4 describes the shared 128-sequence C4 calibration and evaluation. The study varies scoring at a fixed sparsity pattern and reports downstream zero-shot tasks separately. Table 17 also reports multi-seed variation for selected configurations; these uncertainty records do not establish uncertainty for every main-table cell or deployment workload.

## Observations

**What the paper claims.** [PAPER-REPORTED] Wanda reports a large improvement over raw magnitude and comparable quality to reconstruction-based pruning in its evaluated LLaMA setting [R41.2](references.md), §3.

**What the evidence shows.** [DERIVED] These comparisons establish that weight size alone is inadequate for those workloads. They do not establish that the activation moment is sufficient for every task or that perplexity improves reliably after pruning; seed-wise confidence for the small reported decrease is unavailable here.

**What we infer.** [MATHEMATICALLY-DERIVED] Equation 41.8 shows precisely when the diagonal criterion is recovered and why correlated inputs provide compensating directions.

**What remains unknown.** [NOT-DISCLOSED] The cited comparisons do not disclose deployment-specific moment mismatch or uncertainty over all future task distributions.

## Failure modes

> **Failure mode — Local loss mistaken for task loss.** [DERIVED] *Symptom:* low reconstruction error accompanies downstream regressions. *Cause:* downstream Jacobians and task distribution are outside the surrogate. *Detection:* inspect held-out task loss and representation drift. *Mitigation:* restrict the claim to reconstruction and evaluate the final artifact.

> **Failure mode — Unstable compensation.** [MATHEMATICALLY-DERIVED] *Symptom:* large updates, nonfinite factors, or sensitivity to damping. *Cause:* an ill-conditioned moment and correlated coordinates. *Detection:* factorization diagnostics and solve residuals. *Mitigation:* declare regularization and a stable solve; do not conceal failed layers.

## Siblings

[DERIVED] Magnitude and activation scoring differ in input-scale sensitivity; gradient group scoring includes downstream loss but pays backward cost; second-order reconstruction models local compensation but stores dense input curvature. [Structural reduction](41-3-structural-reduction.md) changes feasible groups, while [recovery](41-4-recovery.md) changes the remaining weights after selection. Comparing a recovered method to an unrecovered method mixes interventions.

## Extensions

### Improvements

[PAPER-REPORTED] MaskLLM replaces a fixed saliency rule with learned categorical logits over the six 2:4 supports while freezing base weights [R41.9](references.md), §3.2, Algorithm 1. Gumbel-Softmax provides a differentiable relaxed mask; language-model loss and a sparse-weight norm term update mask logits. Export selects the highest-logit support in each group. The source separately studies prior-mask initialization, stochastic exploration, and regularization (§4.3); these components must not be credited solely to a larger calibration set.

[MATHEMATICALLY-DERIVED] A relaxed mask is a convex combination of valid hard supports, so its entries lie in $[0,1]$ and sum to two per four-entry group, yet it generally has four nonzero entries. It is therefore not an executable 2:4 tensor during relaxed optimization. Hardening restores valid support but can change loss. Six trainable logits per four weights require $1.5N_s$ scalar search parameters for $N_s$ candidate weights, before gradients and optimizer moments; freezing base weights does not make mask training memory-free. A bounded reconstruction of the procedure initializes logits, performs at most $K_{mask}$ forward/backward updates with frozen weights, selects an argmax support per group, validates all group counts, and returns the hard artifact or rejects a nonfinite update. This state contract explains both the discrete constraint and relaxation gap without claiming an exact combinatorial optimum.

[PAPER-REPORTED] MaskLLM's §4 protocols and Appendix A identify model families and training mixtures; Appendix J explicitly acknowledges greater construction resources than one-shot criteria [R41.9](references.md). Its quality comparison therefore belongs on a quality-versus-total-construction frontier. A frozen-weight learned mask is a documented successor to one-shot selection, not a compute-matched replacement for it.

[PAPER-REPORTED] The 2026 MoE coverage study replaces repeated whole-expert ablations with a first-order output-attribution proxy, then allocates channel budgets and aligns dimensions [R41.15](references.md), §§4.1–4.3, Appendix B.1. This changes selection granularity and allocation, not the exactness of Taylor expansion. Its structural consequences are developed in §41.3.

[UNVERIFIED] RobOP and ROSE were found through 2026 proceedings discovery, but the required full-text PDF fetch failed in this authoring pass. Their mechanisms and claimed gains are not taught here; the evidence-gap ledger records the retrieval gap.

## Limitations

[DERIVED] There is no criterion-independent “importance.” The loss, input distribution, allowed support, and available compensating coordinates define it. Exact layerwise reconstruction gives no uniform guarantee for autoregressive trajectories, where a token change also changes future inputs.

## Reproducibility

[UNVERIFIED] The reference algorithms and derivations were inspected and explained, but no calibration or pruning check was executed. References pin paper revisions; implementation commits and numerical tolerances remain part of the proposed artifact. Damping, ordering, mask budgets, and sequential-input policy are material configuration fields.

## References

[R41.1](references.md), SparseGPT §§2–4; [R41.2](references.md), Wanda §§2–3 and Appendix A; [R41.3](references.md), LLM-Pruner §3; [R41.15](references.md), attribution and coverage §4.
