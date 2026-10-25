---
id: ms.section.64.4
entity_type: section
title: "Causal tracing"
volume: 3
part: 11
chapter: 64
section: 64.4
slug: 64-4-causal-tracing
parent: ms.chapter.64
prev_sibling: ms.section.64.3
next_sibling: ms.section.64.5
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

# 64.4 Causal tracing

## Scope

[DERIVED] Causal tracing estimates finite effects of declared activation, path or feature interventions. Its cheap baseline is first-order attribution patching; its reference is an exact forward intervention under the same donor and background. Acceptance requires agreement on the relevant effect or ranking, not merely a visually plausible circuit. This section owns ablation, counterfactual donors, path restriction, Hessian-vector correction and their validity conditions. It does not infer complete circuit minimality from accurate individual effects.

## Why this exists

[MATHEMATICALLY-DERIVED] A gradient is an infinitesimal local sensitivity. Replacing a complete activation vector is a finite perturbation, which can cross attention, normalization or gate regimes. An accurate gradient can therefore badly estimate the finite intervention. The controlling uncertainty is the downstream response along the entire interpolation segment, not just the activation function at the patched neuron. More first-order samples at the same point do not remove this truncation error.

[PAPER-REPORTED] When Attribution Patching Lies diagnoses this gap and adds Hessian-vector products (HVPs), then composes smaller quadratic steps when a large local correction is unreliable. Its experiments include attention heads, preactivation neurons and residual sites across several small-to-9B open models. The source separately acknowledges that improved component effects do not establish circuit completeness or minimality. [R64.4, §§3, 5](https://arxiv.org/html/2606.09899v1#S3).

## Intuition

[DERIVED] Fix the recipient input and all nonintervened execution rules, and regard the scalar output as a function $M(a)$ of one activation vector. Exact patching evaluates two forwards. Attribution patching keeps only the tangent plane at the recipient. A quadratic correction adds curvature in the donor direction, without storing a dense Hessian. Smaller steps can control the omitted cubic term if the entire path is smooth; no Taylor order repairs a violated smoothness premise automatically.

## Formulation

[DERIVED] Let $a,\delta\in\mathbb R^p$, where $a+\delta$ is the donor activation at the aligned site. Let $g=\nabla M(a)$ and $H=\nabla^2M(a)$. Define

$$
\Delta=M(a+\delta)-M(a),\quad
\widehat\Delta_{\mathrm{AP}}=g^T\delta,\quad
\widehat\Delta_{\mathrm{HVP}}=g^T\delta+\tfrac12\delta^TH\delta.
$$

_(Eq. 64.13)_

[PAPER-REPORTED] Suppose $M$ is twice continuously differentiable on a neighborhood of the segment and its Hessian is Lipschitz there with operator-norm constant $\Gamma_3\ge0$. The source's Taylor result, with local symbols renamed, gives

$$
\Delta=g^T\delta+\tfrac12\delta^TH\delta+R_3,\quad
|R_3|\le\frac{\Gamma_3}{6}\|\delta\|_2^3,\quad
\|H(a+t\delta)-H(a)\|_{\mathrm{op}}\le\Gamma_3t\|\delta\|_2.
$$

_(Eq. 64.14)_

[DERIVED] The bound follows by integrating $\delta^T[H(a+t\delta)-H(a)]\delta$ with weight $1-t$; $\int_0^1t(1-t)dt=1/6$. The norm and constant refer to this score and complete downstream response. A local estimate of $\Gamma_3$ at a few points is a diagnostic, not a certified upper bound on the segment. [R64.4, §3.2, Theorem 1](https://arxiv.org/html/2606.09899v1#S3.SS2).

[DERIVED] For $g^T\delta\ne0$, the source's relative diagnostic is the quadratic-to-linear ratio

$$
r_{\mathrm{curv}}=\frac{|\delta^TH\delta|}{2|g^T\delta|},\qquad
\frac{\max(0,\tfrac12|\delta^TH\delta|-b_3)}{|g^T\delta|}
\le\frac{|\Delta-\widehat\Delta_{\mathrm{AP}}|}{|g^T\delta|}
\le\frac{\tfrac12|\delta^TH\delta|+b_3}{|g^T\delta|},\quad
b_3=\Gamma_3\|\delta\|^3/6.
$$

_(Eq. 64.15)_

[DERIVED] The ratio is unstable when the linear effect is small. Return an absolute error budget or an explicit infinite/undefined diagnostic, rather than dividing by an arbitrary epsilon and interpreting the result as calibrated confidence. Cancellation can make the true effect tiny even if both terms are large. A zero quadratic term does not imply a zero cubic remainder.

[PAPER-REPORTED] For $q$ substeps, $a_j=a+j\delta/q$ and $v=\delta/q$, a composed quadratic estimate is

$$
\widehat\Delta_q=\sum_{j=0}^{q-1}\left[\nabla M(a_j)^Tv+
\tfrac12v^T\nabla^2M(a_j)v\right],\qquad
|\Delta-\widehat\Delta_q|\le\frac{\Gamma_3\|\delta\|^3}{6q^2}.
$$

_(Eq. 64.16)_

[MATHEMATICALLY-DERIVED] Each subsegment has length $\|\delta\|/q$; summing $q$ cubic bounds yields $q/q^3=q^{-2}$. The bound requires a common valid $\Gamma_3$ across all subsegments. If a target error is $\varepsilon>0$ and that bound is genuinely known, $q\ge\sqrt{\Gamma_3\|\delta\|^3/(6\varepsilon)}$ suffices after integer rounding. This is not a claim that empirical stability supplies such a certificate. [R64.4, §3.3](https://arxiv.org/html/2606.09899v1#S3.SS3).

```figure
{
  "id": "fig-64.12",
  "kind": "calculator",
  "title": "Conditional multi-step Taylor remainder",
  "caption": "Executes Eq. 64.16 for assumed smooth-path bounds. A sampled curvature estimate is not a certified Hessian-Lipschitz bound; gate crossings invalidate this guarantee.",
  "alt": "An analytical calculator with explicit inputs. Executes Eq. 64.16 for assumed smooth-path bounds. A sampled curvature estimate is not a certified Hessian-Lipschitz bound; gate crossings invalidate this guarantee.",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-64.16",
  "spec": {
    "equation": "64.16",
    "tex": "b_q=\\Gamma_3\\|\\delta\\|^3/(6q^2)",
    "inputs": [
      {
        "symbol": "smooth",
        "label": "assumed Hessian Lipschitz bound",
        "default": 6,
        "min": 0,
        "max": 100,
        "format": "fixed2"
      },
      {
        "symbol": "radius",
        "label": "intervention Euclidean norm",
        "default": 1,
        "min": 0,
        "max": 10,
        "format": "fixed2"
      },
      {
        "symbol": "steps",
        "label": "substeps q",
        "default": 5,
        "min": 1,
        "max": 100,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "bound",
        "label": "absolute remainder bound",
        "formula": "smooth*pow(radius,3)/(6*pow(steps,2))",
        "format": "fixed3"
      }
    ]
  },
  "placement": "rail",
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] The HVP procedure differentiates the scalar score with respect to the patched activation with the gradient graph retained. Differentiating $g^T\delta$ gives $H\delta$ for a fixed donor direction; the scalar correction is $\delta^T(H\delta)/2$. Multi-step HVP repeats this at interpolated activations. It does not construct all $p^2$ Hessian entries. Screening by a curvature diagnostic can allocate corrections to candidates whose first-order effects are least reliable. [R64.4, §§3.2-3.3, 4.4](https://arxiv.org/html/2606.09899v1#S3).

[DERIVED] Activation patching, zero ablation, donor resampling and path patching are distinct intervention families. Zero ablation sets a site to a reference that may be far from its population. Resampling uses a donor distribution that may retain unwanted correlations. Path patching admits the changed signal only through chosen downstream edges while other branches are fixed to a reference run; this measures the restricted path policy, not the full activation effect. A path result must record where states are recomputed and where they are restored. A single clean/corrupt pair does not define a population mechanism.

[MATHEMATICALLY-DERIVED] The smoothness boundary is substantive. For $M(a)=\max(0,a)$, $a=-1/2$ and $\delta=1$, local gradient and Hessian are zero, yet $\Delta=1/2$. The segment crosses a kink. Top-$k$ and positive-threshold JumpReLU gates can change support or jump; a local quadratic model can miss that event. Finite HVP agreement on a few smooth sites does not validate a guarantee across these gates.

[MATHEMATICALLY-DERIVED] Joint circuits also contain interactions. For two scalar sites, $M(a_1,a_2)=a_1a_2$ at $(0,0)$, each individual patch to one gives zero, but patching both to one changes the score by one. Summing independently measured effects omits cross terms. Conversely, a known stacked joint direction can have its quadratic form measured by one joint HVP; a general claim that every joint question requires explicitly forming all pairwise Hessian entries would be too strong. Component ranking and joint circuit validation remain separate tasks.

```figure
{
  "id": "fig-64.13",
  "kind": "diagram",
  "title": "Finite effects require a path and a background policy",
  "caption": "Exact forward effects are the reference. First-order and quadratic estimates share the same intervention contract; nonsmooth paths and joint interactions require separate treatment.",
  "alt": "Text equivalent: Recipient and aligned donor. Site and background execution policy. Exact finite patch effect. Gradient directional estimate. HVP or composed substeps. Smoothness and held-out effect checks. Arrows encode the stated dependencies, not measured causal strengths.",
  "evidence": "DERIVED",
  "source": [
    "DERIVED:eq-64.13",
    "DERIVED:eq-64.16"
  ],
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "pair",
        "kind": "dataset",
        "label": "Recipient and aligned donor"
      },
      {
        "id": "policy",
        "kind": "boundary",
        "label": "Site and background execution policy"
      },
      {
        "id": "exact",
        "kind": "metric",
        "label": "Exact finite patch effect"
      },
      {
        "id": "first",
        "kind": "process",
        "label": "Gradient directional estimate"
      },
      {
        "id": "second",
        "kind": "process",
        "label": "HVP or composed substeps"
      },
      {
        "id": "check",
        "kind": "branch",
        "label": "Smoothness and held-out effect checks"
      }
    ],
    "edges": [
      {
        "from": "pair",
        "to": "policy",
        "label": "construct delta"
      },
      {
        "from": "policy",
        "to": "exact",
        "label": "forward intervention"
      },
      {
        "from": "policy",
        "to": "first",
        "label": "local approximation"
      },
      {
        "from": "first",
        "to": "second",
        "label": "curvature correction"
      },
      {
        "from": "exact",
        "to": "check",
        "label": "reference"
      },
      {
        "from": "second",
        "to": "check",
        "label": "compare"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 64.4 - Bounded finite-effect approximation with exact audit.** [DERIVED] Inputs are a scalar $M$, fixed $(a,\delta)$, budgets $q_{\max}$ and $J_{\mathrm{exact}}$, and predeclared error criteria. Outputs are an audited estimate or inconclusive status. This adaptation retains exact comparisons instead of treating a diagnostic as a proof.

$$
\begin{aligned}
1.&\quad \text{validate donor/site, finite states and differentiability contract};
 \quad q\leftarrow1;\\
2.&\quad v\leftarrow\delta/q,\quad s_q\leftarrow0;\\
3.&\quad j=0,\ldots,q-1:\quad a_j\leftarrow a+jv,\quad
 g_j\leftarrow\nabla M(a_j),\quad t_j\leftarrow\nabla_{a_j}(g_j^Tv);\\
4.&\quad s_q\leftarrow s_q+g_j^Tv+\tfrac12v^Tt_j;\quad
 \operatorname{finite}(s_q)=0\Rightarrow\operatorname{return}(\mathrm{failed});\\
5.&\quad \text{on preselected audit cases: }\Delta\leftarrow M(a+\delta)-M(a),
 \quad e_q\leftarrow|s_q-\Delta|;\\
6.&\quad \text{if declared audit/bound criterion passes, return }(s_q,q,\mathrm{scope});\\
7.&\quad 2q\le q_{\max}\Rightarrow(q\leftarrow2q,\text{return to 2});
 \quad\operatorname{return}(\mathrm{inconclusive}).
\end{aligned}
$$

[DERIVED] Step 4 is inside the loop of step 3; exact-audit cases are fixed before estimates are seen. No empirical audit establishes an untested global bound. Each substep needs a forward and higher-order reverse differentiation; memory includes the retained autograd graph, not a $p\times p$ Hessian. Total work is linear in $q$ per candidate in the counted differentiation boundary. Auditing every candidate exactly removes the intended screening savings; choose the audit sample and unresolved-risk rule explicitly. Failure to fit the differentiation graph in memory is a resource failure, not a zero effect.

## Implementation

[DERIVED] PyTorch is the relevant model/autograd framework. The donor difference must be detached from the recipient differentiation graph when it is treated as a fixed intervention vector. A hook that returns a detached score or an inference-only execution path can silently destroy higher-order derivatives. The source uses TransformerLens hooks; support for a fused kernel's second derivatives cannot be inferred from successful first-order inference. No HVP implementation was executed by this edition. [R64.4, §4.1](https://arxiv.org/html/2606.09899v1#S4.SS1).

[DERIVED] Accumulate scalar dot products in a specified stable dtype and compare with finite-difference directional checks at several step sizes when implementing. Small steps face roundoff; large steps face truncation. Record fallback attention/kernel paths, peak memory, per-component and amortized costs, and synchronization. The runtime advantage of batching first-order scores does not automatically carry over to arbitrary independent HVP directions.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The source evaluates GPT-2, Pythia variants, Qwen2.5-1.5B, Gemma-2-2B/9B and Llama-3.1-8B. IOI uses 50 templates, Greater-Than 200 prompts and factual completion 20 prompts in the base description, with additional selected sets for some models. Corruptions include name swaps, random-token substitutions, resampling and zero references in separate analyses. The main score is correct-next-token log probability. Attention sites use pre-output-projection head activations; preactivation MLP analyses sample 256 neurons/layer, while some gated-model analyses use full MLP outputs. Metrics and sample sizes must stay attached to their site and task. [R64.4, §4.1, Appendix E](https://arxiv.org/html/2606.09899v1#S4.SS1).

[PAPER-REPORTED] Table 3's matched comparison uses 20 Pythia-410M prompts and prompt bootstrap intervals. Its top-five relative error averages absolute effect error for the five largest exact effects and normalizes by the exact-effect range. The paper also reports single-L40S timing with 100 examples for a selective edge workflow; that timing is not the same workload as all component-ranking experiments. Exact checkpoint hashes, all precision/kernel settings and a pinned runnable release were not established in this inspection. [R64.4, Table 3, Appendix E.6](https://arxiv.org/html/2606.09899v1#S4.T3).

## Observations

**What the paper claims.** [PAPER-REPORTED] Table 3 reports attention error 4.4% [3.6,5.2] for attribution patching versus 1.0% [0.7,1.3] for HVP, and preactivation-neuron error 35.2% [31.1,39.3] versus 11.7% [9.4,14.0], at its stated cost ratio 1 to 3. These improvements apply to that matched protocol. [R64.4, Table 3](https://arxiv.org/html/2606.09899v1#S4.T3).

**What the evidence shows.** [DERIVED] The quadratic, ReLU-crossing and joint-product counterexamples establish different mathematical boundaries. The source's negative Appendix E.8 conditions additionally prevent treating improved individual-effect error as universal joint-circuit fidelity. These are not failures that can be removed by relabeling the metric.

**What we infer.** [DERIVED] Downstream curvature can matter enough to change a candidate ranking; quadratic correction is a plausible allocation of additional compute when smoothness and audit evidence support it. It does not follow that the correction always improves a jointly pruned circuit. [DERIVED] Prefer the cheapest estimator that meets held-out finite-effect error and ranking requirements. Escalate to substeps or exact patches when curvature, gate changes or audit failures are material. If exact patches fit the workload budget, their direct estimand can dominate an elaborate approximation. Failed joint validation reverses a circuit claim even when individual rankings improve.

**What remains unknown.** [PAPER-REPORTED] The paper reports a Pythia IOI regime where a single HVP overshoots. More importantly, Appendix E.8's Llama-8B IOI circuit-preservation ratio is 0.969 for EAP, 0.939 for HVP and 1.376 for five-step MS-HVP, with corresponding normalized degradation 0.031, 0.060 and 0.379. An overshooting score above one is not automatically a more faithful mechanism. These negative joint-circuit results bound the headline component-level gains. [R64.4, §4.2, Appendix E.8](https://arxiv.org/html/2606.09899v1#A5.SS8).

## Failure modes

[DERIVED] Off-support donors can produce a real software effect with unclear semantic meaning. Frozen-path patching can be misreported as full mediation. Near-zero normalizers inflate relative errors; declare absolute alternatives. Piecewise-smooth gates violate the global Taylor contract. Curvature estimates can underestimate unobserved interior peaks. A graph selected using the same exact effects used for evaluation leaks its acceptance target. Joint interactions defeat additive rankings, and numerical overshoot defeats a naive higher-is-better faithfulness rule.

## Siblings

```figure
{
  "id": "fig-64.14",
  "kind": "compare",
  "title": "Match approximation cost to the finite-effect target",
  "caption": "All methods must use the same donor, site, background and scalar score. More differentiation is justified only by a better held-out acceptance result.",
  "alt": "Text equivalent: All methods must use the same donor, site, background and scalar score. More differentiation is justified only by a better held-out acceptance result.",
  "evidence": "DERIVED",
  "source": [
    "DERIVED:eq-64.13",
    "DERIVED:eq-64.16"
  ],
  "spec": {
    "axis": "Match approximation cost to the finite-effect target",
    "columns": [
      {
        "id": "exact",
        "label": "Exact patch"
      },
      {
        "id": "ap",
        "label": "First order"
      },
      {
        "id": "hvp",
        "label": "Composed HVP"
      }
    ],
    "rows": [
      {
        "dimension": "Computation",
        "values": {
          "exact": "Forward per candidate intervention",
          "ap": "Shared gradient where compatible",
          "hvp": "Repeated retained-graph derivatives"
        }
      },
      {
        "dimension": "Approximation boundary",
        "values": {
          "exact": "Intervention validity",
          "ap": "Finite-step curvature ignored",
          "hvp": "Smooth path and remaining cubic error"
        }
      },
      {
        "dimension": "Reversal condition",
        "values": {
          "exact": "Too many candidates for budget",
          "ap": "Exact audit fails tolerance",
          "hvp": "Gates, memory or joint validation fail"
        }
      }
    ]
  },
  "placement": "rail",
  "anchor": "siblings"
}
```

[DERIVED] Integrated path-gradient methods approximate a different integral of local first derivatives and require their own quadrature/cost contract. Path-specific causal tracing changes which branches transmit the perturbation. Neither should be compared solely through an unlabeled number of backward passes.

## Extensions

### Improvements

[PAPER-REPORTED] The 2026 HVP method changes first-order attribution by adding directional second-order response; multi-step composition changes the expansion radius while increasing cost. The source reports matched-compute comparisons to integrated gradients and other corrections, and preliminary feature-level tests. Its claims do not remove the need for circuit completeness/minimality experiments or establish behavior beyond its studied model scales. [R64.4, §§4.3-4.5, 5](https://arxiv.org/html/2606.09899v1#S4.SS3).

## Limitations

[DERIVED] Exact patching is exact only for the chosen software intervention, not an all-purpose causal explanation. Smoothness bounds are conditional mathematical guarantees; estimated constants and successful audits are finite empirical evidence. Higher accuracy on individual effects cannot license an untested circuit or safety conclusion. Stop as inconclusive when the budget cannot resolve the approximation or intervention-validity error.

## Reproducibility

[DERIVED] Preserve clean/donor input and alignment, score definition, hooks, recomputed/frozen branches, graph-retention policy, derivatives/dtypes, substep grid, exact audit cases, all failed cases and timing boundary. Pure fixtures check a quadratic, a cubic, a ReLU crossing and a two-site interaction; they do not replicate the paper's neural experiments.

## References

[R64.4] When Attribution Patching Lies, v1, §§3-5, Table 3 and Appendix E. [R64.2-R64.3] Supply the feature/replacement context, not an HVP runtime validation.
