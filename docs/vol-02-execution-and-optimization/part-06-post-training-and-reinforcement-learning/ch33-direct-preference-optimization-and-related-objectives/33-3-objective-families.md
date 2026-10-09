---
id: "ms.section.33.3"
entity_type: "section"
title: "Objective families"
short_title: "Objective families"
volume: 2
part: 6
chapter: 33
section: 33.3
slug: "33-3-objective-families"
parent: "ms.chapter.33"
prev_sibling: "ms.section.33.2"
next_sibling: "ms.section.33.4"
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

# 33.3 — Objective families

## Scope

[DERIVED] Compare actual objectives rather than method names. This section owns IPO, KTO and ORPO, plus substantively different rating-informed, mean-score and block-feedback branches. The baseline is the sequence-sum sigmoid loss of §33.1. Success requires specifying each method's feedback unit, score, coefficient, reduction, additional state, execution cost and validity boundary. No historical performance claim from an excluded pre-window founding paper is used.

## Why this exists

[DERIVED] A common trainer interface can conceal different statistical experiments. A response pair says which candidate won; a desirable/undesirable label says whether one response passes an annotation criterion; a rating gap adds a cardinal quantity; a block construction propagates a response label to multiple local events. These are not interchangeable labels. Likewise, a square loss, bounded sigmoid utility and odds contrast do not differ only in numerical stability.

[DERIVED] An objective comparison becomes uninterpretable when the preferred likelihood term, reference count, length normalization or data unit changes silently. A method can reduce memory by removing a reference while also changing the anchor; it can improve one metric by emphasizing shorter responses; it can bound scalar losses while still producing large parameter gradients. The correct comparison separates these mechanisms before reporting a benchmark ordering.

## Intuition

[MATHEMATICALLY-DERIVED] IPO asks a reference-relative score to reach a finite target. KTO applies opposite bounded utilities to individually labeled responses relative to a detached baseline. ORPO combines chosen likelihood with an odds comparison of mean token probabilities. Rating-informed losses add a target or observation channel. ADPO assigns a separate log-sigmoid to each declared block. Each choice changes what zero loss, saturation or a stationary point means.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $g^\pm$ | Completion log probability minus reference log probability | Nats |
| $n^\pm>0$ | Scored response token counts | Tokens |
| $\bar g^\pm=g^\pm/n^\pm$ | Mean reference-relative score | Nats/token |
| $c\in\{D,U\}$ | Desirable/undesirable single-response label | Category |
| $\lambda_D,\lambda_U>0$ | KTO class weights | Dimensionless |
| $\widehat d$ | Observed rating gap in declared utility units | Reward units |
| $V_r>0$ | Rating-gap noise variance parameter | Squared reward units |

[OFFICIAL-DOCUMENTATION] The pinned TRL IPO path normalizes each response before applying its square target [R33.6, IPO branch]. Reconstruct that convention as

$$
\ell_{\mathrm{IPO}}=\left(\bar g^+-\bar g^- -\frac{1}{2\beta_I}\right)^2,\qquad \beta_I>0.
$$
*(Eq. 33.11)*

[MATHEMATICALLY-DERIVED] Here $\beta_I$ sets a target in inverse mean-score units. A sequence-sum IPO variant uses $g^+-g^-$ instead and is a different contract for variable lengths. The square derivative changes sign above the target, unlike the monotonically decreasing sigmoid pair loss.

[OFFICIAL-DOCUMENTATION] The tagged KTO implementation uses summed response ratios and a detached, nonnegative mismatched-pair baseline [R33.7, `_compute_kl_logps`, `_compute_loss`]. Its objective can be written

$$
\kappa=\operatorname{stopgrad}\!\left[\max\!\left(0,\operatorname{mean}_{\mathrm{gather}}g_\theta(x,\widetilde y)\right)\right],\quad
\ell_{\mathrm{KTO}}=
\begin{cases}
\lambda_D[1-\sigma(\beta_K(g_\theta-\kappa))],&c=D,\\
\lambda_U[1-\sigma(\beta_K(\kappa-g_\theta))],&c=U.
\end{cases}
$$
*(Eq. 33.12)*

where $\widetilde y$ is a response paired with another prompt by the declared mismatch construction, and $\beta_K>0$. Equal-rank averaging assumes equal contributing counts; otherwise a count-weighted gather is needed to represent a global row mean.

[OFFICIAL-DOCUMENTATION] Tagged experimental ORPO uses averaged completion log probabilities for odds, together with a chosen NLL whose decoder-only path includes prompt tokens [R33.8, `odds_ratio_loss`, `concatenated_forward`]. Define

$$
a^\pm=\frac{1}{n^\pm}\log\pi_\theta(y^\pm\mid x)<0,\quad
o(a)=a-\log(1-e^a),\quad
\ell_{\mathrm{ORPO}}=\ell_{\mathrm{NLL,chosen}}+\lambda_O\operatorname{softplus}\!\left[-(o(a^+)-o(a^-))\right].
$$
*(Eq. 33.13)*

where $\lambda_O>0$ weights the odds regularizer; it is not the DPO KL coefficient. Specify the NLL token mask and denominator independently of the completion-odds mask.

```figure
{
  "id": "fig-33.13",
  "kind": "compare",
  "title": "Feedback units and objective anchors",
  "caption": "The matrix of objective contracts separates feedback from reference dependence. Removing a reference does not preserve the fixed-reference reward derivation.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.13",
  "alt": "The matrix of objective contracts separates feedback from reference dependence. Removing a reference does not preserve the fixed-reference reward derivation.",
  "spec": {
    "axis": "Inputs and optimization target",
    "columns": [
      {
        "id": "ipo",
        "label": "IPO"
      },
      {
        "id": "kto",
        "label": "KTO"
      },
      {
        "id": "orpo",
        "label": "ORPO"
      }
    ],
    "rows": [
      {
        "dimension": "Feedback",
        "values": {
          "ipo": "Response pair",
          "kto": "Individually labeled response",
          "orpo": "Response pair plus chosen NLL"
        }
      },
      {
        "dimension": "Anchor",
        "values": {
          "ipo": "Frozen reference",
          "kto": "Frozen reference and detached baseline",
          "orpo": "No frozen reference"
        }
      },
      {
        "dimension": "Score",
        "values": {
          "ipo": "Mean ratio gap at this tag",
          "kto": "Summed response log ratio",
          "orpo": "Odds of geometric token mean"
        }
      },
      {
        "dimension": "Saturation",
        "values": {
          "ipo": "Finite square target",
          "kto": "Bounded utility tails",
          "orpo": "Chosen NLL plus odds contrast"
        }
      }
    ]
  }
}
```

```figure
{
  "id": "fig-33.14",
  "kind": "calculator",
  "title": "IPO finite target and overshoot",
  "caption": "Analytical tagged-normalization surrogate. The derivative is with respect to the mean ratio gap, not the neural parameter vector.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.11",
  "alt": "Analytical tagged-normalization surrogate. The derivative is with respect to the mean ratio gap, not the neural parameter vector.",
  "spec": {
    "tex": "\\ell=(d-1/(2\\beta_I))^2",
    "equation": "33.11",
    "inputs": [
      {
        "symbol": "d",
        "label": "Mean log-ratio gap",
        "default": 1,
        "min": -2,
        "max": 6,
        "step": 0.1,
        "format": "fixed3"
      },
      {
        "symbol": "b",
        "label": "IPO coefficient",
        "default": 0.5,
        "min": 0.1,
        "max": 2,
        "step": 0.1,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "t",
        "label": "Finite target",
        "formula": "1/(2*b)",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "L",
        "label": "Square loss",
        "formula": "(d-1/(2*b))^2",
        "format": "fixed3",
        "emphasis": false
      },
      {
        "symbol": "G",
        "label": "Derivative with respect to gap",
        "formula": "2*(d-1/(2*b))",
        "format": "fixed3",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Finite target",
      "variables": {
        "d": 1,
        "b": 0.5
      }
    },
    {
      "anchor": "mechanism",
      "label": "Below target",
      "variables": {
        "d": 0,
        "b": 0.5
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Overshoot reverses derivative",
      "variables": {
        "d": 3,
        "b": 0.5
      }
    }
  ]
}
```

## Mechanism

### Methodology

#### IPO: finite target, own normalization

[MATHEMATICALLY-DERIVED] IPO's square target penalizes excessive margin as well as insufficient margin. For $d=\bar g^+-\bar g^-$ the derivative is $2[d-1/(2\beta_I)]$. At the target the local pair derivative is zero even though other pairs may require incompatible changes through shared parameters. A larger coefficient moves the target toward zero; it does not multiply the whole loss unless an additional scaling is declared. The finite target can limit a separable pair's runaway margin, but it is not an absolute quality constraint or a proof against dataset shift.

[DERIVED] Preprocessing remains paired: preserve both candidates, reject zero-token responses, and score the same reference. Model evaluation and gradient memory are therefore similar to paired DPO at fixed tokenization and cache policy. The extra square arithmetic is negligible compared with neural scoring; a quality or speed difference cannot be attributed to that arithmetic alone. A comparison between sum-DPO and mean-IPO changes both loss shape and length weighting, so the two factors need separate labels and ablations.

#### KTO: unpaired labels and detached baseline

[MATHEMATICALLY-DERIVED] For a desirable row, holding the baseline fixed, $\partial\ell/\partial g=-\lambda_D\beta_K\sigma(u)[1-\sigma(u)]$ with $u=\beta_K(g-\kappa)$. For an undesirable row it is positive with the analogous sigmoid factor. Both magnitudes vanish in either extreme tail. An extremely misclassified undesirable response can therefore receive a small gradient; bounded scalar loss is not equivalent to robust recovery from arbitrary annotation errors. Class weights and class frequencies jointly determine expected update mass.

[DERIVED] Mismatched responses introduce another batch and another scoring event. Their mean log ratio is not generally the exact $\operatorname{KL}(\pi_\theta\Vert q)$, which would require expectation under the current policy's own conditional response distribution. Detaching the estimate also discards its derivative. The implemented training update is the gradient of a surrogate with that baseline held fixed for the update, rather than the full derivative of a policy-dependent KL functional. Record mismatch permutation, distributed count weighting and random seed. A batch with one label class does not create the missing counterfactual response; it merely contributes the present class's losses.

#### ORPO: chosen likelihood and stable odds

[MATHEMATICALLY-DERIVED] Exponentiating $a=\log\pi(y\mid x)/n$ produces a geometric mean token probability, not a normalized probability mass over responses. The odds transform nevertheless defines a scalar training score for $a<0$. Its derivative is $o'(a)=1/(1-e^a)$, which grows near zero. Thus odds can sharply amplify changes near unit mean token probability. The NLL term anchors preferred likelihood in a way absent from pure relative-margin fitting, while its mask and token weighting determine which events receive that anchor.

[MATHEMATICALLY-DERIVED] Evaluate the complement in the log domain:

$$
\operatorname{log1mexp}(a)=
\begin{cases}
\log1p(-e^a),&a\le-\log2,\\
\log(-\operatorname{expm1}(a)),&-\log2<a<0.
\end{cases}
$$
*(Eq. 33.14)*

At $a=0$ the complement vanishes and odds diverge. Reject invalid or exactly unit-probability inputs under the declared numerical contract; arbitrary clipping creates a modified gradient. No reference-model forward is needed, but paired policy scoring, chosen NLL and vocabulary projection remain. Calling this zero-cost alignment would omit most of its work.

```figure
{
  "id": "fig-33.15",
  "kind": "diagram",
  "title": "Unpaired KTO needs an additional baseline path",
  "caption": "Labels act on individual responses. A separate mismatched-pair path supplies a detached batch baseline; it is not an observed preference pair.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.12",
  "alt": "Labels act on individual responses. A separate mismatched-pair path supplies a detached batch baseline; it is not an observed preference pair.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "rows",
        "kind": "dataset",
        "label": "Desirable or undesirable rows"
      },
      {
        "id": "score",
        "kind": "tensor",
        "label": "Response log ratios"
      },
      {
        "id": "perm",
        "kind": "process",
        "label": "Declared cyclic mismatch"
      },
      {
        "id": "extra",
        "kind": "tensor",
        "label": "Extra policy and reference scores"
      },
      {
        "id": "base",
        "kind": "state",
        "label": "Detached nonnegative baseline"
      },
      {
        "id": "util",
        "kind": "objective",
        "label": "Class-weighted bounded utility"
      }
    ],
    "edges": [
      {
        "from": "rows",
        "to": "score"
      },
      {
        "from": "rows",
        "to": "perm"
      },
      {
        "from": "perm",
        "to": "extra"
      },
      {
        "from": "extra",
        "to": "base"
      },
      {
        "from": "base",
        "to": "util"
      },
      {
        "from": "score",
        "to": "util"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-33.16",
  "kind": "chart",
  "title": "Whole comparison and block feedback disagree",
  "caption": "For two block logits x and minus x, one whole-response logit is zero while the sum of block losses changes with disagreement. This is a mathematical counterexample, not a measured training curve.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.17",
  "alt": "For two block logits x and minus x, one whole-response logit is zero while the sum of block losses changes with disagreement. This is a mathematical counterexample, not a measured training curve.",
  "spec": {
    "type": "line",
    "x": {
      "label": "First block logit",
      "domain": [
        -4,
        4
      ]
    },
    "y": {
      "label": "Negative log likelihood"
    },
    "variables": {},
    "series": [
      {
        "id": "whole",
        "label": "One whole response event",
        "formula": "ln(2)",
        "sample": {
          "from": -4,
          "to": 4,
          "count": 33
        },
        "emphasis": true,
        "dashed": false
      },
      {
        "id": "blocks",
        "label": "Two block feedback events",
        "formula": "ln(1+exp(-x))+ln(1+exp(x))",
        "sample": {
          "from": -4,
          "to": 4,
          "count": 33
        },
        "emphasis": false,
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 0,
        "y": 1.3862943611198906,
        "label": "Two feedback events,2ln2"
      },
      {
        "x": 0,
        "y": 0.6931471805599453,
        "label": "One feedback event,ln2"
      }
    ]
  }
}
```

#### Rating-informed branches: offsets and observations

[PAPER-REPORTED] R33.1 §§3.1–3.2 distinguishes RDPO's reward-offset construction from a joint ranking/rating likelihood. Its guarantees require bounded realizable rewards, controlled policy class and coverage; Theorem4.3 targets effective coefficient $\beta\beta_1/(\beta+\beta_1)$.

[MATHEMATICALLY-DERIVED] Write $d=g^+-g^-$ and rating gap $\widehat d$. Reconstruct the supplied objectives as

$$
\begin{aligned}
\ell_{\mathrm{RDPO}}&=\operatorname{softplus}\!\left[-\left(\beta d-\frac{\beta}{\beta_1}\widehat d\right)\right],\\
\ell_{\mathrm{RIPO}}&=\left(\beta d-\frac{\beta}{\beta_1}\widehat d-\frac12\right)^2,\\
\ell_{\mathrm{MLR}}&=\operatorname{softplus}(-\beta d)+\frac{(\widehat d-\beta d)^2}{2V_r}.
\end{aligned}
$$
*(Eq. 33.15)*

[MATHEMATICALLY-DERIVED] The RDPO offset is subtracted from the policy comparison logit; adding it would implement another method. This follows by writing the modeled original utility gap as the policy-induced augmented utility gap minus the introduced rating contribution. The ML expression instead follows from a Bernoulli ranking channel and a Gaussian gap channel, conditionally independent given the prompt/candidates, with fixed variance $V_r$. Dropping constants in the Gaussian negative log likelihood yields its squared residual. If the same judge creates both labels, conditional independence requires justification rather than an assumption of two independent votes.

[DERIVED] Missing ratings are absent observations, not observed zero gaps. Separate sums over ranking rows and rating rows allow the additive likelihood to use heterogeneous datasets; their denominators and weights must be explicit. RDPO's per-pair offset requires a gap for that pair or a declared estimated gap. Lower variance gives greater rating influence, while misspecified scales can make the rating residual dominate. The statistical guarantee's error-dependent tuning is not available for free in a neural deployment, and restricted-class conditions do not establish optimizer convergence.

#### Mean-score and block-feedback branches

[MATHEMATICALLY-DERIVED] A reference-free mean-score margin branch defines $\bar p^\pm=\log\pi(y^\pm\mid x)/n^\pm$ and

$$
\ell_{\mathrm{mean}}=\operatorname{softplus}\!\left[\gamma-\beta_M(\bar p^+-\bar p^-)\right],\qquad \beta_M>0,\ \gamma\ge0.
$$
*(Eq. 33.16)*

[PAPER-REPORTED] The 2026 UNM comparison instantiates SimPO in this form with its own tuned coefficient and margin [R33.3, Appendix E.2, Table5]. [DERIVED] Its absence of a reference removes reference scoring and anchor support, but it retains a pairwise empirical feedback model. The margin is a soft target and does not guarantee chosen NLL preservation. A coefficient cannot be transferred numerically from sequence-sum DPO without accounting for score units.

[MATHEMATICALLY-DERIVED] For declared nonempty token blocks $I_i^\pm$, each scored under its complete preceding history, let $S_i^\pm=\sum_{t\in I_i^\pm}\log[\pi(y_t^\pm\mid x,y_{<t}^\pm)/q(y_t^\pm\mid x,y_{<t}^\pm)]$. Then

$$
\ell_{\mathrm{block}}=\sum_{i=1}^{m}\operatorname{softplus}[-\beta(S_i^+-S_i^-)],\qquad
\ell_{\mathrm{whole}}=\operatorname{softplus}\!\left[-\beta\sum_i(S_i^+-S_i^-)\right].
$$
*(Eq. 33.17)*

[DERIVED] They coincide for one block; otherwise one describes a product of local feedback probabilities and the other one global event. At two zero block logits their losses are $2\log2$ and $\log2$. A positive and negative block can cancel in the global margin while both remain consequential in the local objective. Assigning a response winner to every block is a supervision assumption, not evidence that each corresponding prefix is better. Different histories have different local normalizers; a generic energy-shift argument cannot erase those terms without specifying the local model.

[PAPER-REPORTED] ADPO studies static token-group and adaptive feedback-count partitions; cADPO reweights rejected tokens using contrastive-estimation scores [R33.2, §§5–6, Appendix C]. [MATHEMATICALLY-DERIVED] For rejected weight $w_t=1-s_t$, replace $S_i^-$ by $\sum_{t\in I_i^-}w_tg_t^-$. These weights need their own preparation cost, provenance and gradient policy. A strong composition into $m$ nonempty blocks requires $m\le n$; padding, short-response handling and unequal feedback lengths must be declared rather than inferred from a hyperparameter name.

## Algorithm

### Algorithm 33.3 — Objective-specific bounded update

[DERIVED] Inputs are an objective identifier, finite rows, pinned scoring contract, coefficients, optimizer, update cap $K$ and attempt cap $A$. Initialize $k=a=0$. Output is a checkpoint and objective-comparison record. State includes reference/cache where required, detached KTO baseline per batch, and rating/block metadata. This dispatch is an explanatory mathematical procedure; it does not assert that all methods share one dataset.

$$
\begin{aligned}
1.&\quad a\leftarrow a+1;\quad D_a\leftarrow\operatorname{next\_finite\_batch};\quad D_a\leftarrow\operatorname{validate\_method\_inputs}(D_a).\\
2.&\quad D_a=\varnothing\ \Longrightarrow\ a<A\ ?\ \operatorname{continue}\ :\ \operatorname{stop\_failed}.\\
3.&\quad (l,h,n)\leftarrow\operatorname{score\_required\_events}(D_a);\quad \mathrm{KTO}\Longrightarrow\kappa\leftarrow\operatorname{detached\_mismatch\_mean}.\\
4.&\quad L\leftarrow\begin{cases}
\operatorname{mean}\ell_{\mathrm{IPO}},&\mathrm{paired\ IPO},\\
\operatorname{mean}\ell_{\mathrm{KTO}},&\mathrm{unpaired\ KTO},\\
\operatorname{chosen\_NLL}+\lambda_O\operatorname{mean}\ell_{\mathrm{odds}},&\mathrm{ORPO},\\
\operatorname{declared\_weighted\_means}(\ell_{\mathrm{rating}},\ell_{\mathrm{block}},\ell_{\mathrm{mean}}),&\mathrm{named\ selected\ branch}.
\end{cases}\\
5.&\quad \neg\operatorname{finite}(L,\nabla L)\ \Longrightarrow\ \operatorname{stop\_with\_failure\_identity}.\\
6.&\quad (\theta,s)\leftarrow\operatorname{optimizer}(\theta,s,\nabla L);\quad k\leftarrow k+1.\\
7.&\quad k=K\ \lor\ a=A\ \Longrightarrow\ \operatorname{save\_terminal};\quad\text{otherwise return to1}.
\end{aligned}
$$
*(Eq. 33.18)*

[DERIVED] The invariant is a method-specific observation/reduction contract. No branch substitutes paired labels for unpaired judgments or missing numerical ratings. Training terminates by finite successful-update or attempt bounds. Scalar losses cost $O(BT)$ after model scoring, except a block structure adds $O(Bm)$ reductions. Extra learned raters, contrastive preparation, mismatched forwards, reference caches and pilots are additional work; ordinary policy-only inference is the final deployment boundary unless the method explicitly retains auxiliaries.

## Implementation

[DERIVED] Hugging Face TRL, **Post-training / RL**, is the inspected realization route [R33.5–R33.8]. IPO needs paired policy/reference scores and counts. KTO needs single-response labels, mismatch scoring and a detached gathered statistic. Experimental ORPO needs paired policy outputs and its chosen NLL path. Fusing a loss must preserve these distinct masks and reductions. Reference-free methods remove reference weights but retain trainable optimizer moments, activation memory and data-parallel gradient communication.

[DERIVED] Resource comparisons record valid training rows, response tokens per branch, padding and auxiliary inference. KTO can consume fewer labeled responses than a paired dataset construction yet score an extra mismatch stream; neither direction implies a universal compute advantage. ORPO can avoid a full frozen reference but still materialize paired logits. ADPO can reuse token scores while adding block reductions; cADPO's external token-weight construction is separate. Ratings or pilot scales are not free because their final policy has no extra inference module.

```figure
{
  "id": "fig-33.17",
  "kind": "hierarchy",
  "title": "Training-only auxiliaries and deployed policy",
  "caption": "The hierarchy separates supervision preparation, score estimation and policy optimization from inference. It does not imply identical cost across methods.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.18",
  "alt": "The hierarchy separates supervision preparation, score estimation and policy optimization from inference. It does not imply identical cost across methods.",
  "spec": {
    "direction": "down",
    "levels": [
      {
        "label": "Supervision",
        "kind": "dataset",
        "note": "Pairs, single labels, gaps or blocks"
      },
      {
        "label": "Auxiliary preparation",
        "kind": "process",
        "note": "Ratings, mismatch or contrastive weights"
      },
      {
        "label": "Required scoring",
        "kind": "model",
        "note": "Policy and optional frozen reference"
      },
      {
        "label": "Method-specific reduction",
        "kind": "objective",
        "note": "Square, utility, odds or likelihood"
      },
      {
        "label": "Final policy",
        "kind": "model",
        "note": "Policy-only generation where declared"
      }
    ]
  }
}
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] ADPO's actual protocol is in R33.2 §6 and Appendix E. The table records the inspected boundary rather than a new experiment.

| Field | Disclosed protocol |
|---|---|
| Models / train | Llama3-8B-Base, Qwen3-8B-Base, Gemma3-12B-PT, DeepSeek-Math-7B; GSM8K train |
| Evaluation | GSM8K8-shot, MATH5004-shot; DPO/cDPO and ADPO/cADPO |
| Budget | LoRA rank16,3epochs, AdamW; beta1; learning rates2e-5 or4e-5 |
| Hardware | Four H100 GPUs; precision and seed count NOT-DISCLOSED |
| Preparation | Contrastive branch trains positive/negative models and samples64responses/problem |
| Ablations | Static/adaptive partition, LoRA rank, beta, scale and length |

[NOT-DISCLOSED] The tagged KTO/ORPO code supplies no matched2026quality comparison under this protocol. The chapter therefore assigns no empirical ranking to those foundation branches.

## Observations

**What the paper claims.** [PAPER-REPORTED] ADPO reports improved main results, while its small adaptive partition counts can degrade performance [R33.2, Tables2–3]. RDPO's trust hyperparameters do not transfer uniformly across model sizes [R33.1, Appendix F.4].

**What the evidence shows.** [DERIVED] Main-result ordering is conditional on preprocessing, preparation cost and tuning. A loss-family name alone does not isolate the mechanism or predict a ranking.

**What we infer.** [MATHEMATICALLY-DERIVED] The objectives above have different stationary points, gradient tails and event definitions. Their coefficients carry different units and cannot be treated as one shared beta.

**What remains unknown.** [UNVERIFIED] Independent replication and fully matched current KTO/ORPO experiments are absent from this chapter's inspected evidence.

## Failure modes

> **Failure mode — Objective aliasing.** [DERIVED] *Symptom:* identical method names produce incompatible targets or gradients. *Cause:* sum/mean, NLL mask or coefficient conventions differ. *Detection:* retain numerical per-row losses and derivatives under the exact contract. *Mitigation:* compare explicit equations and reductions.

> **Failure mode — Pseudo-observations.** [DERIVED] *Symptom:* missing gaps become zero or every winning response block is treated as independently annotated. *Cause:* unobserved feedback is silently manufactured. *Detection:* provenance flags for each channel. *Mitigation:* distinguish actual labels from model assumptions and omit absent channels.

## Siblings

[DERIVED] Fixed-reference DPO models one binary pair event; IPO constrains its score target; KTO uses unpaired criterion labels; ORPO adds a likelihood anchor; mean-score branches remove reference dependence; rating branches add cardinal supervision; block branches change feedback factorization. Prompt-scale margin variants are owned by [§33.5](33-5-bias-and-pathology.md), because their identification and pathology caveats require a complete treatment.

## Extensions

### Improvements

[DERIVED] The eligible2026papers change distinct mechanisms and report different comparisons. RDPO adds ratings with source-stated statistical assumptions; ADPO changes feedback granularity with partition ablations. Neither comparison isolates a universal winner across domains. Contrastive token weighting adds preparation work and needs its own control; a higher composite score does not establish that the block likelihood alone caused it.

## Limitations

[DERIVED] The named family is not exhaustive of every published loss. This section fully treats the canonical IPO/KTO/ORPO branches and the selected eligible descendants, rather than listing uninspected variants. Neural shared parameters, annotation selection and deployment shift remain outside finite scalar objective identities. Unsupported extrapolations are excluded from reviewed claims.

## Reproducibility

[DERIVED] Store objective equation, coefficient units, every mask/denominator, label type, missing-channel policy, mismatch permutation, reference identity, rating/weight provenance, auxiliary budgets and rejection ledger. For block feedback include exact composition/padding and whether the sum is divided by block count. Such division changes response weighting when counts vary. Verification contains unexecuted objective-specific checks.

```figure
{
  "id": "fig-33.18",
  "kind": "chart",
  "title": "The finite IPO target penalizes both sides",
  "caption": "Eq.33.11 analytical betaI=0.5 gives target gap1. These five sampled gap settings have losses4,1,0,1,4. The minimum is finite; bars are objective values, not measured training progress or neural-gradient magnitudes.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.11",
  "alt": "At gaps−1,0,1,2,3 the square objective is4,1,0,1,4. Gap1 minimizes this betaI0.5 surrogate; overshooting also raises loss.",
  "spec": {
    "type": "bar",
    "categories": [
      "gap−1",
      "gap0",
      "gap1",
      "gap2",
      "gap3"
    ],
    "x": {
      "label": "declared mean log-ratio gap"
    },
    "y": {
      "label": "IPO square loss",
      "domain": [
        0,
        4
      ]
    },
    "series": [
      {
        "id": "loss",
        "label": "Finite-target objective",
        "values": [
          4,
          1,
          0,
          1,
          4
        ],
        "emphasis": true
      }
    ]
  },
  "anchor": "reproducibility"
}
```

## References

[R33.1](references.md#r331), [R33.2](references.md#r332), [R33.3](references.md#r333), [R33.5](references.md#r335), [R33.6](references.md#r336), [R33.7](references.md#r337), [R33.8](references.md#r338). Foundational objectives are pinned implementation conventions or explicit mathematical reconstructions, with no pre-window empirical claim.
