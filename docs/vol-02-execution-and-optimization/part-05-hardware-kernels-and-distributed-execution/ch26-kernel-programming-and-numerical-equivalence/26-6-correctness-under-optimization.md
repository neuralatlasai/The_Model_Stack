---
id: ms.section.26.6
entity_type: section
title: Correctness under optimization
short_title: Correctness under optimization
volume: 2
part: 5
chapter: 26
section: 26.6
slug: 26-6-correctness-under-optimization
parent: ms.chapter.26
prev_sibling: ms.section.26.5
next_sibling: null
children: []
prerequisites:
- ms.chapter.3
- ms.chapter.5
- ms.chapter.25
downstream:
- ms.chapter.27
- ms.chapter.28
- ms.chapter.29
- ms.chapter.30
related: []
relations: []
axes:
  lifecycle:
  - pretraining
  - inference
  - serving
  mechanism:
  - kernel_programming
  - numerical_equivalence
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

# 26.6 — Correctness under optimization

## Scope

[DERIVED] Accept an optimization only after memory/order safety, forward values, backward values and persistent state satisfy separate contracts. This section owns accumulation, tolerances, race detection, synchronization, boundary cases and forward/backward parity. Bitwise determinism, agreement within tolerance and unchanged model quality are different claims. The proposed artifact validates an operator; it does not certify a complete training trajectory.

## Why this exists

[OFFICIAL-DOCUMENTATION] NVIDIA's December 10, 2025 Compute Sanitizer disclosure adds compile-time memcheck instrumentation that tracks allocation base and bounds, including some overruns into adjacent allocations. It also states instrumentation costs and limitations. [R26.10], “Improving coverage with a compiler analysis” and “Things to know”. PyTorch 2.10 introduces numerical-debugging instrumentation; JAX 0.11.2 reports specific gradient corrections. [R26.17], “DebugMode”; [R26.18], “Bug fixes”. [DERIVED] Correctness cannot be inferred from a framework's maturity or a kernel's successful launch. Different tool layers detect different classes of defects and can each miss failures outside their contract.

[DERIVED] Optimization changes arithmetic order, storage lifetime and sometimes the mathematical path used for equivalent expressions. A faster result with small average error can still fail catastrophically for one extreme input or one tail tile. A correct forward can have an incorrect backward registration. A numerically plausible update can corrupt a step counter or moment buffer. These are independent acceptance boundaries, so a single “allclose passed” statement is incomplete.

## Intuition

[MATHEMATICALLY-DERIVED] Floating-point error should be compared with the scale and conditioning of the computation. A nearly cancelling sum can have tiny true output and large absolute intermediate magnitudes; relative error alone becomes unstable. A large output can pass a loose absolute threshold while violating the required relative accuracy. Memory-safety tests answer whether accesses and ordering are valid; they do not establish that the chosen formula computes the intended derivative. A useful correctness ledger keeps these questions separate until all have passed.

## Formulation

| Symbol | Meaning |
|---|---|
| $y,\tilde y$ | Reference and candidate output |
| $u$ | Unit roundoff for the arithmetic operation being modeled |
| $a,r$ | Absolute and relative tolerance |
| $\delta$ | Small declared denominator floor for summary statistics |
| $g,\tilde g$ | Reference and candidate vector-Jacobian products |
| $h,v$ | Finite-difference step and unit test direction |
| $\mathcal Q$ | Sealed correctness input set |
| $\mathcal S$ | Persistent optimizer/runtime state |

[MATHEMATICALLY-DERIVED] Define elementwise acceptance and a summary independently:

$$
|\tilde y_i-y_i|\leq a+r|y_i|,\qquad
E_{\infty}=\max_i|\tilde y_i-y_i|,\qquad
E_{\rm rel}=\frac{\|\tilde y-y\|_2}{\max(\|y\|_2,\delta)},\qquad
\kappa_{\rm sum}=\frac{\sum_i|x_i|}{|\sum_i x_i|}\ge1\quad(\sum_i x_i\ne0).
$$

*(Eq. 26.9)*

This asymmetric reference-based predicate is a book-specified policy. Values of $a,r,\delta$ must be chosen before examining candidate failures. NaNs, infinities, signed zero and nondifferentiable points require explicit comparison semantics; they are not safely handled by silently dropping invalid entries from norms.

## Mechanism

[MATHEMATICALLY-DERIVED] **Accumulation** separates input quantization, product rounding and sum rounding. Assume each addition satisfies $\operatorname{fl}(x+y)=(x+y)(1+e)$ with $|e|\leq u$, and exclude overflow/underflow. A chain of $n-1$ additions multiplies factors $(1+e_j)$; bounding their accumulated perturbation yields a conservative $\gamma_{n-1}=(n-1)u/[1-(n-1)u]$ when $(n-1)u<1$. Thus $|\tilde s-s|\leq\gamma_{n-1}\sum_i|x_i|$ for the stated model. A balanced tree reduces dependency depth but has a different error path; neither ordering is universally closest for every input.

[DERIVED] The conditioning ratio $\sum_i|x_i|/|\sum_ix_i|$ becomes large under cancellation. Wider accumulation reduces one error source but cannot recover information already lost when storing or multiplying low-precision inputs. A kernel reporting FP32 output may still use lower-precision intermediate reductions. Record each arithmetic stage instead of using the output dtype as a summary of the whole computation. Fast-math approximations to exponentials, reciprocals or square roots require separate error characterization on the valid domain.


```figure
id: fig-26.18
kind: calculator
title: Tolerance scale and reduction conditioning
caption: Illustrative acceptance policy, not a validated tolerance recommendation. Absolute tolerance controls near-zero
  references while the relative term scales with output magnitude; cancellation amplifies the difficulty of sum
  accuracy.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.9
alt: Illustrative acceptance policy, not a validated tolerance recommendation. Absolute tolerance controls near-zero
  references while the relative term scales with output magnitude; cancellation amplifies the difficulty of sum
  accuracy.
concepts:
- ms.section.26.6
spec:
  equation: '26.9'
  tex: \tau=a+r|y|,\quad\kappa=\sum_i|x_i|/|\sum_ix_i|
  inputs:
  - symbol: a
    label: absolute tolerance
    default: 1.0e-05
    min: 1.0e-07
    max: 0.01
    format: raw
  - symbol: r
    label: relative tolerance
    default: 0.001
    min: 1.0e-06
    max: 0.1
    format: raw
  - symbol: y
    label: reference magnitude
    default: 1
    min: 0
    max: 1000
    format: fixed2
  - symbol: mass
    label: sum of input magnitudes
    default: 100
    min: 0.01
    max: 10000
    format: fixed2
  - symbol: sumv
    label: absolute sum / input magnitude sum
    default: 0.01
    min: 0.0001
    max: 1
    format: raw
  outputs:
  - symbol: tau
    label: allowed elementwise difference
    formula: a+r*abs(y)
    format: raw
  - symbol: cond
    label: sum conditioning ratio
    formula: 1/sumv
    format: ratio
  - symbol: abssum
    label: implied absolute sum
    formula: mass*sumv
    format: raw
```


[DERIVED] **Tolerances** need an operator-level rationale. Exact integer indexing, shape, mask and state counters can often require exact agreement. Floating products/reductions require scale-aware criteria. The conditioning instrument parameterizes $|\sum_i x_i|=f\sum_i|x_i|$ with $0<f\le1$, so the triangle inequality is preserved and $\kappa_{\rm sum}=1/f\ge1$. A zero sum has an undefined/infinite relative condition and is outside that nonzero instrument. A tolerance selected to pass the observed worst error is not an independent acceptance policy. Compare error distributions and the worst offending input, but keep the elementwise gate decisive. If a reference is itself low precision, agreement establishes similarity to that implementation rather than proximity to the mathematical value. Use a higher-precision small-case oracle to identify this distinction.

[DERIVED] **Race detection** asks whether unsynchronized conflicting accesses exist under the relevant memory model. Repeated deterministic outputs do not prove race freedom; a race may happen to produce the same value. Conversely, floating atomic reduction can be memory-safe yet nondeterministic. Compile-time instrumentation changes register and stack use, so sanitized and performance builds are different artifacts. A sanitizer report should include instrumented build identity, invoked tool, supported memory classes and exact input. Absence of a report means no detected failure in that execution, not a universal proof.

[DERIVED] **Synchronization correctness** is a partial-order proof supplemented by tools. For each buffer, record producer write, publication/completion event, consumer acquisition/read and final release. Verify all participants and generations. A fence without a matching communication protocol may not make progress; a block barrier cannot order arbitrary blocks. Reducing a barrier count requires preserving every needed edge, including async-proxy visibility and slot reuse. Test circular buffers past wraparound and perturb scheduling with different grids; do not add sleeps as a correctness mechanism.


```figure
id: fig-26.19
kind: diagram
title: Safety and numerical correctness are separate gates
caption: A candidate must preserve accesses, ordering, values, derivatives and persistent state. Passing one gate
  does not imply the next, and performance is considered only for the accepted envelope.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.9
alt: A candidate must preserve accesses, ordering, values, derivatives and persistent state. Passing one gate does
  not imply the next, and performance is considered only for the accepted envelope.
concepts:
- ms.section.26.6
spec:
  direction: LR
  nodes:
  - id: contract
    kind: boundary
    label: Shape dtype alias contract
  - id: safe
    kind: process
    label: Bounds and race/order checks
  - id: val
    kind: tensor
    label: Forward numeric parity
  - id: grad
    kind: tensor
    label: Backward parity
  - id: state
    kind: state
    label: Persistent transition parity
  - id: accept
    kind: metric
    label: Accepted tested envelope
  edges:
  - from: contract
    to: safe
  - from: safe
    to: val
  - from: val
    to: grad
  - from: grad
    to: state
  - from: state
    to: accept
    kind: emphasis
```


[MATHEMATICALLY-DERIVED] **Forward/backward parity** requires checking the derivative actually registered with the framework. For scalar $f$, direction $\|v\|_2=1$ and smooth neighborhood,

$$
D_hf(x;v)=\frac{f(x+hv)-f(x-hv)}{2h},\qquad
D_hf(x;v)=\nabla f(x)^\top v+O(h^2).
$$

*(Eq. 26.10)*

Finite arithmetic adds roughly a scale-dependent $O(u/h)$ contribution, so shrinking $h$ indefinitely can worsen the check. Sweep steps and look for a stable interval rather than choosing one tiny step. At nondifferentiable boundaries, compare the framework's documented derivative convention or restrict the test neighborhood; finite differences may cross branches and test a different object. A custom backward can agree on one direction while being wrong elsewhere, so combine directional and coordinate checks on small cases.

[DERIVED] **Boundary cases** must be generated from the contract, not from a random sampler alone. Include empty dimensions where allowed; one-element reductions; tile-width minus/plus one; unaligned offsets; noncontiguous strides; duplicate indices; finite extremes; all-masked/ignored rows; aliasing; repeated calls; graph replay; and backward after saving/restoring state. Preserve invalid cases too and assert the declared rejection behavior. Undefined inputs should not be counted as ordinary numerical failures, but an implementation must not misclassify a required valid input as undefined to avoid testing it.

## Algorithm

[DERIVED] This book-authored acceptance procedure takes a candidate $c$, reference $f$, sealed set $\mathcal Q$, comparison policy and state contract. It returns a categorical decision with the earliest failing gate and all retained artifacts.

$$
\begin{aligned}
(1)&\quad\forall x\in\mathcal Q:\ (x_f,\mathcal S_f),(x_c,\mathcal S_c)\gets\operatorname{independentCopies}(x,\mathcal S_0).\\
(2)&\quad\neg\operatorname{MetadataAndBounds}(c,x)\Rightarrow\operatorname{reject}(\mathrm{contract}).\\
(3)&\quad\neg\operatorname{MemoryOrderChecks}(c,\operatorname{freshCopy}(x,\mathcal S_0))\Rightarrow\operatorname{reject}(\mathrm{safety}).\\
(4)&\quad y,\tilde y\gets f(x_f;\mathcal S_f),c(x_c;\mathcal S_c);\quad\neg\operatorname{Eq26.9}(y,\tilde y)\Rightarrow\operatorname{reject}(\mathrm{forward}).\\
(5)&\quad \operatorname{gradientRequired}\Rightarrow\{g,\tilde g\gets\operatorname{VJP}_{w}(f,x),\operatorname{VJP}_{w}(c,x);\quad\neg\operatorname{GradientPolicy}(g,\tilde g)\Rightarrow\operatorname{reject}(\mathrm{backward})\}.\\
(6)&\quad\neg\operatorname{StateTransitionParity}(\mathcal S_f,\mathcal S_c)\Rightarrow\operatorname{reject}(\mathrm{state});\\
(7)&\quad\operatorname{acceptForTestedEnvelope}\ \text{only after all finite cases and declared gates complete.}
\end{aligned}
$$

The invariant is that every candidate/reference pair begins with identical authorized state and inputs in independent storage. Safety instrumentation runs on disposable copies. Both VJPs use the same sealed upstream cotangent $w$ and fresh copies of the original state; they must not advance the saved forward-state pair used by the state-transition gate. When the contract requires no derivative, that gate is explicitly not applicable rather than a fabricated pass. Complexity includes two executions and gradient work per case, plus tool overhead; it is not comparable to an unsanitized kernel benchmark. Termination is bounded by the finite test set and timeouts. Unsupported gradient orders are explicit domain restrictions, not silently successful gates.

## Implementation

[OFFICIAL-DOCUMENTATION] **NVIDIA CUDA** in *Accelerator / driver / compiler* supplies Compute Sanitizer instrumentation; **PyTorch** in *Model / autograd framework* supplies numerical-debugging and operator-integration checks. **JAX** in that same layer documents release-specific numerical and derivative fixes. [R26.10]; [R26.17]; [R26.18]. [DERIVED] Keep a reference implementation independent enough to expose the candidate's mistakes. Two paths calling the same faulty custom kernel are not independent. Compare gradients, saved metadata and persistent buffers in addition to final tensors. Record reproducible failure inputs before attempting minimization.


```figure
id: fig-26.20
kind: compare
title: What each correctness check establishes
caption: These checks have different evidential limits. The table is a book-authored test-design comparison and
  contains no executed outcomes.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.9
alt: These checks have different evidential limits. The table is a book-authored test-design comparison and contains
  no executed outcomes.
concepts:
- ms.section.26.6
spec:
  axis: The acceptance claim supported by each proposed check
  columns:
  - id: check
    label: Check
  - id: supports
    label: Supports
  - id: limit
    label: Does not establish
  rows:
  - dimension: Bounds instrumentation
    values:
      check: Instrumented executed accesses
      supports: No detected supported memory violation
      limit: All paths or absence of races
  - dimension: Numerical reference
    values:
      check: Outputs under declared policy
      supports: Parity on tested inputs
      limit: Exact real arithmetic or convergence
  - dimension: Gradient comparison
    values:
      check: VJP and directional checks
      supports: Derivative parity in smooth tested regimes
      limit: All directions and all orders
  - dimension: State restart
    values:
      check: Parameters moments counters
      supports: Declared transition and restore consistency
      limit: Fleet-level operational reliability
```


[DERIVED] Verification adds reference, candidate, derivative and state-copy work; it does not add learned parameters or valid model tokens. Safety instrumentation can increase register use, storage and runtime, so its duration cannot represent the unsanitized performance artifact. A complete cost report separates validation overhead from deployed execution and includes any device transfers used by the harness. Energy and money for either activity require additional measured evidence and remain UNVERIFIED.

## Experimental design

[NOT-DISCLOSED] The inspected disclosures do not establish a universal tolerance or a failure-rate distribution for arbitrary optimized kernels. [ASSUMED] The proposed study runs the acceptance algorithm over the sealed operator matrix, then profiles only accepted candidates using separate unsanitized builds. Random cases use fixed recorded seeds; adversarial cases are deterministic. Repeat selected concurrency-sensitive cases, but describe repetition as additional exposure rather than proof of no race. A rejected correctness cell invalidates the corresponding performance claim. Numerical differences after many optimizer steps are investigated separately from single-step parity.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The sanitizer disclosure expands detection coverage under stated conditions; framework releases document debugging features and specific numeric fixes. They do not certify arbitrary user kernels.

**What the evidence shows.** [DERIVED] Different layers expose different failure classes. The presence of recent numerical fixes is evidence that version identity matters; it is not evidence of a measured defect in this manuscript's unexecuted kernels.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 26.9 requires scale-aware acceptance; Eq. 26.10 explains finite-difference truncation versus rounding. Their assumptions prevent using a successful check as a universal theorem.

**What remains unknown.** [UNVERIFIED] Actual sanitizer outcomes, chosen tolerances after independent review, cross-device drift and long-horizon training consequences remain unmeasured.

## Failure modes

[DERIVED] Mean-only error summaries conceal localized outliers. All-zero inputs conceal missed writes. Comparing NaNs as equal can hide newly invalid arithmetic. A reused output buffer can make a missing tail write look correct from a previous call. Tests that restore parameters but not moments compare different optimizer states. Sanitizer-only builds can hide a schedule-sensitive bug through changed resource use. Retain separate safety, numerical and state evidence rather than collapsing these outcomes into one Boolean.

## Siblings

[DERIVED] Bitwise reproducibility fixes representation-level results; tolerance parity bounds numeric differences; task-quality preservation evaluates an application. They answer different questions. Tuning in [§26.5](26-5-tuning-and-portability.md) consumes the numerical gate; it must never redefine it after observing timing winners.

## Extensions

[DERIVED] Extend the finite test envelope by adding higher-order derivatives, heterogeneous devices or graph capture only when the intended integration requires them. Every extension introduces a new contract and artifact set. A new release's listed fix is a reason to rerun a targeted regression case, not permission to assume all other cases remain equivalent.

## Limitations

[DERIVED] Finite tests cannot prove correctness over an unbounded domain. Floating-point bounds exclude exceptional arithmetic under their stated assumptions. Tool coverage is limited to supported access classes and executed paths. Operator-level acceptance does not establish convergence equivalence or absence of service-level race conditions.

## Reproducibility

[DERIVED] Archive inputs, reference precision, tolerance rationale, output/gradient/state errors, generated code, sanitizer logs and exact environment. Keep draft status and label every proposed result unexecuted. The artifact is ready for a falsifiable test, not a fabricated measurement record.

## References

[R26.10] Compute Sanitizer compile-time instrumentation, December 2025; [R26.17] PyTorch 2.10, January 2026; [R26.18] JAX 0.11.2, September 2026. Exact locators are in [references.md](references.md).
