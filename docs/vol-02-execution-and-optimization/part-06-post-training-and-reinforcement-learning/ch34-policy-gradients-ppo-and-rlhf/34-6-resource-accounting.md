---
id: ms.section.34.6
entity_type: section
title: Resource accounting
short_title: Resource accounting
volume: 2
part: 6
chapter: 34
section: '34.6'
slug: 34-6-resource-accounting
parent: ms.chapter.34
prev_sibling: ms.section.34.5
next_sibling: ms.verification.34
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

# 34.6 — Resource accounting

## Scope

[DERIVED] This section owns four-role memory, generation versus training compute, synchronization and evaluation cadence. Its artifact is a resource ledger per attempted and per accepted policy update, with separate model, activation, cache, communication and evaluator terms. It does not estimate hardware throughput from parameter counts or use a role diagram as a peak-memory measurement.

## Why this exists

[DERIVED] An RLHF job can fit the actor and still fail when the critic optimizer, reference, reward model, rollout copy and KV cache overlap. A frozen model avoids optimizer state but still needs weights, forward activations and workspace. A critic smaller than the actor has its own parameter count; multiplying one model size by four silently assumes identical architectures and trainability. Sharding, offload and colocation change lifetimes and placement rather than remove the need to count them.

[DERIVED] Throughput comparisons also depend on the denominator. Tokens per second can improve while cost per accepted update worsens because more candidates are rejected or responses become longer. An iteration with eight reuse passes performs a different amount of training than one large update. Evaluation may consume a substantial fraction of a short run, particularly when each prompt has many sampled responses and several judges. A credible budget includes these activities before claiming an efficient algorithm.

## Intuition

[MATHEMATICALLY-DERIVED] Persistent state is what must survive an optimizer step; transient state is what must coexist at a particular execution time. Peak memory is the maximum of the sum of simultaneously resident objects. Summing separate stage peaks overestimates if they never overlap; taking the largest model alone underestimates if several roles coexist. The correct unit is device and time, with model-specific residency and sharding.

[DERIVED] Generation and training stress different resources. Autoregressive decoding repeatedly reads weights and updates caches while producing one new token per sequence. Training processes known tokens in parallel and stores or recomputes activations for backward passes. A reward model can return one scalar while still processing an entire prompt/response. Communication and sandbox latency can dominate even when arithmetic utilization is high, so FLOPs alone cannot predict wall time.

## Formulation

[ASSUMED] A transparent illustrative dense-training state layout uses BF16 weights and gradients, an FP32 master copy and two FP32 Adam moments. This is a declared layout, not a universal implementation default:

$$
M_{{\rm persistent},r}=N_r(b_{w,r}+\mathbf1_{\rm train,r}(b_{g,r}+b_{{\rm master},r}+b_{m,r}+b_{v,r})),\qquad 2+2+4+4+4=16\ \text{bytes/parameter}.
$$
*(Eq. 34.21)*

where $r$ identifies actor, critic, reference or reward model and $N_r$ is that role's own parameter count. Frozen BF16 roles use two weight bytes per parameter in this layout; FP32 gradients would increase trainable state to 18 bytes, and optimizer alternatives change the formula.

```figure
{
  "id": "fig-34.31",
  "kind": "calculator",
  "title": "Four model states plus a rollout copy",
  "caption": "Aggregate unsharded model state under the declared layout. Excludes activations, KV cache, workspace, communication buffers and fragmentation; this is not per-GPU peak memory.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-34.21",
  "alt": "Adjust the declared illustrative inputs; aggregate model-state GiB=(16*na+16*nc+2*nr+2*nm+2*c*na)*1000000/2^30, extra rollout-copy GiB=2*c*na*1000000/2^30. Aggregate unsharded model state under the declared layout. Excludes activations, KV cache, workspace, communication buffers and fragmentation; this is not per-GPU peak memory.",
  "spec": {
    "tex": "M=16N_A+16N_C+2N_{\\rm ref}+2N_R+2cN_A",
    "equation": "34.21",
    "inputs": [
      {
        "symbol": "na",
        "label": "actor parameters in millions",
        "default": 7000,
        "min": 1,
        "max": 100000,
        "format": "integer",
        "step": 1
      },
      {
        "symbol": "nc",
        "label": "critic parameters in millions",
        "default": 3000,
        "min": 1,
        "max": 100000,
        "format": "integer",
        "step": 1
      },
      {
        "symbol": "nr",
        "label": "reference parameters in millions",
        "default": 7000,
        "min": 1,
        "max": 100000,
        "format": "integer",
        "step": 1
      },
      {
        "symbol": "nm",
        "label": "reward parameters in millions",
        "default": 1000,
        "min": 1,
        "max": 100000,
        "format": "integer",
        "step": 1
      },
      {
        "symbol": "c",
        "label": "additional BF16 actor rollout copies",
        "default": 1,
        "min": 0,
        "max": 4,
        "format": "integer",
        "step": 1
      }
    ],
    "outputs": [
      {
        "symbol": "state",
        "label": "aggregate model-state GiB",
        "formula": "(16*na+16*nc+2*nr+2*nm+2*c*na)*1000000/2^30",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "extra",
        "label": "extra rollout-copy GiB",
        "formula": "2*c*na*1000000/2^30",
        "format": "fixed3",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "No extra rollout copy",
      "variables": {
        "c": 0
      }
    },
    {
      "anchor": "mechanism",
      "label": "One resident rollout copy",
      "variables": {
        "c": 1
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Four extra copies",
      "variables": {
        "c": 4
      }
    }
  ]
}
```

## Mechanism

[MATHEMATICALLY-DERIVED] Assign each tensor a device-specific residency interval. The device peak is:

$$
M_g^{\rm peak}=\max_t\left[\sum_r\left(M_{w,rg}(t)+M_{{\rm opt},rg}(t)+M_{{\rm act},rg}(t)\right)+M_{{\rm KV},g}(t)+M_{{\rm buffers},g}(t)+M_{{\rm workspace},g}(t)+M_{{\rm frag},g}(t)\right].
$$
*(Eq. 34.22)*

where $g$ is a physical device, not a global rank-averaged total. Each role has its own weights, optimizer and activations. Sharding/offload appears in the actual residency functions; framework allocation and reserved memory must be distinguished when comparing measurements.

```figure
id: fig-34.32
kind: diagram
title: Residency follows stage lifetimes
caption: This is a declared stage schedule, not measured overlap. A colocated implementation may keep multiple stages resident
  simultaneously.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-34.22
alt: The information path is Collection, then Scoring, then Targets, then Training, then Transfer. This is a declared stage
  schedule, not measured overlap. A colocated implementation may keep multiple stages resident simultaneously.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: memory
    label: Collection
    sub: rollout weights and KV
  - id: n1
    kind: memory
    label: Scoring
    sub: reference and reward forwards
  - id: n2
    kind: memory
    label: Targets
    sub: critic inference and ledgers
  - id: n3
    kind: memory
    label: Training
    sub: actor/critic optimizer and activations
  - id: n4
    kind: flow
    label: Transfer
    sub: weights and staging buffers
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

[DERIVED] A second actor copy may exist in an inference engine with another tensor-parallel layout or precision. It is not part of the optimizer's weight tensor merely because both represent the same checkpoint. Tensor conversion, staging buffers and transfer destinations can temporarily coexist. Adapter sharing can reduce base-weight duplication only when aliasing and compatible layouts are established. Critics and reward models can share architecture or storage, but that must be represented by explicit tensor identities to avoid double counting or unjustified savings.

[MATHEMATICALLY-DERIVED] KV cache depends on actual simultaneously active tokens, layers, KV heads, head dimension, precision and cache replication. It is not proportional to all attention heads for every grouped-query model. Prompt prefix sharing can reduce some storage, while branching, retries and beam/search states increase it. Activation checkpointing reduces stored training activations at the cost of recomputation. Offload trades device residency for host memory, transfer and synchronization. Each saving has a corresponding cost term.

$$
C_{\rm iter}\approx C_{\rm rollout}+6N_AE_AD_A+6N_CE_CD_C+2N_{\rm ref}D_{\rm ref}+2N_RD_R+C_{\rm eval}+C_{\rm other}.
$$
*(Eq. 34.23)*

where the dense transformer rule-of-thumb uses two FLOPs per multiply-add and approximate forward/backward factors; $D_r$ counts tokens actually processed by that role, including required prompts. Attention, MoE routing, recomputation, padding and different kernels require additional terms. $E_A,E_C$ are actual reuse passes, not nominal epochs.

```figure
id: fig-34.33
kind: compare
title: Costs by role
caption: The roles have independent parameter counts, token counts and placement. One scalar reward is not one scalar operation.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-34.23
alt: 'Comparison on Trainability and workload. Persistent state: a=weights + declared optimizer, c=own weights + own optimizer,
  ref=frozen weights, r=frozen weights. Transient state: a=training activations; rollout KV if present, c=training/target
  activations, ref=forward activations/workspace, r=forward activations/workspace. Token work: a=generation plus reuse passes,
  c=target inference plus fit passes, ref=scoring/cache misses, r=outcome scoring and repeats'
spec:
  axis: Trainability and workload
  columns:
  - id: a
    label: Actor
  - id: c
    label: Critic
  - id: ref
    label: Reference
  - id: r
    label: Reward
  rows:
  - dimension: Persistent state
    values:
      a: weights + declared optimizer
      c: own weights + own optimizer
      ref: frozen weights
      r: frozen weights
  - dimension: Transient state
    values:
      a: training activations; rollout KV if present
      c: training/target activations
      ref: forward activations/workspace
      r: forward activations/workspace
  - dimension: Token work
    values:
      a: generation plus reuse passes
      c: target inference plus fit passes
      ref: scoring/cache misses
      r: outcome scoring and repeats
```

[DERIVED] For dense generation, a rough weight-multiply term is $2N_A$ times the number of tokens whose forward computation is actually performed, with separate prefill/decode attention and cache costs. This is not a throughput prediction. MoE resident memory depends on total parameters while multiply cost depends on activated experts plus routing; substituting active parameter count into the memory equation is incorrect. Quantization changes weight bytes and kernel arithmetic, but can also create training/inference probability mismatch requiring qualified correction.

[DERIVED] Caching reference scores removes repeated forward work only for identical inputs and version keys. Caching critic targets does not remove critic training. Packing reduces padding work while preserving attention boundaries and reduction mass. Dynamic batching changes the number of simultaneously resident tokens and the tail latency of long episodes. Every rejected candidate has already consumed its generation, reward and often tool budget; it remains in total expenditure even when absent from the actor loss.

$$
T_{\rm sync}\geq\frac{B_{\rm transferred}}{\operatorname{BW}_{\rm effective}}+T_{\rm latency},\qquad \overline C_{\rm accepted}=\frac{\sum_{j\in\rm attempts}C_j}{n_{\rm accepted}},\qquad \overline T_{\rm eval/iter}=T_{\rm eval}/K.
$$
*(Eq. 34.24)*

where the transfer expression is a lower bound under the stated effective bottleneck bandwidth, accepted count must be positive, and $K$ is iterations between evaluations. GPU-seconds, CPU/tool seconds, bytes and monetary charges remain separate ledgers unless a declared conversion is supplied.

[DERIVED] In a serial schedule, collection, scoring, training, transfer and amortized evaluation add to iteration time. Overlap can reduce elapsed time, but dependency edges and shared resources prevent simply replacing the sum by the largest stage. Synchronization includes resharding, precision conversion, draining in-flight requests, loading weights and acknowledging a coherent version. A transfer acknowledgment without a policy-version barrier can mix old and new behavior within one batch; Chapter 36 treats that distributed contract.

## Algorithm

### Algorithm 34.6 — account for accepted policy updates

[DERIVED] Algorithm 34.6 consumes the role/tensor inventory, a declared stage schedule, transfer plan and evaluation cadence. State tracks allocations, execution events, version barriers and attempted/accepted updates. Output is a resource ledger with uncertainty and a measured or explicitly modeled status for each field.

$$
\begin{aligned}
&1.\quad \text{inventory each role's tensors, dtypes, trainability, shards and physical aliases.}\\
&2.\quad \text{assign device/time lifetimes; compute Eq.34.22 or instrument actual allocation peaks.}\\
&3.\quad \text{record all prompt/generated/scored/trained tokens by role, including rejects and retries.}\\
&4.\quad \text{record forward/backward/recompute work and all weight/cache transfers.}\\
&5.\quad \text{record evaluation sample counts, judges, checkpoint selection and cadence.}\\
&6.\quad \text{join events by update/version; compute per-attempt and per-accepted totals separately.}\\
&7.\quad \text{stop at the declared finite budget; flag missing telemetry instead of inserting zeros.}
\end{aligned}
$$

[DERIVED] Invariants prohibit counting an aliased tensor twice, omitting an independent copy and mixing aggregate with per-device units. A finite event ledger guarantees stopping. Missing device peaks, unknown cache residency or unrecorded rejected work leave a partial estimate, not a complete budget. The accounting process itself consumes tracing/serialization resources and can perturb short benchmarks; report whether profiling was active during timing.

```figure
id: fig-34.34
kind: matrix
title: Which stage needs which extra state
caption: Rows are rollout actor, frozen score models, trainable critic and trainable actor. Columns are decoding KV, forward
  workspace/activations, optimizer/backward state. Filled cells mark required categories in the declared schedule.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-34.22
alt: Each filled cell denotes an admitted relationship. Rows are rollout actor, frozen score models, trainable critic and
  trainable actor. Columns are decoding KV, forward workspace/activations, optimizer/backward state. Filled cells mark required
  categories in the declared schedule.
spec:
  rows: 4
  cols: 3
  pattern: explicit
  cells:
  - - 1
    - 1
    - 0
  - - 0
    - 1
    - 0
  - - 0
    - 1
    - 1
  - - 0
    - 1
    - 1
  rowLabel: rollout / scorers / critic / actor
  colLabel: KV / forward / optimizer
  legend: Filled cells denote admitted relationships; inspect the caption for axis identities.
```

## Implementation

[DERIVED] Implementation route: **verl** (reference-stack §4 #37, **RL post-training**; §4.1 **Post-training / RL**), pinned at v0.9.1. The role-specific mechanism and its evidence boundary are stated below.

[DERIVED] Distinguish allocated, reserved and device-reported memory, with synchronized measurement boundaries. Include host-offload peak and staging allocations. A model-state estimate is useful before launch but cannot certify fit because activations, caches and workspaces depend on shape and backend. Record hardware topology, interconnect, backend version, precision, batch/length distributions, sharding and compilation warmup when reporting runtime.

[DERIVED] Evaluation cadence trades detection delay against expense. Frequent checks detect regressions sooner but can overfit checkpoint selection to a fixed validation set. Retain the validation trajectory, select according to a predeclared rule and evaluate once on an independent final set. Track pass@1, sampled success coverage, output diversity, length, cap rate and independent quality separately. The same success probability can be distributed over one correct completion or many distinct correct completions; pass@k alone cannot identify that distribution.

```figure
{
  "id": "fig-34.35",
  "kind": "memory-stack",
  "title": "Evaluation occupies the serial iteration subtotal",
  "caption": "Eq.34.24 declared timing model:120 training seconds plus600 evaluation seconds every10 iterations gives an amortized180-second serial subtotal. These are illustrative timings; overlap and service tails require a schedule.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-34.24",
  "alt": "The illustrative amortized serial stack is120 training seconds plus60 evaluation seconds. At cadence1 it becomes720; at cadence20 it becomes150. No measured hardware latency is claimed.",
  "spec": {
    "format": "fixed3",
    "variables": {
      "train": 120,
      "eval": 600,
      "cadence": 10
    },
    "bars": [
      {
        "label": "Amortized serial seconds",
        "segments": [
          {
            "label": "Training",
            "kind": "model",
            "formula": "train"
          },
          {
            "label": "Evaluation",
            "kind": "metric",
            "formula": "eval/cadence"
          }
        ]
      }
    ]
  },
  "anchor": "implementation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Every ten iterations",
      "variables": {
        "cadence": 10
      }
    },
    {
      "anchor": "mechanism",
      "label": "Every iteration",
      "variables": {
        "cadence": 1
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Every twenty iterations",
      "variables": {
        "cadence": 20
      }
    }
  ]
}
```

## Experimental design

[PAPER-REPORTED] A recent post-training evaluation study holds decoding fixed while comparing GRPO and shortest-correct rejection fine-tuning. [R34.8, §§2–5, reproducibility appendix](references.md#r34-8)

| Protocol | Disclosure |
|---|---|
| Model/data | Qwen2.5-1.5B-Instruct; 1,500 baseline-filtered GSM8K train; 100 held-out; MATH-500 transfer |
| Training | BF16 full tuning, AdamW $10^{-6}$; 187 steps; three main-arm seeds |
| Evaluation | Temperature/top-p 1; cap 1,024; GSM8K 32 samples, MATH 16; every 25 steps |
| Uncertainty/gaps | Problem bootstrap and seed pooling; overwritten seed-0 raw GSM8K limits some analyses to two seeds; hardware ND |

[ASSUMED] Proposed systems ablation fixes accepted prompt workload, model versions and independent evaluation while varying colocation, reference caching and reuse count. Measure per-device peak, total GPU-seconds, synchronization bytes/time, accepted updates and quality at matched expenditure. Controls include identical processor semantics and ending policies. Report warmup separately and include failed/OOM attempts. No speedup, fit result or GPU benchmark is claimed by this manuscript.

## Observations

**What the paper claims.** [PAPER-REPORTED] The study argues that pass@k does not measure output diversity or certify retention of baseline capability. [R34.8, §§3–4](references.md#r34-8)

**What the evidence shows.** [PAPER-REPORTED] Its main arms move diversity in opposite directions despite overlapping high-k success estimates; no trained arm significantly improves the hard MATH subset over baseline. Missing per-sample token entropy prevents a correct-only entropy analysis. These are workload-specific findings. [R34.8, §§3–5](references.md#r34-8)

**What we infer.** [MATHEMATICALLY-DERIVED] A resource comparison must use a quality vector rather than one selected success statistic. Matching rollout counts without matching response lengths or evaluator work does not match compute. Matching compute without matching independent quality does not establish efficiency dominance.

**What remains unknown.** [NOT-DISCLOSED] The cited study does not supply hardware for a throughput reproduction. The manuscript has no measured residency or runtime trace and therefore reports analytical quantities only, with explicit exclusions.

## Failure modes

[DERIVED] Treating frozen models as free omits forward workspace. Dividing total bytes by GPU count assumes a placement that may not exist. Counting MoE active parameters as resident parameters understates memory. Ignoring rollout copies, staging and reserved allocator memory creates false fit estimates. Counting only accepted responses hides rejected generation. Reporting one fast checkpoint ignores selection and evaluation cost. Comparing different sample budgets conflates inference expenditure with model capability.

## Siblings

[DERIVED] Chapter 16 owns distributed training primitives, Chapter 21 memory mechanisms and Chapter 36 rollout orchestration. This section composes those costs for the four-role RLHF contract. Chapter 35 owns verifier and group-relative algorithm detail; Chapter 38 owns inference-time search budgets. Their costs enter this ledger without redefining their mechanisms.

## Extensions

[DERIVED] A role-aware scheduler can deliberately avoid overlapping large optimizer and KV allocations, trading throughput against fit. A reference cache can have a measured hit-rate model keyed by version. Asynchronous pipelines can improve utilization but introduce staleness and additional copies; their statistical and physical costs must be reported together. Evaluation can use a small fixed sentinel set between less frequent comprehensive checks, with its limited detection coverage stated.

## Limitations

[DERIVED] Dense FLOP factors are accounting approximations, not accelerator benchmarks. Peak fit depends on real tensor lifetimes and backend workspace. Bandwidth lower bounds do not predict end-to-end synchronization. Finite sample evaluations and checkpoint selection constrain quality comparisons. No analytical ledger substitutes for instrumented execution when claiming a deployment can fit or achieve a runtime target.

## Reproducibility

[DERIVED] Publish role sizes/dtypes, tensor-sharing map, residency schedule, activation/cache assumptions, physical topology, all token counters, attempted/accepted denominators, transfer logs, evaluation sample counts and selection rules. Mark every entry modeled, measured or unavailable. Provide a unit-checked small ledger and retain missing fields; zero is a measurement only when the corresponding event was observed absent.

```figure
{
  "id": "fig-34.36",
  "kind": "chart",
  "title": "More reuse adds training work",
  "caption": "Chosen normalized baseline costs with fixed rollout work. Neither curve predicts wall time or a measured training run. Points represent legal integer configurations; no fractional-decision/reuse interpolation is asserted.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-34.23",
  "alt": "Analytical curves: generation-dominated example equals 0.8+0.2*x, training-dominated example equals 0.2+0.8*x. Chosen normalized baseline costs with fixed rollout work. Neither curve predicts wall time or a measured training run.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "actor reuse passes",
      "scale": "linear",
      "domain": [
        1,
        8
      ]
    },
    "y": {
      "label": "relative iteration arithmetic",
      "scale": "linear"
    },
    "series": [
      {
        "id": "s0",
        "label": "generation-dominated example",
        "formula": "0.8+0.2*x",
        "sample": {
          "to": 8,
          "count": 8,
          "from": 1
        }
      },
      {
        "id": "s1",
        "label": "training-dominated example",
        "formula": "0.2+0.8*x",
        "sample": {
          "to": 8,
          "count": 8,
          "from": 1
        }
      }
    ],
    "annotations": [
      {
        "x": 1,
        "y": 1,
        "label": "Both normalized at one pass"
      },
      {
        "x": 8,
        "y": 6.6,
        "label": "Training-heavy arithmetic at eight passes"
      }
    ]
  }
}
```

## References

[R34.8](references.md#r34-8) provides the inspected evaluation study and missing-data limits. [R34.1](references.md#r34-1) pins the implementation surface. All resource equations and native figures are analytical models; no runtime experiment was executed.
