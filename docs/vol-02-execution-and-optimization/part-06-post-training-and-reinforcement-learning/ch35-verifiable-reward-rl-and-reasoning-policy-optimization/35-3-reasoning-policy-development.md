---
id: "ms.section.35.3"
entity_type: "section"
title: "Reasoning-policy development"
short_title: "Reasoning-policy development"
volume: 2
part: 6
chapter: 35
section: 35.3
slug: "35-3-reasoning-policy-development"
parent: "ms.chapter.35"
prev_sibling: "ms.section.35.2"
next_sibling: "ms.section.35.4"
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.32", "ms.chapter.33", "ms.chapter.34"]
downstream: ["ms.chapter.36", "ms.chapter.38", "ms.chapter.39", "ms.chapter.62", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "evaluation", "assurance"], "mechanism": ["reinforcement_learning", "verification", "policy_optimization"], "feedback_setting": ["verifiable_reward", "environment_return"], "modality": ["text", "code"]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["DERIVED", "MATHEMATICALLY-DERIVED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "ASSUMED", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2300
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 35.3 — Reasoning-policy development

## Scope

[DERIVED] Specify the development path from an initial policy to a reasoning policy: cold-start supervision, pure-RL baselines, curriculum, response length and accepted/rejected trajectory handling. This section distinguishes changes to model initialization, task distribution, reward and decoding. It does not equate a fluent reasoning trace with a valid causal explanation. A complete artifact retains the origin and filtering history of every training trajectory, including the unsuccessful search used to obtain accepted examples.

## Why this exists

[DERIVED] Sparse reward can prevent a finite rollout budget from observing any success. Supervised warm starts can solve formatting and representation problems before RL, but they also introduce teacher information that a pure-RL comparison lacks. A curriculum can increase useful contrast while narrowing the distribution. A longer response cap can reveal more solutions while multiplying generation and verification costs. Without separating these axes, an apparent algorithmic improvement can be explained by initialization or available information.

[DERIVED] The dominant constraint is fair attribution under a fixed information and compute boundary. A pure-RL research baseline must start from the same specified checkpoint and receive no accepted teacher traces unless the comparator receives them too. A practical production pipeline may intentionally violate that equality; its reported result is then a pipeline result, not an isolated claim about RL.

## Intuition

[MATHEMATICALLY-DERIVED] If one independent attempt succeeds with probability $p$, $G$ attempts produce at least one success with probability $1-(1-p)^G$. Group-relative contrast is stricter: it requires both success and failure, with probability $1-p^G-(1-p)^G$. Near zero, both are small; near one, success is common while relative contrast vanishes. A curriculum that seeks contrast therefore optimizes a different collection criterion from simply choosing the easiest tasks.

[DERIVED] Accepted trajectories provide demonstrations of a discovered behavior. Rejected trajectories provide evidence about search cost and failure families. Applying supervised likelihood to accepted text and applying a signed policy update to rejected text are different operations. Silently discarding failures makes the accepted dataset look cheap and can erase evidence of verifier exploitation.


```figure
{
  "id": "fig-35.13",
  "kind": "diagram",
  "title": "Four interventions, four identities",
  "caption": "Initialization, prompt selection, rollout budget and checker each alter a different part of the experiment.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.0",
  "alt": "Initialization, prompt selection, rollout budget and checker each alter a different part of the experiment. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "model",
        "label": "Initial checkpoint"
      },
      {
        "id": "n1",
        "kind": "dataset",
        "label": "Optional demonstrations"
      },
      {
        "id": "n2",
        "kind": "process",
        "label": "Curriculum"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Bounded rollouts"
      },
      {
        "id": "n4",
        "kind": "process",
        "label": "Checker"
      },
      {
        "id": "n5",
        "kind": "model",
        "label": "Updated policy"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n3"
      },
      {
        "from": "n1",
        "to": "n0",
        "label": "SFT"
      },
      {
        "from": "n2",
        "to": "n3",
        "label": "task measure"
      },
      {
        "from": "n3",
        "to": "n4"
      },
      {
        "from": "n4",
        "to": "n5",
        "label": "RL"
      }
    ]
  }
}
```


## Formulation

[MATHEMATICALLY-DERIVED] Under independent Bernoulli correctness for a fixed prompt,

$$
q_G(p)=1-(1-p)^G,\qquad
u_G(p)=1-p^G-(1-p)^G .
$$
*(Eq. 35.9)*

where $q_G$ measures any success and $u_G$ measures mixed-group probability; neither quantity measures semantic solution diversity.

[MATHEMATICALLY-DERIVED] If no successes appear in $n$ independent attempts, a one-sided $(1-\alpha)$ exact upper bound on the success probability is

$$
p_{\rm upper}=1-\alpha^{1/n}.
$$
*(Eq. 35.10)*

where $0<\alpha<1$ and the task, policy, decoding and checker remain fixed throughout the attempts.

[DERIVED] This does not prove $p=0$, nor does it prove a missing capability. It only bounds the sampled success probability under the model's observation contract. Correlated attempts require a different uncertainty model. The same finite-data caution applies to a pure-RL run whose groups are all negative.


```figure
{
  "id": "fig-35.14",
  "kind": "calculator",
  "title": "Finite failures do not prove zero",
  "caption": "Eq.35.10 computes a one-sided95% upper bound after zero successes, assuming independent attempts.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.10",
  "alt": "Eq.35.10 computes a one-sided95% upper bound after zero successes, assuming independent attempts. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "equation": "35.10",
    "tex": "p_{\\rm upper}=1-\\alpha^{1/n}",
    "inputs": [
      {
        "symbol": "n",
        "label": "Independent attempts",
        "default": 128,
        "min": 8,
        "max": 4096,
        "format": "integer",
        "options": [
          8,
          32,
          128,
          512,
          4096
        ]
      },
      {
        "symbol": "alpha",
        "label": "Tail probability",
        "default": 0.05,
        "min": 0.001,
        "max": 0.2,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "upper",
        "label": "Success-probability upper bound",
        "formula": "1-alpha^(1/n)",
        "format": "raw",
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Eight failures",
      "variables": {
        "n": 8
      }
    },
    {
      "anchor": "mechanism",
      "label": "128 failures",
      "variables": {
        "n": 128
      }
    },
    {
      "anchor": "failure-modes",
      "label": "512 failures",
      "variables": {
        "n": 512
      }
    }
  ]
}
```


[DERIVED] Define cold-start supervised data $\mathcal S=\{(x,y,w,m)\}$ with response weights $w$ and token masks $m$. Response-only likelihood minimizes $-\sum w m\log\pi_\theta(y_t\mid h_t)$ after a declared normalization. Preserve teacher identity, selection procedure, parser and checker version. A teacher-generated accepted trace is external information even if a later RL stage uses only binary rewards.

## Mechanism

### Methodology

[DERIVED] Begin with an initialization ledger: base/instruction checkpoint, tokenizer, prompt template, any supervised stage and any task-specific demonstrations. Distinguish an inability to parse the answer format from an inability to solve the underlying problem. A controlled format intervention can raise observed acceptance without changing mathematical competence. Conversely, a strict parser can conceal correct reasoning. Both effects belong in task construction, not in an undocumented explanation after training.

[MATHEMATICALLY-DERIVED] For a fixed task pool with base measure $D(x)$ and acceptance probability $u_G(p_x)$, rejection sampling of mixed groups changes the accepted prompt measure to

$$
D_{\rm acc}(x)=\frac{D(x)u_G(p_x)}
{\sum_{x'}D(x')u_G(p_{x'})}.
$$
*(Eq. 35.11)*

where the denominator is positive and $p_x$ refers to the current frozen collection policy.

[DERIVED] This equation describes prompt frequency among accepted groups, not the expected gradient of every dynamic-sampling implementation. Under unbounded iid refill, discarded groups with exactly zero gradient can leave an unnormalized expected gradient direction unchanged up to a scalar. Caps, adaptive proposal distributions and different reductions require their own analysis in §35.4. Do not use changed accepted frequency alone as proof of changed gradient direction.

[MATHEMATICALLY-DERIVED] A curriculum can explicitly choose a target prompt measure $D_t$ or importance-correct a proposal $Q_t$ when support and exact selection probabilities are known. The weight is $D_t(x)/Q_t(x)$ for an iid single draw. Sampling without replacement, selecting top scores after generation or stopping after enough successes changes inclusion probabilities. Approximate inclusion weights are not exact inverse-probability correction.

[DERIVED] Response length is another independent intervention. A length penalty changes reward, a response cap changes the admissible trajectory set, and a length-normalized loss changes gradient weighting. For reward $R'=R-\kappa_L L$ with $\kappa_L\ge0$, the optimizer is explicitly trading acceptance against tokens. A hard cap cannot be represented merely by a small penalty because it censors unfinished responses. Keep EOS, forced thinking-end, tool timeout and hard token exhaustion as distinct termination states.


```figure
{
  "id": "fig-35.15",
  "kind": "chart",
  "title": "Success and usable contrast diverge",
  "caption": "Eq.35.9 for G8 distinguishes any success from a mixed group, including the all-correct boundary.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.9",
  "alt": "Eq.35.9 for G8 distinguishes any success from a mixed group, including the all-correct boundary. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "type": "line",
    "x": {
      "label": "per-attempt success",
      "domain": [
        0,
        1
      ]
    },
    "y": {
      "label": "group probability"
    },
    "series": [
      {
        "id": "n0",
        "label": "Any success",
        "formula": "1-(1-x)^8",
        "sample": {
          "from": 0,
          "to": 1,
          "count": 41
        },
        "emphasis": true
      },
      {
        "id": "n1",
        "label": "Mixed group",
        "formula": "1-x^8-(1-x)^8",
        "sample": {
          "from": 0,
          "to": 1,
          "count": 41
        },
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 1,
        "y": 0,
        "label": "All-correct groups have no contrast"
      },
      {
        "x": 0.5,
        "y": 0.9921875,
        "label": "Mixed-group maximum"
      }
    ]
  }
}
```


[MATHEMATICALLY-DERIVED] A local supervised bridge can be analyzed without inventing a current model's internal mechanism. Let $P_\theta$ be the probability of a specified correct answer after marginalizing latent rationale $z$. For a chosen $a\in[0,1]$, define

$$
\ell_a(P)=
\begin{cases}
(1-P^{1-a})/(1-a),&a<1,\\
-\log P,&a=1,
\end{cases}
\qquad
\nabla_\theta\ell_a=-P^{-a}\nabla_\theta P.
$$
*(Eq. 35.12)*

where $P>0$ and the exponent $a$ is local to this section.

[DERIVED] The derivative follows by differentiating $P^{1-a}$. Under the scalar sigmoid toy model $P=\sigma(\theta)$ and gradient flow, $\dot P=P^{2-a}(1-P)^2$. Higher $a$ amplifies low-probability supervision in this toy setting. It also amplifies erroneous labels; this is not a general theorem that supervised initialization is superior or that a neural network escapes at a predicted wall-clock rate.

[DERIVED] If $P=\mathbb E_{z\sim\pi_\theta}w(z)$, where $w(z)=\pi_\theta(y^*\mid x,z)$, the full joint score gives $\nabla P=\mathbb E[w(z)\nabla\log\pi_\theta(z,y^*\mid x)]$. A finite sample mean estimates that gradient, while dividing it by a power of the same sample mean of $w$ creates a correlated ratio estimator. The resulting finite-sample bias must not be described as an unbiased policy gradient. Posterior resampling proportional to $w$ further adds conditional resampling noise; normalized weights require positive finite total mass.


[MATHEMATICALLY-DERIVED] To make the likelihood bridge executable, fix $M\ge2$ independently sampled rationales, $w_i=\pi_\theta(y^*\mid x,z_i)$, $\bar w=M^{-1}\sum_iw_i$ and $\bar w_{-i}=(M-1)^{-1}\sum_{j\ne i}w_j$. The plug-in estimate of Eq. 35.12's gradient is $-M^{-1}\sum_iw_i\nabla\log\pi_\theta(z_i,y^*\mid x)/\bar w^a$. Separate the rationale score from the teacher-forced answer derivative: only the former admits an action-independent baseline. Subtracting a detached $\bar w_{-i}^{1-a}$ from its coefficient has zero expected contribution under iid rationale sampling, because that baseline excludes $z_i$. It does not remove the bias from the shared random denominator $\bar w^a$.

[MATHEMATICALLY-DERIVED] A posterior-resampling estimator instead draws indices $I_j$ from categorical weights $w_i/\sum_hw_h$, then averages joint scores with multiplier $-\bar w^{1-a}$. Conditional expectation over the resampling indices recovers the uncentered plug-in estimator exactly: the weighted categorical mean contributes $\sum_iw_i\nabla\log\pi(z_i,y^*)/(M\bar w)$, and multiplication by $\bar w^{1-a}$ gives the same denominator $\bar w^a$. This identity isolates the extra conditional resampling variance; it does not imply identical finite optimizer trajectories or a lower-variance estimator. A zero, underflowed or nonfinite weight sum must produce ABSTAIN rather than normalized NaNs.

[PAPER-REPORTED] These two factorizations correspond to GARL and PAFT in R35.3, §6 and Algorithms1–2. The source additionally divides implemented gradients by $M^a$, a parameter-dependent learning-rate rescaling when comparing different exponents; its stated mathematical target omits that extra factor. Its bias theorem requires positive answer mass, finite score moments and a positive almost-sure likelihood lower bound.

[DERIVED] Teacher-forced answer likelihood is computed in log space; multiplying long-sequence probabilities directly can underflow. A log-sum-exp computes the pool mean stably, but a very small effective sample size still makes the ratio estimator unstable. Report normalized-weight concentration, finite guards and the source of gold answers. Neither a dense likelihood channel nor posterior resampling is the same information contract as observing only a binary checker on a freely generated answer. The source's proof assumptions become especially restrictive for long answers; no uniform cold-start bias bound is inferred from a fixed-positive-mass asymptotic.

[DERIVED] Resource accounting includes $M$ rationale generations, teacher-forced answer scoring and backward work, plus $K$ resampled score contributions for a posterior estimator. Repeated indices can be aggregated by counts without changing the conditional expectation, but that optimization must retain the same detached weights. Equal numbers of sampled rationales alone do not equate FLOPs, memory or wall-clock cost to a binary-reward comparator. This is why the actual source protocol is reported separately from the abstract information comparison.

## Algorithm

**Algorithm 35.3 — Bounded initialization and curriculum development.** Inputs are checkpoint $\theta_{\rm base}$, optional frozen supervised set $\mathcal S$, finite training schedule $t_{\max}$, bounded sampler $Q_t$, checker bundle, group/token caps and a dev-only selection rule. State records parameters, all attempts and all accepted/rejected trajectory identities.

$$
\begin{aligned}
(1)\;&\theta_0\leftarrow
\begin{cases}\operatorname{SFTBounded}(\theta_{\rm base},\mathcal S,K_{\rm SFT}),&\mathcal S\ne\varnothing,\\
\theta_{\rm base},&\mathcal S=\varnothing;\end{cases}\\
(2)\;&t\leftarrow0;\quad\mathcal A\leftarrow\varnothing;\quad\mathcal C\leftarrow\varnothing.\\
(3)\;&X_t\leftarrow\operatorname{SampleBounded}(Q_t,B,\text{seed}_t).\\
(4)\;&\mathcal A_t\leftarrow\operatorname{Collect}_{35.1}(X_t,G,L_{\max},T_t).\\
(5)\;&(\mathcal P_t,\mathcal N_t)\leftarrow
\operatorname{PartitionByFrozenStatus}(\mathcal A_t).\\
(6)\;&\theta_{t+1}\leftarrow\operatorname{Update}_{35.2}
(\theta_t,\mathcal A_t;\text{frozen reduction}),\\
&\hspace{2em}\text{or }\theta_t\text{ with ABSTAIN if no admissible group}.\\
(7)\;&\mathcal A\leftarrow\mathcal A\cup\mathcal A_t;\quad
\mathcal C\leftarrow\mathcal C\cup\{(\theta_{t+1},Q_t,T_t,\mathcal P_t,\mathcal N_t)\}.\\
(8)\;&t\leftarrow t+1;\quad\text{repeat while }t<t_{\max}\text{ and budget remains}.\\
(9)\;&\theta_*\leftarrow\operatorname{Select}_{D_{\rm dev}}(\mathcal C);
\quad\text{return }\theta_*,\mathcal A,\operatorname{Evaluate}_{D_{\rm test}}(\theta_*).
\end{aligned}
$$

[DERIVED] The test split never changes sampler, penalty, checkpoint or selection rule. The pure-RL branch has $K_{\rm SFT}=0$ and an empty supervised set; both branches retain their real costs. Invariants are fixed split lineage and explicit initialization identity. Termination follows finite supervised steps, training steps, sampling rounds and enforced budgets. A failed supervised stage or checker-version change invalidates the matched comparison rather than silently starting another run.

## Implementation

[DERIVED] Hugging Face TRL and verl implement the post-training layer; vLLM supplies generation in disclosed ARCUS experiments. Rejected trajectories remain in storage even if their token loss is masked. At a dense $[B,G,L]$ representation, response filtering changes masks while tensor padding may leave memory and generation costs unchanged. Packing can reduce padding cost but must preserve prompt/response boundaries and group statistics.

[DERIVED] Curriculum metadata has $O(N)$ scalar state for a finite pool of $N$ prompts, plus optional uncertainty and last-observed version. Updating a prompt's predicted difficulty does not require retaining every rollout in accelerator memory. Reproducibility still requires an append-only attempt ledger and a sampler-state checkpoint. Model/optimizer checkpoints without sampler state cannot recreate the same curriculum.


```figure
{
  "id": "fig-35.16",
  "kind": "chart",
  "title": "Mixed-group admission changes the prompt measure",
  "caption": "Eq.35.11:equally common families with success0.05 and0.5 receive different G8 mixed-group admission probabilities. Bars compare original shares0.5/0.5 with the renormalized admitted shares; iid Bernoulli assumptions are analytical.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.11",
  "alt": "Two equally frequent task families begin with shares0.5 each. After mixed-group filtering their shares are proportional to1−0.05^8−0.95^8 and1−2×0.5^8. Hard-family weight falls; this is not a reported curriculum experiment.",
  "spec": {
    "type": "bar",
    "categories": [
      "Family A:p0.05",
      "Family B:p0.5"
    ],
    "x": {
      "label": "original task family"
    },
    "y": {
      "label": "normalized prompt mass",
      "domain": [
        0,
        1
      ]
    },
    "series": [
      {
        "id": "before",
        "label": "Original prompt measure",
        "values": [
          0.5,
          0.5
        ]
      },
      {
        "id": "after",
        "label": "Admitted prompt measure",
        "values": [
          0.25330216003041983,
          0.7466978399695801
        ],
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation"
}
```


## Experimental design

### Reported experiments

[PAPER-REPORTED] R35.3 supplies cold-start and prompted warm-start comparisons; its likelihood-based GARL/PAFT supervision is a boundary case, not pure binary-reward RL. Both use the post-trained Qwen3-0.6B checkpoint; the warm-start condition adds task instructions and answer-format constraints. [§6–7; Appendix C–D].

| Field | Tsallis-continuum protocol |
|---|---|
| Model | Post-trained Qwen3-0.6B |
| Splits train/dev/test | FinQA6145/872/1132; HotPotQA9067/342/343; MuSiQue9985/579/445 |
| Budget/evaluation | 32 training rationales; PAFT resamples 32 from that same pool; 16 evaluation samples; exact-match training, substring evaluation |
| Selection/uncertainty | Best dev maj@16; single seed; no confidence intervals |
| Length | Thinking budgets4096−128,3072−128,2048−128 respectively; forced thinking-end |
| Missing | Optimizer, hardware, precision: NOT-DISCLOSED in inspected §7 |

[PAPER-REPORTED] GLM-5 discloses SFT followed by reasoning RL, group 32 and prompt batch 32, clipping0.2/0.28, no reference KL, and a training/inference probability-ratio gate bounded by factor2. It uses multiple reward sources. RL learning rate, optimizer budget, seeds and isolated initialization ablation are NOT-DISCLOSED in inspected §3.1–3.2. [R35.2].

```figure
{
  "id": "fig-35.38",
  "kind": "chart",
  "title": "Warm-start reported peaks differ from stable outcomes",
  "placement": "wide",
  "evidence": "PAPER-REPORTED",
  "source": "R35.3",
  "caption": "R35.3 Table3 reports validation-selected test maj@16,one seed,no intervals. GARL HotPotQA/MuSiQue bars are peaks before validation collapse to zero; FinQA GARL and PAFT are reported stable. GRPO also declines on HotPotQA. Figure4/text disagree on a separate validation peak, so no training curve is reconstructed.",
  "alt": "FinQA/HotPotQA/MuSiQue test maj@16:GRPO26.9/33.5/15.8;GARLq.25 38.7/22.9/24.3;GARLq.75 37.6/46.8/19.7;PAFTq.25 26.6/47.0/9.0;PAFTq.75 28.6/47.9/22.4. GARL values in the last two categories are selected peaks before collapse, not sustained performance.",
  "context": {
    "hardware": "NOT-DISCLOSED",
    "model": "Post-trained Qwen3-0.6B; prompted warm start",
    "precision": "NOT-DISCLOSED",
    "sequenceLength": "Thinking caps4096−128/3072−128/2048−128 by task",
    "ioDistribution": "FinQA/HotPotQA/MuSiQue;32 train rationales;16 evaluation draws",
    "concurrency": "NOT-DISCLOSED",
    "runtimeVersion": "NOT-DISCLOSED",
    "measurementBoundary": "Table3 validation-selected test maj@16;exact-match training,substring evaluation"
  },
  "spec": {
    "type": "bar",
    "categories": [
      "FinQA",
      "HotPotQA: GARL peaks†",
      "MuSiQue: GARL peaks†"
    ],
    "x": {
      "label": "task and stability boundary"
    },
    "y": {
      "label": "reported test maj@16 percent",
      "domain": [
        0,
        60
      ]
    },
    "series": [
      {
        "id": "grpo",
        "label": "GRPO",
        "values": [
          26.9,
          33.5,
          15.8
        ]
      },
      {
        "id": "g25",
        "label": "GARL q0.25†",
        "values": [
          38.7,
          22.9,
          24.3
        ]
      },
      {
        "id": "g75",
        "label": "GARL q0.75†",
        "values": [
          37.6,
          46.8,
          19.7
        ]
      },
      {
        "id": "p25",
        "label": "PAFT q0.25",
        "values": [
          26.6,
          47,
          9
        ]
      },
      {
        "id": "p75",
        "label": "PAFT q0.75",
        "values": [
          28.6,
          47.9,
          22.4
        ],
        "emphasis": true
      }
    ]
  }
}
```

## Observations

**What the paper claims.** [PAPER-REPORTED] R35.3 Table 1 reports cold-start FinQA pass@1 of 0 for GRPO and30.5 for GARL at exponent0.75, versus 21.9 at exponent1. Its warm/cold comparison changes prompting and is explicitly confounded.

[PAPER-REPORTED] Warm-start Table 3 reports a different stability pattern: the GARL scores on HotPotQA and MuSiQue are selected peaks preceding validation collapse to zero, rather than stable end-of-training outcomes. PAFT at exponent0.75 reports stable test maj@16 of47.9 on HotPotQA and22.4 on MuSiQue, compared with GRPO33.5 and15.8. FinQA instead favors GARL at exponent0.25 with38.7, versus PAFT28.6 at exponent0.75. These are single-seed, validation-selected test measurements, with the task-specific rationale caps and matching rules above. [R35.3, §7.3, Table3].

**What the evidence shows.** [DERIVED] The single-seed protocol and different training/evaluation matching rules limit generalization of that observation. Its likelihood supervision supplies gold-answer information beyond a binary checker. GLM-5's whole-pipeline results do not isolate the contribution of its supervised warm start.

[DERIVED] The warm-start results establish a task-dependent stability distinction in the reported runs; they do not establish that PAFT is generally stable or that GARL necessarily collapses. Equal rationale counts also leave loss evaluation, resampling, backward work and wall-clock parity unresolved. A validation-selected peak followed by collapse must not be presented as a sustainable operating point.

[UNVERIFIED] R35.3 Figure4's caption gives a GARL exponent0.25 validation peak of30.6 at step50, whereas the surrounding §7.3 text gives22.9 for that validation peak. Both describe zero by step100. Table3's22.9 is a test maj@16 value and cannot resolve this separate validation-text discrepancy. The chapter therefore records the reported collapse without reconstructing a numerical training curve or inferring its cause. [§7.3, Table3/Figure4].

**What we infer.** [MATHEMATICALLY-DERIVED] Equations35.9–35.12 distinguish finite search failure, accepted-prompt weighting and supervised gradient amplification. They explain plausible bottlenecks without establishing a current model's hidden learning mechanism.

**What remains unknown.** [NOT-DISCLOSED] Multi-seed variance and the omitted optimizer/resource recipe for R35.3 prevent a fully matched independent reproduction from its inspected disclosure alone.


```figure
{
  "id": "fig-35.17",
  "kind": "compare",
  "title": "Length interventions are not aliases",
  "caption": "Reward penalties, generation caps and loss reductions act at separate stages.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.0",
  "alt": "Reward penalties, generation caps and loss reductions act at separate stages. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "axis": "Intervention",
    "columns": [
      {
        "id": "n0",
        "label": "Length penalty"
      },
      {
        "id": "n1",
        "label": "Hard cap"
      },
      {
        "id": "n2",
        "label": "Loss normalization"
      }
    ],
    "rows": [
      {
        "dimension": "Changes",
        "values": {
          "n0": "Reward utility",
          "n1": "Admissible trajectory",
          "n2": "Gradient weighting"
        }
      },
      {
        "dimension": "Unit",
        "values": {
          "n0": "Reward/token",
          "n1": "Generated tokens",
          "n2": "Loss denominator"
        }
      },
      {
        "dimension": "Required record",
        "values": {
          "n0": "Coefficient",
          "n1": "Censored status",
          "n2": "Exact reduction"
        }
      }
    ]
  }
}
```


## Failure modes

> **Failure mode — Successful-only accounting.** *Symptom:* a small accepted dataset appears to produce exceptional compute efficiency. *Cause:* failed teacher/generator attempts and checker calls were omitted. *Detection:* reconcile accepted examples with all parent attempt IDs and consumed work. *Mitigation:* report end-to-end search, filtering, supervised and RL cost separately.

[DERIVED] Additional failures include answer-format reward hacking, curriculum collapse onto easy task families, forced-end tokens being mistaken for natural termination and dev metrics repeatedly used as hidden training feedback. Monitor unconditional success, length distribution, task coverage and completion-status frequencies. A high training reward on a shrinking task support is not evidence of broad reasoning improvement.


```figure
{
  "id": "fig-35.18",
  "kind": "chart",
  "title": "A supervised bridge in a toy model",
  "caption": "Eq.35.12 yields sigmoid-gradient-flow rates P^(2−a)(1−P)^2. Curves compare declared exponents, not measured neural-network training.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.12",
  "alt": "Eq.35.12 yields sigmoid-gradient-flow rates P^(2−a)(1−P)^2. Curves compare declared exponents, not measured neural-network training. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "type": "line",
    "x": {
      "label": "correct-answer probability",
      "domain": [
        0.001,
        0.999
      ]
    },
    "y": {
      "label": "toy probability growth"
    },
    "series": [
      {
        "id": "n0",
        "label": "a = 0",
        "formula": "x^2*(1-x)^2",
        "sample": {
          "from": 0.001,
          "to": 0.999,
          "count": 41
        },
        "emphasis": true
      },
      {
        "id": "n1",
        "label": "a = 0.75",
        "formula": "x^1.25*(1-x)^2",
        "sample": {
          "from": 0.001,
          "to": 0.999,
          "count": 41
        },
        "dashed": true
      },
      {
        "id": "n2",
        "label": "a = 1",
        "formula": "x*(1-x)^2",
        "sample": {
          "from": 0.001,
          "to": 0.999,
          "count": 41
        },
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 0.3333333333333333,
        "y": 0.14814814814814814,
        "label": "a1 toy maximum at P1/3"
      }
    ]
  }
}
```


## Siblings

[DERIVED] Supervised warm starts trade extra demonstrations for more reliable initial behavior. Pure RL tests what the specified initial policy and checker can achieve without those demonstrations. Rejection fine-tuning learns from accepted samples through likelihood; RL applies reward-weighted changes to sampled behavior. Neither comparison is meaningful unless the search budget and source of accepted traces are visible.

## Extensions

### Improvements

[PAPER-REPORTED] ARCUS changes curriculum through uncertainty-bearing prompt beliefs while keeping the updater fixed; §35.4 reconstructs its method and three-seed protocol. DeepSeek-V4 is retained only as an inspected retrieval lead outside this bounded evidence set; its original report history is distinguished from its June identifier/index and April model release. No V4 performance claim is made here.

## Limitations

[DERIVED] A scalar cold-start toy model does not predict training time for a large shared-parameter network. Learned task difficulty can be stale, answer matching can be incomplete and curricula can suppress transfer-relevant tasks. A finite unsuccessful baseline supports a budgeted negative result, not impossibility.

## Reproducibility

[DERIVED] Publish initialization, SFT provenance, accepted/rejected lineage, curriculum state, length interventions, actual behavior probabilities, sampling seeds, dev-only checkpoint rule and independent evaluator. Record whether reported compute counts generated tokens, teacher-forced tokens, verifier operations or all of them. Equal rollout counts alone do not guarantee equal total compute.

## References

[R35.2] GLM-5 §3.1–3.2. [R35.3] Tsallis-continuum §6–7, Appendices C–D. [R35.4] ARCUS §4 and Appendix D–F. Foundational cold-start calculations are book derivations.
