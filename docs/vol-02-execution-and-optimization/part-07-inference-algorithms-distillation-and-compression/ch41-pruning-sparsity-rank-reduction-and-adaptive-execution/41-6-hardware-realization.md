---
id: "ms.section.41.6"
entity_type: "section"
title: "41.6 — Hardware realization"
volume: 2
part: 7
chapter: 41
section: 41.6
slug: "41-6-hardware-realization"
parent: "ms.chapter.41"
prev_sibling: "ms.section.41.5"
next_sibling: "ms.verification.41"
children: []
prerequisites: ["ms.chapter.13","ms.chapter.14","ms.chapter.15","ms.chapter.16","ms.chapter.17","ms.chapter.25","ms.chapter.26","ms.chapter.27","ms.chapter.28","ms.chapter.39","ms.chapter.40"]
downstream: ["ms.chapter.42","ms.chapter.43","ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle":["inference","adaptation"],"mechanism":["pruning","sparsity","adaptive_computation"],"feedback_setting":[],"modality":["text","image"]}
papers: []
implementations: ["impl.pytorch","impl.hugging-face-transformers","impl.nvidia-cutlass","impl.nvidia-cuda"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# 41.6 — Hardware realization

## Scope

[DERIVED] Hardware realization determines whether a reduced mathematical workload becomes a faster or lower-energy execution. This section owns sparse kernel support, index overhead, load imbalance, shape alignment, and theoretical-speedup failure. The baseline is a tuned dense artifact on the same hardware, precision, workload, and measurement boundary. Success requires correct outputs, documented dispatch, end-to-end timing, and energy accounting at an accepted quality level.

## Why this exists

[OFFICIAL-DOCUMENTATION] cuSPARSELt exposes structured-sparse matrix descriptors, compression, algorithm selection, workspace sizing, and matmul execution; its support table is specific to dtype, accumulation, architecture, and layout [R41.18](references.md), “Key Features” and “Workflow.” **NVIDIA CUTLASS** likewise lists sparse tensor-operation classes separately from dense operations [R41.20](references.md), “Device-level GEMM.” A GPU product label or numerical density does not specify an executable path.

[MATHEMATICALLY-DERIVED] Sparsity trades multiplies for representation and scheduling work. A dense GEMM can stream regular tiles and reuse data; an irregular sparse kernel must discover retained locations, gather inputs, and distribute unequal work. When these additions exceed avoided arithmetic or traffic, pruning makes execution slower despite fewer mathematical products.

## Intuition

[MATHEMATICALLY-DERIVED] The limiting resource changes with batch and sequence shape. Small-batch decode may spend much of its time loading weights; large prefill may instead amortize weights across many tokens and stress compute or attention. Compression can move the bottleneck to KV reads, communication, normalization, launch overhead, or routing. Applying a twofold arithmetic reduction to only one fraction of the request cannot deliver a twofold request speedup.

## Formulation

| Symbol | Meaning |
|---|---|
| $f\in[0,1]$ | Fraction of dense elapsed time affected by the transformation |
| $s>0,o\ge0$ | Speed factor of affected work and added overhead normalized by dense time |
| $k,a,k_{\rm pad}$ | Contracted dimension, alignment unit, and padded dimension |
| $z_p,\bar z$ | Work assigned to parallel worker $p$ and average worker work |
| $E_{\rm build},E_d,E_c$ | Extra construction energy and energy per accepted dense/compressed task |
| $Q$ | Number of accepted deployment tasks over an attribution window |

[MATHEMATICALLY-DERIVED] Amdahl accounting with added overhead gives
$$
S_{\rm E2E}=\frac1{(1-f)+f/s+o}.
$$
*(Eq. 41.29)*

For an analytical configuration $f=0.6,s=2,o=0.05$, speedup is $1/0.75=1.33$, not two. This is a normalized accounting example, not a measurement of any engine.

[MATHEMATICALLY-DERIVED] Alignment and static load imbalance introduce additional bounds:
$$
k_{\rm pad}=a\left\lceil k/a\right\rceil,\qquad
r_{\rm pad}=k_{\rm pad}/k,\qquad
\eta_{\rm balance}\le\frac{\bar z}{\max_p z_p}.
$$
*(Eq. 41.30)*

where the balance inequality assumes equal worker rates and a barrier after statically assigned work. Dynamic scheduling can change this boundary but introduces its own overhead.

```figure
{
  "id": "fig-41.18",
  "kind": "diagram",
  "title": "From compressed artifact to sparse execution",
  "caption": "Support validation, packing, plan selection, and actual dispatch are distinct stages. An unsupported descriptor returns a labeled dense path.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.33",
  "alt": "A compressed model is validated, packed, and assigned a sparse plan. Sparse execution reads packed weights and metadata from HBM; an unsupported plan branches to dense fallback.",
  "spec": {
    "direction": "TB",
    "nodes": [
      {
        "id": "a",
        "kind": "model",
        "label": "compressed artifact"
      },
      {
        "id": "v",
        "kind": "process",
        "label": "validate descriptor"
      },
      {
        "id": "p",
        "kind": "memory",
        "label": "packed payload and metadata"
      },
      {
        "id": "k",
        "kind": "branch",
        "label": "compatible kernel plan"
      },
      {
        "id": "s",
        "kind": "hardware",
        "label": "sparse tensor operation"
      },
      {
        "id": "d",
        "kind": "process",
        "label": "dense fallback"
      },
      {
        "id": "h",
        "kind": "memory",
        "label": "HBM and workspace"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "v"
      },
      {
        "from": "v",
        "to": "p"
      },
      {
        "from": "p",
        "to": "k"
      },
      {
        "from": "k",
        "to": "s"
      },
      {
        "from": "k",
        "to": "d"
      },
      {
        "from": "h",
        "to": "s",
        "kind": "dependency"
      }
    ]
  }
}
```
```figure
{
  "id": "fig-41.19",
  "kind": "calculator",
  "title": "End-to-end speedup ceiling",
  "caption": "Analytical Amdahl accounting includes unaffected work and added sparse overhead. Values are illustrative and are not a named-engine benchmark.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.29",
  "alt": "Calculator uses affected fraction 0.6, local speed factor two, and overhead 0.05 to produce total speedup 1.33.",
  "spec": {
    "tex": "S=1/[(1-f)+f/s+o]",
    "equation": "41.29",
    "inputs": [
      {
        "symbol": "f",
        "label": "affected time fraction",
        "default": 0.6,
        "min": 0,
        "max": 1,
        "step": 0.05,
        "format": "fixed2"
      },
      {
        "symbol": "s",
        "label": "local speed factor",
        "default": 2,
        "min": 0.5,
        "max": 4,
        "step": 0.1,
        "format": "fixed2"
      },
      {
        "symbol": "o",
        "label": "normalized added overhead",
        "default": 0.05,
        "min": 0,
        "max": 0.5,
        "step": 0.01,
        "format": "fixed2"
      }
    ],
    "outputs": [
      {
        "symbol": "speed",
        "label": "E2E speed factor",
        "formula": "1/((1-f)+f/s+o)",
        "format": "fixed2",
        "emphasis": true
      }
    ]
  }
}
```
```figure
{
  "id": "fig-41.20",
  "kind": "stat-panel",
  "title": "Two-of-four positional overhead",
  "caption": "Analytical four-bit metadata per group with BF16 payload gives 9/16 of dense bytes before padding and other metadata. This is not a proprietary packing specification.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.31",
  "alt": "Four BF16 dense entries occupy 64 bits. Two retained entries plus four positional bits occupy 36 bits, a storage ratio of 0.5625.",
  "spec": {
    "header": "ILLUSTRATIVE 2:4 ENCODING",
    "variables": {
      "payload": 16,
      "meta": 4
    },
    "rows": [
      {
        "key": "dense bits per group",
        "formula": "4*payload",
        "format": "integer"
      },
      {
        "key": "packed bits per group",
        "formula": "2*payload+meta",
        "format": "integer"
      },
      {
        "key": "storage ratio",
        "formula": "(2*payload+meta)/(4*payload)",
        "format": "fixed2"
      }
    ]
  }
}
```


## Mechanism

### Methodology

[DERIVED] **Support** is a conjunction of predicates: device architecture, operand dtype, accumulator type, matrix dimensions, contraction axis, layout, alignment, epilogue, and runtime implementation. A supported arithmetic primitive is weaker than support for an entire transformer graph. A conversion API can succeed while an unsupported operation later densifies or falls back. The artifact must therefore record operators for every affected layer and state how fallback is detected.

[OFFICIAL-DOCUMENTATION] The inspected cuSPARSELt surface supports matrix-matrix operations with one structured-sparse operand at 50% sparsity and provides architecture-specific datatype tables, including low-precision cases [R41.18](references.md), “Key Features.” Those tables are mutable; this chapter does not infer that every supported device/dtype pairing also has identical performance or that arbitrary $n_s:m_s$ patterns are supported.

[MATHEMATICALLY-DERIVED] **Index overhead** limits payload savings. For two-of-four support there are six possible masks, requiring at least $\log_2 6$ bits of positional information per group in an ideal code. A simple fixed code needs three bits; a chosen four-bit-per-group encoding gives, for BF16,
$$
r_{\rm storage}=\frac{2(16)+4}{4(16)}=\frac9{16}.
$$
*(Eq. 41.31)*

This analytical encoding is 56.25% of dense payload, not 50%, excluding alignment, scales, and workspace. It does not assert the private packing format of any named kernel. At lower payload precision, the same positional bits occupy a larger fraction. CSR's per-entry indices and block encoding's amortized indices were derived in §41.1.

[DERIVED] **Load imbalance** depends on the scheduling unit. Equal global density does not give equal nonzeros per row, per tile, or per device. A warp assigned one long row can determine the completion time while others wait. Expert/channel reductions add another distribution: token counts per expert change with routing and batch composition. Statically padding every expert to a maximum count hides imbalance by executing wasted work; compacting only actual tokens adds gather/scatter and segmented scheduling. Neither is free.

[MATHEMATICALLY-DERIVED] At the static-worker boundary of Eq. 41.30, doubling the maximum work while leaving the average fixed halves the upper utilization bound. This is a mechanism-level bound, not a measured sparse-GEMM efficiency. Threadblock scheduling, memory coalescing, and occupancy can further lower utilization; conversely work stealing can weaken the static assignment assumption. Reporting only nonzeros per matrix conceals this distribution.

[DERIVED] **Shape alignment** can reverse a nominal structural saving. A retained width of $k$ that rounds to $k_{\rm pad}$ incurs arithmetic and traffic for padding if the kernel physically processes it. Choosing the next lower aligned width removes more model capacity; choosing the next higher width spends more compute. Architecture search must optimize over executable shapes, not solve an unconstrained quality problem and silently pad afterward. Grouped KV heads, tensor-parallel divisibility, rotary pairs, and quantization groups can impose additional constraints.

[PAPER-REPORTED] The 2026 MoE method explicitly rounds and redistributes per-expert channel budgets to compatible multiples rather than accepting arbitrary slim shapes [R41.15](references.md), §4.3, Appendix A.2. Its reported alignment experiment supports a shape-sensitivity claim for that quantized MoE path; it does not establish an architecture-independent alignment constant.

[MATHEMATICALLY-DERIVED] **Roofline accounting** must state whether FLOPs count actual retained products or dense-equivalent logical products. A sparse kernel can have a high dense-equivalent FLOP/s even though it performs fewer multiply-adds. Using that logical rate with a hardware peak defined in actual arithmetic units creates an invalid utilization ratio. The Chapter 25 bound applies only after compute and traffic use compatible units. Metadata loads and activation gathers belong in bytes moved; a nominal compression ratio does not specify achieved HBM bandwidth.

[DERIVED] **Latency and throughput** also differ in batch response. A reduced weight footprint may allow more concurrent requests or fewer devices, but increased concurrency can change TPOT and tail latency. A microbenchmark with one resident matrix excludes tokenization, attention/cache reads, scheduling, communication, and output processing. A whole-request comparison includes those costs and its own queueing boundary. Goodput additionally rejects requests that miss quality or SLO criteria; faster wrong answers do not enlarge its accepted denominator.

[PAPER-REPORTED] PATCH addresses hybrid dense/2:4 tiles with a source-specific backend, STOICC, and autotunes tile configurations [R41.10](references.md), §4. It adds a kernel realization for its expanded mask family; fixed-2:4 library support alone would not implement the hybrid pattern. STOICC is outside the numbered reference stack and is included only as the method-specific implementation required by the Chapter 41 source anchor.

[MATHEMATICALLY-DERIVED] **Energy and monetary amortization** require the same quality boundary as latency. If compressed execution saves energy per accepted task, the construction break-even count is
$$
Q^\star=\frac{E_{\rm build}}{E_d-E_c},
\qquad E_d>E_c.
$$
*(Eq. 41.32)*

If $E_c\ge E_d$, no positive amortization count exists at that boundary. Lower elapsed time alone does not establish lower energy because average power can change. An analogous monetary identity must include construction, licenses, infrastructure allocation, idle capacity, and operational retries consistently. The parent-model training cost can be sunk for one decision and included for a model-family comparison; the accounting boundary must say which.

[DERIVED] Parameter and token costs remain distinct: a sparse inference artifact can reduce stored weights without changing generated length. Recovery tokens and teacher costs are construction costs. Runtime memory includes compressed payload, metadata, activations, KV state, workspace, and allocator reserve. Multi-GPU communication savings require different payloads or topology; zeros in a dense collective do not disappear automatically. Generic joules, currency, p99 latency, and throughput are NOT-DISCLOSED until a workload is measured.

## Algorithm

### Algorithm 41.6 — Sparse-plan execution with observable fallback

[DERIVED] Inputs are the final compressed artifact, descriptors, a finite candidate kernel set $\mathcal K$, dense reference outputs, and tolerances. Output is a chosen executable plan or an explicitly labeled dense fallback. This is a bounded implementation contract, not a benchmark result.

$$
\begin{aligned}
1.\;&v\leftarrow\mathsf{validate}(\text{support, shapes, dtypes, layout});
\quad v=0\Rightarrow\mathsf{reject}.\\
2.\;&a\leftarrow\mathsf{compress}(\text{weights});
\quad \mathsf{workspace}\leftarrow\mathsf{querySize}(a,\mathcal K).\\
3.\;&\text{allocation fails}\Rightarrow\mathsf{fallback}_{\rm capacity}.\\
4.\;&\mathcal K_v\leftarrow\{\kappa\in\mathcal K:
\mathsf{compatible}(\kappa)\land
\mathsf{error}(\kappa)\le\mathsf{tol}\}.\\
5.\;&\mathcal K_v=\varnothing\Rightarrow\mathsf{fallback}_{\rm unsupported};
\quad
\kappa^\star\leftarrow\arg\min_{\kappa\in\mathcal K_v}
\mathsf{measuredTime}(\kappa).\\
6.\;&\mathsf{execute}(\kappa^\star);
\quad \mathsf{record}(\text{actual dispatch, workspace, fallback count});
\quad\mathsf{return}.
\end{aligned}
$$
*(Eq. 41.33)*

[DERIVED] Correctness tolerance and immutable packed-weight provenance are invariants. Candidate search is finite, allocation failure has an explicit branch, and a fallback result remains a valid deployment outcome with no sparse-speed claim. Preprocessing may cost $O(N)$ time and temporary dense-plus-packed space; reuse amortizes this cost only while weights and descriptors remain unchanged.

## Implementation

[OFFICIAL-DOCUMENTATION] **NVIDIA CUDA — Accelerator / driver / compiler** contains the cuSPARSELt path; **NVIDIA CUTLASS — Kernels / numerics / collectives** exposes dense and sparse template families; **PyTorch — Model / autograd framework** exposes semi-structured conversion in its inspected tutorial [R41.18](references.md), workflow; [R41.20](references.md), functionality tables; [R41.19](references.md), overview example. These are documented interfaces, not code-verified executions.

[DERIVED] Packing should occur after final recovery and quantization calibration. Descriptor cache keys must include shape, layout, dtype, device, epilogue, and artifact revision. A plan built for a pre-pruning width is not automatically reusable. Logging sparse dispatch, densification, workspace allocation, and runtime errors is necessary for explaining unexpected latency. Rollback preserves the last valid artifact and dense path; a failed conversion must not mutate the only parent checkpoint.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] PyTorch provides a sparse-versus-masked-dense linear microbenchmark with numerical comparison [R41.19](references.md), overview example. Its reported timings belong to the boundary below; the tutorial's current page banner is not a pin of the original measurement environment.

| Field | Reported microbenchmark context |
|---|---|
| Hardware | NVIDIA A100 80GB |
| Model/operator | Linear weight $[3072,10240]$, input $[3072,10240]$ |
| Precision | FP16 operands; full accumulation/runtime configuration NOT-DISCLOSED |
| Sequence length and I/O | Synthetic matrix input; no language sequence |
| Concurrency | One timed linear invocation; 3072 input rows |
| Runtime version | Original executed version NOT-DISCLOSED; mutable tutorial accessed 2026-10-14 |
| Measurement boundary | Repeated resident linear operator via blocked autorange; excludes pruning/packing |
| Reported result | Dense 0.870 ms; semi-structured 0.630 ms |

[PAPER-REPORTED] PATCH trains masks for 2000 steps with batch 256 and sequence length 4096 on SlimPajama, evaluates WikiText2 and eight zero-shot tasks, and separately measures deployment [R41.10](references.md), §5. Its end-to-end throughput comparison has this disclosed boundary:

| Field | PATCH deployment context |
|---|---|
| Hardware/model | NVIDIA A6000; LLaMA-2 7B |
| Precision | Exact §5.4 execution precision NOT-DISCLOSED in the inspected paragraph |
| Sequence length and I/O | Exact §5.4 input/output distribution NOT-DISCLOSED |
| Concurrency | Batch size 16 |
| Runtime version | STOICC; exact executed commit NOT-DISCLOSED in §5.4 |
| Measurement boundary | Source-labeled end-to-end inference throughput; construction excluded |
| Reported result | 1.18, 1.27, 1.38 times dense at 25%, 35%, 45% sparsity |

[DERIVED] Missing context limits transfer of these numbers. The two studies do not share models or execution boundaries; their speed ratios must not be ranked against each other.

## Observations

**What the paper claims.** [PAPER-REPORTED] PATCH reports practical hybrid-sparsity throughput and memory improvements in its source-specific compiler path [R41.10](references.md), §5.4.

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] The PyTorch example demonstrates a documented sparse conversion and smaller operator time for its given matrix on A100 [R41.19](references.md), overview. It does not establish a universal twofold speedup or book-run compatibility.

**What we infer.** [MATHEMATICALLY-DERIVED] Equations 41.29–41.32 explain independent ceilings from unaffected work, padding, imbalance, positional bytes, and amortization. Any one can prevent theoretical arithmetic savings from becoming an end-to-end benefit.

**What remains unknown.** [UNVERIFIED] No chapter artifact was benchmarked, profiled, or energy measured. Sparse-low-bit support for a specific production graph and driver/runtime combination remains unverified.

## Failure modes

> **Failure mode — Hidden densification.** [DERIVED] *Symptom:* sparse files load but memory/latency stay dense. *Cause:* unsupported operator converts packed weights to dense. *Detection:* dispatch traces and resident-memory attribution. *Mitigation:* report fallback and choose supported shapes/representations.

> **Failure mode — Kernel gain, request regression.** [MATHEMATICALLY-DERIVED] *Symptom:* faster GEMM but worse E2E latency. *Cause:* packing, gathers, communication, or unchanged stages dominate Eq. 41.29. *Detection:* matched stage timing and tail distributions. *Mitigation:* optimize the measured bottleneck and restrict the claimed boundary.

## Siblings

[DERIVED] [Quantization](../ch40-quantization-from-numerical-model-to-deployable-artifact/README.md) reduces payload precision; [structural reduction](41-3-structural-reduction.md) changes dense shapes; [cache/state reduction](../ch42-prefill-decode-kv-state-and-inference-resource-models/README.md) targets a different memory component. Combining them requires compatible kernels and a new end-to-end measurement.

## Extensions

### Improvements

[PAPER-REPORTED] PATCH expands uniform 2:4 into hardware-sized dense/sparse tiles, with tile-size and joint-versus-tile-only learning ablations [R41.10](references.md), §5.2, Tables 4–5. The quality gain pays for dense retained regions and specialized deployment. The 2026 MoE alignment method addresses slim-dimension compatibility after channel allocation [R41.15](references.md), §4.3. Neither eliminates the need to benchmark the final graph.

## Limitations

[DERIVED] Kernel support and performance are version-sensitive. Advertised sparse peak compute does not determine application throughput. Energy and economic conclusions are invalid without accepted-task denominators and construction amortization. Explicit source gaps prevent review status from being upgraded on the basis of file existence or formula validation.

## Reproducibility

[UNVERIFIED] The executable comparison remains the unexecuted proposal in [verification.md](verification.md). It requires pinned commits, device/driver/runtime identifiers, actual dispatch traces, warmup and synchronization rules, output checks, quality gates, resident-memory attribution, raw timing samples, and integrated energy traces. Documentation was inspected on 2026-10-14 and is explicitly unpinned.

## References

[R41.10](references.md), PATCH §4–5; [R41.15](references.md), 2026 MoE §4.3; [R41.18](references.md), cuSPARSELt; [R41.19](references.md), PyTorch semi-structured tutorial; [R41.20](references.md), CUTLASS functionality.
