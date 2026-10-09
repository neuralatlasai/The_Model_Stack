---
id: "ms.section.33.5"
entity_type: "section"
title: "Bias and pathology"
short_title: "Bias and pathology"
volume: 2
part: 6
chapter: 33
section: 33.5
slug: "33-5-bias-and-pathology"
parent: "ms.chapter.33"
prev_sibling: "ms.section.33.4"
next_sibling: "ms.section.33.6"
children: []
prerequisites: ["ms.chapter.2", "ms.chapter.23", "ms.chapter.31", "ms.chapter.32"]
downstream: ["ms.chapter.34", "ms.chapter.35", "ms.chapter.36"]
related: []
relations: []
axes: {"lifecycle": ["post_training"], "mechanism": ["preference_optimization", "offline_optimization"], "feedback_setting": ["human_preference", "ai_feedback", "verifiable_reward"], "modality": ["text", "image"]}
papers: []
implementations: ["impl.hugging-face-trl"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2000
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 33.5 — Bias and pathology

## Scope

[DERIVED] Diagnose length, candidate-quality, noise, margin and overoptimization pathologies, then give a complete account of prompt-scaled margin objectives and their identification boundary. The baseline is fixed-reference response DPO. Success means separating a fitted comparison score from absolute likelihood, latent annotation noise and deployment quality. This section owns AO/WR and length-normalized WR; it does not promise that a learned scale estimates a true noise parameter.

## Why this exists

[DERIVED] Relative-margin training can improve the modeled comparison while reducing the probability of both observed candidates. Long responses can accumulate more log-ratio change than short ones. Noisy labels can reward an incorrect direction. A strength margin can increase a fitting target without making the annotation reliable. These are different mechanisms, so one aggregate reward curve cannot diagnose them all.

[DERIVED] A flexible temperature or prompt-scale network adds another ambiguity: it can explain a residual by changing units rather than improving the policy. Free scales and free utilities can be unidentifiable from sparse comparisons. Bounds and regularization make optimization well posed in a restricted space, but they are not new observations that reveal latent human uncertainty. A principal-level analysis must state which mathematical quantities are identified and which are merely estimated under architectural restrictions.

## Intuition

[MATHEMATICALLY-DERIVED] A pair margin is a ratio of ratios. It can rise because the chosen response gains mass, the rejected response loses more mass, or probability moves to other responses. Length normalization changes each branch's units. Noise changes the target binary probability. A positive prompt scale changes the comparison's slope, and placing a margin inside versus outside that scale changes its threshold. These mechanisms require separate diagnostics.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $q$ | Frozen reference policy, unchanged from §33.1 | Probability |
| $d_\theta=g^+-g^-$ | Reference-relative response-sum gap | Nats |
| $k$ | Observed preference-strength category | Encoded category |
| $c=\tau m(k)$ | Declared nonnegative strength margin | Reward units |
| $s_\psi(x)>0$ | Prompt-only relative scale; source calls this q | Dimensionless |
| $\widetilde B_i$ | Frozen out-of-fold pilot reward gap | Reward units |
| $0\le\epsilon<1/2$ | Symmetric label-flip probability in a declared model | Ratio |

[MATHEMATICALLY-DERIVED] Consider an analytical three-response path, with the initial policy equal to the reference:

$$
q=(0.4,0.3,0.3),\quad \pi_t=(0.4-0.1t,0.3-0.2t,0.3+0.3t),\quad
\Delta_t=\log\frac{0.4-0.1t}{0.3-0.2t}-\log\frac{0.4}{0.3},\quad 0\le t\le1.
$$
*(Eq. 33.25)*

All masses remain positive and sum to one. The first candidate's likelihood falls from0.4to0.3 while its relative odds against the second rise from4/3to3. This is a counterexample to a universal inference from increased preference margin to increased chosen likelihood; it is not an observed training trajectory.

```figure
{
  "id": "fig-33.25",
  "kind": "calculator",
  "title": "Chosen likelihood can fall while its margin rises",
  "caption": "Analytical three-response probability path from Eq33.25. The slider is a path parameter, not optimizer time or measured model progress.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.25",
  "alt": "Analytical three-response probability path from Eq33.25. The slider is a path parameter, not optimizer time or measured model progress.",
  "spec": {
    "tex": "\\Delta_t=\\log\\frac{0.4-0.1t}{0.3-0.2t}-\\log(4/3)",
    "equation": "33.25",
    "inputs": [
      {
        "symbol": "t",
        "label": "Analytical path position",
        "default": 0.5,
        "min": 0,
        "max": 1,
        "step": 0.1,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "p",
        "label": "Chosen probability",
        "formula": ".4-.1*t",
        "format": "raw",
        "emphasis": true
      },
      {
        "symbol": "r",
        "label": "Rejected probability",
        "formula": ".3-.2*t",
        "format": "raw",
        "emphasis": false
      },
      {
        "symbol": "d",
        "label": "Relative preference margin",
        "formula": "ln((.4-.1*t)/(.3-.2*t))-ln(4/3)",
        "format": "fixed3",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Initial probability vector",
      "variables": {
        "t": 0
      }
    },
    {
      "anchor": "mechanism",
      "label": "Mass moves to other response",
      "variables": {
        "t": 0.5
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Better margin, lower chosen mass",
      "variables": {
        "t": 1
      }
    }
  ]
}
```

```figure
{
  "id": "fig-33.26",
  "kind": "chart",
  "title": "Probability displaced to an unobserved response",
  "caption": "All three analytical masses remain normalized. The unobserved third response gains probability while both compared candidates lose it.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.25",
  "alt": "All three analytical masses remain normalized. The unobserved third response gains probability while both compared candidates lose it.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Analytical path parameter",
      "domain": [
        0,
        1
      ]
    },
    "y": {
      "label": "Response probability"
    },
    "variables": {},
    "series": [
      {
        "id": "chosen",
        "label": "Chosen candidate",
        "formula": ".4-.1*x",
        "sample": {
          "from": 0,
          "to": 1,
          "count": 33
        },
        "emphasis": true,
        "dashed": false
      },
      {
        "id": "rejected",
        "label": "Rejected candidate",
        "formula": ".3-.2*x",
        "sample": {
          "from": 0,
          "to": 1,
          "count": 33
        },
        "emphasis": false,
        "dashed": true
      },
      {
        "id": "other",
        "label": "Other response",
        "formula": ".3+.3*x",
        "sample": {
          "from": 0,
          "to": 1,
          "count": 33
        },
        "emphasis": false,
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 1,
        "y": 0.6,
        "label": "Unobserved mass grows to0.6"
      },
      {
        "x": 1,
        "y": 0.3,
        "label": "Chosen mass falls to0.3"
      }
    ]
  }
}
```

## Mechanism

### Methodology

#### Length and candidate quality

[MATHEMATICALLY-DERIVED] A sequence-sum gap aggregates every valid token. If all chosen tokens receive mean log-ratio change $u^+$ and all rejected tokens $u^-$, then

$$
d_{\mathrm{sum}}=n^+u^+-n^-u^-,\qquad d_{\mathrm{mean}}=u^+-u^-,\qquad
\frac{\partial d_{\mathrm{mean}}}{\partial g_t^\pm}=\pm\frac1{n^\pm}.
$$
*(Eq. 33.26)*

The score change from length is not necessarily a preference for longer text: its direction depends on branch log-ratio changes and annotations. A constant per-token contribution nevertheless creates a length-dependent sum. Dividing each response by its own count changes the feedback model and token gradients. It can reduce one source of score-length coupling while introducing others through selection, truncation and response probability geometry.

[DERIVED] Audit candidate quality along two axes: relative label and absolute task acceptability. A chosen response can be the less harmful of two bad responses; a rejected response can be correct but verbose; both can be invalid under the deployment task. Log the judge's rubric, tie/abstention policy and verifiable outcomes. Pairwise training cannot infer an absolute quality threshold absent additional supervision. Likewise, high chosen log probability does not establish correctness if it reproduces a flawed preferred answer.

#### Noise and margin targets

[MATHEMATICALLY-DERIVED] In an analytical symmetric-flip model with clean binary probability $p$, observed preference probability is $\widetilde p=\epsilon+(1-2\epsilon)p$. Thus

$$
p=\frac{\widetilde p-\epsilon}{1-2\epsilon},\qquad
\ell_{\mathrm{robust}}(z)=\frac{(1-\epsilon)\ell(z)-\epsilon\ell(-z)}{1-2\epsilon},\quad \ell(z)=\operatorname{softplus}(-z).
$$
*(Eq. 33.27)*

The loss expression is an unbiased correction for an oriented clean-label loss under the declared flip mechanism, not ordinary soft-label smoothing. The denominator becomes ill conditioned near one half; unknown, asymmetric or feature-dependent corruption invalidates this simple correction. Finite corrected losses can be negative, so a negative value is not itself a software failure. The tagged trainer exposes this robust convention [R33.6, robust branch]; no universal noise rate is supplied by the implementation.

[MATHEMATICALLY-DERIVED] Ordinary smoothing instead uses a convex combination $(1-\epsilon)\ell(z)+\epsilon\ell(-z)$, whose unconstrained optimum is $z=\log[(1-\epsilon)/\epsilon]$ for $0<\epsilon<1/2$. The two signs encode different goals. A fixed margin uses $\operatorname{softplus}(c-\beta d)$ and shifts the decision threshold without correcting labels. An extreme margin can prioritize already-easy but strong-labeled rows; that is a weighting/target choice, not evidence that those labels deserve greater trust.

#### AO and WR: placement changes the model

[PAPER-REPORTED] UNM separates a prompt-only scale from the policy and freezes it before final training [R33.3, §§3–4]. The following notation uses $s$ for scale to preserve the book's reference-policy symbol $q$.

[MATHEMATICALLY-DERIVED] Define the two comparison scores

$$
\Gamma_{\mathrm{AO}}=\frac{\beta_0d_\theta}{s_\psi(x)}-c,\qquad
\Gamma_{\mathrm{WR}}=\frac{\beta_0d_\theta-c}{s_\psi(x)},\qquad
\ell_M=\operatorname{softplus}(-\Gamma_M).
$$
*(Eq. 33.28)*

For AO a positive score requires $\beta_0d_\theta>cs$; for WR it requires $\beta_0d_\theta>c$. With $c>0$, increasing scale moves AO's threshold but leaves WR's threshold fixed. At the WR threshold the derivative with respect to the reward gap $b=\beta_0d$ is $-1/(2s)$. A larger scale reduces that scalar sensitivity, not necessarily the full parameter-gradient norm, which also depends on $\nabla_\theta b$.

[DERIVED] A heteroskedastic random-utility model can motivate dividing a utility difference by a noise scale. It does not determine whether a recorded strength category is a raw-unit threshold, a local-noise-unit threshold, an ordinal interval or an annotator convention. A proper ordinal likelihood needs category boundaries and tie/selection semantics. AO and WR are explicitly margin-exceedance surrogates here; neither is automatically the normalized likelihood of the observed strength category.

```figure
{
  "id": "fig-33.27",
  "kind": "chart",
  "title": "Margin placement changes scale sensitivity",
  "caption": "Analytical fixed reward gap2 and margin1. AO changes its zero crossing with scale; WR keeps the same raw-unit threshold.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.28",
  "alt": "Analytical fixed reward gap2 and margin1. AO changes its zero crossing with scale; WR keeps the same raw-unit threshold.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Positive prompt scale",
      "domain": [
        0.5,
        2
      ]
    },
    "y": {
      "label": "Comparison score"
    },
    "variables": {
      "b": 2,
      "c": 1
    },
    "series": [
      {
        "id": "ao",
        "label": "Advantage-only score",
        "formula": "b/x-c",
        "sample": {
          "from": 0.5,
          "to": 2,
          "count": 33
        },
        "emphasis": true,
        "dashed": false
      },
      {
        "id": "wr",
        "label": "Whole-residual score",
        "formula": "(b-c)/x",
        "sample": {
          "from": 0.5,
          "to": 2,
          "count": 33
        },
        "emphasis": false,
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 2,
        "y": 0,
        "label": "AO zero crossing"
      },
      {
        "x": 2,
        "y": 0.5,
        "label": "WR remains positive"
      }
    ]
  }
}
```

#### Frozen-scale fitting and identification

[MATHEMATICALLY-DERIVED] A concrete two-stage reconstruction first partitions unique prompts, trains pilot policies excluding each prompt's fold, scores held-out comparison gaps, then fits one shared scale. Let $\mathcal I$ contain eligible comparison rows and $\mathcal U$ all unique training prompts:

$$
\mathcal L_s=\frac1{|\mathcal I|}\sum_{i\in\mathcal I}\operatorname{softplus}\!\left(\frac{c_i-\widetilde B_i}{s_\psi(x_i)}\right)
+\frac{\lambda_s}{|\mathcal U|}\sum_{x\in\mathcal U}(\log s_\psi(x))^2,\quad
\frac12\le s_\psi\le2,\quad \frac1{|\mathcal U|}\sum_x\log s_\psi(x)=0.
$$
*(Eq. 33.29)*

The two denominators intentionally refer to different populations. Comparison multiplicity affects the fit term, while unique prompts define centering and regularization. Evaluation uses frozen centering statistics; recentering on a test panel would change the trained predictor. Holding a prompt out of its pilot's training does not hold it out of the pooled scale fit. The shared network can encode difficulty or pilot misspecification as well as annotation variability.

[MATHEMATICALLY-DERIVED] For one finite prompt graph, let $B$ be the oriented edge-to-node incidence matrix, $r$ arbitrary node utilities, $c$ known edge margins and $t$ the modeled WR comparison logits. The model is

$$
Br=st+c.\quad
v^\top B=0,\ v^\top c\ne0\ \Longrightarrow\ s=-\frac{v^\top c}{v^\top t}.
\qquad
c=Bh\ \Longrightarrow\ r'=\frac{s'}s r+\left(1-\frac{s'}s\right)h\ \text{has the same }t.
$$
*(Eq. 33.30)*

The first implication supplies a unique scale because the model forces $v^\top t=-v^\top c/s\ne0$. Substitution then fixes every edge utility gap, while node offsets remain free on connected components. The second constructs nonidentifiability for any positive $s'$ in the unrestricted model. Therefore identification is equivalent to margins not being a response-potential difference. A nonzero oriented cycle contrast provides the required $v$; a tree's margins can always be integrated into a potential and supply no such contrast. Two edges comparing the same responses at different known margins provide a cycle contrast too.

[DERIVED] This statement concerns exact comparison logits in a model with common prompt scale, strength-independent utilities and known fixed margin units. Individual binary labels are not those logits. One pair per prompt cannot identify a free scale and free utilities; architectural pooling and regularization impose restrictions rather than create missing observations. Additional bounded or policy-induced classes can change necessity, so the unrestricted converse must not be applied blindly to a constrained neural model.

[MATHEMATICALLY-DERIVED] Length-normalized WR replaces $d$ by $g^+/n^+-g^-/n^-$ and calibrates its coefficient to a declared reference length. If $\beta_{LN}=L_0\beta_0$, normalized and sum scores coincide only when both response lengths equal $L_0$. Variable lengths change the objective. Refitting the scale simultaneously changes two components; an improved aggregate result does not isolate either one without a matched control.

```figure
{
  "id": "fig-33.28",
  "kind": "diagram",
  "title": "Pilot exclusion differs from pooled scale fitting",
  "caption": "Each prompt is excluded from its pilot policy training, but all eligible held-out score rows train the global scale. The frozen scale then weights final-policy training.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.29",
  "alt": "Each prompt is excluded from its pilot policy training, but all eligible held-out score rows train the global scale. The frozen scale then weights final-policy training.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "fold",
        "kind": "dataset",
        "label": "Unique-prompt folds"
      },
      {
        "id": "pilots",
        "kind": "model",
        "label": "Excluded-fold pilot policies"
      },
      {
        "id": "scores",
        "kind": "tensor",
        "label": "Out-of-fold comparison scores"
      },
      {
        "id": "scale",
        "kind": "model",
        "label": "One pooled prompt-scale fit"
      },
      {
        "id": "freeze",
        "kind": "state",
        "label": "Frozen scale and centering"
      },
      {
        "id": "final",
        "kind": "process",
        "label": "Final AO or WR policy fit"
      }
    ],
    "edges": [
      {
        "from": "fold",
        "to": "pilots"
      },
      {
        "from": "pilots",
        "to": "scores"
      },
      {
        "from": "scores",
        "to": "scale"
      },
      {
        "from": "scale",
        "to": "freeze"
      },
      {
        "from": "freeze",
        "to": "final"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 33.5 — Bounded prompt-scale training and pathology audit

[DERIVED] Inputs are a finite prompt-grouped dataset, fold assignment, positive coefficient/margin contract, five finite-budget pilots, scale-update cap and final-policy cap. Outputs are frozen scale, final policy and provenance ledger. Initialize all pilot/scale/final counters at zero. This is an explanatory adaptation; no run is claimed.

$$
\begin{aligned}
1.&\quad D_j\leftarrow\{i:f(x_i)=j\};\quad \theta^{(-j)}\leftarrow\operatorname{fit}_{\le K_j}(D\setminus D_j),\ j=1,\ldots,5.\\
2.&\quad \widetilde B_i\leftarrow\beta_0d_{\theta^{(-f(x_i))}}(i);\quad \mathcal I\leftarrow\operatorname{eligible\_finite\_rows}.\\
3.&\quad \mathcal I=\varnothing\ \Longrightarrow\ \operatorname{stop\_no\_scale\_evidence}.\\
4.&\quad \widehat\psi\leftarrow\operatorname{fit}_{\le K_s}(\mathcal L_s);\quad \operatorname{freeze}(\widehat\psi,\mathrm{centering},\mathrm{features}).\\
5.&\quad \theta\leftarrow\operatorname{fit}_{\le K_f}\operatorname{mean}\ell_M(\theta;\widehat\psi);\quad M\in\{\mathrm{AO,WR,LN\!WR}\}.\\
6.&\quad \operatorname{nonfinite}\ \lor\ \operatorname{identity\_mismatch}\ \Longrightarrow\ \operatorname{stop\_failed};\quad\text{no silent scale replacement}.\\
7.&\quad \operatorname{return}(\theta,\widehat\psi,\mathrm{folds},\mathrm{budgets},\mathrm{branch\ likelihoods},\mathrm{task\ audit}).
\end{aligned}
$$
*(Eq. 33.31)*

[DERIVED] The invariant is no pilot trained on its scored prompt and no scale update during final policy fitting. It does not assert that the pooled scale is independently cross-fitted. Every fit has finite update/attempt caps and failure exits. Cost includes all pilots, held-out rescoring, frozen feature extraction, scale optimization and final fit; pilots can be reused across declared variants but their original cost cannot vanish from the study ledger.

## Implementation

[DERIVED] Hugging Face TRL, **Post-training / RL**, realizes the inspected foundation losses [R33.5–R33.8]. R33.3's NeMo-RL implementation is outside this chapter's used §4system route; it is reported only as part of that primary paper's experiment, not claimed as an inspected code realization. The book's scale equations require a prompt-feature head, frozen artifacts and row/prompt reduction distinction independently of framework choice.

[DERIVED] Storage includes pilot checkpoints or reproducible score caches, $O(N)$ pilot gaps, $O(|\mathcal U|d)$ fixed features and small scale-head parameters, in addition to the final trainable model. Data-parallel reductions must preserve comparison and unique-prompt denominators separately. A scale head may disappear from inference while preparation remains expensive. Label-strength features should not enter a prompt-only inference head unless a different model is explicitly intended.

## Experimental design

### Reported experiments

[PAPER-REPORTED] R33.3 §5 and Appendix E disclose the following selected comparison.

| Field | Source protocol |
|---|---|
| Models / data | Llama3.2-1B-Instruct, Llama3.1-8B-Instruct; HelpSteer3/2 |
| Final fit |150updates,batch128,micro1,BF16,4096limit,AdamW1e-6,seed42; full parameters |
| Hardware | A10080GB: one device1B, four8B; separate H200 sensitivity |
| Auxiliaries | Five pilots plus150scale updates; some8B variants use different scale provenance |
| Evaluation |500development,400variant,disjoint800confirmation prompts; frozen Skywork judge; greedy512tokens |
| Uncertainty |10000paired prompt bootstraps, conditional on fixed checkpoints, unadjusted selection |
| Length policy | Overlength pair gets zero weight; no partial-response truncation |

## Observations

**What the paper claims.** [PAPER-REPORTED] Length-normalized WR leads the disclosed selected panels; AO/WR ordering reverses between panels, and shared-reference results do not establish every pairwise method difference [R33.3, §5, Appendices E–G].

**What the evidence shows.** [DERIVED] Pilot cost, scale provenance and checkpoint-conditional uncertainty restrict causal and economic interpretation. The reported panels do not identify a true per-prompt noise scale or training-seed robustness.

**What we infer.** [MATHEMATICALLY-DERIVED] Eqs. 33.25–30 distinguish probability displacement, length units, noise assumptions and graph identification. A fitted scale can vary even without demonstrated latent-noise variation.

**What remains unknown.** [UNVERIFIED] This edition has not independently replicated those results, calibrated scales to human uncertainty or established total cost dominance.

```figure
{
  "id": "fig-33.29",
  "kind": "compare",
  "title": "Different pathologies require different evidence",
  "caption": "These diagnostics are logically distinct. An improving preference fit cannot stand in for all of them.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.30",
  "alt": "These diagnostics are logically distinct. An improving preference fit cannot stand in for all of them.",
  "spec": {
    "axis": "Failure and diagnostic",
    "columns": [
      {
        "id": "likelihood",
        "label": "Displacement"
      },
      {
        "id": "length",
        "label": "Length coupling"
      },
      {
        "id": "noise",
        "label": "Label corruption"
      },
      {
        "id": "scale",
        "label": "Scale ambiguity"
      }
    ],
    "rows": [
      {
        "dimension": "Observable",
        "values": {
          "likelihood": "Both branch likelihoods",
          "length": "Counts and score convention",
          "noise": "Repeated independent labels",
          "scale": "Graph/rank and pilot provenance"
        }
      },
      {
        "dimension": "Cannot infer",
        "values": {
          "likelihood": "Absolute chosen quality",
          "length": "Universal verbosity preference",
          "noise": "Noise rate from one label",
          "scale": "True uncertainty from scale spread"
        }
      },
      {
        "dimension": "Controlled response",
        "values": {
          "likelihood": "Independent task outcomes",
          "length": "Separate normalization control",
          "noise": "Declared corruption model",
          "scale": "Frozen scale and identified scope"
        }
      }
    ]
  }
}
```

## Failure modes

> **Failure mode — Relative success, absolute decline.** [DERIVED] *Symptom:* comparison margin rises while chosen likelihood or task correctness falls. *Cause:* probability displacement or proxy exploitation. *Detection:* retain branch log probabilities, generated outcomes and response lengths. *Mitigation:* use independent outcomes and a declared chosen-likelihood anchor when that is the intended objective.

> **Failure mode — Temperature called truth.** [DERIVED] *Symptom:* fitted scale is reported as measured annotation noise. *Cause:* sparse graph, shared misspecification or length residuals. *Detection:* identification audit and held-out repeated annotations. *Mitigation:* name it a fitted relative scale and retain the latent-noise gap.

[DERIVED] Scale saturation, label imbalance, long-response masking and judge preference for verbosity can all alter effective data weighting. Inspect excluded-row counts by domain and label class. A zero-weight long pair still consumes a loader slot in some protocols; equal update counts then do not imply equal valid comparisons or tokens.

## Siblings

[DERIVED] IPO's finite target controls margin overshoot; smoothing changes a probabilistic target; robust correction assumes a corruption mechanism; fixed margins encode strength; AO/WR additionally alter scale geometry. Their canonical family contracts remain in [§33.3](33-3-objective-families.md). Coverage mismatch in §33.4 cannot be repaired by fitting a temperature on absent responses.

## Extensions

### Improvements

[DERIVED] The eligible2026UNM extension adds learned scaling and length-normalized scoring, with actual panel and control disclosures. Its source explicitly distinguishes restrictions from identification and reports estimator comparisons that change multiple ingredients. A result for the complete estimator is not an isolated attribution to centering, architecture or normalization. No proposed new improvement is substituted for that reported evidence.

## Limitations

[DERIVED] Graph identification assumes exact modeled logits, fixed known margins and one scale shared across a prompt's edges. Binary finite samples add estimation error, and constrained neural classes alter necessity. Noise correction requires known symmetric corruption; length normalization has no universal quality guarantee. Every score remains a proxy unless linked to deployment utility by an independently justified evaluation.

## Reproducibility

[DERIVED] Record both branch scores/counts, chosen NLL, task outcomes, label-strength mapping, noise convention, scale bounds/features/centering, fold assignments, pilot histories, frozen scores, scale fit, zero-weight rows and complete compute ledger. Keep evaluation and training-reference identities distinct: the DPO evaluation opponent is not the initial reference model. Proposed sensitivity experiments live only in verification.md.

```figure
{
  "id": "fig-33.30",
  "kind": "memory-stack",
  "title": "Preference margin can rise while chosen mass falls",
  "caption": "Eq.33.25 analytical probability path:chosen0.4−0.1t,rejected0.3−0.2t,other0.3+0.3t. All mass stays normalized. The ratio margin improves while the chosen response loses absolute probability.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.25",
  "alt": "A unit probability stack moves from chosen0.4/rejected0.3/other0.3 at t0 to0.3/0.1/0.6 at t1. The chosen-to-rejected ratio rises despite falling chosen probability; t is not optimizer time.",
  "spec": {
    "format": "raw",
    "variables": {
      "t": 0.5
    },
    "bars": [
      {
        "label": "Three-response probability measure",
        "segments": [
          {
            "label": "Chosen",
            "kind": "model",
            "formula": ".4-.1*t"
          },
          {
            "label": "Rejected",
            "kind": "model",
            "formula": ".3-.2*t"
          },
          {
            "label": "Unobserved response",
            "kind": "dependency",
            "formula": ".3+.3*t"
          }
        ]
      }
    ],
    "budget": {
      "label": "Normalized total mass",
      "value": 1
    }
  },
  "anchor": "reproducibility",
  "states": [
    {
      "anchor": "formulation",
      "label": "Initial measure",
      "variables": {
        "t": 0
      }
    },
    {
      "anchor": "mechanism",
      "label": "Displaced probability",
      "variables": {
        "t": 0.5
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Relative fit does not identify mass",
      "variables": {
        "t": 1
      }
    }
  ]
}
```

## References

[R33.3](references.md#r333), [R33.6](references.md#r336), [R33.5](references.md#r335). Counterexamples, derivative identities and incidence-matrix proof are explicitly derived; no measured trajectory is fabricated.
