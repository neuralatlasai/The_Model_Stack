---
id: ms.section.15.3
entity_type: section
title: Long-sequence training
short_title: Long-sequence training
section: 15.3
slug: 15-3-long-sequence-training
parent: ms.chapter.15
prev_sibling: ms.section.15.2
next_sibling: ms.section.15.4
children: []
prerequisites: [ms.chapter.10, ms.chapter.13, ms.chapter.14, ms.section.15.2]
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

# 15.3 — Long-sequence training

## Scope

Long-sequence training couples data construction, loss weighting, numerical behavior, and distributed execution. This section specifies length curricula, packing boundaries, stable position computation, sparse-pattern constraints, and the role of context parallelism. The baseline is a fixed checkpoint or architecture with an explicit position contract. The objective is a reproducible training distribution and execution plan, not simply the largest sequence that fits. Full distributed-kernel design belongs to Volume II; here the focus is preserving the intended learning problem.

## Why this exists

**DERIVED.** Increasing sequence length changes more than per-example memory. Under a fixed token budget, it reduces the number of independent sequences per step, changes the fraction of padding, changes the distribution of token distances, and alters attention work. A length curriculum therefore changes both optimization exposure and systems utilization.

Packing can recover otherwise wasted capacity, but only if its semantics are explicit. Independent examples packed into one buffer should not become one coherent document through accidental attention edges. Conversely, a task requiring cross-document evidence must retain those intended edges. The physical buffer cannot determine the learning objective.

**OFFICIAL-DOCUMENTATION.** NVIDIA Megatron-Core distinguishes context parallelism, which partitions sequence-related computation and activations, from the narrower sequence-parallel treatment of selected operations [R15.11]. That distinction matters because attention still needs information beyond each local shard.

## Intuition

**MATHEMATICALLY-DERIVED.** Holding tokens per step constant does not hold dense attention work constant. Doubling length while halving the sequence count leaves tokenwise projection work approximately unchanged at fixed dimensions, but increases the number of query–key pairs. A curriculum can therefore change compute per token substantially even without changing the nominal token budget.

Longer examples also change which dependencies are trainable. If every packed document is isolated, its maximum dependency distance is its own length rather than the packed-buffer length. If the target depends only on nearby text, a long input need not reward distant evidence access. Data construction and attention visibility jointly define exposure.

> **Definition — Length exposure ledger.** A training record that accounts for valid tokens, independent sequences, supervised targets, and intended dependency distances by sequence-length regime and curriculum stage.

## Formulation

**MATHEMATICALLY-DERIVED.** Consider \(B\) equal-length causal sequences of \(T\) valid tokens, with \(M=BT\) total tokens and self-attention including the diagonal. The number of permitted query–key pairs per head and layer is

$$
N_{\mathrm{pairs}}=B\frac{T(T+1)}{2}
=\frac{M(T+1)}{2}.
$$
*(Eq. 15.8)*

At fixed \(M\), pair count grows approximately linearly with \(T\). This counts permitted interactions, not exact executed FLOPs: a backend may execute padded tiles, recompute intermediates, or use a different sparsity pattern.

For \(k\) independently packed documents of lengths \(n_1,\ldots,n_k\), with \(T=\sum_i n_i\), the difference between one concatenated causal sequence and block-isolated causal attention is

$$
N_{\mathrm{concat}}=\frac{T(T+1)}{2},\quad
N_{\mathrm{isolated}}=\sum_{i=1}^{k}\frac{n_i(n_i+1)}{2},\quad
N_{\mathrm{concat}}-N_{\mathrm{isolated}}=\sum_{i<j}n_i n_j.
$$
*(Eq. 15.9)*

The removed pairs are precisely the cross-document causal interactions. Removing them changes the task when those interactions carry required evidence.

For distributed valid-token loss, let rank \(r\) own valid targets \(\mathcal V_r\), count \(v_r\), and token losses \(\ell_{r,t}\). The global token mean is

$$
\mathcal L=
\frac{\sum_{r=1}^{P}\sum_{t\in\mathcal V_r}\ell_{r,t}}
{\sum_{r=1}^{P}v_r}.
$$
*(Eq. 15.10)*

An unweighted mean of rank-local means equals this only when counts are equal or by coincidence. All-empty batches require an explicit skip or error policy because the denominator is zero.

~~~figure
id: fig-15.9
kind: calculator
title: Pair count at a fixed token budget
caption: "Illustrative causal pair counts with 65536 valid tokens per step; these are interaction counts, not measured kernel FLOPs or throughput."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-15.8
alt: "Increasing sequence length at fixed total tokens decreases sequence count and increases permitted attention pairs."
spec:
  tex: N_{\mathrm{pairs}}=M(T+1)/2
  equation: "15.8"
  inputs:
    - {symbol: M, label: tokens per step, default: 65536, min: 65536, max: 262144, scale: log2, format: tokens}
    - {symbol: T, label: sequence length, default: 4096, min: 1024, max: 65536, scale: log2, format: tokens}
  outputs:
    - {symbol: B, label: sequences per step, formula: M/T, format: fixed2}
    - {symbol: pairs, label: causal pairs per head, formula: M*(T+1)/2, format: integer}
states:
  - {anchor: formulation, label: Shorter stage, variables: {M: 65536, T: 4096}, note: "The fixture has sixteen sequences per step."}
  - {anchor: mechanism, label: Longer stage, variables: {M: 65536, T: 16384}, note: "The token count stays fixed while attention work grows."}
  - {anchor: failure-modes, label: One long sequence, variables: {M: 65536, T: 65536}, note: "Equal tokens do not imply equal independent examples or attention work."}
~~~

## Mechanism

**DERIVED.** A curriculum is a schedule over length distributions and optimization exposure. Specify how stages are selected, whether shorter examples remain present, and whether the learning-rate schedule is indexed by steps or valid tokens. Changing tokens per optimizer step while retaining a step-based schedule changes the number of tokens seen at each learning rate.

Loss weighting determines another distribution. A mean over sequences weights a short sequence and a long sequence equally; a mean over tokens weights the longer sequence more heavily. A mixture sampled by sequence count is not the same mixture measured by token count. Report both, particularly when assessing shorter-context preservation after adaptation.

Packing requires at least three coordinated structures: document membership, logical positions, and target eligibility. Resetting positions does not isolate attention. Masking attention does not automatically suppress prediction of the first token of a new independent document from the previous document's final state. The shifted target construction must agree with boundary semantics.

~~~figure
id: fig-15.10
kind: diagram
title: Packed training preserves explicit boundaries
caption: "Physical packing combines storage; document membership independently governs positions, attention visibility, and loss eligibility."
placement: inline
evidence: DERIVED
source: DERIVED:eq-15.9
alt: "A document ledger feeds packed storage, logical positions, attention masks, and target masks. These jointly determine the training loss."
spec:
  direction: LR
  nodes:
    - {id: docs, kind: dataset, label: Document and boundary ledger}
    - {id: buffer, kind: tensor, label: Packed token buffer}
    - {id: positions, kind: tensor, label: Logical position identifiers}
    - {id: visibility, kind: boundary, label: Allowed attention pairs}
    - {id: targets, kind: tensor, label: Eligible prediction targets}
    - {id: loss, kind: objective, label: Globally normalized loss}
  edges:
    - {from: docs, to: buffer, kind: flow}
    - {from: docs, to: positions, kind: dependency}
    - {from: docs, to: visibility, kind: dependency}
    - {from: docs, to: targets, kind: dependency}
    - {from: buffer, to: loss, kind: flow}
    - {from: positions, to: loss, kind: dependency}
    - {from: visibility, to: loss, kind: dependency}
    - {from: targets, to: loss, kind: dependency}
~~~

**OFFICIAL-DOCUMENTATION.** In context parallelism, attention must obtain the required key/value information across sequence partitions [R15.11]. **DERIVED.** Logical positions remain global within each intended sequence. A rank boundary is not a document boundary, and rank-local position resets would change the operator.

Partitioning tokens does not imply that weights are partitioned across the context-parallel group. Account separately for model parameters, optimizer state, saved activations, transient attention buffers, and communication buffers. The per-rank memory reduction depends on which of those terms are actually sharded.

Numerical stability also has multiple boundaries. Stable softmax reduction is necessary but does not repair an inaccurate rotary phase. Accumulating loss in adequate precision does not repair corrupted logits. Inspect phase construction, attention accumulation, normalization, and gradient reduction separately. Long sequences can expose an error that short fixtures leave invisible.

Sparse patterns reduce evaluated interactions only when their implementation skips the corresponding work. Their learning consequence is a changed information path: evidence outside a local window may require intermediate layers or designated global connections. Use Chapter 14's pattern analysis instead of treating sparse attention as an equivalent dense operator.

## Algorithm

**DERIVED — finite curriculum with explicit boundaries.**

~~~text
Algorithm 15.3 — Execute a length-exposure-controlled training stage
INPUT: finite stage schedule, eligible documents, token budget, packing policy,
       position contract, parallel layout, loss-normalization specification
OUTPUT: checkpoints and length exposure ledger
STATE: remaining valid-token budget and optimizer state
INVARIANT: target eligibility and attention visibility preserve document semantics
1. Select the next predeclared length regime and sample eligible documents.
2. Pack within a bounded buffer while retaining document identifiers and offsets.
3. Construct positions, attention boundaries, and shifted-target eligibility.
4. Partition the sequence while preserving global logical coordinates.
5. Compute local valid-target loss sums and counts.
6. Reduce counts and normalize gradients consistently with the reducer semantics.
7. Update parameters only when the global valid count is positive and checks pass.
8. Debit actual valid tokens; record exposure and resource counters.
9. Stop at the finite stage budget, save state, and evaluate held-out length cells.
~~~

If a reducer averages gradients across \(P\) ranks, local loss sums require a factor \(P/\sum_r v_r\) to reproduce Eq. 15.10, under that stated reducer convention. A summing reducer requires a different factor. Gradient accumulation adds another counting boundary; normalize over the intended complete optimizer batch.

## Implementation

**DERIVED.** PyTorch, **Model / autograd framework**, supplies loss and gradient operations; record the actual distributed reduction semantics rather than assuming them. Hugging Face Transformers, **Model definition / adaptation**, supplies checkpoint-specific attention and positional configuration. NVIDIA Megatron-Core, **Distributed training**, supplies the context-parallel execution mechanisms documented in [R15.11].

**OFFICIAL-DOCUMENTATION.** PyTorch's inspected scaled-dot-product attention documentation describes explicit masking and dropout behavior [R15.12]. A correctness reference must control dropout, mask polarity, and causal alignment deliberately. A generic causal flag is insufficient evidence that packed-document boundaries were preserved.

**DERIVED.** Record interconnect topology and the communication algorithm before claiming scaling efficiency. Communication can overlap with computation, but the attainable overlap depends on message size, scheduling, and hardware. This chapter supplies no measured throughput, energy, or monetary estimate.

## Experimental design

**PROPOSAL — training results are not available in this manuscript.**

### Experiment 15.3 — Exposure versus physical sequence length

- **Hypothesis:** Equal token budgets with different length and packing policies expose different dependency distributions and attention costs.
- **Setup:** Train compatible candidates under matched valid-token budgets and predeclared optimizer semantics.
- **Independent variables:** Curriculum, packing boundaries, sequence length, context-parallel degree, and dense versus supported sparse patterns.
- **Controlled variables:** Data eligibility, tokenizer, initialization, total supervised tokens, and test split.
- **Dataset/workload:** Coherent long documents, independent packed examples, and explicit multi-document dependency tasks.
- **Hardware:** Record devices, topology, precision, kernels, runtime revisions, and memory measurement boundary.
- **Metrics:** Loss by length, dependency-conditioned task success, valid tokens, attention pairs, peak memory, communication bytes, and measured step time.
- **Baselines:** Short coherent training and long packed-independent training with the same valid-token budget.
- **Expected result:** Physical length alone does not predict dependency exposure or task improvement.
- **Ablation:** Reset positions without changing masks, then change masks without changing positions, using controlled fixtures before training.
- **Interpretation:** Attribute improvements only after separating exposure, objective weighting, and execution changes.
- **Threats to validity:** Different effective batch statistics, duplicated documents, hidden target leakage, and unequal compute despite equal tokens.

## Observations

**What the paper claims — PAPER-REPORTED.** Extension procedures may use adaptation or mixed-window training; their reported gains belong to those procedures and data regimes [R15.3, R15.5].

**What the evidence shows — OFFICIAL-DOCUMENTATION.** Context parallelism requires cross-partition attention information and is distinct from limited sequence-parallel operations [R15.11].

**What we infer — DERIVED.** A length exposure ledger is necessary to interpret a purported long-sequence training improvement.

**What remains unknown — UNVERIFIED.** The optimal curriculum and achievable distributed efficiency require workload-specific measurements.

## Failure modes

**DERIVED.** Symptoms include lower training loss from cross-document leakage, unequal rank weighting, phase errors that appear only at larger positions, and memory estimates that divide replicated weights by context-parallel degree.

~~~figure
id: fig-15.11
kind: stat-panel
title: Long-sequence accounting boundaries
caption: "The same token total can conceal different learning objectives, interaction counts, and replicated state."
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-15.10
alt: "Check valid targets, independent examples, allowed interactions, and replicated state separately."
spec:
  header: Required ledger
  rows:
    - {key: Objective, value: "Global valid-target sum and count"}
    - {key: Exposure, value: "Tokens and sequences by length"}
    - {key: Visibility, value: "Preserve packed and sharded boundaries"}
    - {key: Resources, value: "Count replicated state on every rank"}
~~~

## Siblings

**DERIVED.** Data parallelism partitions examples; context parallelism partitions sequence work; tensor parallelism partitions selected tensor operations. Their combinations require explicit ownership maps. Position interpolation changes geometry, whereas packing changes the training layout and potentially the task boundaries.

## Extensions

**DERIVED.** Video and interleaved modality sequences need exposure records in both token units and original temporal or spatial units. Agent trajectories need tool and episode boundaries. Equal token counts across modalities do not imply equal duration, information density, or supervised events.

## Limitations

**DERIVED.** Pair counts are mathematical workload descriptors, not execution-time predictors. Context-parallel memory reductions are implementation-dependent. Training beyond the lengths tested here would remain a new operating regime even if the same curriculum code accepts it.

## Reproducibility

Preserve curriculum schedules, source hashes, packing manifests, valid-target counts, rank assignments, gradient-reduction conventions, precision boundaries, and exact checkpoint configurations. Report interrupted and rejected steps separately from successful updates. Keep the exposure ledger alongside the checkpoint.

## References

[R15.3](references.md#r153); [R15.5](references.md#r155); [R15.11](references.md#r1511); [R15.12](references.md#r1512).
