---
id: "ms.section.36.3"
entity_type: "section"
title: "Environment infrastructure"
short_title: "Environment infrastructure"
volume: 2
part: 6
chapter: 36
section: 36.3
slug: "36-3-environment-infrastructure"
parent: "ms.chapter.36"
prev_sibling: "ms.section.36.2"
next_sibling: "ms.section.36.4"
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

# 36.3 — Environment infrastructure

## Scope

[DERIVED] Construct the environment side of agent RL: execution isolation, reset semantics, tool schemas, simulator revisions, nested quotas and private reward evaluation. The baseline provisions a writable container per episode and trusts its output. Success requires an auditable lifecycle in which resource admission precedes effects, reset scope is explicit, and checker state is isolated from the agent. DSec supplies eligible 2026 infrastructure evidence; this section does not equate its production deployment statistics with a controlled learning experiment.

## Why this exists

[DERIVED] Rollout capacity is not just inference capacity. Thousands of waiting shells retain memory, workspaces require different dependencies, and tests can burst when generation completes. Pulling a multi-gigabyte image for a tiny working set wastes I/O. Sharing too aggressively permits episode contamination. Reserving requested CPU as if every sandbox were continuously busy wastes capacity, while unrestricted overcommit creates tail latency and invalid outcomes.

[DERIVED] The dominant constraint is a coupled admission problem across CPU, RAM, writable storage, network and lifetime. A scheduler's recent load estimate can be stale before the selected node receives a request. A reusable function worker can be efficient without proving clean state. The solution combines immutable environment composition with final node admission, bounded execution and independently protected verification, rather than treating a sandbox name as evidence of all three.

## Intuition

[MATHEMATICALLY-DERIVED] An immutable base can be shared; a mutable episode delta cannot be shared without changing the episode. Lazy distribution transfers bytes when accessed rather than when named. Overcommit exploits demand below requested capacity, but its feasibility depends on simultaneous demand and QoS, not just average utilization. Isolation, deterministic reset and efficient caching constrain different resources and must be evaluated separately.

## Formulation

| Object | Contract | Unit |
|---|---|---|
| $d_e=(c_e,m_e,w_e,n_e)$ | Requested CPU, memory, writable bytes, network quota | Cores; bytes; bytes; bytes |
| $C_k$ | Admissible capacity vector on node $k$ | Same component units |
| $B,W,T,U_e$ | Base, workspace, toolkit and private writable upper layer | Content digests |
| $\xi$ | Simulator, tool schema, dependency and checker revision | Immutable manifest |
| $\mathcal P$ | Observable reset projection | Defined fields |

$$
\sum_{e\in\mathcal L_k}d_{e,r}\le C_{k,r}\quad\text{for each hard-reserved resource }r,\qquad
\sum_{e\in\operatorname{children}(p)}q_{e,r}\le q_{p,r}.
$$
*(Eq. 36.15)*

[MATHEMATICALLY-DERIVED] Hard reservations bound admitted requests, not instantaneous physical demand under CPU overcommit. A statistical demand policy must separately bound overload probability or enforce preemption/QoS. Nested quotas prevent children collectively escaping a parent's budget only when updates are atomic at the enforcement boundary. Checking each child against the full parent quota is insufficient.

$$
\mathcal P(\operatorname{reset}_\xi(x,s))=\mathcal P(\operatorname{reset}_\xi(x,s'))\quad\text{for all admitted prior states }s,s'.
$$
*(Eq. 36.16)*

[MATHEMATICALLY-DERIVED] Reset determinism is a property of specified fields and versions. Equality of a file hash does not establish equality of process state, remote services, wall clock or randomness. For stochastic simulators, the corresponding contract fixes seed streams and transition revision while retaining intended randomness. A live-service episode must declare which external variables cannot be reset.

```figure
{
  "id": "fig-36.13",
  "kind": "diagram",
  "title": "Environment admission is an execution protocol",
  "caption": "A placement suggestion is followed by node admission. Private writable state and checker credentials remain separate from immutable shared layers.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.15",
  "alt": "A placement suggestion is followed by node admission. Private writable state and checker credentials remain separate from immutable shared layers.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "req",
        "kind": "dataset",
        "label": "Task and environment manifest"
      },
      {
        "id": "quota",
        "kind": "process",
        "label": "Parent and node quota reservation"
      },
      {
        "id": "layers",
        "kind": "tensor",
        "label": "Immutable base/workspace/toolkits"
      },
      {
        "id": "run",
        "kind": "state",
        "label": "Private writable sandbox"
      },
      {
        "id": "tool",
        "kind": "process",
        "label": "Typed command gateway"
      },
      {
        "id": "judge",
        "kind": "objective",
        "label": "Private verification service"
      },
      {
        "id": "ledger",
        "kind": "dataset",
        "label": "Result and cleanup ledger"
      }
    ],
    "edges": [
      {
        "from": "req",
        "to": "quota"
      },
      {
        "from": "quota",
        "to": "run"
      },
      {
        "from": "layers",
        "to": "run"
      },
      {
        "from": "tool",
        "to": "run"
      },
      {
        "from": "run",
        "to": "judge"
      },
      {
        "from": "judge",
        "to": "ledger"
      },
      {
        "from": "run",
        "to": "ledger"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[DERIVED] Choose a backend by required state and isolation boundary. A stateless function worker can reuse a prepared runtime if every request's inputs, outputs and residual state are controlled. A container offers process/filesystem namespaces while sharing its enclosing kernel. A microVM has a separate guest kernel, with additional boot, memory and device costs. A full VM can support broader OS/GUI requirements but expands the device and image surface. No backend name establishes that a reward checker is inaccessible.

[PAPER-REPORTED] DSec places its FnCall/container backends inside QEMU/libvirt VMs; its microVM backend uses Firecracker. It composes independently versioned layers and employs node-side admission after placement [R36.3, §§3,5]. [DERIVED] Thus generic statements about containers sharing a bare-metal host kernel would misdescribe this reported deployment. FnCall best-effort cleanup remains weaker evidence than a demonstrated cross-request noninterference property.

[DERIVED] Tool schemas are executable interfaces: typed arguments, length/range limits, path roots, effect class, timeout, output quota and version. Validate before executing. Shell syntax is itself an expressive language; passing a schema-valid string to a shell does not make its effects constrained. A simulator should expose versioned transitions and reset fields, and the reward service should consume an immutable result artifact rather than a mutable workspace that the agent can change during judging.

[MATHEMATICALLY-DERIVED] For $N$ workspaces combined with $M$ bases and $K$ toolkits, rebuilding every workspace combination after $m$ base or $k$ toolkit changes can require $O(mN)$ or $O(kN)$ work. Independent immutable composition changes the artifact rebuild boundary:

$$
\operatorname{env}_e=\operatorname{overlay}(B,W,T_1,\ldots,T_j;U_e),\qquad
\text{rebuild cost}:\ O(mN+kN)\longrightarrow O(m+k).
$$
*(Eq. 36.17)*

[DERIVED] This counts artifact construction, not every subsequent mount, validation or compatibility check. Priority order resolves path collisions and is part of the digest. A shared read-only layer can be safely cached only when runtime writes go to the private upper layer. A toolkit that writes into its installation directory must still work under those semantics. Dependency incompatibility does not disappear because layers are independently addressable.

[MATHEMATICALLY-DERIVED] If an image has size $I$, accessed fraction $f$ and metadata/transport overhead $M_I$, the first-order lazy-transfer boundary is

$$
B_{\rm eager}=I,\qquad B_{\rm lazy}\approx fI+M_I,\qquad
\text{avoided bytes}\approx(1-f)I-M_I.
$$
*(Eq. 36.18)*

[DERIVED] This is an analytical model, not a latency prediction. Random access, cache misses, decompression, metadata faults and storage congestion can dominate. A fully cached eager baseline may transfer nothing during the measured interval because it paid earlier. Compare cold and warm boundaries explicitly. Cache population and retained storage remain costs even when removed from task latency.

```figure
{
  "id": "fig-36.14",
  "kind": "calculator",
  "title": "Image working-set transfer boundary",
  "caption": "Analytical byte accounting, excluding cache reuse and storage contention. The accessed fraction is adjustable rather than invented workload measurement.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.18",
  "alt": "Analytical byte accounting, excluding cache reuse and storage contention. The accessed fraction is adjustable rather than invented workload measurement.",
  "spec": {
    "tex": "B_{\\rm lazy}=fI+M_I",
    "equation": "36.18",
    "inputs": [
      {
        "symbol": "I",
        "label": "Image size GiB",
        "default": 8,
        "min": 1,
        "max": 32,
        "step": 1,
        "format": "integer"
      },
      {
        "symbol": "f",
        "label": "Accessed image fraction",
        "default": 0.1,
        "min": 0.05,
        "max": 1,
        "step": 0.05,
        "format": "raw"
      },
      {
        "symbol": "m",
        "label": "Metadata/transfer overhead GiB",
        "default": 0.1,
        "min": 0,
        "max": 1,
        "step": 0.1,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "l",
        "label": "Lazy transfer GiB",
        "formula": "f*I+m",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "a",
        "label": "Avoided transfer GiB",
        "formula": "(1-f)*I-m",
        "format": "fixed3",
        "emphasis": false
      },
      {
        "symbol": "r",
        "label": "Lazy/eager ratio",
        "formula": "(f*I+m)/I",
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
        "f": 0.05
      },
      "note": "A small accessed working set can reduce transferred bytes."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "f": 0.1
      },
      "note": "Account for metadata overhead as well as accessed image bytes."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "f": 1
      },
      "note": "At full access, lazy transfer plus overhead exceeds eager image bytes."
    }
  ]
}
```

```figure
{
  "id": "fig-36.15",
  "kind": "compare",
  "title": "Backend choice declares an isolation boundary",
  "caption": "The table is a technical comparison, not a universal security ranking. The enclosing VM for DSec containers is part of the actual source architecture.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.16",
  "alt": "The table is a technical comparison, not a universal security ranking. The enclosing VM for DSec containers is part of the actual source architecture.",
  "spec": {
    "axis": "Execution and isolation boundary",
    "columns": [
      {
        "id": "f",
        "label": "Stateless function"
      },
      {
        "id": "c",
        "label": "Container in VM"
      },
      {
        "id": "v",
        "label": "MicroVM"
      }
    ],
    "rows": [
      {
        "dimension": "Persistent state",
        "values": {
          "f": "Explicitly excluded or scrubbed",
          "c": "Private writable filesystem/processes",
          "v": "Guest execution and disk state"
        }
      },
      {
        "dimension": "Kernel boundary",
        "values": {
          "f": "Runtime and enclosing sandbox",
          "c": "Shared VM kernel",
          "v": "Separate guest kernel"
        }
      },
      {
        "dimension": "Reset evidence",
        "values": {
          "f": "Request noninterference",
          "c": "Upper layer/process reset",
          "v": "Snapshot/image/seed contract"
        }
      },
      {
        "dimension": "Cost boundary",
        "values": {
          "f": "Warm worker plus cleanup",
          "c": "VM plus container residency",
          "v": "Guest memory/devices and restore"
        }
      }
    ]
  }
}
```

[DERIVED] Memory optimization requires distinguishing guest allocation, host residency and file cache duplication. Mapping shared read-only file pages directly can remove duplicate guest caches, while guest free-page reporting can return cold memory to the host. These mechanisms have different CPU costs and do not make mutable working sets shareable. Requested memory is an admission quantity; resident memory is a measured demand quantity.

$$
M_{\rm resident}=M_{\rm shared}+\sum_e(M_{{\rm private},e}+M_{{\rm metadata},e}),\qquad
M_{\rm pmem\ metadata}=I_{\rm mapped}/64
$$
*(Eq. 36.19)*

[PAPER-REPORTED] The second expression uses DSec's disclosed 4KiB pages and 64-byte per-page metadata example [R36.3, §5.2]. [DERIVED] It is a configuration-specific lower accounting term, not a complete VM-memory formula. Reducing page duplication can increase cold-fault CPU work; QoS must protect latency-sensitive work from best-effort interference, including SMT siblings.

```figure
{
  "id": "fig-36.16",
  "kind": "chart",
  "title": "Lazy transfer depends on actual access",
  "caption": "Analytical image-byte model with image size8GiB and metadata overhead.1GiB. The x-axis is an access percentage, not an observed workload distribution.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.18",
  "alt": "Analytical image-byte model with image size8GiB and metadata overhead.1GiB. The x-axis is an access percentage, not an observed workload distribution.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Accessed image percentage",
      "domain": [
        0,
        100
      ]
    },
    "y": {
      "label": "Transferred GiB"
    },
    "variables": {},
    "series": [
      {
        "id": "e",
        "label": "Eager transfer",
        "formula": "8",
        "sample": {
          "from": 0,
          "to": 100,
          "count": 101
        },
        "emphasis": true,
        "dashed": false
      },
      {
        "id": "l",
        "label": "Lazy transfer",
        "formula": "8*x/100+0.1",
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
        "x": 98.75,
        "y": 8,
        "label": "Break-even after metadata:98.75% access"
      }
    ]
  }
}
```

## Algorithm

[DERIVED] **Algorithm 36.3 — Reserved environment lease.** Inputs: immutable task/environment/checker manifest, finite positive integer placement-attempt cap $A$, finite positive reset/execution/cleanup deadlines, typed request and finite nonnegative resource quotas. Output: sealed result/effect status and cost ledger. Initialize attempt $a=0$, ledger $\mathcal E=\varnothing$ and lease $\ell=\varnothing$.

$$
\begin{aligned}
1.&\quad\text{invalid schema/digest/quota}\Rightarrow\operatorname{record}(\mathcal E,\text{rejection});\operatorname{return}(\mathcal E,\text{rejected}).\\
2.&\quad\text{while }a<A\text{ and }\ell=\varnothing:\ a\leftarrow a+1;\ k\leftarrow\operatorname{place};\ \ell\leftarrow\operatorname{reserve}_{D}(k,\text{nested quotas});\operatorname{record}(\mathcal E,a,k,\ell).\\
3.&\quad\ell=\varnothing\Rightarrow\operatorname{return}(\mathcal E,\text{capacity failure});\quad\operatorname{reserve}(\ell,\text{result bytes and checker slot});\quad\text{failure}\Rightarrow\operatorname{release}(\ell);\operatorname{return}(\mathcal E,\text{quota}).\\
4.&\quad s\leftarrow\operatorname{compose\_reset}_{D}(\ell,B,W,T,U_e,\xi);\operatorname{record}(\mathcal E,s,\text{reset cost});\quad\neg\operatorname{valid}(s)\Rightarrow\operatorname{quarantine}(\ell);\operatorname{return}(\mathcal E,\text{reset failure}).\\
5.&\quad\operatorname{record}(\mathcal E,\text{effect start});\ q\leftarrow\operatorname{execute}_{D}(s,u);\operatorname{record}(\mathcal E,q,\text{execution cost});\quad\text{effect unknown or execution still running}\Rightarrow\operatorname{quarantine}(\ell);\operatorname{return}(\mathcal E,\text{ambiguous}).\\
6.&\quad f\leftarrow\operatorname{seal\_result}(q);\ y\leftarrow\operatorname{judge}_{D}(f,\xi_{\rm checker});\operatorname{record}(\mathcal E,y,\text{checker cost});\quad\text{checker invalid}\Rightarrow y\leftarrow\text{unscored}.\\
7.&\quad c\leftarrow\operatorname{cleanup}_{D}(\ell);\operatorname{record}(\mathcal E,c);\quad\neg\operatorname{clean}(c)\Rightarrow\operatorname{quarantine}(\ell);\operatorname{return}(\mathcal E,y);\\
8.&\quad\operatorname{release}(\ell);\operatorname{return}(\mathcal E,y).
\end{aligned}
$$
*(Eq. 36.20)*

[DERIVED] Quarantine transfers ownership to a bounded reconciliation pool rather than freeing ambiguous state for reuse. If that pool is full, new admission stops. Each placement attempt is bounded and recorded; retries are only placement/reset operations before unknown effects. Checker resources are reserved before commands, preventing successful execution from producing unbounded unjudgeable results. Timeout is a typed outcome, never an implicit success.

## Implementation

[DERIVED] **verl — RL post-training layer** and plan-anchored **AReaL** call environments through rollout logic; they do not replace isolation/runtime configuration. DSec is a DeepSeek technical-report architecture reached through the exact lab route, not a public stack package whose full implementation was verified. Represent leases, quota counters, immutable image layers, private upper layers, schema registries, result storage and checker credentials as distinct components.

[DERIVED] Place privileged reward evaluation outside the agent's credentials, filesystem namespace and writable result surface. Strip packaged answers and training scaffolding before publishing a workspace. Restrict network destinations and local control sockets; otherwise the agent may query platform services instead of solving the task. Clean logs and artifact access also matter because metadata can reveal hidden labels. Isolation protects an evaluation boundary; it does not prove a verifier's semantic soundness.

```figure
{
  "id": "fig-36.17",
  "kind": "matrix",
  "title": "Reset and isolation are separate obligations",
  "caption": "Rows: files, processes, randomness, external services. Columns: local reset, private execution, reproducible transition. External-service reproducibility needs an additional declared service-state contract.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.16",
  "alt": "Rows: files, processes, randomness, external services. Columns: local reset, private execution, reproducible transition. External-service reproducibility needs an additional declared service-state contract.",
  "spec": {
    "rows": 4,
    "cols": 3,
    "pattern": "explicit",
    "cells": [
      [
        1,
        1,
        1
      ],
      [
        1,
        1,
        1
      ],
      [
        1,
        0,
        1
      ],
      [
        0,
        0,
        0
      ]
    ],
    "rowLabel": "Files / processes / RNG / external",
    "colLabel": "Reset / isolation / transition parity",
    "legend": "Filled = required; empty = not sufficient alone."
  }
}
```

## Experimental design

### Reported experiments

| DSec protocol [R36.3, §8] | Actual experimental boundary |
|---|---|
| Cluster | Dedicated10CPU nodes, separate from production; microVM bare metal2×96-coreEPYC9655/1.5TBRAM; containers in QEMU1×96-core/512GB; hostLinux7.0/guest6.1 |
| Workloads and controls | Internal SWE/SWE-bench/Terminal-Bench/security tasks;8192-container image burst; cold/cached Docker versus on-demand; deterministic prerecorded tool calls for tar/EROFS composition |
| Ablations | Baseline/DAX/FPR/combined memory; scheduler/no scheduler/core scheduling; chess LS workload with10–50%BE load |
| Uncertainty and exclusions | Seeds/repeated-run intervals and model precision not supplied; inference replaced in composition test; RL-framework integration explicitly outside evaluation |

## Observations

**What the paper claims.** [PAPER-REPORTED] DSec reports image tasks≈35minutes versus>60cold eager; composition45versus79minutes; DAX peak-memory−40.2% with transient CPU26.5→41.4%; FPR integrated-memory−21.2%. At50%BE load, LS latency inflation remains17.3% with core scheduling versus45.2% unprotected [R36.3, §§8.2–8.5].

**What the evidence shows.** [DERIVED] Mechanism tests support configuration-specific infrastructure improvements and an explicit CPU/memory tradeoff. They do not measure learning quality, eliminate all latency inflation or establish a universal sandbox limit.

**What we infer.** [DERIVED] Environment provisioning can dominate rollout progress independently of model throughput; averaging CPU demand is insufficient for safe overcommit.

**What remains unknown.** [NOT-DISCLOSED] Independent uncertainty, full internal workload artifacts, end-to-end RL quality impact and production energy/currency costs are not available.

## Failure modes

[DERIVED] Stale placement estimates cause last-hop admission rejection. Mount-order collisions silently replace tools. Reused workers retain credentials or files. A checker reads a mutable path while the agent races to change it. Best-effort work on an SMT sibling delays a latency-sensitive turn. Cold lazy faults synchronize many workers on a storage bottleneck. Observable symptoms belong to separate counters rather than a generic environment-failure rate.

```figure
{
  "id": "fig-36.18",
  "kind": "systems-trace",
  "title": "Environment release has typed effect boundaries",
  "caption": "Eq.36.20 protocol trace: reset identity, nested quotas, effect knowledge and finalization are separate gates. A lost acknowledgment after a possible effect enters quarantine rather than an automatic retry loop. This is a derived control protocol, not a backend performance report.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.20",
  "alt": "Five protocol stages preserve environment revision, parent and child limits, immutable attempt identity, effect knowledge and released state. Ambiguous effects terminate in quarantine; known terminal outcomes can release or reset under the declared contract.",
  "spec": {
    "columns": [
      "memory",
      "communication",
      "failure"
    ],
    "stages": [
      {
        "name": "Reset and validate",
        "values": {
          "failure": "Reject inconsistent reset",
          "memory": "Snapshot and environment revision fixed",
          "communication": "No new agent effect"
        }
      },
      {
        "name": "Admit bounded attempt",
        "values": {
          "failure": "Deny before dispatch",
          "memory": "Parent/child quotas both reserved",
          "communication": "Immutable attempt ID installed"
        }
      },
      {
        "name": "Dispatch and observe",
        "values": {
          "failure": "Unknown effect → quarantine",
          "memory": "Authorized tool schema only",
          "communication": "Known absent, known committed, or unknown"
        }
      },
      {
        "name": "Finalize terminal event",
        "values": {
          "failure": "Error/censor remains charged",
          "memory": "Retain status, resources and lineage",
          "communication": "Never infer success from readable text"
        }
      },
      {
        "name": "Release or quarantine",
        "values": {
          "failure": "Unresolved state remains isolated",
          "memory": "Release only validated reusable state",
          "communication": "No retry on ambiguous non-idempotent effect"
        }
      }
    ]
  },
  "anchor": "failure-modes"
}
```

## Siblings

[DERIVED] Eager pulling exchanges higher startup traffic for fewer cold faults during execution. Lazy access reduces unused bytes but depends on remote availability. Container density and microVM isolation cannot be compared using unlike hardware as if the backend alone caused every difference. A deterministic simulator and a live tool environment support different repeatability claims. Retain the source's backend, hardware and workload boundaries when choosing an alternative.

## Extensions

[PAPER-REPORTED] DSec documents independent layer composition, memory reclamation and QoS-aware scheduling as complementary mechanisms [R36.3, §5]. [DERIVED] Combining them requires testing cold-start, steady-state and failure conditions together: the best memory configuration may increase cold-fault CPU, and higher sandbox density may saturate storage or checker pools first. Partial rollout and suspension are treated in §36.6 because they also change policy lag.

## Limitations

[DERIVED] Local isolation cannot rewind external transactions. Deterministic replay of tool calls measures infrastructure under a fixed workload but removes adaptive agent behavior. Capacity reservation does not guarantee a task's deadline when service times are heavy-tailed. DSec production concurrency claims belong to their reported scale unit; this section does not substitute them for the ten-node experimental setup or infer hard capacity limits from demonstrated operating points.

## Reproducibility

[DERIVED] Pin backend/kernel, base/workspace/toolkit digests and mount order, writable-layer reset, schema/parser, clocks/RNG, network policy, quotas, placement/admission logs, checker revision and immutable input results. Record cold versus warm caches and exact memory metric. Proposed cross-episode contamination and quota-fault tests live in [verification.md](verification.md).

## References

[R36.3](references.md) §§3–8; [R36.6](references.md) agent-loop integration; [R36.7](references.md) plan-anchored environment integration route.
