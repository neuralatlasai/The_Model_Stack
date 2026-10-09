---
id: "ms.section.25.4"
entity_type: "section"
title: "Physical connectivity"
short_title: "Physical connectivity"
volume: 2
part: 5
chapter: 25
section: 25.4
slug: "25-4-physical-connectivity"
parent: "ms.chapter.25"
prev_sibling: "ms.section.25.3"
next_sibling: "ms.section.25.5"
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

# 25.4 — Physical connectivity

## Scope

[DERIVED] Translate PCIe, coherent CPU-device links, GPU scale-up fabrics, scale-out RDMA networks, and CXL memory paths into directional, capacity-constrained edges. The goal is to determine which bytes must cross which physical cut and which completion events make them usable. Ethernet, RoCE, InfiniBand, and CXL describe different layers or semantics; they cannot be compared by replacing their names with an undifferentiated bandwidth number.

## Why this exists

[OFFICIAL-DOCUMENTATION] NVIDIA's 2026 platform disclosure separates PCIe, NVLink-C2C, NVLink scale-up, and ConnectX/Spectrum scale-out components [R25.1]. AMD's August disclosure likewise separates intra-rack UALoE from inter-rack networking [R25.2]. Their aggregate fabric figures are vendor disclosures, not measurements of a particular collective or proof that communication never bottlenecks.

[DERIVED] A parallel placement can be numerically correct yet unusable because it sends a high-volume exchange over the slowest edge or shares a NIC with unrelated traffic. A coherent address does not remove a physical path. An RDMA transfer does not remove registration, ownership, completion, congestion, or destination-consumption dependencies. The model must retain those distinctions before selecting a parallel degree.

## Intuition

[MATHEMATICALLY-DERIVED] Model connectivity as a directed graph. A tensor transfer consumes capacity along a route, not only at its endpoints. Multiple individually fast endpoint links can converge on a slower shared uplink. The sum of endpoint port rates is then larger than the traffic the shared cut can carry. This explains why all-to-all workloads require a topology ledger rather than the bandwidth of one cable.

[DERIVED] Scale-up and scale-out are scope distinctions. Scale-up typically connects a tightly coupled local accelerator group; scale-out connects groups over a cluster network. The transport, topology, runtime, and sharing policy determine behavior. Neither term guarantees uniform latency, a single failure domain, or a flat address space.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $G=(V,E)$ | Physical directed connectivity graph | Nodes and edges |
| $B_e,\alpha_e$ | Usable directional byte rate and setup latency | Bytes/s; seconds |
| $x_f$ | Bytes of flow $f$ | Bytes |
| $R_f$ | Route selected for flow $f$ | Ordered edges |
| $C(A,\bar A)$ | Edges crossing a physical partition | Directed cut |
| $X_C$ | Required bytes crossing that cut | Bytes |

[MATHEMATICALLY-DERIVED] Every completed schedule has the cut lower bound

$$
t\geq\max_C\frac{X_C}{\sum_{e\in C}B_e},\qquad
t_f\geq\max_{e\in R_f}\frac{x_f}{B_e}.
$$

*(Eq. 25.7)*

The second expression is a streaming lower bound. A store-and-forward path can require a sum of edge times instead. Setup and synchronization can add latency, while pipelining can overlap stages; state which path model applies. Bidirectional figures cannot be used as one-direction capacity without checking how the vendor counted them.

```figure
id: fig-25.11
kind: diagram
title: Endpoints share a physical cut
caption: Four accelerator endpoints converge on a local switch and one rack uplink. The shared uplink constrains their combined crossing bytes even when each endpoint link is fast.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.7
alt: Four accelerator endpoints converge on a local switch and one rack uplink. The shared uplink constrains their combined crossing bytes even when each endpoint link is fast.
spec:
  direction: LR
  nodes:
  - id: g1
    kind: hardware
    label: Accelerator 1
  - id: g2
    kind: hardware
    label: Accelerator 2
  - id: g3
    kind: hardware
    label: Accelerator 3
  - id: g4
    kind: hardware
    label: Accelerator 4
  - id: sw
    kind: hardware
    label: Local switch
  - id: up
    kind: flow
    label: Shared rack uplink
  - id: remote
    kind: hardware
    label: Remote group
  edges:
  - from: g1
    to: sw
    kind: flow
  - from: g2
    to: sw
    kind: flow
  - from: g3
    to: sw
    kind: flow
  - from: g4
    to: sw
    kind: flow
  - from: sw
    to: up
    kind: flow
  - from: up
    to: remote
    kind: flow
```

## Mechanism

### Methodology

[DERIVED] Inventory accelerator endpoints, local switches, CPU sockets, PCIe roots, NICs, rack switches, and remote-memory endpoints. For every edge record direction, width/rate, protocol overhead boundary, sharing group, and route alternatives. Map each runtime communication group onto that graph. A rank identifier is not a physical location; record the mapping explicitly.

[DERIVED] PCIe provides a host/device I/O path whose usable payload rate depends on the negotiated generation, width, routing, and concurrent traffic. A GPU-to-NIC path can traverse different roots or require a host-mediated route. Treat peer access as a tested capability of the concrete placement. A successful allocation or topology listing alone does not establish the transfer route used by the selected library.

[DERIVED] NVLink/NVSwitch and their alternatives supply local communication paths with their own routing and collective support. Coherent CPU-device links supply memory semantics over another physical connection. Link coherence does not make a remote page local. Preserve destination tier and completion semantics so that a program cannot consume a transfer before it is visible to the intended agent.

[KNOWN] RDMA is remote-memory access semantics implemented by a transport and endpoint stack. RoCE places those semantics over Ethernet; InfiniBand is a separate fabric family. The 2026 Network Operator compatibility document lists IB RDMA and RoCE support per NIC and version [R25.12], Platform Support. Such a compatibility row establishes advertised support, not throughput, congestion behavior, or application correctness.

[DERIVED] For RDMA, retain memory registration lifetime, access permissions, queue completion, and consumer synchronization. A local send completion and remote application consumption are different events unless the chosen API explicitly unifies them. A retry policy must respect ownership and operation semantics. These conditions belong in the transfer contract even if the hardware offloads the data copy.

```figure
id: fig-25.12
kind: calculator
title: Endpoint peak versus shared-cut service
caption: The analytical example sends 1 GB from each of eight ranks across a 100 GB/s shared cut. The necessary cut time is 80 ms; endpoint link rates do not erase that crossing demand.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.7
alt: The analytical example sends 1 GB from each of eight ranks across a 100 GB/s shared cut. The necessary cut time is 80 ms; endpoint link rates do not erase that crossing demand.
spec:
  tex: t_C\ge pq/B_C
  equation: '25.7'
  inputs:
  - symbol: p
    label: Ranks crossing cut
    default: 8
    min: 1
    max: 128
    step: 1
    format: integer
  - symbol: q
    label: Bytes per rank
    default: 1000000000.0
    min: 1000000.0
    max: 100000000000.0
    step: 1000000.0
    format: bytes
  - symbol: Bc
    label: Directional cut rate
    default: 100000000000.0
    min: 1000000000.0
    max: 10000000000000.0
    step: 1000000000.0
    format: bytes/s
  outputs:
  - symbol: bytes
    label: Combined crossing bytes
    formula: p*q
    format: bytes
  - symbol: time
    label: Necessary cut service
    formula: p*q/Bc
    format: seconds
  presets: []
anchor: mechanism
```

[PAPER-REPORTED] The 2026 MemChannel paper studies switched CXL pooling using a host/core-to-remote-DIMM path with shared adapters and switches [R25.9], §§2–4. Its physical-memory semantics and contention-control problem differ from bulk collective communication. This chapter does not claim that CXL is a new memory medium or a drop-in replacement for an accelerator interconnect.

[MATHEMATICALLY-DERIVED] If $p$ devices each send $q$ bytes across a shared rack uplink of capacity $B$, the cut requires at least $pq/B$ seconds, even when each endpoint link independently transfers $q$ in $q/b$ seconds. When $pb>B$, endpoint-rate arithmetic understates the cluster exchange time. A topology-aware placement can reduce $X_C$ by keeping a communicating group inside the faster domain; it cannot increase a physical cut's capacity by renaming a collective.

## Algorithm

### Algorithm 25.7 — Route ledger and cut rejection

[DERIVED] Inputs are a finite physical graph, flow demands, declared routes, and a deadline $\tau$. Output is a necessary-capacity check with bottleneck edges/cuts. The algorithm does not construct an optimal collective schedule.

$$
\begin{aligned}
(1)\quad&L_e\leftarrow0\quad(e\in E).\\
(2)\quad&f=1,\ldots,m:\quad \operatorname{validDirectedPath}(R_f,\mathrm{src}_f,\mathrm{dst}_f;G)=0\Rightarrow\mathrm{INVALID\_ROUTE};
\quad L_e\leftarrow L_e+x_f\ (e\in R_f).\\
(3)\quad&t_{\rm edge}\leftarrow\max_e L_e/B_e.\\
(4)\quad&t_{\rm cut}\leftarrow\max_{C\in\mathcal C_{\rm declared}}X_C/\sum_{e\in C}B_e.\\
(5)\quad&\max(t_{\rm edge},t_{\rm cut})>\tau\Rightarrow\mathrm{INFEASIBLE};
\quad\mathrm{return}\ (L,t_{\rm edge},t_{\rm cut}).
\end{aligned}
$$

*(Eq. 25.8)*

Every flow must have a contiguous directed route connecting its declared endpoints, a direction, and positive service rates. Membership of every listed edge in the graph alone does not establish a valid path. The fixed-route byte ledger assumes unicast demands with no in-network replication or compression; those transformations require corresponding changes to the demand model. Zero capacity with nonzero demand is infeasible. A passed check establishes only that the listed necessary bounds do not reject the deadline. Contention, serialization, and protocol overhead may still reject it. Work is $O(\sum_f|R_f|+\sum_{C\in\mathcal C}|C|)$; storage is $O(|E|)$ plus the declared route ledger. Enumerating all graph cuts is unnecessary for the practical rack/socket/uplink partitions checked here.

```figure
id: fig-25.13
kind: stat-panel
title: Bidirectional totals need a convention
caption: A selected 200 GB/s transmit-plus-receive total corresponds to 100 GB/s per direction only under an explicit symmetric split. A 1 GB one-way transfer then needs at least 10 ms.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.7
alt: A selected 200 GB/s transmit-plus-receive total corresponds to 100 GB/s per direction only under an explicit symmetric split. A 1 GB one-way transfer then needs at least 10 ms.
spec:
  header: ANALYTICAL CONFIGURATION
  variables:
    aggregate: 200000000000.0
    q: 1000000000.0
  rows:
  - key: Symmetric one-direction capacity
    formula: aggregate/2
    format: bytes/s
  - key: One-way lower bound
    formula: q/(aggregate/2)
    format: seconds
anchor: implementation
```

## Implementation

[DERIVED] NVIDIA NCCL and AMD RCCL occupy Kernels / numerics / collectives and choose routes under a concrete runtime and topology. MPI/UCX and NVSHMEM expose other communication/programming contracts; detailed algorithms belong to [§29.5](../ch29-parallelism-collectives-and-distributed-optimization/29-5-collective-communication.md). This section supplies the physical graph those mechanisms consume. Pin the driver, firmware, network operator, transport settings, and rank-to-device mapping rather than claiming that an interconnect brand fixes the route.

## Experimental design

### Reported experiments

[PAPER-REPORTED] MemChannel separates intra-host and inter-host contention and uses one- and two-adapter configurations [R25.9], §5. Its workloads and setup support the existence of shared-path interference in its testbed. They do not quantify GPU all-to-all performance. Vendor platform diagrams and Network Operator support tables contain no matched transfer experiment for the routes modeled in this section.

## Observations

**What the paper claims.** [PAPER-REPORTED] MemChannel reports improved isolation under its chosen remote-memory contention workloads [R25.9], §5. [OFFICIAL-DOCUMENTATION] The platform disclosures claim higher local and cluster connectivity [R25.1, R25.2].

**What the evidence shows.** [KNOWN] The sources identify multiple physical domains with distinct semantics. Aggregate bandwidth remains a different quantity from payload bandwidth for one direction or one communication pattern.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 25.7 rules out schedules that exceed a necessary physical cut. Endpoint peaks cannot repair an oversubscribed uplink.

**What remains unknown.** [NOT-DISCLOSED] Routing under simultaneous collectives, actual NIC sharing, retry behavior, and deadline-tail distributions for an unspecified cluster remain unknown. No independent cross-fabric benchmark was executed here.

## Failure modes

> **Failure mode — Double-counted directions.** [DERIVED] *Symptom:* predicted one-way transfer time is half the observed service time. *Cause:* transmit-plus-receive bandwidth was used for one-direction traffic. *Detection:* inspect source counting conventions. *Mitigation:* store directional capacity and preserve the source's convention.

> **Failure mode — Topology blindness.** [DERIVED] *Symptom:* scaling stops after crossing a rack or socket boundary. *Cause:* traffic converges on a shared cut omitted from the plan. *Detection:* compare per-route loads and mapped groups. *Mitigation:* place communication-heavy groups within the measured faster domain or reduce their crossing bytes.

## Siblings

[DERIVED] Bulk RDMA communication trades explicit transfer/completion control for efficient remote movement. Coherent access trades a shared memory interface for demand-driven traffic and coherence dependencies. Local scale-up fabrics trade scope for tightly coupled communication. CXL pooling trades remote capacity flexibility for additional path and sharing constraints. Their canonical memory consequences are in [§25.2](25-2-memory-hierarchy.md), and parallel group construction in [Chapter 29](../ch29-parallelism-collectives-and-distributed-optimization/README.md).

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] AMD's August disclosure describes multi-plane rerouting and virtual-pod isolation [R25.2], “Architected for Rack-Scale Resiliency.” This is a dated mechanism disclosure; the availability and application slowdown of a deployed cluster remain separate empirical questions. A rerouted path must be re-entered into the capacity ledger with its reduced or changed service boundaries.

## Limitations

[DERIVED] A cut bound is necessary, not sufficient. It omits packet scheduling, congestion control, flow startup, collective dependencies, and interference unless those are represented separately. Fully connected logical rank groups do not imply a physical complete graph. A valid topology model also needs a failure state: losing a link changes both routes and available capacity.

## Reproducibility

[DERIVED] Retain topology and link-direction data, route assumptions, negotiated widths/rates, group placement, memory ownership, completion semantics, and isolated-versus-concurrent transfer protocols. Do not combine vendor aggregate claims with measured payload rates without a conversion and counting boundary. All figure rates are analytical examples.

## References

[R25.1], [R25.2], [R25.9], [R25.12]; exact inspection records in [references.md](references.md).
