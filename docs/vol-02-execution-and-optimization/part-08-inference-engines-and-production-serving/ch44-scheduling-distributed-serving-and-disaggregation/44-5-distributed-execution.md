---
id: "ms.section.44.5"
entity_type: "section"
title: "44.5 — Distributed execution"
volume: 2
part: 8
chapter: 44
section: 44.5
slug: "44-5-distributed-execution"
parent: "ms.chapter.44"
prev_sibling: "ms.section.44.4"
next_sibling: "ms.section.44.6"
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
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# 44.5 — Distributed execution

## Scope

[DERIVED] This section owns scheduling across phase-specific parallel meshes, expert-load imbalance, shared-network priorities, heterogeneous pools, and multi-node failure boundaries. It assumes the collective and sharding mathematics of Chapter 29 and state-resource models of Chapter 42. Success requires compatible execution semantics, balanced critical-path work, deadline-aware communication, and bounded failure recovery. A larger GPU count or a faster isolated collective is insufficient evidence of better serving.

## Why this exists

[MATHEMATICALLY-DERIVED] A distributed iteration completes when its required ranks and communication dependencies complete. Balancing average GPU work can leave a single overloaded expert rank or network cut on the critical path. Conversely, moving work to a less busy GPU can increase communication enough to make the iteration slower. Request scheduling, expert placement, and network arbitration therefore optimize different but interacting objects.

[PAPER-REPORTED] The 2026 MFS paper explicitly coordinates reusable-KV traffic, computation-blocking collectives, and prefill-to-decode handoffs rather than minimizing each flow's completion time independently [R44.7](references.md), §§3–5. This changes the scheduling unit from an isolated transfer to a dependency-aware request execution graph.

[DERIVED] Parallel-degree selection also changes admission capacity. More ranks can shard parameters and free per-GPU state space, while increasing synchronization, reducing per-rank matrix sizes, and enlarging the failure group. A phase configuration that improves single-request latency can reduce replicas available under a fixed cluster budget. Serving needs the joint latency/capacity decision, not a training-derived preference for maximum parallelism.

## Intuition

[MATHEMATICALLY-DERIVED] Consider one collect-and-compute dependency: a ready collective that enables the next layer and a handoff whose deadline is still far away. Giving the latter bandwidth can leave every compute rank idle even if it minimizes that transfer's completion time. Deferring it until urgency increases can improve request progress. The converse holds near its final deadline: indefinite collective priority can make the handoff late. Priority must evolve with the dependency and remaining slack.

## Formulation

| Symbol | Meaning and unit |
|---|---|
| $\mathcal G_c,\mathcal E_c$ | Rank group and execution DAG for configuration $c$ |
| $t_v,\mathcal P_c$ | Task duration and dependency paths |
| $n_e,r_e$ | Estimated token load for logical expert $e$ and its physical replica count |
| $\ell_j,C_j$ | Assigned expert work and effective compute rate of rank $j$ |
| $V_f,D_f,t,B,\rho$ | Flow bytes remaining, deadline/current time, link bytes/s, other load fraction |
| $L_{\rm target},L_{\rm curr}$ | Consuming layer and current layer |
| $K$ | Number of available priority levels |

[MATHEMATICALLY-DERIVED] A dependency lower bound is
$$
T_c\ge\max_{\pi\in\mathcal P_c}\sum_{v\in\pi}t_v,
\qquad
T_{\rm expert}\ge\max_j\frac{\ell_j}{C_j}.
$$
*(Eq. 44.21)*

where task durations must exclude overlapping intervals already represented elsewhere. The second bound ignores communication and launch costs. It explains why mean expert load is not a completion-time predictor.

[DERIVED] Mesh axes require explicit rank membership. TP, PP, attention data parallelism, expert parallelism, and sequence/context parallelism are not always independent Cartesian dimensions. Multiplying every flag value can double-count ranks when an implementation reuses a group for multiple roles. The configuration record must list actual groups, layer ownership, expert ownership, and per-phase compatible state layouts, then derive its total GPU cost from that record.

```figure
{
  "id": "fig-44.15",
  "kind": "diagram",
  "title": "Distributed serving dependency graph",
  "caption": "A current-layer collective can block compute while a future reuse fetch or final handoff has slack. Expert compute and network scheduling are separate bottlenecks.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-44.21",
  "alt": "A current-layer collective can block compute while a future reuse fetch or final handoff has slack. Expert compute and network scheduling are separate bottlenecks. Values and structures are analytical; no measured model performance is shown.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "r",
        "kind": "flow",
        "label": "lookahead reusable KV"
      },
      {
        "id": "a",
        "kind": "process",
        "label": "attention"
      },
      {
        "id": "x",
        "kind": "flow",
        "label": "expert dispatch"
      },
      {
        "id": "e",
        "kind": "hardware",
        "label": "expert ranks"
      },
      {
        "id": "c",
        "kind": "flow",
        "label": "expert combine"
      },
      {
        "id": "l",
        "kind": "process",
        "label": "next layer"
      },
      {
        "id": "h",
        "kind": "flow",
        "label": "final handoff"
      }
    ],
    "edges": [
      {
        "from": "r",
        "to": "a",
        "kind": "flow"
      },
      {
        "from": "a",
        "to": "x",
        "kind": "flow"
      },
      {
        "from": "x",
        "to": "e",
        "kind": "flow"
      },
      {
        "from": "e",
        "to": "c",
        "kind": "flow"
      },
      {
        "from": "c",
        "to": "l",
        "kind": "flow"
      },
      {
        "from": "l",
        "to": "h",
        "kind": "flow"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[OFFICIAL-DOCUMENTATION] DeepSeek's EPLB source takes per-layer expert loads, greedily adds replicas to the expert with largest load divided by current replica count, then packs descending per-replica loads into the lightest nonfull equal-slot bins. Its hierarchical policy first packs expert groups to nodes, replicates within nodes, then packs GPUs; the global policy removes the grouping constraint [R44.18](references.md), README and eplb.py, replicate_experts, balanced_packing, rebalance_experts. Load prediction is explicitly outside that repository's scope.

[MATHEMATICALLY-DERIVED] The replication subproblem under equal splitting and identical replica cost is
$$
\min_{\substack{r_e\ge1,\ r_e\in\mathbb N\\\sum_er_e=R}}
\max_e\frac{n_e}{r_e}.
$$
*(Eq. 44.22)*

where $R$ is total physical expert slots. Real execution adds rank packing, routing locality, unequal device rates, and transition costs. Balancing this scalar subproblem is therefore not a proof of globally optimal MoE serving. Replicas retain identical expert parameters; dropping routed experts would instead change model computation.

[PAPER-REPORTED] MFS assigns explicit-deadline handoffs a Minimal Link Utilization and implicit-deadline work a Relative Layer Index:
$$
\operatorname{MLU}_f(t)=
\frac{V_f}{(D_f-t)B(1-\rho)},\qquad
\operatorname{RLI}_f=L_{\rm target}-L_{\rm curr}.
$$
*(Eq. 44.23)*

where the MLU denominator is estimated residual link capacity [R44.7](references.md), §§4.3–4.4. MLU above one means infeasibility under that estimate; a nonpositive time budget needs an immediate failure/overload branch. A current-layer collective has RLI zero and outranks a future-layer reuse fetch within the structural ordering.

[PAPER-REPORTED] The reverse multi-level queue initially defers nonurgent handoffs, then promotes them as MLU increases; implicit flows rise as their consuming layer approaches. Message priorities change at layer boundaries to avoid packet reordering, with periodic promotion after compute finishes. The most urgent explicit-deadline traffic receives a reserved highest level; remaining levels prefer early-stage work and break ties by inter-request urgency [R44.7](references.md), §§4.3–4.5. Geometric promotion thresholds approximate a relative-error criterion; they are not a globally optimal deadline schedule.

[PAPER-REPORTED] Across requests, MFS splits a batch at its largest deadline gap and forms a Robust Effective Deadline as the tight-group fraction times its earliest deadline plus the loose-group fraction times its earliest deadline. This reduces priority inheritance by a rare urgent outlier. Estimated infeasible batches are pruned by removing the largest delay contributors; arrival/departure events update the ordering [R44.7](references.md), §4.4.2. The resulting policy deliberately trades individual-request treatment for aggregate feasible attainment.

[DERIVED] The paper's minimum-RLI theorem assumes ideal computation and no preemption overhead, and concerns its structural ordering [R44.7](references.md), Theorem 1. It does not prove global SLO optimality under competing requests, finite switch queues, inaccurate residual bandwidth, or failed ranks. An exchange argument for moving future work out of a present blocking interval needs a later overlap opportunity and no adverse new bottleneck; these premises should remain attached to the claim.

[DERIVED] Heterogeneous pools require rates specific to phase, batch shape, dtype, and topology. A device with lower isolated compute can still be useful for memory-limited decode, but only if state, kernel, and network compatibility hold. Group-synchronous work must account for its slowest participant; treating unlike GPUs as equal expert bins invalidates Eq. 44.22's equal-cost premise. Resharding or quantization conversion is paid work, not an automatic property of routing.

```figure
{
  "id": "fig-44.16",
  "kind": "calculator",
  "title": "Deadline residual link utilization",
  "caption": "MLU exceeds one when the modeled residual bandwidth cannot deliver the remaining payload before deadline. Illustrative link and flow, not measured traffic.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-44.23",
  "alt": "MLU exceeds one when the modeled residual bandwidth cannot deliver the remaining payload before deadline. Illustrative link and flow, not measured traffic. Values and structures are analytical; no measured model performance is shown.",
  "spec": {
    "tex": "U=V/(t B(1-\\rho))",
    "equation": "44.23",
    "inputs": [
      {
        "symbol": "V",
        "label": "remaining bytes",
        "default": 1073741824,
        "min": 1,
        "max": 137438953472,
        "format": "bytes"
      },
      {
        "symbol": "t",
        "label": "remaining seconds",
        "default": 0.2,
        "min": 0.001,
        "max": 10,
        "format": "seconds"
      },
      {
        "symbol": "B",
        "label": "link bytes per second",
        "default": 12500000000,
        "min": 1000000,
        "max": 1000000000000,
        "format": "bytes/s"
      },
      {
        "symbol": "rho",
        "label": "other link load",
        "default": 0.3,
        "min": 0,
        "max": 0.99,
        "format": "ratio"
      }
    ],
    "outputs": [
      {
        "symbol": "U",
        "label": "minimal utilization",
        "formula": "V/(t*B*(1-rho))",
        "format": "ratio",
        "emphasis": true
      }
    ]
  }
}
```

[OFFICIAL-DOCUMENTATION] Current SGLang documents separate MoE communication/computation backends, normal versus low-latency dispatch, and EPLB integration [R44.17](references.md), “Supported Backends,” “Workload Balancer.” Its dispatch → permutation → grouped GEMM → combine decomposition makes layout conversion explicit. Availability and configuration constraints are documented; no advertised overlap speedup is adopted as a book result.

[MATHEMATICALLY-DERIVED] If $F$ flows are ordered by a heap, event handling costs $O(\log F)$ per update; a finite-level queue can reduce selection overhead while quantizing priority. Expert replication with $E$ experts and $R-E$ extra slots costs $O(E(R-E))$ for a naive maximum scan per layer. Sorting physical replicas costs $O(R\log R)$ and scanning $G$ candidate bins per replica costs $O(RG)$. Additional state includes flow metadata, load histories, logical/physical maps, replicated weights, transfer buffers, and cache. All-to-all payload and synchronization remain even after perfect load balancing. Energy/money additionally charge idle stragglers and expert remapping.

## Algorithm

### Algorithm 44.5 — Stage-aware communication arbitration

[DERIVED] Inputs are flow metadata, dependency progress, estimated residual bandwidth, finite thresholds, and request deadlines. Output is a permitted transfer with a priority class. This bounded reconstruction describes MFS's stage distinction while exposing its infeasibility branch.

$$
\begin{aligned}
1.\;&\mathcal F\gets\operatorname{ready\_flows}(\operatorname{DAG},e);
\quad\operatorname{stale}(e)\Rightarrow\operatorname{discard\_metadata};\space
\mathcal F=\varnothing\Rightarrow\operatorname{return\_idle}.\\
2.\;&f\text{ explicit}:\space
D_f\le t\lor B(1-\rho)\le0
\Rightarrow\operatorname{remove\_and\_skip}(f);
\quad\text{otherwise }u_f\gets\operatorname{MLU}_f(t).\\
3.\;&f\text{ implicit}:\space
i_f\gets L_{\rm target}-L_{\rm curr};\
p_f\gets\operatorname{quantize\_RLI}(i_f).\\
4.\;&f\text{ explicit}:\space
p_f\gets\operatorname{monotone\_promote}(p_f,u_f);
\quad u_f>1\Rightarrow\operatorname{invoke\_overload\_policy}.\\
5.\;&\mathcal F\gets\operatorname{eligible\_defined\_priority}(\mathcal F);\quad
\mathcal F=\varnothing\Rightarrow\operatorname{return\_idle};\quad f^\star\gets\operatorname{highest\_urgent\_explicit\_else\_stage\_RLI\_RED}(\mathcal F);
\quad\operatorname{permit}(f^\star,p_{f^\star}).\\
6.\;&\operatorname{completion}\Rightarrow\operatorname{advance\_DAG};
\quad\operatorname{timeout\ or\ rank\ error}\Rightarrow\operatorname{abort\_epoch}.
\end{aligned}
$$
*(Eq. 44.24)*

where each event processes a finite ready set; outstanding events terminate at completion or deadline. Invariants are dependency readiness, stable message priority during submission, and no continuation of a failed collective epoch.

### Algorithm 44.6 — Replica allocation and equal-slot packing

[OFFICIAL-DOCUMENTATION] The following mathematical adaptation credits the inspected MIT-licensed EPLB procedure [R44.18](references.md); it is not an executed verification. Inputs are nonnegative load $n\in\mathbb R^{L_{\rm MoE}\times E}$, total slots $R\ge E$, and $G$ equal-slot GPU bins with $G\mid R$. Outputs are physical-to-logical and logical-to-physical expert maps plus replica counts for every layer.

$$
\begin{aligned}
1.\;&r_e\gets1;\quad\mathcal S\gets\{(e,1):1\le e\le E\}.\\
2.\;&\text{Repeat }R-E\text{ times: }e^\star\gets\arg\max_e n_e/r_e;\
r_{e^\star}\gets r_{e^\star}+1;\
\mathcal S\gets\mathcal S\cup\{(e^\star,r_{e^\star})\}.\\
3.\;&\operatorname{sort}(\mathcal S,\text{descending }n_e/r_e);\
\ell_j\gets0,\ c_j\gets0.\\
4.\;&\forall(e,k)\in\mathcal S:\space
j^\star\gets\arg\min_{j:c_j<R/G}\ell_j;\
\operatorname{place}(e,k,j^\star);\
(\ell_{j^\star},c_{j^\star})\gets
(\ell_{j^\star}+n_e/r_e,c_{j^\star}+1).\\
5.\;&\operatorname{validate\_maps\ and\ slot\ counts};
\quad\operatorname{invalid}\Rightarrow\operatorname{retain\_old\_placement};
\quad\operatorname{valid}\Rightarrow\operatorname{publish\_after\_weight\_readiness}.
\end{aligned}
$$
*(Eq. 44.25)*

where the global case is shown; the hierarchical case applies the same packing to node groups before within-node replication. Termination is finite by slot count. Every logical expert retains at least one identical physical copy, all bins respect capacity, and routing maps change only after weight readiness. The final publication/failure branch is a book execution contract, beyond the source's placement calculator.

## Implementation

[PAPER-REPORTED] MFS uses local daemons and a coordinator, shared-memory submit/permit/completion signaling, RDMA submission interception, and DSCP hardware priorities [R44.7](references.md), §5. Its demonstrated integration is with NCCL/Mooncake, not proof that every GPU-initiated transport can be intercepted at the same boundary.

[OFFICIAL-DOCUMENTATION] **NVIDIA NCCL** (§4 #4, Kernels / collectives) documents asynchronous error polling and abort/recreation after fatal communicator errors [R44.12](references.md), “Asynchronous errors and error handling.” A network error can leave operations unable to progress; waiting only for a successful stream completion is not a recovery mechanism.

[DERIVED] **PyTorch** (§4 #17, Model / autograd) and **vLLM/SGLang** (§4 #41/#42, Inference engine) provide the execution substrate. The scheduler must propagate one batch/mesh epoch consistently to every participating rank, preserve collective ordering, and fence failed epochs before reusing state. If a rank fails after a token was published, retry requires a declared replay/output-deduplication policy. Recreating a communicator restores a transport group; it does not recover the correct model state or client transcript by itself.

## Experimental design

### Reported experiments

[PAPER-REPORTED] MFS separates a physical testbed from large-scale event simulation [R44.7](references.md), §§6.1–6.3, Figures 10–15.

| Evidence/context | Physical Figure 10 | Simulation Figures 11–15 |
|---|---|---|
| [PAPER-REPORTED] Hardware | Eight servers × four RTX 3090; 16 prefill GPUs; dual 100 Gbps NICs/server; PCIe Gen3 | 256 eight-GPU servers; A100 latency profiles; modeled NVSwitch and 200 Gbps fat tree |
| [PAPER-REPORTED] Model/precision/mesh | Mixtral-8x7B, FP16, top-2, TP1/EP8 | Larger MoEs and dense sequence-parallel configurations; model-specific meshes |
| [PAPER-REPORTED] Workload | Qwen conversation/agent traces; mean lengths 2k/1k, reuse 50%/65%; Poisson arrivals | Qwen and long-context Mooncake traces |
| [PAPER-REPORTED] Concurrency/runtime | 8192 batched tokens; one request/s/GPU; CUDA12.8, PyTorch2.8, NCCL2.28 | Unified Vidur/flowsim event queue; 1:1 prefill/decode ratio |
| [PAPER-REPORTED] Boundary | 512 warmup then 1024 measured requests; output limited to one token; TTFT/CCT | TTFT attainment with default threshold 3× low-load TTFT |
| [PAPER-REPORTED] Outcome | Mean TTFT lower by 20.7%/32.3%; collective completion lower by 31.9%/43.1% | Larger headline attainment ratios include simulation |
| [NOT-DISCLOSED] Uncertainty | No repeated-run interval supplied for these Figure 10 percentages in inspected text | No physical validation of every simulated topology/model |

## Observations

**What the paper claims.** [PAPER-REPORTED] MFS improves TTFT attainment by protecting blocking communication and deferring nonurgent handoffs [R44.7](references.md), §6.

**What the evidence shows.** [DERIVED] The physical experiment supports mean-TTFT and collective-time improvements for its one-token Mixtral setup. It does not establish long decode continuity, multi-node fault recovery, or physical performance of the 256-server simulations. Separating those boundaries preserves the useful causal evidence.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 44.21 explains why shortening blocking communication can matter more than shortening a noncritical flow. Eq. 44.22 explains the separate role of expert replicas; traffic priority cannot repair overloaded expert compute by itself.

**What remains unknown.** [UNVERIFIED] No inspected source jointly establishes robust expert placement, fair cross-tenant flow priorities, energy efficiency, and recovery under correlated rank/network failures.

## Failure modes

> **Failure mode — Collective-order divergence.** [DERIVED] *Symptom:* some ranks wait indefinitely while others issue different collectives. *Cause:* inconsistent batch epoch or cancellation between dependent operations. *Detection:* rank-level operation sequence and async-error polling. *Mitigation:* coordinate epoch abort and recreate affected groups before replay.

> **Failure mode — Stale expert balance.** [DERIVED] *Symptom:* one expert rank dominates time after a workload shift. *Cause:* historical load estimates no longer represent routing. *Detection:* per-expert tokens and mean/max compute ratio. *Mitigation:* update statistics and remap with explicit transition cost and hysteresis.

## Siblings

[DERIVED] **TP/PP selection** changes parameter/layer partition and synchronization. **Expert replication** changes physical capacity assigned to identical logical experts. **Network urgency scheduling** changes transmission order without changing expert mathematics. **Heterogeneous placement** changes device rates and compatibility assumptions. Each acts on a different bottleneck; improvements cannot be multiplied without a joint experiment.

```figure
{
  "id": "fig-44.17",
  "kind": "compare",
  "title": "Mesh, expert, and traffic controls",
  "caption": "The controls act on different critical-path terms. Improving one can expose another; gains cannot be multiplied without joint evidence.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-44.21",
  "alt": "The controls act on different critical-path terms. Improving one can expose another; gains cannot be multiplied without joint evidence. Values and structures are analytical; no measured model performance is shown.",
  "spec": {
    "axis": "Object changed by the distributed decision",
    "columns": [
      {
        "id": "mesh",
        "label": "Parallel mesh"
      },
      {
        "id": "expert",
        "label": "Expert replicas"
      },
      {
        "id": "network",
        "label": "Flow priority"
      }
    ],
    "rows": [
      {
        "dimension": "Object",
        "values": {
          "mesh": "rank groups and shards",
          "expert": "logical-to-physical map",
          "network": "transmission order"
        }
      },
      {
        "dimension": "Main resource",
        "values": {
          "mesh": "parameters and synchronization",
          "expert": "weights and rank compute",
          "network": "shared link time"
        }
      },
      {
        "dimension": "Transition risk",
        "values": {
          "mesh": "reshard and group restart",
          "expert": "weight readiness and stale loads",
          "network": "quantized urgency and starvation"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] MFS extends phase separation by scheduling the communications created by reuse, parallel execution, and handoff as one dependency system. EPLB extends static expert assignment through load-informed replication and packing; the inspected repository supplies the calculator, not load-prediction or remapping-cost evidence. Current SGLang exposes both mechanisms' surrounding execution surfaces, but integration documentation is not evidence that their gains compose.

## Limitations

> **Open question.** [DERIVED] Can network-priority and expert-placement controllers avoid oscillation while sharing stale load estimates and finite state capacity? · *what evidence would settle it:* a joint control model with explicit delays and equal-budget traces that report remapping traffic, deadline misses, and per-tenant starvation under demand shifts.

[DERIVED] Failure-aware policy needs a declared fault model. A single-rank loss, temporary congestion, and a partition that allows both owners to continue require different recovery rules. Neither a placement heuristic nor a low-level transport failover establishes exactly-once token publication.

## Reproducibility

[DERIVED] Record actual rank groups, expert maps, load windows, node/NIC topology, communication backend, dtype, priority levels, packet/message granularity, runtime versions, deadline definition, and fault boundaries. Keep physical and simulated results in separate records. The current code/doc surfaces are unpinned and unexecuted; no execution-verified claims or book-measured performance claim is made.

## References

[DERIVED] [R44.7](references.md) §§3–6, Theorem 1, Figures 10–15; [R44.12](references.md) communicator error handling; [R44.17](references.md) EP documentation; [R44.18](references.md) EPLB README/source. Canonical parallel mathematics remains in Chapter 29.
