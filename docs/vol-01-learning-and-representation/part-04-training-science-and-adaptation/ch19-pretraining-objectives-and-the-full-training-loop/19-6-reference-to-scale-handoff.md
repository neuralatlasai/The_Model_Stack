---
id: ms.section.19.6
entity_type: section
title: Reference-to-scale handoff
short_title: Reference-to-scale handoff
volume: 1
part: 4
chapter: 19
section: 19.6
slug: 19-6-reference-to-scale-handoff
parent: ms.chapter.19
prev_sibling: ms.section.19.5
next_sibling: ms.verification.19
children: []
prerequisites: [ms.chapter.6, ms.chapter.12, ms.section.19.1, ms.section.19.2, ms.section.19.3, ms.section.19.4, ms.section.19.5]
downstream: [ms.chapter.20, ms.chapter.21, ms.chapter.25, ms.chapter.29, ms.chapter.30]
related: [ms.chapter.13]
relations: []
axes: {lifecycle: [pretraining, evaluation], mechanism: [training_loop, verification, resource_accounting], feedback_setting: [], modality: [text]}
papers: [P13]
implementations: [impl.pytorch, impl.torchtitan]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 19.6 Reference-to-scale handoff

## Scope

[DERIVED] A reference-to-scale handoff preserves the training contract while changing its execution. This section defines numerical correctness gates, a falsifiable pilot design, resource estimates, and distributed prerequisites. The handoff artifact is an auditable recipe with explicit unresolved conditions, not a throughput promise. Architecture, optimizer tuning, scaling-law fitting, accelerator kernels, and distributed layouts retain their canonical locations in Chapters13,20–21, and25–30.

## Why this exists

[MATHEMATICALLY-DERIVED] A small run can validate label alignment, normalization, parameter ownership, and restart state while failing to expose long-context memory, collective ordering, or low-precision error at scale. Conversely, high throughput can coexist with a wrong denominator or skipped records. Correctness and efficiency therefore require separate axes, with one changed execution factor at a time.

## Intuition

[MATHEMATICALLY-DERIVED] Execution equivalence is a sequence of bounded comparisons. First compare one operator or update at a fixed state, then a short trajectory, then representative shape/resource regimes. Agreement on the first comparison constrains a local implementation difference; it does not prove that the training distribution or optimizer dynamics remain unchanged over a longer run.

## Formulation

[MATHEMATICALLY-DERIVED] Let $\mathsf T_{\mathrm{ref}}$ and $\mathsf T_{\mathrm{cand}}$ be the reference and candidate transitions under the same declared recipe identity except for one execution transformation. For corresponding tensor $z$, define

$$
e_{\infty}(z)=\lVert z_{\mathrm{cand}}-z_{\mathrm{ref}}\rVert_\infty,\qquad
e_{\mathrm{rel}}(z)=
\frac{\lVert z_{\mathrm{cand}}-z_{\mathrm{ref}}\rVert_2}
 {\max(\lVert z_{\mathrm{ref}}\rVert_2,\epsilon_z)}.
$$
*(Eq. 19.17)*

[MATHEMATICALLY-DERIVED] The positive floor $\epsilon_z$ has the units of the tensor norm. Acceptance tolerances are declared per quantity and precision regime before the test; a large reference norm must not hide a severe coordinate error, so both absolute and relative comparisons are useful. Record loss, pre-clipping gradient, parameters, moments, counts, clocks, and record identities. Discrete quantities require equality rather than floating-point tolerance.

## Mechanism

### Methodology: gates before a distributed pilot

[DERIVED] The first gate checks objective records: tokenizer/processor identity, label shift, visibility, boundary masks, and target counts. The second checks a finite forward/backward on extreme but valid inputs and rejects malformed/all-empty windows according to the recipe. The third compares full-batch and accumulated gradients at fixed parameters. The fourth compares one accepted optimizer transition including persistent state. The fifth resumes in a fresh process and compares the logical next record and subsequent states. These are the chapter's local invariants, each with a recorded pass/fail consequence.

[DERIVED] Tiny-corpus overfitting is a diagnostic for a fixed finite objective: choose a bounded corpus with enough nontrivial targets, disable stochastic data changes, hold the vocabulary and masks fixed, and declare a target loss reduction plus an update budget. Failure prompts examination of gradients, trainability, alignment, optimizer state, and expressivity. Success establishes that this configuration fits that corpus under that budget. It does not establish generalization or the correctness of unrelated long-context/distributed paths.

[MATHEMATICALLY-DERIVED] The resource ledger follows the actual representation:

$$
M_{\mathrm{peak}}=M_{\mathrm{params}}+M_{\mathrm{grads}}+M_{\mathrm{opt}}
+M_{\mathrm{act}}+M_{\mathrm{workspace}}+M_{\mathrm{runtime}}+M_{\mathrm{comm}}.
$$
*(Eq. 19.18)*

[MATHEMATICALLY-DERIVED] These terms must describe simultaneously live allocations at the selected peak boundary; separately measured peaks cannot generally be added as though simultaneous. Parameters/gradients/moments follow their dtypes and ownership, activations follow the microbatch and checkpoint policy, and logits follow the selected loss/projection implementation. Reserving an explicit capacity margin is a planning input, not proof that fragmentation or a future shape cannot cause an allocation failure.

```figure
id: fig-19.8
kind: calculator
title: Persistent training state before activations
caption: >-
  This analytical configuration counts weights, gradients, two moments,
  and an optional master copy independently. It excludes activations,
  workspaces, communication, and runtime allocations and is not peak memory.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-19.18
alt: >-
  For one billion parameters, two-byte weights, four-byte gradients,
  two four-byte moments, and a four-byte master copy, persistent arrays
  occupy 18 billion bytes before activations and runtime overhead.
spec:
  tex: M=N(b_p+b_g+b_1+b_2+b_m)
  equation: "19.18"
  inputs:
    - {symbol: params, label: trainable scalar count, default: 1000000000, min: 1, max: 1000000000000, format: integer}
    - {symbol: bp, label: weight bytes per scalar, default: 2, min: 1, max: 8}
    - {symbol: bg, label: gradient bytes per scalar, default: 4, min: 1, max: 8}
    - {symbol: b1, label: first moment bytes per scalar, default: 4, min: 0, max: 8}
    - {symbol: b2, label: second moment bytes per scalar, default: 4, min: 0, max: 8}
    - {symbol: bm, label: separate master bytes per scalar, default: 4, min: 0, max: 8}
  outputs:
    - {symbol: persistent, label: persistent array storage, formula: params*(bp+bg+b1+b2+bm), format: bytes, emphasis: true}
```

[MATHEMATICALLY-DERIVED] If one step processes $P_k=\sum_aB_aT_a$ positions and scores $Q_k$ targets, then processed-position throughput is $P_k/t_k$ and target throughput is $Q_k/t_k$ over the same measured step boundary. Increasing padding can improve the first numerator without improving the second. Model FLOPs utilization additionally needs an explicit useful-FLOP count and compatible peak-compute denominator; Chapter 30 owns that metric. The dense approximation $C\approx6ND$ from Chapter 21 is not a complete long-context, MoE, auxiliary-head, or recomputation ledger.

### Pilot design and distributed prerequisites

[DERIVED] A pilot fixes data/tokenizer/model revisions, objective, update count or accepted-token budget, optimizer/schedule clock, input-length distribution, numerical policy, and evaluation distribution. Change one execution factor, such as accumulation partition, precision path, or data-parallel degree, while matching the mathematical update batch. Include warmup/compilation separately from steady-state timing and report checkpoint/evaluation overhead separately as well as in an end-to-end boundary. A throughput-only result without the correctness gates is insufficient for the handoff.

[MATHEMATICALLY-DERIVED] Distributed execution adds obligations absent locally: unique target ownership, exact sum-versus-mean reduction semantics, collective agreement, shard/tie identity, global clipping norms, synchronized acceptance or rejection, and checkpoint reconstruction. If one rank skips a collective while others enter it, local numerical validity does not provide global progress. If one rank accepts an optimizer step while another rejects it, replicated state diverges. These conditions motivate the transition and communication analysis in Part V rather than proving it complete here.

## Algorithm

**Algorithm 19.6 — Evidence-bearing handoff decision.** [DERIVED] Input: fixed recipe $\chi$, candidate execution transformation $e$, discrete invariants $\mathcal I$, numerical tests $\mathcal Z$, predetermined tolerances $(\alpha_z,\delta_z)$, and a resource budget $\mathcal B$. Output: a bounded acceptance decision with retained evidence. Each test runs for a declared finite horizon; no failing test is silently removed from the set.

$$
\begin{aligned}
1.\quad &\mathcal E\gets\operatorname{run\_gates}(\chi,e,\mathcal I,\mathcal Z).\\
2.\quad &v_{\mathrm{disc}}\gets\bigwedge_{i\in\mathcal I}\operatorname{equal}(i).\\
3.\quad &v_{\mathrm{num}}\gets\bigwedge_{z\in\mathcal Z}
 [e_\infty(z)\leq\alpha_z\ \land\ e_{\mathrm{rel}}(z)\leq\delta_z].\\
4.\quad &v_{\mathrm{resource}}\gets\operatorname{measured\_within}(\mathcal E,\mathcal B).\\
5.\quad &\operatorname{return}
 \left(v_{\mathrm{disc}}\land v_{\mathrm{num}}\land v_{\mathrm{resource}},\mathcal E,\chi,e\right).
\end{aligned}
$$
*(Eq. 19.19)*

[DERIVED] A missing measurement makes the corresponding gate unresolved, not passed. Acceptance applies only to the tested transformation, shapes, precision, and horizon. Rejecting a candidate does not reject the reference objective; it identifies an execution/configuration discrepancy whose earliest failing boundary must be investigated.

## Implementation

[DERIVED] **PyTorch**, the Model / autograd framework layer, hosts the single-device reference; **TorchTitan**, the Distributed training layer, is the plan-anchored comparison surface. The handoff attaches configuration, state records, operator boundaries, numerical differences, memory ledgers, and timing definitions to the candidate. It does not require exposing programming code in the manuscript: mathematical procedures and tensor/state contracts specify the behavior, while exact source locators preserve implementation traceability.

[MATHEMATICALLY-DERIVED] A full before/after tensor comparison requires $O(N)$ additional reads and may require parameter/state-sized retained snapshots. A short trajectory with $K$ stored snapshots can require $O(KN)$ storage; streaming comparison can reduce retained tensor storage while preserving scalar discrepancies and failing tensor identities. Gate execution adds compute and I/O outside the production timing boundary. No parameters or training targets are added by the gate itself.

[NOT-DISCLOSED] Measured throughput, peak memory, communication overlap, energy, or monetary cost for this pilot is unavailable because it has not been executed. Accelerator availability, selected kernels, and installed-runtime compatibility remain UNVERIFIED. No synthetic performance points are plotted as experimental evidence.

## Experimental design

### Reported experiments

[PAPER-REPORTED] DeepSeek-V3's Appendix B compares its FP8 framework against BF16 using approximately 16B-parameter/1.33T-token and 230B-parameter/0.9T-token MoE baselines. Figure 10 presents loss curves smoothed with an EMA coefficient of 0.9. These are reported scale-specific precision comparisons, not proof of equivalence for every low-precision kernel. [P13], Appendix B.1 and Figure 10.

## Observations

**What the paper claims.** [PAPER-REPORTED] DeepSeek-V3 reports a low-precision validation against BF16 under those model/data settings. [P13], Appendix B.1.

**What the evidence shows.** [DERIVED] The comparison concerns the authors' joint framework and configuration. A smoothed loss curve does not establish exact gradients, bitwise state agreement, or a reader's hardware/runtime compatibility.

**What we infer.** [MATHEMATICALLY-DERIVED] Numerical fidelity must be checked at the boundary needed by the claim: scalar loss, local derivative, accepted update, or trajectory are progressively different objects.

**What remains unknown.** [UNVERIFIED] The book's gate outcomes and candidate performance remain unmeasured. A contemporary frontier model's undisclosed recipe cannot be reconstructed from this reference.

## Failure modes

[DERIVED] A candidate can pass loss checks and fail gradient checks; pass one-step checks and fail restart; fit a tiny corpus and fail representative context shapes; improve kernel time and worsen end-to-end time. The evidence record identifies the boundary for each failure. Scaling before resolving that boundary multiplies the cost of an unresolved discrepancy without supplying additional correctness evidence.

## Siblings

[DERIVED] A correctness pilot checks semantic preservation; an optimization ablation compares algorithms at matched budgets; a scaling pilot fits a resource–quality relation; a systems benchmark measures an execution workload. Chapters06,20,21, and30 respectively own their broader methodology. The handoff joins their records without treating their acceptance criteria as interchangeable.

## Extensions

[DERIVED] Long-context, multimodal, sparse, and recurrent candidates need representative state/shape cases and their own cost ledger. Adding a modality changes processing and conditioning; adding sparse routing changes activated work and communication; adding recurrence changes persistent sequence state. Each extension preserves the record-first principle while requiring the corresponding architectural and systems chapters. No universal extrapolation factor is supplied.

## Limitations

[MATHEMATICALLY-DERIVED] A finite test set cannot establish equivalence for every possible input, dtype, topology, or failure schedule. Its conclusion is bounded by the tested configuration and the declared tolerances. Passing the handoff does not establish a globally optimal compute allocation, a state-of-the-art benchmark rank, or production readiness.

## Reproducibility

[DERIVED] The artifact retains gate definitions, configuration identities, tolerance choices, failed and successful cases, raw timing boundaries, resource accounting, and every unresolved condition. The verification protocol names the tiny-corpus, accumulation, checkpoint, monitoring, and distributed-handoff tests separately. All book-designed training experiments remain proposals.

## References

[P13](references.md#p13), Appendix B.1; [R19.2](references.md#r192); [R19.3](references.md#r193); [verification.md](verification.md).
