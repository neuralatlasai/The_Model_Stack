---
id: ms.section.16.5
entity_type: section
title: Distributed implications
short_title: Distributed implications
section: 16.5
slug: 16-5-distributed-implications
parent: ms.chapter.16
prev_sibling: ms.section.16.4
next_sibling: ms.section.16.6
children: []
prerequisites: [ms.chapter.13, ms.chapter.14, ms.section.16.4]
downstream: [ms.chapter.27, ms.chapter.29, ms.chapter.42]
word_count_target: 1900
volume: 1
part: 3
chapter: 16
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [mixture_of_experts, conditional_computation], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P10, P13]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 16.5 — Distributed implications

## Scope

Distributed MoE maps logical experts and routed assignments onto devices and communication links. This section covers expert placement, all-to-all traffic, skew, redundant expert replicas, and communication/computation overlap. It previews expert parallelism while leaving detailed kernel and topology engineering to Volume II. The objective is an explicit ownership and traffic ledger that preserves the model's routing semantics and explains the critical path.

## Why this exists

**DERIVED.** Expert sparsity avoids evaluating every expert on every token, but selected representations may need to cross device boundaries. Distributing more expert parameters therefore introduces a movement problem. A local token batch can create remote work whose destination pattern changes with the inputs.

Equal numbers of experts per device do not imply equal work. Experts can receive different token counts, have different shapes, or share bandwidth with other operations. Conversely, a balanced expert histogram can still produce skewed traffic if several busy experts reside on one device or across an expensive link.

The dominant constraint is the slowest required dependency path. A token cannot combine an expert result that has not returned. A training step may wait for an overloaded destination even while other devices are idle. Counting aggregate FLOPs without placement cannot explain that behavior.

## Intuition

**DERIVED.** Distinguish an expert's logical identity from its physical location. Expert parallelism distributes expert functions; tensor parallelism can split a function's matrices; replication places several physical copies of one logical function. These choices change ownership and communication in different ways.

A router selects logical experts under its architecture contract. A dispatcher chooses where and how to execute those selections. If the dispatcher redirects a token to a different logical expert merely because its device is less busy, it changes the model function. Redirecting to an equivalent synchronized replica can preserve the intended function under stated numerical conditions.

> **Definition — Expert placement ledger.** The mapping from logical experts to physical shards or replicas, including ownership of weights, optimizer state, routed inputs, returned outputs, and synchronization responsibilities.

## Formulation

**MATHEMATICALLY-DERIVED.** For a reference dispatcher, let \(A_{\mathrm{remote}}\) be the number of remote token–expert assignments in one forward pass, \(d\) the representation width, and \(b_a\) bytes per communicated activation value. If each remote assignment sends one full input row and returns one full output row,

$$
B_{\mathrm{forward,logical}}=2A_{\mathrm{remote}}db_a.
$$
*(Eq. 16.14)*

Count each logical transfer once, rather than adding both endpoint counters. This excludes metadata, padding, protocol overhead, retransmissions, tensor-parallel collectives, and backward communication. If a backend deduplicates a token sent to multiple experts on one destination, the assignment-level expression overcounts that backend's input payload; use its actual transfer unit.

Let device \(r\) perform \(F_r\) FLOPs and transfer \(B_r\) bytes across an explicitly defined bottleneck boundary. If \(\Pi_r\) and \(\Beta_r\) are applicable upper bounds on its compute and transfer rates, then

$$
t_{\mathrm{region}}\ge
\max_r\left\{\frac{F_r}{\Pi_r},\frac{B_r}{\Beta_r}\right\}.
$$
*(Eq. 16.15)*

This is only a lower bound. Dependencies, launch overhead, contention, and imperfect overlap can increase time. Use consistent byte-count boundaries for \(B_r\) and \(\Beta_r\); aggregate fabric bandwidth is not automatically a per-rank rate.

For \(r_e\ge1\) identical physical replicas of logical expert \(e\), each with parameter payload \(P_e b_w\) bytes,

$$
M_{e,\mathrm{weights}}=r_eP_e b_w,\qquad
\Delta M_{e,\mathrm{weights}}=(r_e-1)P_e b_w.
$$
*(Eq. 16.16)*

This counts weight replicas only. Training adds gradient and optimizer synchronization and storage. Inference replicas require consistent weights and model configuration.


~~~figure
id: fig-16.15
kind: calculator
title: "Logical forward dispatch and return payload"
caption: "Illustrative assignment-per-transfer model with width 4096 and two bytes per value; metadata, padding, backward traffic, and deduplication are excluded."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.14"
alt: "Illustrative assignment-per-transfer model with width 4096 and two bytes per value; metadata, padding, backward traffic, and deduplication are excluded."
spec: {"tex":"B=2A_{remote}db_a","equation":"16.14","inputs":[{"symbol":"A","label":"remote assignments","default":1024,"min":0,"max":16384,"format":"integer"},{"symbol":"d","label":"representation width","default":4096,"min":1024,"max":8192,"format":"integer"},{"symbol":"ba","label":"bytes per value","default":2,"min":1,"max":4,"options":[1,2,4],"format":"bytes"}],"outputs":[{"symbol":"bytes","label":"logical forward payload","formula":"2*A*d*ba","format":"bytes"}]}
states: [{"anchor":"formulation","label":"Reference transfer","variables":{"A":1024,"d":4096,"ba":2},"note":"The fixture transfers 16 MiB of logical forward payload."},{"anchor":"mechanism","label":"More remote assignments","variables":{"A":4096,"d":4096,"ba":2},"note":"Volume scales with remote work in this reference dispatcher."},{"anchor":"failure-modes","label":"All local fixture","variables":{"A":0,"d":4096,"ba":2},"note":"Zero remote payload does not imply zero local permutation cost."}]
~~~


## Mechanism

**DERIVED.** Expert placement defines a communication graph. Each originating rank has a count for every destination; dispatch exchanges the required rows, and combine returns the expert contributions. The send-count matrix and receive-count matrix must agree as transposes under the same transfer convention.

All-to-all is a collective communication pattern, not a promise that every peer sends the same number of tokens. Variable routing creates unequal split sizes. A padded equal-count scheme and a variable-count scheme can realize the same logical assignments with different physical traffic.

**OFFICIAL-DOCUMENTATION.** PyTorch's distributed communication interface documents all-to-all operations, including split-size handling [R16.6]. **DERIVED.** The application must still provide mutually consistent counts and collective participation. Empty local work does not automatically remove a rank from a collective group.

Topology-aware constraints can reduce communication destinations but may constrain expert choice. **PAPER-REPORTED.** DeepSeek-V3 describes node-limited routing and communication/computation overlap [P13]. **DERIVED.** Such a design should be evaluated as both an architecture constraint and an execution strategy; its reported behavior is not a universal scaling guarantee.


~~~figure
id: fig-16.16
kind: diagram
title: "Logical experts mapped to physical owners"
caption: "The placement map resolves assignments to owners; returned outputs retain logical identities regardless of the physical route."
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.14"
alt: "The placement map resolves assignments to owners; returned outputs retain logical identities regardless of the physical route."
spec: {"direction":"LR","nodes":[{"id":"assign","kind":"dataset","label":"Accepted logical assignments"},{"id":"map","kind":"dependency","label":"Expert placement and replicas"},{"id":"pack","kind":"process","label":"Pack destination rows"},{"id":"send","kind":"flow","label":"Dispatch transfers"},{"id":"expert","kind":"hardware","label":"Physical expert owners"},{"id":"return","kind":"flow","label":"Return contributions"},{"id":"combine","kind":"process","label":"Logical weighted combination"}],"edges":[{"from":"assign","to":"pack","kind":"flow"},{"from":"map","to":"pack","kind":"dependency"},{"from":"pack","to":"send","kind":"flow"},{"from":"send","to":"expert","kind":"flow"},{"from":"expert","to":"return","kind":"flow"},{"from":"return","to":"combine","kind":"flow"}]}
~~~


Load skew has several levels: assignments per expert, total expert work per rank, messages per destination, and bytes per physical link. Inspect all of them. A rank holding several moderately loaded experts can become the bottleneck even when no single expert looks extreme.

Redundant expert replicas can distribute demand for hot logical experts. Their benefit depends on how requests are assigned to replicas, where the copies reside, and the cost of maintaining them. If replicas represent the same function, deduplicate them in logical parameter counts but include every copy in physical memory. If their weights diverge intentionally, they are distinct learned functions and should not be described as equivalent replicas.

During training, gradients from replica executions must contribute to the same logical expert update under the declared optimizer semantics. Averaging without accounting for unequal numbers of assignments can change the update. Checkpointing must preserve logical identities so resharding does not confuse a replica index with a new expert.

Overlap requires independent work. A shared branch may execute while remote routed branches are in flight if dependencies permit. Later expert batches may overlap earlier communication under a suitable schedule. However, dispatch, expert computation, and return for one row remain causally ordered. Drawing boxes that overlap on a timeline is not evidence that the runtime achieves that overlap.

Measure exposed communication on the critical path, not only the duration of communication calls. Faster communication can leave the end-to-end time unchanged if another stage dominates. Conversely, increased overlap can reduce exposed time without reducing transferred bytes. Keep volume, duration, and exposure as separate metrics.

## Algorithm

**DERIVED — ownership-preserving distributed dispatch.**

~~~text
Algorithm 16.5 — Dispatch logical assignments to physical expert owners
INPUT: accepted assignment ledger, expert placement map, process groups,
       activation representation, finite buffer bounds
OUTPUT: combined token outputs and per-boundary traffic ledger
STATE: send/receive counts, packed buffers, inverse identifiers, completion events
INVARIANT: each logical assignment executes on one valid owner or equivalent replica
1. Resolve each logical expert to a physical execution location.
2. Count transfers under the backend's actual deduplication convention.
3. Exchange and validate split sizes before using bounded buffers.
4. Pack rows with stable logical token and assignment identifiers.
5. Dispatch while executing only dependency-independent local work.
6. Execute expert operations after their required inputs are available.
7. Return results and combine them under the original routing coefficients.
8. Verify conservation and reference equivalence.
9. Record bytes, rank work, link boundaries, exposed communication, and failures.
~~~

Count construction and packing are linear in assignments plus destination bookkeeping. A dense peer-count table uses \(O(P^2)\) entries across \(P\) ranks; its scale is bounded by the chosen communicator, not by an unbounded token dataset. Sparse destination maps may reduce metadata when communication is sparse, but their negotiation and lookup costs must be included.

## Implementation

**OFFICIAL-DOCUMENTATION.** NVIDIA Megatron-Core, **Distributed training**, documents expert-parallel dispatchers and overlap options [R16.4]. PyTorch, **Model / autograd framework**, documents the communication primitives [R16.6]. **DERIVED.** Freeze the actual backend and revision before interpreting a performance trace.

Hugging Face Transformers, **Model definition / adaptation**, supplies the checkpoint-level model contract [R16.5]. It does not by itself establish the expert ownership map used by a separate distributed runtime. Preserve router configuration and logical expert ordering during conversion.

Validate asynchronous buffer lifetimes: a send buffer cannot be reused before the relevant operation has completed under the runtime's stream semantics. Likewise, compute must not read a receive buffer before its data is ready. Numerical tolerances must account for changed accumulation order without masking missing assignments.

Hardware performance, topology-specific bandwidth, energy, and monetary cost remain **UNVERIFIED** for the proposed workload. The traffic formula is a logical byte model, not a network trace or capacity recommendation.

## Experimental design

**PROPOSAL — no distributed benchmark has been executed.**

### Experiment 16.5 — Placement, skew, and exposed communication

- **Hypothesis:** Placement and workload skew can change critical-path time even when logical active arithmetic is unchanged.
- **Setup:** Replay fixed routing traces over a finite set of supported placement and dispatcher configurations.
- **Independent variables:** Expert placement, replica count, rank topology, skew, batch size, and overlap policy.
- **Controlled variables:** Logical experts, selected assignments, coefficients, precision, and correctness reference.
- **Dataset/workload:** Balanced traces, hot-expert bursts, domain-homogeneous batches, and small decoding batches.
- **Hardware:** Record devices, interconnect topology, communicator mapping, runtime and kernel revisions.
- **Metrics:** Logical/physical bytes, per-rank work, expert histograms, exposed communication, tail latency, memory, and output residuals.
- **Baselines:** Single-device bounded reference where feasible, no overlap, and nonreplicated placement.
- **Expected result:** Any speed change is explained against the same logical work and measured communication boundary.
- **Ablation:** Change placement without changing routing, then change routing constraints as a separate experiment.
- **Interpretation:** Distinguish movement savings, load redistribution, and changes to the model's selected function.
- **Threats to validity:** Background traffic, hidden deduplication, asynchronous timing, unequal warm-up, and replica inconsistency.

## Observations

**What the paper claims — PAPER-REPORTED.** DeepSeek-V3 connects routing constraints with distributed execution design [P13].

**What the evidence shows — MATHEMATICALLY-DERIVED.** Assignment payload, rate lower bounds, and replica storage describe different resource boundaries.

**What we infer — DERIVED.** Expert load alone is insufficient; placement and traffic must be measured at rank and link boundaries.

**What remains unknown — UNVERIFIED.** Realized overlap, effective bandwidth, and tail latency require workload-specific traces.

## Failure modes

**DERIVED.** Failures include mismatched split sizes, premature buffer reuse, a rank skipping required collective participation, stale replicas, and traffic counters counted twice at both endpoints.


~~~figure
id: fig-16.17
kind: stat-panel
title: "Distributed MoE measurement boundaries"
caption: "Check these independent boundaries before interpreting an MoE quality or resource claim."
placement: rail
anchor: failure-modes
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.15"
alt: "Check these independent boundaries before interpreting an MoE quality or resource claim."
spec: {"header":"Required distinctions","rows":[{"key":"Work","value":"Assignments and compute per rank"},{"key":"Volume","value":"Bytes at one declared boundary"},{"key":"Exposure","value":"Communication on the critical path"},{"key":"Replicas","value":"Identity storage and synchronization"}]}
~~~


Another failure is reporting aggregate throughput while excluding overloaded requests or failed collectives. Preserve the full attempt ledger and state the admission and retry policy before calculating latency distributions.

## Siblings

**DERIVED.** Expert sharding distributes functions; tensor sharding splits their matrices; replication duplicates a function; topology-aware routing constrains selection. Combining them requires a multidimensional ownership map rather than one parallelism degree.

## Extensions

**DERIVED.** Dynamic replica placement requires migration cost, warm-up, and consistency rules. Heterogeneous devices require cost-aware placement rather than equal expert counts. These are proposed extensions whose benefit must be measured alongside any added state-management overhead.

## Limitations

**DERIVED.** Equation 16.14 assumes one full row per assignment in each direction. Equation 16.15 ignores dependencies and therefore cannot predict latency. The section previews distributed execution; it does not specify a production collective implementation.

## Reproducibility

Archive placement maps, process groups, routing traces, split sizes, replica identities, precision, buffer boundaries, event traces, and measured traffic conventions. Record synchronization and checkpoint semantics for training replicas.

## References

[P13](references.md#p13); [R16.4](references.md#r164); [R16.5](references.md#r165); [R16.6](references.md#r166).

