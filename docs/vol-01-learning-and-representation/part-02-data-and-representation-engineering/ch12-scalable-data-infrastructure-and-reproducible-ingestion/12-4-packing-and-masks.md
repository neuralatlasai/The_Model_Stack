---
id: ms.section.12.4
entity_type: section
title: Packing and masks
short_title: Packing and masks
section: 12.4
slug: 12-4-packing-and-masks
parent: ms.chapter.12
prev_sibling: ms.section.12.3
next_sibling: ms.section.12.5
children: []
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.section.12.3]
downstream: [ms.chapter.19, ms.chapter.30]
word_count_target: 1800
volume: 1
part: 2
chapter: 12
related: []
relations: []
axes: {lifecycle: [data, pretraining], mechanism: [data_ingestion, reproducibility], feedback_setting: [], modality: [text, code]}
papers: [P05]
implementations: [impl.pytorch, impl.nvidia-megatron-core, impl.torchtitan, impl.mosaicml-llm-foundry]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-24
editorial_status: manuscript_draft
---

# 12.4 Packing and masks

## Scope

**KNOWN — chapter matrix.** This section owns document packing, block-diagonal attention, EOS boundaries, truncation, and token-loss accounting. The probability objective is defined in Chapter 04; here the question is whether changing physical layout preserves that objective. Success requires a token-level equivalence argument and an auditable mask trace. A larger count of occupied tensor slots is insufficient if the transformation changes conditioning, drops supervision, or changes normalization.

## Why this exists

**DERIVED.** Variable-length examples create a distinction between allocated token slots and supervised targets. Padding consumes capacity without necessarily contributing loss. Concatenation can use those slots, but an ordinary causal mask allows later examples to condition on earlier examples in the same row. That is a different conditional distribution unless cross-document conditioning was intended.

**DERIVED.** The subtle failure is not malformed tensors; it is a plausible loss computed on the wrong target/context pairs. Packing must therefore bind together segment boundaries, position indices, attention permissions, target shifts, and loss masks. Validating each array's shape separately cannot establish their joint meaning.

## Intuition

**DERIVED.** An EOS token is a learned symbol. An attention boundary is a restriction on accessible keys. A loss boundary chooses which next-token targets contribute to optimization. Those three operations can coincide at a document end, but none implies the others.

> **Definition — objective-preserving packing.** A layout transformation that retains each declared supervised target, its admissible conditioning context, its positional interpretation, and its weight in the optimization objective.

**DERIVED.** This definition permits numerical differences from kernel execution only when the comparison explicitly uses a numerical tolerance. It does not permit missing tokens to be dismissed as numerical error.

## Formulation

**MATHEMATICALLY-DERIVED — segment-local causality.** Let $s_i$ identify the segment at valid token position $i$, and $v_i$ indicate whether position $i$ is real rather than padding. Define permitted attention by

$$
A_{ij}=v_i v_j\,\mathbf{1}[s_i=s_j]\,\mathbf{1}[j\le i].
$$
*(Eq. 12.8)*

where $A_{ij}=1$ permits query $i$ to attend key $j$. The additive softmax mask is zero on permitted entries and negative infinity elsewhere for valid queries. Padding queries need a backend-safe treatment: an all-negative-infinity row can produce undefined normalization.

**MATHEMATICALLY-DERIVED — physical occupancy.**

$$
u_{\mathrm{slots}}=\frac{\sum_{k=1}^{n_{\mathrm{seg}}}\ell_k}{BT},
\qquad
u_{\mathrm{targets}}=\frac{\sum_{b'=1}^{B}\sum_{t=1}^{T}m_{b't}}{BT}.
$$
*(Eq. 12.9)*

where $\ell_k$ is the number of stored tokens in segment $k$, $B$ is physical rows, $T$ is row width, and $m_{b't}$ is the target-loss mask. Both ratios require $BT>0$. Occupancy and supervision differ whenever prompts, special positions, or boundaries are masked.

**MATHEMATICALLY-DERIVED — interaction count.** Under causal attention within each segment, the admitted pair count is

$$
n_{\mathrm{pairs}}=\sum_k\frac{\ell_k(\ell_k+1)}{2}.
$$
*(Eq. 12.10)*

where $\ell_k$ includes every token participating in segment attention. This counts permitted interactions; a dense masked kernel can still allocate or compute a full matrix.

~~~figure
id: fig-12.12
kind: calculator
title: Packing occupancy and supervision
caption: Eq. 12.9 distinguishes stored tokens from supervised targets. The illustrative eight-slot row stores eight tokens but trains on six transitions.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-12.9
alt: Two four-token segments fill eight slots. Excluding each segment's first unconditioned token leaves six supervised transitions, or 75 percent target occupancy.
spec:
  tex: u_{\mathrm{slots}}=n_{\mathrm{stored}}/(BT),\quad u_{\mathrm{targets}}=n_{\mathrm{target}}/(BT)
  equation: "12.9"
  inputs:
    - {symbol: slots, label: allocated slots, default: 8, min: 1, max: 131072, format: integer}
    - {symbol: stored, label: stored tokens, default: 8, min: 0, max: 131072, format: integer}
    - {symbol: targets, label: supervised targets, default: 6, min: 0, max: 131072, format: integer}
  outputs:
    - {symbol: us, label: stored per slot, formula: stored/slots, format: fixed3}
    - {symbol: ut, label: targets per slot, formula: targets/slots, format: fixed3}
~~~

**DERIVED.** The instrument exposes ratios rather than silently clipping inconsistent inputs. Values above one identify an invalid configuration: enforce $0\le n_{\mathrm{target}}\le n_{\mathrm{stored}}\le BT$ in an actual packer.

## Mechanism

**DERIVED — hand-audited example.** Consider two independent four-token documents: \`[a0,a1,a2,EOS]\` and \`[b0,b1,b2,EOS]\`. Their concatenation occupies eight positions. With no BOS token, the first document contributes transitions $a0\to a1$, $a1\to a2$, and $a2\to EOS$; the second contributes the analogous three. The transition $EOS\to b0$ must not contribute under this specified independent-document objective.

~~~figure
id: fig-12.13
kind: matrix
title: Independent causal segments
caption: Eq. 12.8 admits only within-document causal pairs. A generic block-diagonal matrix would also admit future tokens inside each block.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-12.8
alt: An eight by eight mask contains two lower-triangular four by four blocks. Cross-document pairs and future positions are excluded; twenty pairs remain.
spec:
  rows: 8
  cols: 8
  pattern: explicit
  rowLabel: query token
  colLabel: key token
  cells:
    - [1, 0, 0, 0, 0, 0, 0, 0]
    - [1, 1, 0, 0, 0, 0, 0, 0]
    - [1, 1, 1, 0, 0, 0, 0, 0]
    - [1, 1, 1, 1, 0, 0, 0, 0]
    - [0, 0, 0, 0, 1, 0, 0, 0]
    - [0, 0, 0, 0, 1, 1, 0, 0]
    - [0, 0, 0, 0, 1, 1, 1, 0]
    - [0, 0, 0, 0, 1, 1, 1, 1]
  legend: "1 = permitted; 20 within-segment causal pairs"
~~~

**DERIVED.** A concrete target convention avoids off-by-one ambiguity:

~~~text
Tensor trace
[1, 8] input tokens → [a0, a1, a2, EOS, b0, b1, b2, EOS]
[1, 8] segment IDs → [ 0,  0,  0,   0,  1,  1,  1,   1]
[1, 8] positions   → [ 0,  1,  2,   3,  0,  1,  2,   3]
[1, 8] next labels → [a1, a2, EOS, IGNORE, b1, b2, EOS, IGNORE]
[1, 8] loss mask   → [ 1,  1,   1,      0,  1,  1,   1,      0]
~~~

**DERIVED.** This trace uses externally aligned next-token labels. A model interface that shifts labels internally requires a different supplied label layout; applying both shifts is incorrect. Likewise, resetting positions preserves an independent-document position convention, but is not a universal rule for continuous-stream pretraining.

**MATHEMATICALLY-DERIVED — reduction correctness.** Let $s_r$ be the summed token losses and $z_r$ the supervised-target count on data-parallel rank $r$. The intended global token mean is

$$
\mathcal{L}_{\mathrm{global}}=
\frac{\sum_{r=1}^{p_{\mathrm{dp}}}s_r}
{\sum_{r=1}^{p_{\mathrm{dp}}}z_r},
\qquad \sum_r z_r>0.
$$
*(Eq. 12.11)*

**MATHEMATICALLY-DERIVED.** Averaging $s_r/z_r$ over ranks generally differs when counts differ. If the gradient reducer averages rank gradients, each rank can contribute $p_{\mathrm{dp}}s_r/\sum_r z_r$ to obtain the desired gradient, provided the count is treated as fixed with respect to parameters and all ranks participate. Accumulation across microbatches requires the same denominator over the full update, not a separate equal-weight average of unequal microbatch means.

**DERIVED.** Truncation changes the training example. Cutting a document before its genuine end and inserting EOS teaches termination at an artificial boundary. A chunking policy should distinguish “document ended” from “window ended,” record excluded targets, and state whether adjacent chunks share context. Packing after truncation can look efficient while systematically losing long-document suffixes.

## Algorithm

**DERIVED — linear-time next-fit construction.**

~~~text
Algorithm 12.4 — Pack independent segments with explicit targets
INPUT: finite ordered segments; row width T; boundary and position policies
OUTPUT: Result(packed arrays and occurrence ledger, packing error)
STATE: current row, used slots, and segment metadata
INVARIANT: every retained target has exactly its declared predecessor context
1. Validate all lengths, token ranges, masks, and the oversized-segment policy.
2. For each segment, apply only the declared reject/chunk/truncate operation.
3. If the segment does not fit, finalize the current row and start a new row.
4. Copy segment tokens, identity, local positions, and target-mask metadata.
5. Exclude cross-segment next-token transitions under the independent objective.
6. Emit segment offsets for a boundary-aware kernel or a bounded oracle mask.
7. Finalize the last row with safe padding treatment and explicit tail policy.
8. Return source-token, retained-token, dropped-token, and target counts.
~~~

**DERIVED — complexity.** For $D_{\mathrm{stored}}$ retained tokens and $n_{\mathrm{seg}}$ segments, next-fit copying and metadata generation cost $O(D_{\mathrm{stored}}+n_{\mathrm{seg}})$ time and $O(T)$ active token storage. It is not an optimal bin-packing solver. Searching every existing bin for every segment can become quadratic; bounded-window sorting or a capacity index changes that cost but also changes order and state.

## Implementation

**OFFICIAL-DOCUMENTATION — [R12.7](references.md#r127).** The NVIDIA NeMo Framework route currently resolves to Megatron Bridge's packing documentation, which distinguishes fine-tuning packing from standard pretraining concatenation and marks support as recipe-dependent. **DERIVED.** Preserve that distinction when naming NVIDIA NeMo Framework and NVIDIA Megatron-Core under *Distributed training*. PyTorch remains the *Model / autograd framework* consumer; correct masks must reach the selected attention implementation, rather than being discarded by an adapter.

**DERIVED.** Segment offsets require $O(n_{\mathrm{seg}})$ metadata. A dense audit mask requires $O(T^2)$ space, so use it only for an explicitly bounded oracle fixture. A production kernel's actual work and memory must be checked separately; mathematical sparsity does not prove that a dispatched kernel exploits it.

## Experimental design

**PROPOSAL — no measurements reported.**

### Experiment 12.4 — Packed versus unpacked objective equivalence

- **Hypothesis:** packing preserves per-target logits and the global token objective under the stated independent-segment contract.
- **Setup:** use a fixed model and identical retained tokens in packed and unpacked layouts.
- **Independent variables:** boundary mask, position reset, target shift, and reduction strategy.
- **Controlled variables:** weights, precision, tokenizer, valid contexts, and dropout policy.
- **Dataset/workload:** the eight-token fixture, one-token segments, zero-supervision rows, long documents, and prompt-masked examples.
- **Hardware:** record backend and kernel configuration before execution.
- **Metrics:** target identity agreement, per-target logit differences, summed loss, and gradient differences.
- **Baselines:** bounded dense-mask oracle and separate-document execution.
- **Expected result:** exact structural agreement and numerical agreement within a declared tolerance.
- **Ablation:** remove one boundary restriction; require the test to identify its effect.
- **Interpretation:** separate objective changes from floating-point variation.
- **Threats to validity:** shared mask bugs, dropout mismatch, and unequal retained tokens.

## Observations

**What the paper claims.** **OFFICIAL-DOCUMENTATION.** The packing reference documents boundary-preserving fine-tuning paths with explicit support constraints.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** The worked fixture has eight stored tokens, six supervised transitions, and twenty admitted causal pairs.

**What we infer.** **DERIVED.** Packing is an objective transformation unless the equivalence conditions are established.

**What remains unknown.** **UNVERIFIED.** Runtime speedup, actual kernel dispatch, and numerical equivalence in a chosen deployment remain to be measured.

## Failure modes

~~~figure
id: fig-12.14
kind: stat-panel
title: Packing invariants
caption: Proposed invariants for this section; these are design requirements, not measured deployment status.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-12.8
alt: >-
  attention: within-segment causal. positions: declared segment convention. targets: no unintended cross-boundary pair. reduction: global loss sum / target count.
spec:
  header: PACKING INVARIANTS
  rows:
    - {key: "attention", value: "within-segment causal"}
    - {key: "positions", value: "declared segment convention"}
    - {key: "targets", value: "no unintended cross-boundary pair"}
    - {key: "reduction", value: "global loss sum / target count"}
~~~

> **Failure mode — EOS mistaken for isolation.** **DERIVED.** *Symptom:* later-document logits change when earlier text changes. *Cause:* unrestricted cross-document attention. *Detection:* perturb the unrelated earlier segment. *Mitigation:* enforce the declared segment mask.

> **Failure mode — rank-mean bias.** **DERIVED.** *Symptom:* loss or gradients change with partitioning. *Cause:* equal rank weighting despite unequal target counts. *Detection:* repartition a fixed token set. *Mitigation:* Eq. 12.11 with verified reducer semantics.

## Siblings

**DERIVED.** Padding preserves separate rows but wastes slots. Independent packing preserves contexts only with coordinated boundaries. Continuous concatenation deliberately permits earlier-document context; it is an alternative objective interpretation, not an automatically incorrect implementation. [§12.3](12-3-sampling-and-loading.md) owns length bucketing, which changes batch composition without concatenating contexts.

## Extensions

**DERIVED.** Tool trajectories can require attention across multiple events of one episode while excluding other episodes. Multimodal segments need modality-specific position and visibility rules. A text-only segment identifier cannot by itself express every cross-attention relation; define the permitted pairs before selecting the layout.

## Limitations

**DERIVED.** The equivalence argument assumes no additional operation mixes independent segments, such as a batch-dependent transformation with changed statistics. Kernel eligibility, position conventions, and model-specific coupling must be checked. Dropout can preserve distributional semantics without preserving one execution's random mask.

## Reproducibility

**DERIVED — required artifact.** Store pack membership, source token ranges, segmentation, position policy, label-shift ownership, EOS treatment, truncation ledger, loss numerator and denominator, and the resolved attention backend. Log physical rows and logical examples separately.

## References

[R12.5 — PyTorch data](references.md#r125); [R12.6 — indexed sequence sampling](references.md#r126); [R12.7 — packed-sequence documentation](references.md#r127).
