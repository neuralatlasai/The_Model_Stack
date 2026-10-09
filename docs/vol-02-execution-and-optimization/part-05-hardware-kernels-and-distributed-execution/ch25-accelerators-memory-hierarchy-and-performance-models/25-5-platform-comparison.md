---
id: "ms.section.25.5"
entity_type: "section"
title: "Platform comparison"
short_title: "Platform comparison"
volume: 2
part: 5
chapter: 25
section: 25.5
slug: "25-5-platform-comparison"
parent: "ms.chapter.25"
prev_sibling: "ms.section.25.4"
next_sibling: "ms.section.25.6"
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

# 25.5 — Platform comparison

## Scope

[DERIVED] Compare NVIDIA, AMD, TPU/JAX, AWS Trainium/Inferentia, CPU/Apple silicon, NPUs, and specialized ASIC routes by feasible workload execution under one semantic and measurement contract. The result is a constrained decision set, not a single accelerator leaderboard. Only disclosures first published or released between 1 December 2025 and 9 October 2026 enter the evidence set. A recent source describing an established mechanism does not make that mechanism a 2026 invention.

## Why this exists

[DERIVED] Platform comparisons frequently merge incompatible quantities: sparse low-precision matrix peaks, dense BF16 training, request throughput at different latency limits, and package power versus rack power. A ratio formed from those columns has no well-defined experiment behind it. The first task is to establish compatibility, including what runs when an operator is unsupported.

[OFFICIAL-DOCUMENTATION] The selected disclosures cover Rubin, CDNA 5/Helios, Trainium3, M5 Pro/Max, Intel Core Ultra Series 3, and OpenVINO's 2026.3 release [R25.1, R25.2, R25.6, R25.7, R25.8, R25.13]. They identify available architectural or software routes. Their marketing comparisons are not adopted as a matched cross-platform result.

## Intuition

[MATHEMATICALLY-DERIVED] Feasibility precedes optimization. If platform $j$ cannot represent the requested operation or cannot meet the numerical tolerance, a low latency for a modified task is irrelevant to the original decision. If two feasible configurations trade cost against deadline compliance, both can lie on the decision frontier. A scalar score requires declared weights and does not eliminate the trade-off.

[DERIVED] Software is part of the platform. Two devices with similar nominal formats can differ in operator coverage, compiler behavior, kernel dispatch, host integration, and distributed runtime. Include preprocessing and fallback work when those are required to produce the same output. Excluding CPU fallback from only one platform changes the measured system.

## Formulation

| Symbol | Meaning | Unit or domain |
|---|---|---|
| $w$ | Workload contract: model, shape distribution, precision, quality and deadlines | Structured record |
| $j$ | Complete hardware/software configuration | Identifier |
| $\mathsf E(j,w)$ | Semantic/operator support predicate | Boolean |
| $e_j$ | Numerical error against the declared reference | Declared error metric |
| $m_j,\tau_j$ | Peak required memory and end-to-end latency | Bytes; seconds |
| $c_j$ | Cost over the same accounting interval | Currency |
| $q_j$ | Accepted outputs over that interval | Count |

[MATHEMATICALLY-DERIVED] The feasible set is

$$
\mathcal F(w)=\{j:\mathsf E(j,w)=1,\ e_j\le\epsilon,
\ m_j\le C_j,\ \Pr(\tau_j\le\tau_{\max})\ge1-\delta\},\qquad
\kappa_j=\frac{c_j}{q_j}\quad(q_j>0).
$$

*(Eq. 25.9)*

Here $\epsilon,\delta,\tau_{\max}$ are declared acceptance inputs. The probability is defined over the stated workload and operating distribution; a single timing cannot establish it. For a feasible configuration, cost per accepted output is $\kappa_j=c_j/q_j$ with $q_j>0$. For an hourly cost $c_{\rm hour}$ and accepted-output rate $\dot q$ per second, this becomes $c_{\rm hour}/(3600\dot q)$, as in the calculator. If $q_j=0$, cost per accepted output is undefined/infinite for decision purposes.

```figure
id: fig-25.14
kind: compare
title: Compare execution contracts before scores
caption: GPU, compiler-managed ASIC, and shared-memory edge routes differ in placement and fallback contracts. Every column still needs the same numerical and workload acceptance tests.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.9
alt: GPU, compiler-managed ASIC, and shared-memory edge routes differ in placement and fallback contracts. Every column still needs the same numerical and workload acceptance tests.
spec:
  axis: Execution and qualification obligations, with no claimed cross-platform performance ranking
  columns:
  - id: gpu
    label: GPU route
  - id: asic
    label: TPU / Trainium route
  - id: edge
    label: CPU / GPU / NPU route
  rows:
  - dimension: Execution mapping
    values:
      gpu: Selected kernel and tensor/vector path
      asic: Compiled graph and engine assignment
      edge: Selected device plus host fallback
  - dimension: Memory boundary
    values:
      gpu: Device allocation and explicit/coherent transfers
      asic: Compiler-managed buffers and transfers
      edge: Shared memory and OS/co-tenant budget
  - dimension: Qualification
    values:
      gpu: Dtype, layout, shape and collective support
      asic: Graph coverage, shape and state semantics
      edge: Graph coverage, thermal envelope and deadlines
```

## Mechanism

### Methodology

[DERIVED] Fix the model revision, tokenizer, preprocessing, batch/request distribution, input/output lengths, quality test, and deadline. Then enumerate complete configurations: hardware SKU and count, driver, compiler, framework, kernel library, model representation, topology, and serving/training policy. Compare those configurations under the same accounting boundary. “NVIDIA versus AMD” is too coarse to reproduce.

[DERIVED] For NVIDIA CUDA and AMD ROCm/HIP routes, audit dtype, accumulation, layout, collective, and supported-kernel requirements independently. Source-level portability can coexist with different compiled work, different numerical reduction orders, and different fallback coverage. Keep the useful-work count fixed while retaining each implementation's executed-work and traffic count. Do not interpret a different quantized representation as a pure hardware change.

[PAPER-REPORTED] The June Google architecture report identifies the TPU/JAX/XLA/Pallas route and its compiler-managed execution structure [R25.5], pp. 3–6. That is a distinct implementation contract. Converting a GPU-native workload requires reconstructing state, transformations, sharding, and operators; translating tensor syntax alone does not establish numerical or performance equivalence.

[OFFICIAL-DOCUMENTATION] AWS's 2 December 2025 Trainium3 announcement states per-chip memory/compute specifications and UltraServer scaling; the May 2026 Neuron release extends its kernel interface [R25.6, R25.11]. The evidence set contains no date-eligible originating Inferentia architecture report establishing a newer generation's internals. Inferentia therefore remains a separately qualified inference route, not a source of inferred Trainium3 features.

[DERIVED] For CPU and Apple silicon, the memory budget is shared with other host agents and the operating system. A unified-memory capacity figure is not a dedicated model allocation. Include tokenization, dispatch, and competing consumers when the workload runs on an end-user system. On a CPU, vector instructions and matrix extensions are execution paths with format and layout requirements; a broad CPU name cannot establish that a compiler selected them.

[OFFICIAL-DOCUMENTATION] Apple's March M5 Pro/Max disclosure distinguishes GPU neural accelerators from the Neural Engine [R25.7]. Intel's January Series 3 disclosure likewise identifies CPU/GPU/NPU resources [R25.8]. This distinction blocks the inference that an advertised NPU operation rate is the rate used by an arbitrary GPU or CPU framework. OpenVINO's August release lists device-specific support additions [R25.13]; support is versioned and model-dependent.

[DERIVED] An NPU or specialized ASIC should be evaluated first for graph coverage, dynamic-shape behavior, stateful execution, accumulation, and host transfer boundaries. If one unsupported operation splits a graph, include both device transfers and host synchronization. A static batch benchmark cannot establish interactive decode behavior when the runtime recompiles or reshapes between tokens. The same rule applies to a GPU route with graph breaks.

```figure
id: fig-25.15
kind: calculator
title: Cost per accepted output
caption: Analytical prices and accepted-output rates are chosen to demonstrate the accounting equation. No cloud quote or benchmark score is implied; failed or late outputs are excluded from the accepted rate.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.9
alt: Analytical prices and accepted-output rates are chosen to demonstrate the accounting equation. No cloud quote or benchmark score is implied; failed or late outputs are excluded from the accepted rate.
spec:
  tex: c_{\rm accepted}=c_{\rm hour}/(3600q)
  equation: '25.9'
  inputs:
  - symbol: price
    label: Analytical hourly cost
    default: 2
    min: 0.1
    max: 100
    step: 0.1
    format: fixed2
  - symbol: rate
    label: Accepted outputs per second
    default: 100
    min: 1
    max: 1000
    step: 1
    format: fixed1
  outputs:
  - symbol: cost
    label: Cost per accepted output
    formula: price/(3600*rate)
    format: raw
  presets: []
anchor: mechanism
```

[MATHEMATICALLY-DERIVED] Suppose candidate A costs $2$ units per hour and produces $100$ accepted outputs/s, while B costs $1$ and produces $80$. At those analytical rates, A costs $2/360000$ per accepted output and B costs $1/288000$; B is cheaper per output despite lower throughput. If B violates the deadline for the workload, it leaves the feasible set and the comparison changes. These are chosen numbers for the decision equation, not market prices or benchmark results.

## Algorithm

### Algorithm 25.9 — Feasibility before Pareto comparison

[DERIVED] Inputs are the finite configuration set, workload contract, reference outputs, and measured evidence records. Output is a feasible Pareto set plus rejected/unknown configurations. State retains a reason for every exclusion.

$$
\begin{aligned}
(1)\quad&\mathcal F,\mathcal U,\mathcal R\leftarrow\varnothing.\\
(2)\quad&j=1,\ldots,J:\quad\operatorname{missingEvidence}(j,w)
\Rightarrow\{j\in\mathcal U;\ \mathrm{continue}\}.\\
(3)\quad&\operatorname{violates}(\mathsf E,e_j,m_j,\tau_j;w)
\Rightarrow(j,\mathrm{reason})\in\mathcal R;\quad\text{otherwise }j\in\mathcal F.\\
(4)\quad&\mathcal P\leftarrow\{j\in\mathcal F:\nexists k\in\mathcal F
\text{ with }z_k\preceq z_j\text{ and }z_k\ne z_j\}.\\
(5)\quad&\mathrm{return}\ (\mathcal P,\mathcal U,\mathcal R),\quad
z_j=(c_j/q_j,\ell_j,\mathrm{energy}_j/q_j),\quad\ell_j=Q_{1-\delta}(\tau_j).
\end{aligned}
$$

*(Eq. 25.10)*

Unknown configurations do not proceed through line 3 as if they passed. The partial order is defined over compatible measurements and lower-is-better axes. Its latency coordinate $\ell_j$ is the declared $(1-\delta)$ workload quantile, rather than an ordering of random latency variables. Its quantile estimate requires uncertainty and the same operating distribution used for admission. Pairwise dominance costs $O(J^2d)$ for $d$ metrics and $O(Jd)$ storage. Finite sampling uncertainty can make apparent dominance unresolved; retain uncertainty intervals instead of using point estimates to claim a universal winner.

```figure
id: fig-25.16
kind: stat-panel
title: A graph split adds a physical path
caption: For an analytical unsupported stage with two 64 MB transfers, a 16 GB/s path contributes 8 ms plus 2 ms host work. Excluding those stages would change the compared system.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.9
alt: For an analytical unsupported stage with two 64 MB transfers, a 16 GB/s path contributes 8 ms plus 2 ms host work. Excluding those stages would change the compared system.
spec:
  header: ANALYTICAL CONFIGURATION
  variables:
    q: 64000000
    B: 16000000000
    host: 0.002
  rows:
  - key: Transfer service
    formula: 2*q/B
    format: seconds
  - key: Host stage
    formula: host
    format: seconds
  - key: Serialized fallback path
    formula: 2*q/B+host
    format: seconds
anchor: implementation
```

## Implementation

[DERIVED] Place NVIDIA CUDA, AMD ROCm/HIP, Google TPU / XLA, and Intel oneAPI at their stack layers. JAX belongs to Model / autograd framework; Apple MLX / MLX-LM supplies an Apple-silicon array/model route; OpenVINO belongs to Serving / portable runtime. AWS Trainium / Inferentia + Neuron is enumerated at Accelerator / driver / compiler; NKI supplies a custom-kernel interface for that route. Interface coverage must be established for the actual release; no platform route in this section is claimed to have been executed by the book.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The August confidential-computing study pairs CC-on/off runs on the same B200 host and reports framework and configuration boundaries [R25.10], §3. Its paired within-row comparison is materially stronger than comparing unrelated rows or vendor headlines. The study still concerns one host family and its protected/unprotected software paths; it does not establish a cross-vendor ranking.

## Observations

**What the paper claims.** [PAPER-REPORTED] The confidential-computing study attributes overhead to specific encrypted/control boundaries and configuration choices [R25.10], §§2–3 and 9.

**What the evidence shows.** [KNOWN] The disclosed paired setup supports a scoped comparison. The selected vendor releases do not jointly supply equivalent models, deadlines, power boundaries, or costs across all platforms.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 25.9 excludes unsupported or inaccurate paths before any price/performance score is calculated. Eq. 25.10 preserves genuine trade-offs among feasible systems.

**What remains unknown.** [NOT-DISCLOSED] Independent matched throughput, accepted-output quality, current acquisition/hosting costs, and long-run reliability across the full candidate set remain absent. No guessed values fill those cells.

## Failure modes

> **Failure mode — Format laundering.** [DERIVED] *Symptom:* a platform appears faster only after a different quantization or sparsity contract is used. *Cause:* numerical/task changes are attributed to hardware. *Detection:* compare representation and error records. *Mitigation:* report the changed task or rerun a compatible representation.

> **Failure mode — Invisible fallback.** [DERIVED] *Symptom:* device-only timing is excellent while end-to-end latency is poor. *Cause:* unsupported operations execute elsewhere. *Detection:* retain operator placement and transfer traces. *Mitigation:* include fallback cost and reject paths that violate the deadline.

## Siblings

[DERIVED] Training comparison prioritizes optimizer/state correctness and step progress; interactive inference comparison prioritizes accepted answers under request deadlines; batch inference comparison prioritizes completed work over an interval. Their objectives differ even on the same device. [§25.3](25-3-roofline-reasoning.md) supplies operator ceilings; [§25.6](25-6-cluster-constraints.md) supplies rack and operational constraints. A shared accelerator family does not merge those experiments.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] Neuron 2.30.0 and OpenVINO 2026.3 extend named kernel/model routes [R25.11, R25.13]. These additions can change feasibility, but their release notes do not establish improvements for every model. Requalify the exact path after an update; retain a previous compatible configuration as a separate baseline rather than silently changing both sides.

## Limitations

[DERIVED] The comparison method is a decision framework, not an empirical ranking. The evidence window intentionally excludes older origin papers and disclosures. Some platforms consequently have narrower evidence coverage. That constraint is disclosed rather than repaired by assigning a recent inspection date to an old publication. Specialist accelerators without an inspected eligible technical disclosure remain unqualified candidates.

## Reproducibility

[DERIVED] Archive the workload contract, representation, numerical reference, complete platform identity, fallback placement, prices with dates, energy boundary, raw accepted/rejected output counts, and confidence procedure. Preserve unknowns as unknowns. Analytical examples and figures are clearly separated from source-reported experiments.

## References

[R25.1], [R25.2], [R25.5]–[R25.8], [R25.10], [R25.11], [R25.13]; source revisions and eligibility in [references.md](references.md).
