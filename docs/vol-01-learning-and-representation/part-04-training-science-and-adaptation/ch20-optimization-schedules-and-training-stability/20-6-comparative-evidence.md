---
id: ms.section.20.6
entity_type: section
title: Comparative evidence
short_title: Comparative evidence
volume: 1
part: 4
chapter: 20
section: 20.6
slug: 20-6-comparative-evidence
parent: ms.chapter.20
prev_sibling: ms.section.20.5
next_sibling: null
children: []
prerequisites: [ms.chapter.2, ms.chapter.3, ms.chapter.19]
downstream: [ms.chapter.21, ms.chapter.22, ms.chapter.29, ms.chapter.30]
related: [ms.chapter.6, ms.chapter.13]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P13}
  - {type: implemented_by, target: impl.pytorch}
axes: {lifecycle: [pretraining, continued_training, evaluation], mechanism: [optimization, training_stability], feedback_setting: [], modality: [text, image]}
papers: [P13]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---
# Comparative evidence

[DERIVED] An optimizer comparison is a comparison of complete training procedures at a specified quality target. The update equation, parameter groups, initialization, batch, token budget, schedule endpoint, precision, implementation, and tuning allocation define that procedure. Holding a numerical learning rate fixed across AdamW and Muon does not hold update magnitude or training opportunity fixed. Conversely, independently optimizing every candidate without counting the search can conceal the cost of obtaining the reported run. Sections 20.1-20.5 provide the mechanisms needed to identify these differences; this section reconstructs what the available comparisons measure.

## Formulation

### Four distinct efficiency targets

[MATHEMATICALLY-DERIVED] Let $\mathcal{L}_o(D)$ be the validation loss of optimizer recipe $o$ after processing $D$ training tokens, evaluated after the schedule prescribed for that budget. For a predeclared target $\ell$, define

$$
D_o^*(\ell)=\inf\{D:\mathcal{L}_o(D)\leq\ell\},\qquad
C_o^*(\ell)=\inf\{C:\mathcal{L}_o(C)\leq\ell\},\qquad
T_o^*(\ell)=\inf\{T:\mathcal{L}_o(T)\leq\ell\}.
\tag{20.10}
$$

[DERIVED] These are token, computational-work, and elapsed-time efficiencies. Their domains and accounting rules must be stated. Tokens can include padding or only supervised positions; computational work can exclude optimizer kernels; elapsed time can exclude compilation, validation, checkpointing, and failed attempts. A target not reached within the observed budget is a censored outcome. Assigning the final time of a failed run as its time to target would reward a method for terminating without reaching the target.

[MATHEMATICALLY-DERIVED] With $U_o^*$ required accepted updates and mean inclusive time per accepted update $\bar{\tau}_o$, a simple uninterrupted approximation is $T_o^*\approx U_o^*\bar{\tau}_o$. If method A needs a fraction $r$ of B's updates but each update costs a factor $s$, its time ratio is approximately $rs$. Token efficiency implies time efficiency only when the additional factor, batch differences, evaluation overhead, and failures are accounted for. A matrix optimizer can require fewer updates while increasing the time of each update.

[DERIVED] Economic cost adds hardware allocation, occupancy, energy or provider pricing, and campaign overhead. A comparison based on rented accelerator hours cannot silently stand for monetary cost across different machines or dates. The same reservation may continue to incur cost while a run checkpoints or recovers. Section 30 owns cluster-level throughput accounting; here the essential distinction is between the cost of the selected trajectory and the cost of discovering and delivering it.

### Fitted equivalents and their limits

[PAPER-REPORTED] Wen et al. fit the AdamW loss-budget relation separately by model scale and invert it to estimate the AdamW tokens equivalent to a candidate's loss. Their comparison uses final losses at prescribed budgets, rather than an arbitrary intermediate point on one long cosine run. The fitted equivalent is a model-based token speedup. It is not a directly timed hardware acceleration. [R20.31, Section 3.3]

[MATHEMATICALLY-DERIVED] For a fitted baseline $\widehat{\mathcal{L}}(D)=aD^{-b}+c$, with $a,b>0$ and target $\ell>c$, inversion gives

$$
\widehat D(\ell)=\left(\frac{a}{\ell-c}\right)^{1/b},\qquad
\frac{\partial\log\widehat D}{\partial\ell}=-\frac{1}{b(\ell-c)}.
\tag{20.11}
$$

[DERIVED] Equivalent-token estimates become sensitive to loss and asymptote error near the fitted floor. Reporting a precise acceleration ratio without fit uncertainty can therefore overstate the resolution of the experiment. Interpolation within observed budgets and extrapolation beyond them are different evidence. A residual plot, fitted range, held-out budget check, and uncertainty over the entire fitting procedure are needed to judge a fitted comparison. Their absence remains a reporting limitation; it does not license inventing error bars.

## Mechanism

### Methodology: equal opportunity does not mean identical hyperparameters

[DERIVED] An algorithmic comparison holds the task and evaluation fixed, gives each method a declared tuning opportunity, and compares the selected recipes. A deployment comparison additionally permits implementation-specific kernels and sharding, while accounting for their engineering and execution costs. These questions can produce different winners. For example, blockwise Shampoo changes both approximation granularity and resource use; Muon applied independently to row shards changes matrix geometry; a fused AdamW kernel changes execution without changing the intended scalar recurrence. The comparison must name which changes are part of the candidate. [R20.13, Appendix E; R20.17, Sections 3-4; R20.19]

[DERIVED] Learning rate, momentum, epsilon, clipping, weight decay, and schedule duration interact. Tuning only the learning rate while copying the baseline's weight decay can favor the method whose update scale happens to match that convention. Even coordinate-wise tuning does not prove a global optimum: a better combination may require simultaneous movement of two parameters. Equal numbers of trials are reproducible resource constraints, while equality of attained tuning quality is a stronger and generally unobservable condition.

[PAPER-REPORTED] The Fantastic Pretraining Optimizers study uses coordinate descent over optimizer-specific grids, then restricts later searches to empirically scale-sensitive hyperparameters and fits their dependence on model size and data budget. It tests approximately 130M, 300M, 520M, and 1.2B Llama-family models with 4,096-token contexts on a DCLM, StarCoder V2, and ProofPile 2 mixture. Parameters are FP32 and activations BF16; experiments use JAX on TPU v5 hardware. Its final C4-English losses and downstream checks show that tuning the baseline and evaluating schedule endpoints materially reduce several advertised advantages. [R20.31, Sections 3-4, Table 2]

### Architecture, seeds, and unit of replication

[DERIVED] Reusing the same architecture family across four widths measures width dependence within that family. It does not establish transfer to a different depth rule, attention parameterization, sparse expert layout, or diffusion objective. Similarly, five initializations of one 111M-token-budget experiment cannot establish variance at 1.7B parameters. Replication units must remain attached to the result they support. Repeated validation batches from one trained model estimate evaluation variability, rather than training-seed variability. Chapter 6 develops the statistical distinction.

[PAPER-REPORTED] Straight to Zero includes a five-seed study for its 111M-model, 20-tokens-per-parameter setting. Its broader schedule grid covers other sizes and training durations, with a negative result for decay to zero at the very short two-tokens-per-parameter budget. That evidence supports budget-dependent schedule selection and a particular replicated slice; it does not supply five-seed uncertainty for every cell. [R20.9, Sections 3-4 and Appendix C]

## Algorithm

[DERIVED] The following procedure is an accounting specification for interpreting a completed comparison. It does not claim that the experiments in this chapter were rerun.

```text
Algorithm 20.6 — Compare complete training recipes
INPUT  candidate runs, task definition, quality target, budget axes, tuning ledger
OUTPUT comparison table with reached targets, censored outcomes, and limitations
INVARIANT each loss uses the same declared evaluation protocol
1. Partition runs by architecture, data, objective, and endpoint policy.
2. Record optimizer groups, schedule clocks, precision, and implementation revisions.
3. Select recipes using only the declared tuning data and selection rule.
4. Count executed tokens, forward/backward work, optimizer work, and inclusive time.
5. Locate target crossings using the declared endpoint or interpolation rule.
6. Mark an unreached target as censored; retain divergence and recovery records.
7. Quantify variation using the actual independent training units available.
8. Report final-budget and target-based comparisons separately.
9. State which effects remain confounded and which conclusions require extrapolation.
TERMINATION all reported ratios have an identified denominator and accounting boundary
```

Complexity: [MATHEMATICALLY-DERIVED] If $M$ runs each have $K$ ordered evaluation points, a single target scan is $O(MK)$ time and $O(M)$ retained summaries. Repeated targets can be processed over sorted curves without repeatedly reading every checkpoint. Statistical refits add the cost of the declared fitting and resampling procedures; the optimizer's training cost is not part of this ledger-processing complexity.

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch exposes scalar-loop, foreach, and, where supported, fused AdamW implementations with different execution and memory behavior. Muon's implementation exposes the orthogonalization coefficients, iteration count, and learning-rate adjustment rule. These are necessary comparison metadata. A benchmark that silently substitutes a different adjustment rule or Newton-Schulz iteration count is testing a different numerical recipe. Framework defaults must be pinned to the inspected version, here PyTorch 2.14, and hardware measurements must identify the actually installed version. [R20.19; R20.20]

[DERIVED] A minimal run ledger records global batch in sequences and valid tokens, gradient-accumulation count, accepted and attempted updates, compiled shapes, parameter-state dtypes, communication precision, and synchronization rules. Time measurements need a device synchronization boundary or a documented asynchronous measurement method. The first compiled step and steady-state steps answer different questions. End-to-end elapsed time retains compilation and recovery if the stated goal is delivery time.

[DERIVED] Loss comparisons additionally require tokenizer, held-out corpus revision, masking, sequence packing, and averaging convention. A mean over sequences can differ from a mean over valid tokens when lengths differ. Diffusion quality measures such as FD-DINO are not interchangeable with autoregressive token loss. An optimizer's rank on one objective and metric cannot be transferred by renaming the vertical axis.

## Experimental design

### Reported language-model comparisons

[PAPER-REPORTED] Moonlight reports a compute-scaling comparison between Muon and AdamW, using multiple model sizes and training budgets; its fitted result attributes approximately 52% lower compute to Muon at its compute-optimal comparison. Qiu et al. instead study optimizer-specific hyperparameter transfer on FineWeb across 190M-1.4B Llama-family models and report gains in forward/backward FLOPs, excluding optimizer computation. These are different estimands with different tuning and parameterization. Their numerical gains should remain attached to their protocols. [R20.4, Section 3; R20.13, Sections 3-4]

[PAPER-REPORTED] Against its more extensively tuned AdamW baseline, the Fantastic study reports improvements around 1.4 times at small model scales and around 1.1 times at 1.2B in the eight-times reference-token-budget regime. Its optimizer ordering can change with data budget and learning-rate decay. These findings constrain broad claims of a scale-independent two-times optimizer gain; they do not invalidate Moonlight's distinct fitted comparison by treating both studies as the same experiment. [R20.31, Sections 4.1-4.3]

### Reported 2026 improvements and systems evidence

[PAPER-REPORTED] Muon+ adds row- or column-normalization structure to the Muon update and reports GPT-2-style and Llama-style comparisons with optimizer-specific learning-rate searches on FineWeb. The GPT-style table reports perplexity 29.66 versus 27.64 for Muon versus Muon+ at 124M parameters, and 17.82 versus 16.91 at 774M. The paper's evaluated grids, model classes, and selected nonmatrix-parameter optimizer remain part of the result. The inspected v3 additionally reports 6.654B GPT and 6.738B Llama comparisons at 20.0B and 19.8B tokens, respectively, and five-seed results for GPT-Base and Llama-350M. Those approximately 7B runs use a selected rate and BF16 recipe; their roughly three-token-per-parameter budgets must not be described as 20-token-per-parameter training. Replication does not extend to every table cell. [R20.15, Section 3, Tables 1-3 and 18]

[PAPER-REPORTED] Scaling Muon for Diffusion Transformers separates algorithmic and distributed costs on 1.3B-15B diffusion transformers trained for 60,000 steps on 256 H100 GPUs. Periodic row-normalization, sharding, and communication overlap reduce optimizer and step time relative to its vanilla Muon implementation. Its time-to-best-achieved-quality comparison and its final-step quality comparison are distinct: at 9B, the reported final FD-DINO is 33.97 for vanilla Muon and 36.70 for the periodic method, although the periodic method achieves a better best checkpoint earlier. A time-to-best claim cannot be presented as superiority at every fixed endpoint. [R20.17, Tables 1-2, Sections 4-5]

[PAPER-REPORTED] Spectral Scaling Laws of Muon measures singular-value distributions on 77M-2.8B language models and fits their variation with depth and layer position. It supplies evidence about geometry that can motivate numerical or algorithmic changes. Its extrapolation toward much deeper or larger models is a prediction from measured trends. An observed frontier-model Newton-Schulz failure is not reported by those small-scale spectral measurements. [R20.16, Section 3 and Appendix A]

## Observations

**What the paper claims.** [PAPER-REPORTED] The compared studies claim improvements in different quantities: fitted compute efficiency, token efficiency, forward/backward FLOPs, perplexity at a fixed token budget, and distributed step or delivery time. Their headline ratios answer different questions. [R20.4; R20.13; R20.15; R20.17; R20.31]

**What the evidence shows.** [PAPER-REPORTED] Careful baseline tuning shrinks several gains; optimizer rankings vary with model size, duration, and schedule endpoint; systems improvements can reduce time while producing a different final quality. The cited negative and endpoint-dependent results are retained alongside the improvements. [R20.9; R20.17; R20.31]

**What we infer.** [DERIVED] A transferable comparison requires an identified quality target, tuning allocation, complete recipe, and cost boundary. Agreement on an optimizer's name is insufficient to pool results across changed scaling rules and implementations.

**What remains unknown.** [NOT-DISCLOSED] These sources do not provide a common, independently reproduced, multi-seed benchmark spanning all listed optimizer families, frontier language models, and diffusion architectures on the same hardware. This chapter supplies no new measurements to close that gap.

## Failure modes

[DERIVED] A fixed-step comparison can favor the optimizer whose batch is larger; a fixed-token comparison can hide a longer optimizer step; a fixed-FLOP comparison can omit matrix orthogonalization; a fixed-time comparison can favor a more mature implementation. None of these axes is intrinsically wrong. The failure is substituting one for another without stating the boundary. Likewise, selecting the best intermediate checkpoint for one method and the final checkpoint for another changes the selection opportunity.

[DERIVED] Excluding diverged runs after inspecting outcomes induces survivorship bias. Reusing the evaluation set to select hyperparameters creates selection bias. Averaging ratios across incomparable targets or architectures removes their operational meaning. An optimizer requiring an architecture-specific stabilization intervention must be compared as the stabilized recipe, with the intervention and its cost visible.

## Extensions

### Improvements in evaluation methodology

[DERIVED] The documented improvement lineage now includes state-efficient factorization, matrix-aware directions, optimizer-specific parameterization, normalized Muon variants, and distributed implementations. Evaluation has improved in parallel: multi-budget endpoints expose schedule effects; stronger tuning exposes weak baselines; spectral diagnostics expose changes hidden by a scalar norm; system measurements expose costs hidden by forward/backward FLOPs. These are complementary contributions. None alone establishes that the latest optimizer should replace a validated production recipe. [R20.3; R20.13; R20.15; R20.16; R20.17; R20.31]

```figure
id: fig-20.6
kind: diagram
title: Four efficiency claims require four accounting boundaries
caption: A common quality target connects distinct token, work, time, and cost ledgers; none can be substituted silently.
placement: wide
evidence: DERIVED
source: [R20.4, R20.13, R20.17, R20.31]
alt: A quality target is connected to separate token, computational work, elapsed time, and economic cost measurements.
spec:
  direction: LR
  nodes:
    - {id: quality, kind: node, label: Common quality target}
    - {id: tokens, kind: node, label: Executed training tokens}
    - {id: work, kind: node, label: Model and optimizer work}
    - {id: time, kind: node, label: Inclusive elapsed time}
    - {id: cost, kind: node, label: Allocated hardware and campaign cost}
  edges:
    - {from: quality, to: tokens, label: token efficiency}
    - {from: quality, to: work, label: compute efficiency}
    - {from: quality, to: time, label: delivery efficiency}
    - {from: quality, to: cost, label: economic efficiency}
```

## Reproducibility

[DERIVED] The chapter's optimizer/schedule ablation protocol requires a recipe ledger, a tuning ledger, endpoint evaluations, and explicit target-accounting boundaries. The controlled replay and comparison proposals are specified in [verification.md](verification.md). They have not been executed. Source-reported experiments remain evidence from their authors; equations and accounting consequences are the book's derivations. The references ledger identifies the full texts and documentation actually inspected on 2026-10-08.
