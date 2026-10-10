---
id: "ms.section.39.4"
entity_type: "section"
title: "39.4 — Policy and trajectory transfer"
short_title: "39.4 — Policy and trajectory transfer"
volume: 2
part: 7
chapter: 39
section: 39.4
slug: "39-4-policy-and-trajectory-transfer"
parent: "ms.chapter.39"
prev_sibling: "ms.section.39.3"
next_sibling: "ms.section.39.5"
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.23", "ms.chapter.31", "ms.chapter.32", "ms.chapter.33", "ms.chapter.34", "ms.chapter.35", "ms.chapter.36", "ms.chapter.37", "ms.chapter.38"]
downstream: ["ms.chapter.40", "ms.chapter.41", "ms.chapter.42", "ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "adaptation", "inference"], "mechanism": ["distillation", "distribution_matching"], "feedback_setting": ["ai_feedback", "verifiable_reward", "environment_return"], "modality": ["text"]}
papers: []
implementations: ["impl.pytorch", "impl.megatron-lm", "impl.verl", "impl.vllm", "impl.sglang"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2200
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 39.4 — Policy and trajectory transfer

## Scope

[DERIVED] Transfer policies over multi-turn interaction, tool traces and student-generated trajectories. The baseline is offline response imitation at teacher-selected prefixes. Success means a declared state distribution, role-conditioned target and bounded interaction procedure. This section distinguishes complete trajectory objectives from conditional-loss updates, and describes teacher adaptation, turn guidance, context distillation, self-distillation and cross-stage expert transfer without treating them as one estimator.

## Why this exists

[DERIVED] A student can imitate actions on successful teacher histories yet visit different histories when deployed. Online student sampling exposes these states, but now the teacher must supervise inputs it did not generate. A tool observation also changes the state independently of token generation. Calling a loss “on-policy” identifies the sampler only if the behavior law, environment, processors and version are specified; it does not certify an unbiased gradient of every sequence-level objective.

[PAPER-REPORTED] SCOUT adapts the teacher to student prefixes [R39.4, §3]. Guided-OPD intermittently lets the teacher control entire turns, then withdraws that guidance [R39.5, §3]. OPCD puts experiential or system context in the teacher while withholding it from the student [R39.6, §3]. GLM-5 and DeepSeek-V4 report distilling earlier specialists into a final model [R39.7, §3.5; R39.8, §5.1.2]. Their sampling, target and optimization roles differ.

## Intuition

[MATHEMATICALLY-DERIVED] An offline trace fixes the histories where a loss is evaluated. Pure student rollouts expose student histories. Mixed turn rollouts expose a third distribution influenced by previous teacher and student choices. Updating the teacher makes the target nonstationary. The local categorical derivative remains useful, but it must be named as local unless the complete occupancy derivative is included.

## Formulation

[MATHEMATICALLY-DERIVED] For complete finite trajectories with shared initial distribution and environment transition law, and aligned stopping/support contracts,

$$
\begin{aligned}
\operatorname{KL}(P_\theta\Vert P_T)
&=\mathbb E_{\omega\sim P_\theta}\left[\sum_t\log\frac{q_\theta(a_t\mid h_t)}{p_T(a_t\mid h_t)}\right]\\
&=\sum_t\mathbb E_{h_t\sim d_{\theta,t}}\operatorname{KL}(q_\theta(\cdot\mid h_t)\Vert p_T(\cdot\mid h_t)).
\end{aligned}
$$
*(Eq. 39.10)*

where $\omega$ includes actions, observations and termination, and the environment terms cancel because they are identical. A per-response factor $1/|y|$ generally changes this objective. A teacher given privileged context also defines a different conditional target, not the same unconditioned trajectory measure.

[MATHEMATICALLY-DERIVED] Let $\ell_t=\log q_\theta(a_t\mid h_t)-\log p_T(a_t\mid h_t)$ and $u_j=\nabla_\theta\log q_\theta(a_j\mid h_j)$. Differentiating the sampling law and using causality gives

$$
\nabla_\theta\operatorname{KL}(P_\theta\Vert P_T)
=\mathbb E\left[\sum_j u_j\sum_{t\geq j}\ell_t\right],\qquad
G_{\rm local}=\sum_t\mathbb E_{h_t\sim d_{\theta,t}}\nabla_\theta\operatorname{KL}(q_\theta\Vert p_T\mid h_t).
$$
*(Eq. 39.11)*

where score normalization removes the extra derivative of the log ratio in expectation and past terms vanish conditionally. $G_{\rm local}$ holds histories fixed; it omits how earlier actions change later losses. Both quantities can be useful, but differentiating a full-vocabulary conditional loss on detached student prefixes is not automatically an unbiased full-trajectory KL gradient. Reusing trajectories after policy updates introduces a further behavior-policy mismatch, separate from this occupancy issue.


```figure
{
  "id": "fig-39.19",
  "kind": "calculator",
  "title": "Arithmetic mixture versus reverse-KL experts",
  "caption": "Two fixed Bernoulli experts have normalized positive weights. Reverse-KL aggregation uses their geometric product; forward-KL aggregation uses an arithmetic mixture.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.13",
  "alt": "Two fixed Bernoulli experts have normalized positive weights. Reverse-KL aggregation uses their geometric product; forward-KL aggregation uses an arithmetic mixture.",
  "spec": {
    "tex": "q_{\\rm reverse}=\\sigma(w\\operatorname{logit}p_1+(1-w)\\operatorname{logit}p_2)",
    "equation": "39.13",
    "inputs": [
      {
        "symbol": "p1",
        "label": "Expert one action mass",
        "default": 0.9,
        "min": 0.01,
        "max": 0.99,
        "step": 0.01,
        "scale": "linear",
        "format": "raw"
      },
      {
        "symbol": "p2",
        "label": "Expert two action mass",
        "default": 0.3,
        "min": 0.01,
        "max": 0.99,
        "step": 0.01,
        "scale": "linear",
        "format": "raw"
      },
      {
        "symbol": "w",
        "label": "Expert one weight",
        "default": 0.5,
        "min": 0,
        "max": 1,
        "step": 0.01,
        "scale": "linear",
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "r",
        "label": "Reverse-KL optimum",
        "formula": "1/(1+exp(-(w*ln(p1/(1-p1))+(1-w)*ln(p2/(1-p2)))))",
        "format": "raw"
      },
      {
        "symbol": "f",
        "label": "Forward-KL optimum",
        "formula": "w*p1+(1-w)*p2",
        "format": "raw"
      }
    ]
  }
}
```


## Mechanism

### Methodology

[PAPER-REPORTED] Guided-OPD samples a Bernoulli role once per turn; the selected model generates that turn's reasoning/action, then the environment returns an observation. Student-controlled turns use reverse KL and teacher-controlled turns forward KL. A cosine guidance schedule starts at one and reaches zero after80% of training [R39.5, §3, Eqs4–9]. At intermediate guidance probability $\gamma$, both roles encounter histories from the common mixed process:

$$
\mathcal L_{\rm mix}=\sum_t\mathbb E_{h_t\sim d_{\gamma,t}}
\left[(1-\gamma)L_S(h_t)+\gamma L_T(h_t)\right].
$$
*(Eq. 39.12)*

where within-turn token prefixes are additionally sampled by the selected role. This uses $\gamma$ locally to avoid repurposing global RL coefficient $\beta$; the paper calls guidance $\beta$. It preserves the source Eq9 sampling interpretation. It is generally **not** $(1-\gamma)\mathbb E_{d_S}L_S+\gamma\mathbb E_{d_T}L_T$ with pure student/teacher occupancies as a reading of source Eq10 might suggest. At two turns with first-turn teacher probability.9, student.1 and guidance.5, the mixed next-state probability is.5. If that state has losses $F,R$, its contribution is$.25(F+R)$, whereas mixing pure-history terms gives$.45F+.05R$. They differ unless the losses coincide. Only guidance endpoints recover pure roles.

[PAPER-REPORTED] SCOUT first samples student trajectories, scores them with a teacher and periodically updates the teacher from student prefixes using verifiable terminal rewards. Its actual student loss in Appendix B.2 is sampled K1 clipped policy-gradient supervision: detached $A_t=\log p_T(a_t\mid h_t)-\log q_{\rm old}(a_t\mid h_t)$, with the current/old student ratio and asymmetric clipping [R39.4]. It is not a dense conditional-KL autograd update. Teacher GRPO uses multiple continuations from the student prefix and updates only the teacher continuation tokens. The student prefix is conditioning, not a teacher-generated action target. Teacher optimizer state, rollout generation and verifier costs are additional resources.


```figure
{
  "id": "fig-39.20",
  "kind": "cycle",
  "title": "Student-conditioned teacher adaptation",
  "caption": "SCOUT adds a trainable teacher loop around student rollouts. Teacher continuation rewards update the teacher; the student prefix remains conditioning, not teacher action targets.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "R39.4",
  "alt": "SCOUT adds a trainable teacher loop around student rollouts. Teacher continuation rewards update the teacher; the student prefix remains conditioning, not teacher action targets.",
  "spec": {
    "stages": [
      {
        "id": "s",
        "label": "Student rollout",
        "kind": "model"
      },
      {
        "id": "p",
        "label": "Select student prefix",
        "kind": "dataset"
      },
      {
        "id": "t",
        "label": "Teacher continuations",
        "kind": "model"
      },
      {
        "id": "v",
        "label": "Verifiable outcome reward",
        "kind": "metric"
      },
      {
        "id": "u",
        "label": "Publish teacher update",
        "kind": "state"
      },
      {
        "id": "k",
        "label": "Student supervision",
        "kind": "objective"
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "p",
        "kind": "flow"
      },
      {
        "from": "p",
        "to": "t",
        "kind": "flow"
      },
      {
        "from": "t",
        "to": "v",
        "kind": "flow"
      },
      {
        "from": "v",
        "to": "u",
        "kind": "flow"
      },
      {
        "from": "u",
        "to": "k",
        "kind": "flow"
      },
      {
        "from": "k",
        "to": "s",
        "kind": "feedback"
      }
    ]
  }
}
```


```figure
{
  "id": "fig-39.21",
  "kind": "chart",
  "title": "Guidance is withdrawn before training ends",
  "caption": "Source schedule reconstruction: cosine guidance from one to zero over the first 80 percent of training. Intermediate histories are mixed; only zero guidance gives pure student turns.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "R39.5",
  "alt": "Source schedule reconstruction: cosine guidance from one to zero over the first 80 percent of training. Intermediate histories are mixed; only zero guidance gives pure student turns.",
  "spec": {
    "type": "area",
    "x": {
      "label": "Training progress",
      "format": "raw"
    },
    "y": {
      "label": "Teacher-turn probability",
      "format": "raw"
    },
    "series": [
      {
        "id": "guidance",
        "label": "Cosine teacher guidance",
        "points": [
          [
            0.0,
            1.0
          ],
          [
            0.02,
            0.998458666866564
          ],
          [
            0.04,
            0.9938441702975689
          ],
          [
            0.06,
            0.9861849601988383
          ],
          [
            0.08,
            0.9755282581475768
          ],
          [
            0.1,
            0.9619397662556434
          ],
          [
            0.12,
            0.9455032620941839
          ],
          [
            0.14,
            0.9263200821770461
          ],
          [
            0.16,
            0.9045084971874737
          ],
          [
            0.18,
            0.8802029828000155
          ],
          [
            0.2,
            0.8535533905932737
          ],
          [
            0.22,
            0.8247240241650919
          ],
          [
            0.24,
            0.7938926261462366
          ],
          [
            0.26,
            0.7612492823579744
          ],
          [
            0.28,
            0.7269952498697734
          ],
          [
            0.3,
            0.691341716182545
          ],
          [
            0.32,
            0.6545084971874737
          ],
          [
            0.34,
            0.6167226819279528
          ],
          [
            0.36,
            0.5782172325201156
          ],
          [
            0.38,
            0.5392295478639225
          ],
          [
            0.4,
            0.5
          ],
          [
            0.42,
            0.46077045213607765
          ],
          [
            0.44,
            0.4217827674798847
          ],
          [
            0.46,
            0.38327731807204746
          ],
          [
            0.48,
            0.34549150281252633
          ],
          [
            0.5,
            0.30865828381745514
          ],
          [
            0.52,
            0.2730047501302266
          ],
          [
            0.54,
            0.2387507176420256
          ],
          [
            0.56,
            0.2061073738537635
          ],
          [
            0.58,
            0.1752759758349084
          ],
          [
            0.6,
            0.14644660940672644
          ],
          [
            0.62,
            0.1197970171999847
          ],
          [
            0.64,
            0.09549150281252633
          ],
          [
            0.66,
            0.07367991782295391
          ],
          [
            0.68,
            0.054496737905816106
          ],
          [
            0.7,
            0.03806023374435674
          ],
          [
            0.72,
            0.02447174185242329
          ],
          [
            0.74,
            0.013815039801161721
          ],
          [
            0.76,
            0.00615582970243117
          ],
          [
            0.78,
            0.001541333133436018
          ],
          [
            0.8,
            0.0
          ],
          [
            0.82,
            0.0
          ],
          [
            0.84,
            0.0
          ],
          [
            0.86,
            0.0
          ],
          [
            0.88,
            0.0
          ],
          [
            0.9,
            0.0
          ],
          [
            0.92,
            0.0
          ],
          [
            0.94,
            0.0
          ],
          [
            0.96,
            0.0
          ],
          [
            0.98,
            0.0
          ],
          [
            1.0,
            0.0
          ]
        ]
      }
    ]
  }
}
```


[PAPER-REPORTED] OPCD samples a student response without context, then scores it under a teacher given extracted experience or a system prompt. Its printed objective is response-length-normalized conditional reverse KL, while implementation uses the student's top256 tokens [R39.6, §3; Appendix A.3]. A fixed teacher and a continuously updated self-teacher are distinct variants; an EMA target would add a state update and lag. Self-distillation need not have zero loss when teacher and student weights coincide, because their conditioning contexts differ. The inspected source reports self-distillation instability; it does not disclose a fully pinned optimizer/EMA implementation.

[MATHEMATICALLY-DERIVED] DeepSeek-V4 reports a weighted sum of expert reverse KL. For fixed positive weights $w_i$ summing to one and positive expert laws at one prefix,

$$
\sum_iw_i\operatorname{KL}(q\Vert p_i)
=\operatorname{KL}(q\Vert g)-\log Z_g,\qquad
g(v)=\frac{\prod_i p_i(v)^{w_i}}{Z_g}.
$$
*(Eq. 39.13)*

where $Z_g=\sum_v\prod_i p_i(v)^{w_i}$. The optimum is a normalized geometric product, not an arithmetic mixture. Experts with positive weight and zero mass restrict common support; disjoint supports can make every candidate infinite. Domain-specific teacher assignment, weights and prompt mixing can change the target, but the report's brief routing description does not disclose a deployable router. GLM-5 reports prompts drawn from corresponding prior-stage training sets with group size one and batch1024, using detached teacher/student sampled log-ratio advantages; this is a different disclosed estimator [R39.7, §3.5].

## Algorithm

**Algorithm 39.4 — Versioned mixed-turn interaction and role loss.** [DERIVED] Inputs are frozen behavior student/teacher versions, an environment snapshot, positive integer turn/token/update caps, finite deadlines and a guidance schedule in $[0,1]$. Output is a role-labelled rollout batch and a declared local student update, or a named failure. This reconstructs Guided-OPD's roles; optional teacher adaptation is a separately bounded SCOUT-style transaction, not claimed to be Guided-OPD code.

$$
\begin{aligned}
1.&\quad h\leftarrow x;\ t\leftarrow0;\ \mathcal B\leftarrow\varnothing;\ \text{freeze behavior and environment versions.}\\
2.&\quad \text{While }t<T_{\max}\text{ and deadline remains: draw }Z_t\sim\operatorname{Bernoulli}(\gamma).\\
3.&\quad \text{Generate one bounded turn with teacher if }Z_t=1\text{, student otherwise; log actual behavior law.}\\
4.&\quad \text{On timeout/error return named incomplete rollout; validate tool arguments and authorization.}\\
5.&\quad \text{Execute an allowed action once; record its result/idempotency key; append observation without target loss.}\\
6.&\quad \mathcal B\leftarrow\mathcal B\cup(h,Z_t,\text{turn},\text{versions});\ h\leftarrow\text{updated history};\ t\leftarrow t+1.\\
7.&\quad \text{On terminal event stop; on cap record truncation separately from terminal success.}\\
8.&\quad \text{Compute declared teacher-turn FKL/student-turn RKL on fixed histories; validate support and masks.}\\
9.&\quad \text{Normalize under declared turn/token weights; commit only a finite complete student update.}\\
10.&\quad \text{If teacher adaptation is enabled, bound its continuation budget and publish its new version atomically.}
\end{aligned}
$$

[DERIVED] Invariants are one behavior owner per turn, immutable scorer identity within a student update, observation tokens excluded from action loss, bounded side effects and explicit termination/truncation. Tool retries require idempotent semantics or a new recorded state; replaying a trace must not duplicate an external action. Empty losses skip optimizer/scheduler mutation. Worst-case generation is $O(T_{\max}L_{\max})$ action tokens per episode, plus teacher scoring, environment work and optional adaptation. This accounting does not conflate tool latency with model FLOPs.

## Implementation

[DERIVED] Save separate tensors for student-generated actions, teacher-generated actions, tool observations and padding. Preserve actual sampled behavior log probabilities after temperature/support processors. A rollout service and learner with different versions need a staleness policy; a stale rollout is not current on-policy merely because it came from a student. Teacher publishing must be atomic so one batch does not mix unidentified targets. Conditional full-vocabulary losses need scoring at student prefixes, whereas sampled K1 losses need consistent action log probabilities and detached advantages.

[PAPER-REPORTED] Guided-OPD uses Trinity-RFT with staleness limit two and BF16; SCOUT uses verl and vLLM with distinct actor/teacher-training resources [R39.5, Table4; R39.4, Appendix B]. Their named frameworks describe the source protocols, without establishing identical kernels or estimator implementations. Cross-stage distillation needs retention evaluation because experts can disagree; it is not a guarantee that all earlier competencies survive.

## Experimental design

### Reported experiments

| Field | Guided-OPD [R39.5, §4; Appendix A/Table4] | SCOUT [R39.4, §4; Appendices B–C] |
|---|---|---|
| Models | Qwen3-30B-A3B→.6/1.7/4B | Qwen3-4B-Instruct-2507 or8B-DAPO→1.7B; Skywork7B→DeepSeek distilled1.5B |
| Data/evaluation | ALFWorld seen/unseen, ScienceWorld, WebShop validation; turn caps30/30/15 | OpenR1-Math46K one epoch; code7.5K three epochs; six math/three code benchmarks |
| Training |250steps; AdamW LR $10^{-6}$, clip1; trainbatch64; guidance cosine1→0 at80%; seed42 | Student LR selected grid; teacher GRPO8 continuations, reference KL.001, update interval10; no SFT warmup |
| Hardware/precision |8H20-96GB;4actor/2teacher/2learner, TP2, Ulysses2; BF16 |4B SCOUT24A100-40GB,7/8B32; OPD16; PyTorch2.9/vLLM.12/verl.9.dev0 |
| Decoding/budget | Train temp1/eval.4, prompt10240/response512 | Train temp1/top-p1; eval.6/.95; response cap16384 |
| Uncertainty/gaps | Single seed; independent-run uncertainty and exact artifact pins NOT-DISCLOSED | Three training runs;4–32 repeated evals; aggregate SD and one-sided tests; exact commits NOT-DISCLOSED |

## Observations

**What the paper claims.** [PAPER-REPORTED] Turn guidance reduces drift for smaller agents; student-conditioned teacher adaptation improves supervision on student histories [R39.4–R39.5].

**What the evidence shows.** [PAPER-REPORTED] Guided1.7B average success16.11→19.93% versus vanilla OPD, a3.82-point gain; its asymmetric default score37.94 exceeds swapped-role33.32 and both-reverse36.58. Fixed-guidance schedules trail the cosine curriculum. SCOUT4B-teacher math49.2±1.5→51.4±.6 and code56.6±.3→59.7±1.9; adaptation from original prompts instead yields48.8/57.0. Holding initial student prefixes fixed still improves teacher continuation, a more direct control than comparing matched evolving checkpoints. Teacher update intervals1/5/10 yield51.3/52.5/51.5 average math;20 deteriorates toward OPD. A fixed-data compute comparison uses SCOUT one epoch against OPD three, which does not rule out benefits from fresh OPD data.

**What we infer.** [DERIVED] Teacher conditioning and mixed-history training can address distinct distribution mismatches. Their local losses and source experiments support restricted mechanisms; neither source establishes an unbiased full-trajectory gradient merely by using student data.

**What remains unknown.** [NOT-DISCLOSED] Exact production expert routing, isolated GLM/DeepSeek distillation contributions, shared-budget generality and artifact-level equivalence across implementations remain unresolved.


```figure
{
  "id": "fig-39.22",
  "kind": "chart",
  "title": "Teacher adaptation control on matched tasks",
  "caption": "Reported source means for the Qwen3-4B teacher to Qwen3-1.7B student. The original-prompt teacher-GRPO control does not match student-prefix-conditioned SCOUT; full protocols are in the accompanying table.",
  "placement": "wide",
  "evidence": "PAPER-REPORTED",
  "source": "R39.4",
  "alt": "Reported source means for the Qwen3-4B teacher to Qwen3-1.7B student. The original-prompt teacher-GRPO control does not match student-prefix-conditioned SCOUT; full protocols are in the accompanying table.",
  "spec": {
    "type": "bar",
    "x": {
      "label": "Task"
    },
    "y": {
      "label": "Reported macro accuracy percent",
      "format": "fixed1"
    },
    "categories": [
      "Math",
      "Code"
    ],
    "series": [
      {
        "id": "opd",
        "label": "OPD",
        "values": [
          49.2,
          56.6
        ]
      },
      {
        "id": "original",
        "label": "Original-prompt teacher GRPO",
        "values": [
          48.8,
          57.0
        ]
      },
      {
        "id": "scout",
        "label": "SCOUT",
        "values": [
          51.4,
          59.7
        ]
      }
    ]
  },
  "context": {
    "hardware": "24 A10040GB for SCOUT,16 for OPD",
    "model": "Qwen3-4B-Instruct-2507 to Qwen3-1.7B",
    "precision": "Training precision NOT-DISCLOSED",
    "sequenceLength": "Response cap16384",
    "ioDistribution": "OpenR1-Math and code tasks",
    "concurrency": "Source rollout/train batch128",
    "runtimeVersion": "PyTorch2.9,vLLM.12,verl.9.dev0",
    "measurementBoundary": "Source Table4 mean benchmark accuracy"
  }
}
```


```figure
{
  "id": "fig-39.23",
  "kind": "diagram",
  "title": "A tool turn has four distinct owners",
  "caption": "Teacher/student actions and environment observations have separate origins. Observation text is appended to the state but excluded from the action-target loss.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.12",
  "alt": "Teacher/student actions and environment observations have separate origins. Observation text is appended to the state but excluded from the action-target loss.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "h",
        "kind": "state",
        "label": "Mixed history"
      },
      {
        "id": "role",
        "kind": "branch",
        "label": "Teacher or student role"
      },
      {
        "id": "act",
        "kind": "tensor",
        "label": "Reasoning and action targets"
      },
      {
        "id": "env",
        "kind": "process",
        "label": "Bounded environment execution"
      },
      {
        "id": "obs",
        "kind": "tensor",
        "label": "Observation: context only"
      },
      {
        "id": "loss",
        "kind": "objective",
        "label": "Role-specific local KL"
      }
    ],
    "edges": [
      {
        "from": "h",
        "to": "role"
      },
      {
        "from": "role",
        "to": "act"
      },
      {
        "from": "act",
        "to": "env"
      },
      {
        "from": "env",
        "to": "obs"
      },
      {
        "from": "obs",
        "to": "h"
      },
      {
        "from": "act",
        "to": "loss"
      }
    ]
  }
}
```


```figure
{
  "id": "fig-39.24",
  "kind": "matrix",
  "title": "Mixed-history counterexample",
  "caption": "At the second turn, the example mixed history contributes .25F plus .25R; mixing pure histories gives .45F plus .05R. Equal role probabilities do not imply equal state distributions.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.12",
  "alt": "At the second turn, the example mixed history contributes .25F plus .25R; mixing pure histories gives .45F plus .05R. Equal role probabilities do not imply equal state distributions.",
  "spec": {
    "rows": 2,
    "cols": 2,
    "pattern": "explicit",
    "cells": [
      [
        0.25,
        0.25
      ],
      [
        0.45,
        0.05
      ]
    ],
    "rowLabel": "Quantity",
    "colLabel": "Access or choice",
    "rowTicks": [
      "Mixed law",
      "Pure mixture"
    ],
    "colTicks": [
      "Forward term",
      "Reverse term"
    ],
    "legend": "Cell values are the stated quantities; they are not empirical performance."
  }
}
```


## Failure modes

[DERIVED] A role-mixture history can be mislabeled pure student on-policy; teacher adaptation can invalidate cached targets; tool observation tokens can become accidental imitation targets; clipped sampled advantages can be misrepresented as dense KL. An exponential schedule with positive terminal guidance never reaches zero at finite time unless an explicit cutoff is added. Nonstationary self-teachers can drift with the student and amplify errors rather than supply an independent target.

## Siblings

[DERIVED] Offline demonstrations fix the teacher's histories; pure student OPD fixes the rollout owner to the student; Guided-OPD changes turn ownership; SCOUT changes the teacher itself; OPCD changes teacher conditioning; cross-stage distillation changes the specialist target. Compare sampler, target and optimizer separately. Optional environment RL supplies an outcome objective rather than teacher agreement and belongs to Chapters34–36.

## Extensions

### Improvements

[PAPER-REPORTED] SCOUT plus the source's OPTR loss reaches52.3 math and60.5 code versus49.8/59.3 without SCOUT [R39.4, §5, Table5], supporting complementary teacher-adaptation and loss changes under that protocol. OPCD reports frozen-teacher Sokoban53.9 versus self-teacher18.8 and medical56.8 versus50.0 [R39.6, §4.6]; this is a negative result for that moving-target variant, not a proof against every self-distillation design.

## Limitations

[DERIVED] Environment versions, teacher/student processors and action support are part of the policy law. The geometric-product result assumes fixed expert weights at a fixed prefix; it does not reconstruct a private task router. Correct local gradient formulas do not settle long-horizon occupancy, causal credit or external-action safety.

## Reproducibility

[DERIVED] Record role draws, full history hashes, behavior/scorer versions, environment observations, action IDs, guidance schedule, target masks and teacher adaptation transactions. Distinguish training-run SD from repeated-decoding SEM and single-seed curves. The finite mixed-history counterexample and chain-rule derivation are analytical checks; no interactive training was executed here.

## References

[R39.4](references.md#r39-4), [R39.5](references.md#r39-5), [R39.6](references.md#r39-6), [R39.7](references.md#r39-7), [R39.8](references.md#r39-8).
