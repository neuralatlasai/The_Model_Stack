---
id: ms.section.28.6
entity_type: section
title: Deployment reproducibility
short_title: Deployment reproducibility
volume: 2
part: 5
chapter: 28
section: 28.6
slug: 28-6-deployment-reproducibility
parent: ms.chapter.28
prev_sibling: ms.section.28.5
next_sibling: null
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

# 28.6 — Deployment reproducibility

## Scope

[DERIVED] This section owns the identity and validation of a compiled deployment: versions, build artifacts, constants, shape envelopes, cache state, loading, warmup, numerical drift and portability. Success is a reproducible execution claim with explicit compatibility boundaries and complete cold/warm accounting. A checkpoint file or a successful cache lookup is insufficient. The inspected evidence consists of releases and versioned documentation in the permitted date window; inherited documentation describes the released contract and is not presented as new 2026 research. Serving policy and production capacity planning belong to later chapters.

## Why this exists

[OFFICIAL-DOCUMENTATION] PyTorch 2.14's release explicitly distinguishes interpreter support from compiler support: Python 3.15 is eager-only for this release. The JAX 0.11.2 cache snapshot lists multiple compilation-key inputs, not just the Python function's name. [R28.1], “torch.compile is not yet supported on Python 3.15”; [R28.13], “How it works”. [DERIVED] These concrete boundaries defeat the assumption that reinstalling a named framework and loading the same parameters reconstructs the same executable route.

[DERIVED] Deployment combines artifacts produced at different times: model parameters, graph export, compiler-generated code, tuning selections, extension libraries and runtime configuration. A process may import successfully yet compile a different specialization, silently use a fallback or miss a warm cache. A package may load while referring to constants whose lifetime has ended. A reported steady-state latency can omit minutes of preparation. The necessary change is to identify and validate the whole execution contract, then measure each claimed operational regime separately.

## Intuition

[MATHEMATICALLY-DERIVED] A deployment artifact is a partial evaluation of a program under assumptions. Its reusable domain consists of inputs and environments that satisfy those assumptions. Changing a weight that is a runtime input differs from changing a weight embedded as a compile-time constant. Changing an input dimension inside a declared symbolic interval differs from leaving that interval. A cache key is an implementation's reuse discriminator; a deployment manifest is a broader scientific record of what was executed. Neither can stand in for the other.

## Formulation

| Symbol | Meaning |
|---|---|
| $G,W$ | Program/graph identity and parameter/constant identities |
| $V$ | Framework, compiler, library, ABI and extension versions/builds |
| $H$ | Device, topology, driver and relevant hardware configuration |
| $C$ | Compiler/runtime flags, precision and tuning choices |
| $S$ | Admitted signature and shape constraints |
| $\mathcal M$ | Full deployment manifest |
| $k$ | Implementation-specific compilation-cache key |
| $N$ | Completed calls over a stated workload distribution |

[MATHEMATICALLY-DERIVED] Define the reproducibility identity and admitted execution set as

$$
\mathcal M=(G,W,V,H,C,S,\mathcal E),\qquad
\operatorname{admit}(x,e)\iff (\alpha(x),e)\models(S,V,H,C,\mathcal E),\qquad
k=h(\pi_{\mathrm{cache}}(\mathcal M)).
$$

*(Eq. 28.6)*

where $\mathcal E$ records effect/ownership assumptions, $\alpha$ is input metadata abstraction, $e$ the execution environment, $h$ a cache-key function and $\pi_{\mathrm{cache}}$ the implementation's actual key inputs. This notation does not assert that a framework hashes every manifest field. Some fields require a separate admissibility check even after a cache hit.

## Mechanism

### Methodology

[DERIVED] **Artifact identity.** Record a content digest for graph/export, weights/constants, generated code and custom libraries; retain the producer command and configuration. A framework version string alone does not identify a locally patched build. Include source commit, wheel/container digest, interpreter, ABI and extension compiler options where they affect execution. Preserve the declared dynamic constraints alongside the graph. A familiar filename can point to different bytes, while identical parameter bytes can run through different graphs.

[DERIVED] **Compatibility versus reproducibility.** Binary loading, semantic acceptance, numerical acceptance and performance acceptance are separate gates. A target may load the package and execute correctly while selecting a slower kernel. Another target may rebuild from the same source and satisfy the numerical policy without reproducing the original binary. State the claim: same artifact, same logical result, bounded numerical deviation, or comparable latency. The manifest must support that exact claim rather than imply all four.

[OFFICIAL-DOCUMENTATION] The pinned JAX cache guide includes nonoptimized HLO, `jaxlib`, relevant XLA flags, device configuration, compression and a custom-hook string in the key. For GPU topology, the guide describes a GPU-name representation. [R28.13], “How it works”. [DERIVED] Record richer topology and runtime details in $\mathcal M$ rather than assuming the internal key captures the entire experimental environment. A cache hit can be legitimate under the implementation's rule while still requiring deployment validation.


```figure
id: fig-28.18
kind: diagram
title: Cache reuse remains inside deployment validation
caption: An artifact is admitted against its target and signature constraints before reuse. A trusted matching cache
  entry changes reconstruction work; it does not replace constant ownership, numerical checks or the recorded deployment
  manifest.
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.6
alt: An artifact is admitted against its target and signature constraints before reuse. A trusted matching cache
  entry changes reconstruction work; it does not replace constant ownership, numerical checks or the recorded deployment
  manifest.
concepts:
- ms.section.28.6
spec:
  direction: LR
  nodes:
  - id: m
    kind: state
    label: Manifest and artifact digests
  - id: ad
    kind: boundary
    label: Target and signature admission
  - id: cache
    kind: memory
    label: Trusted matching executable cache
  - id: build
    kind: process
    label: Trace lower compile on miss
  - id: load
    kind: process
    label: Load and establish constant lifetime
  - id: val
    kind: process
    label: Validate state and numerical envelope
  - id: run
    kind: state
    label: Recorded accepted deployment
  edges:
  - from: m
    to: ad
  - from: ad
    to: cache
  - from: ad
    to: build
  - from: cache
    to: load
    kind: dependency
  - from: build
    to: load
  - from: load
    to: val
  - from: val
    to: run
    kind: emphasis
```


[DERIVED] **Cache regimes.** Distinguish a new process with an empty persistent cache, a new process with a usable persistent cache, and repeated calls in a warm process. The first may trace, lower, compile and tune. The second may still trace, compute keys, read and deserialize artifacts, initialize a device context and load constants. The third can avoid much of that work while retaining allocations and executable handles. Describe cache state per artifact family; clearing one cache does not prove that every tuning or kernel cache is cold.

[MATHEMATICALLY-DERIVED] Under an explicitly serial timing model, preparation cost $C_0$ and warm call time $t_w$ give

$$
T_N=C_0+Nt_w,\qquad \overline t_N=t_w+\frac{C_0}{N},\qquad
N>\frac{C_{0,c}-C_{0,b}}{t_b-t_c}\quad(t_b>t_c).
$$

*(Eq. 28.16)*

where $b,c$ denote baseline/candidate and the last inequality assumes the candidate has greater preparation cost. It follows by comparing $C_{0,c}+Nt_c$ with $C_{0,b}+Nt_b$. If the candidate is both slower warm and more expensive to prepare, no positive call count repairs the difference. With overlap or varying signatures, use measured critical paths and per-specialization costs rather than this additive model.


```figure
id: fig-28.19
kind: calculator
title: Preparation cost changes the break-even horizon
caption: Authored serial accounting in milliseconds, not measured framework latency. A candidate with lower warm
  time can still cost more over a short run. The call count must describe completed useful work under the same input
  distribution.
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.16
alt: Authored serial accounting in milliseconds, not measured framework latency. A candidate with lower warm time
  can still cost more over a short run. The call count must describe completed useful work under the same input
  distribution.
concepts:
- ms.section.28.6
spec:
  equation: '28.16'
  tex: T_N=C_0+Nt_w
  inputs:
  - symbol: b
    label: Baseline preparation (ms)
    default: 100
    min: 0
    max: 100000
    format: raw
  - symbol: c
    label: Candidate preparation (ms)
    default: 2100
    min: 0
    max: 100000
    format: raw
  - symbol: tb
    label: Baseline warm call (ms)
    default: 12
    min: 0.1
    max: 1000
    format: raw
  - symbol: tc
    label: Candidate warm call (ms)
    default: 8
    min: 0.1
    max: 1000
    format: raw
  - symbol: n
    label: Completed calls
    default: 100
    min: 1
    max: 100000
    format: raw
  outputs:
  - symbol: base
    label: Baseline total (ms)
    formula: b+n*tb
    format: raw
  - symbol: cand
    label: Candidate total (ms)
    formula: c+n*tc
    format: raw
  - symbol: amort
    label: Candidate mean (ms)
    formula: tc+c/n
    format: raw
```


[DERIVED] **Warmup is a workload.** Enumerate the shape, dtype, device, control-flow and concurrency classes to be warmed. A single example cannot warm an unbounded shape distribution. If requests trigger new specializations, account for their frequency and compilation interference. A queueing service can expose preparation to concurrent users even when the triggering request eventually succeeds. Measure the first completed useful result and the interval to the declared warm state separately. Host launch completion is not device completion.

[OFFICIAL-DOCUMENTATION] PyTorch 2.14's external-constant constructor uses caller-owned tensors and is exposed through the C ABI. Its pinned asynchronous constant-copy path is opt-in before container creation. [R28.1], “AOTInductor External Constants and Zero-Copy Weight Sharing” and “AOTInductor Constant Loading”. [DERIVED] A deployment manifest must therefore include ownership and loading mode. Sharing constant storage reduces duplication only while its contents, device access and lifetime satisfy every consuming container's contract. Record first-ready time and peak staging memory separately from warm execution.

[MATHEMATICALLY-DERIVED] **Numerical acceptance.** For finite, corresponding reference/candidate outputs $y,\widetilde y$, a useful declared componentwise rule is

$$
e_\tau(y,\widetilde y)=\max_i
\frac{|\widetilde y_i-y_i|}{a+r|y_i|}\le 1,
\qquad a>0,\quad r\ge0.
$$

*(Eq. 28.18)*

where $a,r$ are preselected absolute and relative tolerances. This formula is an acceptance policy, not proof that a compiler satisfies it. Nonfinite values, shapes, integer indices, masks and discrete branch choices need explicit separate rules. A small floating-point error can cross a routing or stopping threshold and change later control flow; inspect those discrete observations as well.

[MATHEMATICALLY-DERIVED] **Trajectory drift.** If two state updates satisfy $\|\widetilde s_{t+1}-s_{t+1}\|\le L\|\widetilde s_t-s_t\|+\epsilon_t$, repeated substitution yields $\|\widetilde s_T-s_T\|\le L^T\|\widetilde s_0-s_0\|+\sum_{t=0}^{T-1}L^{T-1-t}\epsilon_t$. The inequality assumes a valid Lipschitz/error bound over the visited states; this manuscript does not assert such a bound for a trained model. It explains why one-step output parity cannot establish long-horizon training or decoding equivalence. Statistical task acceptance and exact replay are different claims.


```figure
id: fig-28.20
kind: matrix
title: Different claims require different evidence
caption: A filled cell marks an authored evidence obligation, not a measured pass rate. Rows are binary identity,
  semantic behavior, numerical envelope and performance comparability; columns are artifact digests, discrete/state
  checks, numerical comparisons and timing traces. The staircase shows that a stronger operational claim accumulates
  evidence rather than replacing prior gates.
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.6
alt: A filled cell marks an authored evidence obligation, not a measured pass rate. Rows are binary identity, semantic
  behavior, numerical envelope and performance comparability; columns are artifact digests, discrete/state checks,
  numerical comparisons and timing traces. The staircase shows that a stronger operational claim accumulates evidence
  rather than replacing prior gates.
concepts:
- ms.section.28.6
spec:
  rows: 4
  cols: 4
  pattern: explicit
  cells:
  - - 1
    - 0
    - 0
    - 0
  - - 1
    - 1
    - 0
    - 0
  - - 1
    - 1
    - 1
    - 0
  - - 1
    - 1
    - 1
    - 1
  rowLabel: Claim being made
  colLabel: Evidence retained
  rowTicks:
  - Binary
  - Semantics
  - Numerics
  - Performance
  colTicks:
  - Digests
  - State
  - Error
  - Timing
  legend: Filled = required evidence category; no test results are asserted
```


## Algorithm

**Algorithm 28.6 — Reconstruct, admit and validate a deployment.** [DERIVED] Inputs are manifest $\mathcal M$, artifact store $A$, target environment $e$, finite representative classes $\mathcal C$, and numerical policy $\tau$. Output is an evidence bundle for an admitted subset, or an explicit rejection. Cache reuse is a branch inside reconstruction. Each class has an immutable initial logical-state/input snapshot $z_c^0$; regimes $\mathcal Q$ distinguish cold process/cache, persistent-cache reuse and warm-process execution.

$$
\begin{aligned}
1.\quad &\operatorname{verifyDigests}(A,\mathcal M);\quad
 \operatorname{checkBuildAndTarget}(e,\mathcal M)\ \text{or reject}.\\
2.\quad &k\gets\operatorname{implementationKey}(A,e);\quad
 \operatorname{trustedHit}(k)\Rightarrow\operatorname{loadExecutable}(k);\\
&\neg\operatorname{trustedHit}(k)\Rightarrow
 \operatorname{traceLowerCompile}(A,e);\quad\operatorname{recordBuild}.\\
3.\quad &\operatorname{establishConstantOwnershipAndEvents};\quad
 \mathcal A\gets\varnothing;\quad\mathcal R\gets\varnothing.\\
4.\quad &\forall c\in\mathcal C:\neg\operatorname{admit}(c,e)
 \Rightarrow\operatorname{excludeAndSkipClass}(c);\\
&\forall q\in\mathcal Q:\operatorname{prepareRegime}(q);\quad
 z_K,z_F\gets\operatorname{restoreIndependentPair}(z_c^0);\\
& (\widetilde y_{q,c},\widetilde s'_{q,c})\gets\operatorname{runCandidate}(z_K,q);\quad
 (y_{q,c},s'_{q,c})\gets\operatorname{runReference}(z_F).\\
5.\quad &\left[\forall q\in\mathcal Q:\operatorname{discreteContract}(q,c)\land
 e_\tau(y_{q,c},\widetilde y_{q,c})\le1\land\operatorname{stateContract}(q,c)\right]\\
&\hspace{2em}\Rightarrow\mathcal A\gets\mathcal A\cup\{c\};\quad
 \mathcal R\gets\mathcal R\cup\operatorname{rawEvidence}(c).\\
6.\quad &\operatorname{return}(\mathcal A,\mathcal M,\mathcal R,
 \operatorname{failuresAndExclusions}).
\end{aligned}
$$

[DERIVED] “Exclude” skips execution for that class; it is not permission to continue with incompatible shapes. Warmup precedes restoration of the initial logical model/optimizer/random state, so warming the runtime does not change the comparison's starting conditions. Candidate and reference buffers are independent, and timed repetitions also restore independently. If the claim concerns an evolving stateful sequence, run two independent trajectories from the same snapshot over the same declared input/random sequence and label that separate protocol. Failed output/state checks reject the tested configuration. The invariant is artifact identity plus a recorded admitted contract for every accepted class. Termination requires finite classes and timeout-bounded build/load/run phases. Complexity is dominated by compilation and all tested executions; hashing bytes and checking manifests are additional work. The procedure cannot turn a finite test set into an exhaustive correctness theorem.

## Implementation

[OFFICIAL-DOCUMENTATION] **JAX — MODEL / AUTOGRAD FRAMEWORK layer.** Pin JAX 0.11.2 and the actual `jaxlib` package. The released cache guide treats the cache as trusted executable input and describes multi-node cold runs compiling on every process, with rank zero writing the persistent entry. [R28.13], opening warning and “Caching on multiple nodes”. **PyTorch — MODEL / AUTOGRAD FRAMEWORK layer.** Pin 2.14 and its compiled deployment path; Python 3.15 support does not imply `torch.compile` support. [R28.1], named interpreter/compiler heading. [DERIVED] A warm cache on one rank is not evidence of a warm cluster, and an import check is not a compiler acceptance test.

[DERIVED] Keep a machine-readable manifest with graph/constant digests, package/build identities, target devices, precision controls, dynamic constraints, external-op versions, compiler flags, selected kernels/tuning, cache namespaces, ownership and measurement boundaries. Runtime keys may omit fields needed for a scientific comparison; attach them to the evidence bundle even when they do not invalidate the compiler cache. Restrict cache writers to the intended trust domain because loading cached code is part of execution.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] The release blog describes the changed constant-loading and packaging mechanisms; the cache guide provides configuration examples and operational behavior. [R28.1], named AOTInductor headings; [R28.13], “Usage”, “How it works”, and “Caching on multiple nodes”. [NOT-DISCLOSED] These sources do not provide a shared model/hardware/workload matrix, repeated-run uncertainty or a portable quantitative cold-start reduction for the deployment defined here. Mechanism disclosure supports an implementation contract rather than a measured universal gain.

[DERIVED] The book's unexecuted verification protocol should rebuild in a recorded environment, vary cache state independently from shape distribution, and compare numerical/state acceptance before timing. Retain preparation phase traces, first-ready latency, warm latency distributions, peak loading/execution memory, specialization counts and fallback counts. Compare the same useful workload and report failed or infeasible configurations. Full procedures are in [verification](verification.md); none is reported as completed.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The inspected releases/documentation define version-specific support, cache inputs and constant-loading/ownership mechanisms. [R28.1], [R28.13], locators above.

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] The explicit Python 3.15 compiler exclusion and opt-in loading mode show concrete compatibility boundaries. [UNVERIFIED] No independent deployment reproduction or cross-device performance validation is provided by this chapter.

**What we infer.** [MATHEMATICALLY-DERIVED] Equation 28.16 makes the preparation penalty depend on completed useful calls; Eq. 28.18 accepts only a declared numerical envelope. A cache hit, a warm latency and an output match therefore answer different questions.

**What remains unknown.** [UNVERIFIED] Actual target compatibility, complete artifact availability, cache hit rate, cold/warm latency, numerical drift and long-horizon task acceptance remain unmeasured for a project-specific deployment.

## Failure modes

> **Failure mode — Warm result presented as first-use behavior.** [DERIVED] *Symptom:* production restarts violate the advertised latency. *Cause:* preparation and loading were excluded. *Detection:* trace a fresh process with declared cache state. *Mitigation:* publish first-ready and warm measurements separately.

> **Failure mode — Unrecorded specialization.** [DERIVED] *Symptom:* rare shapes trigger latency spikes or a fallback. *Cause:* the workload leaves the warmed/admitted envelope. *Detection:* retain specialization keys, shapes and compile events. *Mitigation:* revise constraints or prepare the relevant classes and include their cost.

> **Failure mode — Constants outlive their owner.** [DERIVED] *Symptom:* failure appears after container reuse or teardown. *Cause:* caller-owned shared storage was freed or changed before all consumers completed. *Detection:* audit ownership and completion traces. *Mitigation:* retain the storage for the declared lifetime and synchronize its release correctly.

## Siblings

[DERIVED] **Source rebuild** can adapt to a target but adds toolchain/tuning variability. **A packaged compiled artifact** freezes more build choices while narrowing binary/shape compatibility. **Persistent cache reuse** avoids eligible compilation work while retaining load, identity and trust obligations. **A warm long-lived process** retains additional runtime state and allocations; it does not characterize restart behavior. Compare these as deployment regimes under the same admitted program, not as interchangeable definitions of reproducibility.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] The 2.14 release's AOTInductor packaging path removes a second code-generation pass in its described lazy-autotune workflow, and external constants enable sharing without per-container constant loading. [R28.1], “AOTInductor Compilation” and “AOTInductor External Constants and Zero-Copy Weight Sharing”. [DERIVED] These are dated changes to preparation and ownership. Their contribution to a given deployment requires phase accounting; a faster packaging path does not prove faster warm inference. [NOT-DISCLOSED] The inspected sources do not isolate an end-to-end gain for the hypothetical workload here.

## Limitations

[DERIVED] Reconstructed metadata can describe an artifact that no longer builds because a toolchain or device is unavailable. Matching source revisions does not guarantee bitwise compiler output, and matching binary hashes does not guarantee identical runtime scheduling. Numerical thresholds require domain expertise and task validation; choosing them after observing a mismatch weakens the claim. This section defines how to bound a reproducibility claim rather than promise universal reproducibility.

## Reproducibility

[DERIVED] Archive $\mathcal M$, artifact digests, exact primary snapshots, build logs, target configuration, input-class manifest, cache states, first-ready/warm traces and raw validation differences. Keep failed reconstruction attempts and unsupported cases. **UNVERIFIED:** all book-authored deployment experiments remain unexecuted. The current manuscript may support review of the contract and derived accounting, but its editorial status remains `manuscript_draft`.

## References

- [R28.1](references.md) — PyTorch 2.14 release, interpreter/compiler support and the three named AOTInductor headings; 2026 release-qualified changes.
- [R28.3](references.md) — JAX 0.11.2 release identity; distinguish JAX version from the separately installed `jaxlib` identity.
- [R28.13](references.md) — JAX `docs/persistent_compilation_cache.md` pinned to `jax-v0.11.2`; released snapshot, named key, trust and multi-node headings above.
