---
id: "ms.section.36.4"
entity_type: "section"
title: "Distributed roles"
short_title: "Distributed roles"
volume: 2
part: 6
chapter: 36
section: 36.4
slug: "36-4-distributed-roles"
parent: "ms.chapter.36"
prev_sibling: "ms.section.36.3"
next_sibling: "ms.section.36.5"
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.29", "ms.chapter.30", "ms.chapter.34", "ms.chapter.35"]
downstream: ["ms.chapter.38", "ms.chapter.39"]
related: []
relations: []
axes: {"lifecycle": ["post_training"], "mechanism": ["agent_rl", "distributed_rollout"], "feedback_setting": ["environment_return", "verifiable_reward"], "modality": ["text", "image"]}
papers: []
implementations: ["impl.verl"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2000
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 36.4 — Distributed roles

## Scope

[DERIVED] Decompose agent RL into actor, learner, rollout orchestration, reward services, environment pools and weight-transfer roles with explicit ownership and resource boundaries. The baseline colocates generation and training and synchronizes after each batch. Success means every accepted batch can be traced to committed behavior versions and every transition between roles preserves capacity and state. This section owns placement and synchronization; statistical mismatch belongs to §36.5 and recovery/economic accounting to §36.6.

## Why this exists

[DERIVED] Generation has variable sequence lengths and tool waits; training has synchronized tensor operations and optimizer state. Putting both on one pool trades residency transitions against utilization. Separating them permits overlap but introduces transfer, queueing and stale data. Scaling only the model workers can leave environments or judges saturated. A diagram that says actor→learner omits the actual bottleneck when a reward RPC or weight export blocks progress.

[DERIVED] The dominant constraint is ownership across transitions. A rollout replica must know which committed model it serves. A learner must know whether its old-policy denominator is a fixed checkpoint or a behavior log probability. A scheduler must reserve the receiving buffers before a transfer. The solution is a role graph with capacity, version and acknowledgment contracts; physical colocation is one configuration of that graph rather than its definition.

## Intuition

[MATHEMATICALLY-DERIVED] Pipeline throughput is bounded by the slowest admitted stage after converting each service rate into the same unit. A GPU token rate cannot be compared directly with environment episodes per second. Separate resources remove a sequential barrier only when enough work can overlap and transfer overhead does not consume the gain. Idle time is evidence about imbalance, not automatically evidence that more rollout concurrency is safe.

## Formulation

| Role | Owned state | Capacity unit |
|---|---|---|
| Actor inference | Committed model digest, sampler, KV cache | Generated tokens/s and resident sequences |
| Learner | Parameters, gradients, optimizer, scheduler, update ID | Accepted updates/s |
| Rollout orchestrator | Task occurrences, event cursors, result joins | Episodes and in-flight requests |
| Reward service | Checker version, private inputs, verdict ledger | Verdicts/s |
| Environment pool | Leases, writable state, quotas | Admitted sandboxes |
| Weight transfer | Source/target versions, layout manifest, buffers | Bytes/s and pending versions |

$$
\lambda_{\rm episodes}\le\min\left(\frac{\mu_{\rm gen}}{E[N_{\rm gen}]},\frac{\mu_{\rm env}}{E[N_{\rm calls}]},\frac{\mu_{\rm judge}}{E[N_{\rm checks}]},\mu_{\rm consume}\right).
$$
*(Eq. 36.21)*

[MATHEMATICALLY-DERIVED] This capacity bound assumes positive finite expected work and stable routing; it does not promise that an arrival process below mean capacity meets tail deadlines. A zero-call workload omits that constraint rather than dividing by zero. Rejected trajectories consume upstream capacity even when they do not contribute to $\mu_{\rm consume}$.

$$
B_{\rm full}=P b_w,\qquad T_{\rm full}\ge B_{\rm full}/\mathcal B,\qquad
B_{\rm delta}\approx fP(b_w+b_i)+B_{\rm manifest}.
$$
*(Eq. 36.22)*

[MATHEMATICALLY-DERIVED] $P$ is transferred parameter-element count, $b_w$ value bytes, $b_i$ index bytes, $f$ changed-element fraction and $\mathcal B$ effective link bytes/s. A byte-diff format may use a different granularity; adapt the equation to its actual wire contract. This is a traffic lower-bound model, excluding export, conversion, collectives, checksums, application and cache rebuild.

```figure
{
  "id": "fig-36.19",
  "kind": "diagram",
  "title": "Distributed roles have distinct queues",
  "caption": "The actor generates policy tokens, environments execute effects, judges produce private verdicts, and the learner commits versions. Each arrow needs capacity and identity.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.21",
  "alt": "The actor generates policy tokens, environments execute effects, judges produce private verdicts, and the learner commits versions. Each arrow needs capacity and identity.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "tasks",
        "kind": "dataset",
        "label": "Occurrence admission"
      },
      {
        "id": "roll",
        "kind": "process",
        "label": "Rollout orchestration"
      },
      {
        "id": "actor",
        "kind": "process",
        "label": "Actor inference pool"
      },
      {
        "id": "env",
        "kind": "state",
        "label": "Environment lease pool"
      },
      {
        "id": "judge",
        "kind": "objective",
        "label": "Reward service pool"
      },
      {
        "id": "ready",
        "kind": "dataset",
        "label": "Accepted experience queue"
      },
      {
        "id": "learn",
        "kind": "process",
        "label": "Learner and optimizer"
      },
      {
        "id": "sync",
        "kind": "tensor",
        "label": "Versioned weight transfer"
      }
    ],
    "edges": [
      {
        "from": "tasks",
        "to": "roll"
      },
      {
        "from": "roll",
        "to": "actor"
      },
      {
        "from": "roll",
        "to": "env"
      },
      {
        "from": "env",
        "to": "judge"
      },
      {
        "from": "actor",
        "to": "ready"
      },
      {
        "from": "judge",
        "to": "ready"
      },
      {
        "from": "ready",
        "to": "learn"
      },
      {
        "from": "learn",
        "to": "sync"
      },
      {
        "from": "sync",
        "to": "actor"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-36.20",
  "kind": "calculator",
  "title": "Full versus indexed delta payload",
  "caption": "Analytical element-index wire model. It excludes conversion and collective overhead; the slider does not assert a measured changed fraction.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.22",
  "alt": "Analytical element-index wire model. It excludes conversion and collective overhead; the slider does not assert a measured changed fraction.",
  "spec": {
    "tex": "B_f=Pb_w,\\quad B_d=fP(b_w+b_i)+M",
    "equation": "36.22",
    "inputs": [
      {
        "symbol": "P",
        "label": "Transferred parameters billions",
        "default": 7,
        "min": 1,
        "max": 70,
        "step": 1,
        "format": "integer"
      },
      {
        "symbol": "f",
        "label": "Changed fraction",
        "default": 0.02,
        "min": 0.01,
        "max": 1,
        "step": 0.01,
        "format": "raw"
      },
      {
        "symbol": "bw",
        "label": "Bytes per value",
        "default": 2,
        "min": 1,
        "max": 4,
        "step": 1,
        "format": "bytes"
      },
      {
        "symbol": "bi",
        "label": "Bytes per index",
        "default": 4,
        "min": 1,
        "max": 8,
        "step": 1,
        "format": "bytes"
      },
      {
        "symbol": "M",
        "label": "Manifest bytes millions",
        "default": 1,
        "min": 0,
        "max": 20,
        "step": 1,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "bf",
        "label": "Full payload GB",
        "formula": "P*bw",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "bd",
        "label": "Indexed delta payload GB",
        "formula": "f*P*(bw+bi)+M/1000",
        "format": "fixed3",
        "emphasis": false
      },
      {
        "symbol": "r",
        "label": "Delta/full payload ratio",
        "formula": "(f*P*(bw+bi)+M/1000)/(P*bw)",
        "format": "ratio",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Declared boundary",
      "variables": {
        "f": 0.02
      },
      "note": "Sparse changes carry both values and their indices."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "f": 0.33
      },
      "note": "At33 percent the indexed payload is near, but below, full transfer in this example."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "f": 1
      },
      "note": "At full change, index traffic makes this delta representation larger than full transfer."
    }
  ]
}
```

## Mechanism

### Methodology

[DERIVED] The actor is a role, not necessarily a separate trainable model. In a colocated design it alternates inference and optimization residency. A disaggregated design maintains inference replicas independently while the learner owns gradients. Rollout workers construct histories and call both actor and environment; reward workers validate outcomes. Environment pools should not inherit inference-worker lifecycle accidentally, because a GPU preemption and a shell-state failure are different events.

[OFFICIAL-DOCUMENTATION] verl v0.9.1 distinguishes `sync`, `colocate_async`, `separate_async`, and `separate_async` with `hybrid_engine=False` [R36.6, V1 guide]. The last disables inference engines on training GPUs. Partial generation can preserve tokens across a mode transition; separate mode can lend idle hybrid replicas back to generation. These are mode-specific behaviors, not interchangeable descriptions of asynchronous RL.

[DERIVED] Start from synchronous execution to define the old-policy boundary. Freeze the rollout version, collect the admitted batch, compute fixed targets, optimize within the declared epoch budget, and publish a new immutable version. Colocated asynchronous execution can pre-generate warmup work while retaining a shared pool. Separate execution can stream mini-batches while inference proceeds. Every relaxation requires recording which old distribution is used in the surrogate, rather than identifying all weights with a single global step.

[OFFICIAL-DOCUMENTATION] The pinned verl separate-async implementation saves a stable old policy to CPU within a synchronization cycle and swaps it around later old-log-probability computations; bypass mode skips that path [R36.6, `_compute_old_log_prob`]. For $N$ mini-batches its guide counts

$$
N_{\rm save}=N,\qquad N_{\rm restore}=2(N-1),\qquad
\text{old-policy saves}=1,\quad\text{old-policy restores}=N-1.
$$
*(Eq. 36.23)*

[DERIVED] Counts alone are not byte traffic: each operation's layout, offload state and synchronization matter. CPU old-policy residency still costs pinned memory and host/device bandwidth. Recomputed old log probabilities at a frozen checkpoint are distinct from actual rollout probabilities after inference processing; statistical treatment remains in §36.5.

[DERIVED] Weight synchronization needs a manifest binding version, parameter names, shapes, dtypes, layout/conversion map and base version. Full transfer installs every required element. Delta transfer requires a valid identical base and complete changed-coordinate coverage. Different sharding or fused tensor layouts need explicit conversion. A checksum validates the payload it covers; it does not automatically validate tokenization, numerical kernels or the actual serving distribution.

$$
\theta_{v+1}=\operatorname{apply}(\theta_v,\Delta_{v\to v+1}),\qquad
\operatorname{digest}(\theta_v)=d_v,\quad\operatorname{digest}(\theta_{v+1})=d_{v+1}.
$$
*(Eq. 36.24)*

[MATHEMATICALLY-DERIVED] If the receiver has a different base, applying a correct delta generally produces a wrong model. Therefore acceptance checks base identity before mutation, validates the resulting version and only then makes it routable. Staging in separate buffers supports rollback at additional memory cost; an in-place protocol instead requires quiescence and an explicit failure/reseed path. An HTTP success response alone proves neither atomic tensor installation nor cross-replica consistency.

```figure
{
  "id": "fig-36.21",
  "kind": "compare",
  "title": "Placement changes residency and synchronization",
  "caption": "The same logical roles can occupy different GPU pools. The table follows the pinned mode distinctions without claiming one configuration universally dominates.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.23",
  "alt": "The same logical roles can occupy different GPU pools. The table follows the pinned mode distinctions without claiming one configuration universally dominates.",
  "spec": {
    "axis": "Placement choice",
    "columns": [
      {
        "id": "s",
        "label": "Synchronous hybrid"
      },
      {
        "id": "c",
        "label": "Colocated async"
      },
      {
        "id": "d",
        "label": "Separate async"
      }
    ],
    "rows": [
      {
        "dimension": "GPU roles",
        "values": {
          "s": "Alternate generation/training",
          "c": "Shared pool with warmup/partial work",
          "d": "Standalone rollout plus learner pool"
        }
      },
      {
        "dimension": "Main barrier",
        "values": {
          "s": "Batch completion",
          "c": "Mode transition and partial work",
          "d": "Ready-batch supply and weight transfer"
        }
      },
      {
        "dimension": "Old state",
        "values": {
          "s": "Declared frozen cycle",
          "c": "Declared frozen cycle plus logged behavior",
          "d": "CPU old snapshot or bypass configuration"
        }
      },
      {
        "dimension": "Extra risk",
        "values": {
          "s": "Tail idle time",
          "c": "Interrupted prefixes and memory switch",
          "d": "Lag, network and queue growth"
        }
      }
    ]
  }
}
```

```figure
{
  "id": "fig-36.22",
  "kind": "hierarchy",
  "title": "A version becomes routable after validation",
  "caption": "This is the book synchronization contract. An implementation must disclose whether it stages buffers or quiesces in place.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.24",
  "alt": "This is the book synchronization contract. An implementation must disclose whether it stages buffers or quiesces in place.",
  "spec": {
    "direction": "down",
    "levels": [
      {
        "label": "Commit learner version",
        "kind": "state",
        "note": "Immutable parameters and optimizer association"
      },
      {
        "label": "Reserve receiver capacity",
        "kind": "process",
        "note": "Buffers and bounded transfer slot"
      },
      {
        "label": "Validate base and layout",
        "kind": "tensor",
        "note": "Full seed or correct delta base"
      },
      {
        "label": "Install and verify",
        "kind": "process",
        "note": "Payload plus resulting version check"
      },
      {
        "label": "Publish serving identity",
        "kind": "state",
        "note": "New requests bind committed sampler version"
      }
    ]
  }
}
```

[DERIVED] Pool balancing must include environment waits, judge demand and bounded queue capacity. Let $r_g$ be generated episodes/s and $r_a$ accepted episodes/s. Increasing $r_g$ while acceptance falls can worsen useful throughput. Backpressure stops task admission before resource pools saturate; cancelling already effectful jobs to free slots changes data selection and requires the treatment in §36.5. A pool with a finite slot count still needs finite per-call deadlines, otherwise slots can remain occupied forever.

## Algorithm

[DERIVED] **Algorithm 36.4 — Bounded version publication.** Inputs: committed source version $v+1$, target replicas, immutable layout/base manifest, finite positive integer retry cap $R$, finite positive transfer deadline $D$, exclusive fenced target-install lease, and staging or quiescent-install mode. Output: per-replica routable version/status with cost ledger. Initialize ledger $\mathcal E=\varnothing$, payload from the full/delta manifest, and attempt counter $a=0$ for each finite target set. The exclusive target lease carries a monotone fence; stale publishers cannot change the serving pointer.

$$
\begin{aligned}
1.&\quad\text{invalid source/layout}\Rightarrow\operatorname{return}(\mathcal E,\text{not published});\quad\ell\leftarrow\operatorname{reserve}(\text{transfer, receiver bytes});\quad\ell=\varnothing\Rightarrow\operatorname{return}(\mathcal E,\text{capacity}).\\
2.&\quad\operatorname{stop\_new\_routing}(\text{target});\quad\operatorname{drain\_or\_checkpoint}_{D}(\text{active requests});\operatorname{record}(\mathcal E,\text{partial states and costs}).\\
3.&\quad\text{quiescence/staging guard failed}\Rightarrow\operatorname{keep\_old\_or\_quarantine};\operatorname{release}(\ell);\operatorname{return}(\mathcal E,\text{blocked}).\\
4.&\quad\text{while }a<R:\ a\leftarrow a+1;\quad\text{base mismatch}\Rightarrow\text{payload}\leftarrow\text{full seed};\quad q\leftarrow\operatorname{transfer}_{D}(\text{payload});\operatorname{record}(\mathcal E,q,\text{bytes/time}).\\
5.&\quad\text{invalid transfer}\Rightarrow\operatorname{discard\_staging\_or\_quarantine};\operatorname{continue};\quad d\leftarrow\operatorname{install\_verify}_{D}(q);\operatorname{record}(\mathcal E,d).\\
6.&\quad d\ne d_{v+1}\Rightarrow\operatorname{quarantine}(\text{target});\operatorname{continue};\quad\operatorname{invalidate\_old\_KV};\ k\leftarrow\operatorname{rebuild\_prefix}_{D}(\text{retained IDs,new version});\operatorname{record}(\mathcal E,k,\text{rebuild work});\\
 &\quad\text{invalid }k\text{ or context/probability provenance}\Rightarrow\operatorname{quarantine}(\text{target});\operatorname{continue};\quad\operatorname{publish\_fenced}(v+1);\operatorname{release}(\ell);\operatorname{return}(\mathcal E,\text{routable});\\
7.&\quad\operatorname{release}(\ell);\operatorname{return}(\mathcal E,\text{not routable}).
\end{aligned}
$$
*(Eq. 36.25)*

[DERIVED] A verification failure terminates the current attempt and invalidates its receiver base; a subsequent retry requires a full seed or a validated old staging base. Publication requires successful prefix reconstruction and retained context/probability provenance; a reconstruction timeout keeps the target unroutable. Alternatively a separately pinned old replica may continue the old request. Old weight-dependent KV is not generally reusable under new weights. No failed target is routed with a guessed version. Drain/checkpoint has a bounded outcome; incomplete requests retain exact prefix probabilities and occurrence IDs. Cost includes discarded staging and reconstruction. This is a derived protocol, not a claim that either inspected project implements every guard.

## Implementation

[OFFICIAL-DOCUMENTATION] **verl — RL post-training layer**, release v0.9.1, exposes the mode and checkpoint-engine surfaces above. Its delta guide specifies aligned slot order, disjoint coordinate pieces, bounded integer indices, dense seeding and checksum verification [R36.6]. **AReaL**, plan-anchored outside the stack, exposes a controller that sends pair identity and version to a weight gateway with configured request/setup timeouts [R36.7, `connect`, `update_weights`]. The inspected controller returns status/version/duration/error; deeper atomicity requires inspecting the corresponding adapters and receiver.

[DERIVED] Map tensors to logical roles before allocating devices. Trainable parameters require gradient/optimizer state; actor replicas require weights and KV; frozen references require their own residency or offload; environment and judge pools require CPU/RAM/storage. Count communication for actor export, resharding, old-policy swap, reference evaluation and result artifacts. A byte-exact transfer does not force equal inference logits across quantization, kernels or routing, so numerical parity remains a separate measurement.

```figure
{
  "id": "fig-36.23",
  "kind": "matrix",
  "title": "Role state determines required residency",
  "caption": "Rows: learner, actor, judge, environment. Columns: optimizer, KV, private effect state. Some deployments add models to the judge; that does not change role ownership.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.21",
  "alt": "Rows: learner, actor, judge, environment. Columns: optimizer, KV, private effect state. Some deployments add models to the judge; that does not change role ownership.",
  "spec": {
    "rows": 4,
    "cols": 3,
    "pattern": "explicit",
    "cells": [
      [
        1,
        0,
        0
      ],
      [
        0,
        1,
        0
      ],
      [
        0,
        0,
        0
      ],
      [
        0,
        0,
        1
      ]
    ],
    "rowLabel": "Learner / actor / judge / environment",
    "colLabel": "Optimizer / KV / private effect state",
    "legend": "Filled = required; empty = not sufficient alone."
  }
}
```

## Experimental design

### Reported experiments

| Pinned verl delta guide [R36.6] | Actual disclosed comparison |
|---|---|
| H100 session | GSM8K GRPO, V1 separate-async, SGLang, steady-state per-step weight sync; Qwen3-30B-A3B, veomniEP8,1+1nodes,50-step medians; delta7.1s/full32.2s |
| Separate small-model session | Qwen3-.6B, intra-nodeNVLink, A100/A80080GB family session, offload off; .59s/.61s; distinct from H100 table |
| Correctness scope | Reported checksum/round-trip and training-trajectory comparisons; complete independent seed/timing intervals not disclosed |
| Boundary | Weight-sync component only; export/conversion/placement and host offload differ by row; no universal learning-quality or end-to-end speedup inference |

```figure
{
  "id": "fig-36.37",
  "kind": "memory-stack",
  "title": "Indexed deltas pay for indices as well as values",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.22",
  "caption": "Eq.36.22 with7 billion parameters,2-byte values,4-byte element indices and1MB manifest. At changed fraction0.02,full transfer is14GB and delta is0.28GB values+0.56GB indices+0.001GB manifest. Decimal GB is not GiB; synchronization/conversion costs are excluded.",
  "alt": "A full-transfer bar contains14GB of values. The indexed-delta bar separates changed values, indices and manifest. The index segment is twice the value segment under this explicit element-wise encoding; full change makes the delta larger than full transfer.",
  "states": [
    {
      "anchor": "formulation",
      "label": "Declared boundary",
      "variables": {
        "f": 0.02
      },
      "note": "Two percent changed: values and indices both matter."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "f": 0.33
      },
      "note": "Near one-third changed the payload is close to full transfer."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "f": 1
      },
      "note": "At full change, index overhead makes this representation three times values plus a manifest."
    }
  ],
  "spec": {
    "format": "raw",
    "variables": {
      "P": 7,
      "bw": 2,
      "bi": 4,
      "f": 0.02,
      "M": 0.001
    },
    "bars": [
      {
        "label": "Full transfer: decimal GB",
        "segments": [
          {
            "label": "All values",
            "kind": "model",
            "formula": "P*bw"
          }
        ]
      },
      {
        "label": "Indexed delta: decimal GB",
        "segments": [
          {
            "label": "Changed values",
            "kind": "model",
            "formula": "f*P*bw"
          },
          {
            "label": "Element indices",
            "kind": "memory",
            "formula": "f*P*bi"
          },
          {
            "label": "Manifest",
            "kind": "dependency",
            "formula": "M"
          }
        ]
      }
    ]
  }
}
```

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The release-pinned guide reports large configuration-dependent synchronization gains and a near-neutral small intra-node case [R36.6, measured results]. These are project measurements, not book experiments or peer-reviewed independent reproductions.

**What the evidence shows.** [DERIVED] Sparse transfer and shard-local export can reduce different costs. A faster wire does not isolate export savings, and component ratios cannot be pasted onto total RL runtime.

**What we infer.** [DERIVED] The right synchronization choice depends on actual changed bytes, sharding, offload and link topology. Small-model local transfer can leave little removable cost.

**What remains unknown.** [NOT-DISCLOSED] Independent uncertainty, complete energy costs and atomicity of every supported adapter are outside the inspected evidence.

```figure
{
  "id": "fig-36.24",
  "kind": "chart",
  "title": "Index overhead changes delta break-even",
  "caption": "Analytical two-byte values and four-byte indices, ignoring manifest. Indexed delta becomes larger than full transfer beyond one-third changed elements.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.22",
  "alt": "Analytical two-byte values and four-byte indices, ignoring manifest. Indexed delta becomes larger than full transfer beyond one-third changed elements.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Changed element percentage",
      "domain": [
        0,
        100
      ]
    },
    "y": {
      "label": "Payload relative to full",
      "format": "ratio"
    },
    "variables": {},
    "series": [
      {
        "id": "d",
        "label": "Indexed delta",
        "formula": "3*x/100",
        "sample": {
          "from": 0,
          "to": 100,
          "count": 101
        },
        "emphasis": true,
        "dashed": false
      },
      {
        "id": "f",
        "label": "Full transfer",
        "formula": "1",
        "sample": {
          "from": 0,
          "to": 100,
          "count": 101
        },
        "emphasis": false,
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 33.333333333333336,
        "y": 1,
        "label": "One-third changed; manifest excluded"
      }
    ]
  }
}
```

## Failure modes

[DERIVED] A receiver can acknowledge a transfer before it becomes safe to release an IPC mapping. A model can have the expected version label but the wrong base bytes. A hybrid replica can still receive new requests while the scheduler is paused. A CPU old-policy snapshot can be overwritten by a later mini-batch. Queueing judges behind unbounded tool calls can deadlock accepted-batch formation. Diagnose these through state transitions and per-role counters rather than a single throughput number.

## Siblings

[DERIVED] Full broadcast needs no sparse-coordinate base contract but transfers more data. Indexed deltas save bytes only within a declared change regime and may add diff/gather overhead. Colocation saves independent inference residency but requires mode transitions. Disaggregation spends additional resources to overlap work. LoRA-only transfer changes the parameter subset and base-model ownership; it is not automatically equivalent to full-model publication.

## Extensions

[OFFICIAL-DOCUMENTATION] The pinned verl guide documents experimental hybrid-pool lending with an adaptive ready-work threshold and measured switch-cost comparison [R36.6]. [DERIVED] This can reduce idle windows without establishing a universal optimum. Its decision must include transition cost, already ready work and staleness; a configuration with hybrid inference disabled cannot use the same lending mechanism.

## Limitations

[DERIVED] Role separation establishes ownership, not exact statistical correction or reproducible service behavior. Mean service rates omit tails and burst correlations. Transfer checksums do not validate semantic task data. An implementation route is only evidence for inspected files at the pinned commit. Unsupported adapters, precision modes and sharding combinations remain explicit compatibility gaps.

## Reproducibility

[DERIVED] Record physical placement, role pool sizes, mode, old-policy convention, all model dtypes/layouts, source/base/target digests, transfer backend and wire units, queue caps, sampler processors, receiver acknowledgments and failed transfer costs. Keep guide tables' sessions separate. Fault and atomic-publication proposals live in [verification.md](verification.md).

## References

[R36.6](references.md) V1 guide, separate-async implementation, delta guide; [R36.7](references.md) pinned asynchronous guide and weight controller.
