---
id: "ms.section.30.1"
entity_type: "section"
title: "Training orchestration"
short_title: "Training orchestration"
volume: 2
part: 5
chapter: 30
section: 30.1
slug: "30-1-training-orchestration"
parent: "ms.chapter.30"
prev_sibling: null
next_sibling: "ms.section.30.2"
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

# 30.1 — Training orchestration

## Scope

[DERIVED] Establish a launch and admission contract that gives every physical worker one logical identity, validates the full dependency closure, and prevents two job generations from committing different updates to the same experiment. The baseline is a fixed-membership synchronous training job; fault-tolerant membership is admitted only with explicit optimizer and data semantics. Placement algorithms themselves belong to [Chapter 29](../ch29-parallelism-collectives-and-distributed-optimization/README.md). This section owns orchestration identity, configuration admission, quotas, and launch fencing.

## Why this exists

[PAPER-REPORTED] The 2026 FT-HSDP study separates allocation, communicator initialization, loading, and first-step overhead; its recovery unit is a data-parallel replica, rather than the whole allocation [R30.1, §3–4]. This changes what a launcher must identify and restart. It does not authorize arbitrary workers to join an ordinary collective.

[DERIVED] A launch command is an incomplete experiment identifier. Two processes can receive the same configuration text while resolving different tokenizer assets, libraries, routing policies, or dataset manifests. A scheduler can replace a node while the displaced process continues writing. A checkpoint path can point at a directory whose membership or optimizer policy differs from the intended run. These are consistency failures before they become performance failures: a fast process is not useful if it belongs to the wrong logical transition.

## Intuition

[MATHEMATICALLY-DERIVED] Separate identity from location. A logical shard identifies tensor coordinates and data obligations; a physical endpoint identifies a currently healthy process. Replacement changes the endpoint while preserving the logical shard's obligations. A monotonically increasing generation fences obsolete endpoints. A state transition is valid only when its generation, membership, input coverage, and predecessor version agree. Hashes identify immutable bytes; they do not establish that those bytes implement the intended algorithm.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $\iota$ | Immutable experiment identity | Digest |
| $e$ | Launch generation, monotonically increasing | Integer |
| $\mathcal R_e$ | Admitted logical ranks in generation $e$ | Set |
| $p_d,p_t,p_p,p_c,p_e$ | Independently declared mesh-axis degrees | Counts |
| $q_r$ | Reserved storage bytes for rank $r$ | Bytes |
| $Q$ | Available job storage quota | Bytes |
| $\mathcal I_k$ | Canonical sample/token identities committed by update $k$ | Set or multiset |

[MATHEMATICALLY-DERIVED] With deterministic canonical serialization $\operatorname{canon}$ and a collision-resistant digest $h$, define

$$
\iota=h\!\left(\operatorname{canon}(\text{model, data, objective, optimizer, tokenizer, code, dependencies, numerical policy})\right).
$$
*(Eq. 30.1)*

The identity binds resolved artifacts and their digests, not mutable names. Include masks, packing, loss denominator, optimizer parameter groups, kernel overrides, compiler flags, driver/runtime identifiers, and a schema version. Credentials and private values must remain outside the identity record; use non-secret resource identifiers and access-policy versions.

[MATHEMATICALLY-DERIVED] For genuinely independent mesh axes, admission requires

$$
|\mathcal R_e|=p_dp_tp_pp_cp_e,\quad \sum_{r\in\mathcal R_e}q_r\le Q,\quad B(t)=\max(0,(s/\Delta-b_s)t).
$$
*(Eq. 30.2)*

The last expression is a constant-rate fluid model from initially empty staging: snapshots produce an average rate $s/\Delta$ bytes/s and drain at constant $b_s$ bytes/s. It is a sensitivity model, not an exact burst-arrival queue. Expert and data groups often share physical axes. In that case the product is replaced by the actual coordinate-to-rank bijection; multiplying overlapping groups double-counts devices. A rank must have exactly one coordinate and every coordinate exactly one endpoint.

```figure
{
  "id": "fig-30.1",
  "kind": "diagram",
  "title": "Immutable identity and replaceable endpoints",
  "caption": "The experiment digest fixes the logical contract. A generation-fenced mapping assigns logical shards to current endpoints; stale endpoints cannot commit.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.1",
  "alt": "The experiment digest fixes the logical contract. A generation-fenced mapping assigns logical shards to current endpoints; stale endpoints cannot commit.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "id",
        "kind": "dependency",
        "label": "Resolved artifact digests"
      },
      {
        "id": "cfg",
        "kind": "process",
        "label": "Canonical configuration"
      },
      {
        "id": "exp",
        "kind": "state",
        "label": "Experiment identity"
      },
      {
        "id": "gen",
        "kind": "state",
        "label": "Launch generation"
      },
      {
        "id": "rank",
        "kind": "tensor",
        "label": "Logical shard"
      },
      {
        "id": "host",
        "kind": "hardware",
        "label": "Physical endpoint"
      },
      {
        "id": "gate",
        "kind": "boundary",
        "label": "Commit fence"
      }
    ],
    "edges": [
      {
        "from": "id",
        "to": "cfg"
      },
      {
        "from": "cfg",
        "to": "exp"
      },
      {
        "from": "exp",
        "to": "gen"
      },
      {
        "from": "gen",
        "to": "rank"
      },
      {
        "from": "rank",
        "to": "host"
      },
      {
        "from": "host",
        "to": "gate"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-30.2",
  "kind": "calculator",
  "title": "Storage quota under changing rank count",
  "caption": "Analytical reservation only: ranks times reserved bytes must fit the declared quota. This is not a measured checkpoint size or a named cluster.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.2",
  "alt": "Analytical reservation only: ranks times reserved bytes must fit the declared quota. This is not a measured checkpoint size or a named cluster.",
  "spec": {
    "tex": "H_Q=Q-gq",
    "equation": "30.2",
    "inputs": [
      {
        "symbol": "g",
        "label": "Logical ranks",
        "default": 64,
        "min": 1,
        "max": 1024,
        "step": 1,
        "format": "integer"
      },
      {
        "symbol": "q",
        "label": "Reserved GiB per rank",
        "default": 8,
        "min": 1,
        "max": 128,
        "step": 1,
        "format": "fixed3"
      },
      {
        "symbol": "Q",
        "label": "Job quota GiB",
        "default": 1024,
        "min": 64,
        "max": 16384,
        "step": 64,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "H",
        "label": "Quota headroom GiB",
        "formula": "Q-g*q",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "R",
        "label": "Reservation GiB",
        "formula": "g*q",
        "format": "fixed3",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Admitted allocation",
      "variables": {
        "g": 64
      },
      "note": "Independent storage reservation for the declared allocation."
    },
    {
      "anchor": "failure-modes",
      "label": "Over-admission",
      "variables": {
        "g": 256
      },
      "note": "A negative headroom requires rejection before workers start."
    }
  ]
}
```

## Mechanism

### Methodology

[DERIVED] Admission proceeds from a resolved contract to a physical plan. Resolve every artifact first; reject missing or ambiguous versions. Validate shapes and vocabulary sizes against the model configuration. Check divisibility and padding rules using the actual sharding map. Verify that each parameter family has exactly the required replica and optimizer owners. Check per-device peak memory, host staging, input-service demand, fabric-cut demand, and storage quota separately. Passing an average memory estimate cannot compensate for an unbounded prefetch buffer.

[DERIVED] Placement adds failure-domain constraints to the communication plan. A replica that is intended to survive a rack event must not place all its necessary copies in that rack. A spare must satisfy the same required device capabilities, dependencies, topology restrictions, and resource reservation as the replaced endpoint. A device count alone is insufficient: the replacement may lack a compatible numerical kernel or a needed network route. Admission should return either a complete mapping or a specific violated constraint, never an apparently successful partial mesh.

[MATHEMATICALLY-DERIVED] A variable cohort must preserve the declared loss normalization. If rank $r$ contributes gradient numerator $u_{r,k}$ and valid-token count $z_{r,k}$, the update input is

$$
g_k=\frac{\sum_{r\in\mathcal C_k}u_{r,k}}{\sum_{r\in\mathcal C_k}z_{r,k}},\qquad \sum_{r\in\mathcal C_k}z_{r,k}>0.
$$
*(Eq. 30.3)*

The accepted cohort $\mathcal C_k$ is fixed for this transition. An average of rank means is equivalent only when the denominators agree. If a cohort changes, either complete the original logical batch through replay or explicitly record the changed batch and scheduling policy. Silently dropping a replica changes both the data exposure and effective batch; preserving a tensor shape does not preserve the training experiment.

[DERIVED] Quotas apply to transient state as well as durable outputs. Reserve local caches, two simultaneous checkpoint generations, pending staged bytes, logs, and conversion workspaces. Cap outstanding work by bytes and operations. A bounded queue must choose backpressure, skip a nonessential diagnostic, or fail admission; an unbounded queue converts temporary storage slowdown into host OOM. Expiry of a reservation requires a coordinated state change rather than independent rank decisions.

[MATHEMATICALLY-DERIVED] If a checkpoint producer creates $s$ bytes every $\Delta$ seconds and the drain rate is $b_s$, long-run stability requires $s/\Delta<b_s$. Equality leaves no slack for bursts, metadata, or contention. For $j$ pending snapshots the staging requirement is at least $js$ before serializer overhead. This bound follows from byte conservation and is independent of whether the API returns a future.

```figure
{
  "id": "fig-30.3",
  "kind": "hierarchy",
  "title": "Admission descends through distinct resource domains",
  "caption": "A valid placement must satisfy the logical mesh, device, host, fabric and durable-store constraints together. No capacity number is attributed to a named platform.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.2",
  "alt": "A valid placement must satisfy the logical mesh, device, host, fabric and durable-store constraints together. No capacity number is attributed to a named platform.",
  "spec": {
    "direction": "down",
    "levels": [
      {
        "label": "Logical update",
        "kind": "objective",
        "note": "Identity and token denominator"
      },
      {
        "label": "Rank mesh",
        "kind": "tensor",
        "note": "Coordinate bijection"
      },
      {
        "label": "Accelerator",
        "kind": "hardware",
        "note": "Peak tensor lifetimes"
      },
      {
        "label": "Host staging",
        "kind": "memory",
        "note": "Bounded asynchronous queues"
      },
      {
        "label": "Fabric cut",
        "kind": "flow",
        "note": "Training plus checkpoint traffic"
      },
      {
        "label": "Durable store",
        "kind": "memory",
        "note": "Quota and drain stability"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-30.4",
  "kind": "chart",
  "title": "Checkpoint staging cannot outrun the drain",
  "caption": "Analytical backlog starts empty and grows only when production exceeds drain. The selected byte rates illustrate conservation, not measured storage performance.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.2",
  "alt": "Analytical backlog starts empty and grows only when production exceeds drain. The selected byte rates illustrate conservation, not measured storage performance.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Elapsed seconds",
      "domain": [
        0,
        120
      ]
    },
    "y": {
      "label": "Backlog GiB",
      "domain": [
        0,
        256
      ]
    },
    "variables": {
      "production": 8,
      "drain": 6
    },
    "series": [
      {
        "id": "backlog",
        "label": "Unstable producer",
        "formula": "max(0,(production-drain)*x)",
        "sample": {
          "from": 0,
          "to": 120,
          "count": 33
        },
        "emphasis": true,
        "dashed": false
      },
      {
        "id": "stable",
        "label": "Matched feasible producer",
        "formula": "max(0,(4-drain)*x)",
        "sample": {
          "from": 0,
          "to": 120,
          "count": 33
        },
        "emphasis": false,
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 120,
        "y": 240,
        "label": "Excess production accumulates: 240 GiB"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-30.38",
  "kind": "memory-stack",
  "title": "Reservation crosses the admission boundary",
  "caption": "Analytical admission example: each logical rank reserves8GiB against a1TiB job quota.64ranks reserve512GiB;128ranks reach the quota;256ranks require2TiB and must be rejected. Quota equality leaves no allowance for unaccounted staging. These are declared inputs, not platform measurements.",
  "alt": "Analytical admission example: each logical rank reserves8GiB against a1TiB job quota.64ranks reserve512GiB;128ranks reach the quota;256ranks require2TiB and must be rejected. Quota equality leaves no allowance for unaccounted staging. These are declared inputs, not platform measurements.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.2",
  "spec": {
    "format": "bytes",
    "budget": { "label": "Declared job quota: 1 TiB", "value": 1099511627776 },
    "bars": [
      {
        "label": "64 logical ranks",
        "segments": [
          {
            "label": "Reserved staging",
            "kind": "memory",
            "value": 549755813888
          }
        ]
      },
      {
        "label": "128 logical ranks",
        "segments": [
          {
            "label": "Reserved staging",
            "kind": "memory",
            "value": 1099511627776
          }
        ]
      },
      {
        "label": "256 logical ranks",
        "segments": [
          {
            "label": "Reserved staging",
            "kind": "memory",
            "value": 2199023255552
          }
        ]
      }
    ]
  }
}
```

## Algorithm

### Algorithm 30.1 — Fenced admission and launch

[DERIVED] This is an explanatory orchestration protocol, not an attributed implementation. Inputs are immutable manifest $A$, finite rank map $\mu$, admission predicates $\mathcal P$, durable generation service, and deadline $t_{\max}$. Outputs are an admitted generation or a failed admission record. State is $\{\mathrm{proposed},\mathrm{reserved},\mathrm{ready},\mathrm{running},\mathrm{retired}\}$ per generation.

$$
\begin{aligned}
1.&\quad \iota\leftarrow h(\operatorname{canon}(A));\quad \mu\leftarrow\operatorname{validate\_bijection}(\mu).\\
2.&\quad \neg\bigwedge_{P\in\mathcal P}P(A,\mu)\ \Longrightarrow\ \operatorname{return\_rejected}(\text{violations}).\\
3.&\quad e\leftarrow\operatorname{reserve\_new\_generation}(\iota,\mu);\quad \operatorname{fence}(e'<e).\\
4.&\quad a_r\leftarrow\operatorname{launch}(\iota,e,r,\mu(r));\quad r\in\mathcal R_e.\\
5.&\quad \operatorname{ready}(r)\Longleftrightarrow(a_r.\iota,a_r.e,a_r.r)=(\iota,e,r)\land\operatorname{health}(r).\\
6.&\quad t>t_{\max}\ \lor\ \exists r:\operatorname{failed}(r)\ \Longrightarrow\ \operatorname{retire}(e),\operatorname{release}(e),\operatorname{return\_failed}(e).\\
7.&\quad \bigwedge_r\operatorname{ready}(r)\ \Longrightarrow\ \operatorname{publish\_running}(\iota,e,\mu).\\
8.&\quad \operatorname{commit}(k)\Longleftrightarrow\operatorname{current}(\iota,e)\land\operatorname{running}(e)\land\operatorname{cohort\_valid}(k).
\end{aligned}
$$
*(Eq. 30.4)*

[MATHEMATICALLY-DERIVED] The invariant is that only the currently admitted generation may publish state. This requires the commit sink to enforce fencing atomically; merely asking old workers to stop is insufficient under network partition. Deadline failure retires the whole incomplete generation before release. Local validation is linear in manifest entries and map size; topology feasibility can be a separate combinatorial optimization. Readiness aggregation costs at least one acknowledgement per admitted endpoint, with timeout and retry costs recorded separately.

## Implementation

[OFFICIAL-DOCUMENTATION] TorchTitan, **Distributed training**, v0.3.0 uses typed Python configuration and typed CLI overrides [R30.2, configuration release section; R30.3, configuration README]. The release changes configuration admission surfaces; it does not certify a deployment's dependency closure. Megatron-LM and NVIDIA Megatron-Core, **Distributed training**, are plan-anchored realization routes; MaxText is separately admitted through the plan's explicit anchor [R30.11, R30.12].

[DERIVED] Persist the resolved configuration after inheritance and overrides, together with the environment lock and code revision. Log both logical and physical rank coordinates. Perform health probes before creating expensive communicators, then repeat a minimal collective probe after membership publication. The second check validates the created group; the first checks the candidate endpoints. Neither substitutes for numerical parity. Keep the controller's state store independent of training processes so recovery cannot depend on a dead process answering its own failure detector.

[DERIVED] Cost accounting includes controller CPU/memory, reserved spares, input-cache footprint, startup/compile latency, network probes, storage staging, and allocator reservation. Orchestration adds no trainable parameters and no objective tokens by itself; replays add consumed tokens and compute without adding retained unique progress. Energy and money require measured component usage and allocation prices; they are UNVERIFIED for this edition. A utilization increase can still lose economic efficiency if it requires excessive idle spares.

```figure
{
  "id": "fig-30.5",
  "kind": "compare",
  "title": "Fixed launch and generation-aware launch",
  "caption": "The comparison concerns admission semantics, not throughput. A fixed process group cannot inherit dynamic membership behavior from an external scheduler.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.4",
  "alt": "The comparison concerns admission semantics, not throughput. A fixed process group cannot inherit dynamic membership behavior from an external scheduler.",
  "spec": {
    "axis": "Identity and failure semantics at launch",
    "columns": [
      {
        "id": "fixed",
        "label": "Fixed generation"
      },
      {
        "id": "fenced",
        "label": "Fenced replacement"
      }
    ],
    "rows": [
      {
        "dimension": "Endpoint mapping",
        "values": {
          "fixed": "Immutable for job lifetime",
          "fenced": "New endpoint; same logical obligation"
        }
      },
      {
        "dimension": "Stale writer",
        "values": {
          "fixed": "Requires whole-job retirement",
          "fenced": "Rejected at commit sink"
        }
      },
      {
        "dimension": "Membership change",
        "values": {
          "fixed": "Relaunch group",
          "fenced": "Explicit cohort protocol"
        }
      },
      {
        "dimension": "Quota",
        "values": {
          "fixed": "One reserved allocation",
          "fenced": "Overlap during replacement counted"
        }
      }
    ]
  }
}
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] FT-HSDP §6.1 studies one 98K-H100 allocation with 12 replicas across four buildings and injected replica failure; smaller studies examine accuracy and communication [R30.1]. That experiment is evidence for the disclosed architecture, not a controlled comparison of arbitrary launchers. Its authors explicitly note limited large-scale repetition. Configuration admission and quota enforcement are not separately ablated in that study.

[NOT-DISCLOSED] The inspected release records do not provide a matched orchestration benchmark with complete dependency locks, admission failures, quota exhaustion, and multiple seeds. Consequently this section reports no launcher speedup and no universal launch timeout. The proposed fault-injection protocol remains in [verification](verification.md).

[PAPER-REPORTED] The large-run protocol is specified in FT-HSDP §6.1 [R30.1].

| Field | Source disclosure |
|---|---|
| Model/data | Dense trillion-parameter text/image model; exact parameter count, mixture and split NOT-DISCLOSED |
| Allocation | 98K H100 GPUs;12 replicas of 8192;4 buildings |
| Intervention | Terminate one replica; restore/rejoin that replica while others proceed |
| Stack/precision | Custom HSDP/FTAR stack; full numerical/dependency recipe NOT-DISCLOSED |
| Budget/uncertainty | One large allocation experiment; repeated-run CI NOT-DISCLOSED |
| Baselines/ablations | Smaller communication/accuracy studies; no isolated admission/placement/quota ablation |

[PAPER-REPORTED] The observed failure stall is approximately 3 minutes. A projected1.5 minutes after fixing two identified overheads is an estimate, not a second large-run measurement; rejoining also incurs an approximately 100 second stall [R30.1, §6.1]. [DERIVED] The distinction prevents a proposed engineering improvement from being reported as observed recovery.

## Observations

**What the paper claims.** [PAPER-REPORTED] Replica-scoped recovery allows healthy replicas to continue [R30.1, §4].

**What the evidence shows.** [DERIVED] The experiment identifies recovery scope and measured stall components within its deployment. It does not establish that changing membership preserves every external training recipe.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 30.3 requires token-count weighting or explicit logical-batch replay when participation changes. Eq. 30.4 requires sink-enforced fencing to exclude obsolete generations.

**What remains unknown.** [UNVERIFIED] This edition has not executed the admission protocol, tested a specific controller under partition, or established production startup distributions.

## Failure modes

> **Failure mode — Split generation.** [DERIVED] *Symptom:* identical update number under different endpoint maps. *Cause:* replacement published before old writers were fenced. *Detection:* generation mismatch at the durable sink. *Mitigation:* atomic generation checks and explicit retirement.

> **Failure mode — Configuration agreement without artifact agreement.** [DERIVED] *Symptom:* same text configuration, different tokenization or kernels. *Cause:* mutable names resolved independently. *Detection:* resolved-artifact digest mismatch. *Mitigation:* resolve once, bind digests, reject inconsistent workers.

[DERIVED] Quota failure, unavailable topology, partial readiness, exhausted spares, and expired credentials require distinct admission outcomes. Retrying all of them identically can repeatedly allocate expensive capacity without making progress. A transient retry remains bounded by deadline and reservation lifetime.

```figure
{
  "id": "fig-30.6",
  "kind": "stat-panel",
  "title": "Launch rejection ledger",
  "caption": "These are categorical admission conditions derived from the generation and resource contract. They are not observed incident frequencies.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.4",
  "alt": "These are categorical admission conditions derived from the generation and resource contract. They are not observed incident frequencies.",
  "spec": {
    "header": "Launch rejection ledger",
    "rows": [
      {
        "key": "Identity",
        "value": "Resolved digest agreement"
      },
      {
        "key": "Placement",
        "value": "Complete coordinate bijection"
      },
      {
        "key": "Reservation",
        "value": "Device, host, store headroom"
      },
      {
        "key": "Generation",
        "value": "Exactly one current writer"
      },
      {
        "key": "Deadline",
        "value": "Bounded readiness wait"
      }
    ]
  },
  "anchor": "failure-modes"
}
```

## Siblings

[DERIVED] **Physical placement** in [§29.6](../ch29-parallelism-collectives-and-distributed-optimization/29-6-joint-optimization.md) chooses resource assignments; orchestration binds and fences the chosen assignment. **Checkpoint selection** in [§30.6](30-6-recovery-and-reproducibility.md) chooses a recoverable predecessor, after which this admission protocol creates its executor. **Objective scheduling** belongs to Chapters 19–21; launch retries must not silently alter it.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] The 2026 TorchTitan release provides a changed typed configuration route [R30.2]. The inspected disclosure supplies no isolating admission-correctness experiment, so improved reproducibility is a capability to inspect rather than an established measured outcome. [DERIVED] Multi-role post-training launch extends the identity with actor roles, policy versions and data ownership; the optimizer/rollout consistency methods remain owned by Chapter 36.

## Limitations

[DERIVED] The protocol assumes an available generation authority with atomic fencing and a complete logical dependency manifest. It does not solve Byzantine workers, malicious artifact substitution, scheduler optimality, or the fault-tolerant collective implementation. A launch can be correctly admitted and subsequently fail numerically; admission is a necessary boundary, not a convergence theorem.

## Reproducibility

[DERIVED] Retain immutable manifest, resolved artifact hashes, schema version, dependency lock, launch generation, complete rank map, reservations, health acknowledgements, readiness deadline, and all failed admissions. Distinguish requested configuration from resolved configuration. [UNVERIFIED] No installed compatibility or GPU run is claimed; source inspection date is 2026-10-09.

## References

[R30.1] FT-HSDP §3–6; [R30.2] TorchTitan v0.3.0; [R30.3] pinned configuration surface; [R30.11] Megatron-Core release; [R30.12] MaxText release. See [typed source records](references.md).
