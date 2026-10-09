---
id: ms.section.27.6
entity_type: section
title: Integration libraries
short_title: Capability-qualified dispatch
volume: 2
part: 5
chapter: 27
section: 27.6
slug: 27-6-integration-libraries
parent: ms.chapter.27
prev_sibling: ms.section.27.5
next_sibling: null
children: []
prerequisites: [ms.chapter.26, ms.section.27.1, ms.section.27.3, ms.section.27.4, ms.section.27.5]
downstream: [ms.chapter.28, ms.chapter.42, ms.chapter.45]
related: []
relations: []
axes: {lifecycle: [pretraining, inference, serving], mechanism: [kernel_dispatch, compatibility, autotuning], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.flashattention, impl.liger-kernel, impl.nvidia-cutlass, impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# 27.6 — Integration libraries

## Scope

[DERIVED] A library integration is a qualified mapping from an operator contract and environment to an executed backend. We examine FlashInfer, FlashAttention, FlashMLA, Liger Kernel, and xFormers without treating them as substitutes for one another. Success requires correct capability checks, reproducible dispatch, bounded fallback, and an honest measurement boundary. The source window is 2025-12-01 through 2026-10-09; the specific releases below fall inside it. Import success is not a correctness test.

## Why this exists

[DERIVED] A model-level API hides dispatch decisions that depend on device, head width, dtype, layout, mask, graph mode, gradient requirements, and installed dependencies. A fast path may support a strict subset. A fallback may allocate a dense score tensor, synchronize the host, change precision, or reject an input. Calling the integration “supported” without exposing those branches prevents the engineer from predicting correctness and resource use.

[DERIVED] There are also multiple independent version axes. A Python package can be compatible with a framework ABI while its attention backend is absent or unsupported on the device. A cache can have the expected shape but an incompatible scale layout. An autotuning cache can contain a valid tactic for the wrong execution mode. These are distinct failure classes; one version string cannot encode them all.

## Intuition

> **Definition — Capability-qualified dispatch.** [DERIVED] Backend selection restricted to implementations whose operator, representation, environment, and lifetime support predicates hold for the current call.

[MATHEMATICALLY-DERIVED] Treat backend selection as constrained optimization over a finite set. The feasible set contains only implementations whose operator, representation, environment, and lifetime contracts match the call. Correctness is a feasibility condition, not a term traded against latency. Timing chooses among feasible candidates. Persistence is valid only if the saved decision is keyed by every field that can alter feasibility or ranking.

## Formulation

| Symbol | Meaning | Type |
|---|---|---|
| $x$ | Call contract: shapes, strides, dtypes, mask, scale, semantics | Structured record |
| $e$ | Environment: device, driver/runtime, package/backend revisions | Structured record |
| $m$ | Execution mode and lifetime contract | Eager / graph, streams, workspace |
| $\mathcal K$ | Finite candidate backends/tactics | Set |
| $\chi_k(x,e,m)$ | Verified support predicate | Boolean |
| $t_k(x,e,m)$ | Recurring measured call cost | Seconds |
| $C_k$ | One-time preparation/compilation cost | Seconds |
| $n$ | Future compatible invocations | Integer |

[MATHEMATICALLY-DERIVED] The deployment decision is

$$
k^\star\in\arg\min_{k\in\mathcal K:\chi_k(x,e,m)=1}t_k(x,e,m),\qquad
\mathcal K_{\rm feasible}=\varnothing\Rightarrow\mathrm{rejectOrDeclaredFallback}.
$$

*(Eq. 27.21)*

An unknown predicate is not true. Qualification needs documented support plus a local test for the intended path; a mutable API description alone does not establish installed behavior. The fallback's own predicate and memory bounds must also be checked.

## Mechanism

### Separate the five surfaces

[DERIVED] FlashAttention supplies attention-kernel execution; FlashMLA supplies model/cache-specific latent and sparse paths; FlashInfer exposes inference operations and backend dispatch; Liger Kernel covers fused training operators and integrations; xFormers supplies framework-facing components and attention integration. The exact support of each is release-dependent. This classification describes roles rather than claiming each project implements every mechanism in this chapter.

[OFFICIAL-DOCUMENTATION] FlashInfer v0.7 makes a unified MoE API official while retaining backend-specific restrictions. Its experimental policy uses explicit opt-in and separates experimental automatic selection. [R27.6](references.md#r276), unified-MoE/PrimTS notes; [R27.7](references.md#r277), admission and opt-in policy. A stable front-end API and an experimental backend can coexist; the distinction belongs in the support record.

[OFFICIAL-DOCUMENTATION] Liger Kernel v0.8.4 records DeepSeek-V3 integration, configurable transport extras, and correctness fixes including indexing and retained normalization statistics. [R27.8](references.md#r278), Summary and What's Changed. These release notes support change-specific implementation statements, not a promise that all attention or expert paths share one backend.

[OFFICIAL-DOCUMENTATION] xFormers v0.0.35 stops bundling prebuilt FA3 and relies on PyTorch-index wheels. Its stated framework wheel compatibility is separate from kernel capability. [R27.9](references.md#r279), release body. A deployment must consequently retain dependency artifacts, not only the top-level xFormers version.

```figure
id: fig-27.16
kind: diagram
title: Qualified backend selection
caption: The call must pass semantics, representation, and environment checks before timing can select a path. Unsupported input reaches a declared fallback or a rejection.
evidence: DERIVED
source: DERIVED:eq-27.21
alt: An operator call passes a semantic gate, cache/layout gate,and environment/lifetime gate. Qualified candidates are measured under the deployment mode. Selection returns a backend identity; failed gates go to a declared fallback or rejection.
spec:
  direction: LR
  nodes:
    - {id: call, kind: tensor, label: Operator call contract}
    - {id: sem, kind: boundary, label: Semantic support gate}
    - {id: repr, kind: boundary, label: Representation gate}
    - {id: env, kind: boundary, label: Environment and lifetime gate}
    - {id: tune, kind: process, label: Deployment-mode timing}
    - {id: select, kind: state, label: Selected backend identity, emphasis: true}
    - {id: reject, kind: branch, label: Declared fallback or reject}
  edges:
    - {from: call, to: sem}
    - {from: sem, to: repr}
    - {from: repr, to: env}
    - {from: env, to: tune}
    - {from: tune, to: select}
    - {from: sem, to: reject, kind: dependency}
    - {from: repr, to: reject, kind: dependency}
    - {from: env, to: reject, kind: dependency}
```

### The capability record must name semantics

[DERIVED] Shapes alone do not identify an attention call. Equal shapes can differ in absolute-position origin, mask alignment, soft cap, positional transform, scale, dropout, LSE base, or empty-row convention. A decoder's page table has both geometry and ownership. An expert layer has activation choice, capacity/drop policy, route-weight convention, expert placement, and quantized scale layout. Include these in the call record before testing speed.

[DERIVED] Framework integration introduces differentiation and mutation requirements. A forward kernel may have no backward. An in-place operation can overwrite values needed for backward or another graph branch. A graph-safe function can still require preallocated scratch, immutable pointers, and no host inspection during capture. These properties are separate booleans or structured restrictions; “CUDA graph supported” without the corresponding lifetime contract is incomplete.

```figure
id: fig-27.17
kind: compare
title: Integration questions by operator family
caption: The comparison axis is required contract information, not performance. A blank or unknown support field must not be inferred from a neighboring operator's capability.
evidence: DERIVED
source: DERIVED:eq-27.21
alt: Dense attention needs mask, scale,and derivative contracts; paged latent attention additionally needs cache ABI and index interpretation; expert execution needs route, placement,and quantization contracts. All need device and graph lifetime qualification.
spec:
  axis: Contract fields that must be qualified before backend dispatch
  columns:
    - {id: dense, label: Dense attention}
    - {id: latent, label: Paged latent/sparse attention}
    - {id: moe, label: Expert execution}
  rows:
    - {dimension: mathematical boundary, values: {dense: admitted pairs and normalization, latent: selected pairs plus latent projection, moe: accepted weighted routes}}
    - {dimension: representation, values: {dense: strides and operand precision, latent: cache ABI scales and indices, moe: expert layout and routed buffers}}
    - {dimension: ownership, values: {dense: output and gradient reductions, latent: page lifetime and split scratch, moe: dispatch/combine and rank progress}}
    - {dimension: fallback, values: {dense: declared reference operator, latent: compatible cache path or reject, moe: qualified split path or reject}}
    - {dimension: shared qualification, values: {dense: device release graph lifetime, latent: device release graph lifetime, moe: device release graph lifetime}}
```

### Measure the recurring boundary

[MATHEMATICALLY-DERIVED] If device execution costs $d_k$ and recurring host work costs $h_k$, eager cost is at least $d_k+h_k$ when they serialize. Two candidates can satisfy $d_a<d_b$ but $d_a+h_a>d_b+h_b$. A device-only timer then selects the wrong eager implementation even with infinitely many repetitions. Graph replay changes recurring host work and can produce another ranking. This is a measurement-boundary error, not random noise.

[OFFICIAL-DOCUMENTATION] FlashInfer Autotuner v2 offers explicit eager and CUDA-graph measurement and keys persistent decisions by environment, operation, and policy. Its published audit includes omitted key fields and distributed coordination. [R27.10](references.md#r2710), §§1–3 and “Distributed coordination.” The precise measured scope is part of the selected tactic's identity.

[MATHEMATICALLY-DERIVED] Suppose candidate A has extra setup $\Delta C=C_A-C_B>0$ but recurring saving $\Delta t=t_B-t_A>0$. Its total time is favorable only when

$$
C_A+nt_A<C_B+nt_B\quad\Longleftrightarrow\quad n>\frac{\Delta C}{\Delta t},\qquad n_{\min}=\left\lfloor\frac{\Delta C}{\Delta t}\right\rfloor+1.
$$

*(Eq. 27.22)*

The first strictly beneficial integer count is $n_{\min}$; equality only ties the costs. For one second of extra setup and 125 microseconds saved per call, 8000 calls tie and 8001 calls first produce a strict saving. This count assumes compatible repeated calls and unchanged costs. Compilation, weight preprocessing, graph capture, and tuning can have different reuse scopes. A kernel specialization reused across many layers can amortize differently from a weight permutation performed per layer. Record those scopes instead of combining all startup work into a single unexplained number.

```figure
id: fig-27.18
kind: calculator
title: Preparation amortization threshold
caption: First strictly beneficial integer call count from Eq. 27.22, using illustrative setup seconds and recurring microseconds. The count assumes one compatible specialization and excludes queueing, compilation-cache eviction, and changing shapes.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-27.22
alt: Divide extra setup seconds by saved seconds per invocation, take the floor and add one. Two seconds of extra preparation and twenty microseconds saved per call require 100001 compatible invocations for a strict saving; 100000 calls only tie.
spec:
  tex: n_{\min}=\lfloor\Delta C/\Delta t\rfloor+1
  equation: '27.22'
  inputs:
    - {symbol: setup, label: extra setup seconds, default: 2, min: 0.1, max: 60, format: fixed1}
    - {symbol: saving, label: saved microseconds per call, default: 20, min: 1, max: 1000, format: fixed1}
  outputs:
    - {symbol: nbreak, label: first beneficial invocation count, formula: floor(setup*1e6/saving)+1, format: integer, emphasis: true}
```

### Persistent decisions and bounded fallback

[DERIVED] A tuning key needs environment identity, operator semantics, shape/stride bucket, precision/scales, graph policy, and backend-specific options. Coarse bucketing is an approximation: a tactic winning at one shape can lose nearby. Retain the bucket definition and qualification envelope. On cache hit, recheck feasibility; an old winner that no longer satisfies the capability predicate must not execute because its file parsed successfully.

[DERIVED] Fallback is operational behavior. If an unsupported sparse shape falls back to dense attention, the reference may be mathematically appropriate but exceed memory capacity. If cache conversion is required, its cost and lifetime must be charged. If an experimental backend is disabled, automatic selection should stay inside the qualified stable set. A fallback that silently changes masks or capacity policy is not a fallback for the same operator.

[MATHEMATICALLY-DERIVED] For a set of measured feasible candidates, define conditional tuning regret $r_k=(t_k-t_{\min})/t_{\min}$. It measures loss relative to the sampled candidate set and boundary, not a global optimum. Negative estimates can occur when the measurements of $t_k$ and $t_{\min}$ use different noisy samples; report paired repetitions or uncertainty rather than interpreting a negative value as a physical speed advantage over the minimum.

## Algorithm

### Algorithm 27.6 — Capability-first dispatch and persistence

[DERIVED] Inputs are $x,e,m$, a finite registry, a bounded profiling budget, and an explicit fallback. Output is a result plus a machine-readable dispatch trace:

$$
\begin{aligned}
1.&\quad K_f\leftarrow\{k\in\mathcal K:\chi_k(x,e,m)=1\};\quad\mathrm{unknown}\Rightarrow\mathrm{exclude}.\\
2.&\quad K_f=\varnothing\Rightarrow\mathrm{returnQualifiedFallbackOrReject}.\\
3.&\quad\kappa\leftarrow\mathrm{identity}(x,e,m,K_f);\quad w\leftarrow\mathrm{lookup}(\kappa).\\
4.&\quad w\notin K_f\ \lor\ \neg\mathrm{validEntry}(w)\Rightarrow w\leftarrow\varnothing.\\
5.&\quad w=\varnothing\Rightarrow K_q\leftarrow\mathrm{numericalPasses}(K_f);\\
 &\quad K_t\leftarrow\mathrm{successfulBoundedProfiles}(K_q,m);\quad K_t=\varnothing\Rightarrow\mathrm{returnQualifiedFallbackOrReject};\\
 &\quad w\leftarrow\arg\min_{k\in K_t}t_k;\quad\mathrm{persistAtomic}(\kappa,w).\\
6.&\quad\mathrm{checkLifetimeAndCapacity}(w,x,m);\quad y\leftarrow\mathrm{execute}(w,x).\\
7.&\quad\mathrm{return}(y,\kappa,w,\mathrm{fallbackReason},\mathrm{preparationCosts}).
\end{aligned}
$$

[DERIVED] Only candidates passing numerical qualification enter timing, and only candidates with a successful complete-boundary timing enter $K_t$. Budget exhaustion never converts an unmeasured candidate into a zero-time winner. Empty-set fallback/rejection returns immediately, so later lines cannot dereference an absent winner. All loops are bounded by registry size and a predetermined repetition budget. A cache entry retains its qualification envelope and is invalidated when that envelope or implementation identity changes. The invariant is that the executed winner remains feasible for the current call. Stateful qualification and profiling start reference and candidate from independent copies of the same declared state; restore those copies between repetitions. Profiling storage and preparation are charged separately; failed compilation or capture is recorded as unsupported for that exact environment, not converted into a timing sample. The dispatch trace is essential evidence when comparing two “same-model” serving runs.

## Implementation

[DERIVED] **PyTorch** belongs to *Model / autograd framework*; **FlashAttention**, **Liger Kernel**, and **NVIDIA CUTLASS** to *Kernels / numerics / collectives*. FlashInfer, FlashMLA, and xFormers are outside the enumerated stack and explicitly justified in the chapter README. Pin dependency wheels and generated-kernel artifacts alongside top-level packages. None was installed or executed for this manuscript, so API-level evidence does not become CODE-VERIFIED.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] R27.10 evaluates eager/graph selection, cold/warm persistence, key ablations, and rank coordination on its disclosed GPU/workload panels. Its timer audit identifies omitted host work and preparation contamination. Seeds and counts appear in the relevant panel, not as a universal protocol. We retain these controls as source-reported design; no performance number is generalized to our site or proposed kernel artifact.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] R27.10 reports deployment-matched tuning and compatible persistent reuse. R27.6–R27.9 define bounded release/interface changes.

**What the evidence shows.** [DERIVED] The inspected sources show concrete integration contracts and failure-driven changes. They do not certify a fully composed local stack, every shape, or every future release.

**What we infer.** [MATHEMATICALLY-DERIVED] Eqs. 27.21–27.22 make correctness a feasible-set condition and preparation a reuse-dependent cost. An implementation can win device timing yet lose the recurring deployed call.

**What remains unknown.** [UNVERIFIED] Installed compatibility, graph lifetimes, local tactic choices, startup time, latency tails, energy, and dollar cost are unmeasured. An objective “best library” ranking is unsupported.

## Failure modes

> **Failure mode — Tuning-key alias.** [DERIVED] *Symptom:* a restart selects a tactic valid for a different call. *Cause:* missing dtype, layout, route, or execution-mode field. *Detection:* one-field-at-a-time key perturbation. *Mitigation:* explicit identity schema and feasibility recheck.

> **Failure mode — Silent resource-expanding fallback.** [DERIVED] *Symptom:* unsupported input OOMs despite normal fast-path memory use. *Cause:* materialized dense fallback. *Detection:* unsupported-shape and peak-memory tests. *Mitigation:* capacity-aware fallback or rejection.

## Siblings

[DERIVED] Fixed dispatch minimizes policy overhead but requires a qualified shape envelope. Online tuning adapts within a finite registry but adds preparation and persistence complexity. Offline tuning moves that cost earlier while depending on deployment match. [Chapter 28](../ch28-frameworks-graph-compilers-and-runtime-integration/README.md) owns graph/compiler integration; this section supplies its kernel capability contract.

## Extensions

[DERIVED] A new backend first enters as an explicitly qualified candidate with a reference, supported envelope, failure path, and reproducible artifact. An experimental-policy graduation is a project governance event, not a mathematical proof. Changing precision or model semantics requires a new qualification record even when API names stay fixed.

## Limitations

[DERIVED] A finite candidate search cannot establish global optimality. Contract fields can be incomplete, and framework transformations can change the executed path. Retain draft status until actual execution traces, numerical checks, and resource measurements close those gaps.

## Reproducibility

[DERIVED] Archive package/build hashes, framework/runtime/compiler/driver identities, device topology, capability matrix, tuning keys, candidate errors, preparation and recurring timings, fallback trace, and graph/workspace ownership. A lockfile is necessary dependency evidence but not sufficient execution evidence. The protocol remains an unexecuted proposal.

## References

[R27.6](references.md#r276), v0.7 release; [R27.7](references.md#r277), experimental policy; [R27.8](references.md#r278), v0.8.4; [R27.9](references.md#r279), v0.0.35; [R27.10](references.md#r2710), measurement, identity, persistence, and coordination sections.
