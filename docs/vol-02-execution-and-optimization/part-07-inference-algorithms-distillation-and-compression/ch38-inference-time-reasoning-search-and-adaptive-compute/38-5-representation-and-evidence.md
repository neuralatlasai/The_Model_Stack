---
id: "ms.section.38.5"
entity_type: "section"
title: "Representation and evidence"
short_title: "Representation and evidence"
volume: 2
part: 7
chapter: 38
section: 38.5
slug: "38-5-representation-and-evidence"
parent: "ms.chapter.38"
prev_sibling: "ms.section.38.4"
next_sibling: "ms.section.38.6"
children: []
prerequisites: ["ms.chapter.6", "ms.chapter.32", "ms.chapter.35", "ms.chapter.37"]
downstream: ["ms.chapter.39", "ms.chapter.47", "ms.chapter.61", "ms.chapter.63", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["inference", "evaluation", "assurance"], "mechanism": ["search", "verification", "adaptive_compute"], "feedback_setting": ["verifiable_reward", "environment_return"], "modality": ["text", "code"]}
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

# 38.5 — Representation and evidence

## Scope

[DERIVED] A reasoning representation is the state over which inference computation proceeds. This section distinguishes visible text traces, compressed continuous states, stochastic latent trajectories, recurrent refinement and provider-exposed reasoning controls. It teaches two inspected2026 latent mechanisms without identifying a latent step with a text token or asserting that decoded intermediate states are causally faithful explanations. Deployment weights remain fixed; the auxiliary training procedures are described because they determine what the inference state means and what preparation cost the system incurred.

[DERIVED] The evidence contract has three separate questions: what state is observable, what computation is actually performed, and what causal conclusion the observation supports. A readable intermediate sentence can be false or post hoc. An unreadable vector can carry useful task information. Neither representation alone determines correctness, monitorability or computational efficiency.

## Why this exists

[DERIVED] Text reasoning serializes intermediate state through vocabulary tokens and autoregressive decoding. Continuous methods can replace some textual positions with vectors or run a small recurrent module before a frozen decoder answers. This can reduce certain inference costs, but the replacement introduces its own proposer, refinement, flow-head, stopping and training costs. Counting four latent vectors while ignoring dozens of internal refinement passes is as incomplete as counting one final answer while ignoring its search tree.

[DERIVED] Representation also affects oversight. A text trace can expose evidence for an error without being a complete record of computation. A decoded latent can be a useful reconstruction lens without proving that the model used the reconstructed sentence. A hosted reasoning-effort flag can alter observable behavior without disclosing whether the provider uses text, continuous states, search, distillation or another internal mechanism.

## Intuition

[DERIVED] A continuous state is an input to another computation, not a miniature proof. Ask how it is produced, what conditions it on the prompt, how the decoder consumes it and which losses shaped it. A recurrent refiner repeatedly updates a working state. An autoregressive flow model samples the next state from a conditioned continuous distribution. Their numerical steps operate on different networks and have different physical costs.

[DERIVED] Training a small module against a frozen decoder does not eliminate differentiation through that decoder. Freezing parameters removes their optimizer updates; it does not remove the activation gradients needed to teach the module how its inputs affect the answer. This distinction determines training memory and invalidates a common claim that a frozen large model is computationally absent from auxiliary training.


```figure
{
  "id": "fig-38.25",
  "kind": "diagram",
  "title": "Two continuous-state mechanisms",
  "caption": "A stochastic flow head samples autoregressive states; a recurrent refiner updates proposed slots before a frozen decoder. Both still decode an answer.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.20",
  "alt": "A stochastic flow head samples autoregressive states; a recurrent refiner updates proposed slots before a frozen decoder. Both still decode an answer. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "state",
        "label": "Prompt"
      },
      {
        "id": "n1",
        "kind": "model",
        "label": "Conditioned flow head"
      },
      {
        "id": "n2",
        "kind": "tensor",
        "label": "Autoregressive latents"
      },
      {
        "id": "n3",
        "kind": "model",
        "label": "Task proposer"
      },
      {
        "id": "n4",
        "kind": "process",
        "label": "Recurrent refinement"
      },
      {
        "id": "n5",
        "kind": "model",
        "label": "Answer decoder"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n1",
        "to": "n2",
        "label": "sample"
      },
      {
        "from": "n2",
        "to": "n1",
        "label": "history"
      },
      {
        "from": "n0",
        "to": "n3"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "base slots"
      },
      {
        "from": "n2",
        "to": "n5"
      },
      {
        "from": "n4",
        "to": "n5",
        "label": "refined slots"
      }
    ]
  }
}
```


## Formulation

> **Definition — Latent inference step.** A declared state update or sampled continuous-vector production with specified network evaluations, state dimensions, numerical integration, stopping and decoder interface. Its count has no universal conversion to text tokens or FLOPs.

[MATHEMATICALLY-DERIVED] An autoregressive latent model with prompt $x$, latent trajectory $z_{1:T}$ and answer $y$ factors as

$$
p_\theta(z_{1:T},y\mid x)=\prod_{t=1}^{T}p_\theta(z_t\mid x,z_{<t})\ p_\theta(y\mid x,z_{1:T}).
$$
*(Eq. 38.20)*

A complete model also specifies the stopping law or deterministic stopping rule. The factorization alone does not make the latent marginal density tractable. An answer decoder can emit text autoregressively after latent reasoning, so answer-token cost remains present even if the intermediate trajectory is compact.

[MATHEMATICALLY-DERIVED] For a conditioned flow, let $\epsilon\sim\mathcal N(0,I)$, target latent $z$, interpolation $z_\tau=(1-\tau)\epsilon+\tau z$, and field $v_\psi(z_\tau,\tau,h)$. A flow-matching target is $z-\epsilon$ and an Euler inference step is

$$
\mathcal L_{\rm flow}=\mathbb E\|v_\psi(z_\tau,\tau,h)-(z-\epsilon)\|^2,\qquad
u_{k+1}=u_k+\Delta\tau_kv_\psi(u_k,\tau_k,h).
$$
*(Eq. 38.21)*

This equation states the interpolation and numerical approximation, not an exact finite-step sampler for an arbitrary target density. Integration error, guidance and stopping can change the generated distribution.


```figure
{
  "id": "fig-38.26",
  "kind": "calculator",
  "title": "Latent-step cost has components",
  "caption": "The accounting follows Eq.38.21: one backbone unit plusKf head units per thought, then answer decoding. Inputs are analytical normalized costs, not measured timings.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.21",
  "alt": "The accounting follows Eq.38.21: one backbone unit plusKf head units per thought, then answer decoding. Inputs are analytical normalized costs, not measured timings. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "equation": "38.21",
    "tex": "C=K_z(c_b+K_fc_f)+L_yc_y",
    "inputs": [
      {
        "symbol": "Kz",
        "label": "Latent count",
        "default": 8,
        "min": 1,
        "max": 32,
        "format": "integer",
        "options": [
          1,
          2,
          4,
          8,
          16,
          32
        ]
      },
      {
        "symbol": "Kf",
        "label": "Flow evaluations per latent",
        "default": 24,
        "min": 1,
        "max": 48,
        "format": "integer",
        "options": [
          1,
          4,
          8,
          16,
          24,
          32,
          48
        ]
      },
      {
        "symbol": "cb",
        "label": "Backbone cost per latent",
        "default": 1,
        "min": 0.01,
        "max": 10,
        "format": "fixed3"
      },
      {
        "symbol": "cf",
        "label": "Head cost per evaluation",
        "default": 0.01,
        "min": 0.001,
        "max": 1,
        "format": "fixed3"
      },
      {
        "symbol": "Ly",
        "label": "Answer tokens",
        "default": 512,
        "min": 64,
        "max": 2048,
        "format": "integer",
        "options": [
          64,
          128,
          256,
          512,
          1024,
          2048
        ]
      },
      {
        "symbol": "cy",
        "label": "Answer-token cost",
        "default": 0.02,
        "min": 0.001,
        "max": 1,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "latent",
        "label": "Latent work",
        "formula": "Kz*(cb+Kf*cf)",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "answer",
        "label": "Answer work",
        "formula": "Ly*cy",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "total",
        "label": "Total modeled work",
        "formula": "Kz*(cb+Kf*cf)+Ly*cy",
        "format": "fixed3",
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Eight latents",
      "variables": {
        "Kz": 8
      }
    },
    {
      "anchor": "mechanism",
      "label": "More field evaluations",
      "variables": {
        "Kf": 48
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Long answer dominates",
      "variables": {
        "Ly": 2048
      }
    }
  ]
}
```


## Mechanism

### Methodology

[DERIVED] **Autoregressive Thought Flow.** The inspected ATF method conditions a flow head on the backbone's current causal history, samples a continuous next thought, appends it to the history and updates the backbone cache. It then either continues latent generation or appends a stop vector and decodes an answer. The small flow head performs multiple numerical evaluations per thought; the backbone does not necessarily run at each flow substep. Classifier-free guidance combines conditional and unconditional fields, adding field evaluations and changing the sampling distribution. [R38.4](references.md) §3.

[DERIVED] Its CR-VAE encodes text chunks into history-conditioned stochastic registers and trains reconstruction plus a KL penalty. History conditioning makes residual coding possible; it does not logically force a register to contain only new information. Redundant encodings can still reconstruct successfully. A residual-information claim needs additional identification or intervention evidence. The VAE decoder's reconstruction supplies a lens on generated latents, not proof that the reconstructed prose is the exact reasoning used by the answer decoder.

[MATHEMATICALLY-DERIVED] **Transition scores versus likelihood ratios.** For a recorded stochastic transition $u'\sim\mathcal N(\mu_\theta,\sigma^2I_d)$ with fixed positive $\sigma$, the true log-density difference is

$$
\log\frac{q_\theta(u'\mid u,h)}{q_{\rm old}(u'\mid u,h)}
=\frac{\|u'-\mu_{\rm old}\|^2-\|u'-\mu_\theta\|^2}{2\sigma^2};\qquad
\exp(\Delta\ell_{\rm avg})=\left(\frac{q_\theta}{q_{\rm old}}\right)^{1/d}.
$$
*(Eq. 38.22)*

The second identity follows when $\ell_{\rm avg}$ divides the Gaussian log-density by dimension $d$. ATF's inspected AppendixA explicitly uses this dimension-normalized score and also supports a raw squared-error surrogate that omits variance weighting. Neither is the marginal probability of a completed thought. Deterministic integration steps and deterministic stop-margin decisions are not ordinary scored stochastic actions. A clipped surrogate using these scores is a declared surrogate; it must not be relabeled exact trajectory importance sampling. [R38.4](references.md)

[DERIVED] The source separates latent-trajectory reward from answer variation conditional on that trajectory. Centering and standardization couple sampled rewards, as Chapter35 explains. An answer-only RL ablation changes the decoder/backbone through text objectives while leaving the continuous-transition term disabled. It is distinct from jointly training latent transition and answer score surrogates. Report which branch produced each result rather than merging them into one generic “latent RL” claim.


```figure
{
  "id": "fig-38.27",
  "kind": "chart",
  "title": "Dimension-normalized ratio differs",
  "caption": "Eq.38.22 compares exp(log-ratio) with its eighth root for dimension8. The x-axis is a true Gaussian log-density difference. The logarithmic y-axis exposes the multiplicative compression;101 samples represent the continuous log-ratio.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.22",
  "alt": "A continuous log-ratio from0 to4 gives full ratios1 to54.598, while dimension8 normalization gives1 to1.649. Both equal1 at log-ratio0. The y-axis is logarithmic; these are analytical Gaussian transition ratios, not empirical performance.",
  "spec": {
    "type": "line",
    "x": {
      "label": "true transition log-ratio",
      "domain": [
        0,
        4
      ]
    },
    "y": {
      "label": "ratio",
      "scale": "log2",
      "domain": [
        1,
        64
      ]
    },
    "series": [
      {
        "id": "n0",
        "label": "Full ratio",
        "formula": "exp(x)",
        "sample": {
          "from": 0,
          "to": 4,
          "count": 101
        },
        "emphasis": true
      },
      {
        "id": "n1",
        "label": "Dimension-normalized ratio",
        "formula": "exp(x/8)",
        "sample": {
          "from": 0,
          "to": 4,
          "count": 101
        },
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 0,
        "y": 1,
        "label": "Both ratios1 at log-ratio0"
      },
      {
        "x": 4,
        "y": 1.6487212707001282,
        "label": "Eighth-root ratio1.649"
      }
    ]
  }
}
```


[MATHEMATICALLY-DERIVED] **Latent Recurrent Thoughts.** A task-dedicated proposer produces $L^0=g_\psi(x)\in\mathbb R^{K\times d}$. A refiner works in width $d'$, receives $u=P_\downarrow L^0$, and repeatedly updates fast/slow states before emitting a residual:

$$
z_L\leftarrow f_\phi(z_L,z_H+u)\quad(T\text{ times});\qquad
z_H\leftarrow f_\phi(z_H,z_L);\qquad
L^\star=L^0+P_\uparrow z_H.
$$
*(Eq. 38.23)*

The inspected LRT recipe uses $S=H=3$, $T=4$, hence45 transition-block passes. Only the final five passes are differentiated during refiner training. Training uses32 proposal slots, while inference keeps the first4 before refinement. A residual penalty $\lambda\|L^\star-L^0\|^2$ discourages drift; it is not a hard norm constraint or a mathematical bounded-correction guarantee. [R38.5](references.md) §3, AppendicesA,E.

[MATHEMATICALLY-DERIVED] If frozen decoder parameters are $\theta$ and trainable latent parameters are $\phi$, the chain rule remains

$$
\nabla_\phi\mathcal L_{\rm CE}(M_\theta(L_\phi),y)
=\left(\frac{\partial L_\phi}{\partial\phi}\right)^\top
\left(\frac{\partial M_\theta}{\partial L}\right)^\top\nabla_M\mathcal L_{\rm CE},\qquad\nabla\theta\text{ update}=0.
$$
*(Eq. 38.24)*

Activation differentiation through the frozen decoder is required. Prefix caching can avoid recomputing a prompt prefix independent of trainable latents, but the suffix computation that depends on them still carries gradients. Truncated recurrence is a training estimator choice; it does not prove the omitted earlier-state gradient is zero.

## Algorithm

**Algorithm 38.6 — Resource-admitted latent inference, with explicit representation branch.** Inputs are a validated mode $m\in\{\mathrm{ATF},\mathrm{LRT}\}$, frozen identities, positive integer maximum latent count $K_z$, positive integer flow evaluation cap $K_f$, positive integer recurrence depths $S,H,T$, answer-token cap $L_y$, finite execution deadlines, and a nonnegative enforceable worst-case resource allowance $\mathbf u_m$. State is latent history $Z$, numerical/refiner state, ledger $H_\ell$ and actual consumed resources.

$$
\begin{aligned}
1.\;&\mathbf u_m\nleq\mathbf B\Rightarrow\textbf{return }(\mathrm{ABSTAIN},\mathrm{DENIED});\quad
 \iota\gets\mathrm{UniqueID}(x,m);\ \mathrm{Reserve}(\iota,\mathbf u_m);\ Z,H_\ell\gets\varnothing.\\
2.\;&m=\mathrm{ATF}\Rightarrow\left\{\begin{aligned}
&t\gets0;\quad\textbf{while }t<K_z:\ h_t\gets\mathrm{Backbone}(x,Z);\ u_0\gets\epsilon_t\sim\mathcal N(0,I);\\
&\textbf{for }k=0,\ldots,K_f-1:\ u_{k+1}\gets u_k+\Delta\tau_kv_\psi(u_k,\tau_k,h_t);\quad\mathrm{LogFieldWork}(H_\ell,k);\\
&\mathrm{NonfiniteOrError}\Rightarrow[\mathrm{FinalizeFailure}(H_\ell);\ \mathrm{ReleaseUnused}(\iota);\ \textbf{return }(\mathrm{ABSTAIN},H_\ell)];\quad
 Z\gets Z\oplus u_{K_f};\ h_{\rm post}\gets\mathrm{BackboneUpdate}(h_t,u_{K_f});\ b_{\rm stop}\gets\mathrm{StopMargin}(h_{\rm post},Z);\ t\gets t+1;\quad b_{\rm stop}\Rightarrow\textbf{break}.
\end{aligned}\right.\\
3.\;&m=\mathrm{LRT}\Rightarrow\left\{\begin{aligned}
&L^0\gets\mathrm{KeepFirst}_{K_z}(g_\psi(x));\quad u\gets P_\downarrow L^0;\ z_L,z_H\gets z_L^0,z_H^0;\\
&\textbf{for }s=1,\ldots,S:\ \textbf{for }h=1,\ldots,H:\
 \textbf{for }t=1,\ldots,T:\ z_L\gets f_\phi(z_L,z_H+u);\quad
 z_H\gets f_\phi(z_H,z_L)\ \text{after the fast loop};\\
&\mathrm{NonfiniteOrError}\Rightarrow[\mathrm{FinalizeFailure}(H_\ell);\ \mathrm{ReleaseUnused}(\iota);\ \textbf{return }(\mathrm{ABSTAIN},H_\ell)];\quad
 Z\gets L^0+P_\uparrow z_H.
\end{aligned}\right.\\
4.\;&(y,z,\mathbf c)\gets\mathrm{DecodeCapped}(x,Z,L_y);\quad
 H_\ell\gets H_\ell\cup\{(\iota,m,Z,y,z,\mathbf c)\};\ \mathrm{FinalizeAllWork}(H_\ell);\ \mathrm{ReleaseUnused}(\iota).\\
5.\;&z\ne\mathrm{COMPLETE}\lor\neg\mathrm{ValidAnswer}(y)\Rightarrow\textbf{return }(\mathrm{ABSTAIN},H_\ell);\quad
 \textbf{return }(y,H_\ell).
\end{aligned}
$$

[DERIVED] All calls use the reserved allowance and terminate at enforced caps/deadlines; failure finalization retains proposer, backbone, flow/refiner and partial decoder work before returning ABSTAIN. The ATF branch shows deterministic integration; stochastic-transition RL is a separate training procedure with its own logged action scores. Guidance, if enabled, reserves both field evaluations. $K_z$ cannot exceed available LRT proposal slots. This is an auditable inference skeleton, not a claim of equivalence between ATF and LRT state distributions.

## Implementation

[OFFICIAL-DOCUMENTATION] At LRT commit `1113bfbb12de8a9d4703f98a37eef2ffcc566a7c`, `lrt/modules.py:232` implements no-gradient warmup cycles followed by one differentiated cycle. `lrt/decoder.py:165` separates a no-gradient prefix cache from the differentiated suffix. `lrt/train.py:218` recomputes frozen proposer outputs per batch; this inspected code does not establish the paper's claimed persistent offline base-latent cache. `requirements.txt` uses version ranges rather than reproducing every exact package pin listed in the paper. [R38.5](references.md) implementation ledger.

[DERIVED] For ATF, report backbone evaluations, flow-head evaluations, latent-state width, maximum latent count, answer-token count and guidance configuration. For LRT, report proposer dimensions, number of retained slots, recurrence passes and answer decoding. Cache keys include model/module identity, prompt serialization, positional conventions and selected latent count. Training and inference configurations must not be silently equated when the number of latent slots differs.


```figure
{
  "id": "fig-38.28",
  "kind": "memory-stack",
  "title": "Differentiated recurrence is a subset of forward work",
  "caption": "Eq.38.23 with S=H=3,T=4 gives45 recurrent-block passes. Training differentiates the final5 and detaches40; inference runs45 forward passes. Equal pass counts are not equal FLOPs, activation memory or latency.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.23",
  "alt": "Training recurrence is a45-pass stack split into40 detached and5 differentiated passes. Inference is45 forward-only passes. The chart omits neither detached work nor the frozen decoder activation gradient required during training.",
  "spec": {
    "format": "integer",
    "variables": {
      "S": 3,
      "H": 3,
      "T": 4
    },
    "bars": [
      {
        "label": "Refiner training",
        "segments": [
          {
            "label": "Detached forward passes",
            "formula": "(S*H-1)*(T+1)",
            "kind": "process"
          },
          {
            "label": "Differentiated forward passes",
            "formula": "T+1",
            "kind": "feedback"
          }
        ]
      },
      {
        "label": "Refiner inference",
        "segments": [
          {
            "label": "Forward passes",
            "formula": "S*H*(T+1)",
            "kind": "process"
          }
        ]
      }
    ]
  },
  "anchor": "formulation"
}
```


## Experimental design

### Reported experiments

[PAPER-REPORTED] The two latent studies compare different controlled interfaces; their values are not a cross-paper ranking. [R38.4](references.md), [R38.5](references.md)

| Field | ATF | LRT |
|---|---|---|
| Matched comparison | Qwen3-1.7B/4BBase; flow versus MSE with shared CR-VAE/stopping/decoder | Frozen Qwen3-8B; task proposer × none/energy/recurrent factorial |
| Data/evaluator | Math training mixture; MATH500; MathVerify0.9.0 saved-output rescoring | Countdown100k/1k, Sudoku100k/1k; MBPP374/500; HumanEval164; StrategyQA2061/229 |
| Training | Frozen CR-VAE then one epoch ATF; max32latents | Two30-epoch stages; batch64; AdamW3e-4/2e-4; bfloat16;1×96GBGPU |
| Finding | Qwen1.7B MATH500: MSE62.4, ATF66.8, answer-only-RL69.0 | Countdown: task proposer no-refiner42.0, recurrent56.7; factorial Table3 |
| Replication/gaps | Seeds/complete optimizer/hardware recipe: NOT-DISCLOSED | Main3seeds, ablations1; exactGPUmodel/latency boundary: NOT-DISCLOSED |

[DERIVED] ATF's reused LLaMA baseline scores are separate from its matched Qwen ablation. LRT's generic-proposer comparisons change more than the refiner; the factorial table is needed for component attribution. Author-reproduced EBM-CoT results are not an official implementation comparison. Neither source establishes that latent methods dominate all thinking-mode or larger-budget alternatives.

[OFFICIAL-DOCUMENTATION] OpenAI's current Astra card adds a separate text-evidence study: CoT-Control pairs benchmark questions with trace-style instructions and reports length-conditioned compliance on GPQA, HLE and MMLU-Pro. At750–1250CoTtokens it reports Astra60.9%, GPT5.6Sol16.1%, GPT5.5Thinking1.7%; exact inference hardware, seeds and model internals are NOT-DISCLOSED in that comparison. These are controllability measurements, not direct causal-faithfulness tests. [R38.9](references.md) §9.2.1, Figures28–30.

## Observations

**What the paper claims.** [PAPER-REPORTED] ATF models continuous next-thought distributions; LRT refines task-conditioned proposals with a small recurrent module. [R38.4](references.md), [R38.5](references.md)

**What the evidence shows.** [PAPER-REPORTED] The cited controlled ablations support benefits within their disclosed interfaces and budgets. They retain preparation cost, task specificity and representation/training asymmetries.

**What we infer.** [DERIVED] Representation choice is a mechanism and resource intervention. Readable reconstruction, compact latent count and frozen parameters each leave substantial unanswered questions about causality and total cost.

**What remains unknown.** [UNVERIFIED] No inspected source establishes a complete causal account of frontier provider reasoning or a universal conversion between latent steps, text length and useful computation.

## Failure modes

[DERIVED] A VAE can reconstruct plausible text from redundant or weakly identified states. A recurrent module can converge to a fixed point that encodes the wrong answer. A residual penalty can permit arbitrarily large corrections at finite loss. A dimension-normalized score ratio can be mistaken for exact importance sampling. A training-only large latent interface can hide deployment degradation after slot truncation. A provider control can change exposed text without proving what internal algorithm changed.


```figure
{
  "id": "fig-38.29",
  "kind": "compare",
  "title": "Observation is not causal proof",
  "caption": "The comparison distinguishes visible text, decoded latent reconstruction and a controlled intervention.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.25",
  "alt": "The comparison distinguishes visible text, decoded latent reconstruction and a controlled intervention. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "axis": "Intervention",
    "columns": [
      {
        "id": "n0",
        "label": "Text trace"
      },
      {
        "id": "n1",
        "label": "Latent reconstruction"
      },
      {
        "id": "n2",
        "label": "Causal intervention"
      }
    ],
    "rows": [
      {
        "dimension": "Provides",
        "values": {
          "n0": "Generated statements",
          "n1": "Decoder lens",
          "n2": "Outcome contrast"
        }
      },
      {
        "dimension": "Does not establish",
        "values": {
          "n0": "Complete internal process",
          "n1": "Unique semantic meaning",
          "n2": "Universal faithfulness"
        }
      },
      {
        "dimension": "Required context",
        "values": {
          "n0": "Prompt/control/version",
          "n1": "Encoder/decoder identity",
          "n2": "Intervention and shift audit"
        }
      }
    ]
  }
}
```


[MATHEMATICALLY-DERIVED] Causal trace claims require a declared intervention, for example

$$
\Delta_T=\mathbb E[C\mid\operatorname{do}(T=\mathrm{retained})]-\mathbb E[C\mid\operatorname{do}(T=\mathrm{removed})].
$$
*(Eq. 38.25)*

Specify what “removed” changes, whether other states remain fixed and whether the intervention creates an out-of-distribution input. Even a nonzero effect does not prove every trace statement is truthful, necessary or complete. Observing a convincing trace without such an intervention is weaker evidence.

## Siblings

[DERIVED] Chapters14–15 own attention/position state; Chapter37 owns decoding and cache validity. Chapter35 owns clipped policy-gradient and group estimators. Chapter64 owns interpretability and causal evidence. This section owns representation-specific inference accounting and the boundary between exposed reasoning and documented mechanism.

## Extensions

### Improvements

[DERIVED] Compare representations under matched total preparation plus deployment cost, with component-level ablations and held-out task families. Record numerical integration details and answer-length changes. Use a reconstruction lens for debugging while testing causal necessity separately. Update provider evidence by dated system-card version: a March observation about low controllability cannot be treated as a permanent property of September systems.


```figure
{
  "id": "fig-38.30",
  "kind": "tensor-flow",
  "title": "Proposal slots move through the latent refiner",
  "caption": "R38.5 §3 and AppendixE:the proposer trains with32 slots, inference retains4, model width4096 and refiner width256. The retained slots pass through45 recurrent-block evaluations before residual projection and answer decoding. This is the inference shape path, not a training-gradient diagram.",
  "placement": "inline",
  "evidence": "PAPER-REPORTED",
  "source": "R38.5",
  "alt": "The proposer emits32 by4096 values. Inference retains4 by4096, projects to4 by256, applies45 recurrence passes, projects the residual back to4 by4096 and sends these states to the frozen answer decoder. Answer-token work remains.",
  "spec": {
    "dims": {
      "Ktrain": "32 proposer slots",
      "K": "4 retained inference slots",
      "d": "4096 model width",
      "dp": "256 refiner width",
      "Ty": "answer tokens",
      "V": "answer vocabulary"
    },
    "steps": [
      {
        "shape": "[Ktrain, d]",
        "label": "Proposed latents"
      },
      {
        "shape": "[K, d]",
        "label": "Retained inference slots",
        "op": "Keep first4"
      },
      {
        "shape": "[K, dp]",
        "label": "Working state",
        "op": "Down-project"
      },
      {
        "shape": "[K, dp]",
        "label": "Refined state",
        "op": "45 recurrent-block passes"
      },
      {
        "shape": "[K, d]",
        "label": "Residual latent output",
        "op": "Up-project and add base proposal"
      },
      {
        "shape": "[Ty, V]",
        "label": "Answer logits",
        "op": "Frozen decoder"
      }
    ]
  }
}
```


## Limitations

[DERIVED] These latent studies remain task/model/protocol bounded. A compact interface can sacrifice inspectability and require specialized training. Mathematical factorization does not establish identifiability, and a favorable benchmark does not demonstrate a faithful reasoning trace. Hosted model evidence is restricted to disclosed controls and evaluations; architecture, latent state and internal search remain unknown where not documented.

## Reproducibility

[DERIVED] Publish auxiliary checkpoints, latent shapes, stopping margins, solver steps, random seeds, guidance, recurrence depths, train/inference slot counts, gradient truncation, decoder masks and all resource counters. Preserve the exact code commit and distinguish static inspection from executed reproduction. Track source-specific uncertainty and do not infer a GPU model from its memory capacity.

## References

[R38.4](references.md) §3 and AppendicesA–F; [R38.5](references.md) §3, Tables1/3 and AppendicesA,E,I,K plus pinned implementation; [R38.9](references.md) current §9.2.1. Equations38.20–38.25 and Algorithm38.6 expose assumptions and measurement boundaries rather than provider-internal claims.
