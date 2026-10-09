---
id: "ms.section.30.3"
entity_type: "section"
title: "Checkpoint design"
short_title: "Checkpoint design"
volume: 2
part: 5
chapter: 30
section: 30.3
slug: "30-3-checkpoint-design"
parent: "ms.chapter.30"
prev_sibling: "ms.section.30.2"
next_sibling: "ms.section.30.4"
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

# 30.3 — Checkpoint design

## Scope

[DERIVED] Define a recoverable checkpoint as one consistent logical training state, including distributed tensor shards and non-tensor progress, and specify publication, integrity, conversion and retention rules. The baseline is a complete post-update snapshot with synchronous publication. Faster staging and tiered storage must retain an explicit recoverability boundary. Activation checkpointing has a different purpose and is owned by [§30.2](30-2-memory-management.md).

## Why this exists

[OFFICIAL-DOCUMENTATION] TorchTitan v0.3.0 distinguishes model-only export from training checkpoints; its checkpoint manager registers model, optimizer, dataloader and learning-rate scheduler state [R30.14, model-only export; R30.15, constructor]. A model file can therefore be a valid inference artifact without being a sufficient training restart artifact. Reading it successfully does not restore omitted state.

[DERIVED] Distributed writes introduce two independent questions: which training version the bytes represent, and whether all required bytes are durably available. A rank can finish writing a newer shard while another rank still exposes an older one. Asynchronous serialization can read a parameter while its optimizer mutates it. A completion marker can survive while a tensor file is truncated. The design must prevent mixed-version state and detect unavailable or inconsistent content separately.

## Intuition

[MATHEMATICALLY-DERIVED] A checkpoint is a cut through a state-transition graph. Every object on the cut must correspond to the same completed update, or carry enough causal metadata to reconstruct that update. Publication is a transaction over those objects. A staging copy creates an immutable version before the live state changes; durable commit establishes a recoverable copy outside the covered failure domain. Neither a background thread nor a directory name creates either property automatically.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $\mathcal Q_k$ | Complete logical state after update $k$ | Structured object |
| $\theta_k,o_k$ | Parameters and optimizer state | Tensors |
| $\rho_k,d_k,\eta_k$ | RNG, data and scheduler states | Structured objects |
| $\mathcal F_k$ | Files/shards required by checkpoint $k$ | Set |
| $v_f,h_f$ | Logical version and content digest of file $f$ | Integer/digest |
| $s_c,\Delta_c$ | Snapshot bytes and generation interval | Bytes/seconds |

[MATHEMATICALLY-DERIVED] The recovery object is

$$
\mathcal Q_k=(\theta_k,o_k,\rho_k,d_k,\eta_k,k,\iota,e,\text{schema, tensor map, numerical policy}).
$$
*(Eq. 30.11)*

If saving mid-accumulation, include partial gradients, accumulation count and pending data obligations. At a post-update boundary with zeroed gradients, those objects may be absent by contract. RNG state includes every stream that affects continuation; a single global seed does not encode its consumed position. Data state must identify the canonical next sample/token, packing leftovers, shuffle state and prefetch policy rather than only a batch counter.

[MATHEMATICALLY-DERIVED] Define content-complete eligibility as

$$
E(k)=\operatorname{committed}(k)\land\bigwedge_{f\in\mathcal F_k}\left[v_f=k\land\operatorname{available}(f)\land h(\operatorname{bytes}(f))=h_f\right]\land\operatorname{schema\_compatible}(k).
$$
*(Eq. 30.12)*

Digests detect disagreement with recorded content under the declared hash model; they do not prove the saved computation was correct. Availability is evaluated against the failure domain and current permissions. A matching digest of an already-corrupted training state faithfully preserves the wrong state.

```figure
{
  "id": "fig-30.13",
  "kind": "diagram",
  "title": "Snapshot staging and durable publication are separate",
  "caption": "Live tensors first become an immutable update-consistent snapshot. Per-shard completion and integrity checks precede manifest publication; a failed generation remains unpublished.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.12",
  "alt": "Live tensors first become an immutable update-consistent snapshot. Per-shard completion and integrity checks precede manifest publication; a failed generation remains unpublished.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "live",
        "kind": "tensor",
        "label": "Live update k"
      },
      {
        "id": "stage",
        "kind": "memory",
        "label": "Immutable snapshot k"
      },
      {
        "id": "shards",
        "kind": "flow",
        "label": "Shard writes"
      },
      {
        "id": "check",
        "kind": "process",
        "label": "Version and digest checks"
      },
      {
        "id": "manifest",
        "kind": "state",
        "label": "Committed manifest"
      },
      {
        "id": "load",
        "kind": "model",
        "label": "Eligible restart"
      }
    ],
    "edges": [
      {
        "from": "live",
        "to": "stage"
      },
      {
        "from": "stage",
        "to": "shards"
      },
      {
        "from": "shards",
        "to": "check"
      },
      {
        "from": "check",
        "to": "manifest"
      },
      {
        "from": "manifest",
        "to": "load"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-30.14",
  "kind": "calculator",
  "title": "Snapshot production versus durable drain",
  "caption": "Analytical snapshot size and interval, not a named model. Positive rate headroom is necessary for bounded asynchronous staging; metadata and contention still require margin.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.14",
  "alt": "Analytical snapshot size and interval, not a named model. Positive rate headroom is necessary for bounded asynchronous staging; metadata and contention still require margin.",
  "spec": {
    "tex": "H_b=b_s-s_c/\\Delta_c",
    "equation": "30.14",
    "inputs": [
      {
        "symbol": "s",
        "label": "Snapshot GiB",
        "default": 128,
        "min": 1,
        "max": 2048,
        "step": 1,
        "format": "fixed3"
      },
      {
        "symbol": "dt",
        "label": "Snapshot interval seconds",
        "default": 120,
        "min": 1,
        "max": 3600,
        "step": 1,
        "format": "fixed3"
      },
      {
        "symbol": "rate",
        "label": "Drain GiB per second",
        "default": 2,
        "min": 0.25,
        "max": 32,
        "step": 0.25,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "head",
        "label": "Drain headroom GiB/s",
        "formula": "rate-s/dt",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "time",
        "label": "Minimum drain seconds",
        "formula": "s/rate",
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

[DERIVED] First declare the snapshot cut: after the optimizer has completed and before the next update mutates its state. Complete asynchronous device operations that produce any saved object, then stage an immutable copy or hold a versioned read lock until serialization consumes it. Coordinate the data cursor with the committed update; prefetched but unused samples must remain uncommitted. A scheduler state advanced before an aborted optimizer step must be restored with that step, not saved as its successor.

[DERIVED] Next write each shard under a generation-specific temporary identity. The manifest records global tensor names, shapes, dtypes, logical coordinate ranges, storage offsets, byte lengths, hashes, and writer generation. Validate exact coordinate coverage and allowed replicas. Identical file names on different hosts do not establish a complete distributed tensor. After every required shard has completed according to the backend's durability semantics, publish one immutable commit record. Readers discover only committed records, then validate their content. Filesystem rename and object-store publication have different primitives; the protocol must use an actually supported atomic condition rather than treating them as equivalent.

[PAPER-REPORTED] TierCheck separates local/peer volatile copies from remote durability, uses a globally recoverable version and governs reclamation by a durable watermark. Its differentials are compressed; §3.3 explicitly excludes strict bitwise exactness [R30.6, §3.1–3.4]. That caveat is preserved here. The source's recovery mechanism is not a proof that arbitrary compressed gradients reconstruct an identical optimizer trajectory.

[MATHEMATICALLY-DERIVED] Let exact transition $U$ and an approximate replay satisfy $\|\widetilde U(q)-U(q)\|\le\epsilon_j$ at replay step $j$, with $U$ locally Lipschitz with constant $\kappa_j$. Then

$$
e_{j+1}\le\kappa_je_j+\epsilon_j,\qquad e_m\le e_0\prod_{j=0}^{m-1}\kappa_j+\sum_{j=0}^{m-1}\epsilon_j\prod_{u=j+1}^{m-1}\kappa_u.
$$
*(Eq. 30.13)*

This is a conditional error bound, not an estimated training sensitivity. If constants are unavailable, there is no numeric guarantee. One nonzero omitted gradient already gives a counterexample to bitwise identity: under scalar update $\theta' = \theta-\alpha g$, replacing $g$ by zero changes the result whenever $\alpha g\ne0$ in the relevant arithmetic. Algorithmic intent, bounded error and bitwise equality are different acceptance classes.

[MATHEMATICALLY-DERIVED] Queue stability and staged-memory capacity require

$$
s_c/\Delta_c<b_s,\qquad M_{\rm staged}\ge j_{\max}s_c,
$$
*(Eq. 30.14)*

where $j_{\max}$ is the allowed concurrent snapshot count, and serializer/metadata overhead remains additional. A failed writer must release or quarantine its staging ownership. A successful staging future does not imply remote durability; retain distinct timestamps and errors for capture, staging, write completion and commit.

[DERIVED] Retention follows reachability. A differential chain requires its base plus every required update up to its replay boundary. Deleting a base while keeping its descendants preserves bytes but destroys recovery. A watermark may advance only after the newer complete anchor meets the required durability policy. Keep a previously validated anchor during format conversion. A weights-only export is a new artifact with an explicit reduced state schema; it must never overwrite the full-state recovery lineage under the same identity.

[MATHEMATICALLY-DERIVED] With $n_b$ full anchors of size $s_b$, $n_d$ differentials of size $s_d$, and conversion scratch $s_x$, the minimum logical retained storage is

$$
S_{\rm retained}=n_bs_b+n_ds_d+s_x.
$$
*(Eq. 30.15)*

Replicas, filesystem overhead and temporary failed generations add physical bytes. Full-state serialization is at least linear in saved bytes; checksumming reads all covered bytes; remote transfer time is at least bytes divided by the bottleneck service rate. Differential replay adds state-update work and memory traffic proportional to chain length unless a valid fusion changes that execution boundary.

```figure
{
  "id": "fig-30.15",
  "kind": "hierarchy",
  "title": "Failure coverage is a property of copy placement",
  "caption": "Local and peer memory may survive different events. The durable tier provides a distinct boundary; adjacency does not imply rack independence.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.12",
  "alt": "Local and peer memory may survive different events. The durable tier provides a distinct boundary; adjacency does not imply rack independence.",
  "spec": {
    "direction": "down",
    "levels": [
      {
        "label": "Device snapshot",
        "kind": "memory",
        "note": "Survives only covered device events"
      },
      {
        "label": "Local host copy",
        "kind": "memory",
        "note": "Lost with its host"
      },
      {
        "label": "Peer copy",
        "kind": "memory",
        "note": "Must escape the intended failure domain"
      },
      {
        "label": "Remote durable anchor",
        "kind": "memory",
        "note": "Backend durability contract"
      },
      {
        "label": "Commit manifest",
        "kind": "state",
        "note": "Global version and integrity closure"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-30.16",
  "kind": "chart",
  "title": "Approximate replay can accumulate error",
  "caption": "Conditional Eq. 30.13 with chosen kappa=1.02 and per-step epsilon=0.001. These are analytical inputs, not measured optimizer sensitivity or a paper result. Each marker is an integer replay horizon; the envelope is a worst-case bound under the stated Lipschitz condition.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.13",
  "alt": "Conditional Eq. 30.13 with chosen kappa=1.02 and per-step epsilon=0.001. These are analytical inputs, not measured optimizer sensitivity or a paper result.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "Replay steps",
      "domain": [
        0,
        100
      ]
    },
    "y": {
      "label": "Error upper bound"
    },
    "variables": {
      "kappa": 1.02,
      "eps": 0.001
    },
    "series": [
      {
        "id": "bound",
        "label": "Lipschitz bound",
        "formula": "eps*(kappa^x-1)/(kappa-1)",
        "sample": {
          "from": 0,
          "to": 100,
          "count": 101
        },
        "emphasis": true,
        "dashed": false
      },
      {
        "id": "unit",
        "label": "Unit-sensitivity comparison",
        "formula": "eps*x",
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
        "x": 100,
        "y": 0.31223230591261736,
        "label": "Upper bound, not a measured replay trajectory"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-30.40",
  "kind": "chart",
  "title": "A staged generation is not yet a recovery point",
  "caption": "Declared event schedule illustrating atomic publication: generations9and10stage at10sand30s, then become durably committed at20sand45s. Between each pair of events, recovery still uses the previous qualified generation. The seconds are analytical inputs; no checkpoint latency measurement is claimed.",
  "alt": "Declared event schedule illustrating atomic publication: generations9and10stage at10sand30s, then become durably committed at20sand45s. Between each pair of events, recovery still uses the previous qualified generation. The seconds are analytical inputs; no checkpoint latency measurement is claimed.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.12",
  "spec": {
    "type": "step",
    "x": {
      "label": "Declared event time (seconds)",
      "domain": [
        0,
        50
      ],
      "ticks": [
        0,
        10,
        20,
        30,
        45,
        50
      ]
    },
    "y": {
      "label": "Snapshot generation",
      "domain": [
        8,
        10
      ],
      "ticks": [
        8,
        9,
        10
      ]
    },
    "series": [
      {
        "id": "staged",
        "label": "Latest staged generation",
        "points": [
          [
            0,
            8
          ],
          [
            10,
            9
          ],
          [
            20,
            9
          ],
          [
            30,
            10
          ],
          [
            45,
            10
          ],
          [
            50,
            10
          ]
        ],
        "dashed": true
      },
      {
        "id": "durable",
        "label": "Latest committed durable generation",
        "points": [
          [
            0,
            8
          ],
          [
            10,
            8
          ],
          [
            20,
            9
          ],
          [
            30,
            9
          ],
          [
            45,
            10
          ],
          [
            50,
            10
          ]
        ],
        "emphasis": true
      }
    ],
    "annotations": [
      {
        "x": 10,
        "y": 9,
        "label": "Generation9 staged; recovery remains at8"
      },
      {
        "x": 45,
        "y": 10,
        "label": "Generation10 becomes eligible after durable commit"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 30.3 — Publish one complete checkpoint generation

[DERIVED] Inputs are consistent logical state $\mathcal Q_k$, required shard set $\mathcal F_k$, backend durability predicate, current launch generation and a bounded deadline. Output is a committed manifest or an unpublished failed generation. State transitions are captured → staged → written → validated → committed. Every abort terminates this invocation. The publication sink must check the current generation atomically with publishing; an earlier liveness check alone leaves a race with retirement.

$$
\begin{aligned}
1.&\quad \operatorname{quiesce\_producers}(k);\quad A_k\leftarrow\operatorname{immutable\_snapshot}(\mathcal Q_k).\\
2.&\quad \forall f\in\mathcal F_k:\ (v_f,s_f,h_f)\leftarrow\operatorname{serialize}(A_k[f]).\\
3.&\quad \operatorname{write}(f,\text{temporary generation }e,k);\quad\operatorname{await\_durability}(f).\\
4.&\quad \exists f:\operatorname{failed}(f)\ \lor\ t>t_{\max}\ \Longrightarrow\ \operatorname{abort\_unpublished}(k).\\
5.&\quad \neg\operatorname{validate}(\text{coordinate coverage, versions, sizes, hashes, schema})\Longrightarrow\operatorname{abort\_unpublished}(k).\\
6.&\quad \neg\operatorname{current}(\iota,e)\ \Longrightarrow\ \operatorname{abort\_unpublished}(k).\\
7.&\quad a\leftarrow\operatorname{atomic\_publish\_if\_current}(\iota,e,\text{manifest}(\iota,e,k,\mathcal F_k));\quad\neg a\Longrightarrow\operatorname{abort\_unpublished}(k).\\
8.&\quad \operatorname{advance\_watermark}(k);\quad\operatorname{reclaim\_unreachable\_older\_objects}.
\end{aligned}
$$
*(Eq. 30.16)*

[MATHEMATICALLY-DERIVED] The invariant is that publication implies all required objects represent the same logical version and satisfy the declared durability predicate. The protocol terminates on commit, failure or deadline. Retention step 8 uses the dependency closure, not local file age. Its safety depends on atomic publication/fencing and truthful backend completion; it does not prove availability against failures outside that backend's contract. Auxiliary memory includes the immutable snapshot and metadata, so asynchronous saving must reserve it before capture.

## Implementation

[OFFICIAL-DOCUMENTATION] TorchTitan v0.3.0's `_find_load_step` discovers directories by DCP metadata or a safetensors index [R30.15, method `_find_load_step`]. Discovery by a marker is narrower than the content-integrity predicate in Eq. 30.12. The stronger manifest/checksum protocol above is book-derived and is not claimed as an implemented TorchTitan feature. MaxText v0.2.5 documents its Orbax-v1 transition [R30.12, Checkpointing/Goodput]; compatibility requires the actual schema and dependency lock.

[DERIVED] Conversion must map tensor coordinates, transpositions, padding, optimizer parameter identities and RNG/data schemas explicitly. Validate reconstructed global tensors before applying a new layout. A conversion that drops optimizer state or changes dtype is adaptation or export, not exact continuation. Keep source and destination manifests and record whether parity is bitwise, tolerance-based, or only structurally checked. Do not deserialize executable or untrusted state outside the declared artifact trust boundary.

```figure
{
  "id": "fig-30.17",
  "kind": "compare",
  "title": "Checkpoint guarantees have different acceptance tests",
  "caption": "The comparison is a guarantee hierarchy at a declared update boundary. Structural validity or matching loss does not establish bitwise continuation.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.13",
  "alt": "The comparison is a guarantee hierarchy at a declared update boundary. Structural validity or matching loss does not establish bitwise continuation.",
  "spec": {
    "axis": "Recovery guarantee and required evidence",
    "columns": [
      {
        "id": "struct",
        "label": "Structural"
      },
      {
        "id": "numeric",
        "label": "Numerical tolerance"
      },
      {
        "id": "exact",
        "label": "Bitwise continuation"
      }
    ],
    "rows": [
      {
        "dimension": "Required state",
        "values": {
          "struct": "Schema and coordinates",
          "numeric": "State plus error budget",
          "exact": "All continuation state and deterministic order"
        }
      },
      {
        "dimension": "Integrity",
        "values": {
          "struct": "Readable files",
          "numeric": "Content validation",
          "exact": "Content validation"
        }
      },
      {
        "dimension": "Replay",
        "values": {
          "struct": "Not established",
          "numeric": "Bounded by declared tests",
          "exact": "Identical transitions and random streams"
        }
      },
      {
        "dimension": "Loss agreement",
        "values": {
          "struct": "Insufficient",
          "numeric": "One diagnostic only",
          "exact": "Insufficient without state identity"
        }
      }
    ]
  }
}
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] TierCheck uses sixteen A800 GPUs, DeepSpeed 0.16.4/PyTorch 2.6.0 and a remote Lustre backend; its studies separate saving, recovery, convergence and reclamation. The authors reimplement one unavailable baseline [R30.6, §5.1–5.3]. These results are conditional on that testbed and implementation, not a bitwise-continuation proof. [NOT-DISCLOSED] A full public checkpoint-schema conversion audit and independent reproduction are not established by the inspected paper.

[PAPER-REPORTED] TierCheck's disclosed experiment separates system stress from convergence [R30.6, §5.1–5.3].

| Field | Source disclosure |
|---|---|
| Hardware/stack |16A80080 GiB;4 hosts/512 GiB;200 Gbps InfiniBand; Lustre2.14; CUDA12.4/NCCL2.21.5 |
| Models/data |10/20/40B configured models on WikiText; BERT/SQuAD; convergence GPT2-124M/WikiText2 |
| Baselines | No-checkpoint ZeRO-3, CheckFreq extended to ZeRO-3, reimplemented Gemini, DataStates-LLM |
| Budget |50 iterations for 40B overhead; base every 50 steps; differential batch 5; convergence base 100 |
| Interventions | Process kill, fresh-node replacement, same-rack outage assumption; periodic convergence interruption |
| Uncertainty/ablation | Multi-seed CI and full baseline commit set NOT-DISCLOSED; replay/reclamation/parallelism microstudies |

[PAPER-REPORTED] Table3 reports GPT2-20B recovery totals8.8/18.4/23.9 seconds for software/node/rack cases; the 40B per-iteration capture case still adds10.7–15.1% overhead [R30.6, §5.2]. [DERIVED] Tier benefits therefore depend on which copies survive; “asynchronous” does not mean free.

## Observations

**What the paper claims.** [PAPER-REPORTED] Tiered copies and coordinated reclamation reduce recovery cost while retaining its stated optimizer-equivalence regime [R30.6, §3–5].

**What the evidence shows.** [DERIVED] The source explicitly limits numerical exactness; convergence checks test the reported run, not equality of all future trajectories.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 30.13 requires an explicit replay-error contract for compressed differentials. Eq. 30.12 rejects a newer marker with missing or mismatched shards.

**What remains unknown.** [UNVERIFIED] This edition has not validated power-loss durability, artifact conversion, data-cursor restoration, or any named backend's implementation of the proposed commit protocol.

## Failure modes

> **Failure mode — Mixed-version snapshot.** [DERIVED] *Symptom:* shard versions disagree or restored optimizer state does not match parameters. *Cause:* live tensors mutated during serialization. *Detection:* versioned immutable capture and state comparison. *Mitigation:* a consistent cut and explicit producer completion.

> **Failure mode — Reclaimed base with surviving differentials.** [DERIVED] *Symptom:* files exist but no complete reconstruction chain exists. *Cause:* local-age deletion. *Detection:* dependency-closure validation. *Mitigation:* global committed watermark and retained validated predecessor.

```figure
{
  "id": "fig-30.18",
  "kind": "stat-panel",
  "title": "Checkpoint acceptance record",
  "caption": "Each categorical row is required by the proposed recoverability predicate. Presence of a metadata marker alone cannot fill these rows.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.12",
  "alt": "Each categorical row is required by the proposed recoverability predicate. Presence of a metadata marker alone cannot fill these rows.",
  "spec": {
    "header": "Checkpoint acceptance record",
    "rows": [
      {
        "key": "Version",
        "value": "One completed update"
      },
      {
        "key": "Coordinates",
        "value": "Complete logical coverage"
      },
      {
        "key": "Content",
        "value": "Sizes and digests match"
      },
      {
        "key": "State",
        "value": "Optimizer, RNG, data, schedule"
      },
      {
        "key": "Publication",
        "value": "Current generation and durable commit"
      }
    ]
  },
  "anchor": "failure-modes"
}
```

## Siblings

[DERIVED] **Activation checkpoints**, [§30.2](30-2-memory-management.md), support backward rematerialization and need not survive process loss. **Peer healing**, [§30.6](30-6-recovery-and-reproducibility.md), can restore a missing shard from surviving state without consulting durable storage, within its failure contract. **Model export** omits continuation state and belongs to an inference artifact lineage. These alternatives change the protection boundary rather than the learning objective.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] Megatron-Core 0.19.0 documents incremental quantized loading rather than full-model scratch allocation [R30.11]. [DERIVED] This changes load-time lifetimes, not the saved artifact's numerical guarantee. Tiered and differential designs must still identify their complete base and replay closure. No inspected successor establishes universal bitwise recovery across arbitrary optimizer, mesh and dtype changes.

## Limitations

[DERIVED] Hashes cannot detect a mathematically wrong but faithfully saved state. Atomic publication does not create stronger storage durability than the backend offers. Exact continuation may be unavailable when kernels or collective reduction order change. Restrict the claim to the strongest guarantee actually tested; do not promote readable weights to a full-state checkpoint or convergence similarity to identity.

## Reproducibility

[DERIVED] Retain full state schema, snapshot-cut definition, tensor coordinate manifest, serializer version, content digests, durability receipts, generation, data/RNG state, conversion map and retention graph. [UNVERIFIED] Proposed checks are unexecuted; the exact source versions and 2026-10-09 inspection are recorded in [references](references.md).

## References

[R30.6] TierCheck §3–5; [R30.11] Megatron-Core 0.19.0; [R30.12] MaxText v0.2.5; [R30.14] TorchTitan checkpoint guide; [R30.15] pinned DCP manager.
