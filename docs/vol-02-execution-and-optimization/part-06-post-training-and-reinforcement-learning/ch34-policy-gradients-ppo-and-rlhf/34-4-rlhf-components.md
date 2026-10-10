---
id: ms.section.34.4
entity_type: section
title: RLHF components
short_title: RLHF components
volume: 2
part: 6
chapter: 34
section: '34.4'
slug: 34-4-rlhf-components
parent: ms.chapter.34
prev_sibling: ms.section.34.3
next_sibling: ms.section.34.5
children: []
prerequisites:
- ms.chapter.2
- ms.chapter.30
- ms.chapter.31
- ms.chapter.32
downstream:
- ms.chapter.35
- ms.chapter.36
- ms.chapter.38
- ms.chapter.39
related: []
relations: []
axes:
  lifecycle:
  - post_training
  mechanism:
  - policy_optimization
  feedback_setting: []
  modality:
  - text
  - code
  - tool_trajectory
  - image
  - video
papers: []
implementations:
- impl.verl
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used:
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - ASSUMED
  - PAPER-REPORTED
  - OFFICIAL-DOCUMENTATION
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 2000
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# 34.4 — RLHF components

## Scope

[DERIVED] This section owns the four RLHF roles: actor, frozen reference policy, critic and reward model. It specifies their data interfaces, parameter ownership, KL regularization, rollout generation and update synchronization. Reward-model fitting remains Chapter 32; four-model physical residency is quantified in §34.6. The artifact is an auditable iteration contract connecting a rollout to its reward, advantage and accepted actor update.

## Why this exists

[DERIVED] Four roles do not necessarily mean four distinct architectures, but they do mean four distinct mathematical functions. The actor samples actions; the reference defines a probability anchor; the critic predicts return; the reward model estimates a preference proxy. Confusing the critic with the reward model conflates expected future score with the score assigned to a completed response. Confusing the collection actor with the reference conflates freshness control with regularization toward a fixed anchor.

[DERIVED] Each role also has a version boundary. Updating the reward model changes the task being optimized. Updating the reference changes the regularizer. Updating the critic changes targets. Updating the actor changes the sampled population. These operations can all be useful, but silently allowing them within one nominally fixed batch makes the optimization result uninterpretable. A transparent implementation keeps the interfaces explicit even when workers share hardware or a common initial checkpoint.

## Intuition

[MATHEMATICALLY-DERIVED] KL regularization charges the actor for moving probability mass away from a reference, measured on the actor's own trajectory distribution. This does not identify a human utility function, and a small KL does not guarantee that the reward model is valid. It controls a probabilistic deviation under a particular direction and support convention. The reward scale and KL coefficient determine the relative price of proxy improvement and policy movement.

[DERIVED] The critic is an efficiency device for credit assignment, not a separate judge of truth. Its target changes when the reward, discount or KL shaping changes. A critic trained on raw outcome reward does not automatically estimate a KL-shaped return. Conversely, a frozen reward model can still be exploited as the actor visits new regions of response space. Accurate reproduction therefore needs both numerical role definitions and the provenance of the judgments that define the proxy.

## Formulation

| Role | Function | Frozen during a basic batch update? |
|---|---|---|
| Actor $\pi_\theta$ | Conditional distribution of assistant actions | No, except collection snapshot $\pi_b$ |
| Reference $\pi_{\rm ref}$ | Probability anchor on identical action events | Yes |
| Critic $v_\phi$ | Expected declared return from a pre-action state | Targets use frozen $\phi_b$; fit can update $\phi$ |
| Reward $R_\psi$ | Scalar proxy for a completed response/process | Yes |

[MATHEMATICALLY-DERIVED] For a fixed reward model, reference and prompt distribution, the regularized trajectory objective is:

$$
J_\beta(\theta)=\mathbb E_{x\sim\mathcal D,y\sim\pi_\theta}[R_\psi(x,y)]-\beta\,\mathbb E_x\mathrm{KL}\!\left(\pi_\theta(\cdot\mid x)\|\pi_{\rm ref}(\cdot\mid x)\right),\qquad\beta\geq0.
$$
*(Eq. 34.13)*

where trajectory probabilities include the declared ending event. The finite supported action process has a common environment law. The KL is actor-to-reference, not the old-to-new drift used to monitor batch reuse.

```figure
{
  "id": "fig-34.19",
  "kind": "calculator",
  "title": "Reward scale sets the price of KL",
  "caption": "Chosen objective values, not a training result. Scaling reward without scaling beta changes the relative regularization strength.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-34.13",
  "alt": "Adjust the declared illustrative inputs; regularized value=a*r-b*k, KL charge=b*k. Chosen objective values, not a training result. Scaling reward without scaling beta changes the relative regularization strength.",
  "spec": {
    "tex": "R_{\\rm shaped}=\\alpha R-\\beta K",
    "equation": "34.13",
    "inputs": [
      {
        "symbol": "r",
        "label": "proxy reward",
        "default": 0.8,
        "min": 0,
        "max": 1,
        "format": "fixed3",
        "step": 0.01
      },
      {
        "symbol": "a",
        "label": "reward scale",
        "default": 1,
        "min": 0,
        "max": 4,
        "format": "fixed3",
        "step": 0.01
      },
      {
        "symbol": "b",
        "label": "KL coefficient",
        "default": 0.1,
        "min": 0,
        "max": 2,
        "format": "fixed3",
        "step": 0.01
      },
      {
        "symbol": "k",
        "label": "trajectory KL in nats",
        "default": 0.5,
        "min": 0,
        "max": 4,
        "format": "fixed3",
        "step": 0.01
      }
    ],
    "outputs": [
      {
        "symbol": "shaped",
        "label": "regularized value",
        "formula": "a*r-b*k",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "charge",
        "label": "KL charge",
        "formula": "b*k",
        "format": "fixed3",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Reference charge",
      "variables": {
        "a": 1,
        "b": 0.1
      }
    },
    {
      "anchor": "mechanism",
      "label": "Reward scale changes objective",
      "variables": {
        "a": 2,
        "b": 0.1
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Scale beta with reward",
      "variables": {
        "a": 2,
        "b": 0.2
      }
    }
  ]
}
```

## Mechanism

[MATHEMATICALLY-DERIVED] Autoregressive factorization gives the KL chain rule. The prefix occupancy belongs to the current actor, not the reference or an arbitrary offline dataset:

$$
\mathrm{KL}(\pi_\theta\|\pi_{\rm ref})=\mathbb E_{y\sim\pi_\theta}\!\left[\sum_t\log\frac{\pi_\theta(a_t\mid s_t)}{\pi_{\rm ref}(a_t\mid s_t)}\right]=\sum_t\mathbb E_{s_t\sim d_\theta}\mathrm{KL}\!\left(\pi_\theta(\cdot\mid s_t)\|\pi_{\rm ref}(\cdot\mid s_t)\right).
$$
*(Eq. 34.14)*

where the occupancy notation includes survival to decision $t$ for variable-length episodes: each term is the survival probability $\Pr_\theta(H\ge t)$ times the conditional state expectation given survival, with a zero-survival term defined as zero. It is not an unweighted average over surviving prefixes. Reference probability must be positive wherever the actor has mass. A sum over detached old prefixes is a different surrogate away from the behavior policy.

```figure
id: fig-34.20
kind: diagram
title: Four roles, one versioned iteration
caption: Every batch binds all four versions. Physical sharing does not remove their different mathematical interfaces.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-34.13
alt: The information path is Actor snapshot, then Reward model, then Reference, then Frozen critic, then Actor update, then
  Version seal. Every batch binds all four versions. Physical sharing does not remove their different mathematical interfaces.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: model
    label: Actor snapshot
    sub: generate assistant actions
  - id: n1
    kind: model
    label: Reward model
    sub: score declared outcome
  - id: n2
    kind: model
    label: Reference
    sub: score identical actions
  - id: n3
    kind: model
    label: Frozen critic
    sub: predict shaped returns
  - id: n4
    kind: objective
    label: Actor update
    sub: detached advantages
  - id: n5
    kind: boundary
    label: Version seal
    sub: checkpoint and transfer
  edges:
  - from: n0
    to: n1
  - from: n1
    to: n2
  - from: n2
    to: n3
  - from: n3
    to: n4
  - from: n4
    to: n5
```

[MATHEMATICALLY-DERIVED] Let $k_\theta(y)=\log\pi_\theta(y|x)-\log\pi_{\rm ref}(y|x)$ and $S_\theta=\nabla\log\pi_\theta(y|x)$. Differentiation includes both trajectory occupancy and the explicit log-policy inside the penalty:

$$
\nabla J_\beta=\mathbb E_{\pi_\theta}[(R_\psi-\beta k_\theta-b)S_\theta]-\beta\mathbb E_{\pi_\theta}[S_\theta]=\mathbb E_{\pi_\theta}[(R_\psi-\beta k_\theta-b)S_\theta].
$$
*(Eq. 34.15)*

where the last equality uses normalized supported trajectory probabilities, a detached prompt-only $b=b(x)$ in this whole-trajectory expression, and fixed reward/reference assumptions. Per-decision state-only baselines require the reward-to-go decomposition. Conditional KL autograd on detached prefixes does not automatically supply occupancy derivatives.

[MATHEMATICALLY-DERIVED] A practical collection step can assign $-\beta\log(\pi_b/\pi_{\rm ref})$ to sampled actions and add terminal proxy reward. At the collection policy, an appropriately constructed reward-to-go score estimator represents the local regularized objective. Reusing those detached rewards at later actor parameters is an approximation. Alternatively, a direct conditional KL loss differentiates current distributions on recorded states; that captures conditional probability derivatives but generally omits how the current actor changes the distribution of those states. The implementation must state which surrogate it uses and whether a separate score contribution supplies occupancy effects.

[DERIVED] Reference evaluation requires the same tokenizer, conditioning stream, legal action interpretation and numerical temperature convention as the actor objective. A base checkpoint with a different chat template is not a harmless anchor substitute. If the reference assigns zero mass to legal actor actions, the forward KL is infinite; smoothing it changes the regularizer and must be recorded. Outcome reward normalization, clipping and uncertainty penalties likewise define a new proxy rather than merely improve its numerical presentation.

$$
\beta_{k+1}=\operatorname{clip}\!\left(\beta_k\exp\!\left(\eta_\beta(\widehat K_k/K_*-1)\right),\beta_{\min},\beta_{\max}\right).
$$
*(Eq. 34.16)*

where this is a declared illustrative feedback controller with positive $K_*$ and bounded coefficient range, not an attributed implementation or a hard KL guarantee. Delayed/noisy measurements and actor updates can overshoot the target.

```figure
id: fig-34.21
kind: compare
title: Two probability anchors
caption: These anchors can initially share weights and still serve different contracts.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-34.14
alt: 'Comparison on Reference versus collection. Purpose: ref=regularized objective anchor, old=sampling measure and reuse
  diagnostics. Lifetime: ref=fixed unless explicit objective change, old=renewed at collection boundary. Typical ratio: ref=actor/reference
  for reward regularization, old=current/behavior for update surrogate'
spec:
  axis: Reference versus collection
  columns:
  - id: ref
    label: Frozen reference
  - id: old
    label: Collection actor
  rows:
  - dimension: Purpose
    values:
      ref: regularized objective anchor
      old: sampling measure and reuse diagnostics
  - dimension: Lifetime
    values:
      ref: fixed unless explicit objective change
      old: renewed at collection boundary
  - dimension: Typical ratio
    values:
      ref: actor/reference for reward regularization
      old: current/behavior for update surrogate
```

[DERIVED] Sharing a backbone between actor and critic introduces gradient coupling. The total update then changes actor probabilities through the value loss as well as the clipped actor loss. Separate models avoid that direct coupling but consume more resources. Parameter-efficient adapters can share frozen storage only if the runtime actually aliases it; independent model objects can duplicate identical base weights. These physical details are accounted for in §34.6 rather than inferred from role names.

## Algorithm

### Algorithm 34.4 — four-role RLHF transaction

[DERIVED] Algorithm 34.4 consumes a versioned prompt/environment distribution, four model roles, reward/KL specification and a finite iteration budget. State contains role hashes, optimizer states and accepted checkpoints. Output is a sequence of audited collection/update transactions.

$$
\begin{aligned}
&1.\quad \text{freeze }(\theta_b,\phi_b,\psi,\theta_{\rm ref})\text{ and all processor/reward versions for this batch.}\\
&2.\quad \mathcal B\leftarrow\text{Algorithm 34.1 under the declared behavior law}.\\
&3.\quad R_i\leftarrow R_\psi(x_i,y_i);\ k_{it}\leftarrow\ell_{b,it}-\ell_{{\rm ref},it}.\\
&4.\quad r_{it}\leftarrow-\beta k_{it}+\mathbf1\{t=H_i\}R_i\text{ for the declared completed-outcome task}.\\
&5.\quad \text{resolve censored episodes separately; compute critic targets for this shaped return.}\\
&6.\quad (\theta,\phi)\leftarrow\text{Algorithm 34.3 with detached targets and frozen role versions}.\\
&7.\quad \text{evaluate proxy, independent quality and drift; apply predeclared acceptance rule.}\\
&8.\quad \text{seal checkpoint; acknowledge weight transfer before collecting under its new behavior identity.}
\end{aligned}
$$

[DERIVED] The invariant binds every reward and score to one action event and role version. A finite outer iteration count and finite inner update cap guarantee stopping. Missing reward output, unsupported reference actions and ambiguous censoring produce named failures. If the behavior differs from the scored policy, step 4 is not automatically an on-policy KL estimator and needs the §34.2 correction/approximation declaration. Resource accounting includes all four forwards, critic/actor backward passes, external evaluation and synchronization.

```figure
id: fig-34.22
kind: matrix
title: Role permissions
caption: Rows are actor, reference, critic and reward. Columns are sampling actions, trainable in the transaction, frozen
  score service. A one denotes the basic separate-model contract.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-34.13
alt: Each filled cell denotes an admitted relationship. Rows are actor, reference, critic and reward. Columns are sampling
  actions, trainable in the transaction, frozen score service. A one denotes the basic separate-model contract.
spec:
  rows: 4
  cols: 3
  pattern: explicit
  cells:
  - - 1
    - 1
    - 0
  - - 0
    - 0
    - 1
  - - 0
    - 1
    - 0
  - - 0
    - 0
    - 1
  rowLabel: actor / reference / critic / reward
  colLabel: sample / train / frozen score
  legend: Filled cells denote admitted relationships; inspect the caption for axis identities.
```

## Implementation

[DERIVED] Implementation route: **verl** (reference-stack §4 #37, **RL post-training**; §4.1 **Post-training / RL**), pinned at v0.9.1. The role-specific mechanism and its evidence boundary are stated below.

[DERIVED] Cache frozen reference scores only when token identities, contexts, processors and reference version match. Cache reward scores only when reward inputs and version match. A shared prompt with a changed response cannot reuse its prior outcome score. Critic predictions used in targets are pre-update values; recomputing them after fitting changes the target itself. Store raw reward, transformations, per-action KL charges and final return separately so an auditor can reconstruct the scalar seen by the actor.

[DERIVED] Reward-model uncertainty is an additional measured quantity, not a calibrated error probability by default. Subtracting it can discourage unsupported regions, but an uncertainty estimator may itself be poorly calibrated or systematically reward familiar wording. Independent evaluation should include prompt-level comparisons and human-adjudicated anchors where claims concern human preference. A second language-model judge supplies another proxy, not ground truth.

```figure
{
  "id": "fig-34.23",
  "kind": "chart",
  "title": "The KL charge is a signed objective contribution",
  "caption": "Eq.34.13 illustrative raw reward0.8 and beta0.1×KL0.5 give charge−0.05 and regularized proxy0.75. The signed bar is a subtraction, not an observed improvement or an independent quality score.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-34.13",
  "alt": "Three bars show raw proxy0.8,negative reference charge−0.05,and their sum0.75. The regularized objective retains separate reward and KL components.",
  "spec": {
    "type": "bar",
    "categories": [
      "Raw proxy",
      "Negative KL charge",
      "Regularized proxy"
    ],
    "x": {
      "label": "objective component"
    },
    "y": {
      "label": "declared reward units",
      "domain": [
        -0.1,
        0.9
      ]
    },
    "series": [
      {
        "id": "contribution",
        "label": "Illustrative signed values",
        "values": [
          0.8,
          -0.05,
          0.75
        ],
        "emphasis": true
      }
    ]
  },
  "anchor": "implementation"
}
```

## Experimental design

[PAPER-REPORTED] The categorical-critic math experiment changes the critic head/target while retaining scalar expected values for actor advantages. [R34.4, §§3–4, Appendix A/D](references.md#r34-4)

| Critic protocol | Disclosed setting |
|---|---|
| Model/data | Qwen2.5-Math-7B; binary DAPO17k |
| Target/head | 101 bins on [-.1,1.1]; Gaussian target scale .009; 30 critic warmup steps |
| Update | AdamW actor $10^{-6}$ / critic $2\times10^{-6}$; 512 prompts, 16 samples, minibatch 32 |
| Execution gaps | Hardware, precision, seeds NOT-DISCLOSED; Table 1 @256 conflicts with Appendix A per-benchmark budgets |

[ASSUMED] Proposed role-isolation experiment holds the actor initialization and rollout batch fixed while changing only critic target family. Controls include identical scalar actor advantage interface, reward/reference versions and optimizer budget. Measure target calibration, explained variance, actor gradient changes, peak memory and independent quality. A separate reward-version ablation intentionally changes only the proxy and records that this changes the objective. No results from this proposed experiment are claimed.

## Observations

**What the paper claims.** [PAPER-REPORTED] Categorical targets improve critic learning and downstream reasoning in the reported setup. [R34.4, §§3–4](references.md#r34-4)

**What the evidence shows.** [PAPER-REPORTED] Reported mean accuracy rises from 15.88 to 18.74; a two-bin variant gives 15.50 and one-hot targets 14.86. Classification alone is therefore insufficient. The contradictory tool-reward formula is excluded from this chapter's evidence. [R34.4, Table 1, Appendix A/B](references.md#r34-4)

**What we infer.** [MATHEMATICALLY-DERIVED] Scalar mean prediction and distributional target fitting are different optimization choices. Neither critic is a truth oracle. Extra head outputs add nonzero storage and arithmetic even if measured overhead is small on one workload; the system budget must account for them.

**What remains unknown.** [UNVERIFIED] Conflicting evaluation-budget descriptions prevent exact reconstruction of that comparison. The source does not establish that the same target family improves human-preference RLHF or every reward distribution.

## Failure modes

[DERIVED] A moving reference silently changes regularization; a moving reward silently changes the task. Critic targets inconsistent with KL-shaped returns create an interface mismatch. An actor/reward shared tokenizer mismatch can score a different response than the one trained. Cached scores with stale processor metadata corrupt ratios. Reward or judge uncertainty treated as calibrated confidence encourages unsupported decision rules. Sharing parameters without recording value-loss gradients hides an additional actor update path.

## Siblings

[DERIVED] Critic-free group estimators remove one learned role but retain sampling and reward-model/verifier contracts. Offline preference methods remove online reward optimization while inheriting preference-data limitations. Reward-model training and calibration remain Chapter 32. Verifiable rewards replace a learned preference proxy with a task-specific checker, whose soundness belongs to Chapter 35.

## Extensions

[DERIVED] Adaptive reference updates can support staged optimization, but each update creates a new anchor and should be represented as a new objective phase. Uncertainty penalties can be added with an explicit estimator/scale contract. Multi-objective rewards require declared aggregation and diagnostics for each component; a scalar total can conceal deterioration on one dimension. Distributional critics require support projection and tail handling when rewards leave their bin interval.

## Limitations

[DERIVED] KL regularization limits a stated probability movement and does not certify alignment, factual accuracy or reward validity. Exact trajectory identities assume common support and regularity. A four-role diagram specifies responsibilities, not actual worker placement or memory. Empirical critic results do not remove uncertainty about the proxy or the evaluation protocol.

## Reproducibility

[DERIVED] Publish role checkpoint hashes, trainability and sharing maps, reward input serialization, score caches with keys, KL direction, reward transformations, controller parameters and transaction boundaries. Provide one sealed batch whose rewards, advantages and acceptance decision can be reconstructed. Separate observed execution from code inspection, and retain all ND fields in any protocol comparison.

```figure
{
  "id": "fig-34.24",
  "kind": "chart",
  "title": "The same reward under different KL prices",
  "caption": "Analytical fixed reward .8. This is objective geometry, not an empirical claim about achieved policies.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-34.13",
  "alt": "Analytical curves: beta 0.1 equals 0.8-0.1*x, beta 0.4 equals 0.8-0.4*x. Analytical fixed reward .8. This is objective geometry, not an empirical claim about achieved policies.",
  "spec": {
    "type": "line",
    "x": {
      "label": "trajectory KL in nats",
      "scale": "linear",
      "domain": [
        0,
        4
      ]
    },
    "y": {
      "label": "regularized proxy",
      "scale": "linear"
    },
    "series": [
      {
        "id": "s0",
        "label": "beta 0.1",
        "formula": "0.8-0.1*x",
        "sample": {
          "to": 4,
          "count": 21,
          "from": 0
        }
      },
      {
        "id": "s1",
        "label": "beta 0.4",
        "formula": "0.8-0.4*x",
        "sample": {
          "to": 4,
          "count": 21,
          "from": 0
        }
      }
    ],
    "annotations": [
      {
        "x": 2,
        "y": 0,
        "label": "Beta0.4 zero crossing"
      },
      {
        "x": 4,
        "y": 0.4,
        "label": "Beta0.1 remains positive"
      }
    ]
  }
}
```

## References

[R34.4](references.md#r34-4) supplies the inspected critic experiment and protocol caveats. [R34.9](references.md#r34-9) supplies a contemporary proxy/judge failure study examined in §34.5. Foundation equations are independently derived, without admitting excluded historical evidence through a recent citation.
