---
id: ms.section.17.4
entity_type: section
title: "Delta-rule mechanisms"
short_title: "Delta-rule mechanisms"
section: 17.4
slug: 17-4-delta-rule-mechanisms
parent: ms.chapter.17
prev_sibling: ms.section.17.3
next_sibling: ms.section.17.5
children: []
prerequisites: [ms.chapter.2, ms.chapter.13, ms.chapter.14, ms.chapter.15]
downstream: [ms.chapter.27, ms.chapter.42]
word_count_target: 1900
volume: 1
part: 3
chapter: 17
related: []
relations: []
axes: {lifecycle: [pretraining, inference, evaluation], mechanism: [recurrent_state, state_space, linear_attention], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P11, P12]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.triton-language]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-27
editorial_status: manuscript_draft
---


# 17.4 — Delta-rule mechanisms

## Scope

This section derives targeted memory updates from a local squared-error objective, adds forgetting, and analyzes interference, stability, gate placement, and parallel execution. Its baseline is an additive outer-product state. Success requires distinguishing replacement from accumulation and demonstrating that the implemented update matches the stated equation. Gated Delta Networks provides the architectural anchor [P12]. The derivations isolate its recurrent primitive; short convolutions, normalization, projections, output gates, and feed-forward layers remain separate parts of a complete model.

## Why this exists

**DERIVED.** An additive associative memory writes a new key/value contribution without inspecting the association already stored for that key. Repeatedly writing different values therefore accumulates them. For a task whose semantics are “use the latest value,” accumulation is the wrong primitive unless some other mechanism learns to remove the old contribution.

Global forgetting addresses a different problem. It reduces all previous contributions, which can help after a context switch but also weakens unrelated information that should remain. A useful update needs separate controls over targeted replacement and broad decay. Combining those controls requires care: multiplying the whole completed update by a forget gate also attenuates the newly written value.

**PAPER-REPORTED.** Gated Delta Networks combines a delta-rule transition with input-dependent forgetting and develops a chunkwise training algorithm [P12]. The source motivates the combination through complementary memory-control roles. The analysis below reconstructs the local update and derives its consequences under explicitly stated key normalization and gate domains.

## Intuition

**DERIVED.** Treat the state matrix as a function from keys to predicted values. Before a write, evaluate the value currently associated with the new key. The difference between the desired value and that prediction tells the update what to correct. Other addresses are affected in proportion to their overlap with the written key.

> **Definition — Delta-rule state update.** A matrix-memory write proportional to the residual between an incoming value and the state's current prediction at the incoming key.

This is online adaptation of a request-local state, not necessarily optimization of the model's persistent learned parameters. During inference, the projections and gate networks may remain fixed while the state changes at every token. Calling the state a fast weight does not imply that a language-model training loss is backpropagated during every deployment step.

## Formulation

**MATHEMATICALLY-DERIVED — local regression interpretation.** For a current key/value pair, define

$$
\ell_t(H)=\frac12\|Hk_t-v_t\|_2^2,\qquad
\nabla_H\ell_t(H)=(Hk_t-v_t)k_t^\top.
$$
*(Eq. 17.12)*

where $H\in\mathbb R^{d_v\times d_k}$ is the state matrix, $k_t\in\mathbb R^{d_k}$ the key, and $v_t\in\mathbb R^{d_v}$ the desired value.

A gradient step of size $\eta_t$ gives the ungated delta update. We use $\eta_t$ for the source's update-strength parameter to avoid overloading the book's shared $\beta$ notation. Adding decay of the previous state before computing the correction yields

$$
\widetilde H_t=\alpha_tH_{t-1},\qquad
H_t=\widetilde H_t+\eta_t(v_t-\widetilde H_tk_t)k_t^\top
=\alpha_tH_{t-1}(I_{d_k}-\eta_tk_tk_t^\top)+\eta_tv_tk_t^\top.
$$
*(Eq. 17.13)*

where $\alpha_t\in[0,1]$ is the forgetting factor, $\eta_t\in[0,1]$ the update strength in this analysis, and $I_{d_k}$ the identity matrix.

**PAPER-REPORTED.** The final expression is the gated delta recurrence specified in the revised paper [P12, §3.1], with notation remapped. Gate endpoints here are analytical limits; a sigmoid-parameterized gate need not attain them exactly.

**MATHEMATICALLY-DERIVED.** Under unit key norm, reading the written key after the update gives

$$
H_tk_t=(1-\eta_t)\alpha_tH_{t-1}k_t+\eta_tv_t,\qquad
(H_t-\widetilde H_t)q=\eta_t(v_t-\widetilde H_tk_t)(k_t^\top q).
$$
*(Eq. 17.14)*

where $\|k_t\|_2=1$ and $q\in\mathbb R^{d_k}$ is any test query.

The first identity is an interpolation at the written address. The second separates the targeted correction from global forgetting. An orthogonal query sees no correction but still experiences the preceding decay.

~~~figure
id: fig-17.12
kind: calculator
title: "Targeted replacement after forgetting"
caption: "Illustrative scalar unit-key case from Eq. 17.14, not a named model. A full-strength correction writes the new value even after the previous state decays."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.14"
alt: "Illustrative scalar unit-key case from Eq. 17.14, not a named model. A full-strength correction writes the new value even after the previous state decays."
spec: {"tex": "h_{new}=(1-\\eta)\\alpha h_{old}+\\eta v", "equation": "17.14", "inputs": [{"symbol": "old", "label": "previous association", "default": 4, "min": -10, "max": 10, "step": 0.1, "format": "fixed2"}, {"symbol": "value", "label": "incoming value", "default": 2, "min": -10, "max": 10, "step": 0.1, "format": "fixed2"}, {"symbol": "alpha", "label": "forget factor", "default": 0.5, "min": 0, "max": 1, "step": 0.05, "format": "fixed2"}, {"symbol": "eta", "label": "update strength", "default": 1, "min": 0, "max": 1, "step": 0.05, "format": "fixed2"}], "outputs": [{"symbol": "new", "label": "new association", "formula": "(1-eta)*alpha*old+eta*value", "format": "fixed2"}, {"symbol": "other", "label": "decayed old association", "formula": "alpha*old", "format": "fixed2"}]}
states: [{"anchor":"formulation","label":"Full replacement","variables":{"eta":1},"note":"The written unit key reads the incoming value."},{"anchor":"mechanism","label":"Partial correction","variables":{"eta":0.25},"note":"The previous decayed association still contributes."},{"anchor":"failure-modes","label":"No new write","variables":{"eta":0},"note":"Forgetting remains active even when the delta correction is disabled."}]
~~~

## Mechanism

**MATHEMATICALLY-DERIVED.** Expanding the differential of Eq. 17.12 gives an outer product of residual and key. Evaluating that gradient at $\widetilde H_t$ and taking one step yields Eq. 17.13. The input pair defines the local target; it is not a ground-truth label for the language-model objective. Training learns representations for which these local updates support the downstream prediction task.

For a worked exact-arithmetic fixture, let $k=(1,0)^\top$, $q=(0,1)^\top$, and let a one-row state be $H=(4,7)$. Set incoming scalar value to $2$, $\alpha=1/2$, and $\eta=1$. Decay first gives $(2,3.5)$. The new value already matches the decayed first coordinate, so the correction is zero and the final state is $(2,3.5)$. The written key reads $2$; the orthogonal key reads the decayed $3.5$.

Now compare an alternative rule that applies decay after an ordinary delta step: $\alpha[H+\eta(v-Hk)k^\top]$. With the same numbers it returns $(1,3.5)$. It attenuates the newly written value. Both rules are causal and computationally plausible, but they are different operators. A kernel cannot substitute one for the other on the grounds that both contain the same two gates.

The state-dependent transition has an informative spectrum:

$$
R_t=\alpha_t(I_{d_k}-\eta_tk_tk_t^\top),\qquad
\operatorname{eig}(R_t)=
\{\alpha_t(1-\eta_t),\ \alpha_t\ \text{on }k_t^\perp\}.
$$
*(Eq. 17.15)*

where $\|k_t\|_2=1$, $k_t^\perp$ is the orthogonal subspace, and the repeated eigenvalue applies when that subspace is nonempty.

Thus $\|R_t\|_2\le\alpha_t$ for $0\le\eta_t\le1$. This is a nonexpansive homogeneous transition when $\alpha_t\le1$. It does not bound driven state magnitude without controlling writes. For non-unit keys, the affected eigenvalue becomes $\alpha_t(1-\eta_t\|k_t\|_2^2)$; gate values alone no longer guarantee the same contraction.

The update is affine in the previous state, so composition is associative. However, products of rank-one modifications generally become denser than one rank-one modification. Materializing a dense transition for each token defeats the intended efficiency. Parallel training therefore needs a structured chunk representation and careful intra-chunk dependencies. Mathematical associativity establishes correctness opportunities; it does not supply a fast kernel automatically.

For a chunk of $c$ updates, write each step as $H_j=H_{j-1}R_j+W_j$, where $W_j=\eta_jv_jk_j^\top$. Repeated substitution gives an incoming-state contribution $H_0R_1\cdots R_c$ plus one term $W_iR_{i+1}\cdots R_c$ for each write. Products are ordered from earlier to later transitions; the final write uses an empty identity product. This formula supplies a direct, bounded correctness oracle for a chunk summary.

The low-rank structure is visible without multiplying dense matrices. If an accumulated ungated transition has representation $P=I-UV^\top$ with $U,V\in\mathbb R^{d_k\times j}$, multiplying by $I-\eta kk^\top$ gives $P-\eta(Pk)k^\top$. It can therefore be represented by appending $\eta Pk$ to $U$ and $k$ to $V$. The representation grows with chunk length, so bounded chunks control temporary rank and storage. Expanding the whole sequence this way would lose that bound. This elementary derivation explains why structured chunk algorithms are needed; it is not a specification of the paper's optimized factorization or a claimed kernel speedup.

**PAPER-REPORTED.** The revised Gated DeltaNet block uses normalized query/key representations and additional local processing [P12, §3.4]. That architectural detail supports inspecting normalization explicitly rather than assuming the scalar gate alone controls stability.

~~~figure
id: fig-17.13
kind: diagram
title: "Forget, predict, correct, read"
caption: "The previous state is first decayed. Its prediction at the incoming key determines a residual whose outer product makes the targeted correction."
placement: inline
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.13"
alt: "The previous state is first decayed. Its prediction at the incoming key determines a residual whose outer product makes the targeted correction."
spec: {"direction":"LR","nodes":[{"id":"n0","kind":"tensor","label":"Previous state"},{"id":"n1","kind":"process","label":"Global decay"},{"id":"n2","kind":"process","label":"Prediction at incoming key"},{"id":"n3","kind":"process","label":"Residual outer-product correction"},{"id":"n4","kind":"metric","label":"Query readout"}],"edges":[{"from":"n0","to":"n1","kind":"flow"},{"from":"n1","to":"n2","kind":"flow"},{"from":"n2","to":"n3","kind":"flow"},{"from":"n3","to":"n4","kind":"flow"}]}
~~~

## Algorithm

~~~text
Algorithm 17.4 — Gated delta reference update
INPUT bounded keys, values, queries, alpha and eta; initial matrix state
OUTPUT per-token readouts and final matrix state
STATE H[dv,dk], plus any declared preprocessing buffers
INVARIANT H is the post-update state of the accepted prefix
1. Validate key norms, gate domains, tensor dimensions, and sequence resets.
2. For t = 1,...,T:
3.   Apply the independent-sequence reset when required.
4.   Compute H_decay = alpha[t] * H.
5.   Compute residual = value[t] - H_decay * key[t].
6.   Compute H_next = H_decay + eta[t] * outer(residual, key[t]).
7.   Read output = H_next * query[t]; commit the complete state.
8. Return outputs and final state.
~~~

**DERIVED.** Matrix-vector prediction, rank-one correction, and readout each cost $O(d_vd_k)$ per token. The core state holds $d_vd_k$ values per head. No $d_k\times d_k$ transition matrix is needed for sequential decoding. Full projection and local-convolution costs must be added before comparing end-to-end models.

## Implementation

**DERIVED — implementation design.** PyTorch at the **Model / autograd framework** layer supplies a transparent sequential reference and gradient comparison. Triton language at the **Kernels / numerics / collectives** layer is a kernel-authoring route; its general scan primitive [R17.7] is not by itself the specialized chunk algorithm required here. Hugging Face Transformers at the **Model definition / adaptation** layer documents a current hybrid model using Gated DeltaNet [R17.6]; checkpoint integration must preserve its actual normalization and state conventions.

Keep the prediction residual available until every output row has been updated. In-place overwrites that change values still needed by the same matrix-vector product can silently change semantics. Accumulate reductions in a declared dtype, and compare key normalization before blaming a fused update for disagreement. A packed-sequence boundary must reset local convolution history as well as the matrix.

## Experimental design

**PROPOSAL.**

### Experiment 17.4 — Replacement, interference, and forgetting

- **Hypothesis:** The delta correction changes the current key's association according to Eq. 17.14, while interference scales with query/key overlap.
- **Setup:** Validate constructed states before evaluating learned keys and gates.
- **Independent variables:** Key angle, key norm, update strength, forgetting factor, number of intervening writes.
- **Controlled variables:** Values, dimensions, read-after-write convention, initial matrix, projection weights.
- **Dataset/workload:** Repeated-key overwrite, orthogonal-key preservation, correlated-key interference, and context-reset sequences.
- **Hardware:** Record device and runtime for later performance measurements; correctness fixtures have no speed claim.
- **Metrics:** Written-key residual, orthogonal-key drift, state norm, output/gradient error, state bytes.
- **Baselines:** Additive memory, ungated delta update, gated delta update, and the deliberately different gate placement.
- **Expected result:** Constructed cases follow the algebra; learned-task improvement is not assumed.
- **Ablation:** Remove normalization, fix either gate, change accumulation precision, or alter chunk size.
- **Interpretation:** Separate global decay, local correction, representation quality, and implementation error.
- **Threats to validity:** Non-unit keys, differing preprocessing, hidden output normalization, and aggregate metrics that conceal destructive interference.

## Observations

**What the paper claims — PAPER-REPORTED.** Gating and targeted correction are combined in a structured recurrent architecture [P12].

**What the evidence shows — MATHEMATICALLY-DERIVED.** Unit-key replacement, orthogonal correction isolation, and the homogeneous-transition bound follow from the specified update.

**What we infer — DERIVED.** Gate placement and key normalization are semantic invariants that belong in reference tests.

**What remains unknown — UNVERIFIED.** The manuscript has not reproduced trained-model quality, numerical behavior at deployment scale, or kernel throughput.

## Failure modes

> **Failure mode — Gate placement substitution.** *Symptom:* A full-strength write does not recover the incoming value at a unit key. *Cause:* Decay also attenuates the new write. *Detection:* Run the two-coordinate fixture. *Mitigation:* Match Eq. 17.13 exactly before optimizing.

**DERIVED.** Strongly correlated keys interfere even when each has unit norm. Repeated updates can erase a useful association through later similar keys. A forget gate near one preserves irrelevant contributions as well as useful ones; a gate near zero clears both. The local error objective does not identify which factual associations should survive an arbitrary future question.

~~~figure
id: fig-17.14
kind: stat-panel
title: "Delta invariants"
caption: "Declared mathematical and experimental boundaries; these are not measured model results."
placement: rail
anchor: failure-modes
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.14"
alt: "Declared mathematical and experimental boundaries; these are not measured model results."
spec: {"header":"DELTA INVARIANTS","rows":[{"key":"Unit-key full write","value":"new value recovered"},{"key":"Orthogonal correction","value":"zero, before global decay"},{"key":"State precision","value":"independently specified"},{"key":"Gate placement","value":"changes the operator"}]}
~~~

## Siblings

**DERIVED.** [Additive linear attention](17-3-linear-attention.md) assumes accumulating associations is useful; delta updates change the write primitive to error correction. The language-model objective can remain unchanged, but the local state update is different. Its new failure mode is destructive interference between correlated addresses.

[Scalar-decay state-space updates](17-2-state-space-models.md) forget broadly and write additively. Delta transitions introduce a key-dependent rank-one modification, increasing control over a particular association and complicating parallel execution. Neither method eliminates the finite-state limitation in [§17.1](17-1-recurrent-state.md).

## Extensions

**DERIVED.** Multiple corrections per token, richer local losses, and matrix-valued gates are research proposals that change both expressivity and update cost. Each requires a new stability argument and state-budget comparison. For agent workflows, request-local state updates should not be confused with persistent learning across users; the reset and retention policy is part of the system specification.

## Limitations

**DERIVED.** Exact overwrite is a local identity for a normalized key, not a guarantee of exact retrieval after arbitrary intervening writes. The spectral result concerns the homogeneous map, not the whole neural network's training stability. A complete result would also analyze learned projections, nonlinear preprocessing, residual paths, and optimizer dynamics.

## Reproducibility

Retain key/query normalization, gate parameterization, read/write order, initial state, local buffers, dtypes, chunk algorithm, and forward/backward tolerances. Preserve both overwrite and correlated-key fixtures. **UNVERIFIED:** no end-to-end model or device benchmark was run for this manuscript. The revised primary paper was checked separately from its original preprint.

## References

[P12](references.md#p12); [R17.6](references.md#r176); [R17.7](references.md#r177). The worked fixture and spectral analysis are explanatory derivations under the declared gate and normalization conditions.
