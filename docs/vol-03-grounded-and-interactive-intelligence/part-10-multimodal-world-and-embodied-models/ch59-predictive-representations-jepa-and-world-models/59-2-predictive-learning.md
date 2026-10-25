---
id: ms.section.59.2
entity_type: section
title: "Predictive learning"
volume: 3
part: 10
chapter: 59
section: 59.2
slug: 59-2-predictive-learning
parent: ms.chapter.59
prev_sibling: ms.section.59.1
next_sibling: ms.section.59.3
children: []
prerequisites:
  [
    ms.chapter.17,
    ms.chapter.18,
    ms.chapter.24,
    ms.chapter.38,
    ms.chapter.57,
    ms.chapter.58,
  ]
downstream: [ms.chapter.60]
related: [ms.chapter.42, ms.chapter.48, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [pretraining, inference, evaluation],
    mechanism: [multimodal_generation, predictive_representation, control],
    feedback_setting: [],
    modality: [image, text, audio, video],
  }
papers: []
implementations: [impl.pytorch]
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
        OFFICIAL-DOCUMENTATION,
        ASSUMED,
        NOT-DISCLOSED,
        UNVERIFIED,
      ],
    empirically_observed: false,
  }
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 59.2 - Predictive learning and task-relative information

## Scope

[DERIVED] Reconstruction rewards observation preservation; latent prediction rewards preservation of a learned target. Neither independently selects every distinction useful for action. This section derives the objective-level failure and separates decodability from dynamics that a fresh predictor can learn.

## Why this exists

[DERIVED] An encoder can make future prediction easy by discarding object identity or orientation. It can also retain those variables in directions a co-trained predictor uses poorly. The question is whether retained information supports the specified interventions, horizons and reference costs.

## Intuition

[DERIVED] Floor texture may be irrelevant to a navigation goal but useful for optical flow. A contact surface's appearance may seem a nuisance until it predicts friction. Invariance to transformation T is a claim about the task under T, not merely similar encoder outputs.

## Formulation

[MATHEMATICALLY-DERIVED] A generic joint objective is

$$
 \mathcal J(\theta,\phi)=\mathbb E\|P_\phi(E_\theta(h),A)-E_\theta(Y)\|^2+\lambda\Omega(E_\theta).
$$

_(Eq. 59.6)_

[DERIVED] With lambda=0 a constant encoder/predictor attains zero. Stop-gradient changes derivatives but does not make a constant fixed point impossible. Reconstruction can penalize constant codes if observations differ and the decoder has no side channel, but may spend capacity on irrelevant textures.

[MATHEMATICALLY-DERIVED] For a specified task loss, define

$$
 D_T(E)=\inf_g\mathbb E\ell_T(g(E(h)),Y_T)-\inf_f\mathbb E\ell_T(f(h),Y_T)\geq0.
$$

_(Eq. 59.7)_

[DERIVED] Nonnegativity follows because predictors factoring through E form a subset of all history predictors. This population definition is not an estimator: finite probes need not attain either infimum. Changing target, action support or loss changes the distortion. Reconstruction and decision distortion can rank representations differently.

[MATHEMATICALLY-DERIVED] For paired visual/physical futures and p_m=g(Z_t^m,a_t),

$$
 \sum_{m,n\in\{o,s\}}\|p_m-z_{t+1}^n\|^2
 =2\sum_m\|p_m-\bar z_{t+1}\|^2+\|z_{t+1}^o-z_{t+1}^s\|^2,
 \quad\bar z=(z^o+z^s)/2.
$$

_(Eq. 59.8)_

[DERIVED] Cross-prediction induces a common future target and alignment pressure. It does not prove the privileged encoder captures all relevant state or that alignment preserves every modality-specific cue. Four terms versus one also changes gradient scale unless coefficients and regularization are accounted for.

[MATHEMATICALLY-DERIVED] For a k-coordinate prefix M_k,

$$
 z_t(k)=M_ks_t,\quad\hat s_{t+1}=P(z_t(k),a_t),\quad
 C_k=\|M_k\hat s_{t+H}-M_ks_g\|^2/k,\quad k\geq1.
$$

_(Eq. 59.9)_

[DERIVED] Dividing by k removes the simplest sum-size dependence; it does not equalize semantics or variance. Prefix length counts dimensions, not Shannon bits. Zeroing a suffix does not reduce dense-kernel FLOPs automatically.

```figure
{
  "id": "fig-59.6",
  "kind": "calculator",
  "title": "Dimension and latent cost",
  "caption": "Coordinate-mean cost removes one arithmetic dependence on active dimension; task equivalence and speed remain separate tests.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-59.9",
  "alt": "Coordinate-mean cost removes one arithmetic dependence on active dimension; task equivalence and speed remain separate tests.",
  "spec": {
    "equation": "59.9",
    "tex": "C_{sum}=kv,\\ C_{mean}=v",
    "inputs": [
      {
        "symbol": "k",
        "label": "Active coordinates",
        "default": 32,
        "min": 1,
        "max": 384,
        "format": "integer"
      },
      {
        "symbol": "v",
        "label": "Mean squared coordinate error",
        "default": 0.02,
        "min": 0,
        "max": 1,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "sum",
        "label": "Summed error",
        "formula": "k*v",
        "format": "raw"
      },
      {
        "symbol": "mean",
        "label": "Coordinate-mean error",
        "formula": "v",
        "format": "raw"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[DERIVED] Decodability fits state labels from a latent. Forecastability freezes the encoder and fits a new transition predictor. Control tests action ranking and realized outcomes. A decoder can expose state while its geometry remains difficult for dynamics or misaligned with a planning norm. A fresh predictor limits co-adaptation as an explanation but still depends on architecture and fitting budget.

[PAPER-REPORTED] JEPA-x uses visual and privileged physical encoders, one action-conditioned predictor and four equally weighted within/cross future losses. Physical inputs exclude velocities, forces and goals; histories supply motion. That branch is removed at deployment. Its six-family simulation study increases mean success from 53.6% to 78.2%; rank-controlled fresh-predictor tests retain a forecastability gap, while state regression is not an equivalent improvement. These are privileged-training simulation results, not raw-video-only learning or demonstrated physical transfer. [R59.6, Secs. 4-5; Appendices C-E]

```figure
{
  "id": "fig-59.7",
  "kind": "diagram",
  "title": "Cross-prediction constrains a transition",
  "caption": "Both source histories predict both future targets with a shared action-conditioned predictor. The physical branch exists only during training.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-59.7",
  "alt": "Both source histories predict both future targets with a shared action-conditioned predictor. The physical branch exists only during training.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "v",
        "kind": "node",
        "label": "Visual history"
      },
      {
        "id": "s",
        "kind": "node",
        "label": "Physical history"
      },
      {
        "id": "p",
        "kind": "process",
        "label": "Shared predictor"
      },
      {
        "id": "vt",
        "kind": "state",
        "label": "Visual future"
      },
      {
        "id": "st",
        "kind": "state",
        "label": "Physical future"
      }
    ],
    "edges": [
      {
        "from": "v",
        "to": "p",
        "kind": "flow",
        "label": "source"
      },
      {
        "from": "s",
        "to": "p",
        "kind": "flow",
        "label": "source"
      },
      {
        "from": "p",
        "to": "vt",
        "kind": "flow",
        "label": "both sources"
      },
      {
        "from": "p",
        "to": "st",
        "kind": "flow",
        "label": "both sources"
      }
    ]
  }
}
```

[PAPER-REPORTED] Adaptive Latent Capacity samples a hard sequence-conditioned prefix using a straight-through Gumbel-Softmax surrogate, predicts the full next embedding and regularizes against a masked-capacity mixture. Deployment selects one modal capacity from initial/goal frames for an episode. Its192-dimensional main study reports three-seed SEM with 200 episodes per seed; the toy illustration uses one seed. Training-window and deployment selector inputs differ. Regularizer, prior and selector parameters are tuned; smaller prefixes do not alone establish dense-kernel savings. [R59.3, Sec. 3; Table 1; Appendices B/E]

[DERIVED] The hard-forward/soft-backward estimator is a biased surrogate. Earlier coordinates have greater survival probability, but a variance profile does not establish predictive importance. Rare consequential factors can be dropped if the loss and evaluation do not expose them. When k is selected using future training frames, evaluate the selector's causal deployment input explicitly.

## Algorithm

### Algorithm 59.2 — Audit sufficiency without co-adaptation

[DERIVED] Inputs: frozen encoders, episode-disjoint splits, fixed targets and common action interface. Output: a diagnostic matrix.

[DERIVED] The mathematical transitions below formalize the proposed audit; the numbered notes specify the operators and controls. Every fitting, rollout and evaluation operator has a finite update, example or deadline cap. Invalid inputs return a recorded failure; exhausted evidence returns inconclusive. These transitions are not a claim that the source implementation was executed.

$$
\begin{aligned}
1.&\quad T_E\leftarrow\operatorname{FitTransform}(E(\mathcal D_{\rm train}));\\
2.&\quad (\omega_{E,r},\phi_{E,r})\leftarrow\operatorname{Fit}_{u\le U_{\max}}
(\mathrm{probe}_r,\mathrm{fresh\ predictor};T_E,\mathcal D_{\rm train/val});\\
3.&\quad \mathcal M_{E,r}\leftarrow(\mathrm{probe\ loss},\mathrm{one\text{-}step\ loss},
\mathrm{blind\ rollout\ loss},\mathrm{fixed\text{-}bank\ ranking})_{\mathcal D_{\rm test}};\\
4.&\quad \sum_h w_hb_h=0\Rightarrow R_{E,r}\leftarrow\mathrm{undefined};
\quad\text{otherwise compute Eq.59.10};\\
5.&\quad\operatorname{return}(\{\mathcal M_{E,r},R_{E,r}\},\mathrm{seed\ and\ episode\ groups}).
\end{aligned}
$$

1. Fit normalization/PCA/hyperparameters on training/validation episodes only.
2. Fit matched linear and bounded nonlinear state probes, disclosing capacity and budget.
3. Fit fresh action-conditioned predictors; separate teacher-forced and blind-rollout errors.
4. Compare with persistence; label zero-baseline ratios undefined.
5. Score one fixed action bank before testing optimized planning under matched search budgets.
6. Separate encoder-training, probe and evaluation seeds in uncertainty estimates.

[MATHEMATICALLY-DERIVED] A pooled relative drift is

$$
 R=\frac{\sum_h w_he_h}{\sum_h w_hb_h},\quad w_h\geq0,\quad\sum_h w_hb_h>0.
$$

_(Eq. 59.10)_

[DERIVED] A ratio of sums differs from a mean of episode ratios. Declare the estimator before comparison. Diagnostic fitting cost scales with encoders, heads and seeds; a failed cheap probe can indicate insufficient fitting rather than absent information.

## Implementation

[OFFICIAL-DOCUMENTATION] Pinned LeWM training computes mean squared error against online embeddings, with no target detach in this path, plus SIGReg. Encoder/predictor projectors contain BatchNorm. The inspected default config specifies100epochs and regularizer0.09, while the inspected paper's main recipe uses 10epochs and describes0.1. A checkout without explicit overrides is not an exact paper reconstruction. [R59.10, train.py; config/train/model/lewm.yaml; config/train/lewm.yaml]

[DERIVED] Physical tokens require units, geometry, rotations, missing-object masks and train-only normalization. Padded slots must not participate in attention/pooling. Rotation matrices have SO(3) constraints that arbitrary interpolation can violate. Exported inference graphs must exclude privileged branches and their deployment-unavailable statistics.

[DERIVED] Prefix masking must remain consistent at each rollout step and goal comparison. Predicting a full future and recursively consuming its prefix requires remasking before the next prediction. Sliced kernels change shapes and sometimes normalization, so runtime equivalence must be tested independently of the mathematical mask.

## Experimental design

### Reported experiments

[DERIVED] The two current cases intervene on different variables: physical supervision versus latent capacity. They do not form a common leaderboard or isolate a universal representation principle.

[DERIVED] Experiment59.2 proposes reconstruction, plain latent, anti-collapse latent and cross-predictive arms on a common simulator corpus. Separate appearance and dynamics shifts; include rank-matched and shuffled-action controls, fresh predictors and realized task costs. Price privileged data explicitly.

## Observations

**What the paper claims.** [PAPER-REPORTED] JEPA-x proposes training-time trajectory correspondence to improve forecastability; Adaptive Latent Capacity proposes episode-specific prefix selection [R59.3,R59.6].

**What we infer.** [DERIVED] Anti-collapse supplies diversity, not sufficiency. Eq.59.8 explains why cross-prediction differs from a state decoder.

**What the evidence shows.** [DERIVED] Current simulator studies distinguish decodability, forecastability and adaptive prefix utility.

**Engineering consequence.** [DERIVED] Choose by intervention/task evidence and include supervision, selector tuning and actual runtime implementation in the cost account.

**What remains unknown.** [UNVERIFIED] Prefix retention of rare factors and grounding under changed contact dynamics remain open.

## Failure modes

[DERIVED] Target drift makes losses across checkpoints incomparable. Test-fitted PCA leaks distribution information. Goal-relative probe labels can overstate a deployment representation's usefulness. Lower dimension can simplify one probe without preserving every action effect. Future-conditioned training selectors can exploit information unavailable to their initial/goal deployment version.

```figure
{
  "id": "fig-59.8",
  "kind": "compare",
  "title": "Three measurements can disagree",
  "caption": "These tests expose different failures and should remain separate axes.",
  "placement": "inline",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-59.8",
  "alt": "These tests expose different failures and should remain separate axes.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "d",
        "label": "Decode"
      },
      {
        "id": "f",
        "label": "Forecast"
      },
      {
        "id": "c",
        "label": "Control"
      }
    ],
    "rows": [
      {
        "dimension": "Input",
        "values": {
          "d": "Single frozen latent",
          "f": "History plus action",
          "c": "Candidate futures and goal"
        }
      },
      {
        "dimension": "Hidden failure",
        "values": {
          "d": "Dynamics may be difficult",
          "f": "Goal metric may be wrong",
          "c": "One task hides other factors"
        }
      },
      {
        "dimension": "Control",
        "values": {
          "d": "Shuffled state labels",
          "f": "Persistence and action-free model",
          "c": "Fixed bank and realized task cost"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] @ms.section.59.1 defines sufficiency; @ms.section.59.3 examines anti-collapse estimators. @ms.chapter.55 covers visual information retention; @ms.chapter.60 specifies policy interfaces.

## Extensions

### Improvements and their evidence

[DERIVED] Add cross-prediction when synchronized state supervision improves fresh-predictor/control results; reverse if annotation or transfer cost dominates. Use adaptive prefixes when the actual sliced implementation improves held-out utility/cost; reverse if fixed-prefix controls match it. Add reconstruction only when preserving its extra detail improves decisions at matched budgets.

## Limitations

[DERIVED] No finite probe proves universal sufficiency. Fresh predictors remain finite learners. Simulator labels may omit compliance, wear and sensing effects.

## Reproducibility

[DERIVED] Archive split hashes, all seed levels, normalizers, physical access, selector support and configuration overrides. Do not silently equate pinned defaults and the paper recipe.

## References

[R59.3] Adaptive Latent Capacity, 2609.32921v2. [R59.6] JEPA-x, 2608.24044v3. [R59.10] Pinned source paths and all evidence bounds: @ms.references.59.
