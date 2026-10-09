---
id: ms.section.34.1
entity_type: section
title: Sequential decision process
short_title: Sequential decision process
volume: 2
part: 6
chapter: 34
section: '34.1'
slug: 34-1-sequential-decision-process
parent: ms.chapter.34
prev_sibling: null
next_sibling: ms.section.34.2
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

# 34.1 — Sequential decision process

## Scope

[DERIVED] This section owns the decision process represented by a language-model rollout: histories, assistant actions, environment observations, reward placement, discounting and stopping. Its artifact is a replayable trajectory record with a declared probability measure. Policy-gradient estimation belongs to §34.2; optimizer clipping belongs to §34.3. A dialogue transcript alone is insufficient because it omits the distribution that produced each action and the reason that collection stopped.

## Why this exists

[DERIVED] An agent can emit a tool request, receive an observation, continue reasoning and eventually answer. The observation is a conditioning event, not an action sampled by the actor. Treating it as an actor target changes the gradient. Likewise, a response stopped by an evaluator's token budget is not automatically a terminated task. These distinctions affect both the statistical objective and the value function's boundary condition. A rollout service must preserve them before compression, batching or reward assignment erases their provenance.

[DERIVED] A principal-level implementation review begins with a probability contract rather than a trainer name. Reviewers need to know which tokenizer defines actions, which processors restrict the vocabulary, whether time advances per assistant token or per external transition, and whether termination is sampled or imposed. Replaying the same text under a different temperature does not reproduce the behavior probability. A changed tool schema can alter the transition kernel even when the policy checkpoint and prompt remain identical.

## Intuition

[MATHEMATICALLY-DERIVED] A history is a sufficient state when it contains everything the policy and environment need for the next transition. It need not be a compact Markov representation of the external world. The environment can remain partially observed; storing the observable history simply defines a history-dependent policy. Hidden sandbox state, retrieval snapshots and credentials can still affect transitions and must be versioned separately when reproducibility depends on them.

[DERIVED] The useful visual separation is actor choice, environmental response and accounting boundary. A tool return enters the next history without acquiring a policy score term. EOS can be an actor choice with a probability and a reward consequence. A transport timeout can instead be a collection failure. A token cap can be defined as an absorbing failure by the task, or can censor an otherwise continuing process. The same cap integer supports different objectives; the termination contract determines which one is being optimized.

## Formulation

| Object | Meaning | Unit or shape |
|---|---|---|
| $s_t=(x,h_{<t},e_t)$ | Observable decision history and declared environment context | Variable token/context sequence |
| $a_t$ | Assistant token action at decision $t$ | Vocabulary identifier |
| $P_e$ | Environment transition kernel | Conditional probability |
| $q_{b,t}$ | Actual processed behavior distribution | Normalized over legal actions |
| $r_t, G_t$ | Immediate reward and discounted return | Declared reward units |
| $d_t,c_t$ | Task termination and collection censoring flags | Binary, semantically distinct |

[MATHEMATICALLY-DERIVED] For a finite episode with policy-independent environment dynamics, the joint trajectory density factors as:

$$
p_\theta(\omega\mid x)=\prod_{t=1}^{H}\pi_\theta(a_t\mid s_t)P_e(s_{t+1},r_t,d_t\mid s_t,a_t),\qquad \log p_\theta=\sum_t\log\pi_\theta(a_t\mid s_t)+\operatorname{const}_\theta.
$$
*(Eq. 34.1)*

where $H$ counts assistant decisions, $P_e$ includes environment randomness and the declared stopping rule, and the constant is independent of $\theta$. A policy-dependent environment requires additional derivatives.

```figure
{
  "id": "fig-34.1",
  "kind": "calculator",
  "title": "Discounting a delayed outcome",
  "caption": "An analytical terminal-only reward example. Discounting can implicitly prefer short trajectories even without an explicit length penalty.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-34.2",
  "alt": "Adjust the declared illustrative inputs; return at first decision=r*g^(h-1), discount loss relative to reward=r-r*g^(h-1). An analytical terminal-only reward example. Discounting can implicitly prefer short trajectories even without an explicit length penalty.",
  "spec": {
    "tex": "G_1=\\gamma^{H-1}R",
    "equation": "34.2",
    "inputs": [
      {
        "symbol": "h",
        "label": "assistant decisions",
        "default": 8,
        "min": 1,
        "max": 128,
        "format": "integer",
        "step": 1
      },
      {
        "symbol": "g",
        "label": "discount per decision",
        "default": 0.99,
        "min": 0,
        "max": 1,
        "format": "raw",
        "step": 0.01
      },
      {
        "symbol": "r",
        "label": "terminal reward",
        "default": 1,
        "min": 0,
        "max": 10,
        "format": "fixed3",
        "step": 0.01
      }
    ],
    "outputs": [
      {
        "symbol": "v",
        "label": "return at first decision",
        "formula": "r*g^(h-1)",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "gap",
        "label": "discount loss relative to reward",
        "formula": "r-r*g^(h-1)",
        "format": "fixed3",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "No length discount",
      "variables": {
        "g": 1,
        "h": 8
      }
    },
    {
      "anchor": "mechanism",
      "label": "Delayed terminal outcome",
      "variables": {
        "g": 0.99,
        "h": 32
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Strong implicit length price",
      "variables": {
        "g": 0.8,
        "h": 32
      }
    }
  ]
}
```

$$
G_t=\sum_{k=t}^{H}\gamma^{k-t}r_k,\qquad J(\theta)=\mathbb E_{p_\theta}\!\left[\sum_{t=1}^{H}\gamma^{t-1}r_t\right],\qquad 0\leq\gamma\leq1.
$$
*(Eq. 34.2)*

where $\gamma$ discounts assistant-decision time. Discount per wall-clock interval or tool call defines a different process and must be specified separately.

## Mechanism

[MATHEMATICALLY-DERIVED] Sampling processors define the behavior measure. With logits $z_b$, temperature $u>0$, and an admitted set $S_t$ determined by the declared ordering of legality and truncation processors:

$$
q_{b,t}(a\mid s_t)=\frac{\mathbf1\{a\in S_t\}\exp(z_b(a,s_t)/u)}{\sum_{v\in S_t}\exp(z_b(v,s_t)/u)}.
$$
*(Eq. 34.3)*

where $u$ is local sampling temperature, distinct from the book\'s distillation temperature. $S_t$ can depend on the history and logits; top-p requires a specified threshold, tie rule and processor order.

```figure
id: fig-34.2
kind: diagram
title: Actor actions and environment observations
caption: Only sampled assistant choices contribute actor score terms. Environment observations change later conditioning.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-34.1
alt: The information path is Prompt, then Actor choice, then Environment, then Next history, then Stop record. Only sampled
  assistant choices contribute actor score terms. Environment observations change later conditioning.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: dataset
    label: Prompt
    sub: sample x
  - id: n1
    kind: model
    label: Actor choice
    sub: log processed probability
  - id: n2
    kind: process
    label: Environment
    sub: append observation
  - id: n3
    kind: model
    label: Next history
    sub: condition without scoring observation
  - id: n4
    kind: metric
    label: Stop record
    sub: termination or censoring
  edges:
  - from: n0
    to: n1
  - from: n1
    to: n2
  - from: n2
    to: n3
  - from: n3
    to: n4
```

[DERIVED] A behavior log probability must refer to the action after these processors. Training may deliberately optimize the untruncated softmax policy instead. That is an off-policy problem, not a harmless representation choice. If top-p assigns zero probability to an action that the target policy can take, absolute continuity fails and no finite importance weight reconstructs that missing event. Logging only the chosen action's raw softmax score cannot reveal the missing normalizer or the complete sampling support.

[MATHEMATICALLY-DERIVED] Boundary values distinguish a completed task from an administratively truncated continuation. Write the one-step target as:

$$
Y_t=r_t+\gamma b_t\,v_\phi(s_{t+1}),\qquad b_t=\begin{cases}0&\text{task terminated},\\1&\text{continuing task with available next state}.\end{cases}
$$
*(Eq. 34.4)*

where $v_\phi$ predicts return from a decision state. At an administrative cutoff, bootstrap only when a valid continuation state and the continuing-task objective exist; otherwise the target is unresolved, not silently zero.

```figure
id: fig-34.3
kind: compare
title: Three distinct ending events
caption: A token cap becomes absorbing only when the task explicitly defines it that way. The table supplies the accessible
  equivalent of the boundary diagram.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-34.4
alt: 'Comparison on Boundary semantics. Event probability: eos=part of actor likelihood, cap=collector imposed, failure=task
  transition. Bootstrap: eos=zero at absorbing end, cap=continuation value if valid, failure=zero at absorbing failure. Reward:
  eos=task-defined outcome, cap=not automatically failure reward, failure=explicit failure reward'
spec:
  axis: Boundary semantics
  columns:
  - id: eos
    label: Sampled EOS
  - id: cap
    label: Administrative cap
  - id: failure
    label: Task-defined failure
  rows:
  - dimension: Event probability
    values:
      eos: part of actor likelihood
      cap: collector imposed
      failure: task transition
  - dimension: Bootstrap
    values:
      eos: zero at absorbing end
      cap: continuation value if valid
      failure: zero at absorbing failure
  - dimension: Reward
    values:
      eos: task-defined outcome
      cap: not automatically failure reward
      failure: explicit failure reward
```

[DERIVED] A successful tool response can be delayed relative to several emitted tokens. Credit assignment can use one terminal outcome, dense intermediate rewards or a combination, but every reward needs an event identifier and a clock. Moving a reward earlier preserves an undiscounted total only when its value and episode membership remain unchanged. With discounting, the time shift changes the objective unless compensated. Dense reward can also change behavior by rewarding a proxy action that does not improve the final outcome.

## Algorithm

### Algorithm 34.1 — versioned rollout collection

[DERIVED] Algorithm 34.1 specifies collection, not an optimizer. Inputs are a frozen behavior version, prompt/environment distribution, processor configuration, assistant-action cap and explicit ending policy. State contains history, decision counter and an append-only event ledger. Output is a sealed episode or an explicitly rejected incomplete record.

$$
\begin{aligned}
&1.\quad (x,e)\sim\mathcal D;\ h\leftarrow x;\ t\leftarrow0;\ \mathcal E\leftarrow\varnothing.\\
&2.\quad \textbf{while }t<H_{\max}\textbf{ and not task-ended:}\\
&3.\qquad t\leftarrow t+1;\ q\leftarrow\operatorname{Process}(z_b(h),u,S);\ \text{require }\sum_aq(a)=1.\\
&4.\qquad a_t\sim q;\ \ell_{b,t}\leftarrow\log q(a_t);\ \mathcal E\leftarrow\mathcal E\cup(h,a_t,\ell_{b,t},b).\\
&5.\qquad (o,r,d)\leftarrow\operatorname{Step}_e(h,a_t);\ h\leftarrow\operatorname{Append}(h,a_t,o).\\
&6.\qquad \text{record }o,r,d\text{ and tool status; assign no actor action mask to }o.\\
&7.\quad \text{if collector stops before task end, record censoring and continuation-state availability.}\\
&8.\quad \text{seal with tokenizer, processor, environment, reward and behavior-version hashes.}
\end{aligned}
$$

[DERIVED] Invariants are normalized legal sampling, immutable behavior identity and exactly one provenance entry per emitted action. Termination follows task completion or the finite cap. Invalid processor mass, unavailable tools and inconsistent version acknowledgments produce named failures; they do not disappear from the workload denominator. Tool wait time is bounded separately from assistant token count. Collection cost includes prefill, every emitted token, environment execution, failed requests and ledger serialization.

```figure
id: fig-34.4
kind: matrix
title: Context is broader than the action mask
caption: Rows are context visibility then actor-gradient inclusion; columns are prompt, assistant request, tool observation,
  assistant answer. A one means included.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-34.1
alt: Each filled cell denotes an admitted relationship. Rows are context visibility then actor-gradient inclusion; columns
  are prompt, assistant request, tool observation, assistant answer. A one means included.
spec:
  rows: 2
  cols: 4
  pattern: explicit
  cells:
  - - 1
    - 1
    - 1
    - 1
  - - 0
    - 1
    - 0
    - 1
  rowLabel: context / actor action
  colLabel: prompt / request / observation / answer
  legend: Filled cells denote admitted relationships; inspect the caption for axis identities.
```

## Implementation

[DERIVED] Implementation route: **verl** (reference-stack §4 #37, **RL post-training**; §4.1 **Post-training / RL**), pinned at v0.9.1. The role-specific mechanism and its evidence boundary are stated below.

[OFFICIAL-DOCUMENTATION] The inspected verl release separates configured rollout temperature/top-p from temperature scaling in its FSDP scoring path. Its GAE helper skips observation positions and initializes the final continuation value to zero; that function's interface does not independently establish a censored-continuation contract. The release pin, functions and caveats are recorded in R34.1. Reading code establishes these disclosed operations, not successful execution on a particular deployment. [R34.1](references.md#r341)

[DERIVED] Store per-action log probabilities with the token identifiers before detokenization or stop-string removal. Preserve EOS when it was sampled, even when presentation strips it. Use separate masks for valid storage positions, actor actions and reward-bearing events. Packing must preserve episode boundaries and attention visibility; a zero actor mask does not prevent attention leakage across adjacent episodes. The trajectory key joins environment state, reward version and behavior version; matching only prompt text is insufficient for counterfactual replay.

```figure
{
  "id": "fig-34.5",
  "kind": "memory-stack",
  "title": "Context occupancy differs from scored action mass",
  "caption": "Eq.34.1 illustrative context:128 prompt tokens,32 observation tokens and64 assistant actions total224 visible tokens. Only the64 assistant decisions enter the policy score; token counts are not equal memory bytes.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-34.1",
  "alt": "A224-token context stack contains128 prompt tokens,32 observations and64 scored assistant actions. Observations consume context but are not sampled assistant actions.",
  "spec": {
    "format": "tokens",
    "variables": {
      "a": 64,
      "o": 32,
      "p": 128
    },
    "bars": [
      {
        "label": "Visible context",
        "segments": [
          {
            "label": "Prompt",
            "kind": "dataset",
            "formula": "p"
          },
          {
            "label": "Environment observations",
            "kind": "dependency",
            "formula": "o"
          },
          {
            "label": "Assistant actions",
            "kind": "model",
            "formula": "a"
          }
        ]
      }
    ]
  },
  "anchor": "implementation"
}
```

## Experimental design

[PAPER-REPORTED] OpenAgent tests tool-semantic shifts in a controlled point-of-interest sandbox. Its anonymized train/test separation and explicit schema/return transformations make environment identity experimentally consequential. [R34.10, §§3–5, Appendix A–D](references.md#r3410)

| Disclosed protocol | Source setting |
|---|---|
| Policy / workload | Qwen2.5-7B-Instruct; POI sandbox; 6,050 train / 880 test |
| SFT / RL | Full AdamW SFT, $3\times10^{-5}$, batch 2, 800 steps; GRPO $10^{-6}$, 280 steps |
| Evaluation | Temperature 0, top-p 1; schema, return, dependency and rule shifts |
| Hardware / precision / seeds | NOT-DISCLOSED in inspected protocol |

[ASSUMED] Proposed boundary audit: use a finite two-step environment with exactly enumerated transitions, then repeat the same trajectories under sampled termination, administrative censoring and task-defined budget failure. Hold rewards, tokenizer and behavior logits fixed. Independent variables are ending semantics and observation insertion; controls include identical assistant actions. Measure return-target error, actor-mask equality and logged probability reconstruction. This is a mathematical/CPU validation design, not a claimed model experiment.

## Observations

**What the paper claims.** [PAPER-REPORTED] OpenAgent attributes important tool-agent generalization failures to dependence on surface conventions rather than stable interaction semantics. Its interventions include changed argument keys and observation formats. [R34.10, §§4–5](references.md#r3410)

**What the evidence shows.** [PAPER-REPORTED] The disclosed sandbox exposes fragility under those shifts. SFT and RL arms have different training budgets; the comparison cannot isolate optimization algorithm as the sole cause. It does not establish failure rates for unrestricted production agents. [R34.10, Appendix D](references.md#r3410)

**What we infer.** [DERIVED] Environment and processor versions belong in the training artifact. A policy-gradient theorem about a fixed process cannot justify combining trajectories whose tool semantics changed unnoticed. This is a probability-model requirement, independently of which algorithm performed better in the sandbox.

**What remains unknown.** [NOT-DISCLOSED] Exact hardware, numerical precision and seed sensitivity remain unresolved for the cited protocol. The present manuscript does not supply those fields by inference or execute the source implementation.

## Failure modes

[DERIVED] Treating cap exhaustion as natural EOS creates an artificial terminal boundary; bootstrapping a true absorbing failure creates the opposite error. Scoring tool observations attributes environmental randomness to the actor. Dropping failed rollouts creates outcome-dependent sampling. Counting only successful completions hides collection expense and can bias estimated performance. Rewarding a retry without preserving its earlier failed attempts changes both credit assignment and cost.

## Siblings

[DERIVED] Offline SFT fits selected targets under recorded contexts; online RL optimizes outcomes under a rollout distribution. Neither operation guarantees tool semantics or judge validity. Chapter 32 owns reward-model construction; Chapter 35 owns verifier and group-relative estimators; Chapter 36 owns distributed and asynchronous rollout systems. This section supplies their common trajectory boundary.

## Extensions

[DERIVED] Semi-Markov discounting can use $\gamma^{\Delta_t}$ for variable-duration transitions, provided the return, advantage recursion and objective all use that same clock. Multimodal observations enlarge the state interface without becoming actor actions unless the policy explicitly chooses them. Interrupted rollouts can resume only with an environment snapshot and behavior-version policy consistent with the declared estimator.

## Limitations

[DERIVED] Full observable history does not reveal hidden environmental state or make replay deterministic. The factorization assumes environment dynamics independent of actor parameters and sufficiently regular, supported action probabilities. Budget failure and censoring are modeling choices with different targets; the mathematics cannot choose them on the application's behalf.

## Reproducibility

[DERIVED] Publish the event schema, ending-policy table, tokenizer and processors, environment snapshot identifiers, action masks, reward mapping and a finite replay example. Retain rejected records with reasons. Verify that adding observation tokens leaves actor-action count unchanged, sampled EOS retains its log probability, and the cap boundary changes the bootstrap only under the declared task semantics. Version these checks with the rollout-to-update specification.

```figure
{
  "id": "fig-34.6",
  "kind": "chart",
  "title": "A discount is a length preference",
  "caption": "Analytical unit terminal reward, fixed action clock. These curves are not source measurements. Points represent legal integer configurations; no fractional-decision/reuse interpolation is asserted.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-34.2",
  "alt": "Analytical curves: gamma one equals 1, gamma 0.95 equals 0.95^(x-1), gamma 0.8 equals 0.8^(x-1). Analytical unit terminal reward, fixed action clock. These curves are not source measurements.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "assistant decisions",
      "scale": "linear",
      "domain": [
        1,
        32
      ]
    },
    "y": {
      "label": "first-decision return",
      "scale": "linear"
    },
    "series": [
      {
        "id": "s0",
        "label": "gamma one",
        "formula": "1",
        "sample": {
          "to": 32,
          "count": 32,
          "from": 1
        }
      },
      {
        "id": "s1",
        "label": "gamma 0.95",
        "formula": "0.95^(x-1)",
        "sample": {
          "to": 32,
          "count": 32,
          "from": 1
        }
      },
      {
        "id": "s2",
        "label": "gamma 0.8",
        "formula": "0.8^(x-1)",
        "sample": {
          "to": 32,
          "count": 32,
          "from": 1
        }
      }
    ],
    "annotations": [
      {
        "x": 1,
        "y": 1,
        "label": "All discounts agree at one decision"
      },
      {
        "x": 32,
        "y": 0.0009903520314283058,
        "label": "Delayed reward under gamma0.8"
      }
    ]
  }
}
```

## References

[R34.1](references.md#r341) pins the inspected implementation. [R34.10](references.md#r3410) supplies the source-located environment study. Equations and all six native figures are explanatory derivations; the empirical table is paper-reported and incomplete where marked.
