---
id: "ms.section.30.2"
entity_type: "section"
title: "Memory management"
short_title: "Memory management"
volume: 2
part: 5
chapter: 30
section: 30.2
slug: "30-2-memory-management"
parent: "ms.chapter.30"
prev_sibling: "ms.section.30.1"
next_sibling: "ms.section.30.3"
children: []
prerequisites: ["ms.chapter.12", "ms.chapter.19", "ms.chapter.20", "ms.chapter.21", "ms.chapter.25", "ms.chapter.26", "ms.chapter.27", "ms.chapter.28", "ms.chapter.29"]
downstream: ["ms.chapter.31", "ms.chapter.36", "ms.chapter.44"]
related: []
relations: []
axes: {"lifecycle": ["pretraining", "continued_training"], "mechanism": ["distributed_training", "fault_tolerance", "checkpointing"], "feedback_setting": [], "modality": ["text", "image"]}
papers: []
implementations: ["impl.torchtitan", "impl.megatron-lm", "impl.nvidia-megatron-core"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2000
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 30.2 — Memory management

## Scope

[DERIVED] Select activation retention, recomputation, optimizer-state placement, offload and allocator policy under simultaneous device/host capacity and execution-time constraints. The baseline retains all backward-required tensors and keeps optimizer state on the accelerator. The acceptance condition is the same declared mathematical update with a legal lifetime schedule. Sharding identities are owned by [§29.1](../ch29-parallelism-collectives-and-distributed-optimization/29-1-data-state-parallelism.md); this section develops their interaction with transient memory and recovery.

## Why this exists

[PAPER-REPORTED] LazyTrain formulates checkpoint boundaries, GPU/CPU/NVMe placement and communication windows jointly; its final reported placement solve restricts some variables [R30.5, §3.2–3.5, Table 1]. A solver status therefore refers to that constrained problem, not unrestricted training execution. The distinction matters whenever a memory plan is presented as globally optimal.

[DERIVED] Persistent state is only part of peak memory. Multiple gathered parameter buffers, in-flight communication, replay activations, allocator segments and asynchronous snapshots can overlap. Moving one tensor out of HBM can create a host staging allocation plus a reload buffer. A policy that fits the sum of nominal model states can still fail at the first transition that simultaneously retains old and new buffers. The correct object is the lifetime schedule, not one bytes-per-parameter constant.

## Intuition

[MATHEMATICALLY-DERIVED] Storage and recomputation exchange different resources. Saving an activation consumes capacity over its full lifetime and usually device traffic for production and later consumption. Recomputing consumes forward operators, their workspaces, and any communications those operators require. Offloading consumes at least an outbound and inbound transfer, host capacity, and synchronization. These costs can overlap only where the dependency graph and physical links permit it. A capacity-feasible plan can be slower; a fast estimate can be lifetime-infeasible.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $\mathcal A(t)$ | Allocations live at time $t$ | Set |
| $s_j$ | Bytes of allocation $j$ | Bytes |
| $K_g,K_h$ | Device and host capacity budgets | Bytes |
| $a$ | Bytes per equally sized saved boundary in the analytical chain | Bytes |
| $k$ | Segment length in that chain | Layers |
| $w_j$ | Legal overlap window for tensor $j$ | Seconds |
| $b_{dh},b_{hd}$ | Achieved D2H/H2D transfer rates | Bytes/s |

[MATHEMATICALLY-DERIVED] Peak live bytes and allocator reserve are distinct:

$$
M_{\rm live}^{\rm peak}=\max_t\sum_{j\in\mathcal A(t)}s_j,\qquad M_{\rm live}(t)\le M_{\rm reserved}(t)\le K_g.
$$
*(Eq. 30.5)*

The last inequality is an admission requirement, not an allocator guarantee. Reserved inactive bytes can be reusable only under the allocator's placement rules. External runtime allocations need separate accounting; a framework counter that omits them is not a device-capacity certificate.

```figure
{
  "id": "fig-30.7",
  "kind": "diagram",
  "title": "Every optimization changes tensor lifetimes",
  "caption": "A saved boundary can remain resident, move to host, or be discarded and recomputed. All routes must produce the same backward input before its consumer executes.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.5",
  "alt": "A saved boundary can remain resident, move to host, or be discarded and recomputed. All routes must produce the same backward input before its consumer executes.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "f",
        "kind": "process",
        "label": "Forward producer"
      },
      {
        "id": "save",
        "kind": "memory",
        "label": "Resident boundary"
      },
      {
        "id": "host",
        "kind": "memory",
        "label": "Host copy"
      },
      {
        "id": "remat",
        "kind": "process",
        "label": "Recompute segment"
      },
      {
        "id": "ready",
        "kind": "tensor",
        "label": "Backward-ready tensor"
      },
      {
        "id": "b",
        "kind": "process",
        "label": "Backward consumer"
      }
    ],
    "edges": [
      {
        "from": "f",
        "to": "save"
      },
      {
        "from": "f",
        "to": "host"
      },
      {
        "from": "f",
        "to": "remat"
      },
      {
        "from": "save",
        "to": "ready"
      },
      {
        "from": "host",
        "to": "ready"
      },
      {
        "from": "remat",
        "to": "ready"
      },
      {
        "from": "ready",
        "to": "b"
      }
    ]
  }
}
```

[MATHEMATICALLY-DERIVED] For an equal-sized linear chain of $L$ layers split into segments of at most $k$, a conservative saved-boundary plus local-replay term is

$$
M_{\rm act}(k)\le a\!\left(\left\lceil L/k\right\rceil+k+1\right)+M_{\rm workspace},\qquad 1\le k\le L.
$$
*(Eq. 30.6)*

There are at most $\lceil L/k\rceil+1$ retained segment boundaries and at most $k$ replay-local activations. The expression excludes persistent model state and communication. The continuous surrogate $L/k+k$ has minimum at $k=\sqrt L$; the discrete optimum checks neighboring legal integers and actual layer sizes. This is an illustrative chain bound, not a claim that a Transformer always has uniform activations or that a compiler implements this schedule.

```figure
{
  "id": "fig-30.8",
  "kind": "calculator",
  "title": "Segment length versus retained activation bytes",
  "caption": "Analytical equal-size chain, not a named model. The calculator executes the explicit boundary-plus-replay upper bound; workspaces and persistent state remain separate.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.6",
  "alt": "Analytical equal-size chain, not a named model. The calculator executes the explicit boundary-plus-replay upper bound; workspaces and persistent state remain separate.",
  "spec": {
    "tex": "M_a=a(\\lceil L/k\\rceil+k+1)",
    "equation": "30.6",
    "inputs": [
      {
        "symbol": "L",
        "label": "Layers",
        "default": 64,
        "min": 64,
        "max": 256,
        "step": 1,
        "format": "integer"
      },
      {
        "symbol": "k",
        "label": "Layers per segment",
        "default": 8,
        "min": 1,
        "max": 64,
        "step": 1,
        "format": "integer"
      },
      {
        "symbol": "a",
        "label": "Boundary MiB",
        "default": 64,
        "min": 1,
        "max": 1024,
        "step": 1,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "Ma",
        "label": "Activation MiB",
        "formula": "a*(ceil(L/k)+k+1)",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "boundaries",
        "label": "Saved boundaries",
        "formula": "ceil(L/k)+1",
        "format": "integer",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] Begin with the forward/backward DAG and enumerate tensors needed by each reverse-mode rule. A retained tensor must preserve the value/version required by that rule, including views and aliasing. For rematerialization, retain sufficient inputs and random-generator state to recreate the forward value. A stateful forward operation must not update persistent state twice. Replaying a dropout operation with an advanced generator changes the backward computation; replaying a collective can change the schedule or deadlock unless every participant follows the same replay path.

[DERIVED] Selective recomputation retains expensive or communication-heavy results and regenerates cheaper values. Its optimization primitive is a legal cut of the joint graph, not independent deletion of arbitrary tensors. For an analytical independent-item relaxation with nonnegative integer memory costs $m_j$, saved-time values $v_j$, and budget $W$, the recurrence is

$$
F_j(w)=\max\{F_{j-1}(w),F_{j-1}(w-m_j)+v_j\},\quad w\ge m_j;
\qquad F_j(w)=F_{j-1}(w)\ \text{otherwise}.
$$
*(Eq. 30.7)*

Initialize $F_0(w)=0$. This solves the stated independent-item knapsack, not the unrestricted scheduling problem. Dependencies, aliases and recomputation sharing can violate additivity. Memory quantization must round item sizes upward and the budget downward to preserve feasibility; rounding both to nearest can admit an over-budget selection. Runtime estimates must be calibrated for the actual shape/dtype path.

[PAPER-REPORTED] The 2026 sliding-window/Hirschberg study computes DP profiles for two item halves and splits capacity at their maximizing combined value; it reports synthetic planner benchmarks, rather than end-to-end training throughput [R30.4, §3–4]. [MATHEMATICALLY-DERIVED] Keeping two DP rows reduces value-computation storage, but recovering the selected items requires additional reconstruction state. The planner's host-memory savings do not directly subtract activation bytes from a GPU allocation.

[MATHEMATICALLY-DERIVED] For one activation whose outbound and inbound copies are sequential within an available overlap window, exposed time obeys the simplified bound

$$
t_{\rm exposed}\ge\max\left(0,s_j/b_{dh}+s_j/b_{hd}-w_j\right).
$$
*(Eq. 30.8)*

The bound assumes those rates are achievable during overlap and counts no conversion or endpoint overhead. If directions overlap independently, model separate windows rather than adding them blindly. If parameters, gradients, activation offload and snapshots share one fabric cut, their combined bytes must fit its service envelope. A prefetch that consumes another kernel's bandwidth can turn a nominally hidden copy into a compute slowdown.

[MATHEMATICALLY-DERIVED] State-family accounting applies distinct ownership factors:

$$
M_r^{\rm persistent}=\sum_f N_f\!\left(\frac{b_{p,f}}{s_{p,f}}+\frac{b_{g,f}}{s_{g,f}}+\frac{b_{o,f}}{s_{o,f}}\right)+M_r^{\rm metadata}.
$$
*(Eq. 30.9)*

Here $N_f$ is parameter-family size, each $b$ counts bytes per logical parameter in that state, and each $s$ is its actual sharding factor at rank $r$; nonuniform families use their exact coordinate counts. A master parameter copy is included explicitly in the relevant state. Gather buffers, activation lifetimes and offload staging are additional. Optimizer offload changes residency and compute location; it does not remove optimizer state or its update traffic.

```figure
{
  "id": "fig-30.9",
  "kind": "chart",
  "title": "Uniform-chain memory has a discrete trade-off",
  "caption": "For the declared 64-layer chain and 64 MiB boundaries, segment boundaries fall as replay-local activations rise. This is Eq. 30.6 without workspace, not a benchmark. Markers are integer segment lengths; no fractional layer configuration is implied.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.6",
  "alt": "For the declared 64-layer chain and 64 MiB boundaries, segment boundaries fall as replay-local activations rise. This is Eq. 30.6 without workspace, not a benchmark.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "Segment layers k",
      "domain": [
        1,
        64
      ]
    },
    "y": {
      "label": "Activation MiB"
    },
    "variables": {
      "L": 64,
      "a": 64
    },
    "series": [
      {
        "id": "total",
        "label": "Boundaries plus local replay",
        "formula": "a*(ceil(L/x)+x+1)",
        "sample": {
          "from": 1,
          "to": 64,
          "count": 64
        },
        "emphasis": true,
        "dashed": false
      },
      {
        "id": "saved",
        "label": "Segment boundaries",
        "formula": "a*(ceil(L/x)+1)",
        "sample": {
          "from": 1,
          "to": 64,
          "count": 64
        },
        "emphasis": false,
        "dashed": true
      },
      {
        "id": "local",
        "label": "Local replay",
        "formula": "a*x",
        "sample": {
          "from": 1,
          "to": 64,
          "count": 64
        },
        "emphasis": false,
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 8,
        "y": 1088,
        "label": "Minimum on this integer grid: k = 8"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-30.10",
  "kind": "hierarchy",
  "title": "Offload consumes more than the destination tier",
  "caption": "The route includes a device staging lifetime, an interconnect service window and a host allocation. NVMe placement adds another endpoint and cannot be credited solely from HBM savings.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.8",
  "alt": "The route includes a device staging lifetime, an interconnect service window and a host allocation. NVMe placement adds another endpoint and cannot be credited solely from HBM savings.",
  "spec": {
    "direction": "down",
    "levels": [
      {
        "label": "Backward consumer",
        "kind": "process",
        "note": "Reload completion required"
      },
      {
        "label": "Device staging",
        "kind": "memory",
        "note": "Old and new buffers may overlap"
      },
      {
        "label": "Interconnect",
        "kind": "flow",
        "note": "Competes with parameter and gradient traffic"
      },
      {
        "label": "Host pinned memory",
        "kind": "memory",
        "note": "Capacity and pinning limits"
      },
      {
        "label": "NVMe endpoint",
        "kind": "memory",
        "note": "Write/read service and endurance"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-30.39",
  "kind": "memory-stack",
  "title": "Where the activation minimum comes from",
  "caption": "Uniform-chain analytical example with64layers and64MiB activation units. Segment lengths4,8,16 require1344,1088,1344MiB respectively. Small segments retain more boundaries; large segments require more local replay workspace. Parameters, optimizer state and nonuniform lifetimes are excluded.",
  "alt": "Uniform-chain analytical example with64layers and64MiB activation units. Segment lengths4,8,16 require1344,1088,1344MiB respectively. Small segments retain more boundaries; large segments require more local replay workspace. Parameters, optimizer state and nonuniform lifetimes are excluded.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.6",
  "spec": {
    "format": "bytes",
    "bars": [
      {
        "label": "k = 4 layers",
        "segments": [
          {
            "label": "Retained segment boundaries",
            "kind": "tensor",
            "value": 1140850688
          },
          {
            "label": "Local replay workspace",
            "kind": "memory",
            "value": 268435456
          }
        ]
      },
      {
        "label": "k = 8 layers",
        "segments": [
          {
            "label": "Retained segment boundaries",
            "kind": "tensor",
            "value": 603979776
          },
          {
            "label": "Local replay workspace",
            "kind": "memory",
            "value": 536870912
          }
        ]
      },
      {
        "label": "k = 16 layers",
        "segments": [
          {
            "label": "Retained segment boundaries",
            "kind": "tensor",
            "value": 335544320
          },
          {
            "label": "Local replay workspace",
            "kind": "memory",
            "value": 1073741824
          }
        ]
      }
    ]
  }
}
```

## Algorithm

### Algorithm 30.2 — Lifetime-safe retention and offload schedule

[DERIVED] Inputs are a finite operator DAG, tensor sizes, replay eligibility, device/host budgets, transfer resources and an immutable numerical contract. Output is a valid schedule or rejection. Candidate choices may come from a solver; correctness is checked independently from its objective value.

$$
\begin{aligned}
1.&\quad \mathcal S\leftarrow\operatorname{candidate\_schedule}(\text{DAG},K_g,K_h).\\
2.&\quad \exists j:\operatorname{replay}(j)\land\neg\operatorname{replay\_safe}(j)\ \Longrightarrow\ \operatorname{reject}.\\
3.&\quad \forall j:\ \operatorname{produce}(j)\prec\operatorname{snapshot}(j)\prec\operatorname{overwrite}(j).\\
4.&\quad \forall j:\ \operatorname{reload\_done}(j)\prec\operatorname{consume}_{\rm backward}(j).\\
5.&\quad \forall t:\ M_g(\mathcal S,t)\le K_g\ \land\ M_h(\mathcal S,t)\le K_h.\\
6.&\quad \forall\text{ resource }u:\operatorname{nonoverlap}(\mathcal S,u)\land\operatorname{capacity}(\mathcal S,u).\\
7.&\quad \operatorname{forward}_{\mathcal S};\quad\operatorname{backward}_{\mathcal S};\quad\operatorname{release\_after\_last\_use}.\\
8.&\quad \neg\operatorname{parity}(g_{\mathcal S},g_{\rm reference})\ \Longrightarrow\ \operatorname{reject\_policy}.
\end{aligned}
$$
*(Eq. 30.10)*

[MATHEMATICALLY-DERIVED] The invariant is preservation of each consumer's required tensor version. Step 3 makes snapshot ownership explicit; a stream launch without its completion relation does not preserve it. The finite DAG and bounded transfers give termination only if resources make progress; timeout or allocator failure rejects the run. Validation requires a topological/lifetime pass, typically linear after sorting events, plus numerical comparison cost. Finding an optimal schedule can be combinatorial. Independent-item DP costs $O(nW)$ arithmetic operations and is pseudo-polynomial in quantized capacity.

## Implementation

[OFFICIAL-DOCUMENTATION] NVIDIA Megatron-Core, **Distributed training**, 0.19.0 documents graph-compatible activation offload and incremental quantized checkpoint loading [R30.11, Performance and Memory]. TorchTitan v0.3.0 documents composable activation-checkpointing policies [R30.2]. These capability statements are version-bound; they are not evidence that an arbitrary custom operation is replay-safe.

[DERIVED] Record device and host high-water marks at the same schedule boundary as timing. Check whether allocator reserved bytes, external communication pools and graph-private pools are included. Fragmentation is a placement problem: enough aggregate free bytes need not provide a legal block for the next request. Bucketing shapes can improve reuse but changes padding and compute. Reclaiming a buffer before a transfer completes is a use-after-free even when memory counters improve.

[DERIVED] Recomputation adds executed FLOPs and possibly network bytes while useful-model FLOPs remain fixed; [§30.5](30-5-observability.md) separates MFU and HFU. Optimizer offload adds CPU update work and state traffic; activation offload adds two-way tensor traffic. Parameters and valid objective tokens remain unchanged for exact policies. Energy, storage endurance and monetary cost are UNVERIFIED without measured traffic and allocation records. Lossy activation or optimizer compression is a different numerical policy and must be compared as such.

```figure
{
  "id": "fig-30.11",
  "kind": "compare",
  "title": "Retention, replay and offload change different resources",
  "caption": "The axis is the backward-input contract at fixed mathematical update. Compression is deliberately excluded because it requires an additional numerical-error contract.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.10",
  "alt": "The axis is the backward-input contract at fixed mathematical update. Compression is deliberately excluded because it requires an additional numerical-error contract.",
  "spec": {
    "axis": "Resource exchanged while preserving exact backward inputs",
    "columns": [
      {
        "id": "save",
        "label": "Retain"
      },
      {
        "id": "replay",
        "label": "Recompute"
      },
      {
        "id": "offload",
        "label": "Offload"
      }
    ],
    "rows": [
      {
        "dimension": "Device lifetime",
        "values": {
          "save": "Until backward last use",
          "replay": "Inputs plus replay window",
          "offload": "Producer and reload windows"
        }
      },
      {
        "dimension": "Additional FLOPs",
        "values": {
          "save": "None from policy",
          "replay": "Selected forward subgraph",
          "offload": "Packing or conversion if any"
        }
      },
      {
        "dimension": "Additional traffic",
        "values": {
          "save": "Resident read",
          "replay": "Replay reads and collectives",
          "offload": "Outbound plus inbound"
        }
      },
      {
        "dimension": "Correctness hazard",
        "values": {
          "save": "Premature overwrite",
          "replay": "RNG or side-effect drift",
          "offload": "Stale or incomplete reload"
        }
      }
    ]
  }
}
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] LazyTrain's matched H800 comparison uses Qwen3.6-27B, MetaMathQA 70/30 split, sequence length 1024, batch 72 and one epoch. Its ablations remove the scheduler or the combined optimizer component; rows are generally single runs [R30.5, §4, Appendix C–E]. [PAPER-REPORTED] The planner study uses synthetic knapsack instances on a 64-GB Ryzen host with repeated solver timing [R30.4, §4]. These are different experimental units and cannot be combined into one training speedup.

[NOT-DISCLOSED] Cross-hardware confidence intervals for the joint offload policy and a fault-injected optimizer-state offload study are absent from these inspected protocols. No configuration is silently filled from a different paper. The edition's exact-update comparison and allocator stress tests remain unexecuted proposals.

[PAPER-REPORTED] These records keep planner timing distinct from training timing [R30.4, §4; R30.5, §4.1,4.4, Appendix C–G].

| Field | Knapsack planner | LazyTrain matched ablation |
|---|---|---|
| Unit/model | Synthetic0/1 instances; not a model run | Qwen3.6-27B, source's stated configuration |
| Hardware | Ryzen79800X3D,64 GB RAM | One H80080 GB; separate RTX3090 cases |
| Data/budget | Capacity1.4e8–3.8e8;1000 timing repeats | MetaMathQA70/30; seq1024; batch 72; one epoch/3841 steps |
| Baseline/ablation | Conventional planner DP | No scheduler; no combined optimizer component |
| Precision/uncertainty | Integer planning; hardware-training CI not applicable | Complete precision recipe in source appendices; matched rows single-run, CI unavailable |

[PAPER-REPORTED] The matched LazyTrain row reports1361 tokens/s versus1195 without its scheduler and1357 without its combined optimizer component [R30.5, §4.4]. The planner study reports25–28% faster solving, not training acceleration [R30.4, §4]. [DERIVED] These different denominators cannot support an additive or multiplicative combined training gain.

## Observations

**What the paper claims.** [PAPER-REPORTED] LazyTrain attributes its main matched-configuration benefit to scheduling through component removal [R30.5, §4.4].

**What the evidence shows.** [DERIVED] That ablation changes a complete policy within the reported executor; the restricted final solve cannot establish global optimality of the unrestricted MILP. Planner benchmarks measure planner resources, not model-training quality.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 30.8 and Eq. 30.9 explain why reducing device residency can expose link or CPU cost. Eq. 30.6 predicts an interior segment-size trade-off only under its uniform-chain premises.

**What remains unknown.** [UNVERIFIED] Installed kernel compatibility, update parity, allocator fragmentation under long-running dynamic shapes, energy and monetary effects are not independently measured here.

## Failure modes

> **Failure mode — Replay with changed randomness.** [DERIVED] *Symptom:* forward agreement but backward mismatch. *Cause:* replay consumes a different random stream. *Detection:* per-operation replay comparison. *Mitigation:* restore the required generator state or reject replay eligibility.

> **Failure mode — Offload queue growth.** [MATHEMATICALLY-DERIVED] *Symptom:* host memory rises while device memory appears stable. *Cause:* production exceeds drain or snapshots remain owned. *Detection:* queued bytes and completion age. *Mitigation:* bounded staging and backpressure.

[DERIVED] Fragmentation, graph-pool retention, pinned-memory exhaustion and collective replay-order mismatch need separate symptoms and policies. A single OOM counter cannot identify them. An optimization accepted only on a short steady-shape trace remains unverified on a dynamic long-running schedule.

```figure
{
  "id": "fig-30.12",
  "kind": "stat-panel",
  "title": "Memory policy rejection conditions",
  "caption": "Categorical checks follow the lifetime and numerical contract. These are no measured failure rates.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.10",
  "alt": "Categorical checks follow the lifetime and numerical contract. These are no measured failure rates.",
  "spec": {
    "header": "Memory policy rejection conditions",
    "rows": [
      {
        "key": "RNG",
        "value": "Replay state restored"
      },
      {
        "key": "Aliasing",
        "value": "Required versions retained"
      },
      {
        "key": "Transfers",
        "value": "Reload completion before use"
      },
      {
        "key": "Capacity",
        "value": "Device and host peak fit"
      },
      {
        "key": "Numerics",
        "value": "Independent update parity"
      }
    ]
  },
  "anchor": "failure-modes"
}
```

## Siblings

[DERIVED] **State sharding**, [§29.1](../ch29-parallelism-collectives-and-distributed-optimization/29-1-data-state-parallelism.md), changes ownership; **activation retention** changes lifetimes. **Kernel fusion**, [Chapter 26](../ch26-kernel-programming-and-numerical-equivalence/README.md), changes intermediates and can change the legal checkpoint cut. **Durable checkpointing**, [§30.3](30-3-checkpoint-design.md), protects recovery state rather than backward intermediates; the shared word checkpoint does not make their contents or costs interchangeable.

## Extensions

### Improvements

[PAPER-REPORTED] The sliding-window/Hirschberg method changes planner reconstruction memory while preserving its stated knapsack optimum [R30.4]. LazyTrain changes placement and communication scheduling jointly [R30.5]. Neither establishes that independent-item optimality survives aliasing or shared recomputation costs. [DERIVED] Long context and multimodal encoders require nonuniform tensor sizes and operation-specific replay contracts; substitute their actual DAG rather than applying a uniform-layer bound as a capacity estimate.

## Limitations

[DERIVED] The analytical models omit contention-dependent bandwidth and operator-runtime variation unless explicitly supplied. A policy optimal under stale timings can be slower after compilation changes. Finite solver tolerance, memory quantization and excluded candidates belong in the result, with feasibility checked against actual bytes. No method can offload into unavailable host capacity or hide a dependency after its consumer deadline.

## Reproducibility

[DERIVED] Preserve joint graph, candidate replay cuts, tensor sizes/aliases, RNG policy, allocator configuration, optimizer dtype/ownership, transfer service measurements, solver constraints/status/gap, and complete schedule. Keep planner benchmarks separate from end-to-end runs. [UNVERIFIED] No training run or measured memory saving is claimed for this edition.

## References

[R30.2] TorchTitan release; [R30.4] planner method §3–4; [R30.5] LazyTrain §3–4 and appendices; [R30.11] pinned Megatron-Core release. See [references](references.md).
