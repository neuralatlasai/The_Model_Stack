---
id: ms.section.14.5
entity_type: section
title: Exact versus approximate computation
short_title: Exact versus approximate computation
section: 14.5
slug: 14-5-exact-versus-approximate-computation
parent: ms.chapter.14
prev_sibling: ms.section.14.4
next_sibling: ms.section.14.6
children: []
prerequisites: [ms.chapter.5, ms.chapter.13, ms.section.14.4]
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

# 14.5 — Exact versus approximate computation

## Scope

**DERIVED.** “Exact attention” must identify the function, visibility graph, positional treatment and numerical contract being preserved. This section distinguishes changing the architecture, restricting a dense computation, changing precision, and scheduling the same computation with less memory traffic. Its artifact is an equivalence record with explicit positive and negative controls. Kernel microarchitecture belongs to Chapter 27; this section establishes the correctness boundary those kernels must satisfy.

## Why this exists

**PAPER-REPORTED — [P19](references.md#p19).** FlashAttention presents IO-aware exact attention that avoids materializing the full attention matrix in high-bandwidth memory. **DERIVED.** The saving concerns data movement and temporary storage; it does not mean that dense attention stops depending on all permitted query/key interactions.

**DERIVED.** “Approximate” is similarly incomplete without a reference. A trained local-attention model can be evaluated exactly relative to its own architecture. Applying the same local mask to an existing dense model changes that model's function. Quantized K/V adds a numerical approximation even if the mask is unchanged. A kernel comparison that combines these interventions cannot attribute its speed or error to IO-aware scheduling alone.

## Intuition

> **Definition — Attention equivalence contract.** A declaration of the mathematical inputs, visibility, transformations and output semantics held fixed, together with the numerical discrepancy tolerated when comparing executions.

**DERIVED.** Real-arithmetic equivalence concerns the operator identity. Floating-point agreement additionally depends on rounding, reduction order, accumulator precision and nonlinear approximations. Bitwise reproducibility is stronger still. Two implementations can preserve the same mathematical attention while differing by small floating-point amounts; two implementations can agree on easy fixtures while sharing an incorrect mask.

**DERIVED.** The audit must therefore compare independent constructions and include adversarial boundaries: extreme scores, non-square shapes, padding, all-masked rows, mixed lengths, grouped heads and cache updates. Matching one random square matrix is not enough to certify a decoder implementation.

## Formulation

**MATHEMATICALLY-DERIVED — sufficient statistics for one query.** For a nonempty tile of valid keys $\mathcal J$, define

$$
m_{\mathcal J}=\max_{s\in\mathcal J}u_s,\quad
Z_{\mathcal J}=\sum_{s\in\mathcal J}e^{u_s-m_{\mathcal J}},\quad
U_{\mathcal J}=\sum_{s\in\mathcal J}e^{u_s-m_{\mathcal J}}v_s.
$$
*(Eq. 14.16)*

where $u_s$ is the fully transformed and masked attention score, $v_s$ the value vector, $Z_{\mathcal J}$ a scalar and $U_{\mathcal J}$ a vector. Dropout is disabled for this identity.

**MATHEMATICALLY-DERIVED.** Two disjoint valid tiles merge as

$$
m=\max(m_a,m_b),\quad
Z=e^{m_a-m}Z_a+e^{m_b-m}Z_b,\quad
U=e^{m_a-m}U_a+e^{m_b-m}U_b,\quad
o=U/Z.
$$
*(Eq. 14.17)*

where the final normalization occurs after every required tile has contributed. Empty tiles use an explicit identity case rather than evaluating an undefined $-\infty-(-\infty)$ subtraction.

<details><summary>Derivation of Eq. 14.17</summary>

**MATHEMATICALLY-DERIVED.** Multiplying a tile's normalized sum by $e^{m_a-m}$ replaces its local exponential shift by the common shift $m$. Adding the rescaled sums therefore recovers the numerator and denominator over the union. The common factor cancels in $U/Z$. This establishes associativity in real arithmetic for disjoint unions. Floating-point implementations must still test the effect of different merge orders.

</details>

**MATHEMATICALLY-DERIVED — offset causal alignment.** If $Q_n$ new queries correspond to the final positions of a key sequence of length $S$, zero-based query row $i$ has absolute position $S-Q_n+i$. Its causal rule is

$$
j\le S-Q_n+i,\qquad 0\le j<S,
$$
*(Eq. 14.18)*

where $j$ is the key's absolute position. The upper-left rule $j\le i$ describes a different alignment unless $Q_n=S$ or the intended query positions begin at zero.

~~~figure
id: fig-14.15
kind: calculator
title: Stable merging of softmax tile masses
caption: Eq. 14.17 combines shifted tile sums without exponentiating a large absolute score. Inputs are illustrative valid tile summaries.
placement: rail
anchor: formulation
states:
  - {anchor: formulation, label: Equal maxima, variables: {ma: 0, mb: 0}, note: "Tile sums 2 and 3 combine to shifted mass 5."}
  - {anchor: mechanism, label: Different maxima, variables: {ma: 0, mb: 4}, note: "Rescale the first tile before combining; averaging local normalized outputs is insufficient."}
  - {anchor: failure-modes, label: Extreme score offset, variables: {ma: 0, mb: 1000}, note: "The relative exponential stays bounded even when exponentiating the absolute score would overflow ordinary floating point."}
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-14.17
alt: At the default equal maxima of zero, shifted tile masses two and three merge to five. Raising the second maximum to four changes the merged shifted mass to approximately 3.0366.
spec:
  tex: Z=e^{m_a-m}Z_a+e^{m_b-m}Z_b
  equation: "14.17"
  inputs:
    - {symbol: ma, label: tile A maximum, default: 0, min: -1000, max: 1000, format: fixed1}
    - {symbol: mb, label: tile B maximum, default: 0, min: -1000, max: 1000, format: fixed1}
    - {symbol: Za, label: tile A shifted mass, default: 2, min: 1, max: 4096, format: fixed2}
    - {symbol: Zb, label: tile B shifted mass, default: 3, min: 1, max: 4096, format: fixed2}
  outputs:
    - {symbol: m, label: merged maximum, formula: "max(ma,mb)", format: fixed1}
    - {symbol: Z, label: merged shifted mass, formula: "exp(ma-max(ma,mb))*Za+exp(mb-max(ma,mb))*Zb", format: fixed3}
~~~

## Mechanism

**DERIVED.** Equations 14.16–14.17 permit tilewise computation without retaining every probability in external memory. A backward implementation can reconstruct required probabilities from retained inputs and normalization information instead of saving the full quadratic matrix. That exchanges storage and traffic for recomputation; its actual work depends on the selected training algorithm.

**DERIVED.** The identity does not avoid reading every admissible key/value for dense attention. It changes when data move and where intermediate reductions live. Persistent KV cache remains a separate object from temporary score storage. Claiming that an IO-aware attention kernel eliminates the model's KV cache confuses these lifetimes.

~~~figure
id: fig-14.16
kind: diagram
title: Tile summaries preserve the full denominator
caption: Independently normalized tile outputs cannot simply be averaged. Merge maxima, denominator mass and weighted numerators before the final division.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-14.17
alt: Two disjoint key tiles produce maximum, mass and weighted-value summaries. A common-shift merge produces the final normalized attention output.
spec:
  direction: LR
  nodes:
    - {id: a, kind: tensor, label: tile A scores and values}
    - {id: b, kind: tensor, label: tile B scores and values}
    - {id: sa, kind: state, label: maximum mass numerator A}
    - {id: sb, kind: state, label: maximum mass numerator B}
    - {id: merge, kind: process, label: rescale and add}
    - {id: divide, kind: process, label: divide numerator by mass}
  edges:
    - {from: a, to: sa}
    - {from: b, to: sb}
    - {from: sa, to: merge}
    - {from: sb, to: merge}
    - {from: merge, to: divide}
~~~

**OFFICIAL-DOCUMENTATION — [R14.5](references.md#r145).** The inspected PyTorch 2.14 SDPA documentation describes upper-left causal alignment for non-square matrices. **OFFICIAL-DOCUMENTATION — [R14.8](references.md#r148).** The inspected FlashAttention cache interface documents bottom-right causal alignment. **DERIVED.** For two final queries and five keys, the intended keep rows under Eq. 14.18 are 11110 and 11111. Substituting an upper-left shortcut instead yields 10000 and 11000. Both masks are triangular in a broad sense; only one matches the specified absolute positions.

**DERIVED.** Numerical discrepancies must be attributed to the correct intervention. Reassociation changes floating-point reduction order. Reduced-precision input storage changes the operands. Quantized caches add scales, clipping and dequantization. An approximate exponential changes softmax evaluation. Sparse selection changes the denominator's domain. Test these axes separately before constructing a combined implementation.

**PAPER-REPORTED — [P20](references.md#p20), 2026.** FlashAttention-4 studies pipeline and algorithm co-design for Blackwell, including asynchronous matrix operations and changes to non-matmul work such as exponential evaluation and rescaling. **DERIVED.** This current example reinforces that a family name does not specify numerical behavior or hardware support. Its reported speedups are not transferred to the chapter's workloads, and its numerical choices need the same explicit equivalence audit.

**DERIVED.** Forward error alone is insufficient for a training claim. Check gradients with respect to Q, K and V, especially under grouped sharing where contributions from several query heads accumulate into one KV projection. If dropout is enabled, preserving only the dropout probability is inadequate for elementwise equivalence: the random-mask indexing and realization matter. For inference validation, explicitly disabling dropout simplifies the contract.

## Algorithm

**DERIVED — stable bounded reduction.**

~~~text
Algorithm 14.5 — Merge attention tiles under an explicit mask
INPUT: bounded query, ordered key/value tiles, absolute positions, scale, valid mask
OUTPUT: Result(attention vector and normalization state, no valid keys or invalid input)
STATE: empty summary or (maximum, shifted mass, weighted numerator)
INVARIANT: summary represents exactly the union of valid positions processed so far
1. Validate dimensions, score transformations and the absolute visibility rule.
2. For each tile, skip masked entries and detect an empty valid set explicitly.
3. Compute its maximum, shifted mass and weighted numerator.
4. If state is empty, adopt the tile summary; otherwise merge using Eq. 14.17.
5. After all tiles, reject an empty overall valid set under this reference contract.
6. Return weighted numerator divided by shifted mass and retain required metadata.
~~~

**DERIVED — complexity.** For $S$ keys, a single query costs $O(S(d_k+d_v))$ arithmetic and $O(d_v)$ summary state beyond its tile buffers. Dense training still has $O(T^2)$ pair work under an explicitly bounded sequence contract. The algorithm removes a full probability-matrix retention requirement; it does not claim constant memory for the entire model or constant-time attention.

## Implementation

**DERIVED — stack placement.** PyTorch occupies *Model / autograd framework*, FlashAttention and plan-anchored FlashMLA occupy *Kernels / numerics / collectives*, and Hugging Face Transformers occupies *Model definition / adaptation*. Inspect the concrete operator dispatched through each layer. A model configuration can request one behavior while a backend fallback executes another path.

**OFFICIAL-DOCUMENTATION — R14.5.** The functional SDPA interface documents Boolean-mask participation and application of the supplied dropout probability. **DERIVED.** Tests must bind these semantics explicitly rather than inheriting a similarly named interface's conventions. Pin source revision, dtype, mask, scale, causal flag, head geometry and deterministic settings in the reproduction record.

**DERIVED.** Reference checks should report absolute and normalized error, not a single unexplained “close” result. Near-zero reference outputs require an absolute floor in relative metrics. Large-magnitude and cancellation fixtures test different failure modes. An implementation's chosen all-masked-row behavior can differ from the explicit-error oracle above; any comparison must reconcile that policy before judging correctness.

## Experimental design

**PROPOSAL — no kernel benchmark reported.**

### Experiment 14.5 — Equivalence before optimization

- **Hypothesis:** preserving visibility and normalization permits different schedules to agree numerically, while mask or scale changes create systematic disagreement.
- **Setup:** independent full-matrix and tiled references followed by one pinned optimized kernel.
- **Independent variables:** tile partition, reduction order, non-square alignment, dtype and cache quantization.
- **Controlled variables:** input tensors, mathematical mask, explicit scale, positional transform and dropout state.
- **Dataset/workload:** bounded synthetic fixtures with unequal lengths, extreme scores, padding and grouped heads.
- **Hardware:** record device, architecture, backend, compiler/runtime and precision settings.
- **Metrics:** forward and gradient discrepancy, valid-row agreement, peak temporary memory, traffic and phase latency.
- **Baselines:** high-precision full-matrix reference and independent stable tile reduction.
- **Expected result:** correct schedules satisfy the declared tolerance; altered causal alignment fails.
- **Ablation:** average tile outputs without mass weighting, change default scale, and substitute a mismatched mask shortcut.
- **Interpretation:** only a contract-preserving comparison isolates execution improvements.
- **Threats to validity:** shared implementation bugs, accidental mask agreement on square shapes, dropout randomness and tolerance chosen after seeing errors.

## Observations

**What the paper claims.** **PAPER-REPORTED — P19, P20.** IO-aware execution and hardware-specific scheduling address attention's execution costs.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** Merging sufficient statistics preserves the full softmax in real arithmetic.

**What we infer.** **DERIVED.** Architecture, mask, precision and schedule need separate comparison controls.

**What remains unknown.** **UNVERIFIED.** Numerical tolerances, dispatch and performance for a selected runtime require execution.

## Failure modes

~~~figure
id: fig-14.17
kind: stat-panel
title: Equivalence has several boundaries
caption: Eq. 14.17 proves a real-arithmetic identity; rounding, masking and random-state contracts remain explicit checks.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-14.17
alt: Verify the visibility graph, score transformations, normalization and numerical tolerance before interpreting a kernel comparison.
spec:
  header: EXACTNESS AUDIT
  rows:
    - {key: architecture, value: same maps and visible keys}
    - {key: normalization, value: same global denominator}
    - {key: numerics, value: declared error tolerance}
    - {key: reproducibility, value: pinned execution and RNG}
~~~

> **Failure mode — local normalization averaged.** **DERIVED.** *Symptom:* results depend strongly on tile partition. *Cause:* per-tile outputs averaged without denominator weighting. *Detection:* tiles with very different score maxima. *Mitigation:* merge full summaries.

> **Failure mode — rectangular causal mismatch.** **DERIVED.** *Symptom:* decode ignores valid history or exposes invalid positions. *Cause:* mask alignment inferred from a causal flag. *Detection:* hand-audited absolute-position fixtures. *Mitigation:* specify the exact visibility rule.

## Siblings

**DERIVED.** [GQA and MLA](14-2-latent-attention.md) change representation constraints; [sparse attention](14-3-sparse-and-local-attention.md) changes or restricts visibility; IO-aware scheduling preserves a chosen attention problem. Quantization changes its numerical representation. These methods can compose, but each added intervention expands the verification obligation.

## Extensions

**DERIVED.** Distributed partial attention can merge the same kinds of summaries, provided partitions cover the required keys without duplication and transformations agree. Communication, partition imbalance and numerical merge order then become additional costs. This is an algebraic route, not a claim about a particular distributed backend.

## Limitations

**DERIVED.** Equivalence does not establish speed. Temporary-memory reductions can be offset by launch overhead, occupancy or communication. Approximation error at one layer is not a direct bound on task accuracy. Energy and financial comparisons require measured execution at the same correctness and quality boundary.

## Reproducibility

**DERIVED.** Preserve independent reference construction, valid-key sets, absolute positions, score scale, normalization policy, dropout state, dtypes, accumulator policy, tile partition, kernel revision and error thresholds. Report unsupported cases rather than silently replacing them with a different attention problem.

## References

[P19](references.md#p19); [P20](references.md#p20); [R14.5](references.md#r145); [R14.8](references.md#r148).
