---
id: ms.section.45.5
entity_type: section
title: "Hybrid placement"
volume: 2
part: 8
chapter: 45
section: 45.5
slug: 45-5-hybrid-placement
parent: ms.chapter.45
prev_sibling: ms.section.45.4
next_sibling: ms.section.45.6
children: []
prerequisites: [ms.chapter.25, ms.chapter.37, ms.chapter.40, ms.chapter.41, ms.chapter.42, ms.chapter.43]
downstream: [ms.chapter.46, ms.chapter.47, ms.chapter.48]
related: []
siblings_by_mechanism: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [heterogeneous_execution, resource_accounting], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.llama-cpp, impl.apple-mlx-mlx-lm, impl.onnx-runtime, impl.openvino]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 45.5 Hybrid placement

## Scope

[DERIVED] Hybrid placement assigns tensors, operators and state to CPU, GPU or another supported processor under finite memory and transfer budgets. The baseline is either CPU-only execution or maximum GPU offload without a placement model. The objective is a feasible critical path for the actual prefill/decode distribution, including initialization and sustained operation. Model quantization remains in Chapter 40, cache reduction in Chapter 42 and general distributed execution in Chapter 26.

## Why this exists

[DERIVED] A model can exceed accelerator memory while fitting host memory. Alternatively, it can fit an integrated device's shared DRAM yet run poorly because CPU and accelerator contend for the same interface. Hybrid execution allows a feasible allocation in both cases, but the useful granularity differs. A contiguous layer partition can keep large weights stationary and cross only small activations; fine operator partitioning may expose faster kernels while creating many synchronization boundaries.

[DERIVED] "Offload" must identify what moves, when and how often. Static GPU layer offload places selected weights in GPU-accessible memory during initialization. At runtime, inputs, intermediate activations and any state crossing the partition move as needed. Dynamic weight streaming repeatedly brings nonresident weight blocks from a slower tier before use. A single diagram labelled CPU-to-GPU obscures this distinction and can overestimate static transfers by counting all weights per token, or underestimate streaming by charging only a startup copy.

## Intuition

[MATHEMATICALLY-DERIVED] Moving work is beneficial only when the saved execution time exceeds added transfer, synchronization and preparation time on the relevant critical path. The decision depends on shape. A large prompt matrix can amortize a boundary that is expensive for a one-token matrix-vector operation. A placement optimized only for prefill can therefore increase inter-token latency. Using the same model and output contract does not force the same optimal execution partition for both phases.

[DERIVED] Memory mapping changes the way bytes become accessible. A virtual mapping establishes an address range backed by a file. Pages may already be cached, may fault from storage on first access, or may be reclaimed later. Resident pages count toward physical use, and a separate accelerator copy can coexist with host page-cache pages. Mapping a large file neither proves that its bytes are resident nor makes storage access free.

## Formulation

[MATHEMATICALLY-DERIVED] For an execution graph $G=(V,E)$, let $\pi(v)$ assign operator $v$ to a supported device, $d_v(\pi)$ be its duration and $q_e$ bytes cross edge $e$. In a deliberately serial execution model,

$$
T(\pi)=\sum_{v\in V}d_v(\pi)
+\sum_{e=(u,v)\in E:\pi(u)\ne\pi(v)}
\left(\alpha_e+\frac{q_e}{B_e}+c_e\right),\qquad
\max_t M_r(\pi,t)\le M_r^{\rm usable}.
$$
*(Eq. 45.8)*

Here $\alpha_e$ is launch/synchronization latency, $B_e$ effective transfer bandwidth, $c_e$ conversion time, $M_r$ live physical allocation on resource $r$, and all times are seconds. Shared-memory transitions can have zero explicit copy bytes while retaining synchronization/conversion and DRAM costs. For concurrent execution replace the serial sum by a dependency- and resource-constrained critical path; summing overlapping durations overestimates time.

[MATHEMATICALLY-DERIVED] If a subgraph takes $t_c$ on CPU and $t_g$ on GPU and adds total critical-path boundary cost $h$, GPU placement improves this serial path only if $t_c-t_g>h$. The comparison requires identical numerical/output semantics and includes layout conversion. For a static contiguous partition, $q_e$ describes boundary activations/state, not all resident weights. For streaming, nonresident weight reads are separate graph edges and staging buffers contribute to peak memory.



```figure
{
  "id": "fig-45.15",
  "kind": "calculator",
  "title": "One-subgraph offload threshold",
  "caption": "Illustrative serial path. Added boundary cost can exceed saved compute; weights are stationary in this example.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-45.8",
  "alt": "Illustrative serial path. Added boundary cost can exceed saved compute; weights are stationary in this example.",
  "spec": {
    "tex": "t_{\\rm hybrid}=t_g+h,\\quad \\Delta=t_c-t_g-h",
    "equation": "45.8",
    "inputs": [
      {
        "symbol": "tc",
        "label": "CPU seconds",
        "default": 0.02,
        "min": 0,
        "max": 1,
        "format": "fixed3"
      },
      {
        "symbol": "tg",
        "label": "GPU seconds",
        "default": 0.005,
        "min": 0,
        "max": 1,
        "format": "fixed3"
      },
      {
        "symbol": "h",
        "label": "Boundary seconds",
        "default": 0.003,
        "min": 0,
        "max": 1,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "hybrid",
        "label": "Hybrid seconds",
        "formula": "tg+h",
        "format": "fixed3"
      },
      {
        "symbol": "saving",
        "label": "Saved seconds",
        "formula": "tc-tg-h",
        "format": "fixed3"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Begin with a tensor lifetime ledger. Separate persistent weights, retained sequence state, operator scratch, host staging, allocator reserve and duplicated representations. Associate each with its physical domain and lifetime. A fused backend may need a temporary repack or expanded representation even when the source artifact is compact. Placement feasibility follows the maximum simultaneous sum, not the sum of separately observed component maxima unless they coincide.

[OFFICIAL-DOCUMENTATION] The current llama.cpp backend scheduler uses operation support, weight location and buffer compatibility when assigning graph work, and exposes graph splitting/copying machinery [R45.5, scheduler interface]. Its model loader separately chooses weight buffer types and initializes mappings [R45.6, buffer selection and init_mappings]. These are inspected source interfaces, not an executed guarantee that a particular model follows a particular transfer trace.

[DERIVED] Contiguous layer placement reduces transitions along a sequential layer chain. If layers 1 through $k$ run on CPU and the rest on GPU, the hidden activation crosses once in the forward chain, plus explicitly placed input/output and state boundaries. Alternating layers can add a transition at every adjacency. This does not prove contiguity globally optimal: uneven layer costs, unsupported operators, embeddings and attention-state placement can dominate. It supplies an auditable baseline with a small cut set.

[MATHEMATICALLY-DERIVED] For a boundary hidden tensor with $n$ processed positions, width $d$ and $b$ bytes per stored element, its payload is $ndb$ before padding/layout conversion. A prefill boundary grows with chunk length while batch-one decode carries one position. Conversely, shipping growing attention state across a device boundary each step can dominate that small activation. Chapter 42 supplies the actual state-byte ledger; attach it to the boundary that physically transfers it.

[MATHEMATICALLY-DERIVED] For $m$ identical blocks with compute time $a$ and transfer time $b$, a two-stage pipeline with separate resources and one-block staging has ideal time $a+b+(m-1)\max(a,b)$. This analytical schedule assumes independent compute/transfer resources and available staging. Shared DRAM contention, conversion and limited staging can prevent ideal overlap. A profiler showing simultaneous events does not establish that neither event slowed.

[DERIVED] Dynamic streaming changes the capacity/performance frontier. It admits a model whose full resident weights do not fit, but every cache miss introduces a storage or interconnect dependency. Caching selected blocks trades resident capacity for fewer reads. Access-locality predictions and sparse activations reduce demanded bytes only when the model and execution method support that sparsity. Arbitrary dense weights do not become skippable because memory is scarce.

[PAPER-REPORTED] PowerInfer-2 groups active neurons, uses NPU-oriented dense prefill and CPU-oriented sparse decode, maintains segmented neuron caches, and pipelines cluster reads with computation [R45.21, §§3–5]. Its planner chooses compute/cache/I/O configurations. This is a specialized sparse-model streaming design, rather than a synonym for ordinary static layer offload.

[DERIVED] NUMA adds another physical placement axis within CPU execution. Thread affinity determines where compute runs; memory policy and page-allocation history influence which node supplies bytes. Binding threads after pages were populated does not necessarily relocate those pages. A model loaded by one thread can feed workers through remote links, while interleaving can spread traffic at the cost of locality. The correct choice depends on topology, access distribution and memory pressure.

[OFFICIAL-DOCUMENTATION] Linux documents that VMA policy normally affects newly allocated pages, not already faulted pages; regular file-backed page-cache allocations follow task/system policy rather than a VMA policy applied to the mapping [R45.27, Scope/Shared Policy]. Interleave allocation also differs for anonymous and page-cache pages. Thus a generic "first touch fixes NUMA" instruction is insufficient for mapped model files.

[DERIVED] Page cache can be shared across processes mapping the same file, but private repacks and device allocations are additional physical copies. Summing each process's resident shared pages can overstate unique occupancy; ignoring those pages understates device-wide pressure. A warm second launch can benefit from page cache without proving a cold storage path. State the counting boundary and retain cache state in initialization results.

[DERIVED] The complete cost includes arithmetic, weight/state/activation traffic, page faults/storage reads, allocation/repacking, boundary synchronization and staging capacity. NUMA traffic adds a link boundary; integrated devices add shared-bandwidth coupling. Energy changes with duration and simultaneously active processors; it cannot be inferred from layer count. Monetary cost requires a hardware, electricity or deployment-support boundary.



```figure
{
  "id": "fig-45.16",
  "kind": "diagram",
  "title": "Stationary weights versus streaming",
  "caption": "Static placement keeps weights at their assigned processor; dynamic streaming introduces recurring nonresident-weight dependencies.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-45.8",
  "alt": "The diagram shows Resident host weights to CPU layers; CPU layers to Activation/state cut; Activation/state cut to GPU layers; Resident GPU weights to GPU layers; Nonresident storage to Recurring miss reads; Recurring miss reads to CPU layers.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "h",
        "kind": "memory",
        "label": "Resident host weights"
      },
      {
        "id": "c",
        "kind": "hardware",
        "label": "CPU layers"
      },
      {
        "id": "a",
        "kind": "flow",
        "label": "Activation/state cut"
      },
      {
        "id": "g",
        "kind": "hardware",
        "label": "GPU layers"
      },
      {
        "id": "w",
        "kind": "memory",
        "label": "Resident GPU weights"
      },
      {
        "id": "s",
        "kind": "memory",
        "label": "Nonresident storage"
      },
      {
        "id": "r",
        "kind": "flow",
        "label": "Recurring miss reads"
      }
    ],
    "edges": [
      {
        "from": "h",
        "to": "c"
      },
      {
        "from": "c",
        "to": "a"
      },
      {
        "from": "a",
        "to": "g"
      },
      {
        "from": "w",
        "to": "g"
      },
      {
        "from": "s",
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

## Algorithm

**Algorithm 45.5 — Finite placement audit.** [DERIVED] Inputs are finite candidates $\Pi$, graph/tensor lifetimes, supported shape domains, physical capacities, transfer model and finite workloads $\mathcal W$. Output is a feasible candidate ledger or explicit failure.

$$
\begin{aligned}
1.&\quad \mathcal F\leftarrow\varnothing;\quad
\operatorname{ValidateGraphAndArtifactIdentity}.\\
2.&\quad \text{For }\pi\in\Pi,\ w\in\mathcal W:\quad
\operatorname{Unsupported}(\pi,w)\Rightarrow\operatorname{Reject}(\pi,w).\\
3.&\quad \operatorname{LiveAllocationTrace}(\pi,w)
\Rightarrow (M_r(t))_r;\quad
\exists r,t:M_r(t)>M_r^{\rm usable}\Rightarrow\operatorname{Reject}.\\
4.&\quad \operatorname{EnumerateCrossings}(\pi,w)
\Rightarrow(\text{payload, conversion, dependency, recurrence})_e.\\
5.&\quad \operatorname{BoundedExecutionOrPrediction}(\pi,w)
\Rightarrow(T,E,\text{quality},\text{status});\
\text{failure}\Rightarrow\operatorname{RetainFailure}.\\
6.&\quad \text{All declared cases admissible}\Rightarrow
\mathcal F\leftarrow\mathcal F\cup\{\pi\};\
\mathcal F=\varnothing\Rightarrow\mathrm{NO\_FEASIBLE\_PLACEMENT}.
\end{aligned}
$$

[DERIVED] Invariants are complete physical accounting, no unsupported operator silently assigned, and no predicted cost relabelled measured. The audit terminates after at most $|\Pi||\mathcal W|$ bounded cases, each with a deadline/recovery path. It does not claim global optimality over all graphs. An interrupted case retains its failure and initial/cache state rather than accepting a partial timing.

## Implementation

[OFFICIAL-DOCUMENTATION] **llama.cpp — Inference engine** provides documented layer/device placement and NUMA configuration [R45.3; R45.7, common parameters]. The loader includes mapping/prefetch paths and special treatment of mapped host buffers [R45.6]. Configuration names and allocator behavior must be pinned for deployment; source inspection here establishes neither measured locality nor overlap.

[DERIVED] Report a placement map sufficient to distinguish resident host weights, resident accelerator weights and streamed blocks. Capture graph boundaries and copy/conversion events where exposed. On a shared-memory platform, retain synchronization and shared physical use even with no explicit copy. On a NUMA host, retain affinity, node distances, memory policy and observed page distribution, rather than only thread count.

## Experimental design

### Reported experiments

[PAPER-REPORTED] PowerInfer-2 tests rooted OnePlus 12/Ace 2 phones with 24/16 GB physical and 19/11 GB available application memory. Decode prompts are at most 64 tokens, outputs at most 1,024, and timings average ten runs [R45.21, §§6–7.1]. Its sparse-model path and author-ported LLM-in-a-Flash baseline differ from original dense-model baselines. These conditions constrain causal attribution.

[NOT-DISCLOSED] A matched, sustained CPU-only/static-offload/dynamic-streaming comparison with identical weights, quality, cache state and thermal initial conditions is not supplied by the inspected sources as a common protocol.

## Observations

**What the paper claims.** [PAPER-REPORTED] PowerInfer-2 reports a useful speed/memory frontier for its sparse smartphone execution method [R45.21, §7].

**What the evidence shows.** [PAPER-REPORTED] Root permission is part of the evaluated implementation, and sparse versus original model comparisons prevent assigning the full improvement solely to scheduling [R45.21, §§6–7.1].

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 45.8 explains why adding accelerator work can help or hurt. Eliminating repeated large state transfers can matter more than increasing offloaded layer count.

**What remains unknown.** [UNVERIFIED] The same frontier for unmodified dense models in ordinary phone sandboxes, contemporary firmware and long sustained runs is not established here.



```figure
{
  "id": "fig-45.17",
  "kind": "stat-panel",
  "title": "Mapping and locality ledger",
  "caption": "Virtual addressability, physical residency and processor-local allocation require separate observations.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": [
    "R45.6",
    "R45.27"
  ],
  "alt": "Virtual addressability, physical residency and processor-local allocation require separate observations.",
  "spec": {
    "header": "MAPPING AND LOCALITY LEDGER",
    "rows": [
      {
        "key": "mapping",
        "value": "Virtual file-backed range"
      },
      {
        "key": "resident",
        "value": "Actually present physical pages"
      },
      {
        "key": "device",
        "value": "Additional repack/device copies"
      },
      {
        "key": "numa",
        "value": "Policy plus allocation history"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

> **Failure mode — Weight-transfer miscount.** [DERIVED] *Symptom:* predicted hybrid latency differs dramatically from execution. *Cause:* stationary weights are charged each token, or streamed weights once. *Detection:* classify edges by payload/recurrence and inspect copy/storage events. *Mitigation:* separate initialization, activation/state crossings and cache-miss reads.

[DERIVED] Other failures include omitted host staging, workers reading remote NUMA pages, mapped weights repeatedly faulting under pressure, and synchronization omitted from a shared-memory schedule. Fewer copies do not prove a shorter critical path if conversions or contention increase.

## Siblings

[DERIVED] [§45.1](45-1-device-constraints.md) defines sustained limits; [§45.2](45-2-llamacpp-stack.md) reconstructs loading/dispatch; [§45.4](45-4-portable-runtimes.md) owns fallback. Compare equal-quality workloads with prefill/decode separate.

## Extensions

### Improvements

[DERIVED] The lineage moves from CPU-only execution to stationary layer offload, graph-aware partitioning and specialized streaming/cache pipelines. Each expands feasibility under a different bottleneck. Phase-aware placement improves an aggregate objective only after transition/repacking costs are included; changing placement is not free.

## Limitations

[DERIVED] The serial model cannot predict concurrent contention, automatic page migration or firmware scheduling. A finite audit can miss better partitions. Dynamic sparsity adds model/predictor quality dependencies outside pure placement analysis.

> **Open question.** [UNVERIFIED] Can placement models generalize across changing context, memory pressure and shared-bandwidth contention without expensive per-device search? *Settling evidence:* held-out workload/topology traces with complete transfer/lifetime observations and quality-matched partitions.

## Reproducibility

[DERIVED] Retain graph partition, runtime/driver, tensor types, physical ledger, cold/warm page state, NUMA policy/affinity and failures. R45.21 is versioned; official implementation pages are mutable. No device run or locality measurement was executed.

## References

[R45.3](references.md#r45-3), [R45.5](references.md#r45-5), [R45.6](references.md#r45-6), [R45.7](references.md#r45-7), [R45.21](references.md#r45-21), [R45.27](references.md#r45-27).
