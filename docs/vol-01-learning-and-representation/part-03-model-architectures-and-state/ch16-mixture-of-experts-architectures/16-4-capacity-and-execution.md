---
id: ms.section.16.4
entity_type: section
title: Capacity and execution
short_title: Capacity and execution
section: 16.4
slug: 16-4-capacity-and-execution
parent: ms.chapter.16
prev_sibling: ms.section.16.3
next_sibling: ms.section.16.5
children: []
prerequisites: [ms.chapter.13, ms.chapter.14, ms.section.16.3]
downstream: [ms.chapter.27, ms.chapter.29, ms.chapter.42]
word_count_target: 1900
volume: 1
part: 3
chapter: 16
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [mixture_of_experts, conditional_computation], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P10, P13]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 16.4 — Capacity and execution

## Scope

Capacity and execution determine how logical expert assignments become physical rows, matrix operations, and combined outputs. This section covers overflow, token dropping, padding, dropless execution, grouped matrix multiplication, and permutation. The baseline is a routing ledger produced before capacity handling. Success requires preserving every intended assignment or explicitly recording how the operator changed, then accounting for useful work, padded work, and temporary state.

## Why this exists

**DERIVED.** Routers produce irregular expert batch sizes. Hardware and communication paths often prefer regular buffers and sufficiently large matrix operations. Fixed capacity makes allocation predictable, but it may discard assignments or compute empty slots. Variable-sized execution preserves demand more directly but requires dynamic scheduling and capacity management.

The central constraint is the difference between demand and representation. An expert with many assigned tokens may exceed a fixed slot count even though other experts have unused slots. Aggregate free capacity does not imply that the overloaded expert can use it under a fixed per-expert layout.

**PAPER-REPORTED.** MegaBlocks addresses the dropping-versus-padding trade-off through a block-sparse formulation for MoE execution [R16.2]. **DERIVED.** This is an execution approach, not a guarantee that irregular work has no padding, metadata, or scheduling overhead.

## Intuition

**DERIVED.** A routing assignment is an edge from a token to an expert. Top-k routing creates several such edges per token. Capacity handling can remove edges without removing the token itself from the residual stream. Therefore distinguish dropped assignments, tokens missing at least one branch, and tokens losing every routed branch.

Dropless execution preserves eligible assignments under its supported resource regime. It does not imply unbounded memory or perfectly balanced work. A runtime can still reject or fail a request that exceeds resource limits. Likewise, grouped GEMM batches matrix operations; it does not by itself define the routing or overflow policy.

> **Definition — Assignment preservation contract.** The invariant specifying which routed token–expert edges must survive capacity handling, permutation, expert computation, and inverse combination.

## Formulation

**MATHEMATICALLY-DERIVED.** Let \(M>0\) tokens each select \(k\) experts, giving \(A=Mk\) assignments. Let \(n_e\) be pre-capacity expert counts with \(\sum_e n_e=A\). For an explicitly defined generalized assignment-based capacity factor \(c>0\),

$$
C=\left\lceil\frac{cA}{E}\right\rceil,\qquad
D=\sum_{e=1}^{E}\max(0,n_e-C),\qquad
r_{\mathrm{assignment\ drop}}=\frac{D}{A}.
$$
*(Eq. 16.11)*

This is the chapter's top-k assignment convention. A source using tokens per expert under top-one routing or a different routing-group size may define its capacity factor differently. Record the denominator before comparing factors.

For fixed-capacity padded execution, accepted assignments number \(A-D\), whereas reserved slots number \(EC\). For a dropless row-block representation with block size \(b\ge1\),

$$
\widetilde n_e=b\left\lceil\frac{n_e}{b}\right\rceil,\qquad
0\le\sum_e(\widetilde n_e-n_e)\le E(b-1).
$$
*(Eq. 16.12)*

The bound follows from integer rounding per expert; zero-load experts contribute no rounded rows under this convention. It models row padding only, not all block-sparse metadata or feature-dimension alignment.

Let assignment \(a\) retain source token \(t(a)\), expert \(e(a)\), and combination coefficient \(g_a\). With accepted assignment set \(\mathcal A_{\mathrm{keep}}\),

$$
y_t=\sum_{\substack{a\in\mathcal A_{\mathrm{keep}}\\t(a)=t}}
g_a f_{e(a)}(x_t).
$$
*(Eq. 16.13)*

Changing the accepted set changes this operator. Renormalizing surviving coefficients is another intervention and must be stated explicitly. Shared and residual branches remain governed by their separate contracts.


~~~figure
id: fig-16.12
kind: calculator
title: "Capacity does not eliminate concentrated demand"
caption: "Illustrative loads 8, 4, 2, 2 across four experts and sixteen assignments. Reserved slots can be sufficient in aggregate while one expert still overflows."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.11"
alt: "Illustrative loads 8, 4, 2, 2 across four experts and sixteen assignments. Reserved slots can be sufficient in aggregate while one expert still overflows."
spec: {"tex":"C=\\lceil4c\\rceil,\\quad D=\\sum_e\\max(0,n_e-C)","equation":"16.11","inputs":[{"symbol":"c","label":"capacity factor","default":1,"min":0.5,"max":2,"format":"fixed2"}],"outputs":[{"symbol":"capacity","label":"slots per expert","formula":"ceil(4*c)","format":"integer"},{"symbol":"drops","label":"dropped assignments","formula":"max(0,8-ceil(4*c))+max(0,4-ceil(4*c))+2*max(0,2-ceil(4*c))","format":"integer"},{"symbol":"reserved","label":"reserved slots","formula":"4*ceil(4*c)","format":"integer"}]}
states: [{"anchor":"formulation","label":"Mean capacity","variables":{"c":1},"note":"Sixteen slots still drop four assignments in this skewed fixture."},{"anchor":"mechanism","label":"Additional capacity","variables":{"c":1.5},"note":"More slots reduce overflow but increase reservation."},{"anchor":"failure-modes","label":"No overflow fixture","variables":{"c":2},"note":"Avoiding drops reserves twice the logical assignments here."}]
~~~


## Mechanism

**DERIVED.** Capacity decisions need a deterministic policy when they remove assignments. Keeping the first arrivals, keeping highest scores, or using a randomized policy selects different examples for expert learning. Arrival order can be influenced by rank layout or packing, so a systems detail can become a statistical bias.

Record dropped gate mass as well as dropped edge count. Losing a small-weight branch and losing the dominant branch have equal assignment-count cost but different immediate effects on the combined output. No universal quality loss follows from either statistic; both describe the intervention more faithfully than a single “drop rate.”

Padding fills execution shapes, not training examples. Empty slots must not contribute to task loss, balancing counts, or returned token outputs. A mask that is correct for expert computation can still be wrong for diagnostics if padded rows are counted as routed demand.

Dropless execution replaces fixed admission limits with an execution layout that can represent the realized counts within resource bounds. The total number of logical assignments remains \(A\), but destination buffers and expert batch sizes vary. Block rounding or grouped operations can improve scheduling opportunities without changing the logical set.


~~~figure
id: fig-16.13
kind: diagram
title: "Assignment-preserving expert execution"
caption: "Every accepted token-expert edge carries identity through grouping and returns by weighted accumulation; padding never becomes a real assignment."
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.13"
alt: "Every accepted token-expert edge carries identity through grouping and returns by weighted accumulation; padding never becomes a real assignment."
spec: {"direction":"LR","nodes":[{"id":"ledger","kind":"dataset","label":"Pre-capacity assignments"},{"id":"capacity","kind":"process","label":"Capacity decision"},{"id":"group","kind":"tensor","label":"Expert-major rows and identifiers"},{"id":"gemm","kind":"process","label":"Expert matrix operations"},{"id":"combine","kind":"process","label":"Weighted scatter-add"},{"id":"drops","kind":"metric","label":"Rejected assignments and mass"}],"edges":[{"from":"ledger","to":"capacity","kind":"flow"},{"from":"capacity","to":"group","kind":"flow"},{"from":"capacity","to":"drops","kind":"flow"},{"from":"group","to":"gemm","kind":"flow"},{"from":"gemm","to":"combine","kind":"flow"}]}
~~~


Permutation groups rows by expert. Each row must carry enough identity to return its output to the correct token and selected branch. A top-k token can appear several times in the expert input representation, so the reverse operation is weighted accumulation rather than a simple one-to-one permutation inverse.

The backward path has the same identity obligation. Gradients from every surviving branch must accumulate into the original token representation. Expert-weight gradients aggregate over the rows assigned to that expert. A reference that only compares forward shapes cannot detect duplicate or missing gradient contributions.

Grouped GEMM executes multiple expert matrix products through a grouped interface or scheduler. Its benefit depends on group sizes, matrix shapes, dtype, and implementation. Many tiny expert groups may remain inefficient. Fusing permutation or combining operations can reduce memory traffic, but correctness still requires the assignment-preservation contract.

Temporary memory includes copied token rows, expert intermediates, output rows, indices, offsets, and communication buffers. Logical dispatch input payload alone is approximately \(Adb_a\) bytes for width \(d\) and \(b_a\) bytes per activation, before alignment and replication. Activation byte width and Eq. 16.12's row-block size have different units. Retain both fields explicitly rather than combining them into one padding multiplier. Peak allocation additionally depends on whether input, intermediate, and output buffers coexist or can be safely reused.

## Algorithm

**DERIVED — stable counting-based dispatch reference.**

~~~text
Algorithm 16.4 — Preserve assignments through expert-major execution
INPUT: bounded assignment records, token matrix, expert functions,
       capacity policy, coefficient policy, output accumulation precision
OUTPUT: token outputs, accepted/dropped ledger, allocation counts
STATE: expert counts, prefix offsets, expert-major rows, inverse identifiers
INVARIANT: each accepted assignment appears exactly once before combination
1. Validate token and expert indices and count pre-capacity assignments.
2. Apply the declared capacity policy and retain rejection reasons.
3. Count accepted rows per expert and compute checked prefix offsets.
4. Place each accepted record in its expert-major segment.
5. Gather token rows and retain token, branch, and coefficient identifiers.
6. Execute expert operations using the declared padding or variable-row layout.
7. Exclude padding and scatter-add weighted outputs by original token identifier.
8. Verify row conservation, assignment multiplicity, and reference output.
9. Report useful rows, padded rows, drops, and temporary-buffer capacity.
~~~

Counting and prefix offsets cost \(O(A+E)\); feature gathering and scattering cost \(O(Ad)\). This avoids comparison sorting when expert identifiers occupy a known bounded integer range. Checked offsets and preallocation prevent overflow or unbounded writes. Parallel stable placement needs a verified ordering strategy; the reference does not assume atomics alone preserve order.

## Implementation

**OFFICIAL-DOCUMENTATION.** NVIDIA Megatron-Core, **Distributed training**, documents dropless MoE, grouped GEMM, and token permutation options [R16.4]. **DERIVED.** Inspect the installed revision and resolved execution path; a configuration flag is not proof that the intended kernel ran.

PyTorch, **Model / autograd framework**, provides a bounded gather/scatter reference and gradient checks. Hugging Face Transformers, **Model definition / adaptation**, supplies checkpoint-specific model semantics [R16.5]. Preserve those semantics when translating into a different execution backend.

MegaBlocks is used as a research mechanism through the reference stack's arXiv discovery route [R16.2]. It is not asserted as an additional listed §4 system or as a tested installation. Its paper motivates the execution comparison; the chapter's row-rounding formula is an independent simplified accounting model.

Never benchmark a capacity configuration without reporting which assignments survived. A faster configuration that drops difficult or expensive work changes the quality workload. Record the token order and drop policy to make that change visible.

## Experimental design

**PROPOSAL — execution and quality results remain unmeasured.**

### Experiment 16.4 — Dropping, padding, and assignment preservation

- **Hypothesis:** Capacity and layout choices trade resource regularity against assignment preservation and overhead.
- **Setup:** Replay identical routing traces through bounded reference, fixed-capacity, and supported dropless paths.
- **Independent variables:** Capacity factor, row-block size, drop policy, expert-load skew, and grouped execution.
- **Controlled variables:** Token representations, experts, selected indices, coefficients, precision, and output objective.
- **Dataset/workload:** Balanced, skewed, zero-load, and near-capacity synthetic traces plus held-out real routing traces.
- **Hardware:** Record device, kernel revision, dtype, expert shapes, and measurement boundaries.
- **Metrics:** Forward/gradient residuals, dropped assignments and mass, padded rows, temporary bytes, latency, and task quality.
- **Baselines:** Unbounded-by-policy but resource-bounded reference preserving all assignments.
- **Expected result:** Preserving paths match the reference within tolerance; dropping paths disclose the changed operator.
- **Ablation:** Disable padding, alter admission order, or remove inverse identifiers in a negative correctness control.
- **Interpretation:** Separate kernel efficiency from savings obtained by discarding work.
- **Threats to validity:** Different traces, hidden padding, asynchronous timing, and aggregate drop metrics that conceal token-level harm.

## Observations

**What the paper claims — PAPER-REPORTED.** MegaBlocks develops a block-sparse alternative to the conventional dropping/padding trade-off [R16.2].

**What the evidence shows — MATHEMATICALLY-DERIVED.** Fixed capacity, assignment drops, and block-rounded rows have different counts.

**What we infer — DERIVED.** An execution comparison is incomplete without assignment conservation and output/gradient validation.

**What remains unknown — UNVERIFIED.** Which layout is faster or more memory-efficient for a specific workload requires measurement.

## Failure modes

**DERIVED.** Failures include overwriting rather than accumulating top-k outputs, counting padding as data, losing inverse identifiers, and silently renormalizing after drops.


~~~figure
id: fig-16.14
kind: stat-panel
title: "Execution conservation checks"
caption: "Check these independent boundaries before interpreting an MoE quality or resource claim."
placement: rail
anchor: failure-modes
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.13"
alt: "Check these independent boundaries before interpreting an MoE quality or resource claim."
spec: {"header":"Required distinctions","rows":[{"key":"Demand","value":"Pre-capacity assignment count"},{"key":"Accepted","value":"Every retained edge appears once"},{"key":"Padding","value":"No padded row enters outputs or loss"},{"key":"Inverse","value":"Accumulate all surviving branches"}]}
~~~


An empty expert segment is valid under many routing contracts. The implementation must handle zero rows without inventing a dummy assignment that enters the loss or load statistics. A completely empty input batch needs a separate explicit no-work policy.

## Siblings

**DERIVED.** Fixed-capacity padding, capacity dropping, dropless grouped execution, and block-sparse execution solve different layout constraints. They can share a router while differing in physical work and, when dropping occurs, in the mathematical operator.

## Extensions

**DERIVED.** Heterogeneous experts need separate shape groups. Low-precision paths may require alignment padding in multiple dimensions. Sequence-level routing can make segments more regular but changes granularity and must be evaluated as an architectural intervention.

## Limitations

**DERIVED.** Row-rounding bounds omit feature alignment, workspace, and communication replication. Dropless is conditional on available resources. No equation here predicts kernel launch cost or end-to-end latency.

## Reproducibility

Archive pre-capacity assignments, accepted sets, coefficients, offsets, drop reasons, padding policy, kernel revision, and forward/backward reference residuals. Preserve raw timing and memory boundaries separately from analytical counts.

## References

[R16.2](references.md#r162); [R16.4](references.md#r164); [R16.5](references.md#r165).
