---
id: ms.section.13.5
entity_type: section
title: Embeddings and heads
short_title: Embeddings and heads
section: 13.5
slug: 13-5-embeddings-and-heads
parent: ms.chapter.13
prev_sibling: ms.section.13.4
next_sibling: ms.section.13.6
children: []
prerequisites: [ms.chapter.5, ms.chapter.10, ms.section.13.4]
downstream: [ms.chapter.14, ms.chapter.19, ms.chapter.21]
word_count_target: 1800
volume: 1
part: 3
chapter: 13
related: []
relations: []
axes: {lifecycle: [pretraining, inference], mechanism: [dense_architecture, parameter_allocation], feedback_setting: [], modality: [text]}
papers: [P01, P02]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core, impl.nvidia-transformer-engine]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 13.5 Embeddings and heads

## Scope

**KNOWN — chapter matrix.** This section covers tied weights, vocabulary storage, output projection, auxiliary heads, and a preview of vocabulary parallelism. Chapter 10 owns tokenizer design; this section accounts for the tensors and operations induced by a chosen vocabulary and output interface. Success requires distinguishing unique stored parameters, lookup work, projected positions, and logits retained in memory.

## Why this exists

**DERIVED.** Input embeddings and vocabulary output weights can have the same matrix shape but radically different access patterns. An input lookup retrieves selected rows. A full vocabulary projection evaluates scores for every candidate symbol. Sharing the underlying weights reduces unique storage while leaving that projection work intact.

**DERIVED.** This distinction matters when comparing small or wide-vocabulary models, but it also matters during inference. A training loss may require logits at every supervised position. A prompt prefill used only to generate the next token generally needs output logits at its final relevant position, even though the entire prompt still traverses the body. A cost model that projects every prompt position can misrepresent the implemented workload.

## Intuition

**DERIVED.** Count a parameter once by ownership and count an operation every time it executes. Weight tying merges ownership; it does not merge the input and output computations into one invocation. Two tensors with equal numerical values are not tied unless their update semantics preserve one shared parameter.

**KNOWN — upstream dependency.** The [vocabulary economics in §10.3](../../part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/10-3-vocabulary-economics.md) explains how changing vocabulary affects sequence length. Here vocabulary size and the number of projected positions must therefore be reported together.

## Formulation

> **Definition — Projected-position count.** The number of positions at which a specified output projection executes in the declared workload; it need not equal the number of positions with nonzero loss weight.

**MATHEMATICALLY-DERIVED — table storage.** For a shared input/output symbol inventory of size $V$, residual width $d$, no intervening head transformation, and optional output bias indicator $\delta_b\in\{0,1\}$,

$$
N_{\mathrm{vocab}}=
\begin{cases}
Vd+\delta_bV,&\text{one tied table},\\
2Vd+\delta_bV,&\text{independent input and output tables}.
\end{cases}
$$
*(Eq. 13.14)*

where $V$ counts physically represented vocabulary entries if padding rows are present. The logical vocabulary can be smaller. Extra head projections or distinct source/target vocabularies require additional terms.

**MATHEMATICALLY-DERIVED — projected-position cost.**

$$
F_{\mathrm{logits}}=2q_{\mathrm{logit}}dV,\qquad
M_{\mathrm{logits}}=b_{\mathrm{logit}}q_{\mathrm{logit}}V.
$$
*(Eq. 13.15)*

where $q_{\mathrm{logit}}$ is the number of positions actually projected and $b_{\mathrm{logit}}$ the bytes per materialized logit. The memory term applies only when the full logits array is retained; fused or chunked loss computation can avoid that allocation.

**MATHEMATICALLY-DERIVED — distributed log-normalizer.** Partition valid vocabulary entries into disjoint sets $\mathcal{V}_s$. For logits $z_v$ at one position,

$$
m=\max_s\max_{v\in\mathcal{V}_s}z_v,\quad
\log Z=m+\log\!\left(
\sum_s\sum_{v\in\mathcal{V}_s}e^{z_v-m}
\right),\quad
\ell=\log Z-z_y.
$$
*(Eq. 13.16)*

where $y$ is the valid target token. The formula permits a global maximum reduction, a global sum reduction, and retrieval or reduction of the target score without gathering every vocabulary logit to every rank.

~~~figure
id: fig-13.15
kind: calculator
title: Vocabulary projection and logits allocation
caption: Eq. 13.15 counts only the requested projected positions. Weight tying changes parameter ownership but does not remove either output calculation.
placement: rail
anchor: formulation
states:
  - {anchor: formulation, label: "1024 projected positions", variables: {q: 1024, d: 1024, V: 32768, b: 2}, note: "Materialized logits occupy 64 MiB in this constructed example."}
  - {anchor: mechanism, label: "One projected position", variables: {q: 1, d: 1024, V: 32768, b: 2}, note: "Operator multiplicity changes independently of weight tying."}
  - {anchor: failure-modes, label: "Inspect all projected rows", variables: {q: 1024, d: 1024, V: 32768, b: 2}, note: "Masked loss positions still cost work if their logits are computed."}
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-13.15
alt: At 1024 projected positions, width 1024, vocabulary 32768 and two-byte logits, projection costs 68,719,476,736 FLOPs and a full logits array occupies 67,108,864 bytes.
spec:
  tex: F=2q_{\mathrm{logit}}dV,\quad M=b_{\mathrm{logit}}q_{\mathrm{logit}}V
  equation: "13.15"
  inputs:
    - {symbol: q, label: projected positions, default: 1024, min: 1, max: 131072, format: integer}
    - {symbol: d, label: residual width, default: 1024, min: 64, max: 16384, format: integer}
    - {symbol: V, label: vocabulary entries, default: 32768, min: 256, max: 262144, format: integer}
    - {symbol: b, label: bytes per logit, default: 2, min: 2, max: 4, options: [2, 4], format: integer}
  outputs:
    - {symbol: F, label: projection FLOPs, formula: 2*q*d*V, format: flops}
    - {symbol: M, label: materialized logits, formula: b*q*V, format: bytes}
~~~

## Mechanism

**PAPER-REPORTED — [R13.18](references.md#r1318).** Press and Wolf study tying input and output embeddings. **DERIVED.** Under the stated equal-width interface, tying removes one $Vd$ parameter table. It also couples the gradients from input lookup and output prediction into the same parameter. This is a modeling constraint, not merely a storage serialization option.

**DERIVED.** For a table $E\in\mathbb{R}^{V\times d}$, input lookup selects rows indexed by token IDs. The output map uses $hE^\top$. A shared table receives both contributions to its update. Copying $E$ into a separate output parameter at initialization yields an untied model unless every subsequent update enforces the equality. Optimizer state must follow the same ownership semantics or storage accounting becomes incorrect.

~~~figure
id: fig-13.16
kind: diagram
title: One table with two computational roles
caption: Tied ownership shares parameter and optimizer identity; lookup and full-vocabulary projection remain distinct operations.
placement: inline
evidence: DERIVED
source: DERIVED:eq-13.14
alt: Token IDs select rows from a shared vocabulary table. The model body produces hidden states that multiply by the same table transposed, producing logits and two gradient contributions to one parameter.
spec:
  direction: LR
  nodes:
    - {id: ids, kind: tensor, label: token identifiers}
    - {id: E, kind: memory, label: shared table E, sub: "[V, d]"}
    - {id: lookup, kind: process, label: row lookup}
    - {id: body, kind: model, label: dense body}
    - {id: head, kind: process, label: project with transpose E}
    - {id: logits, kind: tensor, label: vocabulary logits}
  edges:
    - {from: ids, to: lookup}
    - {from: E, to: lookup, kind: dependency}
    - {from: lookup, to: body}
    - {from: body, to: head}
    - {from: E, to: head, kind: dependency}
    - {from: head, to: logits}
~~~

**MATHEMATICALLY-DERIVED.** For a full-position decoder forward pass with $d_a=d$, no head transform, and the matrix-only convention of §13.2, the fraction of counted body-plus-head work in the vocabulary projection is

$$
f_{\mathrm{head}}=
\frac{V}{V+L(4d+kf)+2LT}.
$$
*(Eq. 13.17)*

where $q_{\mathrm{logit}}=BT$ and activation, normalization, and softmax costs are excluded. The expression follows by dividing both numerator and denominator by $2BTd$. It does not apply unchanged when only the last prompt position is projected.

**DERIVED.** A larger vocabulary increases the output dimension but can shorten tokenized sequences. That tradeoff cannot be evaluated by changing $V$ in Eq. 13.17 while silently holding a different tokenization regime fixed. Report at least source bytes or another comparable input unit, actual token lengths, and projected positions. Per-token efficiency can improve while per-document cost worsens, or the reverse.

**DERIVED.** Auxiliary heads add both parameters and training signals. A scalar reward head, a token classifier, or an auxiliary prediction head may share the trunk while using different supervised positions. Its cost includes head parameters, invoked projections, loss computation, and any additional saved trunk activations. If it is removed at inference, separate training artifact size from deployed artifact size.

**DERIVED.** A head can contain a hidden projection, nonlinearity, normalization, and output bias before the final vocabulary matrix. Weight tying only constrains compatible endpoint dimensions; it does not imply that this intermediate machinery disappears. The head inventory must be reconstructed from the selected implementation.

**OFFICIAL-DOCUMENTATION — [R13.13](references.md#r1313).** The official NVIDIA Megatron-Core repository documents vocabulary-dimension partitioning in its embedding class. **DERIVED.** Eq. 13.16 explains an accompanying distributed-loss construction independently; the manuscript does not claim that every version executes precisely this sequence of collectives.

**DERIVED.** Vocabulary sharding partitions storage and local score computation. It introduces communication for embeddings and normalization statistics, and the exact collective depends on placement. Pad rows used for divisibility must remain excluded from the probability distribution. If their logits enter $Z$, a valid target's loss changes even though no training example uses a padded token ID.

## Algorithm

**DERIVED — vocabulary-sharded reference construction.**

~~~text
Algorithm 13.5 — Evaluate an exact vocabulary-sharded token loss
INPUT: hidden rows; partitioned output weights; valid vocabulary ranges; targets
OUTPUT: Result(loss sums and counts, invalid target or partition error)
STATE: local logits or bounded chunks; per-position reduction statistics
INVARIANT: every valid vocabulary entry contributes exactly once to normalization
1. Validate disjoint complete valid ranges and target membership.
2. Compute local projected scores; exclude physical padding rows.
3. Reduce the maximum score across all vocabulary shards.
4. Sum exponentials shifted by that maximum locally, then reduce their sums.
5. Resolve each target score from its unique owner.
6. Form log-normalizer minus target score and apply the declared target mask.
7. Reduce loss sums and target counts according to the training objective.
~~~

**DERIVED — complexity.** Local projection work is $O(q_{\mathrm{logit}}dV/p_v)$ under an even $p_v$-way vocabulary partition. Reduction payload is $O(q_{\mathrm{logit}})$ scalars per statistic per rank; network traffic and latency depend on the collective algorithm and topology. Chunked processing can bound local logits storage while preserving the same mathematical loss.

## Implementation

**DERIVED — stack placement.** PyTorch belongs to *Model / autograd framework*; Hugging Face Transformers to *Model definition / adaptation*; NVIDIA Megatron-Core to *Distributed training*. Inspect actual parameter aliasing and logical vocabulary ranges at their interfaces. NVIDIA Transformer Engine's *Kernels / numerics / collectives* layer can change execution and precision without changing the logical vocabulary [R13.14](references.md#r1314).

**DERIVED.** A correct count needs the resolved padded vocabulary, not merely the tokenizer's advertised count. A correct probability distribution needs the logical valid entries, not all physically allocated rows. Those two inventories intentionally differ. During checkpoint conversion, preserve both the sharing relation and target-to-row mapping.

## Experimental design

**PROPOSAL — no measurements reported.**

### Experiment 13.5 — Weight ownership and projected-position accounting

- **Hypothesis:** tying reduces unique parameters while leaving full-vocabulary projection arithmetic unchanged.
- **Setup:** compare tied and untied heads with identical widths and a separate vocabulary-sharding check.
- **Independent variables:** tying, vocabulary size, projected positions, and shard count.
- **Controlled variables:** tokenizer for tying comparisons, hidden inputs, output-loss convention, and precision.
- **Dataset/workload:** fixed hidden-state fixtures, valid targets at shard boundaries, and padded vocabulary rows.
- **Hardware:** record devices, interconnect, runtime, and collective implementation.
- **Metrics:** unique parameters, optimizer state, logits FLOPs, peak allocation, loss/gradient error, and latency.
- **Baselines:** unsharded full logits and explicit shared-table reference.
- **Expected result:** structural counts and mathematical losses agree under their declared controls.
- **Ablation:** allow padded logits into normalization and require the oracle to detect the error.
- **Interpretation:** separate parameter savings from output execution and communication.
- **Threats to validity:** copied rather than tied tensors and comparing different tokenizers as if only $V$ changed.

## Observations

**What the paper claims.** **PAPER-REPORTED — R13.18.** Tying is studied as a language-model design choice, not a theorem of universal quality improvement.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** One table is removed by tying, while Eq. 13.15 remains required for a full output projection.

**What we infer.** **DERIVED.** Model size, parameter ownership, and output work need separate fields.

**What remains unknown.** **UNVERIFIED.** Quality effects and distributed speedups for a chosen model require execution.

## Failure modes

~~~figure
id: fig-13.17
kind: stat-panel
title: Vocabulary work boundary
caption: Tying changes unique parameter ownership but does not remove the output projection at q executed positions.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-13.15
alt: Tying changes unique parameter ownership but does not remove the output projection at q executed positions.
spec:
  header: ACCOUNTING BOUNDARY
  rows:
    - {key: "unique tied table", value: "Vd parameters"}
    - {key: "projection work", value: "2qdV FLOPs"}
    - {key: "materialized logits", value: "bqV bytes"}
    - {key: "q", value: "executed projection positions"}
~~~

> **Failure mode — false tying.** **DERIVED.** *Symptom:* table values diverge after updates. *Cause:* equal initial copies with separate optimizer identities. *Detection:* inspect aliasing and updates. *Mitigation:* preserve shared parameter ownership.

> **Failure mode — vocabulary padding leakage.** **DERIVED.** *Symptom:* sharded loss differs from a valid-vocabulary oracle. *Cause:* padded rows enter the softmax. *Detection:* compare Eq. 13.16 on boundary targets. *Mitigation:* exclude invalid rows explicitly.

## Siblings

**DERIVED.** Tying changes parameter ownership; low-rank heads change parameterization; vocabulary sharding changes placement; chunked cross-entropy changes intermediate allocation. These interventions must not be treated as interchangeable compression methods. [§13.1](13-1-architectural-families.md) owns task-head placement and [§13.6](13-6-architectural-ablations.md) owns their comparison protocol.

## Extensions

**DERIVED.** Separate modality vocabularies can require distinct tables and output masks. Auxiliary objectives may need logits at positions that an inference-only benchmark omits. A deployment comparison should include only heads actually used by the measured service while retaining training costs separately.

## Limitations

**DERIVED.** The formulas do not model sampled or approximate softmax, adaptive vocabularies, or nonstandard output parameterizations. Those require explicit new objectives or approximation contracts. The distributed construction previews communication without replacing the later parallel-training treatment.

## Reproducibility

**DERIVED — required record.** Retain logical and physical vocabulary sizes, row mapping, tying identities, head transforms, output bias, projected-position policy, logits dtype, chunking, sharding, padding mask, and loss reductions.

## References

[R13.18 — weight tying](references.md#r1318); [R13.9 — task-head interfaces](references.md#r139); [R13.10 — model configuration](references.md#r1310); [R13.13 — vocabulary partitioning](references.md#r1313); [R13.14 — execution layer](references.md#r1314).
