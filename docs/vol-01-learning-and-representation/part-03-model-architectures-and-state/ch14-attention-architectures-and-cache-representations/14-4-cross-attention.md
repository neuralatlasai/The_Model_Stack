---
id: ms.section.14.4
entity_type: section
title: Cross-attention
short_title: Cross-attention
section: 14.4
slug: 14-4-cross-attention
parent: ms.chapter.14
prev_sibling: ms.section.14.3
next_sibling: ms.section.14.5
children: []
prerequisites: [ms.chapter.5, ms.chapter.13, ms.section.14.3]
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

# 14.4 — Cross-attention

## Scope

**DERIVED.** Cross-attention uses queries from one stream and keys/values from another. This section develops the source-state and lifetime contract needed for encoder–decoder, multimodal and retrieval-conditioned attention. Family-level parameter accounting remains in [§13.1](../ch13-dense-transformer-design-and-parameter-allocation/13-1-architectural-families.md); source retrieval policy is a downstream subject. The artifact distinguishes reusable source state from each continuation's evolving self-attention state.

## Why this exists

**DERIVED.** Treating all cached tokens as one autoregressive history obscures a useful asymmetry. An encoded document, image or audio segment may remain fixed while a decoder produces many outputs. Recomputing its key/value projections for every output step wastes work, but reusing them after their dependencies change silently changes the computation. A reusable source cache needs a precise identity and lifetime, not merely a text string or an object address.

**DERIVED.** Multimodal and retrieval pipelines make this boundary especially consequential. A source representation may depend on resizing, frame sampling, an encoder revision, retrieved-document order, or a source mask. Two requests with identical decoder prompts need not have identical conditioning states. Conversely, several target continuations can legitimately share one source state if those dependencies and the execution contract agree.

## Intuition

> **Definition — Cross-attention cache validity.** Equality of all dependencies required to reproduce the stored source projections, together with unchanged interpretation, visibility and position conventions at the consuming attention operation.

**DERIVED.** A decoder query changes at each step. Fixed source K/V need not. Different decoder layers usually have different source projection weights, so sharing the encoder output does not automatically mean sharing projected K/V across layers. The cache can sit at either boundary: retain encoder states and project on demand, or retain layer-specific projections and pay greater persistent capacity.

**DERIVED.** Cross-attention is not equivalent to concatenating source tokens into a decoder prefix. The visibility graph, source processing, parameter sharing and positions differ. It is also not a guarantee of grounding: correct computation over irrelevant or incomplete retrieved states can still produce an unsupported answer. Architecture and evidence selection require separate evaluation.

## Formulation

**MATHEMATICALLY-DERIVED.** For one head, let decoder queries $Q\in\mathbb R^{S_y\times d_k}$, projected source keys $K\in\mathbb R^{S_x\times d_k}$ and values $V_x\in\mathbb R^{S_x\times d_v}$. Then

$$
O=\operatorname{softmax}_{\mathrm{source}}
\left(\frac{QK^\top}{\sqrt{d_k}}+A\right)V_x,
\qquad O\in\mathbb R^{S_y\times d_v}.
$$
*(Eq. 14.12)*

where $A$ contains declared source visibility and score bias. The rectangular $S_y\times S_x$ score matrix has no intrinsic triangular-causal requirement: source availability determines the mask. Streaming sources need an explicit time-dependent availability rule.

**MATHEMATICALLY-DERIVED.** Uniform projected source state is

$$
M_{\mathrm{cross}}=
L_xB_xS_xH_{kv,x}(d_k+d_v)b,
$$
*(Eq. 14.13)*

where $L_x$ is the number of cross-attention layers and $B_x$ counts independently stored source encodings. Decoder self-attention state, encoder outputs, masks, layout metadata and replicas are excluded.

**MATHEMATICALLY-DERIVED.** If encoder width is $d_e$, one-time source K/V projection matrix work is

$$
F_{\mathrm{source\ proj}}
=2L_xB_xS_xd_eH_{kv,x}(d_k+d_v).
$$
*(Eq. 14.14)*

where weights are fixed and each source is projected once. Repeating this work for every continuation or token is a different execution policy. Target Q and output projections remain separate.

**MATHEMATICALLY-DERIVED.** If $n_y$ independent continuations share a source with no physical duplication, their combined logical state is

$$
M_{\mathrm{combined}}=
M_{\mathrm{cross}}+
n_yLS_yH_{kv}(d_k+d_v)b.
$$
*(Eq. 14.15)*

where the second term is their self-attention history under the homogeneous layout of §14.1. This fixture uses equal self/cross dimensions for brevity; heterogeneous dimensions require separate terms. Source projections still incur a read or reuse obligation for each continuation's attention.

~~~figure
id: fig-14.12
kind: calculator
title: Shared source cache capacity
caption: Eq. 14.13 counts one projected source allocation. The number of target continuations is not a source multiplicity unless storage is duplicated.
placement: rail
anchor: formulation
states:
  - {anchor: formulation, label: One source, variables: {Bx: 1}, note: "The default source projections occupy 32 MiB."}
  - {anchor: mechanism, label: Four physical source copies, variables: {Bx: 4}, note: "Duplicating the same source for four continuations occupies 128 MiB."}
  - {anchor: failure-modes, label: Restore unique ownership, variables: {Bx: 1}, note: "Sharing requires identical source dependencies and safe immutable ownership."}
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-14.13
alt: Four cross-attention layers, one source of 4096 positions, eight KV heads, 64-dimensional keys and values, and two-byte storage occupy 32 MiB.
spec:
  tex: M=2L_xB_xS_xH_{kv,x}d_hb
  equation: "14.13"
  inputs:
    - {symbol: Lx, label: cross-attention layers, default: 4, min: 1, max: 128, format: integer}
    - {symbol: Bx, label: stored source copies, default: 1, min: 1, max: 64, format: integer}
    - {symbol: Sx, label: source positions, default: 4096, min: 1, max: 131072, format: tokens}
    - {symbol: Hkv, label: source KV heads, default: 8, min: 1, max: 64, format: integer}
    - {symbol: dh, label: equal key and value width, default: 64, min: 16, max: 512, format: integer}
    - {symbol: b, label: bytes per scalar, default: 2, min: 1, max: 4, format: integer}
  outputs:
    - {symbol: M, label: projected source state, formula: 2*Lx*Bx*Sx*Hkv*dh*b, format: bytes}
~~~

## Mechanism

**DERIVED.** The calculator's four-layer source fixture occupies 32 MiB. Four independent physical copies occupy 128 MiB, even if their bytes encode identical content. Four continuations referencing one immutable allocation retain the 32 MiB source term, while their decoder histories still grow independently. This is an ownership calculation, not a claim that a particular framework implements cross-request sharing.

**MATHEMATICALLY-DERIVED.** Attention-product work for $B$ target streams and $S_y$ target queries is $2L_xBS_yS_xH_q(d_k+d_v)$ FLOPs, excluding projections and softmax. Sharing source storage does not eliminate this query-specific work. A large immutable source can therefore remain a repeated bandwidth demand even when it is projected only once.

~~~figure
id: fig-14.13
kind: diagram
title: Source ownership and continuation lifetimes
caption: One immutable source allocation can outlive several target branches. Each branch retains its own evolving decoder state.
placement: inline
evidence: DERIVED
source: DERIVED:eq-14.15
alt: Source preprocessing and encoding produce immutable projected K/V. Two target branches read the same source allocation while updating separate self-attention caches.
spec:
  direction: LR
  nodes:
    - {id: input, kind: dataset, label: source revision and preprocessing}
    - {id: enc, kind: model, label: source encoder}
    - {id: cross, kind: memory, label: layer-specific source KV}
    - {id: a, kind: process, label: target continuation A}
    - {id: b, kind: process, label: target continuation B}
    - {id: sa, kind: state, label: self cache A}
    - {id: sb, kind: state, label: self cache B}
  edges:
    - {from: input, to: enc}
    - {from: enc, to: cross}
    - {from: cross, to: a, kind: dependency}
    - {from: cross, to: b, kind: dependency}
    - {from: a, to: sa}
    - {from: b, to: sb}
~~~

**DERIVED.** Cache identity must bind the source artifact and interpretation. For text, include token IDs, order and source mask. For images or video, include preprocessing and sampling decisions. Bind encoder and cross-projection parameters, relevant normalization and position settings, dtype, quantization scheme, and any stochastic realization required by the computation. An equality check over a stable identity record is stronger than trusting a mutable object reference.

**DERIVED.** Source masks deserve their own boundary. A projected source tensor may be reusable across queries whose masks differ if the consumer applies the correct mask each time. Caching an already masked or position-dependent transformed representation may narrow that reuse contract. The record must say whether visibility is a property of stored bytes, consumer arguments, or both.

**DERIVED.** Appending source content can invalidate more than the appended positions. With a bidirectional encoder, earlier source states can depend on the new content, so retaining old projected K/V while adding only the new projections need not match a fresh encode. Incremental extension is valid only under a source encoder and preprocessing contract that preserves previous states. Streaming causal encoders and fixed document chunks offer different possible boundaries.

**DERIVED.** Retrieval-conditioned attention adds a changing source set. A retrieval refresh can change membership, order, deduplication or document revisions. Individually encoded documents may permit per-document reuse, but a joint encoder over the retrieved bundle can couple all members. Cache invalidation should follow the actual dependency graph rather than a generic “retrieval result changed” flag.

**DERIVED.** Training reuse requires further care. Reusing a detached source tensor removes gradient paths into its encoder. Retaining one shared computation graph across several target losses can accumulate the correct gradients only under the intended loss reduction and lifetime. Different dropout realizations also change the training experiment. These are semantic choices, not implementation details that can be ignored because inference outputs match.

## Algorithm

**DERIVED — proposed source-cache lifecycle.**

~~~text
Algorithm 14.4 — Acquire and invalidate source projections
INPUT: immutable source specification, model identities, projection contract, consumer
OUTPUT: Result(valid source-state handle, invalid or unsupported request)
STATE: bounded cache entries with dependency identity and reference ownership
INVARIANT: each consumer reads state built from its declared source dependencies
1. Canonicalize source order, preprocessing, encoder and projection identities.
2. Look up an entry with exactly matching stored-state dependencies.
3. On a miss, encode/project within the declared resource limit.
4. Publish the complete immutable entry only after every required tensor exists.
5. Bind consumer-specific masks and target position conventions separately.
6. Share read-only state while consumers remain active; isolate target caches.
7. Invalidate changed dependencies and release state after the last owner.
8. On failure, expose no partial cache entry and return the cause.
~~~

**DERIVED — complexity.** Validating a source specification is linear in its serialized size unless a trusted immutable digest is already available. An ordered index over $n$ entries costs $O(\log n)$ fixed-width comparisons per lookup. Encoding and projection dominate misses; Eq. 14.14 gives only the projection matrix term. Cache size and entry lifetime must be bounded; the algorithm does not prescribe an unbounded global store.

## Implementation

**OFFICIAL-DOCUMENTATION — [R14.5](references.md#r145).** PyTorch's attention interface permits distinct query and source sequence dimensions. **DERIVED.** This supplies a *Model / autograd framework* reference for Eq. 14.12. Hugging Face Transformers occupies *Model definition / adaptation*, and FlashAttention occupies *Kernels / numerics / collectives*. Their source-state and mask conventions must be inspected independently rather than transferred by API resemblance.

**DERIVED.** A rectangular cross-attention operation usually needs a source-availability mask, not the decoder self-attention causal shortcut. The non-square causal-alignment issue in [§14.5](14-5-exact-versus-approximate-computation.md) provides a useful negative control. A nonempty source with all positions masked still requires a declared output/error policy; an empty softmax denominator must not silently yield a plausible vector.

**DERIVED.** Distributed source sharing can exchange capacity for communication. One rank retaining the source may need to broadcast or service reads; replication spends capacity to improve locality. In multimodal settings, transfer and encoding can dominate source construction. Report source acquisition, preprocessing, encoding, projection and decoder attention as separate measurement intervals.

## Experimental design

**PROPOSAL — no cache implementation or timing claim.**

### Experiment 14.4 — Source reuse and dependency invalidation

- **Hypothesis:** valid source reuse preserves outputs while avoiding repeated projection; incomplete identities produce detectable stale-state errors.
- **Setup:** compare fresh computation with shared source state across multiple target continuations.
- **Independent variables:** continuation count, source revision, source order, preprocessing and retrieval refresh.
- **Controlled variables:** target inputs, weights, dtype, masks, positional convention and stochastic policy.
- **Dataset/workload:** text pairs plus bounded image/frame or document-set fixtures with audited source identity.
- **Hardware:** record encoding and decoding devices, transfer links, runtime and backend.
- **Metrics:** output discrepancy, unique source bytes, replicated bytes, projection invocations, source-build latency and decode latency.
- **Baselines:** fresh source encoding per continuation and valid immutable sharing.
- **Expected result:** correct reuse agrees under the declared tolerance; changed dependencies invalidate state.
- **Ablation:** omit encoder revision, reorder retrieved sources, and append to a bidirectional source.
- **Interpretation:** capacity sharing and compute amortization are independent from task grounding quality.
- **Threats to validity:** shared mutable tensors, hidden dropout, source-mask changes, detached training graphs and asynchronous timing.

## Observations

**What the paper claims.** **OFFICIAL-DOCUMENTATION — R14.5.** The inspected attention interface supports separate query and source dimensions.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** Source projection and attention terms depend on different multiplicities.

**What we infer.** **DERIVED.** Reuse must follow source dependencies and tensor ownership.

**What remains unknown.** **UNVERIFIED.** Cross-request sharing, transfer cost and latency depend on the chosen implementation.

## Failure modes

~~~figure
id: fig-14.14
kind: stat-panel
title: Source and target lifetime boundaries
caption: Eq. 14.15 shares only the source term; target histories remain branch-specific and consume independent capacity.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-14.15
alt: Track source identity and immutable ownership separately from target histories and consumer masks.
spec:
  header: LIFETIME AUDIT
  rows:
    - {key: source, value: fixed dependency identity}
    - {key: target, value: per-continuation history}
    - {key: mask, value: consumer visibility}
    - {key: release, value: last valid owner}
~~~

> **Failure mode — stale source projections.** **DERIVED.** *Symptom:* cached and fresh outputs diverge. *Cause:* omitted dependency in the cache identity. *Detection:* controlled source/encoder perturbation. *Mitigation:* invalidate the complete affected dependency closure.

> **Failure mode — branch mutation.** **DERIVED.** *Symptom:* one continuation alters another's output. *Cause:* mutable source alias or incorrectly shared target state. *Detection:* interleaved branch fixture. *Mitigation:* immutable source handles and independent target ownership.

## Siblings

**DERIVED.** [Self-attention KV sharing](14-1-mha-mqa-and-gqa.md) concerns projections within an evolving history. Cross-attention adds a distinct source lifetime. [Latent state](14-2-latent-attention.md) can represent source projections differently, while [sparse coverage](14-3-sparse-and-local-attention.md) can restrict which source positions are read. None of these alternatives determines source relevance.

## Extensions

**DERIVED.** Streaming audio/video requires an availability boundary for each source update. Retrieval refreshes require an artifact-version boundary. Multi-source conditioning can retain different modality encoders and cache lifetimes; combining them into one tensor does not eliminate their separate provenance or invalidation rules.

## Limitations

**DERIVED.** The formulas omit source acquisition, encoder activations, projection weights, masks and physical allocation. Lower projection frequency does not guarantee lower end-to-end latency if source transfer or decoder attention dominates. Energy and cost require those phases to be measured.

## Reproducibility

**DERIVED.** Preserve source artifacts, preprocessing, encoder and projection revisions, source order, visibility rules, position conventions, branch ownership, dtype, layout and invalidation tests. State whether reuse is within one request, across continuations, or across requests.

## References

[R14.5](references.md#r145); [R14.6](references.md#r146); [R14.8](references.md#r148); [§13.1](../ch13-dense-transformer-design-and-parameter-allocation/13-1-architectural-families.md).
