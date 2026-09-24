---
id: ms.section.14.6
entity_type: section
title: Quality–state tradeoffs
short_title: Quality–state tradeoffs
section: 14.6
slug: 14-6-quality-state-tradeoffs
parent: ms.chapter.14
prev_sibling: ms.section.14.5
next_sibling: null
children: []
prerequisites: [ms.chapter.5, ms.chapter.13, ms.section.14.5]
downstream: [ms.chapter.15, ms.chapter.27, ms.chapter.42]
word_count_target: 1900
volume: 1
part: 3
chapter: 14
related: []
relations: []
axes: {lifecycle: [pretraining, inference], mechanism: [attention, cache_representation], feedback_setting: [], modality: [text, image, audio, video]}
papers: [P13, P19, P20]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.flashattention]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 14.6 — Quality–state tradeoffs

## Scope

**DERIVED.** This section compares attention designs on a joint quality, state, traffic and execution boundary. It does not rank model families by context-window length or cache compression ratio. The artifact is an attention-family comparison with a reconstructed allocation ledger and independently specified task evidence. Cache-management policy is owned by Chapter 42; here the focus is the state required by the chosen attention mechanism.

## Why this exists

**DERIVED.** A configuration can accept a long input and still fail to use the relevant information. It can retain few bytes while spending substantial work reconstructing or selecting state. It can fit more sequences in memory while worsening tail latency under contention. Comparing only maximum context or nominal cache bytes suppresses the other constraints that determine whether a workload succeeds.

**PAPER-REPORTED — [R14.9](references.md#r149).** RULER extends simple needle retrieval with configurable synthetic tasks including multi-hop tracing and aggregation. **DERIVED.** That motivates testing more than one retrieval behavior. It does not establish that a synthetic score is a complete measure of long-context usefulness, nor that historical benchmark results rank current implementations.

## Intuition

> **Definition — Quality–state comparison contract.** A record binding task quality to a specified attention representation, retained state, input distribution and execution boundary, with every matched and unmatched resource reported.

**DERIVED.** Capacity answers whether tensors fit. Bandwidth answers how quickly required data can move. Compute answers how quickly operators can process them. Quality answers whether the resulting model uses the available evidence for the target task. These quantities interact, but none can substitute for another.

**DERIVED.** A smaller cache may increase admissible concurrency; this changes kernel occupancy and scheduling, so per-request latency measured at the old concurrency is not enough. A narrower local window may reduce both bytes and visible evidence. A latent layout can reduce state while increasing inner-product width. Every comparison must state which intervention produced the resource change and which task requirement it preserves.

## Formulation

**MATHEMATICALLY-DERIVED — page allocation.** For an unshared cache with page size $p$ token slots and $m_{\mathrm{token}}$ bytes per slot per layer,

$$
M_{\mathrm{pages}}
=Lm_{\mathrm{token}}p
\sum_{r=1}^{B}\left\lceil\frac{S_r}{p}\right\rceil.
$$
*(Eq. 14.19)*

where $S_r$ is retained length for sequence $r$. This assumes uniform layers, no prefix sharing and no cross-rank replication; metadata, free-page reserve and workspace are separate. The token-slot slack per sequence is less than $p$.

**MATHEMATICALLY-DERIVED — conditional admission ceiling.**

$$
B_{\mathrm{capacity}}
=
\left\lfloor
\frac{M_{\mathrm{budget}}-M_{\mathrm{fixed}}-M_{\mathrm{reserve}}}
{M_{\mathrm{sequence}}}
\right\rfloor.
$$
*(Eq. 14.20)*

where the numerator must be nonnegative, the denominator positive, and $M_{\mathrm{sequence}}$ a conservative per-sequence allocation at the admitted workload boundary. This is a capacity ceiling under those conditions, not a throughput optimum. Heterogeneous requests require a sum of their individual allocations.

**MATHEMATICALLY-DERIVED — resource lower bound.**

$$
t_{\mathrm{phase}}\ge
\max\left(\frac{F_{\mathrm{phase}}}{P_{\mathrm{cap}}},
\frac{R_{\mathrm{phase}}}{B_{\mathrm{cap}}}\right).
$$
*(Eq. 14.21)*

where $F_{\mathrm{phase}}$ is counted work, $R_{\mathrm{phase}}$ required traffic at the stated memory boundary, and $P_{\mathrm{cap}},B_{\mathrm{cap}}$ are valid upper bounds on sustained compute and transfer rates for the applicable operations. Dependencies and other resources can increase time; a bandwidth ceiling alone does not predict end-to-end latency.

**MATHEMATICALLY-DERIVED — repeated history visits.** If the first decode call reads $S_0$ key positions and each subsequent call reads one additional position, then

$$
\sum_{t=0}^{n-1}(S_0+t)
=nS_0+\frac{n(n-1)}{2}.
$$
*(Eq. 14.22)*

where $n$ is the number of decode calls, not necessarily the number of delivered tokens under speculative or branched execution. Multiplying by bytes per visited position gives a one-read-per-call traffic model, not measured traffic.

~~~figure
id: fig-14.18
kind: calculator
title: Page rounding at a declared token stride
caption: Eq. 14.19 specializes to equal sequence lengths without sharing or replication. The illustrative token stride can be replaced by an audited layout.
placement: rail
anchor: formulation
states:
  - {anchor: formulation, label: Exactly one page, variables: {S: 128, p: 128}, note: "No token-slot slack at this boundary."}
  - {anchor: mechanism, label: One token beyond a page, variables: {S: 129, p: 128}, note: "Two pages are allocated; logical length increased by only one token."}
  - {anchor: failure-modes, label: Smaller pages, variables: {S: 129, p: 16}, note: "Nine smaller pages reduce slot slack, but metadata and scheduling costs remain separate."}
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-14.19
alt: With 32 layers and a 4096-byte per-layer token stride, one 128-token page occupies 16 MiB; 129 tokens require 32 MiB at that page size.
spec:
  tex: M=Lm_{\mathrm{token}}Bp\lceil S/p\rceil
  equation: "14.19"
  inputs:
    - {symbol: L, label: layers, default: 32, min: 1, max: 128, format: integer}
    - {symbol: B, label: sequences, default: 1, min: 1, max: 64, format: integer}
    - {symbol: m, label: bytes per token per layer, default: 4096, min: 128, max: 65536, format: bytes}
    - {symbol: S, label: retained tokens, default: 128, min: 1, max: 131072, format: tokens}
    - {symbol: p, label: token slots per page, default: 128, min: 1, max: 256, options: [1, 16, 32, 64, 128, 256], format: integer}
  outputs:
    - {symbol: M, label: allocated page payload, formula: L*m*B*p*ceil(S/p), format: bytes}
    - {symbol: slack, label: unused token slots, formula: B*(p*ceil(S/p)-S), format: integer}
~~~

## Mechanism

**DERIVED.** Equations 14.3 and 14.7 describe logical payload; Eq. 14.19 adds one physical allocation policy. A complete report must also reconcile storage aliases, KV replication, quantization metadata, alignment and pool reserve. Peak live workspace may occur during prefill or layout conversion, even if decode's steady cache fits comfortably.

**DERIVED.** Allocated tensor bytes and allocator reservation answer different questions. A pool can retain free pages after a request ends; counting that reservation as live KV overstates the architecture's persistent requirement. Counting only valid tensor elements can understate the memory needed to admit the request. Record logical, allocated, reserved and peak quantities as separate fields.

~~~figure
id: fig-14.19
kind: diagram
title: From attention representation to an admissible workload
caption: Representation, allocation, traffic and task evidence jointly constrain deployment. No single cache ratio determines the outcome.
placement: inline
evidence: DERIVED
source: [DERIVED:eq-14.19, DERIVED:eq-14.20, DERIVED:eq-14.21]
alt: Attention representation produces logical state, physical allocation and executed traffic. Capacity and latency constraints combine with task evidence before a workload is accepted.
spec:
  direction: LR
  nodes:
    - {id: repr, kind: model, label: attention representation}
    - {id: logical, kind: memory, label: logical state}
    - {id: allocation, kind: memory, label: allocation and reserve}
    - {id: traffic, kind: flow, label: transfers and compute}
    - {id: capacity, kind: metric, label: capacity constraint}
    - {id: latency, kind: metric, label: latency constraint}
    - {id: quality, kind: metric, label: independent task evidence}
    - {id: accept, kind: objective, label: admissible workload}
  edges:
    - {from: repr, to: logical}
    - {from: logical, to: allocation}
    - {from: repr, to: traffic}
    - {from: allocation, to: capacity}
    - {from: traffic, to: latency}
    - {from: capacity, to: accept}
    - {from: latency, to: accept}
    - {from: quality, to: accept}
~~~

**DERIVED.** Prefill and decode stress different terms. Prefill forms many query/key interactions and can reuse tiles across many queries. Decode repeatedly revisits history with few new queries; Eq. 14.22 makes the growing visit count explicit. Training additionally retains or reconstructs activations and computes gradients. Reporting one combined tokens-per-second value can conceal these differences.

**DERIVED.** Quality evaluation should vary where evidence appears, how much is relevant, how many facts must be combined, and how distractors resemble the target. Include boundary cases that challenge the architecture: evidence just outside a local window, several facts competing for a selection budget, contradictory retrieved documents, and queries that require aggregation rather than copying one span.

**DERIVED.** Separate attention fidelity from task correctness. On a fixed checkpoint, dense-reference comparisons can isolate a changed mask, precision or cache representation. Across independently trained architectures, output equality is neither expected nor the objective; compare task quality under disclosed training and tuning budgets. A low local tensor error does not prove unchanged answer quality, and a successful task sample does not prove operator equivalence.

**PROPOSAL — benchmark-use record.**

| Field | Chapter evaluation contract |
|---|---|
| Capability measured | Evidence retrieval, multi-fact composition and aggregation under a declared context distribution |
| Task construction | Versioned generators and audited support positions; include difficult distractors |
| Metric | Per-task correctness plus support-position and context-length slices |
| Dataset | Pinned RULER configuration when used; separately identified domain workload |
| Contamination risks | Public templates, benchmark-specific tuning and repeated evaluation feedback |
| Protocol | Held-out generation seeds and final evaluation after architecture selection |
| Known limitations | Synthetic tasks do not establish full domain utility or factual grounding |
| Comparability | Same tokenizer accounting, source content, output budget and task scoring |

**DERIVED.** Serving comparisons should report both fixed-concurrency and capacity-constrained operating points. At fixed concurrency, the intervention's local latency and memory effects are visible. At increased concurrency, additional batching can improve utilization while queueing changes tail latency. A capacity benefit is useful only if the required quality and latency constraints remain satisfied.

**DERIVED.** Energy and financial accounting follow actual execution. Retain device time, power measurement boundary when available, memory/host residency, transfer costs and failed work. A compressed representation can reduce storage while adding reconstruction or selection work. No monetary saving is inferred here from a nominal compression factor.

## Algorithm

**DERIVED — proposed comparison audit.**

~~~text
Algorithm 14.6 — Build an attention quality–state record
INPUT: finite architecture/layout candidates, workload distribution, quality and latency constraints
OUTPUT: admissible comparison records with unresolved dimensions
STATE: per-candidate logical, allocation, execution and evaluation ledgers
INVARIANT: every accepted claim names its workload and evidence boundary
1. Reconstruct each candidate's required persistent tensors independently.
2. Add page rounding, metadata, replicas and peak temporary state.
3. Validate operator semantics on bounded fixtures before timing.
4. Measure prefill and decode separately at fixed concurrency.
5. Evaluate task quality with held-out task and context slices.
6. Repeat admissible candidates under the stated capacity constraint.
7. Reject or mark incomparable records with missing controls or identities.
8. Retain uncertainty and report quality/state/latency tradeoffs without a universal ranking.
~~~

**DERIVED — complexity.** Shape accounting is linear in retained allocation records after ownership resolution; fixed-width ID sorting costs $O(n\log n)$. Workload profiling and task evaluation dominate the audit. Candidate selection can reuse the two-axis frontier method of [§13.6](../ch13-dense-transformer-design-and-parameter-allocation/13-6-architectural-ablations.md) only after choosing comparable axes; more objectives require a different analysis.

## Implementation

**OFFICIAL-DOCUMENTATION — [R14.6](references.md#r146).** Hugging Face Transformers documents distinct dynamic, static and quantized cache strategies. **DERIVED.** These are implementation choices at *Model definition / adaptation*, not interchangeable architectural guarantees. PyTorch supplies *Model / autograd framework* instrumentation; FlashAttention and FlashMLA supply *Kernels / numerics / collectives* execution routes with separately inspected constraints.

**DERIVED.** Measure after explicit synchronization at the declared boundary. Preserve warm-up policy, cache state, output length, concurrency and allocation snapshots. A whole-process memory observation includes parameters and other runtime state; subtracting two snapshots can also miss temporary peaks. Use tensor ownership and lifetimes to explain observations rather than treating a single memory number as a complete allocation model.

## Experimental design

**PROPOSAL — no benchmark results reported.**

### Experiment 14.6 — Quality under a fixed state and latency envelope

- **Hypothesis:** smaller cache representations enlarge the feasible workload set only when task quality and latency constraints remain satisfied.
- **Setup:** compare explicit MHA/GQA, latent and sparse layouts with independent tensor inventories.
- **Independent variables:** context distribution, representation, selected budget, precision, page size and concurrency.
- **Controlled variables:** task content, evaluator, output budget, hardware, measurement boundary and disclosed training/tuning budget.
- **Dataset/workload:** pinned synthetic retrieval/composition/aggregation tasks and a separately versioned domain set.
- **Hardware:** record accelerator count, memory, topology, host placement, runtime and kernel revision.
- **Metrics:** logical/allocated/reserved/peak bytes, HBM traffic, prefill latency, decode latency, quality slices and failure rate.
- **Baselines:** fixed-concurrency dense execution and capacity-matched operating points.
- **Expected result:** state counts follow their contracts; the quality/latency frontier remains an empirical outcome.
- **Ablation:** exclude metadata, use only short contexts, and report only average task accuracy as deliberately incomplete reports.
- **Interpretation:** a candidate is admissible only under the predeclared joint constraints.
- **Threats to validity:** unmatched checkpoints, allocator reserve, queueing, selector overhead, benchmark tuning and missing failure cases.

## Observations

**What the paper claims.** **PAPER-REPORTED — R14.9.** Broader synthetic context tasks expose behavior beyond simple needle copying.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** Logical capacity, page allocation and repeated history visits have distinct scaling laws.

**What we infer.** **DERIVED.** Attention comparisons require both tensor accounting and task evidence.

**What remains unknown.** **UNVERIFIED.** The admissible quality/state/latency region for the proposed workload has not been measured.

## Failure modes

~~~figure
id: fig-14.20
kind: stat-panel
title: Required comparison boundaries
caption: Eq. 14.21 is only a resource lower bound. Task quality, live allocation and end-to-end measurements remain independent acceptance conditions.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-14.21
alt: Keep logical state, physical allocation, traffic, phase latency and task quality as separate report fields.
spec:
  header: COMPARISON CONTRACT
  rows:
    - {key: state, value: logical and physical}
    - {key: execution, value: prefill and decode}
    - {key: quality, value: task and context slices}
    - {key: uncertainty, value: retained across runs}
~~~

> **Failure mode — nominal context mistaken for use.** **DERIVED.** *Symptom:* long inputs fit but distant evidence is ignored. *Cause:* capacity treated as effective information access. *Detection:* support-position and composition tests. *Mitigation:* retain task-specific quality constraints.

> **Failure mode — ideal bytes mistaken for traffic.** **DERIVED.** *Symptom:* predicted speedup fails despite smaller state. *Cause:* reloads, expansion, selectors or transfers omitted. *Detection:* phase-specific profiling. *Mitigation:* reconcile physical execution before interpreting performance.

## Siblings

**DERIVED.** [Head sharing](14-1-mha-mqa-and-gqa.md), [latent state](14-2-latent-attention.md), [sparsity](14-3-sparse-and-local-attention.md), and [source reuse](14-4-cross-attention.md) address different terms. [Exact execution](14-5-exact-versus-approximate-computation.md) changes scheduling under a fixed contract. Their combined frontier must be measured rather than assembled from unrelated headline gains.

## Extensions

**DERIVED.** Interactive workloads add changing retrieved sources, branching continuations and uncertain output lengths. Multimodal workloads add source-token expansion and encoder residency. The accounting generalizes by summing explicit state owners; the evaluator must still reflect the task's evidence requirements.

## Limitations

**DERIVED.** The resource equations do not model scheduling in full, and synthetic benchmarks cannot certify every deployment domain. Quality differences between checkpoints may originate in data, optimization or adaptation rather than attention alone. Missing controls make a causal architecture claim unresolved.

## Reproducibility

**DERIVED.** Preserve architecture and layout specifications, allocation inventories, source revisions, workload traces, evaluator version, seeds, runtime identities, phase boundaries, synchronization, failure records and uncertainty. The complete chapter-level verification protocol is in [verification.md](verification.md).

## References

[R14.6](references.md#r146); [R14.7](references.md#r147); [R14.9](references.md#r149); [Chapter 13 ablation controls](../ch13-dense-transformer-design-and-parameter-allocation/13-6-architectural-ablations.md).
