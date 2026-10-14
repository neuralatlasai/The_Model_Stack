---
id: "ms.section.47.5"
entity_type: "section"
title: "47.5 — Recovery"
volume: 2
part: 8
chapter: 47
section: 47.5
slug: "47-5-recovery"
parent: "ms.chapter.47"
prev_sibling: "ms.section.47.4"
next_sibling: "ms.section.47.6"
children: []
prerequisites: ["ms.chapter.30","ms.chapter.43","ms.chapter.44","ms.chapter.45","ms.chapter.46"]
downstream: ["ms.chapter.48","ms.chapter.66"]
related: []
relations: []
axes: {"lifecycle":["inference"],"mechanism":["observability","deployment","recovery"],"feedback_setting":[],"modality":["text"]}
papers: []
implementations: ["impl.pytorch","impl.vllm","impl.sglang","impl.nvidia-nccl"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# 47.5 — Recovery

## Scope

[DERIVED] Recovery restores a valid serving state after failure or a defective release. Its distinct objectives are ready capacity, request progress, externally committed effects, and API continuity. We develop traffic drain, fenced rollback, cache invalidation, state migration, bounded replay, and degraded operation. Chapter 30 treats training-state recovery; here immutable inference weights, initialized runtime, and traffic-dependent request state have different lifetimes.

## Why this exists

[DERIVED] Restarting a process can leave a service unavailable while it reloads weights and recreates collective state, kernels and graphs. Conversely, restoring a ready engine may still lose every interrupted request's KV state. A rollback can restore an older model while leaving incompatible cache entries or an already executed external tool action. Recovery must name the state being recovered and the failure assumptions under which reuse is valid.

[DERIVED] The most dangerous recovery ambiguity is concurrent ownership. A slow old worker can resume after a replacement has started, emit stale tokens, append duplicate KV, or commit the same tool action. Routing changes alone do not prevent this. Epochs and fencing at the point of state publication or side-effect commitment are needed to reject stale owners.

## Intuition

[DERIVED] Separate three state planes. Model state consists of immutable weights and compatible numerical metadata. Runtime state consists of initialized contexts, graphs, buffers and communicators. Request state consists of scheduler records, token history, KV contents and pending outputs. A failure can preserve one plane and invalidate another. Reusing only the preserved plane can be substantially cheaper than reconstructing everything, but only if integrity and compatibility are established.

```figure
{
  "id": "fig-47.15",
  "kind": "diagram",
  "title": "Recovery selects preserved state planes",
  "caption": "Immutable model state, initialized private runtime and traffic-dependent request state have distinct lifetimes.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-47.19",
  "alt": "Immutable model state, initialized private runtime and traffic-dependent request state have distinct lifetimes. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "f",
        "kind": "branch",
        "label": "failure integrity"
      },
      {
        "id": "m",
        "kind": "memory",
        "label": "trusted resident model"
      },
      {
        "id": "s",
        "kind": "memory",
        "label": "private runtime shadow"
      },
      {
        "id": "r",
        "kind": "process",
        "label": "restore / rebuild"
      },
      {
        "id": "q",
        "kind": "state",
        "label": "fresh request state"
      }
    ],
    "edges": [
      {
        "from": "f",
        "to": "m",
        "kind": "flow",
        "label": "preserving"
      },
      {
        "from": "m",
        "to": "s",
        "kind": "flow"
      },
      {
        "from": "f",
        "to": "r",
        "kind": "flow",
        "label": "invalidating"
      },
      {
        "from": "r",
        "to": "q",
        "kind": "flow"
      },
      {
        "from": "s",
        "to": "q",
        "kind": "flow"
      }
    ]
  }
}
```

[PAPER-REPORTED] Dynamo's 2026 recovery architecture combines initialized snapshots, an external GPU Memory Service (GMS), and private-runtime shadow engines. A device-preserving failure leaves trustworthy resident allocations reusable; a device-invalidating failure requires reset, replacement, or reconstruction because integrity is uncertain. Missing reset/error signals alone are not a proof of safe reuse. [R47.6, §§2.2–3 and Appendix A]

## Formulation

[DERIVED] Let $T_{\rm det}$, $T_{\rm fence}$, $T_{\rm restore}$, $T_{\rm register}$, and $T_{\rm refill}$ denote detection, ownership revocation, engine restoration, discovery readiness and workload-dependent cache/capacity refill. A useful operational decomposition is

$$
 T_{\rm useful}=T_{\rm det}+T_{\rm fence}+T_{\rm restore}
                  +T_{\rm register}+T_{\rm refill}.
$$

(Eq. 47.16)

[DERIVED] The terms are disjoint under this declared serial boundary. Implementations may overlap them; measured end-to-end duration should then use the actual critical path. “Ready” may exclude refill and request replay. Failure-injection-to-ready and container-start-to-ready measurements exclude different detection/orchestration intervals and cannot be presented as identical MTTR.

[MATHEMATICALLY-DERIVED] If immutable weight reconstruction takes $W/B_{\rm eff}$, runtime restoration takes $R$, both begin concurrently after setup $c$, and neither can serve before both complete, ideal independent overlap gives

$$
 T_{\rm restore}=c+\max(W/B_{\rm eff},R),
 \qquad
 \max(W/B_{\rm eff},R)\le W/B_{\rm eff}+R .
$$

(Eq. 47.17)

[DERIVED] The max expression requires independent progress and no hidden shared bottleneck. Host I/O, memory bandwidth, PCIe, or serialized setup can reduce overlap. Resident GMS reuse removes the weight-copy path only when allocations survive and match the release/topology; it does not remove private-runtime reconstruction unless a compatible snapshot or shadow exists.

[MATHEMATICALLY-DERIVED] An added shadow with memory $m_s$ reduces a fixed KV budget from $M_K$ to $M_K-m_s$. Its memory feasibility requires

$$
 M_K-m_s\ge M_{\rm min},\qquad
 \Delta A=\int_0^H[C_{\rm shadow}(t)-C_{\rm baseline}(t)]\,dt .
$$

(Eq. 47.18)

[DERIVED] The inequality is a budget condition; positive integrated useful-capacity difference $\Delta A$ is an objective, not a theorem from faster promotion. Shadows can reduce healthy capacity and add replenishment interference. Their value depends on failure frequency, workload concurrency, memory pressure, repeated failures and provisioning cost. A roughly model-size-independent runtime overhead does not imply model-size-independent capacity impact.

## Mechanism

[PAPER-REPORTED] A request-free initialized Snapshot captures host process/runtime state and durable device state after releasing empty KV backing while retaining virtual addresses required by graphs. With GMS, model allocations live outside the engine: the engine unmaps imported model handles before capture, then restores and reattaches compatible allocations. Device-invalidating recovery can reconstruct weights alongside runtime restoration. [R47.6, §§3.1–3.3]

[PAPER-REPORTED] GMS owns physical allocations in a separate per-GPU process. Its protocol permits an exclusive writer to populate model state, commits it immutable, and exposes read-only mappings to readers. A failed writer before commit discards incomplete state. Read-only mapping protects shared weights from ordinary engine writes; it does not establish safety after a GPU reset or integrity failure. [R47.6, §3.2]

[PAPER-REPORTED] A shadow shares committed model weights but has private initialized CUDA context, buffers, communicators and graphs. It reserves KV virtual address space without retaining the primary's KV contents. After primary failure, leadership transfer activates fresh KV backing and registers the replacement. Interrupted requests must be replayed; the evaluated mechanism restores initialized capacity, not exact token/KV progress. [R47.6, §3.4]

[DERIVED] Rollback must also advance a routing/state epoch, prevent new admission to the defective tuple, and reject late writes/publications from stale owners. Cached state is reused only if its semantic key and format are compatible with the restored release. A changed template/tokenizer/position convention generally requires a distinct namespace even when weights are identical. Reference counts and outstanding DMA/kernel operations must quiesce before memory is released or reused.

```figure
{
  "id": "fig-47.16",
  "kind": "calculator",
  "title": "Ideal independent restoration overlap",
  "caption": "Illustrative critical path assumes weight and runtime restoration start together without shared contention.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-47.17",
  "alt": "Illustrative critical path assumes weight and runtime restoration start together without shared contention. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "tex": "T=c+\\max(W/B,R)",
    "inputs": [
      {
        "symbol": "w",
        "label": "weight bytes",
        "default": 80000000000,
        "min": 1,
        "max": 2000000000000,
        "format": "bytes"
      },
      {
        "symbol": "b",
        "label": "effective bytes per second",
        "default": 10000000000,
        "min": 1,
        "max": 100000000000,
        "format": "bytes"
      },
      {
        "symbol": "r",
        "label": "runtime restore seconds",
        "default": 15,
        "min": 0,
        "max": 1000,
        "format": "seconds"
      },
      {
        "symbol": "c",
        "label": "setup seconds",
        "default": 2,
        "min": 0,
        "max": 1000,
        "format": "seconds"
      }
    ],
    "outputs": [
      {
        "symbol": "t",
        "label": "ideal restore seconds",
        "formula": "c+max(w/b,r)",
        "format": "seconds",
        "emphasis": true
      }
    ]
  }
}
```

[DERIVED] Migration copies request state into a destination whose artifact, tokenizer, position semantics, precision, sharding and cache layout satisfy a compatibility predicate. It then transfers ownership once using a fenced commit; a failed transfer discards uncommitted destination state. This is a synthesized control-plane transaction, not a claim that Dynamo's shadow mechanism migrates requests. Chapter 44 develops KV handoff costs; this section develops failure and ownership semantics.

## Algorithm

### Algorithm 47.5 — Fenced recovery

[DERIVED] Algorithm 47.5 recovers a finite affected request set $Q$. Inputs include failure signals, trusted release manifests, durable ownership epoch $e$, a finite recovery-action list, per-request replay cap $b$, and deadline $D$. Initialize action=none and every request status unresolved. Outputs are a ready approved replica plus terminal request states, or a bounded unavailable/degraded result.

$$
\begin{aligned}
1.\;&\text{CAS durable recovery ownership for epoch }e;\ \text{loser returns without promotion};\\
 &\text{stop new admissions; immediately fence failed/affected owners}.\\
2.\;&\text{Retain explicit per-request leases only for selected healthy draining owners until }D_{\rm drain}<D;\\
 &\text{at cutoff revoke all retained leases, cancel/quiesce remaining work;}\\
 &\text{record visible prefixes/effects; atomically commit epoch }e+1\text{ before any replacement publication}.\\
3.\;&A\leftarrow\{\text{actions compatible with release, hardware and proven state integrity}\};\\
 &A=\varnothing\Rightarrow\text{return unavailable or explicit degraded contract}.\\
4.\;&\text{Visit }A\text{ in declared order at most once with an enforced remaining-deadline timeout;}\\
 &\text{promote trusted shadow, restore, or rebuild;}\\
 &\text{failure}\Rightarrow\text{quiesce/invalidate partial state and continue};\\
 &\text{success}\Rightarrow\text{register only at epoch }e+1\text{ and stop action search}.\\
5.\;&\text{No successful action by }D\Rightarrow\text{return bounded unavailable/degraded result}.\\
6.\;&\text{For each }r\in Q\text{ once: cancelled}\Rightarrow\text{terminal cancelled; continue};\\
 &\text{unsafe duplicate effects or incompatible visible prefix}\Rightarrow
 \text{terminal partial failure; continue};\\
 &\text{otherwise replay/migrate at }e+1\text{ with at most }b\text{ attempts and deadline }D.\\
7.\;&\text{Reject stale epoch writes; return readiness boundary, request outcomes and unresolved effects}.
\end{aligned}
$$

(Eq. 47.19)

[DERIVED] The controller lease and epoch commit are durable/atomic; an expired controller cannot register or publish. Action timeouts quiesce partial work before fallback. The invariant is one authorized owner for each committed state/output transition. Draining stops new admissions but need not immediately cancel healthy work; the deadline bounds that choice. Replay does not promise identical stochastic output or exactly-once external actions. An idempotency ledger or authoritative side-effect service must determine whether an action already committed; uncertainty produces a partial-failure contract instead of blind retry.

## Implementation

[DERIVED] The route is AI_REFERENCE_STACK §1 **#14 NVIDIA Research** for the 2026 primary work; §4 **#1 NVIDIA CUDA**, layer **Accelerator / driver / compiler**, **#4 NVIDIA NCCL**, layer **Kernels / numerics / collectives**, and **#41 vLLM / #42 SGLang**, layer **Inference engine**, identify the evaluated stack. Dynamo/GMS/Snapshot are separate orchestration/state-lifetime mechanisms outside those entries.

[OFFICIAL-DOCUMENTATION] The inspected Snapshot repository describes checkpoint/restore primitives with orchestration left to integrators. Its current README states matching hardware/driver prerequisites and explicitly notes evolving APIs. This mutable repository surface is not identical to the paper's experimental configuration, and its headline examples are not substituted for the paper's experiments. [R47.12, README “Solution”, “Prerequisites” and note]

[PAPER-REPORTED] The implementation uses CUDA virtual-memory mechanisms and process checkpointing, preserving virtual addresses and rebuilding deployment-specific bindings. Private runtime memory and GMS slab fragmentation remain costs. Multi-rank coordination design does not establish evaluated multi-node failure behavior: controlled experiments use a single eight-GPU node. [R47.6, §§4–5.1]

[DERIVED] Recovery cost includes durable snapshot bytes, host staging traffic, weight reload bandwidth, private runtime capacity, replayed prompt/output tokens and topology-dependent communication. Faster readiness can reduce lost GPU-seconds while repeated replay raises total FLOPs. Energy includes idle provisioned GPUs and replenishment work. Monetary benefit requires comparing reserved capacity, lost goodput, memory-induced capacity loss and failure distribution; multiplying one latency reduction by all outages overstates benefit when reuse is ineligible.

## Experimental design

### Methodology

[PAPER-REPORTED] The study uses eight B200 GPUs, vLLM 0.27.1 and SGLang 0.5.18, prefix caching and chunked prefill enabled, memory utilization .8, and colocated phases. Models are Qwen3.8-27B BF16 TP8 and DeepSeek-V4-Flash, GLM-5.2, DeepSeek-V4-Pro NVFP4 TEP8. SIGKILL terminates engine process trees; weights/compilation artifacts are warm for the warm-restart baseline. Storage and hardware remain within the described setup. [R47.6, §5.1]

### Reported experiments

[PAPER-REPORTED] Table 3 reports shadow recovery between 4.6 and 6.2 seconds across engine/model combinations. For vLLM DeepSeek-V4-Pro, Snapshot alone takes 189.7 seconds versus 156.5 seconds for warm restart: serialization/restoration can lose. Snapshot with warm GMS takes 25.7 seconds. Shadow timing starts at failure injection; other mechanisms start at container start, so figures do not share a complete detection-to-ready boundary. [R47.6, §5.2, Table 3]

[PAPER-REPORTED] Figure 9 reports approximately 4.3 GiB/GPU shadow overhead for Qwen and 7.4–8.1 GiB/GPU for larger configurations. Figure 10's GLM-5.2 replenishment experiment uses 32k-input/1k-output Poisson traffic at .35 requests/s; restoring a shadow takes 38 seconds versus 157 seconds for warm initialization, with less reported serving interference. This controlled load is not every saturation regime. [R47.6, §§5.3–5.4]

[PAPER-REPORTED] In the two-replica GLM-5.2 serving experiment at .7 requests/s, warm recovery takes 148 seconds and shadow promotion 5.8 seconds. Rebuilding useful KV occupancy takes substantially longer than promotion, illustrating why ready capacity and traffic-dependent refill are separate. The experiment includes shadow-related KV-capacity reduction; faster recovery is not free redundancy. [R47.6, §5.5, Figure 11]

## Observations

**What the paper claims.** [PAPER-REPORTED] Preserving initialized capacity through shared immutable model state and private runtime shadows can make device-preserving recovery much faster. [R47.6, §§3 and 5]

**What the evidence shows.** [PAPER-REPORTED] Controlled eight-B200 process kills support sub-seven-second promotion, with measured per-GPU memory overhead. Snapshot alone loses on the largest vLLM configuration, and request KV progress is not preserved. [R47.6, Table 3 and §§5.3–5.5]

**What we infer.** [DERIVED] State lifetime is a major recovery design variable. The best eligible action depends on integrity, compatibility, private-memory pressure and the failure boundary; a uniform “always restore” rule is unjustified.

**What remains unknown.** [NOT-DISCLOSED] Controlled multi-node failures, correlated failures during replenishment, and exact request-progress preservation are not established. Production trace savings are counterfactual, treated separately in 47.6.

## Failure modes

[DERIVED] Reusing suspect weights can propagate corruption. Rollback without cache epochs can replay defective state. Late old-worker output can interleave with replacement output. Replay can duplicate external actions or contradict a visible stochastic prefix. A second failure before shadow replenishment takes a slower path. Degraded mode can violate expectations unless its capability, quality and API changes are explicit and separately monitored.

## Siblings

[DERIVED] Full replica redundancy preserves spare capacity but pays duplicated model/runtime resources. Snapshots trade storage and transfer for reconstruction time. GMS preserves immutable weight residency across eligible failures. Shadows preserve initialized runtime while sacrificing private memory and some KV capacity. Request checkpointing targets progress and complements these mechanisms.

```figure
{
  "id": "fig-47.17",
  "kind": "compare",
  "title": "Preserved state determines recovery",
  "caption": "Mechanisms preserve different state; none automatically preserves committed request progress.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-47.19",
  "alt": "Mechanisms preserve different state; none automatically preserves committed request progress. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "axis": "Preserved state and cost boundary",
    "columns": [
      {
        "id": "m",
        "label": "Snapshot"
      },
      {
        "id": "t",
        "label": "GMS"
      },
      {
        "id": "p",
        "label": "Shadow"
      }
    ],
    "rows": [
      {
        "dimension": "Preserves",
        "values": {
          "m": "captured initialized state",
          "t": "immutable model residency",
          "p": "private initialized runtime"
        }
      },
      {
        "dimension": "Cost",
        "values": {
          "m": "storage / restore transfer",
          "t": "service / integrity boundary",
          "p": "private memory / refill"
        }
      },
      {
        "dimension": "Request KV",
        "values": {
          "m": "empty evaluated snapshot",
          "t": "not model allocations",
          "p": "fresh backing, replay needed"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The lineage is warm restart, snapshot restoration, external immutable device ownership, and private-runtime promotion. A central unresolved question is when preserving request progress becomes more valuable than preserving ready capacity. Settling evidence needs long-context replay costs, tool-side-effect semantics, failure frequencies, memory opportunity costs and sustained-load goodput in the same experiment.

## Limitations

[DERIVED] Integrity classification is part of the trusted recovery boundary, not a retrospective label that can be assumed at runtime. Exactly-once visible behavior requires durable state/publication contracts beyond a fast engine restart. Migration and rollback synthesis here is a proposed architecture whose correctness depends on the stated fencing and quiescence invariants.

## Reproducibility

[UNVERIFIED] No failure injection or checkpoint restoration was executed. Required artifacts include engine/model revisions, precision/topology, driver/runtime, snapshot format, GMS identity/commit state, failure signals, memory budgets, timing boundaries, routing/cache epochs, replay policy and side-effect ledger. [Verification](verification.md) contains the unexecuted runbook exercise.

## References

[DERIVED] [R47.6, Fast Recovery in Dynamo](https://arxiv.org/html/2609.25451v1), §§2–6 and Appendix A, is CC BY 4.0; mechanisms/results are attributed adaptations, with original equations and fenced protocol synthesized here. [R47.12, Snapshot](https://raw.githubusercontent.com/ai-dynamo/snapshot/main/README.md) is inspected mutable implementation documentation.
