---
id: ms.section.17.5
entity_type: section
title: "Hybrid composition"
short_title: "Hybrid composition"
section: 17.5
slug: 17-5-hybrid-composition
parent: ms.chapter.17
prev_sibling: ms.section.17.4
next_sibling: ms.section.17.6
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


# 17.5 — Hybrid composition

## Scope

This section studies architectures that combine recurrent and attention token mixers. It covers layer placement, shared residual representations, heterogeneous state, training stability, and state restoration. Success is a complete accounting of what each layer reads, writes, retains, and communicates. The baseline is a homogeneous model under an explicitly chosen parameter, training, or inference-state budget. Hybrid composition is an architectural choice; it does not by itself imply shared state, superior quality, or constant-memory decoding.

## Why this exists

**DERIVED.** A fixed-size recurrent summary can make long histories affordable while discarding distinctions that future exact retrieval may require. Attention can preserve access to retained token representations, but those representations occupy history-dependent storage. A hybrid architecture exposes a design space between these allocations: some layers transform compact state while others retain addressable history.

The difficulty shifts from selecting a single token mixer to allocating different memory mechanisms across depth. One must decide where history is read, which intermediate representations are stored, how much capacity each mechanism receives, and whether the resulting quality justifies the additional state and implementation complexity.

**PAPER-REPORTED.** Nemotron-H describes models combining Mamba-2, attention, and feed-forward components [R17.4]. **OFFICIAL-DOCUMENTATION.** The Qwen3-Next model card and Transformers documentation describe hybrid Gated DeltaNet and gated attention [R17.5; R17.6]. These are concrete architecture examples inspected for this edition, not evidence that one universal mixture is optimal.

## Intuition

**DERIVED.** Layers share a representation stream while maintaining different temporal memories. A recurrent layer changes what the next attention layer sees; an attention layer changes what later recurrent layers encode. Exchanging their positions therefore changes the composed function even if their counts remain identical.

> **Definition — Heterogeneous sequence state.** A per-request state collection containing different temporal storage primitives, such as recurrent matrices, convolution buffers, and layer-specific attention caches, with a common accepted-prefix boundary.

A shared representation width is an interface condition, not proof of shared memory. Two layers can both consume vectors of the same width while owning unrelated caches. Conversely, deliberately sharing state across layers changes the model and requires its own specification.

## Formulation

**MATHEMATICALLY-DERIVED — abstract composition.** A simplified residual token-mixing layer is

$$
u_t^{(\ell+1)}=u_t^{(\ell)}
+\mathcal F_\ell\!\left(\operatorname{Norm}_\ell(u_t^{(\ell)}),
\mathcal S_{t-1}^{(\ell)}\right),\qquad
\mathcal S_t^{(\ell)}=\mathcal U_\ell\!\left(
\mathcal S_{t-1}^{(\ell)},u_t^{(\ell)}\right).
$$
*(Eq. 17.16)*

where $\ell$ indexes layers, $u_t^{(\ell)}\in\mathbb R^d$ is the residual representation, $\mathcal S_t^{(\ell)}$ the complete layer state, and $\mathcal F_\ell,\mathcal U_\ell$ jointly implement the chosen read/update convention.

The notation suppresses feed-forward sublayers and permits the output function to compute a read from its candidate updated state. It is not an assertion that every named architecture has this exact normalization order.

For recurrent layers $\mathcal R$ and conventional attention-cache layers $\mathcal A$,

$$
M_{\mathrm{persistent}}(S)=
B\left[
\sum_{\ell\in\mathcal R}m_\ell^{\mathrm{rec}}
+\sum_{\ell\in\mathcal A}2S_\ell h_{\ell,\mathrm{kv}}d_{\ell,h}b_\ell
+m_{\mathrm{aux}}
\right].
$$
*(Eq. 17.17)*

where $B$ is equal-length concurrent requests, $m_\ell^{\mathrm{rec}}$ is recurrent payload bytes per request, $S_\ell$ retained cache positions, $h_{\ell,\mathrm{kv}}$ KV heads, $d_{\ell,h}$ head width, $b_\ell$ cache bytes per value, and $m_{\mathrm{aux}}$ other persistent bytes per request.

This counts conventional key/value caches. Compressed latent representations require their actual formula from [Chapter 14](../ch14-attention-architectures-and-cache-representations/README.md). Full attention uses $S_\ell=S$; a simple fixed sliding window uses $S_\ell=\min(S,w_\ell)$, excluding any separately retained sinks or global tokens.

If every attention layer retains the full prefix, Eq. 17.17 reduces to

$$
M_{\mathrm{persistent}}(S)=B(m_{\mathrm{fixed}}+\kappa_{\mathrm{attn}}S),\qquad
S_{\mathrm{equal}}=\frac{m_{\mathrm{fixed}}}{\kappa_{\mathrm{attn}}}
\quad(\kappa_{\mathrm{attn}}>0).
$$
*(Eq. 17.18)*

where $m_{\mathrm{fixed}}$ is per-request fixed persistent payload, $\kappa_{\mathrm{attn}}$ bytes of attention cache per retained token per request, and $S_{\mathrm{equal}}$ the length where those two contributions are equal.

This is an internal storage balance, not a latency crossover or an architecture-quality threshold. Even one unbounded full-history cache makes the model's persistent state grow with $S$.

~~~figure
id: fig-17.15
kind: calculator
title: "Hybrid state allocation"
caption: "Illustrative payload allocation, not a named model. Eq. 17.18 separates fixed recurrent storage from full-history attention storage; no latency or quality is inferred."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.18"
alt: "Illustrative payload allocation, not a named model. Eq. 17.18 separates fixed recurrent storage from full-history attention storage; no latency or quality is inferred."
spec: {"tex": "M=B(m_{fixed}+\\kappa S)", "equation": "17.18", "inputs": [{"symbol": "B", "label": "requests", "default": 1, "min": 1, "max": 64, "step": 1, "format": "fixed2"}, {"symbol": "fixed", "label": "fixed bytes per request", "default": 8388608, "min": 0, "max": 67108864, "step": 1, "format": "fixed2"}, {"symbol": "rate", "label": "KV bytes per token", "default": 8192, "min": 128, "max": 65536, "step": 1, "format": "fixed2"}, {"symbol": "S", "label": "retained positions", "default": 4096, "min": 1, "max": 131072, "step": 1, "format": "fixed2"}], "outputs": [{"symbol": "total", "label": "persistent bytes", "formula": "B*(fixed+rate*S)", "format": "bytes"}, {"symbol": "equal", "label": "equal-contribution length", "formula": "fixed/rate", "format": "tokens"}]}
states: [{"anchor":"formulation","label":"Reference prefix","variables":{"S":4096},"note":"Attention state and recurrent state have different length dependence."},{"anchor":"mechanism","label":"Longer prefix","variables":{"S":32768},"note":"Full-history cache growth remains even in a mostly recurrent model."},{"anchor":"failure-modes","label":"More requests","variables":{"B":16},"note":"Concurrency multiplies both payload components."}]
~~~

## Mechanism

**MATHEMATICALLY-DERIVED.** Composition is generally noncommutative. A minimal linear analogy suffices: applying matrices $F$ and $G$ in opposite orders gives $GFu$ versus $FGu$, unequal whenever the matrices do not commute on $u$. Neural token mixers add history dependence and nonlinearities, so equal layer counts do not imply equal functions. Placement must be measured through a controlled intervention, not inferred from a count ratio.

Different placements also expose different representations to persistent storage. An early attention layer retains keys and values from a less deeply transformed stream. A later one stores representations after additional transformations, potentially including information propagated recurrently. This is a mechanism-level distinction, not a guarantee that either placement is superior.

**DERIVED — memory accounting.** The combined state must correspond to one accepted prefix. During prefill, layers may use different chunk schedules, but a returned checkpoint must represent the same boundary in every component. During one-token decode, every applicable component advances exactly once. Padding, packed-document resets, and speculative branches must preserve that invariant.

Speculative rejection reveals why generic cache operations are insufficient. An append-only attention cache can often discard a rejected suffix by restoring its valid length. A recurrent matrix has overwritten earlier values. Correct rollback therefore requires a pre-branch snapshot, recomputation from an earlier checkpoint, or another proven restoration method. Inverting a decay is not generally adequate: gates can be singular, finite precision loses information, and auxiliary nonlinear buffers may be irreversible.

Branching a shared prefix creates a related ownership problem. Immutable attention blocks may be shared until a branch writes new content. Recurrent state must be logically private once branches diverge. Copy-on-write or reconstruction is possible, but its copy traffic and synchronization belong in the cost model. A fixed state is not free to duplicate.

Training stability also crosses mechanism boundaries. Residual magnitudes, normalization placement, gate initialization, and precision can make one mixer dominate the stream. A swap experiment that changes mixer type and normalization simultaneously cannot isolate either cause. Monitor layerwise activation and gradient norms alongside loss; the norms diagnose numerical behavior but are not themselves task quality.

~~~figure
id: fig-17.16
kind: diagram
title: "One prefix, several state owners"
caption: "The residual stream passes through different token mixers. Their distinct state components must all correspond to the same accepted prefix before continuation or rollback."
placement: inline
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.16"
alt: "The residual stream passes through different token mixers. Their distinct state components must all correspond to the same accepted prefix before continuation or rollback."
spec: {"direction":"LR","nodes":[{"id":"n0","kind":"tensor","label":"Residual stream"},{"id":"n1","kind":"process","label":"Recurrent layer and state"},{"id":"n2","kind":"process","label":"Attention layer and KV cache"},{"id":"n3","kind":"process","label":"Later recurrent layer"},{"id":"n4","kind":"metric","label":"Consistent prefix checkpoint"}],"edges":[{"from":"n0","to":"n1","kind":"flow"},{"from":"n1","to":"n2","kind":"flow"},{"from":"n2","to":"n3","kind":"flow"},{"from":"n3","to":"n4","kind":"flow"}]}
~~~

## Algorithm

~~~text
Algorithm 17.5 — Transactional hybrid continuation
INPUT accepted prefix state, bounded continuation tokens, layer schedule
OUTPUT continuation outputs and consistent final prefix state
STATE per-layer recurrent tensors, KV metadata, local buffers, prefix counter
INVARIANT all state components represent the same accepted token boundary
1. Validate layer schedule, cache schema, state versions, and request ownership.
2. At a branch boundary, snapshot or declare a complete reconstruction point.
3. For each continuation token and each layer in architectural order:
4.   Apply that layer's mixer with its own state and current representation.
5.   Retain candidate updates until the request's acceptance decision is known.
6. On acceptance, advance all logical prefix boundaries consistently.
7. On rejection, restore every component to the declared accepted boundary.
8. Compare resumed logits and states with a non-branching reference.
~~~

**DERIVED.** The algorithm specifies state semantics, not a production scheduler. Copying a full snapshot costs bytes proportional to total persistent state; a recurrent-only snapshot is constant in prefix length but still scales with width, layers, and concurrency. Recomputing a rejected branch exchanges snapshot memory for additional computation. Report that tradeoff separately from steady-state decoding.

## Implementation

**OFFICIAL-DOCUMENTATION.** Hugging Face Transformers, at the **Model definition / adaptation** layer, documents Qwen3-Next's heterogeneous token mixers [R17.6]. This supports examining a real hybrid integration, while the exact checkpoint and runtime revision remain required for execution claims.

**DERIVED — implementation design.** PyTorch at the **Model / autograd framework** layer can expose per-layer activations, state tensors, and reference gradients. Triton language at the **Kernels / numerics / collectives** layer provides custom-kernel primitives [R17.7], but each mixer may use a different optimized path. Attribute timings to the path actually selected rather than to the model family name.

Include state movement between devices when layers are partitioned. A pipeline boundary transfers representations; state may remain with its owner, but migration and recovery can require transferring it. A model with inexpensive local recurrence can still be limited by projections, feed-forward work, communication, or scheduling. Memory savings improve feasible concurrency only after weights, workspaces, and other reservations are included.

## Experimental design

**PROPOSAL.**

### Experiment 17.5 — Placement under a declared state budget

- **Hypothesis:** Placement changes retrieval and stability even when mixer counts are fixed.
- **Setup:** Train matched families with recurrent-first, attention-first, and interleaved schedules.
- **Independent variables:** Placement, attention fraction, window policy, recurrent width, state dtype.
- **Controlled variables:** Tokenizer, data order, training tokens, optimizer, seeds, normalization policy, evaluation prompts.
- **Dataset/workload:** Held-out language modeling, delayed random association, local comparison, revision, and exact-copy tasks.
- **Hardware:** Declare accelerator count, topology, runtime, kernel revisions, and precision for every run.
- **Metrics:** Quality by task and length, complete persistent bytes, peak memory, prefill time, per-token decode latency, restoration error.
- **Baselines:** Homogeneous attention and homogeneous recurrence; separate equal-parameter and equal-state-budget comparisons.
- **Expected result:** No universal winning placement is presumed; the experiment tests whether composition matters under the selected controls.
- **Ablation:** Hold layer counts fixed while permuting positions; then vary counts in a separate study.
- **Interpretation:** Attribute a placement effect only when training and normalization interventions are controlled.
- **Threats to validity:** Unequal optimization effort, state-budget matching at only one length, kernel maturity, and parameter adjustments that change model width.

## Observations

**What the paper claims — PAPER-REPORTED.** Nemotron-H provides a concrete Mamba/attention composition [R17.4].

**What the evidence shows — OFFICIAL-DOCUMENTATION.** Qwen3-Next's public model surfaces describe another hybrid using Gated DeltaNet and gated attention [R17.5; R17.6]. These records establish disclosed design choices, not independent performance reproduction.

**What we infer — DERIVED.** Hybrid comparisons need both a layer schedule and a complete per-layer state ledger.

**What remains unknown — UNVERIFIED.** The best placement, attention fraction, and restoration strategy for the proposed workloads have not been measured.

## Failure modes

> **Failure mode — Mixed-prefix restoration.** *Symptom:* Generation diverges only after speculative rejection or branch reuse. *Cause:* KV length is restored while recurrent state remains advanced. *Detection:* Compare all per-layer states at the accepted boundary. *Mitigation:* Restore a complete snapshot or recompute the rejected segment correctly.

**DERIVED.** Another failure is reporting the fixed recurrent component as the entire model's state while ignoring remaining attention layers. A model may be mostly recurrent by layer count yet dominated by attention-cache bytes at long prefixes. Count bytes using actual dimensions and dtypes rather than percentages of layers.

~~~figure
id: fig-17.17
kind: stat-panel
title: "Hybrid invariants"
caption: "Declared mathematical and experimental boundaries; these are not measured model results."
placement: rail
anchor: failure-modes
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.17"
alt: "Declared mathematical and experimental boundaries; these are not measured model results."
spec: {"header":"HYBRID INVARIANTS","rows":[{"key":"Layer count","value":"not a byte count"},{"key":"Shared stream","value":"not shared temporal state"},{"key":"Rollback","value":"restore every component"},{"key":"Full-history cache","value":"retains length dependence"}]}
~~~

## Siblings

**DERIVED.** A homogeneous recurrent stack makes state ownership uniform but accepts a fixed-summary bottleneck throughout depth. A homogeneous attention stack preserves explicit per-layer history at a growing storage cost. A hybrid relaxes uniformity and introduces heterogeneous state management.

[Windowed attention](../ch14-attention-architectures-and-cache-representations/README.md) changes which history is explicitly retained; hybrid composition changes which layers use which temporal primitive. These are independent axes. MoE from [Chapter 16](../ch16-mixture-of-experts-architectures/README.md) changes parameter activation and can coexist with either; expert sparsity does not determine temporal memory.

## Extensions

**DERIVED.** A proposed adaptive schedule might select different mixers by input or depth, but then routing overhead, training exposure, and state consistency become additional variables. Cross-modal hybrids must specify whether each modality receives its own state, shares one state, or contributes through cross-attention. Equal vector width alone does not answer that question.

## Limitations

**DERIVED.** This accounting does not predict quality from a memory formula. A smaller cache coefficient can improve capacity while a fixed recurrent component worsens some recall tasks. Conversely, a larger state can remain poorly trained. Architecture selection requires a joint quality and resource frontier, not a single storage crossover.

## Reproducibility

Record the ordered layer schedule, all state shapes and dtypes, attention masks and windows, normalization order, branch policy, checkpoint hashes, and runtime revisions. Keep placement ablations separate from changes to widths or objectives. **UNVERIFIED:** no training, serving, or rollback benchmark is reported here.

## References

[R17.4](references.md#r174); [R17.5](references.md#r175); [R17.6](references.md#r176); [R17.7](references.md#r177). The storage ledger and transactional continuation protocol are the chapter's derived analysis, not a claim about undocumented internals of the named models.

