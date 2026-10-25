---
id: ms.section.64.2
entity_type: section
title: "Representation analysis"
volume: 3
part: 11
chapter: 64
section: 64.2
slug: 64-2-representation-analysis
parent: ms.chapter.64
prev_sibling: ms.section.64.1
next_sibling: ms.section.64.3
children: []
prerequisites:
  [
    ms.chapter.2,
    ms.chapter.5,
    ms.chapter.13,
    ms.chapter.14,
    ms.chapter.15,
    ms.chapter.16,
    ms.chapter.17,
    ms.chapter.18,
    ms.chapter.32,
    ms.chapter.61,
    ms.chapter.62,
  ]
downstream: [ms.chapter.65, ms.chapter.66]
related: [ms.chapter.40, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [evaluation, assurance],
    mechanism:
      [causal_intervention, representation_analysis, feature_decomposition],
    feedback_setting: [],
    modality: [text],
  }
papers: []
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: { maturity: active, disputed: false }
evidence_summary:
  {
    labels_used:
      [
        DERIVED,
        MATHEMATICALLY-DERIVED,
        PAPER-REPORTED,
        CODE-VERIFIED,
        ASSUMED,
        NOT-DISCLOSED,
        UNVERIFIED,
      ],
    empirically_observed: false,
  }
word_count_target: 2200
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 64.2 Representation analysis

## Scope

[DERIVED] Representation analysis asks which distinctions a named activation space preserves and which readout or intervention can use them. The baseline compares attention maps or embedding similarity without a specified invariance class. Acceptance requires a declared site, population, normalization, fitted transformations and held-out test; a causal claim additionally requires interventions. Residual-stream and attention execution are prerequisites in Chapters 5 and 13-18. This section owns activation geometry, superposition, directions and similarity as measurements, not a universal semantic coordinate system.

## Why this exists

[MATHEMATICALLY-DERIVED] The same input-output map can admit different internal coordinates. If $h'=Ah$ with invertible $A$, replacing the next operation $g$ by $g'(h')=g(A^{-1}h')$ preserves the computed function. Euclidean distances and individual coordinate meanings can change. Conversely, two models can have similar activation geometry while different downstream maps use it differently. A useful representation statistic must therefore state what transformations it intentionally ignores and what functional claim remains untested.

[PAPER-REPORTED] CTA addresses one missing functional question by tracing a probe target through sparse computations rather than treating a probe's accuracy alone as a mechanistic account. Its four concept datasets are operational definitions; the source itself acknowledges that correlated label distributions can yield stylistic features. This motivates controls on the measurement before interpreting the resulting graph. [R64.1, §§3.1-3.4, Limitations](https://arxiv.org/html/2608.27510v1#S3).

## Intuition

[MATHEMATICALLY-DERIVED] A large attention weight is a coefficient in a vector mixture. A head contributes $o_i=W_O\sum_j a_{ij}v_j$ at position $i$. A token with large $a_{ij}$ can contribute zero when $W_Ov_j=0$, and another token can cancel its contribution. Moreover, changing a token can alter queries, keys, values and later computation simultaneously. Reading $a_{ij}$ as the total causal effect omits these paths. The equation is an explanatory consequence of the canonical attention operator, not a new empirical result.

## Formulation

[DERIVED] At a fixed layer/site, collect $n$ activation rows in $X\in\mathbb R^{n\times d}$ and labels in $y$. For the two class means, a difference-in-means direction and midpoint classifier are

$$
v=\widehat\mu_+-\widehat\mu_-,\quad w=v/\|v\|_2,\quad
s(x)=w^Th(x),\quad
\widehat y=\mathbf1\{s(x)>(\bar s_++\bar s_-)/2\}.
$$

_(Eq. 64.4)_

[DERIVED] All means, centering, the midpoint and direction selection must be fitted on training data. If $v=0$, the normalized direction is undefined and the procedure must report no identified mean direction. A direction does not include an arbitrary sign convention unless positive labels and the threshold are fixed. CTA's Appendix A.2 supplies the source version of this construction; the degeneracy guard here is an explicit book requirement. [R64.1, Appendix A.2](https://arxiv.org/html/2608.27510v1#A1.SS2).

[MATHEMATICALLY-DERIVED] Under the coordinate change $h'=Ah$, the same unregularized linear score uses $w'=A^{-T}w$:

$$
w'^Th'=w^Th,\qquad
\|w'\|_2^2=w^TA^{-1}A^{-T}w.
$$

_(Eq. 64.5)_

[DERIVED] Thus the class of linear readouts is preserved, while an unchanged Euclidean ridge penalty is generally a different inductive bias. A causal direction must transform as an intervention vector $u'=Au$, not as the probe covector $w'=A^{-T}w$. Confusing these two transformation rules makes a seemingly equivalent steering experiment incorrect.

[MATHEMATICALLY-DERIVED] For a centered kernel comparison, let $H_n=I_n-\mathbf1\mathbf1^T/n$, $K=H_nXX^TH_n$ and $J=H_nYY^TH_n$. A book-defined linear CKA statistic is

$$
\operatorname{CKA}(X,Y)=\frac{\langle K,J\rangle_F}{\|K\|_F\|J\|_F},
\qquad \|K\|_F\|J\|_F>0.
$$

_(Eq. 64.6)_

[DERIVED] This algebraic definition compares matched-example Gram geometry; it is not attributed to a newly eligible CKA paper. Orthogonal coordinate changes and nonzero uniform scaling leave it unchanged. General shears need not. If all rows collapse after centering, it is undefined. The $O(n^2)$ Gram storage can be avoided by compatible feature-space trace identities, but the numerical centering and paired-example contract remain. A high value does not identify a downstream causal use or an admissible intervention correspondence.

[MATHEMATICALLY-DERIVED] In the conditional superposition model $h=\sum_{i=1}^K u_i a_i+\eta$ with unit vectors $u_i$, the projection onto feature $j$ is

$$
u_j^Th=a_j+\sum_{i\ne j}(u_j^Tu_i)a_i+u_j^T\eta,\qquad
\left|u_j^Th-a_j\right|\le\mu\sum_{i\ne j}|a_i|+\|\eta\|_2,
\quad \mu=\max_{i\ne j}|u_i^Tu_j|.
$$

_(Eq. 64.7)_

[DERIVED] The bound follows by the triangle and Cauchy-Schwarz inequalities. It explains why a direction can be predictive yet contaminated by co-active features. It assumes the additive model and known coherence; it neither proves a trained network has this representation nor guarantees behavioral control. For $K>d$, mutually orthogonal nonzero vectors are impossible, but sparse activity can keep the sum of interfering magnitudes small.

```figure
{
  "id": "fig-64.6",
  "kind": "calculator",
  "title": "Conditional projection cross-talk bound",
  "caption": "Executes Eq. 64.7 under the stated additive, unit-column model. The inputs are analytical assumptions, not fitted properties of a model.",
  "alt": "An analytical calculator with explicit inputs. Executes Eq. 64.7 under the stated additive, unit-column model. The inputs are analytical assumptions, not fitted properties of a model.",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-64.7",
  "spec": {
    "equation": "64.7",
    "tex": "e_j\\le\\mu A_{-j}+\\|\\eta\\|_2",
    "inputs": [
      {
        "symbol": "coherence",
        "label": "maximum absolute pairwise inner product",
        "default": 0.1,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "activity",
        "label": "sum of other absolute feature activations",
        "default": 5,
        "min": 0,
        "max": 100,
        "format": "fixed2"
      },
      {
        "symbol": "noise",
        "label": "residual norm bound",
        "default": 0.2,
        "min": 0,
        "max": 10,
        "format": "fixed2"
      }
    ],
    "outputs": [
      {
        "symbol": "error",
        "label": "projection error upper bound",
        "formula": "coherence*activity+noise",
        "format": "fixed2"
      }
    ]
  },
  "placement": "rail",
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] CTA uses last-token residuals and raw normalized difference-in-means directions for attribution. For validation accuracy it instead applies a within-class covariance correction in a top-200 PCA subspace, using an LDA-like inverse covariance direction. The source's main §3.2 also describes Gram-Schmidt orthogonalization, while Appendix A.2 explicitly says raw DIM is the attribution direction and the covariance-corrected direction is evaluation-only. These surfaces must not be silently collapsed into one fitted vector. [R64.1, §3.2, Appendix A.2](https://arxiv.org/html/2608.27510v1#A1.SS2).

[DERIVED] Orthogonality after an imposed Gram-Schmidt procedure cannot by itself establish that the original semantic representations were orthogonal. Likewise, comparing a graph targeted at one direction with accuracy from another requires stating the relationship rather than assuming both metrics share an estimand. To resolve the source ambiguity, an executable replication must save the actual pre/post-correction directions and readout configuration used in every graph and accuracy evaluation. The current chapter reports the source distinction and does not assert that this reconciliation was executed.

[PAPER-REPORTED] For graph-level prediction, CTA averages 35 graph statistics across 100 prompts for each concept-layer pair, then predicts probe validation accuracy. Gradient boosting uses 200 estimators and maximum depth 3; its five-fold split groups by concept-layer. A layer-mean comparator, concept-demeaned target and permutation checks address some depth and concept effects. For a local predictor it uses binary presence of 100 activation-ranked CLT features, 100 prompts and ridge strength 10 selected from a small grid. Presence omits feature magnitude. [R64.1, Appendix A.5](https://arxiv.org/html/2608.27510v1#A1.SS5).

[DERIVED] A group-aware split over concept-layer pairs prevents exact group reuse but does not establish transfer to an unseen concept, model or dataset family: adjacent layers of the same model and the same prompts can remain related. Train-only fitting of PCA, covariance regularization, layer selection and hyperparameter selection is required to avoid optimistic validation. Source grouping should be chosen to match the intended generalization claim, not just the table's row identifiers.

```figure
{
  "id": "fig-64.7",
  "kind": "diagram",
  "title": "Direction, intervention and output use are separate",
  "caption": "A covector reads a score; a vector changes an activation. Coordinate changes preserve their pairing only when each transforms correctly.",
  "alt": "Text equivalent: Residual activation h. Readout covector w. Score w transpose h. Intervention vector u. Downstream computation g. Behavioral outcome. Arrows encode the stated dependencies, not measured causal strengths.",
  "evidence": "DERIVED",
  "source": [
    "DERIVED:eq-64.4",
    "DERIVED:eq-64.5"
  ],
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "h",
        "kind": "tensor",
        "label": "Residual activation h"
      },
      {
        "id": "w",
        "kind": "tensor",
        "label": "Readout covector w"
      },
      {
        "id": "score",
        "kind": "metric",
        "label": "Score w transpose h"
      },
      {
        "id": "u",
        "kind": "tensor",
        "label": "Intervention vector u"
      },
      {
        "id": "g",
        "kind": "model",
        "label": "Downstream computation g"
      },
      {
        "id": "y",
        "kind": "state",
        "label": "Behavioral outcome"
      }
    ],
    "edges": [
      {
        "from": "h",
        "to": "score",
        "label": "read"
      },
      {
        "from": "w",
        "to": "score",
        "label": "pairing"
      },
      {
        "from": "u",
        "to": "h",
        "label": "declared change"
      },
      {
        "from": "h",
        "to": "g",
        "label": "propagate"
      },
      {
        "from": "g",
        "to": "y",
        "label": "task output"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 64.2 - Fit and test a representation measurement.** [DERIVED] Inputs are source-grouped training, validation and final test sets, a site, a readout class and a finite hyperparameter set $\mathcal A$. Output is a frozen measurement and final scores or a degeneracy failure.

$$
\begin{aligned}
1.&\quad \text{fit centering and optional PCA only on }X_{\mathrm{train}};\\
2.&\quad \forall a\in\mathcal A:\quad
 \omega_a\leftarrow\arg\min_\omega\left[\widehat{\mathcal R}_{\mathrm{train}}(\omega)+a\|\omega\|^2\right];\\
3.&\quad a_*\leftarrow\arg\min_{a\in\mathcal A}\widehat{\mathcal R}_{\mathrm{val}}(\omega_a);
 \quad\text{ties follow a fixed order};\\
4.&\quad \operatorname{rank/variance/direction\ guard}=\mathrm{fail}
 \Rightarrow\operatorname{return}(\mathrm{undefined});\\
5.&\quad \operatorname{freeze}(a_*,\omega_{a_*},\mathrm{preprocessing},\mathrm{site});\\
6.&\quad \operatorname{return}\bigl(\widehat{\mathcal R}_{\mathrm{test}},
 \mathrm{source\text{-}grouped\ uncertainty},\mathrm{control\ results}\bigr).
\end{aligned}
$$

[DERIVED] The test set never chooses the direction or its sign. A finite optimizer tolerance and iteration cap must accompany the argmin in an implementation. Dense covariance formation costs $O(nd^2)$ and storage $O(d^2)$; a rank-$r$ PCA readout trades this for the chosen decomposition and $r$-dimensional solve. Inverting an unregularized singular covariance is invalid; use a specified regularizer or pseudoinverse and report it. Hook extraction often dominates wall time and must be budgeted separately from probe fitting.

## Implementation

[DERIVED] PyTorch provides activation hooks and autograd; Hugging Face Transformers supplies architecture-specific module definitions. A residual before normalization, an MLP input after normalization and a block output are distinct sites even at the same layer index. Store $[n,d]$ rows with source and token identifiers, avoid mixing padding with the final real token, and accumulate means/covariance in a declared stable dtype. These are proposed implementation requirements, not a tested guarantee that every model implementation exposes interchangeable hooks.

[CODE-VERIFIED] Static inspection of the CTA repository at commit 46f69f131c1bf327592efcbf733b4d08a9ce2894 found the following. The pinned CTA README names PyTorch, TransformerLens, NNsight and scikit-learn dependencies but does not pin their versions. TransformerLens/NNsight and CTA are outside this book's reference-stack system list and are identified here as source-specific hook tooling rather than generic stack entries. No installation or GPU experiment was run. [R64.10, Setup](https://github.com/vedantpalit/concept-targeted-attribution/tree/46f69f131c1bf327592efcbf733b4d08a9ce2894).

## Experimental design

### Reported experiments

[PAPER-REPORTED] Under the protocol in 64.1, CTA reports graph-to-accuracy prediction across four concepts and layers. Its bootstrap uses 500 out-of-bag group resamples and its permutation test 200 group-aware label shuffles. The source reports an accuracy-predictor Spearman interval $[0.724,0.964]$ and $p<0.005$. Its grouping is the unit of that analysis; it is not an unseen-model replication. The belief layer is selected by the greatest single-step rise in mean positive-class probe score. If reproduced for a new scientific claim, that selection must be kept separate from final evaluation. [R64.1, §§3.4, 4.3, Appendix A.5.1](https://arxiv.org/html/2608.27510v1#S4.SS3).

## Observations

**What the paper claims.** [PAPER-REPORTED] CTA reports Spearman $\rho=0.91$ and $R^2=0.84$ for graph-level prediction of probe accuracy in its main Gemma analysis. Local feature regressions vary by concept; Appendix B discusses sign inversion and a shared truthfulness subgraph. These are predictive associations under the disclosed graph and probe construction. [R64.1, §§4.3-4.4, Appendix B](https://arxiv.org/html/2608.27510v1#S4.SS3).

**What the evidence shows.** [DERIVED] The source bootstrap is over concept-layer groups, while the representation counterexamples in Eqs.64.5-64.7 concern coordinate and readout invariance. Neither supplies an unseen-concept causal test. Imposed orthogonalization cannot serve as independent evidence of preexisting orthogonality.

**What we infer.** [DERIVED] Graph structure can be a useful diagnostic of readout behavior in the studied setting. The direction, label and split details determine what it diagnoses. A successful predictor of probe accuracy is not automatically a causal account of the semantic concept or its downstream use. [DERIVED] Use geometric similarity for an alignment-screening question if its invariances match the intended comparison. Prefer causal interchange tests when the claim concerns substitution or behavioral control. A high similarity with failed held-out interchange, or a probe that fails dataset-held-out labels, reverses a mechanistic interpretation.

**What remains unknown.** [NOT-DISCLOSED] The inspected text does not fully reconcile main-text orthogonalization with Appendix A.2's raw attribution directions, nor establish generalization to held-out concept families. Dataset-origin/style controls do not identify an abstract reasoning variable by themselves.

## Failure modes

[DERIVED] Near-zero variance makes normalized comparisons unstable; report undefined cases. High-dimensional fitting can memorize nuisance features; source-level controls expose it. CKA on mismatched row order compares different experiments. Whitening or PCA fitted globally leaks evaluation data. Coordinate-wise similarity can change under an innocuous basis transform. Attention visualization omits value/output paths and nonlinear downstream response. Correlated feature activity can make a direction look selective until independent combinations are tested.

## Siblings

```figure
{
  "id": "fig-64.8",
  "kind": "compare",
  "title": "Representation statistics have different invariances",
  "caption": "Choose the statistic for its stated invariance and test the causal claim separately. None of these measurements certifies a semantic mechanism.",
  "alt": "Text equivalent: Choose the statistic for its stated invariance and test the causal claim separately. None of these measurements certifies a semantic mechanism.",
  "evidence": "DERIVED",
  "source": [
    "DERIVED:eq-64.4",
    "DERIVED:eq-64.5",
    "DERIVED:eq-64.6"
  ],
  "spec": {
    "axis": "Representation statistics have different invariances",
    "columns": [
      {
        "id": "probe",
        "label": "Linear readout"
      },
      {
        "id": "cka",
        "label": "Centered Gram similarity"
      },
      {
        "id": "interchange",
        "label": "Interchange test"
      }
    ],
    "rows": [
      {
        "dimension": "Object",
        "values": {
          "probe": "Label score from activations",
          "cka": "Matched-example geometry",
          "interchange": "Output under mapped intervention"
        }
      },
      {
        "dimension": "Ignored transformation",
        "values": {
          "probe": "Invertible basis with transformed readout class",
          "cka": "Orthogonal basis and uniform scaling",
          "interchange": "Only mappings explicitly validated"
        }
      },
      {
        "dimension": "Critical failure",
        "values": {
          "probe": "Shortcut labels or regularization mismatch",
          "cka": "Degenerate or mismatched Gram matrices",
          "interchange": "Off-support substitution and incomplete mappings"
        }
      }
    ]
  },
  "placement": "rail",
  "anchor": "siblings"
}
```

[DERIVED] Neuron inspection preserves architectural coordinates and is cheap to name but can mix superposed signals. Learned feature decompositions in [64.3](64-3-feature-decomposition.md) change the analysis basis and incur reconstruction and identifiability obligations. A more interpretable basis is useful only if those obligations improve the intended test.

## Extensions

### Improvements

[PAPER-REPORTED] CTA's feature-level regression and graph-level predictor extend a scalar probe into an inspectable sparse structure. The source's stated limitation is that binary feature presence loses activation geometry and CLT errors hide omitted mechanisms. It proposes broader replication and finer steering experiments, rather than reporting their completion. [R64.1, §5, Limitations](https://arxiv.org/html/2608.27510v1#S5).

## Limitations

[DERIVED] The conditional additive model and linear measurements are deliberately limited. A nonlinear downstream computation can use information not linearly separable at the selected site; a linear probe can recover information that is never used. No single geometric statistic settles these alternatives. Stop at a descriptive representation claim when internal intervention access or donor validity is unavailable; reopening requires those missing observations.

## Reproducibility

[DERIVED] Save every preprocessing transform, covariance estimator, direction, threshold, layer-selection rule and split identifier. Report raw versus corrected direction identities explicitly. Chapter verification includes counterexamples for coordinate transformation, coherence and degenerate measurements; these mathematical checks are distinct from executing CTA or fitting a new probe.

## References

[R64.1] CTA, §§3-5, Appendices A-B and E. [R64.10] Official CTA README. Earlier residual and attention foundations are linked through the prerequisite chapters rather than introduced as new current research.
