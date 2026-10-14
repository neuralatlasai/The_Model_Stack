---
id: "ms.section.44.3"
entity_type: "section"
title: "44.3 — Prefix and state placement"
volume: 2
part: 8
chapter: 44
section: 44.3
slug: "44-3-prefix-and-state-placement"
parent: "ms.chapter.44"
prev_sibling: "ms.section.44.2"
next_sibling: "ms.section.44.4"
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

# 44.3 — Prefix and state placement

## Scope

[DERIVED] This section owns assigning requests and reusable prefix state to replicas, balancing locality against queueing, choosing eviction/replication, and enforcing cache-sharing trust boundaries. It assumes the state representation and byte accounting of Chapter 42. The baseline is identical model instances with round-robin or load-only routing and local prefix reuse. Success is lower resource cost and deadline-compliant service without unauthorized sharing, stale-state reads, or systematic exclusion of low-reuse tenants.

## Why this exists

[MATHEMATICALLY-DERIVED] Prefix reuse saves prompt computation only when compatible state is present where execution occurs, or can arrive cheaply enough. Sending every matching request to one warm replica can create a queue longer than the saved computation. Sending requests evenly can disperse each prefix's demand across replicas and reduce locality. Placement therefore couples present-request latency, future cache occupancy, and the load induced by subsequent arrivals.

[PAPER-REPORTED] SGLang retains prompt/output state in a radix tree, protects actively referenced nodes, evicts unused leaves, and schedules for prefix reuse [P37](references.md), §3. Preble extends the decision to a global prefix-location index and per-replica local scheduler [R44.4](references.md), §4. These are different levels of control; a fast local hit does not by itself determine the best cluster destination.

[DERIVED] A shared prefix is a resource with an externality. Retaining it can save work for many later requests, but consumes capacity that could admit a currently waiting sequence. Evicting it may accelerate one request now and impose recomputation later. The scheduler cannot evaluate this tradeoff from hit rate alone: it must attach cost, arrival distribution, and capacity to the reuse.

## Intuition

[MATHEMATICALLY-DERIVED] The simplest routing inequality compares warm-queue delay with cold recomputation. If replica A saves $g$ seconds of prefill but has $g+\varepsilon$ more waiting time than replica B, the cold destination is faster for the present request, before considering transfer. A high hit rate can therefore coincide with worse latency. Conversely, avoiding every warm queue can repeatedly pay large recomputation costs and destabilize the whole cluster.

## Formulation

> **Definition — Cache-aware routing.** [DERIVED] Choosing an execution destination using both compatible reusable-state location and predicted service/queue costs, subject to authorization and resource constraints.

> **Definition — Cache-sharing namespace.** [DERIVED] An authorization domain incorporated into state identity so reuse can occur only among requests explicitly permitted to share that state.

| Symbol | Meaning and unit |
|---|---|
| $p_r,m_{rj}$ | Prompt tokens and compatible cached prefix tokens at replica $j$ |
| $w_j,t_j(p,m)$ | Predicted waiting and remaining prefill time in seconds |
| $x_{ij}(v)$ | Predicted transfer time for $v$ state bytes from $i$ to $j$ |
| $e_j(r)$ | Opportunity cost of evictions needed to admit $r$, in time-equivalent units |
| $H,W$ | Recent request-count and reuse-history windows |
| $z_b,n_b$ | State-block identity and active reference count |

[DERIVED] A book reconstruction of a locality/load score is
$$
C_j(r)=\widehat w_j+\widehat t_j(p_r,m_{rj})
+\widehat x_j(r)+\widehat e_j(r),\qquad
j^\star=\arg\min_{j\in\mathcal F_r}C_j(r),
$$
*(Eq. 44.11)*

where $\mathcal F_r$ contains authorized, model-compatible, memory-feasible destinations. All terms use seconds or an explicitly calibrated time-equivalent cost. This is not asserted as the exact objective of every cited system: it isolates the common placement tradeoff and makes incompatible terms visible.

[MATHEMATICALLY-DERIVED] A recompute-versus-fetch decision at a destination is
$$
\operatorname{fetch}\ \Longleftrightarrow\
\widehat x_{ij}(v)+\widehat t_j(p,m_{\rm remote})
<\widehat t_j(p,m_{\rm local}),
$$
*(Eq. 44.12)*

where queue effects that differ between the two paths must also be added. Prefix bytes alone do not determine the inequality; sender congestion, registration, and destination format conversion can dominate small transfers.

```figure
{
  "id": "fig-44.9",
  "kind": "diagram",
  "title": "Authorized cache placement and revalidation",
  "caption": "Compatibility filters candidates before locality/load scoring. Pinning and reservation turn a tentative location into an executable assignment.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-44.11",
  "alt": "Compatibility filters candidates before locality/load scoring. Pinning and reservation turn a tentative location into an executable assignment. The figure is an analytical structure or illustrative configuration, not a measured model result.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "r",
        "kind": "tensor",
        "label": "tokens and model identity"
      },
      {
        "id": "n",
        "kind": "boundary",
        "label": "authenticated namespace"
      },
      {
        "id": "i",
        "kind": "memory",
        "label": "prefix location index"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "score queue and missing work"
      },
      {
        "id": "v",
        "kind": "branch",
        "label": "pin and reserve valid"
      },
      {
        "id": "e",
        "kind": "process",
        "label": "enqueue at epoch"
      }
    ],
    "edges": [
      {
        "from": "r",
        "to": "n",
        "kind": "flow"
      },
      {
        "from": "n",
        "to": "i",
        "kind": "flow"
      },
      {
        "from": "i",
        "to": "s",
        "kind": "flow"
      },
      {
        "from": "s",
        "to": "v",
        "kind": "flow"
      },
      {
        "from": "v",
        "to": "e",
        "kind": "flow",
        "label": "valid"
      },
      {
        "from": "v",
        "to": "i",
        "kind": "flow",
        "label": "stale or unavailable"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] Preble's global radix nodes record token spans, GPU locations, and recent sharing counts. Its E2 prose chooses exploitation when cached prompt work exceeds uncached work: select among holders of the key portion using estimated load. Otherwise exploration considers history-based load, eviction recomputation cost, and current missed-prefix prefill; a decode-heavy destination can receive preferential uncached work [R44.4](references.md), §4.2, Algorithms 1–2. The v1 printed Algorithm 1 condition differs from the prose; this chapter follows the explicit §4.2 explanation and records that discrepancy instead of silently merging them.

[PAPER-REPORTED] Preble then adjusts future assignments when load becomes imbalanced and replicates/splits a hot prefix subtree when queueing remains high. It does not migrate already running or queued requests in that adjustment. Locally, it chunks uncached work, evicts unused state, and places waiting requests into cache-percentage priority groups with proportional selection to preserve low-sharing service [R44.4](references.md), §§4.2–4.3. This method trades immediate maximum reuse for more balanced future demand; its history windows and thresholds require workload calibration.

[MATHEMATICALLY-DERIVED] To analyze a reusable block $b$, let expected authorized future hits before eviction be $\nu_b$, saved compute-time per hit be $g_b$, and retained byte-seconds be $v_b\ell_b$. A marginal retention rule can be written
$$
\nu_b g_b>\pi_M v_b\ell_b+c_{\rm bookkeeping}+c_{\rm transfer},
$$
*(Eq. 44.13)*

where $\pi_M$ is the opportunity price of occupied memory per byte-second, expressed in time-equivalent units. This is an analytical decision boundary, not a source-fitted predictor. Near an admission bottleneck $\pi_M$ can rise; a formerly valuable prefix may then be worth evicting even with frequent hits.

[DERIVED] Replication is justified by the change in total cost, not by popularity alone. A second copy can reduce the source's request queue and sender fan-out, but adds state capacity, transfer work, index updates, and future eviction pressure. Replicating a universal system prefix may help initial warmup; once every replica already holds it, cache-aware routing for that prefix no longer differentiates destinations. Long unique suffixes still require fresh work.

[DERIVED] Compatibility requires identical model state, tokenizer-derived token IDs, positional convention, relevant adapter identity, multimodal input identity, and execution policy for the cached prefix. A matching text substring is insufficient. A weight update invalidates state even when token IDs match. A local index can be stale: a miss should trigger revalidation/recomputation or a documented transfer path, never dereference recycled memory through an old location.

[OFFICIAL-DOCUMENTATION] Current vLLM documentation hashes full blocks using parent hash, block tokens, and additional identities including adapters, multimodal inputs, and optional cache_salt. The salt enters the first block and restricts reuse to matching salts [R44.10](references.md), “Automatic Prefix Caching” and “Cache Isolation for Security.” These are documented namespace mechanics, not a proof of complete tenant isolation.

[MATHEMATICALLY-DERIVED] Hashing a namespace into the chain prevents cross-namespace cache matches under the assumed collision-resistant identity construction, but it does not isolate shared queue timing, GPU occupancy, host memory, or network traffic. The namespace must be authenticated by the server's policy; an attacker choosing another tenant's public salt would defeat that authorization premise. Separate capacity quotas and service accounting are therefore distinct controls.

```figure
{
  "id": "fig-44.10",
  "kind": "calculator",
  "title": "Fetch versus recomputation advantage",
  "caption": "Positive advantage favors fetching under Eq. 44.12. Queue differences must be added when they differ; defaults are illustrative seconds.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-44.12",
  "alt": "Positive advantage favors fetching under Eq. 44.12. Queue differences must be added when they differ; defaults are illustrative seconds. The figure is an analytical structure or illustrative configuration, not a measured model result.",
  "spec": {
    "tex": "\\Delta=T_{local}-T_{fetch}-T_{remote}",
    "equation": "44.12",
    "inputs": [
      {
        "symbol": "local",
        "label": "local remaining prefill",
        "default": 0.3,
        "min": 0,
        "max": 10,
        "format": "seconds"
      },
      {
        "symbol": "fetch",
        "label": "state fetch",
        "default": 0.08,
        "min": 0,
        "max": 10,
        "format": "seconds"
      },
      {
        "symbol": "remote",
        "label": "prefill after fetch",
        "default": 0.05,
        "min": 0,
        "max": 10,
        "format": "seconds"
      }
    ],
    "outputs": [
      {
        "symbol": "delta",
        "label": "fetch advantage seconds",
        "formula": "local-fetch-remote",
        "format": "seconds",
        "emphasis": true
      }
    ]
  }
}
```

[DERIVED] Eviction must preserve active readers. A block with $n_b>0$ is pinned; selecting it as a victim would convert a performance policy into a correctness error. Unreferenced radix leaves can be removed while their shared ancestors remain useful. If an evicted block is being copied remotely, either the copy holds a reference through completion or cancellation waits for the transport completion boundary. Reference-count decrement and reuse publication require a consistent epoch.

[MATHEMATICALLY-DERIVED] Naive matching across $J$ replicas and prompt length $P$ costs $O(JP)$ token comparisons; a global compressed prefix index can share the traversal and then inspect candidate locations. The exact bound depends on branching/search representation. Scoring $J$ candidates costs $O(J)$ with cached load summaries; recomputing every historical eviction consequence can be much more expensive. Metadata includes tree nodes, locations, history counters, and active references; payload includes each physical replica of a block. Parameters and likelihood objective are unchanged. Prefill FLOPs can fall while sender traffic and retained capacity rise, so energy and money need a declared system boundary.

## Algorithm

### Algorithm 44.3 — Authorized locality/load placement

[DERIVED] Inputs are tokenized request $r$, authenticated namespace, model/policy revision, global index snapshot, destination loads, and eviction/transfer estimates. Output is a reserved destination and pinned reusable prefix, or a deferral. This is a conservative explanatory reconstruction of the decision contract, not a literal E2 implementation.

$$
\begin{aligned}
1.\;&z_0\gets H(\operatorname{namespace},\operatorname{model},\operatorname{policy});
\quad z_b\gets H(z_{b-1},\operatorname{tokens}_b,\operatorname{extra}_b).\\
2.\;&\mathcal F\gets\operatorname{compatible\_authorized\_replicas}(r);
\quad \mathcal F=\varnothing\Rightarrow\operatorname{reject\_unsupported}.\\
3.\;&\mathcal F=\varnothing\Rightarrow\operatorname{release\_owned\_references\ and\ defer\_or\_reject};\quad\forall j\in\mathcal F:\space
m_j\gets\operatorname{validated\_prefix}(z,j),\
C_j\gets\widehat w_j+\widehat t_j+\widehat x_j+\widehat e_j.\\
4.\;&j\gets\arg\min C_j;\quad
\operatorname{pin\_and\_reserve}(j,m_j)\text{ fails}
\Rightarrow\mathcal F\gets\mathcal F\setminus\{j\};\ \text{return to 3}.\\
5.\;&\operatorname{remote\_fetch\_chosen}
\Rightarrow\operatorname{pin\_source};\space
\operatorname{transfer\_fails}\Rightarrow
\operatorname{release\_partial\_copy\ and\ replan}.\\
6.\;&\operatorname{reservation\_valid}
\Rightarrow\operatorname{enqueue}(r,j,\operatorname{epoch});
\quad\operatorname{cancelled}\Rightarrow\operatorname{release\_all\_owned\_references}.
\end{aligned}
$$
*(Eq. 44.14)*

where destination attempts are capped by $|\mathcal F|$ and transfer retries by a finite request deadline. Invariants are namespace compatibility, no eviction of pinned blocks, no unverified partial state as a hit, and one destination admission per request epoch. A failed transfer does not silently relax authorization.

## Implementation

[OFFICIAL-DOCUMENTATION] SGLang's inspected radix-cache source exposes matching, insertion, reference increments/decrements, and eviction paths [R44.16](references.md), radix_cache.py. Mooncake's current official repository distinguishes Transfer Engine from Store, including placement/replication/eviction policies [R44.15](references.md), README “Transfer Engine” and “Mooncake Store.” These unpinned official sources establish available surfaces; they were not executed or equated with the 2024 paper.

[DERIVED] **SGLang** and **vLLM** are reference-stack Inference engines (§4 #42/#41); **PyTorch** supplies Model / autograd (§4 #17). Preble and Mooncake are outside the numbered system stack, included through the chapter's cache-aware serving/disaggregation anchors. The relevant execution path is token/hash construction on CPU, block-reference validation, allocator reservation, optional transport into compatible device memory, then attention over the referenced prefix. A global location map is control-plane metadata; it is not the KV tensor itself.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Preble uses five prompt-sharing workloads, Mistral-7B on two/four A6000 GPUs and Llama-3-70B on eight H100 GPUs configured as two TP4 replicas. Poisson arrivals and an Azure-timestamp mixed trace are separate protocols. Baselines include round-robin local-sharing engines and a manually chosen offline prefix partition; the latter is not a globally optimal scheduler [R44.4](references.md), §§5.2–5.3.

| Evidence/context | Disclosed setting |
|---|---|
| [PAPER-REPORTED] Preble ablation | Tool workload, Zipf 1.1 popularity, four A6000 GPUs, Mistral-7B |
| [PAPER-REPORTED] Metric/boundary | Mean and p99 complete-request latency including scheduler, queue, prefill, decode |
| [PAPER-REPORTED] Controlled changes | E2; post-assignment balancing/replication; phase-aware handling; local priority groups |
| [NOT-DISCLOSED] Precision/version/uncertainty | Exact backend commit, dtype and seed intervals are not specified for every plotted comparison in the inspected v1 text |

[PAPER-REPORTED] SGLang's original evaluation uses FP16 models, primarily A10G GPUs, and vLLM v0.2.5; §6.3 ablates cache/tree/scheduling features. Its long-output chat case has almost no speedup because decode dominates [P37](references.md), §§6.1–6.3. That negative case is pertinent to reuse economics and does not rank current releases.

## Observations

**What the paper claims.** [PAPER-REPORTED] Preble's incremental ablation reports improved tails from local fairness, without a mean-latency improvement from that final component [R44.4](references.md), §5.4.

**What the evidence shows.** [DERIVED] The source's mean-versus-p99 difference supports treating fairness as a separate objective. Its static “oracle partition” can lose to a dynamic policy because equal state partitions need not carry equal demand; the label does not imply an optimal latency bound.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 44.11 makes a cached destination preferable only when saved work exceeds extra queue/transfer/eviction costs. Eq. 44.13 shows why cache hit rate cannot determine economically useful reuse without capacity and future-demand assumptions.

**What remains unknown.** [UNVERIFIED] The inspected studies do not establish a common optimal policy for authenticated multi-tenant workloads, rapidly changing prefixes, and simultaneous network/compute contention. No local implementation check establishes those properties here.

## Failure modes

> **Failure mode — Hot-prefix queue collapse.** [DERIVED] *Symptom:* high hit rate with rising TTFT at a few replicas. *Cause:* locality-only routing concentrates demand. *Detection:* prefix-conditioned queue/service traces. *Mitigation:* include queue cost, replicate selectively, and limit pinned-state residency.

> **Failure mode — Unauthorized identity collision.** [DERIVED] *Symptom:* reuse across incompatible models or trust domains. *Cause:* incomplete or unauthenticated cache keys. *Detection:* audit identity components and namespace assignment. *Mitigation:* server-controlled authorization, complete keys, and version invalidation.

## Siblings

[DERIVED] **Round robin** balances identities while ignoring work and locality. **Least estimated load** accounts for work but can destroy reuse. **Longest-prefix routing** saves immediate recomputation but can amplify hotspots. **Joint locality/load routing** accounts for both at the cost of stale metadata and estimator dependence. **Request migration** [§44.6](44-6-load-adaptation.md) repairs placement after admission but incurs state movement; redirecting future requests does not pay that immediate migration cost.

```figure
{
  "id": "fig-44.11",
  "kind": "compare",
  "title": "Locality and load decisions",
  "caption": "Routing changes future cache distribution as well as present queueing; migration repairs an already admitted placement at additional movement cost.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-44.13",
  "alt": "Routing changes future cache distribution as well as present queueing; migration repairs an already admitted placement at additional movement cost. The figure is an analytical structure or illustrative configuration, not a measured model result.",
  "spec": {
    "axis": "Information used for destination choice",
    "columns": [
      {
        "id": "rr",
        "label": "Round robin"
      },
      {
        "id": "load",
        "label": "Load only"
      },
      {
        "id": "prefix",
        "label": "Prefix only"
      },
      {
        "id": "joint",
        "label": "Joint"
      }
    ],
    "rows": [
      {
        "dimension": "Queue estimate",
        "values": {
          "rr": "no",
          "load": "yes",
          "prefix": "no",
          "joint": "yes"
        }
      },
      {
        "dimension": "Compatible cached prefix",
        "values": {
          "rr": "no",
          "load": "no",
          "prefix": "yes",
          "joint": "yes"
        }
      },
      {
        "dimension": "Decision risk",
        "values": {
          "rr": "unequal work",
          "load": "repeated recompute",
          "prefix": "hotspots",
          "joint": "stale index and estimates"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The lineage from local radix reuse to Preble changes the placement decision and adds cache/fairness state; the ablation above isolates the latter's tail objective. Current Mooncake Store adds a separately managed distributed state surface [R44.15](references.md), “Mooncake Store,” while MFS coordinates the resulting network traffic with collective urgency [R44.7](references.md), §§3–5. The latter change is developed in §44.5 rather than treated as a better eviction score.

## Limitations

> **Open question.** [DERIVED] When does replication reduce total deadline failures after accounting for lost admission capacity and shared sender congestion? · *what evidence would settle it:* joint prefix-demand, byte-residency, transfer, and per-tenant latency measurements with controlled cache capacity and an explicit nonreplicating comparator.

[DERIVED] Prefix state is append-only only within a fixed compatible model/policy execution. Weight updates, changed positional scaling, approximate cache compression, and multimodal preprocessing can change compatibility. The routing mathematics does not authorize reusing numerically similar state or inferring private Kimi model internals from Mooncake.

## Reproducibility

[DERIVED] Retain actual tokenized prefixes, model/adapter/multimodal identities, authenticated namespaces, cache warmup, capacities, eviction epochs, replica topology, global-index lag, source/target transfer records, and per-tenant hit/queue/service distributions. Record Preble v1's algorithm/prose discrepancy when reconstructing E2. Source statements and unexecuted analytical procedures remain distinct.

## References

[DERIVED] [P37](references.md) §§3,6; [R44.4](references.md) §§4–5; [R44.7](references.md) §§3–5; [R44.10](references.md) prefix identity/isolation; [R44.15](references.md) current Mooncake repository; [R44.16](references.md) current radix-cache source.
