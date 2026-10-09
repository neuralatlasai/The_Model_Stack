---
id: ms.section.28.5
entity_type: section
title: Integration boundaries
short_title: Integration boundaries
volume: 2
part: 5
chapter: 28
section: 28.5
slug: 28-5-integration-boundaries
parent: ms.chapter.28
prev_sibling: ms.section.28.4
next_sibling: ms.section.28.6
children: []
prerequisites:
- ms.chapter.19
- ms.chapter.25
- ms.chapter.26
- ms.chapter.27
downstream:
- ms.chapter.29
- ms.chapter.30
- ms.chapter.42
related: []
relations: []
axes:
  lifecycle:
  - pretraining
  - inference
  - serving
  mechanism:
  - graph_compilation
  - runtime_integration
  feedback_setting: []
  modality:
  - text
  - image
  - audio
papers: []
implementations:
- impl.nvidia-cuda
- impl.triton-language
- impl.nvidia-cutlass
- impl.amd-hip
- impl.pytorch
- impl.jax
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used:
  - OFFICIAL-DOCUMENTATION
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - ASSUMED
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 1800
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# 28.5 — Integration boundaries

## Scope

[DERIVED] This section owns the contract between a framework-transformed program and an external operator, library or backend: signatures, abstract metadata, derivatives, mutation, aliasing, placement, streams and fallback. Success means that replacing a supported operation preserves the declared outputs, state transition and requested transformations. An isolated fast kernel is insufficient. Evidence is restricted to PyTorch 2.14 and the released JAX 0.11.2 snapshot; these are current interface contracts, not claims that every mechanism originated in 2026. Kernel numerical analysis belongs to Chapter 26; runtime scheduling belongs to §28.4.

## Why this exists

[OFFICIAL-DOCUMENTATION] PyTorch's 2.14 `torch.library` documentation separately describes registration correctness and gradient correctness. JAX's 0.11.2 FFI guide states that foreign calls are opaque to transformation and require supplied differentiation rules. [R28.11], “Testing custom ops”; [R28.12], “Supporting transformations like vmap and grad”. [DERIVED] Both surfaces expose the same engineering gap: executable machine code does not tell the surrounding compiler what it may infer, reorder, batch, differentiate or retain.

[DERIVED] A boundary can invalidate optimization while producing a plausible first output. A wrong abstract output stride can select an incompatible downstream implementation. Undeclared mutation can make a compiler reuse an obsolete value. A backward routine can accidentally use an already overwritten input. A host function can return before a private stream has finished writing. These are separate failures with separate oracles; adding a forward-value assertion does not close them. Integration is therefore a proof obligation over a family of supported executions rather than a wrapper around a pointer.

## Intuition

[MATHEMATICALLY-DERIVED] Think of an external operation as three cooperating programs. The concrete implementation computes values and authorized effects. An abstract implementation computes what can be known without reading those values. Transformation rules explain how the operation participates in differentiation, batching and placement. Their descriptions must agree on the same operation. A correct abstract shape with an incorrect derivative remains incorrect; a correct derivative cannot rescue an undeclared write. The safe supported domain is the intersection of these contracts, not the union of individually working demonstrations.

## Formulation

| Symbol | Meaning |
|---|---|
| $F(x,s)=(y,s')$ | Declared operation with explicit initial and resulting state |
| $K$ | Concrete external implementation |
| $\alpha$ | Abstraction retaining shape, dtype, strides, device and required static facts |
| $\widehat F$ | Abstract metadata implementation |
| $\bar y,\bar x$ | Output and input cotangents |
| $\mathcal D$ | Admitted inputs and execution environments |
| $\mathcal T$ | Requested transformations and their compositions |
| $\mathcal E$ | Allowed observable effects and ordering relationships |

[MATHEMATICALLY-DERIVED] The boundary must satisfy, for every admitted $(x,s)$ and requested $T\in\mathcal T$,

$$
\operatorname{Obs}(K(x,s))\simeq_\tau\operatorname{Obs}(F(x,s)),\qquad
\alpha(y)=\widehat F(\alpha(x),\alpha(s)),\qquad
\bar x=J_{\pi_yF,x}(x,s)^\top\bar y.
$$

*(Eq. 28.5)*

where $\operatorname{Obs}$ includes specified state and effects, $\simeq_\tau$ is the declared numerical acceptance relation, $\pi_yF$ projects onto the differentiable output, and the derivative is required only when differentiation is supported. A loss that also differentiates resulting state needs the corresponding expanded cotangent contract. Transformation compositions must also preserve these observations. The metadata identity is exact; floating-point tolerance does not excuse the wrong device or alias relationship.

## Mechanism

### Methodology

[DERIVED] **Signature and admitted domain.** Declare rank, dtype, layout, alignment, static attributes, supported devices and exceptional inputs before choosing a fast path. A wrapper must either implement every admitted case or reject/route unsupported cases explicitly. “Contiguous input” is a precondition with a cost if the caller must create it. A conversion belongs inside the measured boundary whenever production requires it. An empty dimension, noncontiguous view or alternate floating-point dtype can select a completely different path.

[OFFICIAL-DOCUMENTATION] The examined PyTorch snapshot requires precise mutation/alias contracts; its functional custom operators return fresh values, while conventional in-place and `out=` patterns have specific tags and rules. Arbitrary views are not modeled by the general `custom_op` interface. Fake implementations describe output metadata without reading tensor storage. [R28.11], “Choosing the kind of custom op”, “More details on mutation, aliasing, and transforms”, and `register_fake`. [DERIVED] The wrapper cannot silently return an input view while claiming a fresh result. Functionalization is allowed to reason from the registered contract, so misleading metadata can change program meaning even when eager execution appears satisfactory.


```figure
id: fig-28.15
kind: diagram
title: One operation, several compatible contracts
caption: The external implementation, abstract metadata and transformation rules describe one admitted operation.
  An accepted boundary also specifies effects, ownership and completion ordering; a successful pointer call covers
  only one branch.
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.5
alt: The external implementation, abstract metadata and transformation rules describe one admitted operation. An
  accepted boundary also specifies effects, ownership and completion ordering; a successful pointer call covers
  only one branch.
concepts:
- ms.section.28.5
spec:
  direction: LR
  nodes:
  - id: sig
    kind: boundary
    label: Admitted signature and state
  - id: val
    kind: process
    label: Concrete external execution
  - id: abs
    kind: process
    label: Abstract metadata execution
  - id: tr
    kind: process
    label: Derivative and batching rules
  - id: obs
    kind: tensor
    label: Outputs and authorized next state
  - id: life
    kind: memory
    label: Live buffers and completion events
  - id: ok
    kind: state
    label: Common observable contract
  edges:
  - from: sig
    to: val
  - from: sig
    to: abs
  - from: sig
    to: tr
  - from: val
    to: obs
  - from: val
    to: life
  - from: abs
    to: ok
    kind: dependency
  - from: tr
    to: ok
    kind: dependency
  - from: obs
    to: ok
    kind: emphasis
  - from: life
    to: ok
    kind: dependency
```


[DERIVED] **Abstract execution.** Shape arithmetic should use admitted symbolic dimensions. A data-dependent output length requires an appropriate symbolic representation or an explicit unsupported boundary; reading a host scalar during abstract execution is not a shape rule. Check output strides and dtype as carefully as sizes. An abstract implementation may be cheap, but it is executable specification: downstream allocation and specialization decisions depend on it.

[MATHEMATICALLY-DERIVED] **Derivative construction.** For an original example, normalize a real row $x\in\mathbb R^n$ with $n>0$ and $\epsilon>0$: $r=(n^{-1}\sum_jx_j^2+\epsilon)^{1/2}$ and $y_i=x_i/r$. Let $g_i=\partial L/\partial y_i$. Since $dr=(nr)^{-1}\sum_jx_j\,dx_j$,

$$
dy_i=\frac{dx_i}{r}-\frac{x_i}{nr^3}\sum_jx_j\,dx_j,
\qquad
\bar x_i=\frac{g_i}{r}-\frac{x_i}{nr^3}\sum_jg_jx_j.
$$

*(Eq. 28.15)*

where $n$ is the normalized row width, $r$ its positive scale, and $g$ the upstream cotangent. Summing $g_i\,dy_i$ and collecting each $dx_j$ proves the reverse rule. A saved $r$ reduces recomputation, but its dtype and lifetime are part of the implementation contract. The derivation is real-arithmetic; a low-precision saved inverse scale introduces a separate numerical error.


```figure
id: fig-28.16
kind: tensor-flow
title: Normalization backward preserves the row axis
caption: For the derived real row normalization, saved scales have one value per row. Backward reduces the elementwise
  product of input and output cotangent across the feature dimension, then broadcasts the correction. Feature sharding
  requires those reductions to be global.
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.15
alt: For the derived real row normalization, saved scales have one value per row. Backward reduces the elementwise
  product of input and output cotangent across the feature dimension, then broadcasts the correction. Feature sharding
  requires those reductions to be global.
concepts:
- ms.section.28.5
spec:
  dims:
    R: Independent rows
    N: Normalized feature width
  steps:
  - shape: '[R, N]'
    label: Input x and upstream cotangent g
  - shape: '[R, 1]'
    label: Saved positive scale r
    op: Forward reduction of squared input
  - shape: '[R, N]'
    label: Product g times x
    op: Elementwise product
  - shape: '[R, 1]'
    label: Row inner product
    op: Reduce across N
  - shape: '[R, N]'
    label: Input cotangent
    op: Broadcast scale and correction
```


[DERIVED] **Transformation closure.** A first-order reverse rule does not establish forward-mode differentiation, second derivatives, batching of backward, or partitioning. For the row example, batching adds rows without changing the reduction axis. Sharding rows is local; sharding the normalized dimension requires a global sum of squares and the corresponding backward inner product. A local-only routine applied to feature shards computes a different function. Test the actual requested composition, such as batched gradients, instead of treating a list of independently passing transforms as compositional proof.

[OFFICIAL-DOCUMENTATION] The JAX snapshot's tutorial supplies explicit primitive rules for differentiation/batching, labels HiJAX experimental, and explains that its illustrated primitive supports first-order rather than higher-order differentiation. Its CUDA binding obtains the platform stream from the FFI context. [R28.12], “Supporting transformations like vmap and grad” and “FFI calls on a GPU”. [DERIVED] A foreign launch must participate in the caller's happens-before graph. If a private stream is necessary, an explicit event relationship must order consumption and buffer release; a process-wide synchronization can hide a missing relationship while changing latency.

[DERIVED] **State, ownership and fallback.** Enumerate persistent library handles, random state, workspaces, allocator ownership and possible host callbacks. A returned buffer remains live until every authorized consumer completes. A saved forward input remains valid until backward consumes it; retaining a pointer does not prevent the owner from reusing storage. Fallback must preserve output/state semantics and expose when it runs. A supposedly fast integration that frequently falls back can be correct but economically unattractive, so track fallback counts and conversion bytes separately from kernel time.

[DERIVED] **Compile-cache correctness.** Separate the operator's runtime inputs from assumptions fixed during tracing/lowering. In the normalization example, a static $\epsilon$ can become part of the compiled program; changing it is different from passing a new runtime tensor. The integration's reproducibility identity also includes the schema, abstract and derivative rules, extension binary and selected lowering. If any compile-time assumption changes, reuse requires either documented compatible indirection or invalidation. Do not assume that an unchanged foreign-target name means an unchanged implementation. The actual internal key is version-specific; the JAX snapshot lists its key inputs but does not promise to hash every third-party shared library. [R28.13], “How it works”. Test reuse in a fresh process as well as a warm one, retain extension digests, and compare the cached route with a deliberately fresh compilation after changing each relevant assumption. A cache hit is evidence of reuse, not evidence of semantic equivalence.

[MATHEMATICALLY-DERIVED] For a serial boundary, let $t_k$ be external-kernel time, $t_a$ adaptation time, $t_l$ launch/dispatch time, $t_s$ required synchronization, and $t_r$ reference time. Replacement helps this boundary only if

$$
t_{\mathrm{boundary}}=t_a+t_l+t_k+t_s<t_r.
$$

*(Eq. 28.17)*

where every $t$ uses the same time unit. If phases overlap, measure their critical path rather than sum overlapping intervals. Compiler opportunities lost across an opaque boundary can add costs outside this local inequality; full-step timing remains necessary.


```figure
id: fig-28.17
kind: calculator
title: A fast kernel can lose at its boundary
caption: Illustrative serial time accounting in microseconds. Adaptation, dispatch and synchronization are included
  in the candidate boundary. Inputs are authored examples rather than measured PyTorch or JAX results; overlapping
  paths require critical-path measurement instead.
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.17
alt: Illustrative serial time accounting in microseconds. Adaptation, dispatch and synchronization are included
  in the candidate boundary. Inputs are authored examples rather than measured PyTorch or JAX results; overlapping
  paths require critical-path measurement instead.
concepts:
- ms.section.28.5
spec:
  equation: '28.17'
  tex: t_{boundary}=t_a+t_l+t_k+t_s
  inputs:
  - symbol: a
    label: Adaptation time (us)
    default: 12
    min: 0
    max: 1000
    format: raw
  - symbol: l
    label: Launch time (us)
    default: 4
    min: 0
    max: 1000
    format: raw
  - symbol: k
    label: External kernel time (us)
    default: 20
    min: 0
    max: 1000
    format: raw
  - symbol: s
    label: Synchronization time (us)
    default: 8
    min: 0
    max: 1000
    format: raw
  - symbol: r
    label: Reference boundary time (us)
    default: 40
    min: 1
    max: 2000
    format: raw
  outputs:
  - symbol: t
    label: Candidate boundary (us)
    formula: a+l+k+s
    format: raw
  - symbol: gain
    label: Reference over candidate
    formula: r/max(a+l+k+s,0.000001)
    format: raw
```


## Algorithm

**Algorithm 28.5 — Admit an external operation by contract.** [DERIVED] Inputs are a proposed implementation $K$, declared domain $\mathcal D$, transformation set $\mathcal T$, concrete reference $F$, and predeclared tolerance policy $\tau$. Output is a versioned accepted subset or a failure record; finite fixtures provide evidence, not exhaustive proof. Each fixture has an immutable initial snapshot $z_c^0=(x_c^0,s_c^0)$ and common transformation inputs $u_{c,T}$, including identical cotangents/tangents where applicable. Restoration preserves aliases within a fixture while isolating candidate and reference storage and external state.

$$
\begin{aligned}
1.\quad &\mathcal A\gets\varnothing;\quad
 \mathcal C\gets\operatorname{classes}(\mathcal D,\mathcal T).\\
2.\quad &\forall c\in\mathcal C:\ z_c^0\gets\operatorname{snapshotFixture}(c);\quad
 \neg\operatorname{checkSignatureEffects}(K,c)\Rightarrow
 \operatorname{failAndSkipClass}(c).\\
3.\quad &(x_K,s_K)\gets\operatorname{restoreIndependent}(z_c^0);\quad
 (y,s')\gets K(x_K,s_K);\\
&\alpha(y)\ne\widehat F(\alpha(x_c^0),\alpha(s_c^0))\Rightarrow
 \operatorname{failAndSkipClass}(c).\\
4.\quad &\forall T\in\{\operatorname{Id}\}\cup\operatorname{requestedCompositions}(c):\\
&z_K,z_F\gets\operatorname{restoreIndependentPair}(z_c^0);\quad
 o_K\gets T(K)(z_K;u_{c,T});\quad o_F\gets T(F)(z_F;u_{c,T});\\
&\neg\bigl(\operatorname{Obs}(o_K)\simeq_\tau\operatorname{Obs}(o_F)\bigr)
 \Rightarrow\operatorname{failAndSkipClass}(c).\\
5.\quad &\neg\operatorname{checkAliasesLifetimesEvents}(c)\Rightarrow
 \operatorname{failAndSkipClass}(c);\\
&\neg\operatorname{repeatPairedStateSequences}(z_c^0,c)\Rightarrow
 \operatorname{failAndSkipClass}(c);\quad
 \operatorname{recordFallbacks}(c).\\
6.\quad &\operatorname{allChecksPass}(c)\Rightarrow
 \mathcal A\gets\mathcal A\cup\{c\};\quad
 \operatorname{return}(\mathcal A,\operatorname{manifest}).
\end{aligned}
$$

[DERIVED] Here $\operatorname{failAndSkipClass}(c)$ records failure and skips every remaining check and admission step for that class. A rejected class is excluded or routed through a separately checked fallback. Common transformation inputs have equal values in independent storage. Repetitions restore independent initial state before each paired trial; a stateful sequence instead evolves two independent states over the same declared input/random sequence. The invariant is that each accepted class has the same specified observations and an explicit transformation envelope. Termination follows from finite fixtures and timeout-bounded execution; a hanging launch is failure. Cost is the sum of tested transformed executions, not merely the number of API registrations. Domain coverage remains a scientific review obligation.

## Implementation

[OFFICIAL-DOCUMENTATION] **PyTorch — MODEL / AUTOGRAD FRAMEWORK layer.** Pin 2.14. Use the documented custom-operator schema, fake behavior and autograd registration paths. `opcheck` checks registration properties; `gradcheck` addresses mathematical gradients. [R28.11], “Testing custom ops”. **JAX — MODEL / AUTOGRAD FRAMEWORK layer.** Pin JAX 0.11.2 and separately record `jaxlib`, backend and extension build identities; the FFI call must identify its target and platform. [R28.12], “Building and registering an FFI handler”. [DERIVED] These names identify integration surfaces, not proof that the external library supports every transformation.

[DERIVED] Record ABI, compiler options, linked libraries and kernel/device compatibility beside the operator's source digest. Save abstract and concrete traces for a failing class. Distinguish load failure, missing target, unsupported signature, graph break, mathematical mismatch and timing regression. These failure classes require different remediation; an unconditional eager fallback can conceal several of them.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] The inspected API pages supply functional examples and registration/testing procedures. The JAX guide explicitly says its generated page lacks a GPU execution environment. Its CPU reference comparisons illustrate supported examples; they are not a hardware-qualified throughput study. [R28.12], “Frontend code”, “Supporting transformations like vmap and grad”, and “FFI calls on a GPU”. [NOT-DISCLOSED] These sources do not supply a common end-to-end benchmark, independent replications, repeated-run uncertainty or a universal external-kernel speed advantage.

[DERIVED] The chapter's proposed verification therefore separates schema/effect checks, forward/derivative comparisons, repeated-state execution, composed transforms and complete-boundary performance. The unexecuted protocol is in [verification](verification.md). Source examples establish intended usage; they do not establish the book's proposed candidate integration.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The versioned interfaces provide mechanisms to declare metadata, effects and transformation behavior; the JAX example has explicit first-order limits. [R28.11–R28.12], locators above.

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] The documentation distinguishes registration tests from gradient tests and supplies worked functional examples. [UNVERIFIED] No book integration, GPU benchmark or independently reproduced transform-composition result is claimed.

**What we infer.** [MATHEMATICALLY-DERIVED] Equation 28.5 makes correctness conjunctive, and Eq. 28.17 makes speed conditional on the complete replacement cost. Passing a single forward comparison satisfies neither conjunction.

**What remains unknown.** [UNVERIFIED] The accepted signature envelope, higher-order rules, placement behavior, graph-capture compatibility and numerical/performance results of any project-specific external library remain untested.

## Failure modes

> **Failure mode — Hidden mutation.** [DERIVED] *Symptom:* compiled repeated calls disagree with eager state. *Cause:* the implementation writes storage absent from its effect contract. *Detection:* compare aliases and state before/after each call. *Mitigation:* declare supported mutation or return a fresh functional result.

> **Failure mode — Premature buffer reuse.** [DERIVED] *Symptom:* results vary with unrelated stream activity. *Cause:* completion is not ordered before consumption or release. *Detection:* inspect events and allocation lifetimes under concurrent workloads. *Mitigation:* establish caller-compatible event dependencies and ownership.

> **Failure mode — Incomplete derivative closure.** [DERIVED] *Symptom:* gradient works while batched or higher-order gradient fails. *Cause:* a subordinate foreign call lacks the needed rule. *Detection:* test requested compositions. *Mitigation:* implement those rules or explicitly reject that transformation.

## Siblings

[DERIVED] **Framework composition** leaves the operation visible to existing transformations and fusion but may not expose enough low-level control. **A compiler-visible lowering** preserves more optimization opportunity while binding the integration to an IR/backend contract. **An opaque custom call** can reuse specialized machine code but requires explicit metadata/effect/derivative obligations. **An eager fallback** expands functional coverage while potentially breaking capture and adding dispatch or conversion overhead. Compare identical admitted semantics; none is universally superior.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] PyTorch 2.14's release describes a broader Helion registry interface, while stating that the backend must be installed and that this release routes no default operators through it. [R28.1], “Helion Backend Integration”. [DERIVED] Registration infrastructure is an integration capability, not evidence of an achieved default-model speedup. Its practical benefit depends on subsequently registered operators and tested selection paths. [NOT-DISCLOSED] The inspected sources do not isolate a quantitative end-to-end contribution for the hypothetical operation developed here.

## Limitations

[DERIVED] Finite fixtures cannot prove an arbitrary external program correct. Symbolic metadata, alias checking and derivative identities each cover a different part of the boundary. Non-differentiable branches require a separately defined derivative convention; complex inputs require a declared conjugation convention; asynchronous failures require a recorded error boundary. Those domains are excluded from the real-row derivation unless explicitly extended.

## Reproducibility

[DERIVED] Retain the released documentation snapshot, exact extension/build digest, schema, admitted input classes, symbolic/fake outputs, derivative rules, effect declarations, event traces, fallback counters and numerical policy. Record unsupported cases as exclusions, not missing data. **UNVERIFIED:** no implementation or timing experiment was executed for this manuscript. The document remains `manuscript_draft` pending technical review and the declared verification work.

## References

- [R28.1](references.md) — PyTorch 2.14 release, “Helion Backend Integration”; release-qualified integration capability only.
- [R28.11](references.md) — `torch.library`, released 2.14 snapshot; named testing, mutation and fake-registration headings above.
- [R28.12](references.md) — JAX 0.11.2 pinned `docs/ffi.md`; frontend, transform, GPU and sharding contracts, not a claim of original 2026 invention.
- [R28.13](references.md) — JAX 0.11.2 pinned cache guide, “How it works”; internal key inputs versus the broader external-operation identity.
