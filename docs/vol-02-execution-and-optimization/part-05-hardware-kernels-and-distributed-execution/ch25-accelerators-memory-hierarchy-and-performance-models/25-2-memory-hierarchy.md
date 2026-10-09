---
id: "ms.section.25.2"
entity_type: "section"
title: "Memory hierarchy"
short_title: "Memory hierarchy"
volume: 2
part: 5
chapter: 25
section: 25.2
slug: "25-2-memory-hierarchy"
parent: "ms.chapter.25"
prev_sibling: "ms.section.25.1"
next_sibling: "ms.section.25.3"
children: []
prerequisites: ["ms.chapter.1", "ms.chapter.2", "ms.chapter.3", "ms.chapter.5", "ms.chapter.13", "ms.chapter.14", "ms.chapter.15", "ms.chapter.16", "ms.chapter.17"]
downstream: ["ms.chapter.26", "ms.chapter.27", "ms.chapter.28", "ms.chapter.29", "ms.chapter.30"]
related: []
relations: []
axes: {"lifecycle": ["pretraining", "inference", "serving"], "mechanism": ["hardware", "performance_model", "memory_hierarchy"], "feedback_setting": [], "modality": ["text", "image"]}
papers: []
implementations: ["impl.nvidia-cuda", "impl.amd-rocm", "impl.google-tpu-xla"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "KNOWN", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED", "ASSUMED"], "empirically_observed": false}
word_count_target: 1800
updated_at: "2026-10-09"
editorial_status: "manuscript_draft"
---

# 25.2 — Memory hierarchy

## Scope

[DERIVED] Determine where each tensor lives, which boundary each access crosses, and when its allocation can be reclaimed. The hierarchy includes registers, explicitly managed SRAM/shared memory, caches, HBM, host DRAM, and persistent storage. Capacity, traffic, and latency are separate quantities. The output is a lifetime-and-transfer ledger for a declared execution graph; it is not the sum of all tensor shapes ever allocated.

## Why this exists

[DERIVED] A model can fit by parameter count and still exhaust memory because activations, optimizer state, temporary buffers, communication staging, and allocator reservations coexist. Conversely, summing every intermediate overestimates capacity when their lifetimes do not overlap. A memory model must identify both the resident state at a point in time and the repeated transfers made during execution.

[OFFICIAL-DOCUMENTATION] Recent Rubin and CDNA 5 disclosures expand HBM and describe additional data-movement facilities [R25.1, R25.2]. These are capacity and architecture claims. They do not establish that a framework avoids intermediate writes or that coherent host memory performs like local HBM.

## Intuition

[MATHEMATICALLY-DERIVED] Residency is an interval problem. A tensor's bytes occupy capacity from allocation until its final outstanding user completes. Traffic is an edge-crossing problem. Loading the same weights repeatedly consumes bandwidth even when the weights remain allocated throughout the run. A cache can reduce external traffic without changing the logical bytes the program reads; an allocator can retain freed physical blocks without preserving a live tensor.

[DERIVED] Explicit staging pays for a copy and synchronization in exchange for predictable reuse. Caching makes placement partly implicit and depends on the access history. Neither is automatically better. The correct comparison asks whether the bytes saved at the slower boundary exceed the added work and capacity pressure at the faster boundary for this particular schedule.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $s_i$ | Allocation size of tensor or buffer $i$, including alignment | Bytes |
| $a_i,d_i$ | Allocation and safe-reclamation times | Seconds |
| $C_h$ | Available capacity in tier $h$ after fixed reservations | Bytes |
| $\pi_i(t)$ | Tier containing allocation $i$ at time $t$ | Tier identifier |
| $q_{i,h}$ | Bytes transferred across boundary $h$ for object $i$ | Bytes |
| $r_i$ | Reuse count before reclamation or eviction | Count |

[MATHEMATICALLY-DERIVED] The live-capacity requirement and transfer requirement are

$$
M_h^{\rm live}(t)=\sum_i s_i\mathbf1\{a_i\le t<d_i,\ \pi_i(t)=h\},\qquad
M_h^{\rm peak}=\max_tM_h^{\rm live}(t),\qquad Q_h=\sum_iq_{i,h}.
$$

*(Eq. 25.3)*

Capacity feasibility requires $M_h^{\rm peak}+M_h^{\rm reserve}\le C_h^{\rm physical}$ for every tier. The reserve includes fragmentation/headroom that is explicitly declared; it is not an arbitrary constant silently fitted to observed OOMs. Transfers require their own directional bandwidth and dependency analysis.

```figure
id: fig-25.5
kind: hierarchy
title: Placement and safe reclamation
caption: Registers and SRAM constrain local residency; HBM constrains device allocation; host memory and persistent storage add transfer paths. Addressability does not merge their service rates.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.3
alt: Registers and SRAM constrain local residency; HBM constrains device allocation; host memory and persistent storage add transfer paths. Addressability does not merge their service rates.
spec:
  direction: down
  levels:
  - label: Registers
    kind: memory
    note: Per execution-unit allocation
  - label: Shared memory / SRAM
    kind: memory
    note: Explicitly staged local reuse
  - label: Caches
    kind: memory
    note: History-dependent residency
  - label: HBM
    kind: memory
    note: Device-wide active and reserved bytes
  - label: Host DRAM
    kind: memory
    note: Host ownership and transfer boundary
  - label: Persistent storage
    kind: dataset
    note: I/O and serialization boundary
```

## Mechanism

### Methodology

[DERIVED] Build the tensor lifetime table from the transformed execution graph. Include gradients and optimizer moments during training; include weights, KV state, token buffers, and request metadata during inference. Count persistent buffers separately from temporaries. An in-place update merges storage only when aliasing and autograd semantics permit it. An asynchronous consumer extends a lifetime past the host function's return.

[MATHEMATICALLY-DERIVED] Consider three temporaries of sizes $x,y,z$ with intervals $[0,2)$, $[1,3)$, and $[3,4)$. Their peak is $\max(x+y,z)$, not $x+y+z$. If the final consumer of $y$ moves to time 3.5, the peak becomes $\max(x+y,y+z)$. This is why a dependency or stream change can create an OOM without changing any tensor shape. Endpoint ordering matters: reclamation at time $t$ can precede a new allocation at $t$ only after all device users are complete.

[DERIVED] Registers and shared memory constrain residency per execution unit. HBM constrains device-wide allocations. Host DRAM and persistent storage add staging, page registration, serialization, and I/O paths. Never combine their capacities into one usable number without recording which runtime can address which region and what transfer is required. Unified addressability is a naming property; access latency and bandwidth remain physical properties.

[MATHEMATICALLY-DERIVED] For a matrix tile $A_t\in\mathbb R^{m_t\times k_t}$ and $W_t\in\mathbb R^{k_t\times n_t}$ with $b$ bytes per input element, one input staging buffer costs $b k_t(m_t+n_t)$. Double buffering costs twice that amount, before alignment, barriers, and the accumulator. If an FP32 accumulator remains local, add $4m_tn_t$ bytes in the storage class that actually holds it. A claimed occupancy benefit is invalid if this sum exceeds the target's per-block or per-unit limit.

[DERIVED] Cache accounting requires an explicitly defined boundary. Logical input bytes are not measured HBM bytes. A warm cache may serve repeated data; an eviction or co-tenant can remove that benefit. State whether the analysis is a compulsory-traffic bound, a cold-cache measurement, or a steady-state working-set measurement. The same operation can cross different boundaries under those three experiments.

```figure
id: fig-25.6
kind: memory-stack
title: The cost of double buffering
caption: For an analytical 64 by 64 output tile with reduction tile 32 and two-byte inputs, double input staging uses 16 KiB and an FP32 accumulator uses 16 KiB. Alignment and barriers are excluded.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.3
alt: For an analytical 64 by 64 output tile with reduction tile 32 and two-byte inputs, double input staging uses 16 KiB and an FP32 accumulator uses 16 KiB. Alignment and barriers are excluded.
spec:
  format: bytes
  variables:
    m: 64
    n: 64
    k: 32
    b: 2
  bars:
  - label: One input buffer
    segments:
    - label: Operands
      formula: b*k*(m+n)
      kind: tensor
    - label: Accumulator
      formula: 4*m*n
      kind: tensor
  - label: Two input buffers
    segments:
    - label: Operands
      formula: 2*b*k*(m+n)
      kind: tensor
    - label: Accumulator
      formula: 4*m*n
      kind: tensor
anchor: mechanism
```

[MATHEMATICALLY-DERIVED] If an intermediate of size $X$ is written to HBM and then read once by the next kernel, eliminating that materialization removes approximately $2X$ external bytes, excluding write allocation and caching effects. A fused kernel that spills $S$ extra bytes can recover at most $2X-S$ bytes at that boundary. The transformation is beneficial only if the critical-path saving also exceeds added instructions, synchronization, and residency loss. Capacity reduction and throughput improvement must be evaluated independently.

## Algorithm

### Algorithm 25.3 — Lifetime sweep with asynchronous completion

[DERIVED] Inputs are allocations, dependency completion events, and tier assignments. Output is a capacity peak and the time interval that causes it. The event set is finite. Each ledger record is a constant-placement residency interval with immutable tier $h_i$. State is the live object set $L_h$ and occupied bytes $m_h$ per tier.

$$
\begin{aligned}
(1)\quad&d_i\leftarrow\max\bigl(\{a_i\}\cup\{\mathrm{completion}(u):u\text{ uses residency }i\}\bigr).\\
(2)\quad&\mathcal E\leftarrow\operatorname{sort}\{(a_i,+s_i,i,h_i),(d_i,-s_i,i,h_i)\};\quad m_h,p_h\leftarrow0.\\
(3)\quad&(t,\Delta,i,h_i)\leftarrow\operatorname{next}(\mathcal E);\quad
m_{h_i}\leftarrow m_{h_i}+\Delta.\\
(4)\quad&p_h\leftarrow\max(p_h,m_h);\quad m_h>C_h\Rightarrow\mathrm{INFEASIBLE}(h,t).\\
(5)\quad&\mathcal E\ne\varnothing\Rightarrow(3);\quad\mathrm{return}\ \{p_h\}.
\end{aligned}
$$

*(Eq. 25.4)*

At equal timestamps, process completed reclamations before allocations only when the completion event is established. Unknown completion means retained storage or an explicit unresolved bound. Sorting costs $O(n\log n)$, sweeping costs $O(n)$, and retained events cost $O(n)$ auxiliary space. Tier migrations create explicit source and destination residency records and a transfer dependency; source and destination copies can coexist until the transfer and source users complete. A release subtracts from the tier recorded on its event, never from the object's later placement. Migrations are not free reassignment.

## Implementation

[DERIVED] Record allocated, active, reserved, and externally consumed device bytes separately. The allocation ledger must include collective workspaces and graph-capture pools. A framework peak statistic has a measurement boundary; another process's allocation or driver reservation may lie outside it. Device counters and allocator telemetry answer related but different questions.

[PAPER-REPORTED] MemChannel's 2026 study treats pooled CXL access as a shared host-to-DIMM path and studies contention across that path. It does not establish that pooled memory is a replacement for GPU HBM. Its system model supplies a concrete reason to represent ownership, remote placement, and path contention separately. [R25.9], §§2–4.

```figure
id: fig-25.7
kind: calculator
title: Peak live bytes depend on lifetime overlap
caption: The analytical trace first overlaps x with y and later overlaps y with z. Its peak is the maximum of those sums; summing all three assumes a coexistence that the trace does not contain.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.3
alt: The analytical trace first overlaps x with y and later overlaps y with z. Its peak is the maximum of those sums; summing all three assumes a coexistence that the trace does not contain.
spec:
  tex: M_{\rm peak}=\max(x+y,y+z)
  equation: '25.3'
  inputs:
  - symbol: x
    label: First temporary bytes
    default: 1048576
    min: 1024
    max: 16777216
    step: 1024
    format: bytes
  - symbol: y
    label: Retained temporary bytes
    default: 2097152
    min: 1024
    max: 16777216
    step: 1024
    format: bytes
  - symbol: z
    label: Later temporary bytes
    default: 4194304
    min: 1024
    max: 16777216
    step: 1024
    format: bytes
  outputs:
  - symbol: peak
    label: Peak live storage
    formula: max(x+y,y+z)
    format: bytes
  - symbol: sum
    label: Incorrect all-at-once sum
    formula: x+y+z
    format: bytes
  presets: []
anchor: implementation
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] The Blackwell studies inspect tier access and calibrated memory behavior [R25.3], §V; [R25.4], §§IV–V. MemChannel varies co-running memory workloads and adapter configurations in its rack-scale testbed [R25.9], §5. These experiments have distinct boundaries; the latter's database/graph-memory protocol cannot be converted into an LLM KV-offload speedup.

## Observations

**What the paper claims.** [PAPER-REPORTED] Recent sources report architecture-specific memory behavior and contention control. Their claims describe the configurations in their protocols, not a universally constant bandwidth for a named tier.

**What the evidence shows.** [KNOWN] The inspected protocols distinguish residency/access patterns and shared paths. No source in this chapter supplies this book's complete asynchronous lifetime trace or independently validates its peak calculation.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 25.3 separates two failure conditions: insufficient capacity at an instant and insufficient transfer service over an interval. An offload can repair the first while worsening the second.

**What remains unknown.** [NOT-DISCLOSED] Allocator fragmentation, co-tenant interference, page placement, and runtime pool behavior for an unspecified deployment remain unknown. These cannot be recovered from a model's parameter count.

## Failure modes

> **Failure mode — Early reclamation.** [DERIVED] *Symptom:* nondeterministic corruption or stream-dependent errors. *Cause:* storage was reused before the last asynchronous user completed. *Detection:* inspect completion dependencies and run race checks. *Mitigation:* extend ownership to completion, then recompute the peak.

> **Failure mode — Coherent-memory equivalence.** [DERIVED] *Symptom:* a model fits but token latency rises after offload. *Cause:* addressability was confused with local bandwidth. *Detection:* count remote bytes and directional path service. *Mitigation:* keep high-reuse state local when the measured path cannot satisfy the deadline.

## Siblings

[DERIVED] Recompute trades arithmetic for retained activation bytes; offload trades local capacity for transfers and synchronization; compression trades representation error and decode work for fewer bytes. Their canonical mechanisms live in later training and inference chapters. This section compares only their placement consequences. Explicit SRAM staging offers controlled reuse; caching offers automatic reuse contingent on history. Their useful operating regimes differ at the working-set boundary.

## Extensions

### Improvements

[DERIVED] More HBM can move a workload from infeasible to feasible without making its arithmetic faster. Larger local staging can eliminate transfers but reduce concurrent resident work. Neither consequence is monotonic in performance, and no inspected ablation isolates all of these changes across the 2026 platforms. Attribute capacity changes as official specifications and measure the resulting execution path separately.

## Limitations

[DERIVED] The lifetime sweep is exact only for the supplied event and allocation model. Aliasing, dynamic shapes, graph memory pools, and co-tenancy require additional events or conservative intervals. A calculation that fits at its default input is not an OOM guarantee for a distribution of request lengths. Report the maximum supported configuration and the rejection policy when a request exceeds it.

## Reproducibility

[DERIVED] Persist allocation identifiers, byte sizes, dtype/stride metadata, producing and final-consuming events, tier ownership, pool reservations, and measured transfer paths. Include both a static bound and the actual trace needed to test it in [verification](verification.md). The experiment remains unexecuted; figure inputs are analytical configurations, not benchmark observations.

## References

[R25.1], [R25.2], [R25.3], [R25.4], [R25.9]; dates and inspected locators in [references.md](references.md).
