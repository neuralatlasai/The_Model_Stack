---
id: ms.section.15.1
entity_type: section
title: Position representations
short_title: Position representations
section: 15.1
slug: 15-1-position-representations
parent: ms.chapter.15
prev_sibling: null
next_sibling: ms.section.15.2
children: []
prerequisites: [ms.chapter.10, ms.chapter.13, ms.chapter.14]
downstream: [ms.chapter.27, ms.chapter.42, ms.chapter.49]
word_count_target: 1900
volume: 1
part: 3
chapter: 15
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [position_representation, long_context], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P01, P46]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 15.1 — Position representations

## Scope

This section specifies how token locations enter attention and how that specification survives padding, packing, incremental decoding, and distributed execution. The baseline is the attention operator and cache representation developed in [Chapter 14](../ch14-attention-architectures-and-cache-representations/README.md). Success means that a positional transformation has an explicit coordinate convention, a valid mathematical identity, and a reproducible implementation contract. Defining that transformation at a large coordinate does not establish useful reasoning over a correspondingly long sequence.

## Why this exists

**PAPER-REPORTED.** The Transformer introduced positional information alongside token embeddings [P01]. Relative-position attention subsequently represented relationships between locations within attention [R15.6]. These address a structural problem: content projections alone do not specify sequence order.

**DERIVED.** The engineering problem is broader than selecting an embedding formula. A model can receive identical tokens and produce different attention scores when its logical position identifiers differ. Padding offsets, document boundaries, cache offsets, and per-layer transformations therefore belong to the model input contract. Treating them as incidental tensor indices can change the computation without changing a single weight.

The dominant constraint changes during extension. A learned position table has a finite allocation; an analytic transformation can be evaluated beyond its training range. Neither property determines whether attention will identify relevant evidence at an unfamiliar distance. Separate representability, numerical fidelity, training exposure, and task performance throughout the chapter.

## Intuition

**DERIVED.** Absolute addition modifies the vector that reaches the query and key projections. Relative representations modify pairwise interactions. Rotary transformations rotate query and key coordinate pairs according to location. Linear distance biases add a head-specific distance term to attention logits. These are different interventions and cannot be exchanged by changing a maximum-length field.

The visibility mask is a separate object. A position transform may distinguish two documents while still permitting attention across their boundary. Conversely, an explicit block mask can isolate documents even if their positions restart at zero. Position determines how permitted interactions are scored; the mask determines which interactions are permitted.

> **Definition — Position contract.** The complete mapping from logical token or modality locations to position identifiers, transformations, attention biases, and associated cache conventions, including padding, packing, and visibility boundaries.

## Formulation

**MATHEMATICALLY-DERIVED.** Use column vectors. Let token embedding \(e_t\) and absolute position vector \(p_t\) lie in \(\mathbb R^{d_{\mathrm{model}}}\); let \(W_Q,W_K\) map these vectors to a head of width \(d_k\). Then

$$
h_t=e_t+p_t,\qquad
q_t^\top k_s=(e_t+p_t)^\top W_Q^\top W_K(e_s+p_s).
$$
*(Eq. 15.1)*

Expansion gives content–content, content–position, position–content, and position–position terms. None alone establishes dependence exclusively on the offset \(s-t\). The expression also explains why replacing a trained absolute embedding with a different positional mechanism is a model intervention.

For an even rotary dimension \(d_r\le d_k\), define a base \(a>1\), pair index \(j\in\{0,\ldots,d_r/2-1\}\), angular frequency \(\omega_j\), and block rotation \(R_j(t)\):

$$
\omega_j=a^{-2j/d_r},\quad
R_j(t)=
\begin{bmatrix}
\cos(t\omega_j)&-\sin(t\omega_j)\\
\sin(t\omega_j)&\cos(t\omega_j)
\end{bmatrix},\quad
(R(t)q)^\top(R(s)k)=q^\top R(s-t)k.
$$
*(Eq. 15.2)*

The identity follows from orthogonality and composition of rotations; \(R\) is the block diagonal operator on the rotary subspace. Any unrotated coordinates retain their ordinary dot product. It requires identical frequencies and coordinate pairing on both operands. [R15.1] supplies the rotary mechanism; the equality is reproduced here as a mathematical contract.

For an ALiBi-style causal head \(i\), write the logit before masking as

$$
u_{i,t,s}=\frac{q_{i,t}^{\top}k_{i,s}}{\sqrt{d_k}}-a_i(t-s),
\qquad s\le t,\quad a_i>0.
$$
*(Eq. 15.3)*

Here \(a_i\) is a head slope, distinct from the rotary base \(a\). The sign penalizes older keys under this causal coordinate convention. This expression describes the bias family, not a replacement for the source's complete slope schedule [R15.2].

Finally, rotary phase difference and its real-valued period are

$$
\Delta\phi_j=(t-s)\omega_j,\qquad P_j=\frac{2\pi}{\omega_j}.
$$
*(Eq. 15.4)*

\(P_j\) is measured in position units; it need not be an integer token period. One pair wrapping does not imply that the entire multi-frequency representation repeats.

~~~figure
id: fig-15.3
kind: calculator
title: Rotary phase across frequency pairs
caption: "Illustrative rotary dimension 128; phase growth is geometric bookkeeping, not an effective-context measurement."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-15.4
alt: "At base 10000, pair 32 has frequency 0.01; an offset of 4096 gives phase 40.96 radians. Other pairs have different periods."
spec:
  tex: \Delta\phi_j=\Delta a^{-2j/128}
  equation: "15.4"
  inputs:
    - {symbol: base, label: rotary base, default: 10000, min: 100, max: 1000000, format: integer}
    - {symbol: j, label: pair index, default: 32, min: 0, max: 63, format: integer}
    - {symbol: delta, label: position offset, default: 4096, min: 0, max: 131072, format: tokens}
  outputs:
    - {symbol: phase, label: phase in radians, formula: "delta*base^(-2*j/128)", format: fixed3}
    - {symbol: period, label: period in position units, formula: "6.283185307179586/base^(-2*j/128)", format: fixed3}
states:
  - {anchor: formulation, label: Middle frequency, variables: {base: 10000, j: 32, delta: 4096}, note: "Each frequency pair has its own phase scale."}
  - {anchor: mechanism, label: Highest frequency, variables: {base: 10000, j: 0, delta: 4096}, note: "Changing the pair changes phase without changing the token offset."}
  - {anchor: failure-modes, label: Larger offset, variables: {base: 10000, j: 32, delta: 32768}, note: "A computable phase does not certify reliable evidence access."}
~~~

## Mechanism

**PAPER-REPORTED.** RoFormer applies rotary position encoding to query and key representations [R15.1]. ALiBi uses head-dependent linear attention biases and investigates extrapolation from shorter training inputs [R15.2]. Preserve their distinction: a rotation changes content-dependent dot products; an additive bias contributes a distance-dependent preference.

**DERIVED.** Learned absolute tables require \(T_{\mathrm{table}}d_{\mathrm{model}}\) stored embedding parameters. Extending the allocated table creates positions whose values need a specified initialization and training procedure. Analytic sinusoidal or rotary functions avoid that particular table bound but retain questions about exposure and numerical precision.

Relative vectors and relative scalar biases also differ. Vector-valued relative terms can interact with queries; scalar biases directly adjust logits. Clipping or bucketing offsets merges positional categories. Such merging can be deliberate, but it removes distinctions that a finer representation would preserve. Avoid describing every relative-position method as one interchangeable implementation.

Rotary work is linear in the number of transformed query and key coordinates. A naive materialized matrix of pairwise biases occupies quadratic sequence storage, whereas computing biases within attention tiles need not allocate that matrix. Parameter count therefore does not determine memory traffic or kernel cost. Latency, energy, and monetary cost remain **UNVERIFIED** without a measured execution configuration.

~~~figure
id: fig-15.4
kind: diagram
title: Position and visibility enter distinct paths
caption: "This dependency map separates optional position interventions from the mask; it is not an architecture requiring all interventions simultaneously."
placement: inline
evidence: DERIVED
source: DERIVED:eq-15.1
alt: "Token vectors pass through optional absolute addition and projections. Optional rotations modify queries and keys; relative biases and visibility separately affect attention scores."
spec:
  direction: LR
  nodes:
    - {id: tokens, kind: tensor, label: Token vectors}
    - {id: absolute, kind: process, label: Optional absolute addition}
    - {id: projection, kind: process, label: Query and key projections}
    - {id: rotation, kind: process, label: Optional rotary transform}
    - {id: score, kind: tensor, label: Attention logits}
    - {id: bias, kind: dependency, label: Optional relative bias}
    - {id: mask, kind: boundary, label: Visibility contract}
  edges:
    - {from: tokens, to: absolute, kind: flow}
    - {from: absolute, to: projection, kind: flow}
    - {from: projection, to: rotation, kind: flow}
    - {from: rotation, to: score, kind: flow}
    - {from: bias, to: score, kind: dependency}
    - {from: mask, to: score, kind: dependency}
~~~

The coordinate pairing must match the checkpoint. Interleaved pairs and split-half layouts can express equivalent rotations after a consistent permutation, but applying one layout to projections trained for another changes scores. Partial rotation also requires preserving the unrotated subspace. A correct formula with the wrong layout is an incorrect model.

## Algorithm

**DERIVED — reference audit, not a training recipe.**

~~~text
Algorithm 15.1 — Audit a bounded position contract
INPUT: bounded token batch, explicit logical positions, visibility mask,
       projection weights, position configuration, numerical tolerances
OUTPUT: identity residuals, full-versus-incremental residuals, pass/fail record
STATE: independent small reference tensors and the candidate cache
INVARIANT: logical locations and allowed token pairs agree across both paths
1. Validate dimensions, rotary parity, coordinate ranges, and packing boundaries.
2. Compute reference queries, keys, and position transformations.
3. Check the rotary identity for selected coordinate pairs when applicable.
4. Evaluate full-sequence causal attention under the explicit reference mask.
5. Decode the same sequence incrementally using absolute logical cache offsets.
6. Compare outputs within a predeclared dtype-appropriate tolerance.
7. Perturb forbidden future tokens; require unchanged earlier outputs.
8. Record every failing coordinate, mask edge, and configuration; then terminate.
~~~

The transformation audit costs \(O(BT(H_q+H_{kv})d_r)\); the deliberately small dense reference additionally costs quadratic attention work. Bound \(T\) before allocation. The audit is a correctness check, so replacing it with an approximate attention operator would invalidate its purpose.

## Implementation

**OFFICIAL-DOCUMENTATION.** Hugging Face Transformers, the reference stack's **Model definition / adaptation** layer, documents rotary variants through **rope_parameters**, with variant-specific validation and support for per-layer-type configuration [R15.10]. The inspected surface is moving main documentation, not a pinned release guarantee.

**DERIVED.** PyTorch, **Model / autograd framework**, provides the tensor operations for an independent reference. NVIDIA Megatron-Core, **Distributed training**, supplies a setting in which token locations must remain global while activations are sequence-sharded. A local array index must not silently replace a logical position.

Record separately the dtype of position identifiers, frequency construction, trigonometric evaluation, and transformed activations. Low-precision arithmetic at large coordinates may collapse distinct representable positions or perturb phases. Casting the final result to a wider dtype cannot recover precision already lost.

Cache conventions require equal care. Determine whether stored keys are already rotated, where their positions originate, and whether the inference path rotates them again. Avoid maintaining both rotated and unrotated copies unless their additional capacity and invalidation rules are explicit.

## Experimental design

**PROPOSAL — no model experiment has been run for this edition.**

### Experiment 15.1 — Position-contract equivalence

- **Hypothesis:** Correct coordinate and cache conventions preserve reference attention outputs; controlled convention mismatches break equivalence.
- **Setup:** Compare independent dense reference, full-sequence execution, and incremental execution on bounded tensors.
- **Independent variables:** Padding side, document boundaries, cache offset, coordinate pairing, rotary fraction, and sequence length.
- **Controlled variables:** Weights, embeddings, token order, visibility, precision, and deterministic evaluation settings.
- **Dataset/workload:** Synthetic coordinate fixtures with separately held-out random seeds; no task-quality inference.
- **Hardware:** Record device, memory, driver, and software revisions before execution; none is stipulated as measured here.
- **Metrics:** Maximum absolute and relative residuals, invalid mask edges, non-finite values, and future-perturbation invariance.
- **Baselines:** Independent reference plus deliberately incorrect cache-reset and pairing controls.
- **Expected result:** Matching paths agree within declared tolerances; faulty controls are detectable.
- **Ablation:** Change one convention at a time and restore it before the next test.
- **Interpretation:** Passing establishes implementation agreement for tested cases, not length extrapolation.
- **Threats to validity:** Shared implementation bugs, overly loose tolerances, and test vectors that accidentally hide the mismatch.

## Observations

**What the paper claims — PAPER-REPORTED.** Rotary and linear-bias papers propose different positional mechanisms and evaluate them under their respective training regimes [R15.1, R15.2].

**What the evidence shows — MATHEMATICALLY-DERIVED.** Equation 15.2 establishes relative rotation under fixed frequencies and pairing. It does not establish retrieval accuracy.

**What we infer — DERIVED.** Cache offsets and layout conventions deserve checkpoint-level provenance because changing them changes the operator.

**What remains unknown — UNVERIFIED.** The deployment-specific tolerance, large-coordinate stability, and task effect require execution with the chosen model and runtime.

## Failure modes

**DERIVED.** Resetting the query position after prefill makes a new token interact with cached keys under the wrong relative offsets. The symptom may be plausible but degraded text rather than an exception. A future-token perturbation test detects mask leakage that a phase identity test cannot detect.

~~~figure
id: fig-15.5
kind: stat-panel
title: Position audit boundaries
caption: "Four contracts must agree before a full-versus-incremental output comparison is meaningful."
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-15.2
alt: "Audit logical coordinates, rotary pairing, cache transformation state, and allowed attention pairs independently."
spec:
  header: Required agreement
  rows:
    - {key: Coordinates, value: "Include the logical prefix offset"}
    - {key: Transform, value: "Frequencies and coordinate pairing match"}
    - {key: Cache, value: "Stored keys are transformed exactly once"}
    - {key: Visibility, value: "Explicit padding and packed boundaries"}
~~~

## Siblings

**DERIVED.** Absolute addition changes projected representations; relative terms change pairwise interactions; rotary encoding changes their geometric alignment; ALiBi adds distance preferences. [Section 15.2](15-2-context-extension.md) changes the position contract across training and deployment lengths. [Section 15.4](15-4-effective-context.md) tests whether evidence remains accessible.

## Extensions

**DERIVED.** Image grids, video timestamps, and mixed modalities may require multiple coordinate axes. Flattening them into token order is a particular design choice, not proof that spatial or temporal adjacency is preserved. Document each axis and the transformations applied to it; model-specific conventions remain **NOT-DISCLOSED** where primary material omits them.

## Limitations

**DERIVED.** Algebraic identities describe the operator under explicit conditions. They do not establish that the learned projections exploit every distinguishable distance. A model may implement its position contract exactly while failing multi-document synthesis.

## Reproducibility

Retain logical position arrays, mask fixtures, pairing convention, rotary dimension, frequency configuration, checkpoint revision, cache representation, and precision boundaries. Save failing reference tensors independently of the candidate implementation. Record the documentation revision or explicitly unpinned access date; configuration names alone are insufficient provenance.

## References

[P01](references.md#p01); [R15.1](references.md#r151); [R15.2](references.md#r152); [R15.6](references.md#r156); [R15.10](references.md#r1510).
