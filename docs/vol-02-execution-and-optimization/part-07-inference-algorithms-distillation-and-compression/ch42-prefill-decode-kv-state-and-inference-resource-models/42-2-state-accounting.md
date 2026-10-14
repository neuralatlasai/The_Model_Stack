---
id: ms.section.42.2
entity_type: section
title: State accounting
volume: 2
part: 7
chapter: 42
section: 42.2
slug: 42-2-state-accounting
parent: ms.chapter.42
prev_sibling: ms.section.42.1
next_sibling: ms.section.42.3
children: []
prerequisites: [ms.chapter.14, ms.chapter.17, ms.chapter.25, ms.chapter.37, ms.chapter.40]
downstream: [ms.chapter.43, ms.chapter.44, ms.chapter.48]
related: []
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P36}
  - {type: implemented_by, target: impl.vllm}
axes: {lifecycle: [inference, serving], mechanism: [resource_accounting, cache_representation], feedback_setting: [], modality: [text]}
papers: [P36]
implementations: [impl.vllm, impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 42.2 State accounting

## Scope

[DERIVED] This section reconciles logical model state, physical allocations and device capacity for a fixed inference execution. It owns the inference memory ledger, including weights, attention or recurrent state, temporary activations, workspaces, allocator reserve and fragmentation. Success means explaining the gap between analytically required tensor bytes and observed allocations without assigning every residual to "KV overhead." Architecture definitions remain in Chapters 14-17 and numerical formats in Chapter 40.

## Why this exists

[PAPER-REPORTED] PagedAttention identified reservation, internal fragmentation and external fragmentation as distinct losses in earlier serving designs [P36, §3; Fig. 3]. Its memory observations motivated allocation changes, not a new attention probability model. Treating all device usage as model weights plus an ideal KV tensor conceals exactly the capacity that allocation and sharing can recover.

[DERIVED] A different error comes from importing a training bytes-per-parameter constant into inference. Gradients and optimizer moments are absent from a frozen ordinary inference process, but graph pools, communication buffers, packed quantized layouts and cache pools remain. Conversely, a runtime can reserve a large cache pool before receiving any request. Then active logical KV bytes grow with token count while process device usage barely changes. Both measurements can be correct because they describe different sets of objects.

## Intuition

[MATHEMATICALLY-DERIVED] Memory capacity is a maximum over simultaneously live allocations. It is not the sum of each component's maximum measured at a different time. Logical state answers which values must be available; allocation answers which physical regions remain unavailable to another use. Shared aliases count once physically, but multiple times if a naive ledger adds every request's view. Inactive allocator blocks count in reserve but not tensor occupancy. These set distinctions must precede numerical comparison.

[DERIVED] An inference estimator should expose a ledger with object identity, owner, rank, dtype, shape, liveness interval, physical allocation identifier and sharing group. Its rows can then be joined against the runtime allocator and global device counters. Without identity, a gap can neither be assigned to a known cause nor safely subtracted from admission capacity.

## Formulation

[MATHEMATICALLY-DERIVED] For conventional unshared full-attention state with equal key/value head dimension and dtype,

$$
M_{\rm KV}=2LBSH_{kv}d_hb,\qquad
M_{\rm KV,hetero}=\sum_{i=1}^{B}\sum_{\ell=1}^{L}n_{i\ell}\big(H_{kv,\ell}d_{k,\ell}b_{k,\ell}+H_{kv,\ell}d_{v,\ell}b_{v,\ell}\big).
$$
*(Eq. 42.3)*

| Symbol | Meaning / unit |
|---|---|
| $n_{i\ell},H_{kv,\ell},d_{k,\ell},d_{v,\ell}$ | retained positions and per-layer state dimensions |
| $b_{k,\ell},b_{v,\ell}$ | stored bytes/value |
| $M_{\rm *},r,t$ | memory bytes, device rank, seconds |

where $n_{i\ell}$ is retained token positions, $b_{k,\ell},b_{v,\ell}$ bytes/value and dimensions are explicitly layer-dependent. The equal-length expression follows by multiplying the number of tensor elements $2LBSH_{kv}d_h$ by bytes/value. It excludes scales, metadata, padding and pool reserve. The heterogeneous expression allows distinct K/V representations, but recurrent or latent state must instead use its actual tensor inventory.

[MATHEMATICALLY-DERIVED] A per-device live ledger and capacity condition are

$$
\begin{aligned}
M_{\rm live,r}(t)&=M_{\rm weights,r}+M_{\rm state,r}(t)+M_{\rm act,r}(t)+M_{\rm workspace,r}(t)+M_{\rm comm,r}(t)+M_{\rm persistent,r},\\
M_{\rm process,r}(t)&=M_{\rm live,r}(t)+M_{\rm inactive,r}(t)+M_{\rm external,r}(t),\\
M_{\rm process,r}(t)&\le M_{\rm device,r}-M_{\rm other,r}(t)-M_{\rm headroom,r}\quad\text{for every }t.
\end{aligned}
$$
*(Eq. 42.4)*

where $r$ is device rank and all terms are bytes. "External" means process allocations outside the particular allocator's tracked pool, not necessarily external fragmentation. The inequality must hold for every rank and each relevant execution phase. A negative right-hand free budget rejects the configuration before a throughput calculation.


```figure
{
  "id": "fig-42.6",
  "kind": "calculator",
  "title": "Conventional KV tensor bytes",
  "caption": "Illustrative configuration, not a named model. The default is exactly 8 GiB before pages, scales, metadata, weights and temporary allocations.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.3",
  "alt": "Six inputs execute the conventional unshared full-attention cache formula. Defaults are 32 layers, 8 sequences, 8192 tokens, 8 KV heads, dimension 128 and 2 bytes/value.",
  "spec": {
    "tex": "M_{\\rm KV}=2LBSH_{kv}d_hb",
    "equation": "42.3",
    "inputs": [
      {
        "symbol": "L",
        "label": "Layers",
        "default": 32,
        "min": 1,
        "max": 128,
        "format": "integer"
      },
      {
        "symbol": "B",
        "label": "Sequences",
        "default": 8,
        "min": 1,
        "max": 256,
        "format": "integer"
      },
      {
        "symbol": "S",
        "label": "Retained tokens",
        "default": 8192,
        "min": 1,
        "max": 131072,
        "format": "tokens"
      },
      {
        "symbol": "Hkv",
        "label": "KV heads",
        "default": 8,
        "min": 1,
        "max": 128,
        "format": "integer"
      },
      {
        "symbol": "dh",
        "label": "Head dimension",
        "default": 128,
        "min": 16,
        "max": 256,
        "format": "integer"
      },
      {
        "symbol": "b",
        "label": "Bytes per value",
        "default": 2,
        "min": 0.5,
        "max": 4,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "M",
        "label": "Logical KV storage",
        "formula": "2*L*B*S*Hkv*dh*b",
        "format": "bytes"
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Reference configuration",
      "variables": {
        "S": 8192
      },
      "highlight": [
        "M"
      ],
      "note": "The logical tensors occupy exactly 8 GiB."
    },
    {
      "anchor": "mechanism",
      "label": "Longer retained state",
      "variables": {
        "S": 16384
      },
      "highlight": [
        "M"
      ],
      "note": "Doubling retained tokens doubles this state to 16 GiB."
    },
    {
      "anchor": "failure-modes",
      "label": "Pool boundary",
      "variables": {
        "S": 8192
      },
      "highlight": [
        "M"
      ],
      "note": "Logical occupancy does not equal the preallocated process pool."
    }
  ]
}
```


## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] For the book's analytical configuration $L=32$, $B=8$, $S=8192$, $H_{kv}=8$, $d_h=128$, $b=2$, Eq. 42.3 gives $8{,}589{,}934{,}592$ bytes, exactly 8 GiB. These chosen inputs do not specify a named model. Per token per sequence the state is 131072 bytes; adding 1024 retained positions to every one of eight sequences adds 1 GiB. These derivatives are useful audit signals: a measured slope inconsistent with them means that the retention, sharing, dtype or counted boundary differs.

[DERIVED] Weights require a tensor-by-tensor count. For dense uniform storage, $Nb_w$ is sufficient; tied embedding/output tensors share one physical allocation when the runtime actually aliases them. Quantized weights add scales, zeros, packing/alignment and possibly transformed copies. A runtime may retain both loaded and executable representations during initialization. Thus peak loading memory can exceed steady-state serving memory, while neither includes an optimizer unless some adaptation process runs concurrently. Parameters, logical elements and allocated bytes are separate columns.

[MATHEMATICALLY-DERIVED] For an architecture with $L_f$ full-attention layers and $L_w$ windowed layers of width $w$, equal heads and dtypes give

$$
M_{\rm state}=2BH_{kv}d_hb\left[L_fS+L_w\min(S,w)\right]+M_{\rm recurrent}.
$$
*(Eq. 42.5)*

where $M_{\rm recurrent}$ is the sum of concrete recurrent tensors. A linear recurrent state $[B,h,d_k,d_v]$ contributes $Bhd_kd_vb_s$ bytes plus any convolution/history buffers. This is an analytical shape contract, not a claim about every model in Chapter 17. A hybrid's full-attention layers still grow with $S$ even when its recurrent layers do not. Replacing $S$ everywhere by $w$ incorrectly removes their history.

[DERIVED] Latent attention likewise requires counting retained latent coordinates and any separately retained positional component, then determining whether the runtime expands them. A compact checkpoint architecture does not guarantee a compact execution cache. The controlling object is the state passed to the attention kernel. Chapter 14 owns the architectural derivation; accounting here uses the shapes that derivation specifies.

[MATHEMATICALLY-DERIVED] A packed $q$-bit array of $E$ elements ideally consumes $Eq/8$ bytes. If every group of $g$ values carries $m_g$ bytes of quantization metadata, a first-order stored count is $Eq/8+\lceil E/g\rceil m_g$, before padding. A full-precision residual of $E_r$ values changes this to $(E-E_r)q/8+E_rb+M_{\rm metadata}$. Therefore the effective byte reduction is smaller than $8b/q$, particularly for short contexts and small groups. Unpacking an entire cache into an auxiliary tensor can erase the peak-memory benefit even when persistent storage shrinks.

[DERIVED] Temporary activations follow liveness, not training retention rules. Prefill can have many new rows, while ordinary decode has one per active sequence. A materialized attention score matrix has a quadratic context term; an IO-aware exact kernel can avoid storing it, but still needs per-query running statistics or reduction scratch. GEMM workspaces, logits, sampling buffers and collective staging have their own lifetimes. Count the maximum union of simultaneously allocated regions. Summing a large prefill workspace and a disjoint decode workspace overstates the execution peak; omitting graph-private pools understates reserved memory.

[OFFICIAL-DOCUMENTATION] PyTorch 2.14 distinguishes tensor-occupied memory from allocator-reserved memory and warns that unused caching-allocator regions remain visible in device process counters. Its CUDA-graph documentation describes private pools whose addresses must persist across replay [R42.3, "Memory management"; "Graph memory management"]. These disclosures support the ledger distinction; their exact byte contribution is workload dependent.

[DERIVED] Fragmentation also has levels. Page-tail waste is unused positions inside allocated KV pages. Allocator internal waste is padding or excess region size around tensors. External fragmentation is unusable separation of free extents for an allocation requiring a larger contiguous region. A fixed-page pool can remove the last problem for its own equal-sized pages without removing graph pools or another allocator's fragmentation. A reclaimed prefix block is reusable capacity inside the pool, not necessarily memory returned to the device driver.

[DERIVED] Cost accounting includes host metadata and synchronization as well as HBM capacity. A cache manager's block table can occupy CPU and GPU copies; offload adds pinned host buffers. Inventory construction costs $O(J)$ for $J$ tensor/allocation records, and sorting liveness events costs $O(J\log J)$. Counting bytes introduces no new model parameters or token generation. Obtaining a synchronized peak trace can perturb latency; its sampling overhead, energy and monetary cost are measurement-method details, not constants supplied by the KV formula.


```figure
{
  "id": "fig-42.7",
  "kind": "diagram",
  "title": "Disjoint memory ledger",
  "caption": "Active tensors are inside reserved allocator regions. Add inactive reserve and external allocations once, rather than adding active bytes to a total that already contains them.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.4",
  "alt": "Weights, state, temporary activations and workspaces contribute to live memory. Live memory plus inactive reserve and externally tracked allocations contribute to process usage.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "w",
        "kind": "tensor",
        "label": "Weights"
      },
      {
        "id": "k",
        "kind": "memory",
        "label": "KV or recurrent state"
      },
      {
        "id": "a",
        "kind": "tensor",
        "label": "Live activations"
      },
      {
        "id": "s",
        "kind": "memory",
        "label": "Workspace and communication"
      },
      {
        "id": "l",
        "kind": "memory",
        "label": "Live allocations"
      },
      {
        "id": "i",
        "kind": "memory",
        "label": "Inactive allocator reserve"
      },
      {
        "id": "x",
        "kind": "memory",
        "label": "External process allocations"
      },
      {
        "id": "p",
        "kind": "metric",
        "label": "Process device usage"
      }
    ],
    "edges": [
      {
        "from": "w",
        "to": "l"
      },
      {
        "from": "k",
        "to": "l"
      },
      {
        "from": "a",
        "to": "l"
      },
      {
        "from": "s",
        "to": "l"
      },
      {
        "from": "l",
        "to": "p"
      },
      {
        "from": "i",
        "to": "p"
      },
      {
        "from": "x",
        "to": "p"
      }
    ]
  }
}
```


## Algorithm

**Algorithm 42.2 — Allocation reconciliation.** [DERIVED] Inputs are a finite immutable tensor inventory, rank placement, allocation events and synchronized snapshots. Output is a categorized residual or unresolved-gap report. A physical allocation identifier is the unit of deduplication.

$$
\begin{aligned}
1.&\quad \mathcal A_r\leftarrow\operatorname{UniqueAllocations}(\mathrm{records},r);\quad\text{reject inconsistent aliases or negative extents}.\\
2.&\quad \widehat M_{\rm state,r}\leftarrow\sum_{a\in\mathcal A_r:\operatorname{class}(a)=\mathrm{state}}\operatorname{extent}(a).\\
3.&\quad \text{Sweep ordered allocate/free events; maintain live set }\mathcal L_r(t)\text{ and its byte sum}.\\
4.&\quad \widehat M_{\rm live,r}^{\max}\leftarrow\max_t\sum_{a\in\mathcal L_r(t)}\operatorname{extent}(a).\\
5.&\quad \Delta_r(t)\leftarrow M_{\rm process,r}(t)-\widehat M_{\rm live,r}(t);\quad\text{classify reserve, external allocations and counter mismatch}.\\
6.&\quad |\Delta_{\rm unexplained,r}|>\epsilon_r\Rightarrow\mathrm{UNRESOLVED};\quad\text{otherwise return ledger and phase peaks}.
\end{aligned}
$$

[DERIVED] The tolerance $\epsilon_r$ is a declared measurement tolerance, never a license to relabel an arbitrary residual. Invariants are no double-counted aliases, matching timestamps and allocation scopes, and nonnegative live extents. An unpaired free or unknown allocation becomes a reconciliation failure. Termination follows the finite event list; auxiliary space is $O(J)$. The procedure does not infer exact allocations from a sampled device counter alone.

## Implementation

[OFFICIAL-DOCUMENTATION] **vLLM — Inference engine** documents context/batch limits, CUDA graph reduction and cache sizing in its memory guide [R42.4, respective headings]. Its hybrid cache design explicitly separates layer types and warns that its documented "page size" and the code field use different layer-count conventions [R42.2, "Definitions"]. A field with the same English name can therefore have a different byte boundary.

[DERIVED] **PyTorch — Model / autograd framework** supplies the allocator vocabulary in R42.3. Collect tensor shapes and dtypes after executable layout conversion; join runtime cache groups to actual layers; retain both logical occupied tokens and allocated pool pages. Measure initialization, graph capture, largest allowed prefill and steady decode separately. Communication buffers must be assigned to the rank where allocated. A summed cluster capacity cannot protect a rank whose embedding, experts or last-stage logits are disproportionately large.

## Experimental design

### Reported experiments

[PAPER-REPORTED] PagedAttention's Fig. 2 decomposes memory usage during its §6.2 serving evaluation, with OPT/LLaMA models, A100-backed Google Cloud instances and ShareGPT/Alpaca length-derived workloads. The baselines include authors' Orca reimplementations with different reservation policies [P36, §6.1]. This is an allocation-policy comparison under their scheduler/model configurations, not a universal fraction of GPU memory attributable to fragmentation.

## Observations

**What the paper claims.** [PAPER-REPORTED] Equal-size incremental KV blocks reduce reservation and fragmentation losses [P36, §§3–4].

**What the evidence shows.** [PAPER-REPORTED] Fig. 2 reports 96.3% token-state utilization for vLLM's cache region in that experiment. Its denominator is the cache allocation, not total device capacity. The authors' baseline variants and workloads delimit the comparison.

**What we infer.** [MATHEMATICALLY-DERIVED] High cache-pool utilization can increase admitted contexts without changing Eq. 42.3's logical bytes. Flat process allocation during decode is compatible with a preallocated pool whose occupied-page count grows.

**What remains unknown.** [NOT-DISCLOSED] Current per-model graph pools, workspace peaks and external allocator contributions are not supplied by these historical experiments; they require a pinned execution ledger.


```figure
{
  "id": "fig-42.8",
  "kind": "stat-panel",
  "title": "Counter set boundaries",
  "caption": "Read counters as sets of allocated objects; a flat process counter does not imply a flat occupied-page count.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.4",
  "alt": "Tensor occupancy excludes inactive allocator reserve. Process usage includes allocations outside the tracked pool, while pool occupancy tracks reusable blocks.",
  "spec": {
    "header": "MEMORY COUNTERS",
    "rows": [
      {
        "key": "logical",
        "value": "Required tensor values"
      },
      {
        "key": "allocated",
        "value": "Physical tensor extents"
      },
      {
        "key": "reserved",
        "value": "Live plus inactive pool"
      },
      {
        "key": "process",
        "value": "All process allocations"
      }
    ]
  },
  "anchor": "implementation"
}
```


## Failure modes

> **Failure mode — Reserve counted twice.** [DERIVED] *Symptom:* the ledger predicts more process bytes than the device counter. *Cause:* active tensors are added to a reserved total that already contains them. *Detection:* check each counter's set boundary. *Mitigation:* express totals as disjoint sets and retain tensor versus reserve columns.

[DERIVED] Measuring a post-request snapshot misses a prefill peak. Shared-prefix aliases can be counted once per request, and per-rank KV duplication can be missed by a naive tensor-parallel divisor. Quantized scales and mixed-state alignment can make a correct logical formula appear wrong when the physical representation was never recorded.

## Siblings

[DERIVED] [§42.3](42-3-cache-organization.md) optimizes allocation/shareability for fixed logical values; [§42.4](42-4-cache-reduction.md) changes stored values, locations or retention. Chapter 30 owns the training-state ledger. The comparison axis is live-state identity and physical occupancy; a training optimizer estimate is not an alternative inference cache estimate.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] The inspected vLLM hybrid manager extends homogeneous full-attention allocation to distinct cache groups and retention rules [R42.2, "Allocation"; "Prefix caching"]. Its declared equal-page-size constraints can introduce padding for unlike state sizes. This is a documented engineering refinement with a capacity tradeoff, not evidence of a measured speedup for every hybrid model.

## Limitations

[DERIVED] Eq. 42.3 is exact for its declared tensor representation and incorrect when used as a substitute for inspecting representation. Peak headroom should be attached to a particular admissible workload and runtime phase. It cannot establish p99 OOM risk without a workload distribution, joint arrival process and admission policy.

## Reproducibility

[DERIVED] Retain model/config hashes, every state tensor shape, physical dtype, scale grouping, rank placement, cache groups, pool pages, graph modes, liveness events, allocator backend and counter boundaries. R42.3 is versioned documentation; current vLLM guides are explicitly unpinned. No allocation reconciliation was executed in this edition.

## References

[P36](references.md#p36), [R42.2](references.md#r42-2), [R42.3](references.md#r42-3), [R42.4](references.md#r42-4).
