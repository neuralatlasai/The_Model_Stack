---
id: ms.verification.2
entity_type: verification
title: Verification — cross-entropy gradients and a paired cluster bootstrap
short_title: Verification 02
volume: 1
part: 1
chapter: 2
section: null
slug: verification
parent: ms.chapter.2
prev_sibling: null
next_sibling: ms.references.2
children: []
prerequisites: [ms.section.2.4, ms.section.2.5]
downstream: [ms.section.3.3, ms.section.6.4]
related: []
siblings_by_mechanism: []
relations:
  - {type: evaluated_by, target: ms.section.2.4}
  - {type: evaluated_by, target: ms.section.2.5}
axes: {lifecycle: [evaluation], mechanism: [differentiation, statistical_inference], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: foundational, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, ASSUMED, UNVERIFIED], empirically_observed: false}
word_count_target: 700
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# Verification — Chapter 02

## 1. Artifact specification

This ledger records proposed verification and topic coverage. It does not report executed experiments. The notation extension and estimator table described below are specifications within this file; no separate artifact files, measurements, or runtime logs were produced in this revision.

| Proposed artifact | Required fields and scope | Current status |
|---|---|---|
| Notation extension | Symbol, meaning, shape/unit, first use, owning section, conflict check against [global notation](../../../front-matter/notation.md). In particular distinguish parameter count N, contracted column extent J, bytes b, score baseline c₀, entropy H, Hessian H, and local optimization multipliers. | Specification; symbols are defined in manuscript context, but a separate complete symbol registry has not been independently reviewed. |
| Estimator table | Estimand; equation; sampling measure/support; bias; moment/regularity conditions; variance or asymptotic variance; compute/state; resampling unit; source. Include MC, SNIS, k₁/k₃, BPB ratio, score/pathwise/straight-through, cluster mean, percentile/basic/BCa, paired randomization, delta method. | Treatments mapped in §5 below; no independently executed estimator comparison. |
| Derivative-check record | Framework version, device, dtype, seed, logit range, normalized target, loss and gradient reference, perturbation grid, error curve, roundoff/truncation budget. | Proposed in §2.1. |
| Coverage-check record | Estimand, generation model for paired differences, n, K, cluster sizes, correlation, replicate and population counts, all seeds, CI construction, empirical coverage and its Monte Carlo SE. | Proposed in §2.2. |

## 2. Verification task

### Experiment 2.1 — Softmax cross-entropy and directional derivatives

**Status: ASSUMED protocol; execution UNVERIFIED.** The mathematical target is Eq. 2.16, not a guarantee that one finite-difference step works at every magnitude. For finite logits z and a fixed normalized target y, compare the analytic gradient softmax(z) − y with a framework derivative and central differences of the shifted log-sum-exp loss. Include one-hot and soft targets; vary vocabulary size over {8, 1024, 32768}, logit scale over {1, 10, 100, 1000}, and several seeds. Start with FP64 CPU and pin the framework version. FP32 and BF16 comparisons are separate numerical experiments with the FP64 analytic result as reference.

For coordinate or normalized direction v, evaluate [L(z+hv)−L(z−hv)]/(2h) on a logarithmic h grid. Central-difference truncation is O(h²) only when the third directional derivative is bounded in the neighborhood; cancellation contributes an error that depends on the magnitudes of L and h. Report the complete error curve. A fixed 10⁻⁸ tolerance at h=10⁻⁶ is not justified for scale 1000. For a smooth direction with third-derivative bound M₃, a comparison budget should include M₃h²/6 plus a declared floating-point evaluation/cancellation allowance. Estimate or bound these components rather than interpreting one unfavorable h as a calculus failure.

Use deterministic adversarial logits with a known large positive entry for the unshifted exponential ablation. Random logits do not guarantee overflow for every seed or vocabulary. The shifted expression avoids overflow in exp(z−max z) for finite real inputs; it does not guarantee that a loss difference beyond the output format's range remains representable. Check NaN/Inf inputs as explicitly rejected cases, normalized-target invariance, and invariance to an added constant within the representable range. Treat near-zero reference losses with absolute error, since relative error becomes undefined or misleading.

An implementation fails this proposed check when the analytic/framework discrepancy exceeds its declared numerical budget, or no interval of h exhibits the expected truncation-to-roundoff behavior despite satisfying the smoothness and representability conditions. A finite-difference discrepancy alone does not refute the symbolic identity. The proposed workload uses O(V) state and work per directional check; exhaustive coordinate differences cost O(V²) total work and are confined to small V. This corrects the earlier unbounded coordinate-check specification.

### Experiment 2.2 — Clustered uncertainty for paired differences

**Status: ASSUMED protocol; execution UNVERIFIED.** The dependence model must apply to the paired difference d, not merely to each marginal system score. Adding the same cluster effect to A and B cancels it exactly and cannot test Eq. 2.22 for d.

Generate K independent clusters of m paired rows by

$$
s^A_{kj}=a_k/2+e^A_{kj},\qquad
s^B_{kj}=-\delta-a_k/2+e^B_{kj},\qquad
a_k\sim\mathcal N(0,\rho\sigma^2),\quad
e^A_{kj},e^B_{kj}\overset{\rm iid}{\sim}\mathcal N(0,(1-\rho)\sigma^2/2).
$$

Then d_{kj}=δ+a_k+e^A_{kj}−e^B_{kj} has mean δ, marginal variance σ², within-cluster correlation ρ, and mean variance σ²[1+(m−1)ρ]/(Km). These continuous Gaussian scores are a check of this variance model, not a claim about bounded benchmark accuracies. Bounded-score, unequal-size, and crossed-dependence models require separate simulations and estimands.

Vary ρ over {0, .25, .5, .75}, m over {1, 5, 10, 25}, and K over {20, 50, 200}. Candidate planning counts are R=2000 bootstrap replicates and S=2000 independent synthetic datasets, α=.05, and fixed σ², δ. Preaggregate cluster sums and counts and implement Algorithm 2.5 in O(n+RK) work and O(K+R) auxiliary state per dataset. Compare cluster percentile and cluster basic intervals with iid-row percentile intervals, a cluster-mean t interval for equal-size Gaussian clusters, and the exact known-model normal interval. Use distinct recorded random streams for data generation, bootstrap replication, and independent datasets.

Report empirical coverage with binomial Monte Carlo SE sqrt[c(1−c)/S], interval width, bootstrap variance, and the ratio to the known target. The predicted standard-error ratio sqrt(DE) is a large-sample comparison within this model, not an exact finite-sample bootstrap-width identity. At fixed K, increasing m shrinks within-cluster noise toward the between-cluster floor; it can narrow a correct interval. A nominal 95% percentile interval is not guaranteed to cover at 95% for K=20 or K=50. Report departures and Monte Carlo uncertainty rather than declaring an arbitrary coverage band a mathematical requirement. Unpaired resampling is a different procedure whose variance depends on the cross-system covariance; it is not promised to be wider in this construction.

A meaningful rejection separates the layers: disagreement with the analytic variance beyond simulation uncertainty rejects the generator or variance calculation; disagreement between an interval's coverage and its nominal level documents a finite-sample coverage limitation; disagreement with independently implemented cluster aggregates rejects the implementation. None of those observations refutes the exact random-effects algebra without first checking its assumptions.

### Additional proposed checks

| Check | Controlled boundary and comparison | Acceptance evidence required |
|---|---|---|
| Contraction and layout | Small exact/reference contractions with batch-retained and summed indices; noncontiguous transpose, zero-stride broadcast, explicit materialization; pin version and device. | Agreement with an index-based result; separately report allocated state and actual traffic/latency. FLOP and ideal-byte formulas alone do not validate a performance claim. |
| Power iteration | Matrices with known singular spectrum; random starts with recorded leading overlap, zero/nullspace cases, and small spectral gaps. | Compare the spectral-norm estimate with a reference decomposition and report error versus iterate change. Stop tolerance is not a certified spectral error. |
| SNIS and ESS | Finite distributions with exact μ; matched weight vectors but different correlation of f with weights; support-failure cases. | Bias/variance over independent replications versus Eq. 2.29; show why equal ESS does not imply equal estimator variance. |
| BPB aggregation | The same byte documents under two lossless tokenizers, named separators/context/masking; deterministic token path versus any tractable summed byte probability. | Reconstruct total nats, total bytes and their ratio; distinguish a fixed evaluation-set statistic from random-document inference. |
| Curvature products | Small networks including a fixed-active ReLU two-layer product; HVP against gradient differences, Gv against JᵀH_zJv, factored versus full damping. | Numerical agreement within declared finite-difference error; demonstrate the nonzero mixed parameter derivative. |
| Frontier and uncertainty | Finite configurations including equal-cost ties and duplicates; synthetic joint fit draws with known covariance. | Compare Algorithm 2.6 with exhaustive dominance for bounded small inputs; propagate joint draws and compare with delta approximation in a declared local regime. |

## 3. Acceptance criteria

The proposed checks require recorded inputs, exact package versions, seeds, numerical budgets, and the appropriate independent unit. Symbolic algebra, source inspection, numerical equivalence, timing, and statistical coverage are separate forms of evidence. Thresholds selected for a future experiment are ASSUMED until preregistered and executed. No numerical pass/fail record exists for this edition.

```figure
id: fig-2.35
kind: diagram
title: Separate derivative correctness from interval coverage
caption: >-
  Proposed checks with different rejection targets. Experiment 2.1 compares
  a symbolic derivative with numerical references across perturbation scales;
  Experiment 2.2 checks a generator's analytic variance before assessing
  finite-sample interval coverage. No branch represents an executed result.
placement: wide
evidence: ASSUMED
source: ["DERIVED:eq-2.16", "DERIVED:eq-2.22", "DERIVED:alg-2.5"]
alt: >-
  Two proposed verification paths. Finite logits and normalized targets feed
  analytic and framework derivatives plus a finite-difference step sweep;
  discrepancies are judged against truncation and roundoff budgets. Paired
  cluster differences with a non-canceling cluster effect feed the known-model
  variance and cluster-resampling intervals. Generator agreement is checked
  before coverage, which is reported with simulation uncertainty.
spec:
  direction: LR
  nodes:
    - { id: z, kind: dataset, label: "finite logits; normalized targets", group: gradient }
    - { id: refs, kind: process, label: "analytic and framework derivatives", group: gradient }
    - { id: fd, kind: process, label: "finite differences across h", group: gradient }
    - { id: budget, kind: metric, label: "truncation and roundoff budget", group: gradient }
    - { id: verdict, kind: branch, label: "implementation discrepancy?", group: gradient }
    - { id: pop, kind: dataset, label: "paired differences with cluster effect", group: coverage }
    - { id: variance, kind: metric, label: "check known-model variance", group: coverage }
    - { id: intervals, kind: process, label: "compare interval procedures", group: coverage }
    - { id: mc, kind: metric, label: "coverage and Monte Carlo uncertainty", group: coverage }
  edges:
    - { from: z, to: refs }
    - { from: z, to: fd }
    - { from: refs, to: verdict }
    - { from: fd, to: verdict }
    - { from: budget, to: verdict }
    - { from: pop, to: variance }
    - { from: variance, to: intervals }
    - { from: intervals, to: mc }
  groups:
    - { id: gradient, label: "Experiment 2.1: derivative identity" }
    - { id: coverage, label: "Experiment 2.2: statistical procedure" }
```

## 4. What this edition did not do

No proposed check was executed. Source texts and official API documentation were inspected on the dates individually recorded in [references.md](references.md). This is source verification, not code execution or an independent reproduction. Mutable JAX latest and Liger main were inspected without immutable commit pins; their release-specific runtime behavior remains UNVERIFIED. Efron 1979 and Williams 1992 did not yield usable full primary text and remain UNVERIFIED bibliography entries with null access dates. The chapter remains manuscript_draft pending independent scientific, notation, and rendering review.

## 5. Topic-completeness audit

“Covered” below means a substantive manuscript treatment with the listed boundary; it does not assert independent scientific approval or completion of the entire book. Algebraic foundations have no training dataset, benchmark, empirical baseline, or hardware result to invent. Their experimental fields are justified N/A; documentation and paper experiments are identified only where applicable. Sources and locators refer to the versioned records in references.md; DERIVED identifies an explicit reconstruction rather than a reported experimental observation.

| Topic or variant | Manuscript location and substantive obligation | Evidence and remaining boundary |
|---|---|---|
| Contraction, retained batch labels, free and reduced axes | [02.1 Formulation](02-1-tensor-algebra.md#formulation); [shape contract](02-1-tensor-algebra.md#shape-layout-and-reduction-contract): indexed sum, output shape, label roles. | DERIVED Eq. 2.1; no empirical method claim. |
| FLOPs, ideal traffic, intensity, shared versus batched operands | [02.1 Methodology](02-1-tensor-algebra.md#methodology): multiplication/addition convention, read/write boundary, ridge-point condition. | DERIVED Eq. 2.2; actual traffic, routing and latency UNVERIFIED. |
| Broadcasting, strides, transpose, expand aliasing | [02.1 Implementation](02-1-tensor-algebra.md#implementation) and shape contract: view versus materialized state. | R2.8 PyTorch 2.14, General semantics and Tensor.expand warning; downstream kernel allocation unmeasured. |
| Rank, SVD, spectral/Frobenius norms, low-rank error | [02.1 singular-value treatment](02-1-tensor-algebra.md#singular-values-approximation-error-and-solve-sensitivity): projection/trace proof and optimal truncation errors. | DERIVED Eq. 2.3 and proof; mathematical N/A for training experiments. |
| Condition number, RHS and matrix perturbation, normal equations | Same anchor: nonsingular square-solve conditions, perturbation denominator, squared conditioning of AᵀA. | DERIVED Eqs. 2.4, 2.28; rectangular pseudoinverse/rank-changing sensitivity outside this square-solve result. |
| Spectral-norm power iteration | [02.1 Algorithm](02-1-tensor-algebra.md#algorithm): two matvecs, convergence conditions, initialization and zero-norm branches. | DERIVED Algorithm 2.1; performance/termination-error certification not reproduced. |
| Conditional probability, Bayes, total expectation/variance | [02.2 conditional laws](02-2-probability.md#conditional-laws-and-estimands): positive-probability events and variance decomposition. | DERIVED Eqs. 2.5–2.7; conditioning on null events needs a separately defined regular conditional law. |
| Autoregressive versus graphical factorization | [02.2 Formulation](02-2-probability.md#formulation): chain rule versus conditional-independence assumption. | DERIVED Eq. 2.5; Markov structure is a model assumption, not a universal token property. |
| Prompt/output sampling, allocation and MC error | [02.2 Methodology](02-2-probability.md#methodology); [sampling contract](02-2-probability.md#sampling-law-and-importance-estimator-contract): independent-prompt floor and cost-conditioned allocation. | DERIVED Eqs. 2.7–2.8; generation costs illustrative, not measured. |
| Inverse-CDF, categorical/Gumbel sampling | Sampling contract and [Implementation](02-2-probability.md#implementation): transform proof and API support/normalization. | DERIVED; R2.20 PyTorch 2.14 torch.multinomial; no kernel algorithm inferred. |
| IS versus SNIS, support, finite-n bias, moment conditions | Sampling contract and [Algorithm](02-2-probability.md#algorithm): weights and streaming centered second moments. | DERIVED Eqs. 2.9, 2.29; estimator-specific variance, not universal ESS equivalence. |
| ESS, control variates, stratification versus clustering | [02.2 Siblings](02-2-probability.md#siblings): changed estimator, covariance condition, fixed stratum weights and dependence distinction. | DERIVED; source-reported gradient methods in 02.4, not an invented MC benchmark. |
| Entropy, cross-entropy, KL and perplexity | [02.3 Formulation](02-3-information-theory.md#formulation): measures, log base, support and nonnegativity. | R2.1 Shannon Part I §§6–9; DERIVED decomposition. Tokenizer dependence applies to every token-space quantity. |
| Arithmetic interval code, Kraft lower bound, finite redundancy | [02.3 coding construction](02-3-information-theory.md#coding-construction-and-token-to-byte-probability): terminated-stream bound and units. | R2.1 Theorem 9 contextualizes entropy; interval/Kraft derivation is reconstructed. No encoder implementation verified. |
| BPB, document ratios, masking/context, canonical token path | Same anchor; [Reported experiments](02-3-information-theory.md#reported-experiments): denominator and path-vs-byte-probability gap. | P03 §3.1 and Appendix E.2; corpus protocol exceptions named; no new BPB results. |
| Sampled k₁/k₃ KL, value versus gradient | [02.3 KL estimation](02-3-information-theory.md#kl-support-estimation-and-differentiation): absolute continuity, expectation and covariance caveats. | P25 §4.1 Eqs. 3–4; DERIVED unbiasedness conditions; no isolated estimator ablation or universal lower-variance claim. |
| Mutual information/data processing, finite-bit capacity | [02.3 Mechanism](02-3-information-theory.md#mechanism): entropy conditions and discrete capacity bound. | DERIVED; finite-dimensional continuous vectors do not imply a finite information capacity. |
| Forward/reverse KL and full-distribution distillation | [02.3 Siblings](02-3-information-theory.md#siblings): objective direction, source measure, output access and cost. | DERIVED; approximation/access mechanisms belong to Chapters 33–39. |
| Jacobian, JVP/VJP, chain rule and reverse accumulation | [02.4 Formulation](02-4-differential-calculus.md#formulation); [Algorithm](02-4-differential-calculus.md#algorithm): adjoints and state lifetime. | R2.6 §3; R2.10 JVP/VJP; R2.11 saved tensors; wall-time ratio unmeasured. |
| Shifted CE, p−y, softmax Hessian | [02.4 Methodology](02-4-differential-calculus.md#methodology): fixed normalized targets, finite logits, null direction. | DERIVED Eqs. 2.15–2.16; proposed numerical checks above remain unexecuted. |
| Exact Hessian, GGN, Fisher versus empirical Fisher | [02.4 curvature validity](02-4-differential-calculus.md#curvature-validity-and-damping): dropped network term, ReLU mixed derivative, PSD condition. | R2.12 §§8–9,11; DERIVED Eq. 2.17. Equality restricted to specified output models/expectations. |
| HVP, O(V) softmax curvature, Hutchinson diagonal | [02.4 Mechanism](02-4-differential-calculus.md#mechanism): matrix-free product and randomized identity. | R2.10 HVP section; DERIVED; no timing or stochastic-diagonal accuracy measurement. |
| K-FAC factors, application cost and damping | Curvature validity and [Reported experiments](02-4-differential-calculus.md#reported-experiments): Kronecker approximation and dense-factor costs. | R2.5 §§3–8,13; chapter uses simplified block diagonal treatment, not all block-tridiagonal variants. Autoencoder reports do not establish modern LM optimizer ordering. |
| Score-function, baseline, explicit integrand derivative | [02.4 Mechanism](02-4-differential-calculus.md#mechanism): fixed support, interchange, finite moments and optimal scalar baseline. | R2.14 §2.1/Theorem 1; DERIVED Eq. 2.18. Williams R2.3 historical item remains uninspected. |
| Pathwise, SGVB, straight-through, stochastic DAG | Same anchor and Siblings: transformed noise, estimator bias, descendant-cost selection. | R2.4 §§2.3–2.4, §5; R2.13 §4–5; R2.14 Theorem 1; R2.15 taxonomy. Measure-valued gradients named with boundary, not fully developed. |
| Fused loss and activation state | [02.4 Implementation](02-4-differential-calculus.md#implementation): output state versus chunked computation. | R2.9 README low-level API example, unpinned main; exact kernel policy and allocation not code-verified. |
| CI estimand, paired binary discordance and effect size | [02.5 estimand treatment](02-5-statistical-inference.md#estimand-unequal-clusters-and-test-construction): covariance and row/cluster weighting. | DERIVED Eqs. 2.20–2.21; R2.7 §4.2 Eq. 7. CI coverage is a repeated-sampling property. |
| Equal and unequal clusters, crossed dependence | Same anchor and Methodology: random-effects DE, ratio linearization and residual cluster sums. | DERIVED Eqs. 2.22, 2.30; R2.7 §2.2 Eq. 4. Crossed covariance requires a separately justified model. |
| Percentile, basic and BCa bootstrap | [02.5 bootstrap variants](02-5-statistical-inference.md#bootstrap-variants-multiplicity-and-power): quantiles, bias correction, jackknife acceleration, degeneracy. | Reconstructed formulas; R2.2 uninspected, so original-paper attribution and higher-order coverage theory remain a source-review gap. |
| Paired randomization, multiplicity, equivalence, power | Same anchor: sharp exchangeability null, Monte Carlo correction, Bonferroni/Holm/BH conditions, declared margin. | DERIVED; R2.7 §5 Eq. 9 power. No blanket exactness for sampled tests or finite-sample coverage guarantee. |
| Stratified runs, IQM, source coverage findings | [02.5 Reported experiments](02-5-statistical-inference.md#reported-experiments): fixed task benchmark versus task population. | R2.16 §§3,4.1–4.3/Appendix A.5; R2.17 §§2–4. Runtime/model omissions explicitly recorded. |
| Constraints, Lagrangian, KKT, qualifications | [02.6 KKT treatment](02-6-optimization-language.md#kkt-conditions-and-the-limits-of-multipliers): stationarity, feasibility, slackness, counterexample and convex sufficiency. | DERIVED Eqs. 2.24–2.25; necessity needs qualification, sufficiency needs convexity. Empirical fields N/A. |
| Multipliers and envelope sensitivity | Same anchor: sign, units and local differentiability boundary. | DERIVED Eq. 2.25; discrete capacity cliffs do not automatically have one-sided multiplier bounds. |
| Compute-constrained allocation and coefficient | [02.6 allocation](02-6-optimization-language.md#allocation-dimensionless-sensitivity-and-uncertainty): positive family, exact optimum and dimensionless growth. | DERIVED Eqs. 2.26, 2.31; P09 §3.3 Eqs. 2–4. Coefficient/exponent uncertainty is joint. |
| Fit methods, protocol sensitivity and documented improvement | [02.6 Reported experiments](02-6-optimization-language.md#reported-experiments): three P09 approaches and P08 historical comparison. | P08 §§2,6; P09 §§3.1–3.3/Appendices D.2,F. Published joint fit covariance NOT-DISCLOSED in inspected account. |
| Delta method, ratio covariance, MC propagation | Allocation anchor and Formulation: full covariance, finite denominator, local approximation. | DERIVED Eq. 2.27; proportional numerator/denominator counterexample defeats denominator-only bound. Numerical propagation not executed. |
| Pareto dominance, scalarization, epsilon constraints | [02.6 frontier](02-6-optimization-language.md#frontier-extraction-and-uncertainty-aware-dominance): supported points versus nonconvex frontier. | DERIVED; exact global constrained solutions and an appropriate sweep are required. |
| Frontier algorithm, ties and simultaneous uncertainty | [02.6 Algorithm](02-6-optimization-language.md#algorithm): sorted cost groups, duplicates, O(n log n), separate interval dominance. | DERIVED Algorithm 2.6; uncertainty requires simultaneous bounds, not independent pointwise CIs treated as joint guarantees. |

The main remaining gates are independent mathematical/notation review, primary-source recovery for historical R2.2/R2.3, immutable pins for mutable implementation surfaces, and execution of any checks later chosen for reproduction. Adjacent chapters own floating-point algorithms, full optimizer implementations, scaling experiments, and evaluation design; these cross-references delimit scope instead of claiming those subjects are completed here.
