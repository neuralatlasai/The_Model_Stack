---
id: ms.section.17.3
entity_type: section
title: "Linear attention"
short_title: "Linear attention"
section: 17.3
slug: 17-3-linear-attention
parent: ms.chapter.17
prev_sibling: ms.section.17.2
next_sibling: ms.section.17.4
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


# 17.3 — Linear attention

## Scope

This section derives causal kernel attention as an associative state update, including the normalization accumulator, feature-map conditions, storage cost, and retrieval limitations. It distinguishes exact evaluation of a chosen kernel from approximation of softmax attention. The baseline is the same kernel evaluated by explicit pairwise sums; a softmax Transformer is a separate architectural baseline. Success requires recurrent and pairwise forms to agree under the same masking, feature map, initialization, and numerical convention.

## Why this exists

**PAPER-REPORTED.** Linear Transformers exploit feature-map factorization and matrix-product associativity to express attention through recurrent statistics [R17.2]. The historical contribution is the algebraic route from pairwise interaction to persistent state; it does not establish a universal quality or latency ordering among modern architectures.

**DERIVED.** The key constraint is when aggregation takes place. Pairwise attention retains keys and values so each later query can assign its own weights over the retained items. A fixed feature statistic aggregates those items before the future query arrives. This removes the need to revisit every stored token, but all future queries must operate through the chosen feature space.

A fair analysis therefore specifies feature dimension as well as sequence length. Increasing that dimension can reduce collisions or improve a kernel approximation, while increasing every state's size and update cost. An asymptotic statement that treats feature dimension as fixed cannot silently scale it with sequence length to preserve accuracy and still claim the original constant-state budget.

## Intuition

**DERIVED.** The state contains weighted sums of values indexed by feature directions. A query combines those directions. Two keys with indistinguishable features have indistinguishable addressing behavior, regardless of how different their original token strings were. An output projection after the readout cannot generally recover which value belonged to which of two collapsed keys.

> **Definition — Associative feature state.** The accumulated value-feature outer products and, when required, feature sums that suffice to evaluate a specified factorized causal attention kernel.

This definition includes the normalizer because it affects the output. An unnormalized outer-product recurrence is a useful mechanism, but it is not the same operator as normalized kernel attention. Learned residual paths can compensate for some behavior during training; that does not make the two formulas algebraically equivalent.

## Formulation

**MATHEMATICALLY-DERIVED — explanatory reconstruction of the factorization in [R17.2].** Let query and key features lie in a nonnegative feature space:

$$
\kappa(q,k)=\phi(q)^\top\phi(k),\qquad
y_t=\frac{\sum_{i=1}^{t}v_i\kappa(q_t,k_i)}
{\sum_{i=1}^{t}\kappa(q_t,k_i)}.
$$
*(Eq. 17.8)*

where $q_t,k_i\in\mathbb R^{d_k}$, $\phi:\mathbb R^{d_k}\to\mathbb R_{\ge0}^{r}$, $v_i,y_t\in\mathbb R^{d_v}$, and the denominator must be strictly positive.

Nonnegative features make weights nonnegative but do not alone guarantee a positive denominator. Disjoint supports or zero features can give zero. Strictly positive features with at least one admitted key are sufficient in exact arithmetic, though underflow remains a numerical concern.

Define the causal states

$$
H_t=H_{t-1}+v_t\phi(k_t)^\top,\qquad
z_t=z_{t-1}+\phi(k_t),\qquad
y_t=\frac{H_t\phi(q_t)}{z_t^\top\phi(q_t)}.
$$
*(Eq. 17.9)*

where $H_t\in\mathbb R^{d_v\times r}$, $z_t\in\mathbb R^r$, and $H_0=0,z_0=0$ for a fresh sequence.

These equations include the current key/value. A strict-past mask instead reads the previous state and then writes the current item. The language-model label shift must be handled separately; “causal” does not mean that the target token may be included as an input.

For $h$ independent heads in each of $L$ layers,

$$
M_{\mathrm{linear}}=BLh(rd_v+r)b,\qquad
W_{\mathrm{core}}=O(BLhTrd_v).
$$
*(Eq. 17.10)*

where $B$ is concurrent sequences, $b$ bytes per state value, $T$ processed tokens, and $W_{\mathrm{core}}$ is arithmetic work excluding projections, feature construction, and output processing.

Separate dtypes require separate byte terms for $H_t$ and $z_t$. The formula is logical tensor payload; metadata, local buffers, and allocator overhead are additional.

~~~figure
id: fig-17.9
kind: calculator
title: "Feature-state storage"
caption: "Illustrative homogeneous heads, not a named model. The calculator executes the persistent payload in Eq. 17.10 and excludes projections and local buffers."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.10"
alt: "Illustrative homogeneous heads, not a named model. The calculator executes the persistent payload in Eq. 17.10 and excludes projections and local buffers."
spec: {"tex": "M=BLh(rd_v+r)b", "equation": "17.10", "inputs": [{"symbol": "B", "label": "requests", "default": 1, "min": 1, "max": 64, "step": 1, "format": "fixed2"}, {"symbol": "L", "label": "layers", "default": 24, "min": 1, "max": 128, "step": 1, "format": "fixed2"}, {"symbol": "h", "label": "heads per layer", "default": 16, "min": 1, "max": 64, "step": 1, "format": "fixed2"}, {"symbol": "r", "label": "feature width", "default": 64, "min": 8, "max": 1024, "step": 1, "format": "fixed2"}, {"symbol": "dv", "label": "value width", "default": 64, "min": 8, "max": 512, "step": 1, "format": "fixed2"}, {"symbol": "b", "label": "bytes per state value", "default": 4, "min": 1, "max": 8, "step": 1, "format": "fixed2"}], "outputs": [{"symbol": "memory", "label": "state bytes", "formula": "B*L*h*(r*dv+r)*b", "format": "bytes"}]}
states: [{"anchor":"formulation","label":"Reference width","variables":{"r":64},"note":"The normalizer is included in the state."},{"anchor":"mechanism","label":"Wider feature space","variables":{"r":256},"note":"State bytes and core update work increase together."},{"anchor":"failure-modes","label":"Concurrent requests","variables":{"B":16},"note":"Fixed per-request state still scales with concurrency."}]
~~~

## Mechanism

**MATHEMATICALLY-DERIVED.** Distribute the matrix-vector product in Eq. 17.9. Each outer product contributes $v_i[\phi(k_i)^\top\phi(q_t)]$ to the numerator. Distributing the normalizer gives the denominator in Eq. 17.8. This proves equality to the declared kernel, with the same admitted prefix. No approximation has been introduced by reassociation itself.

An approximation arises only if the chosen features approximate a different target kernel. A finite feature map need not reproduce the exponential dot-product kernel exactly. Compare against explicit evaluation of the chosen kernel when testing implementation correctness; compare against softmax attention when studying architectural quality.

The collision structure can be exposed without a trained model. Suppose two admitted keys have the same nonzero feature $a$, their values are $v_1,v_2$, and the query has positive inner product with $a$. With no other entries, the output is $(v_1+v_2)/2$. Swapping the two values changes neither state nor output. No later readout based only on that state can identify which arrived last. This is a constructive limitation of the additive statistic, not an empirical claim about every layer in a contextualized network.

The unnormalized matrix readout makes interference equally explicit:

$$
Hq=\sum_i v_i(a_i^\top q),\qquad
H=\sum_i v_i a_i^\top,\qquad
\Delta y=\delta v_j(a_j^\top q).
$$
*(Eq. 17.11)*

where $a_i=\phi(k_i)$ and $\delta v_j$ is a change to one stored value in an otherwise fixed unnormalized memory.

Orthogonal key features isolate associations for matching queries. At most $r$ nonzero mutually orthogonal directions exist in $\mathbb R^r$. This is not a universal bound of exactly $r$ retrievable facts: structured values, approximate recall, multiple heads, and contextual feature generation change the task. It does establish that arbitrary independent associations cannot all have mutually orthogonal addresses in a fixed smaller feature space.

A forgetting variant multiplies both $H_{t-1}$ and $z_{t-1}$ by the same positive decay before writing. Unrolling then weights every earlier pair by the product of intervening decays. Decaying only the numerator changes normalization and does not represent that weighted average. A common rescaling of both states preserves the current readout, but future writes must be represented in the same scale; blindly renormalizing old state before unscaled additions changes relative weights.

~~~figure
id: fig-17.10
kind: diagram
title: "Two sufficient accumulators"
caption: "For the chosen causal kernel, each key/value updates a matrix and each key updates a normalizer. A query needs both to compute the normalized output."
placement: inline
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.9"
alt: "For the chosen causal kernel, each key/value updates a matrix and each key updates a normalizer. A query needs both to compute the normalized output."
spec: {"direction":"LR","nodes":[{"id":"n0","kind":"tensor","label":"Key and value features"},{"id":"n1","kind":"process","label":"Outer-product and feature sums"},{"id":"n2","kind":"process","label":"Matrix H plus vector z"},{"id":"n3","kind":"process","label":"Query read and denominator"},{"id":"n4","kind":"metric","label":"Normalized output"}],"edges":[{"from":"n0","to":"n1","kind":"flow"},{"from":"n1","to":"n2","kind":"flow"},{"from":"n2","to":"n3","kind":"flow"},{"from":"n3","to":"n4","kind":"flow"}]}
~~~

## Algorithm

~~~text
Algorithm 17.3 — Causal normalized feature attention
INPUT bounded q[1:T], k[1:T], v[1:T], feature map, positive-denominator policy
OUTPUT y[1:T], final H and z
STATE H[dv,r] and z[r], initialized to zero for each independent sequence
INVARIANT state contains exactly the admitted prefix under the selected mask
1. Validate feature and value dimensions, sequence boundaries, and dtypes.
2. For t = 1,...,T:
3.   Compute query and key features; verify required feature-domain conditions.
4.   Update H by the value/key-feature outer product and z by key features.
5.   Compute numerator H times query feature and denominator z dot query feature.
6.   If the denominator violates the declared domain, apply the explicit policy.
7.   Otherwise divide and emit the result; do not silently change the operator.
8. Return outputs and both state components.
~~~

**DERIVED.** Core work per token is $O(rd_v)$, with additional feature-map and projection costs. A bounded explicit pairwise implementation is appropriate as a small correctness oracle, not as the scalable production path. Chunked evaluation can use matrix products for intra-chunk interactions while carrying the same two boundary statistics. With fixed chunk length its sequence dependence remains linear, but chunk size changes temporary storage and matrix shapes.

## Implementation

**DERIVED — implementation design.** Use PyTorch at the **Model / autograd framework** layer for the pairwise oracle and recurrent reference. Triton language at the **Kernels / numerics / collectives** layer can implement prefix accumulation and fused reads; its scan documentation defines the primitive's interface [R17.7]. Hugging Face Transformers at the **Model definition / adaptation** layer is an integration boundary for complete model behavior, not evidence that every model labeled linear attention implements Eq. 17.9.

Track the normalizer's dynamic range independently of the matrix state. Adding a positive epsilon to the denominator can be a chosen regularization, but it changes the output, especially when the true denominator is small. Record its value, dtype, and placement. A masked token must not contribute to either accumulator. At document boundaries, reset both. With state sharding, the reduction required for a readout depends on whether value or feature dimensions are partitioned.

## Experimental design

**PROPOSAL.**

### Experiment 17.3 — Feature collisions and normalization

- **Hypothesis:** Controlled feature collisions expose retrieval interference independently of implementation error.
- **Setup:** First compare explicit and recurrent forms with identical features, then evaluate trained feature generators.
- **Independent variables:** Feature width, key similarity, pair count, denominator magnitude, state dtype.
- **Controlled variables:** Values, query locations, mask convention, weights, initial states, projection dimensions.
- **Dataset/workload:** Orthogonal features, duplicated keys, near-collinear keys, disjoint-support features, and random held-out key/value pairs.
- **Hardware:** Record device, runtime, compiler revision, and kernel selection.
- **Metrics:** Output error against the same-kernel oracle, exact recall, denominator minima, persistent and peak bytes.
- **Baselines:** Explicit chosen-kernel attention, recurrent chosen-kernel attention, and separately trained softmax attention.
- **Expected result:** Equivalent implementations agree; collisions yield the analytically predicted mixture in the constructed case.
- **Ablation:** Remove the normalizer, change epsilon, or increase feature width without changing values.
- **Interpretation:** Operator correctness, kernel approximation, and learned retrieval are separate findings.
- **Threats to validity:** Changing feature maps between baselines, leaking values into queries, and reporting an averaged metric that hides low-denominator failures.

## Observations

**What the paper claims — PAPER-REPORTED.** The linear-attention construction admits iterative causal computation through feature statistics [R17.2].

**What the evidence shows — MATHEMATICALLY-DERIVED.** Reassociation preserves the chosen kernel, while the duplicate-feature example proves an information collision in the additive state.

**What we infer — DERIVED.** A width-quality comparison must report feature dimension and persistent bytes alongside parameters.

**What remains unknown — UNVERIFIED.** Neither the optimal feature map nor a modern quality/throughput frontier has been established by this chapter.

## Failure modes

> **Failure mode — Missing denominator state.** *Symptom:* Chunked continuation changes output scale. *Cause:* The numerator state is restored but the normalizer is reset or omitted. *Detection:* Compare both accumulators and the first post-boundary denominator. *Mitigation:* Include both in the state contract.

**DERIVED.** Nonnegative features can still produce zero overlap. Signed features introduce additional cancellation and remove the convex-combination interpretation. Long accumulations may lose small updates in finite precision. Enlarging the feature dimension changes bandwidth and workspace requirements; a quality improvement can therefore consume the resource advantage originally being studied.

~~~figure
id: fig-17.11
kind: stat-panel
title: "Kernel contract"
caption: "Declared mathematical and experimental boundaries; these are not measured model results."
placement: rail
anchor: failure-modes
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.9"
alt: "Declared mathematical and experimental boundaries; these are not measured model results."
spec: {"header":"KERNEL CONTRACT","rows":[{"key":"Exactness","value":"for the chosen kernel"},{"key":"Normalizer","value":"persistent state"},{"key":"Collision test","value":"duplicate feature addresses"},{"key":"Softmax equivalence","value":"requires separate justification"}]}
~~~

## Siblings

**DERIVED.** [Selective SSMs](17-2-state-space-models.md) introduce structured content-dependent propagation; normalized feature attention makes query-dependent readout and its denominator explicit. [Delta mechanisms](17-4-delta-rule-mechanisms.md) change the additive write into a prediction-error correction. This enables targeted replacement but changes the operator and its parallel algorithm.

Softmax attention retains per-token keys and values and normalizes separately for each query. Replacing that storage with feature sums changes the representation assumption while allowing the training objective to remain unchanged. Its new failure mode is compression-induced addressing interference, not merely numerical approximation.

## Extensions

**DERIVED.** Position features can distinguish identical content at different locations, but they also consume feature capacity and alter extrapolation behavior. For streaming multimodal inputs, normalization may weight frequent token types disproportionately when their feature norms differ. A proposed analysis should stratify by modality and token rate instead of inferring balanced influence from a shared feature dimension.

## Limitations

**DERIVED.** The duplicate-feature construction fixes the feature sequence. Deep contextual encoders may produce different keys after an order change, so the construction is not a proof that an entire contextualized network is permutation invariant. It isolates the aggregation primitive. End-to-end tests must distinguish that primitive from the representations supplied to it.

## Reproducibility

Retain the exact feature function, input scaling, causal mask, normalizer policy, epsilon, state dtypes, reset rules, kernel revision, and explicit-oracle tolerance. Report the whole feature-state byte count. **UNVERIFIED:** trained retrieval and device performance remain experimental proposals.

## References

[R17.2](references.md#r172); [R17.7](references.md#r177). Kernel identities and counterexamples are derived in this section with their masking and feature-domain assumptions explicit.

