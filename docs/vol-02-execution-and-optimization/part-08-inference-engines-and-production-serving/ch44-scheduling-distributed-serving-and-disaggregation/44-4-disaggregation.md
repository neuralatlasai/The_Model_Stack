---
id: "ms.section.44.4"
entity_type: "section"
title: "44.4 — Disaggregation"
volume: 2
part: 8
chapter: 44
section: 44.4
slug: "44-4-disaggregation"
parent: "ms.chapter.44"
prev_sibling: "ms.section.44.3"
next_sibling: "ms.section.44.5"
children: []
prerequisites: ["ms.chapter.29","ms.chapter.42","ms.chapter.43"]
downstream: ["ms.chapter.46","ms.chapter.47","ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle":["inference"],"mechanism":["scheduling","distributed_serving","disaggregation"],"feedback_setting":[],"modality":["text"]}
papers: ["P37","P38"]
implementations: ["impl.pytorch","impl.vllm","impl.sglang","impl.nvidia-nccl"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-25"
editorial_status: "manuscript_draft"
---

# 44.4 — Disaggregation

## Scope

[DERIVED] This section owns separating prefill and decode execution pools, their placement and resource ratio, and the protocol that moves request state between them. The baseline is equal-budget colocation with a competitive batching/parallelism plan. Success means improved joint first-token/token-gap attainment or cost per accepted completion after queueing, transport, serialization, and duplicated resources are charged. Cache compression and local state accounting remain in Chapter 42; network arbitration and failure groups are developed in §44.5.

## Why this exists

[PAPER-REPORTED] DistServe separates phase resources and searches their parallelism/replication plans for per-GPU goodput, using bandwidth-sensitive placement constraints [P38](references.md), §§3–4. The targeted limitation is coupled resource allocation and phase interference, not the existence of an inherently slow model forward pass.

[MATHEMATICALLY-DERIVED] Separation creates independent optimization opportunities but introduces a tandem queue. Capacity in the prefill pool cannot substitute for insufficient decode capacity, and spare decode compute cannot process an untransferred prefix. A service that removes one device-level interference term may add a network bottleneck and a second admission wait. The scientifically relevant comparison includes all three, together with the equal-budget colocated alternative.

[DERIVED] The word “disaggregated” does not specify the physical distance. Phases can occupy different GPUs within one fast-fabric node, different nodes in one rack, or separate resource tiers. Each choice changes transfer and failure behavior. A result obtained by aligning corresponding phase layers within one node is not evidence that arbitrary cross-node state handoff is cheap.

## Intuition

[MATHEMATICALLY-DERIVED] Prefill and decode can prefer different batch shapes, parallel degrees, and latency constraints. Separate pools let each phase choose its own operating point. Their coupling remains through state volume, handoff deadlines, and flow conservation. If a prompt finishes on a prefill GPU faster than a decode slot becomes available, the completed state must wait somewhere; moving the queue from decode memory to prefill memory changes capacity pressure, not the amount of unfinished work.

## Formulation

> **Definition — Prefill/decode disaggregation.** [DERIVED] Executing prompt processing and subsequent autoregressive generation on separately scheduled model instances, with an explicit protocol transferring the compatible request state needed to continue generation.

| Symbol | Meaning and unit |
|---|---|
| $Q_P,Q_D$ | Prefill and decode admission waits in seconds |
| $T_P,T_D$ | Phase execution times at the chosen placements |
| $V,H,O$ | Handoff bytes, total handoff duration, valid overlapped duration |
| $B_{\rm eff},\alpha,\sigma$ | Effective bytes/s, fixed setup seconds, per-message control seconds |
| $I_{\rm colo}$ | Colocation interference included in the comparator |
| $\lambda,\mu_P,\mu_D$ | Offered requests/s and phase service capacities |
| $\chi$ | Whether first-token publication waits for decode readiness |

[MATHEMATICALLY-DERIVED] Under a serial pack/transfer/unpack path, the handoff duration can be decomposed as
$$
H=\alpha+n_{\rm msg}\sigma+T_{\rm pack}
+\frac{V}{B_{\rm eff}}+T_{\rm unpack}+T_{\rm reshard},
\qquad H_{\rm exposed}=\max(0,H-O).
$$
*(Eq. 44.16)*

where $O$ includes only work that truly overlaps on the critical path. If packing and transport pipeline, their serial sum must be replaced by the actual stage critical path; using both full overlap and a subtractive overlap credit would double-count a saving.

[MATHEMATICALLY-DERIVED] For a fixed request trace and matched output semantics, an explicit latency difference is
$$
\Delta L=
\Delta Q_P+\Delta Q_D+\Delta T_P+\Delta T_D
+H_{\rm exposed}+T_{\rm route}-I_{\rm colo}.
$$
*(Eq. 44.17)*

where each delta compares separated execution with its corresponding interference-free colocated contribution. Separation wins end-to-end latency only when the right-hand side is negative. A change in hardware budget, cache policy, or output length must be separately controlled, not hidden inside $I_{\rm colo}$.

```figure
{
  "id": "fig-44.12",
  "kind": "diagram",
  "title": "State handoff and client publication",
  "caption": "The first token can be published before decode readiness or gated on it. The handoff delay then appears in TTFT or in the first token gap.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-44.19",
  "alt": "The first token can be published before decode readiness or gated on it. The handoff delay then appears in TTFT or in the first token gap. Values and structures are analytical; no measured model performance is shown.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "q",
        "kind": "state",
        "label": "prefill queue"
      },
      {
        "id": "p",
        "kind": "process",
        "label": "prefill and first token"
      },
      {
        "id": "h",
        "kind": "flow",
        "label": "pack transfer validate"
      },
      {
        "id": "d",
        "kind": "state",
        "label": "decode admission"
      },
      {
        "id": "g",
        "kind": "process",
        "label": "subsequent tokens"
      },
      {
        "id": "f",
        "kind": "branch",
        "label": "publication policy"
      },
      {
        "id": "c",
        "kind": "metric",
        "label": "visible token timeline"
      }
    ],
    "edges": [
      {
        "from": "q",
        "to": "p",
        "kind": "flow"
      },
      {
        "from": "p",
        "to": "h",
        "kind": "flow"
      },
      {
        "from": "h",
        "to": "d",
        "kind": "flow"
      },
      {
        "from": "d",
        "to": "g",
        "kind": "flow"
      },
      {
        "from": "p",
        "to": "f",
        "kind": "flow"
      },
      {
        "from": "d",
        "to": "f",
        "kind": "flow"
      },
      {
        "from": "f",
        "to": "c",
        "kind": "flow"
      },
      {
        "from": "g",
        "to": "c",
        "kind": "flow"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] DistServe profiles/simulates feasible phase configurations, estimates maximum SLO-compliant rates, selects phase plans, then replicates them to cover demand. When inter-node transport is slow, corresponding prefill/decode layer segments are colocated on a node to use its local fabric. Online scheduling uses FCFS-derived policies and decode-pulled state, retaining waiting handoff state on prefill [P38](references.md), §§4.1–4.3. This is source-specific placement, not an assumption that cross-node communication disappears.

[DERIVED] Reconstructing the decision requires two loops. Offline configuration search evaluates candidate parallel meshes and phase ratios against a workload model and joint latency targets. Online execution routes a request to prefill, reserves or later acquires decode capacity, publishes compatible state metadata, transfers payload, validates completion, and resumes generation. A capacity-feasible search result can still fail online because its workload distribution, topology, or overlap estimate is wrong.

[MATHEMATICALLY-DERIVED] A necessary long-run flow condition for a stable separated system is
$$
\lambda<\min(\mu_P,\mu_D),\qquad
\rho_{\rm net}=\frac{\lambda\,\mathbb E[V]}{B_{\rm residual}}<1.
$$
*(Eq. 44.18)*

where $B_{\rm residual}$ is bandwidth left after other traffic and any retransmissions; it is not NIC nameplate bandwidth. These are necessary capacity inequalities under stationary averages, not sufficient tail-latency guarantees. Bursts, message dependencies, and long transfers can miss deadlines even when $\rho_{\rm net}<1$.

[DERIVED] Phase ratio should follow service demands after caching and batching, rather than the count of “prefill requests” and “decode requests.” Each admitted request visits both phases, but output lengths make decode residency highly variable. Increasing prefix reuse changes prefill demand and may shift the optimum toward decode capacity. An allocation tuned to cold prompts can become imbalanced after warmup; a balanced average can still be unstable for a particular hot replica or network cut.

[MATHEMATICALLY-DERIVED] At low offered load, suppose colocation interference and all queue differences vanish, both placements have identical phase execution times, and routing adds nonnegative cost. Then Eq. 44.17 becomes $H_{\rm exposed}+T_{\rm route}\ge0$. Disaggregation cannot improve that request's latency under those assumptions. It can still improve another objective, such as future capacity, but that requires different evidence. This limiting case falsifies a universal latency-improvement claim without inventing a benchmark.

[DERIVED] First-token accounting needs its own publication rule. If the prefill instance generates and streams the first token immediately, transfer affects the first-to-second-token gap rather than TTFT. If the router waits for decode admission before publishing, it affects TTFT too. With $\chi\in\{0,1\}$,
$$
T_{\rm first}=Q_P+T_P+T_{\rm front}
+\chi(Q_D+H_{\rm exposed}),
\qquad
G_{1\to2}\supset(1-\chi)(Q_D+H_{\rm exposed}).
$$
*(Eq. 44.19)*

where the inclusion says the gap contains readiness delay plus any next-token execution, not that the displayed term is its complete value. Benchmarking only TTFT can hide a large handoff stall when $\chi=0$.

```figure
{
  "id": "fig-44.13",
  "kind": "calculator",
  "title": "Exposed handoff delay",
  "caption": "This simplified Eq. 44.16 configuration groups fixed packing/control costs into alpha. Subtract only valid overlap; defaults are illustrative.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-44.16",
  "alt": "This simplified Eq. 44.16 configuration groups fixed packing/control costs into alpha. Subtract only valid overlap; defaults are illustrative. Values and structures are analytical; no measured model performance is shown.",
  "spec": {
    "tex": "H_{exposed}=\\max(0,\\alpha+V/B-O)",
    "equation": "44.16",
    "inputs": [
      {
        "symbol": "alpha",
        "label": "fixed control and pack seconds",
        "default": 0.01,
        "min": 0,
        "max": 1,
        "format": "seconds"
      },
      {
        "symbol": "V",
        "label": "state bytes",
        "default": 1073741824,
        "min": 1,
        "max": 137438953472,
        "format": "bytes"
      },
      {
        "symbol": "B",
        "label": "effective bytes per second",
        "default": 10000000000,
        "min": 1000000,
        "max": 1000000000000,
        "format": "bytes/s"
      },
      {
        "symbol": "O",
        "label": "valid overlap seconds",
        "default": 0.03,
        "min": 0,
        "max": 10,
        "format": "seconds"
      }
    ],
    "outputs": [
      {
        "symbol": "H",
        "label": "exposed seconds",
        "formula": "max(0,alpha+V/B-O)",
        "format": "seconds",
        "emphasis": true
      }
    ]
  }
}
```

[DERIVED] Payload serialization is an execution decision. A transport can copy strided layer/head blocks individually, pack them into contiguous buffers, or transfer a scatter/gather list. Packing spends memory bandwidth and temporary capacity; many small transfers spend per-message latency; changing TP layouts can require repartitioning. GPU-direct transfer avoids a host-copy leg only on supported paths and does not remove memory registration, NIC locality, destination reservation, or network congestion.

[MATHEMATICALLY-DERIVED] Early destination reservation occupies approximately $V$ bytes while prefill executes and transfers; delayed reservation avoids the prefill-wait component but can expose previously overlapped handoff. The retained-byte-time difference is approximately $VT_P$ when the same payload is reserved for the whole prefill interval. This is an illustrative accounting identity, not a claim that the actual allocator reserves exactly $V$ at every offset.

[OFFICIAL-DOCUMENTATION] Current SGLang documents an early versus prefill_complete decode-allocation policy: delaying reservation can reduce decode pressure but retains state longer on prefill and removes chunked-prefill/transfer overlap; the initial implementation has explicit layout/backend restrictions [R44.11](references.md), “Decode allocation policy.” This is a documented counterexample to treating delayed allocation as a general throughput improvement.

[MATHEMATICALLY-DERIVED] Configuration enumeration costs $O(|\mathcal C_P||\mathcal C_D|\,C_{\rm sim})$ for naive joint search; decoupling phases reduces candidate evaluations only under the assumed transport/placement independence. Online routing scans candidate instances or uses an indexed policy. Parameters can be duplicated across phase pools; KV may temporarily exist at both endpoints; packing requires extra buffers. HBM reads/writes, network bytes, CPU serialization, and collective resharding all count. Energy includes both pools and transport; money includes reserved idle capacity and unsuccessful prefill work.

## Algorithm

### Algorithm 44.4 - Bounded state-handoff transaction

[DERIVED] Inputs are request epoch $e$, compatible source/target layouts, finite deadline $d$, destination capacity and transport. The source is quiesced for this handoff: it retains state references but cannot concurrently continue decode. State includes a durable ownership record, source references, destination reservations, copied ranges and phase $\zeta\in\{\mathrm{PREPARED},\mathrm{READY},\mathrm{COMMITTED}\}$. Output is a known committed owner, a known failed/cancelled handoff, or an explicitly unresolved commit.

$$
\begin{aligned}
1.\;&\operatorname{validate}(\operatorname{model},\operatorname{namespace},\operatorname{layout},e);
 \quad\neg\operatorname{valid}\Rightarrow\operatorname{fail\_and\_return}.\\
2.\;&\operatorname{reserve\_target}(V,e)\text{ fails}
 \Rightarrow\text{bounded retry of 2 before }d\text{ or reject and return};\quad
 \operatorname{pin\_source}(e);\ \zeta\leftarrow\mathrm{PREPARED}.\\
3.\;&\operatorname{publish\_immutable\_manifest}(e,\operatorname{positions},\operatorname{ranges});
 \quad\operatorname{submit\_transfer}(\operatorname{ranges},e).\\
4.\;&\text{error, cancellation or expiry before commit}
 \Rightarrow\operatorname{quiesce\_or\_quarantine};\quad
 \operatorname{invalidate\_provisional\_target};\quad
 \operatorname{safe\_release\_and\_return\_failed}.\\
5.\;&\text{all ranges complete and validated, epoch current, before }d
 \Rightarrow\zeta\leftarrow\mathrm{READY};\quad
 \operatorname{AtomicOwnerCAS}(e,\operatorname{source},\operatorname{target},\mathrm{READY}).\\
6.\;&\text{commit known successful}\Rightarrow
 (\zeta\leftarrow\mathrm{COMMITTED};\ \operatorname{release\_handoff\_reference};\ \operatorname{resume\_target});\\
&\text{commit known rejected}\Rightarrow\operatorname{abort\_provisional\_handoff};\quad
 \text{commit unknown}\Rightarrow\operatorname{reconcile\_ownership\_before\_replay}.
\end{aligned}
$$
*(Eq. 44.20)*

[DERIVED] The readiness predicate gates the ownership commit; validation failure cannot fall through into a commit. All reservation and reconciliation retries have finite attempt limits and the original deadline. A missing acknowledgement after the atomic ownership transition is not evidence that the transition failed. Reconciliation returns the recorded owner or an unresolved result; neither endpoint starts an additional decode while ownership is unknown. Once committed, cancellation is handled by the current owner and cannot roll back a historical transfer as if it were still provisional. Buffers touched by uncancellable transport remain quarantined until last use, including on timeout. Source cache retention after handoff is a separate reuse policy. Invariants are no read of incomplete ranges, no freed in-flight buffer and one fenced execution owner per epoch, conditional on the declared atomic ownership service and enforcement at both executors. This contract connects [local cache commit](../../part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-3-cache-organization.md) to [runtime publication](../ch43-runtime-architecture-and-inference-engine-selection/43-1-runtime-decomposition.md) and [retry identity](../ch46-admission-control-routing-autoscaling-and-service-contracts/46-5-resilience.md). Complexity is $O(n_{\rm ranges})$ metadata plus payload transfer; deadline termination bounds waiting, not successful handoff.

## Implementation

[OFFICIAL-DOCUMENTATION] The inspected DistServe engine creates aligned placement groups, initializes separate context/decode engines through a bridge queue, and registers source KV handles with decode [R44.14](references.md), engine.py, _init_placement_groups and initialize. Mooncake Transfer Engine exposes batch allocation/submission/status and buffer-registration interfaces [R44.15](references.md), transfer_engine.h. These source inspections were not executed and are explicitly unpinned.

[DERIVED] **vLLM/SGLang** (§4 #41/#42, Inference engine), **PyTorch** (§4 #17, Model / autograd), and **NVIDIA NCCL** (§4 #4, Kernels / collectives) are the numbered stack. DistServe/Mooncake are method-specific anchors outside it. The concrete path is allocator-owned state → optional pack/reshard → registered transport buffers → completion notification → validated block tables → resumed attention. A transport's ability to move bytes is not a proof that a request can be resumed with its sampling, position, adapter, and cancellation state intact.

## Experimental design

### Reported experiments

[PAPER-REPORTED] DistServe evaluates FP16 OPT models and Poisson arrivals with source dataset lengths. Its physical placement keeps corresponding phase segments within a node; the high-bandwidth placement and vLLM++ parallelism-search ablation are simulated [P38](references.md), §§6.1–6.4.

| Evidence/context | Disclosed setting |
|---|---|
| [PAPER-REPORTED] Hardware | Four nodes, 32 A100-80GB GPUs, intra-node NVLink, 25 Gbps cross-node |
| [PAPER-REPORTED] Models/work | OPT-13B/66B/175B; ShareGPT, HumanEval, LongBench; Poisson arrivals, variable dataset lengths |
| [PAPER-REPORTED] Precision/runtime/concurrency | FP16; archival DistServe versus archival vLLM; workload rate and placement varied |
| [PAPER-REPORTED] Boundary/outcome | Joint TTFT/TPOT attainment; OPT-175B ShareGPT transfer CDF: over 95% below 30 ms with aligned intra-node handoff |
| [NOT-DISCLOSED] Uncertainty | No seed confidence interval for that transfer CDF in inspected §6.3 |

[DERIVED] The measured transfer distribution is evidence about aligned handoff on that topology. It cannot validate Eq. 44.16 with an arbitrary cross-node $B_{\rm eff}$. The source's simulator comparison checks selected attainment values; it does not independently validate every candidate mesh or a different transport implementation.

## Observations

**What the paper claims.** [PAPER-REPORTED] DistServe reports goodput improvements from separated execution plus placement optimization [P38](references.md), §6.

**What the evidence shows.** [DERIVED] The placement-controlled result supports the combined mechanism in its studied regime. The simulated vLLM++ control addresses parallel-plan selection, while the physical topology avoids the slow inter-node KV path. Neither establishes costless disaggregation.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 44.17 gives a directly falsifiable break-even condition. Removed interference must exceed exposed state movement, extra queueing, routing, and any loss of batching efficiency; Eq. 44.19 determines where that cost appears to the client.

**What remains unknown.** [UNVERIFIED] Current multi-tenant transport contention, transient ownership failures, and full reconfiguration costs have not been validated by this chapter. Disaggregation's optimal boundary under rapidly changing reuse remains an open systems question.

## Failure modes

> **Failure mode — Queue relocated to a hidden buffer.** [DERIVED] *Symptom:* decode HBM looks healthy while prefill holds growing completed state. *Cause:* pull-based backpressure without bounded retained capacity. *Detection:* ready-but-unconsumed byte-seconds and oldest handoff age. *Mitigation:* reserve source headroom, bound inflight handoffs, and reject before wasted work.

> **Failure mode — Publication boundary hides the stall.** [DERIVED] *Symptom:* good TTFT but a long first-to-second-token gap. *Cause:* streaming before decode readiness. *Detection:* per-token timeline spanning both pools. *Mitigation:* include that gap in the service contract and handoff deadline.

## Siblings

[DERIVED] **Colocated chunking** [§44.2](44-2-prefill-management.md) pays local interference/fragmentation but avoids a cross-instance handoff. **Intra-node disaggregation** spends duplicated model capacity to obtain a faster state path. **Cross-node disaggregation** relaxes placement but consumes shared fabric bandwidth. **State-store-mediated handoff** can extend reuse and independence while adding another capacity/transfer boundary. Compare them under equal total resources and compatible latency definitions.

```figure
{
  "id": "fig-44.14",
  "kind": "compare",
  "title": "Disaggregation boundaries and costs",
  "caption": "Equal-budget comparison must include topology, duplicated weights, queue ownership, and the state movement path.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-44.17",
  "alt": "Equal-budget comparison must include topology, duplicated weights, queue ownership, and the state movement path. Values and structures are analytical; no measured model performance is shown.",
  "spec": {
    "axis": "Resource coupling changed by phase placement",
    "columns": [
      {
        "id": "colo",
        "label": "Colocated"
      },
      {
        "id": "local",
        "label": "Separate local GPUs"
      },
      {
        "id": "remote",
        "label": "Separate nodes"
      }
    ],
    "rows": [
      {
        "dimension": "Phase interference",
        "values": {
          "colo": "shared device",
          "local": "separate execution",
          "remote": "separate execution"
        }
      },
      {
        "dimension": "State handoff",
        "values": {
          "colo": "local references",
          "local": "local-fabric transfer",
          "remote": "shared-network transfer"
        }
      },
      {
        "dimension": "New constraint",
        "values": {
          "colo": "mixed scheduling",
          "local": "duplicated capacity and queue",
          "remote": "network cuts and failure groups"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] Mooncake changes placement to center reusable distributed state and overload-oriented phase coordination; [§44.6](44-6-load-adaptation.md) covers its rejection experiment [R44.3](references.md). MFS adds stage-aware network priorities, and BiScale adds phase-aware energy control; §§44.5–44.6 separate their physical evidence, simulation, and steady-state limitations [R44.7](references.md); [R44.8](references.md). These extensions solve new coupling terms rather than making Eq. 44.17 unnecessary.

## Limitations

> **Open question.** [DERIVED] What workload/topology region makes disaggregation jointly optimal in quality-constrained goodput, energy, and resource cost after transition overhead? · *what evidence would settle it:* equal-budget colocated and separated implementations with traced queue, transfer, overlap, failures, and startup/drain costs over the same nonstationary workload.

[DERIVED] Average stability is weaker than deadline feasibility, and first-token feasibility is weaker than streaming continuity. The handoff model assumes compatible state, known transfer ranges, and a declared overlap schedule. Alternative KV precision, compression, or approximate state reuse changes the model contract and belongs in the relevant algorithm chapter before serving costs are compared.

## Reproducibility

[DERIVED] Record phase meshes, placement, transport revision, registered-memory method, buffer packing, state layout, NIC/GPU topology, shared traffic, copy overlap, first-token publication, queue ownership, and failed/cancelled transfers. Retain both attempted and accepted request denominators. The proposed break-even experiment is in [verification.md](verification.md); no book measurements are implied.

## References

[DERIVED] [P38](references.md) §§3–6, Algorithms 1–2, Table 2; [R44.3](references.md) §§5–7; [R44.7](references.md) §§3–6; [R44.8](references.md) §§4–6; [R44.11](references.md) allocation policy; [R44.14](references.md) engine source; [R44.15](references.md) transport interfaces.
