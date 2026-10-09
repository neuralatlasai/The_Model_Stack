---
id: "ms.section.30.6"
entity_type: "section"
title: "Recovery and reproducibility"
short_title: "Recovery and reproducibility"
volume: 2
part: 5
chapter: 30
section: 30.6
slug: "30-6-recovery-and-reproducibility"
parent: "ms.chapter.30"
prev_sibling: "ms.section.30.5"
next_sibling: null
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

# 30.6 — Recovery and reproducibility

## Scope

[DERIVED] Restore a qualified, globally consistent training state; distinguish exact replay, numerical-tolerance continuation and changed experiments; and account for recovery's lost work and resources. The baseline is rollback to a complete optimizer-step checkpoint. Elastic membership and in-memory communicator repair are admitted only after their additional preconditions pass. Success is restored agreement of model, optimizer, data exposure and scheduler state with a declared uninterrupted reference, not merely a process returning to its training loop.

## Why this exists

[PAPER-REPORTED] Two 2026 branches address different failures: DeadPool transfers recovery state to host/peer memory, while AccelPact repairs framework communication references when committed device state remains healthy [R30.7, §V–VI; R30.13, §III]. Neither branch makes durable checkpoints unnecessary for every failure. A lost device and a failed communicator do not leave the same recoverable state.

[DERIVED] Restarting from the numerically largest directory name is unsafe when that directory contains incomplete shards, compressed deltas with deleted bases, a model-only export, or an incompatible optimizer schema. Continuing from healthy device tensors is unsafe when the failure occurred halfway through a parameter update. Repartitioning can preserve tensor values while changing random streams, sample order or loss normalization. Reliability therefore requires a recovery decision with explicit eligibility predicates, equivalence level and fallback; a low recovery latency cannot compensate for admitting the wrong predecessor state.

## Intuition

[MATHEMATICALLY-DERIVED] Recovery first selects a state that every required logical shard can reconstruct. It then transforms storage coordinates to the new execution layout without changing the state contract. Replay is a deterministic transition only relative to its declared inputs, random state and arithmetic environment. If those conditions change, the strongest defensible conclusion may be tolerance-level or statistical agreement. Faster continuation is useful when it preserves the required contract, and a visible fork is necessary when it does not.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $\mathcal V_r$ | Valid reconstructible checkpoint versions for logical shard $r$ | Set |
| $\mathcal K$ | Versions satisfying schema, identity and consistency predicates | Set |
| $k^*$ | Selected globally recoverable version | Integer |
| $c,\Delta,r$ | Exposed checkpoint cost, interval and recovery duration | Seconds |
| $\nu$ | Effective event rate under the specified failure model | 1/second |
| $\Omega_i,\Omega'_j$ | Old/new owned logical tensor-coordinate sets | Sets |
| $A(t)$ | Allocated accelerator count over wall time | Count |

[MATHEMATICALLY-DERIVED] Select

$$
\mathcal E=\mathcal K\cap\bigcap_{r\in\mathcal R_{\rm required}}\mathcal V_r,\qquad
k^*=\max\mathcal E\quad\text{if }\mathcal E\ne\varnothing.
$$
*(Eq. 30.27)*

Otherwise stop or use an explicitly qualified earlier source of state. The minimum of each shard's latest version is sufficient only when every shard's valid set is downward-contiguous over the retained interval. With $\mathcal V_0=\{8,10\}$ and $\mathcal V_1=\{8,9\}$, that minimum is9 although shard0 cannot reconstruct9; the valid intersection selects8. The numbers are a counterexample, not measurements. TierCheck's minimum-version rule relies on its recoverability and coordinated-retention assumptions [R30.6, §3.3–3.4].

```figure
{
  "id": "fig-30.31",
  "kind": "diagram",
  "title": "Recovery qualifies state before resuming work",
  "caption": "A candidate version must pass identity, completeness and numerical-contract checks. Healthy committed memory admits a narrower repair path; every unqualified branch falls back to durable restoration or stops.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.31",
  "alt": "A candidate version must pass identity, completeness and numerical-contract checks. Healthy committed memory admits a narrower repair path; every unqualified branch falls back to durable restoration or stops.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "f",
        "kind": "boundary",
        "label": "Retire failed generation"
      },
      {
        "id": "m",
        "kind": "dependency",
        "label": "Read immutable manifests"
      },
      {
        "id": "e",
        "kind": "state",
        "label": "Eligible version intersection"
      },
      {
        "id": "q",
        "kind": "boundary",
        "label": "Qualified healthy memory?"
      },
      {
        "id": "p",
        "kind": "process",
        "label": "Repair references"
      },
      {
        "id": "l",
        "kind": "memory",
        "label": "Restore and reshard"
      },
      {
        "id": "v",
        "kind": "process",
        "label": "Validate full state"
      },
      {
        "id": "r",
        "kind": "flow",
        "label": "Replay canonical inputs"
      },
      {
        "id": "c",
        "kind": "state",
        "label": "Publish new generation"
      }
    ],
    "edges": [
      {
        "from": "f",
        "to": "m"
      },
      {
        "from": "m",
        "to": "e"
      },
      {
        "from": "e",
        "to": "q"
      },
      {
        "from": "q",
        "to": "p"
      },
      {
        "from": "q",
        "to": "l"
      },
      {
        "from": "p",
        "to": "v"
      },
      {
        "from": "l",
        "to": "v"
      },
      {
        "from": "v",
        "to": "r"
      },
      {
        "from": "r",
        "to": "c"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-30.32",
  "kind": "calculator",
  "title": "First-order lost-work and recovery budget",
  "caption": "The calculator evaluates the declared rare-event approximation. Event rate is an assumed scenario parameter, not a measured cluster failure rate; the optimum is unconstrained and must pass capacity and durability limits.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.28",
  "alt": "The calculator evaluates the declared rare-event approximation. Event rate is an assumed scenario parameter, not a measured cluster failure rate; the optimum is unconstrained and must pass capacity and durability limits.",
  "spec": {
    "tex": "h=c/\\Delta+\\nu(\\Delta/2+r),\\quad \\Delta^*=\\sqrt{2c/\\nu}",
    "equation": "30.28",
    "inputs": [
      {
        "symbol": "c",
        "label": "Exposed save seconds",
        "default": 10,
        "min": 1,
        "max": 120,
        "step": 1,
        "format": "fixed3"
      },
      {
        "symbol": "D",
        "label": "Save interval seconds",
        "default": 600,
        "min": 60,
        "max": 7200,
        "step": 60,
        "format": "fixed3"
      },
      {
        "symbol": "nu",
        "label": "Events per hour",
        "default": 0.1,
        "min": 0.01,
        "max": 2,
        "step": 0.01,
        "format": "fixed3"
      },
      {
        "symbol": "r",
        "label": "Recovery seconds",
        "default": 120,
        "min": 0,
        "max": 1800,
        "step": 10,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "h",
        "label": "Approximate overhead fraction",
        "formula": "c/D+(nu/3600)*(D/2+r)",
        "format": "raw",
        "emphasis": true
      },
      {
        "symbol": "opt",
        "label": "Unconstrained interval seconds",
        "formula": "sqrt(2*c/(nu/3600))",
        "format": "fixed3",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Selection reads immutable version manifests and validates all reconstructible dependencies, including compressed-delta bases and any peer-copy failure domain. Storage modification time is not a logical update counter. Choose a recovery source by the strongest available evidence: healthy committed device state, qualified local/peer state, or durable state. A fast source must satisfy the same model/optimizer/data/scheduler contract as a slower one. If the primary cause may be silent corruption, prefer a checkpoint preceding the suspect transition and independently verify it; restoring the latest checksum-valid file can faithfully restore corruption.

[DERIVED] Replay begins at a well-defined optimizer boundary. Restore optimizer moments, master weights, gradient scaler, scheduler position, RNG streams, dataset mixture/sampler state, packing leftovers and committed exposure identity. Discard uncommitted prefetch and buffered outputs. Recreate communicators and kernel/compiler state as required, then verify that all ranks refer to the current generation. If a checkpoint was captured mid-accumulation, it also needs partial gradients, the accumulation index and exactly the remaining microbatches. The default runbook rejects such a snapshot unless that extended schema was explicitly implemented and tested.

[DERIVED] Recovery correctness has several levels. **State equality** checks restored canonical tensors and counters. **Bitwise continuation** additionally checks subsequent transitions under matched execution and nondeterminism controls. **Tolerance continuation** compares specified quantities under stated absolute/relative criteria over a fixed horizon. **Statistical continuation** compares distributional outcomes under a designed repeated study. None implies the next automatically. A single matching loss scalar cannot establish equality of optimizer moments or data exposure. A changed numerical format or model topology is a fork with a new experiment identity even if a warm start is useful.

[MATHEMATICALLY-DERIVED] For a stationary rare-event model with independent failure timing, nearly periodic checkpoints and approximately uniform age at failure, a first-order fractional cost is

$$
h(\Delta)=\frac c\Delta+\nu\!\left(\frac\Delta2+r\right),\qquad
h'(\Delta)=-\frac c{\Delta^2}+\frac\nu2,qquad
\Delta^*=\sqrt{2c/\nu}.
$$
*(Eq. 30.28)*

This is a foundational cost approximation under explicit premises, not a 2026 novelty claim. It neglects multiple failures during recovery, checkpoint-boundary effects and nonstationarity; it requires small save and event overheads for the fractional interpretation. The $\Delta/2$ term follows from the uniform-age approximation, which is not exact when checkpoint capture takes significant time or failures depend on step phase. For asynchronous saving, $c$ is exposed training cost and $r$ includes the actual recovery path; pending bytes and durability delay impose additional constraints. If $\nu=0$, this unconstrained model has no finite optimum, although retention and operational requirements may still require snapshots.

[DERIVED] Measure detection, quiescence, resource replacement, communicator initialization, state transfer, resharding, compilation, warmup and replay separately. Their overlap makes the sum of component service times different from end-to-end downtime. A timeout reduction can shorten failure detection but increase false retirements. A hot spare reduces allocation delay while consuming reserved capacity. A peer-memory copy avoids storage reads only when its failure domain survives. Optimize retained work per resource cost subject to correctness and durability; optimizing one transfer timer can worsen the overall objective.

[MATHEMATICALLY-DERIVED] Repartitioning a tensor requires exact coordinate coverage and unique ownership, after accounting separately for intentionally replicated copies:

$$
\biguplus_i\Omega_i=\Omega=\biguplus_j\Omega'_j,\qquad
X'_j[u]=X_i[u]\quad\text{for the unique }i\text{ with }u\in\Omega_i,\ u\in\Omega'_j.
$$
*(Eq. 30.29)*

Apply the same coordinate map to every associated optimizer state, master-weight and scale family. An optimizer's scalar step counter and parameter-group metadata also need explicit ownership. Flattened tensors, padding, expert IDs and tied parameters require schema-aware maps, not bytewise concatenation. Conversion validates names, shapes, dtypes, coordinate coverage, alias/tie rules and state-family completeness before admitting a result. A numerically lossy conversion declares its error policy and cannot retain a bitwise claim.

[DERIVED] Elastic changes add an independent data obligation. Preserve the global logical batch through reassignment and replay, or document the changed batch and learning-rate policy. Rank-local seed streams can produce different dropout masks after a world-size change even when the model shards match. Counter-based random streams keyed to canonical sample/operation identities can support topology-independent replay only if every relevant randomized operator follows that mapping. A shuffled iterable or external service with no restorable cursor may make exact replay impossible. Refuse the exact claim and record the boundary rather than silently treating a new input sequence as the original one.

[MATHEMATICALLY-DERIVED] Resource-aware retained throughput and the cost of an incident use actual allocations:

$$
\eta_D=\frac{D_{\rm retained}}{\int_0^T A(t)\,dt},\qquad
C_{\rm incident}=\sum_j p_j H_j+C_{\rm storage}+C_{\rm transfer},
$$
*(Eq. 30.30)*

where $H_j$ is allocated device-hours in price class $j$ and $p_j$ its disclosed or assumed price. Report prices as scenario inputs, never fabricated invoices. Count idle reserved spares and failed/replayed work in allocated time. Energy and storage write amplification can be additional objectives with measured units. The metric is undefined for zero allocated time and must not mix token units from different objectives without a conversion contract.

```figure
{
  "id": "fig-30.33",
  "kind": "matrix",
  "title": "A newer local version need not be globally recoverable",
  "caption": "Rows represent two logical shards and columns versions8,9,10. Filled cells are reconstructible states: shard0 has8/10 and shard1 has8/9. Only version8 survives intersection; the matrix is a constructed counterexample.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.27",
  "alt": "Rows represent two logical shards and columns versions8,9,10. Filled cells are reconstructible states: shard0 has8/10 and shard1 has8/9. Only version8 survives intersection; the matrix is a constructed counterexample.",
  "spec": {
    "rows": 2,
    "cols": 3,
    "pattern": "explicit",
    "cells": [
      [
        1,
        0,
        1
      ],
      [
        1,
        1,
        0
      ]
    ],
    "rowLabel": "Logical shards 0 and 1",
    "colLabel": "Versions 8, 9, 10",
    "legend": "Filled = required; empty = not sufficient alone."
  }
}
```

```figure
{
  "id": "fig-30.34",
  "kind": "chart",
  "title": "Checkpoint interval trades save cost against rollback exposure",
  "caption": "Analytical scenario c=10 seconds, event rate0.1 per hour and recovery120 seconds. The curve is the declared first-order model, not a cluster reliability measurement.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.28",
  "alt": "Analytical scenario c=10 seconds, event rate0.1 per hour and recovery120 seconds. The curve is the declared first-order model, not a cluster reliability measurement.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Checkpoint interval seconds",
      "domain": [
        60,
        3600
      ]
    },
    "y": {
      "label": "Approximate overhead fraction"
    },
    "variables": {
      "c": 10,
      "nu": 0.00002777777777777778,
      "r": 120
    },
    "series": [
      {
        "id": "total",
        "label": "Combined approximation",
        "formula": "c/x+nu*(x/2+r)",
        "sample": {
          "from": 60,
          "to": 3600,
          "count": 121
        },
        "emphasis": true,
        "dashed": false
      },
      {
        "id": "save",
        "label": "Save contribution",
        "formula": "c/x",
        "sample": {
          "from": 60,
          "to": 3600,
          "count": 121
        },
        "emphasis": false,
        "dashed": true
      },
      {
        "id": "rollback",
        "label": "Rollback and recovery contribution",
        "formula": "nu*(x/2+r)",
        "sample": {
          "from": 60,
          "to": 3600,
          "count": 121
        },
        "emphasis": false,
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 848.5281374238571,
        "y": 0.026903559372884918,
        "label": "Stationary point of the first-order approximation"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 30.6 — Qualified restore, replay and incident closure

[DERIVED] Inputs are manifests, required logical shard families, an uninterrupted reference contract, qualified repair predicates and finite phase deadlines. Outputs are a new committed generation or a stopped incident. State records candidate version, generation, recovery mode, equivalence level and rejected predicates.

$$
\begin{aligned}
1.&\quad \operatorname{retire}(e);\quad\operatorname{fence\_writers}(e);\quad I\leftarrow\operatorname{capture\_incident}().\\
2.&\quad \mathcal E\leftarrow\operatorname{validate\_intersection}(\{\mathcal V_r\},\mathcal K);\quad \mathcal E=\varnothing\Longrightarrow\operatorname{stop}(I).\\
3.&\quad k^*\leftarrow\max\mathcal E;\quad e'\leftarrow\operatorname{reserve\_generation}(e+1).\\
4.&\quad q\leftarrow\operatorname{committed\_quiescent\_healthy\_state}()\land\operatorname{supported\_repair\_adapter}().\\
5.&\quad q\Longrightarrow S\leftarrow\operatorname{repair\_bounded}();\quad\neg q\ \lor\ \operatorname{repair\_failed}\Longrightarrow S\leftarrow\operatorname{restore}(k^*).\\
6.&\quad S'\leftarrow\operatorname{validate\_reshard}(S,\Omega');\quad\neg\operatorname{full\_contract}(S')\Longrightarrow\operatorname{stop}(I).\\
7.&\quad \operatorname{replay}(S',\text{canonical exposures});\quad\neg\operatorname{equivalence\_gate}()\Longrightarrow\operatorname{quarantine}(I),\operatorname{stop}().\\
8.&\quad\operatorname{publish}(e',k,\text{equivalence level});\quad\operatorname{close}(I,\text{costs, evidence, unresolved causes}).
\end{aligned}
$$
*(Eq. 30.31)*

[DERIVED] Every phase has a deadline and a failure branch. The commit invariant is exactly one admitted generation; the replay invariant is exactly the declared logical exposure sequence. Validation costs at least reading the reconstructed state or its explicitly justified integrity evidence. Selecting versions over sorted metadata costs depend on the number of retained manifests; tensor movement costs total transferred bytes divided by effective path service, plus synchronization and validation. If health cannot be established after a communicator failure, attempting more handle replacements does not strengthen the premise.

```figure
{
  "id": "fig-30.35",
  "kind": "compare",
  "title": "Recovery branches preserve different prerequisites",
  "caption": "The branches are selected by available healthy state and qualified failure semantics. This comparison gives logical prerequisites and resource obligations, not universal recovery-time rankings.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.31",
  "alt": "The branches are selected by available healthy state and qualified failure semantics. This comparison gives logical prerequisites and resource obligations, not universal recovery-time rankings.",
  "spec": {
    "axis": "Recovery branch",
    "columns": [
      {
        "id": "disk",
        "label": "Durable rollback"
      },
      {
        "id": "host",
        "label": "Host or peer restore"
      },
      {
        "id": "repair",
        "label": "In-memory repair"
      }
    ],
    "rows": [
      {
        "dimension": "Surviving state",
        "values": {
          "disk": "Complete durable version",
          "host": "Complete surviving memory copies",
          "repair": "Committed healthy device state"
        }
      },
      {
        "dimension": "Eligible failure",
        "values": {
          "disk": "Within durability contract",
          "host": "Outside surviving copy domains",
          "repair": "Qualified transient communication failure"
        }
      },
      {
        "dimension": "Main work",
        "values": {
          "disk": "Load, rebuild and replay",
          "host": "Transfer, rebuild and replay",
          "repair": "Rebind all framework references"
        }
      },
      {
        "dimension": "Fallback",
        "values": {
          "disk": "Stop if no qualified state",
          "host": "Durable rollback",
          "repair": "Durable rollback or stop"
        }
      }
    ]
  }
}
```

## Implementation

[PAPER-REPORTED] AccelPact's adapter targets cached FSDP communication references and coordinates repair out of band; its evaluated path excludes damaged or lost device state and lists FSDP2/DTensor adaptation as future work [R30.13, §III, VI]. [DERIVED] A new adapter must audit every wrapper, parameter handle and cached reference, retire old communicator use, and verify agreement before continuation. A successful native communicator creation does not prove framework references were replaced. Reusing CUDA graphs or compiled closures requires a separate compatibility test.

[OFFICIAL-DOCUMENTATION] TorchTitan's versioned checkpoint guide distinguishes model-only exports and excluded state from full continuation; MaxText0.2.5 records an Orbax checkpoint migration [R30.14, model-only and exclude_from_loading; R30.12, Checkpointing]. [DERIVED] Read the source schema before mapping it to another parallel layout. API-level resharding support does not guarantee that application-specific data cursors or RNG streams are included. Deployment retains a verified fallback and old readable format until conversion and replay tests pass.

## Experimental design

### Reported experiments

[PAPER-REPORTED] These are actual inspected source protocols [R30.7, §VII; R30.13, §IV].

| Field | DeadPool | AccelPact |
|---|---|---|
| Model/workload |0.6B–65B transformer training; Megatron3D/ZeRO-2 |Full-parameter Mistral7B; 4-shard/4-replica main case |
| Hardware/precision |8–512 GPUs; Perlmutter A100; FP32; Vista hardware assertion quarantined |16 RTX5880 Ada48 GiB; 4 nodes;1Gb Ethernet; PyTorch2.5.1/CUDA12.1/NCCL2.21.5 |
| Baselines/budget |Periodic checkpoint/restart and memory-copy variants; excludes10 warmup and slowest5% for overhead |Cold restart/NVRx; checkpoint-age and4–16 GPU studies;10 successive injections |
| Uncertainty |Repeated-run confidence intervals not disclosed |Full multi-seed uncertainty for whole-run gains not disclosed |
| Ablations |Backup and hot-swap components |Rebinding paths, topology, checkpoint age; separate PyTorch2.11 microstudy |

## Observations

**What the paper claims.** [PAPER-REPORTED] DeadPool reports low hot-swap recovery latency and a conditional “zero-overhead” steady-state result; its8-node timing row is1.15% slower. AccelPact reports bit-identical parameter state across ten injections under its qualified path [R30.7, §VII; R30.13, §IV-G].

**What the evidence shows.** [DERIVED] Tail-trimmed FP32 measurements do not establish zero resource cost or BF16 correctness. AccelPact's result concerns transient repair with surviving healthy state, not device-loss recovery; its slow Ethernet testbed cannot establish identical savings on faster fabrics. The source's parameter comparison is not this edition's independently executed full-state/data/scheduler audit.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq.30.27 requires common reconstructibility, Eq.30.29 requires exact coordinate coverage, and Eq.30.30 charges reserved and replayed resources. A repair path can reduce downtime while still requiring durable fallback.

**What remains unknown.** [UNVERIFIED] Independent recovery correctness, real event distributions, cross-framework conversion, elastic stochastic equivalence and deployment costs remain unmeasured here. The quarantined Vista device description is not silently corrected to a guessed platform.

## Failure modes

> **Failure mode — Successful load, altered experiment.** [DERIVED] *Symptom:* parameters match but resumed updates diverge. *Cause:* optimizer, RNG, data or schedule omitted. *Detection:* full-state and canonical-exposure comparison before and after replay. *Mitigation:* restore the complete schema or explicitly fork the experiment.

> **Failure mode — Repair outside its precondition.** [DERIVED] *Symptom:* replaced communicator followed by inconsistent parameters or another hang. *Cause:* partially applied optimizer update, poisoned context or stale framework handle. *Detection:* committed-frontier, health and reference audit. *Mitigation:* durable rollback or stop.

[DERIVED] Incident analysis distinguishes initiating fault, propagation, detection, containment, recovery and residual uncertainty. Preserve evidence before restarting removes it. Compare predicted and measured phase costs, identify the earliest violated invariant, and assign a falsifiable follow-up test. A post-restart throughput improvement is consistent with a repair but does not by itself prove which co-occurring change caused it.

```figure
{
  "id": "fig-30.36",
  "kind": "stat-panel",
  "title": "Recovery closure is more than a resumed process",
  "caption": "These fields define the output of a qualified incident protocol. They are not results from executed fault injection.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.31",
  "alt": "These fields define the output of a qualified incident protocol. They are not results from executed fault injection.",
  "spec": {
    "header": "Recovery closure is more than a resumed process",
    "rows": [
      {
        "key": "Selected state",
        "value": "Version and reconstructibility proof"
      },
      {
        "key": "Equivalence",
        "value": "Bitwise, tolerance or statistical"
      },
      {
        "key": "Exposure",
        "value": "Committed and replayed input IDs"
      },
      {
        "key": "Resource cost",
        "value": "Allocated device-time and transfer"
      },
      {
        "key": "Unknowns",
        "value": "Unresolved cause and follow-up"
      }
    ]
  },
  "anchor": "failure-modes"
}
```

## Siblings

[DERIVED] Cold durable restoration has a broader survivability envelope but pays read/rebuild/replay cost. Host/peer state can reduce storage traffic while exposing correlated memory-loss domains. In-memory repair avoids loading only when state and context survive a qualified failure. Elastic continuation changes placement or membership and therefore adds coordinate, data and random-stream obligations. Select the branch by survivability and equivalence requirements before comparing latency.

## Extensions

### Improvements

[PAPER-REPORTED] FT-HSDP uses explicit cohort and catch-up semantics rather than treating arbitrary membership changes as ordinary synchronous updates [R30.1, §4]. [DERIVED] Extending any recovery branch to expert, pipeline or context parallelism requires an audit of their state owners, routing identities and in-flight work. A successful data-parallel test is evidence for that topology, not a proof for every mesh.

## Limitations

[DERIVED] Exact recovery is impossible when necessary state or canonical input identity was never captured. Bitwise continuation may be unavailable after altered reduction order or nondeterministic kernels. The cost approximation is invalid under large/correlated/nonstationary event rates without a richer model. Reject those claims while retaining the useful, explicitly weaker continuation contract.

## Reproducibility

[DERIVED] Archive manifests, schema converters, qualified failure class, topology, numerical policy, state comparisons, replay IDs, tolerance definitions, deadlines and phase costs. Keep healthy controls, failed attempts and full tails. Record each source's pinned version and unavailable artifacts. [UNVERIFIED] All book-authored fault injections and cost comparisons remain proposed, not executed.

## References

[R30.1] cohort semantics; [R30.6] recoverability/retention assumptions; [R30.7] DeadPool; [R30.12] MaxText release; [R30.13] AccelPact; [R30.14] TorchTitan checkpoint guide. Full records appear in [references](references.md).
