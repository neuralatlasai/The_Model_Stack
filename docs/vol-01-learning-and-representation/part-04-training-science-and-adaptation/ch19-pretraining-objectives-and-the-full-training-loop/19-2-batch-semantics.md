---
id: ms.section.19.2
entity_type: section
title: Batch semantics
short_title: Batch semantics
volume: 1
part: 4
chapter: 19
section: 19.2
slug: 19-2-batch-semantics
parent: ms.chapter.19
prev_sibling: ms.section.19.1
next_sibling: ms.section.19.3
children: []
prerequisites: [ms.chapter.3, ms.chapter.4, ms.chapter.6, ms.chapter.12, ms.section.19.1, ms.frontmatter.notation]
downstream: [ms.chapter.20, ms.chapter.21, ms.chapter.29, ms.chapter.30]
related: [ms.chapter.18]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P13}
  - {type: supported_by, target: paper.P44}
  - {type: implemented_by, target: impl.pytorch}
  - {type: implemented_by, target: impl.torchtitan}
axes: {lifecycle: [pretraining, evaluation], mechanism: [training_loop, gradient_accumulation, loss_normalization], feedback_setting: [], modality: [text, code, image]}
papers: [P13, P44]
implementations: [impl.pytorch, impl.torchtitan, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2600
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 19.2 Batch semantics

## Scope

[DERIVED] An optimizer-step batch is the finite set of scored events whose gradient enters one parameter update. This section establishes when partitioning that set into microbatches preserves the update, how variable lengths change statistical weights, and where batch-dependent objectives invalidate the equivalence. Objective construction belongs to [§19.1](19-1-objective-selection.md); optimizer recurrences belong to Chapter 20. The reference boundary is a differentiable additive objective at fixed parameters, with masks and weights independent of those parameters. Distributed averaging is introduced only to specify the normalization contract required by Part V.

## Why this exists

[MATHEMATICALLY-DERIVED] A batch-size field can count sequences, processed positions, scored targets, or gradient-reduction participants. These counts coincide only under additional conditions. Padding increases tensor dimensions without adding scored events; answer-only masking changes target count without changing input length; auxiliary heads can score different numbers of targets on the same sequence. Consequently, multiplying sequence count by context length does not determine the denominator of the training objective.

[OFFICIAL-DOCUMENTATION] Hugging Face documented a Transformers accumulation defect in October 2024: averaging token-loss means from separate batches differed from dividing the accumulated loss sum by the accumulated non-padding target count. Its first-party disclosure identifies the latter reduction as the correction for the affected causal-language-model training path. This is historical evidence of a concrete failure, not a compatibility claim for every current trainer or model class. [R19.23], “Where does it stem from?”

## Intuition

[MATHEMATICALLY-DERIVED] Differentiation is linear over finite sums. Division by a count independent of parameters commutes with differentiation, but changing the count changes every event's weight. The central question is therefore whether each target retains its intended coefficient when the batch is partitioned. Equal numbers of sequences per microbatch do not establish this property when their valid-target counts differ.

## Formulation

[MATHEMATICALLY-DERIVED] Let $k$ identify one attempted optimizer update and $a\in\{1,\ldots,A\}$ its microbatches. Let $B_a$ be the number of sequences and $T_a$ the padded training length of microbatch $a$. After the objective's label alignment has been constructed, $m_{ait}\in\{0,1\}$ indicates whether target position $t$ of sequence $i$ is scored. Its negative log-likelihood is $\ell_{ait}(\theta)$ in nats. The mask counts targets after shifting and boundary handling; it is not merely an input-padding mask. Define

$$
q_a=\sum_{i=1}^{B_a}\sum_{t=1}^{T_a}m_{ait},\qquad
s_a(\theta)=\sum_{i,t}m_{ait}\ell_{ait}(\theta),\qquad
Q_k=\sum_{a=1}^{A}q_a>0.
$$
*(Eq. 19.3)*

[MATHEMATICALLY-DERIVED] The optimizer-step token mean and its gradient are

$$
\mathcal L_k(\theta)=\frac{\sum_a s_a(\theta)}{Q_k},\qquad
g_k=\nabla_\theta\mathcal L_k
=\sum_a\frac{\nabla_\theta s_a}{Q_k}.
$$
*(Eq. 19.4)*

[MATHEMATICALLY-DERIVED] Here $g_k$ has the same coordinate structure as $\theta$. All contributions are evaluated at the same $\theta$ before the optimizer transition. $Q_k$ is an integer event count, not a differentiable model output. For parameter-dependent selection or importance weights, differentiating only the scored losses is a separately specified surrogate; Eq. 19.4 cannot establish its unbiasedness.

## Mechanism

### Methodology: preserve the event measure

[MATHEMATICALLY-DERIVED] For $q_a>0$, write $\bar\ell_a=s_a/q_a$. The correct weighting of these microbatch means is $\sum_a(q_a/Q_k)\bar\ell_a$. The common alternative $A^{-1}\sum_a\bar\ell_a$ gives every microbatch equal mass. Its discrepancy is

$$
\widetilde{\mathcal L}_k-\mathcal L_k
=\sum_{a=1}^{A}\left(\frac1A-\frac{q_a}{Q_k}\right)\bar\ell_a,
\qquad
\widetilde g_k-g_k
=\sum_a\left(\frac1A-\frac{q_a}{Q_k}\right)\nabla_\theta\bar\ell_a.
$$
*(Eq. 19.5)*

[MATHEMATICALLY-DERIVED] Equal counts make every coefficient vanish. Equal observed means can make the scalar discrepancy vanish while the gradient discrepancy remains nonzero, because equality of function values at one parameter point does not imply equality of their derivatives. A scalar-loss comparison alone is therefore insufficient to verify accumulation.

[MATHEMATICALLY-DERIVED] Consider a declared analytical example with $q_1=2$, $q_2=6$, $\bar\ell_1=4$, and $\bar\ell_2=1$. The token mean is $(2\cdot4+6\cdot1)/8=1.75$ nats; the mean of means is $2.5$ nats. Each target in the first microbatch receives weight $1/4$ under the latter rule and $1/8$ under the token mean. The discrepancy changes the objective rather than merely perturbing floating-point arithmetic.

```figure
id: fig-19.3
kind: calculator
title: Valid-target weighting under accumulation
caption: >-
  Change valid-target counts while holding microbatch means fixed. Equal
  microbatch weighting agrees with token weighting when the counts agree;
  these defaults are an analytical counterexample, not model measurements.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-19.5
concepts: [ms.section.19.2]
alt: >-
  Two microbatches have 2 and 6 scored targets and mean losses 4 and 1 nats.
  The target-weighted mean is 1.75 nats. The mean of microbatch means is
  2.5 nats. Their difference is 0.75 nats.
spec:
  tex: L=(q_1 l_1+q_2 l_2)/(q_1+q_2)
  equation: "19.5"
  inputs:
    - {symbol: q1, label: first valid-target count, default: 2, min: 1, max: 8192, step: 1, format: integer}
    - {symbol: q2, label: second valid-target count, default: 6, min: 1, max: 8192, step: 1, format: integer}
    - {symbol: l1, label: first mean loss in nats, default: 4, min: 0, max: 20}
    - {symbol: l2, label: second mean loss in nats, default: 1, min: 0, max: 20}
  outputs:
    - {symbol: token_mean, label: valid-target mean, formula: (q1*l1+q2*l2)/(q1+q2), emphasis: true}
    - {symbol: batch_mean, label: mean of microbatch means, formula: (l1+l2)/2}
    - {symbol: difference, label: reduction discrepancy, formula: (l1+l2)/2-(q1*l1+q2*l2)/(q1+q2)}
```

### Sequence means and weighted targets

[MATHEMATICALLY-DERIVED] Let sequence $i$ contain $n_i>0$ valid targets and have mean loss $h_i$. The sequence mean $B^{-1}\sum_i h_i$ gives each sequence equal mass; the token mean gives sequence $i$ mass $n_i/\sum_j n_j$. Neither is universally correct: the intended sampling unit determines the objective. A sequence mean is appropriate only when equal sequence weighting is intended, and its reduction must remain sequence-based through accumulation. Mixing these conventions silently reweights short documents or short answers.

[MATHEMATICALLY-DERIVED] For nonnegative, parameter-independent event weights $w_{ait}$, the weighted mean replaces $Q_k$ by $Z_k=\sum_{a,i,t}m_{ait}w_{ait}$ and $s_a$ by $\sum_{i,t}m_{ait}w_{ait}\ell_{ait}$. An importance-sampling estimator with a fixed sample-count denominator is different from this self-normalized ratio; substituting $Z_k$ changes its statistical properties. This section proves partition invariance for the chosen finite objective, not unbiasedness for an unspecified population objective.

[OFFICIAL-DOCUMENTATION] PyTorch's class-index cross-entropy documents a mean denominator equal to the sum of applicable class weights over non-ignored targets. With unit class weights this becomes the valid-target count. Probability targets have a separately documented reduction. Consequently, a caller must identify target representation and weighting before assuming that a framework mean is a token count. [R19.20], class-index and probability-target equations.

### Distributed averaging introduces another coefficient

[MATHEMATICALLY-DERIVED] Let $r\in\{1,\ldots,R_{\mathrm{dp}}\}$ enumerate data-parallel participants with disjoint target ownership. Let $Q_k=\sum_{r,a}q_{ra}$. Suppose the gradient reducer returns the arithmetic mean across these participants. To obtain the global token mean, each rank must contribute

$$
\mathcal L_{ra}^{\mathrm{local}}=\frac{R_{\mathrm{dp}}s_{ra}}{Q_k},\qquad
\frac{1}{R_{\mathrm{dp}}}\sum_r\sum_a
\nabla_\theta\mathcal L_{ra}^{\mathrm{local}}
=\frac{\sum_{r,a}\nabla_\theta s_{ra}}{Q_k}.
$$
*(Eq. 19.6)*

[MATHEMATICALLY-DERIVED] If the reducer sums instead, omit $R_{\mathrm{dp}}$. If a framework already compensates for averaging, multiplying again overcounts. Tensor-parallel replicas that share the same labels are not additional independent observations; summing their counts duplicates targets. Context-parallel shards require their actual target ownership and loss-reduction semantics. These are accounting conditions on the chosen execution path, not consequences of a variable named world size.

[OFFICIAL-DOCUMENTATION] PyTorch's DistributedDataParallel reference explicitly warns that averaging rank gradients changes the scale relative to a single-process summed loss. Its accumulation interface also requires the forward pass to be inside the synchronization-suppression context when suppressing intermediate synchronization. This API contract supports the averaging premise above; custom communication hooks and other distributed engines require separate inspection. [R19.21], gradient-averaging note and synchronization-suppression warning.

### Partial windows, absent targets, and optimizer clocks

[MATHEMATICALLY-DERIVED] A final window with $A'<A$ microbatches may be accepted using its actual $Q_k$, discarded, or combined with a later data segment. These are different data-consumption policies. Dividing every local mean by the configured $A$ underweights an accepted partial window even when all its microbatch counts agree. A window with $Q_k=0$ has no token-mean objective; no finite replacement denominator makes it an observed zero loss.

[MATHEMATICALLY-DERIVED] Skipping an empty window must also specify whether parameters, moments, decay, scheduler state, and update counters advance. An optimizer transition with zero data gradient can still change parameters through existing momentum or weight decay. Thus “no targets” and “an accepted zero-gradient update” are different states. The exact checkpoint transition is owned by §19.4; the batch contract must distinguish them before that transition is implemented.

### Additivity is a substantive restriction

[MATHEMATICALLY-DERIVED] For a contrastive row with positive score $z_{ii}$ and candidate set $\mathcal C$, the loss is $-z_{ii}+\log\sum_{j\in\mathcal C}\exp z_{ij}$. Partitioning candidates changes the log-sum-exp, not just the outer reduction. If $z_{ii}=0$ and one negative also has score zero, the two-candidate loss is $\log2$; a singleton candidate loss is zero. Accumulating independent singleton batches cannot recreate that missing negative interaction.

[PAPER-REPORTED] CLIP's method constructs a matrix of image–text similarities within the batch and applies symmetric pairing losses. The candidate-set coupling is explicit in its method and Figure 3. The paper supplies the objective structure; the singleton counterexample above is a book derivation. [P44], §2.3 and Figure 3.

[MATHEMATICALLY-DERIVED] The same partition-invariance premise must be rechecked for batch-statistic normalization, batch-dependent routing penalties, cross-example attention, and sampling procedures that change when a batch is repartitioned. Holding the optimizer-step sequence count constant cannot establish equality of these forward computations. An exact emulation must reconstruct the required shared statistics or interactions and their gradient paths.

## Algorithm

**Algorithm 19.2 — Token-mean accumulation at fixed parameters.** [DERIVED] Input: a finite, validated window $\mathcal W_k=(\mathcal M_1,\ldots,\mathcal M_A)$, parameters $\theta_k$, optimizer state $o_k$, and a pure optimizer map $\mathcal U$. Output: a candidate accepted state or a rejection state. Masks are parameter-independent; every loss is additive over its declared targets. Let $\kappa>0$ be a constant numerical loss scale for the whole window and $c_{\mathrm{clip}}>0$ the declared norm threshold. $\operatorname{finite}$ tests every coordinate. The mathematical procedure is an explanatory reconstruction, not an executed trainer.

$$
\begin{aligned}
1.\quad &Q_k\gets\sum_{a,i,t}m_{ait},\quad G_0\gets0,\quad H_0\gets0.\\
2.\quad &Q_k=0\ \Longrightarrow\
 (\theta_{k+1},o_{k+1},\mathrm{status})\gets
 (\theta_k,o_k,\mathrm{empty}).\\
3.\quad &a=1,\ldots,A:\quad
 s_a\gets\sum_{i,t}m_{ait}\ell_{ait}(\theta_k),\\
 &\hspace{38mm}G_a\gets G_{a-1}+\nabla_\theta(\kappa s_a/Q_k),\quad
 H_a\gets H_{a-1}+s_a.\\
4.\quad &g_k\gets G_A/\kappa,\quad \mathcal L_k\gets H_A/Q_k.\\
5.\quad &\neg\operatorname{finite}(\mathcal L_k,g_k)
 \ \Longrightarrow\
 (\theta_{k+1},o_{k+1},\mathrm{status})\gets
 (\theta_k,o_k,\mathrm{nonfinite}).\\
6.\quad &\widehat g_k\gets
 \frac{g_k}{\max(1,\lVert g_k\rVert_2/c_{\mathrm{clip}})}.\\
7.\quad &(\theta^+,o^+)\gets\mathcal U(\theta_k,o_k,\widehat g_k).\\
8.\quad &(\theta_{k+1},o_{k+1},\mathrm{status})\gets
 \begin{cases}
 (\theta^+,o^+,\mathrm{accepted}),&\operatorname{finite}(\theta^+,o^+),\\
 (\theta_k,o_k,\mathrm{rejected}),&\text{otherwise}.
 \end{cases}
\end{aligned}
$$
*(Eq. 19.7)*

[MATHEMATICALLY-DERIVED] The implications in lines 2 and 5 terminate the procedure immediately. For a nonempty, finite window, induction gives the invariant $G_a=\kappa Q_k^{-1}\sum_{j\leq a}\nabla s_j(\theta_k)$; line 4 therefore returns Eq. 19.4. Line 6 clips once after accumulation. Clipping each microbatch separately computes a sum of nonlinear transforms and generally gives a different result. Line 8 describes an acceptance contract; an in-place engine needs a restoration mechanism to provide the same rejection semantics.

```figure
id: fig-19.4
kind: diagram
title: One optimizer window and its acceptance boundary
caption: >-
  Parameters remain fixed across all microbatch gradients. Normalization
  uses the window count; unscaling and clipping occur once after accumulation.
  Empty or invalid windows do not enter the accepted parameter transition.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-19.7
concepts: [ms.section.19.2]
alt: >-
  The window supplies valid-target counts and microbatch loss sums. Counts
  determine one denominator. Gradients accumulate at fixed parameters,
  then unscale and pass a finite check. Valid gradients are clipped once
  and enter the candidate update; invalid gradients leave parameters unchanged.
spec:
  direction: TB
  nodes:
    - {id: window, kind: dataset, label: Optimizer window}
    - {id: count, kind: metric, label: Valid targets Q_k}
    - {id: gradient, kind: process, label: Accumulate at fixed theta}
    - {id: unscale, kind: process, label: Unscale once}
    - {id: check, kind: branch, label: Finite gradient}
    - {id: clip, kind: process, label: Clip once}
    - {id: update, kind: state, label: Candidate update}
    - {id: reject, kind: state, label: Reject without update}
  edges:
    - {from: window, to: count, kind: flow}
    - {from: window, to: gradient, kind: flow}
    - {from: count, to: gradient, kind: dependency}
    - {from: gradient, to: unscale, kind: flow}
    - {from: unscale, to: check, kind: flow}
    - {from: check, to: clip, kind: flow, label: valid}
    - {from: clip, to: update, kind: flow}
    - {from: check, to: reject, kind: flow, label: invalid}
```

[MATHEMATICALLY-DERIVED] Figure 19.4 separates the count dependency from the gradient path. Its candidate state corresponds to line 7; line 8 still checks the candidate before accepting it. The empty-window branch occurs before forward/backward and is specified in line 2. This distinction prevents the diagram from implying that a finite incoming gradient guarantees a finite optimizer output.

## Implementation

[OFFICIAL-DOCUMENTATION] In **PyTorch**, the Model / autograd framework layer, the AMP examples require a fixed loss scale while accumulating one effective batch, with unscaling after the accumulation is complete. The documented sequence performs clipping on unscaled gradients and updates the scaler at effective-batch granularity. These requirements support lines 3–6; the numerical scale $\kappa$ must not be confused with the statistical denominator $Q_k$. [R19.22], “Gradient accumulation” and “Gradient clipping.”

[OFFICIAL-DOCUMENTATION] In **TorchTitan**, the Distributed training layer, the inspected trainer collects microbatch groups and loss counts before training, while the loss interface accepts global loss-token counts. The pinned loss implementation divides its summed loss by supplied counts. These inspected surfaces demonstrate explicit count transport; they do not establish every engine's gradient-reducer semantics or executable compatibility. [R19.2], trainer count collection; [R19.3], loss-call interface.

[MATHEMATICALLY-DERIVED] For a local additive model, backward may release each microbatch's computation graph after adding its gradient. With $N$ trainable scalars, accumulator storage is $Nb_g$ bytes when gradients use $b_g$ bytes per scalar. The activation peak can then be the maximum microbatch activation footprint rather than the sum across the window. Pre-staging the window adds host storage proportional to its inputs, labels, masks, and metadata; a replayable two-pass iterator can count first but must reproduce the same masks and records.

[MATHEMATICALLY-DERIVED] The local accounting boundary includes $\sum_a F_a$ model forward/backward FLOPs, $O(AN)$ gradient-buffer additions for dense gradients, and $O(\sum_a B_aT_a)$ mask/count work. Accumulator writes alone are $\Omega(ANb_g)$ bytes in a naive dense implementation; actual traffic depends on fusion, sparsity, cache behavior, and dtype. Materialized vocabulary logits add $B_aT_aVb_{\mathrm{logit}}$ bytes for the current microbatch. Accumulation adds no model parameters and does not remove optimizer-state storage.

[MATHEMATICALLY-DERIVED] For conventional ring gradient all-reduce over $R_{\mathrm{dp}}>1$ participants and payload $P_g$ bytes, the idealized per-rank transferred bytes are $2(R_{\mathrm{dp}}-1)P_g/R_{\mathrm{dp}}$ per collective. Synchronizing once per window instead of every microbatch reduces that payload count from $A$ to one, subject to the reducer contract and retained buffers. This is byte accounting for a specified ring, not a latency prediction or a claim about an engine's selected algorithm. Count reduction has a separate, much smaller payload; its synchronization latency can still matter.

[NOT-DISCLOSED] Measured throughput, latency quantiles, power, energy, and monetary cost for this unexecuted reference procedure are unavailable. Useful throughput must use valid targets per second if that is the training event measure; processed positions per second measures a different denominator. Hardware, precision, shape distribution, kernel configuration, synchronization boundary, and optimizer time are required before either can support a performance comparison.

## Experimental design

### Reported experiments

[PAPER-REPORTED] DeepSeek-V3 reports increasing its pretraining batch from 3,072 to 15,360 during the first 469B tokens and then holding that batch size fixed. Its training settings include a 4K sequence length. Its long-context phases instead use sequence length and batch pairs of 32K/1,920 and 128K/480 for 1,000 steps each. These settings disclose distinct batch and context schedules; they do not provide a controlled test of the normalization identity. [P13], §4.2 “Training Hyper-Parameters” and §4.3.

[DERIVED] A report of batch scheduling cannot establish that a different trainer's accumulation is correct. The Hugging Face disclosure supplies an observed implementation failure and proposed correction, while PyTorch's examples specify an API ordering contract. Neither supplies a matched, multi-seed performance experiment across every combination of padding, weighting, precision, and distributed reduction. The appropriate local falsification is a gradient comparison at fixed parameters, followed by an optimizer-state comparison; the proposed protocol is in [verification.md](verification.md).

## Observations

**What the sources claim.** [OFFICIAL-DOCUMENTATION] The historical Transformers disclosure identifies incorrect averaging of batch means and gives total-target normalization as the correction for its affected token-level path. PyTorch documents scale consistency across an effective batch. [R19.23]; [R19.22].

**What the evidence shows.** [DERIVED] The inspected evidence establishes a disclosed bug mechanism and interface constraints. It does not demonstrate that a named installed release or arbitrary fused/distributed path passes the chapter's equivalence test. That requires a versioned execution check.

**What we infer.** [MATHEMATICALLY-DERIVED] A batch record needs the target measure, microbatch partition, counts, reduction operator, numerical scale, and accepted-update boundary. A single sequence-count field cannot reconstruct Eq. 19.4.

**What remains unknown.** [UNVERIFIED] The equivalence tolerance, reducer behavior, numerical error, and performance of the reader's selected engine/configuration remain unchecked. The book has not trained or benchmarked the proposed recipe.

## Failure modes

[MATHEMATICALLY-DERIVED] The observable symptoms below follow from violating the corresponding identity; their incidence in deployed systems is not asserted.

| Failure | Observable symptom | Required correction |
|---|---|---|
| Average of unequal-count means | Gradient changes when the same targets are repartitioned | Preserve sums and total valid-target count |
| Input count used after label shift | Reported target count exceeds actual scored positions | Count the aligned target mask |
| Rank means with unequal counts | Short-target ranks receive excess weight | Use the global count and actual reducer coefficient |
| Configured divisor for a partial window | Last accepted update has a reduced gradient scale | Use the actual window denominator |
| Clip before accumulation | Partition-dependent clipped update | Clip the final normalized gradient |
| Loss-scale change within a window | Gradient contributions carry incompatible scales | Hold the numerical scale fixed until completion |
| Candidate-set objective split independently | Required negatives disappear | Preserve the coupled objective and gradient paths |
| Empty target window enters optimizer | Decay or momentum changes parameters without scored data | Declare an explicit empty-window transition |

## Siblings

[MATHEMATICALLY-DERIVED] Ordinary large-batch execution and accumulation differ in graph lifetime and operator grouping while potentially preserving the same finite additive objective. Sequence averaging and token averaging differ in event measure. Dynamic padding and packing differ in physical representation; they preserve this section's objective only if attention visibility, positions, boundaries, and scoring masks are preserved. Increasing the optimizer-step batch differs from repartitioning an unchanged batch: it changes the sampled objective and usually the number of optimizer transitions per consumed token.

## Extensions

[OFFICIAL-DOCUMENTATION] The documented Transformers correction replaces a mean of batch means with a summed loss divided by the window's valid-target count. This removes the weighting error for the affected additive token objective without adding model parameters. The disclosure does not provide a benchmark from which to infer a speedup, and it does not establish support for every model class at a later release. [R19.23], correction and rollout discussion.

[MATHEMATICALLY-DERIVED] Auxiliary objectives extend the count from one scalar to a vector $\boldsymbol Q_k=(Q_{k1},\ldots,Q_{kh})$. For declared component weights $\omega_j$, the gradient becomes $\sum_j\omega_j\sum_a\nabla s_{aj}/Q_{kj}$ over present components. Pooling all counts replaces the intended component weights by event-count-dependent coefficients. The component construction is owned by §19.1; this section specifies its accumulation boundary.

## Limitations

[MATHEMATICALLY-DERIVED] Exact equivalence presumes identical per-event forward computations, fixed parameters, additive losses, parameter-independent masks/weights, and matching stochastic realizations. Floating-point addition is non-associative; different partitions can change numerical results even when the real-arithmetic identity holds. Matching a seed alone does not ensure identical dropout realizations under a different operator schedule. This section establishes a correctness contract, not a universal bitwise-reproducibility or generalization theorem.

## Reproducibility

[DERIVED] Retain ordered record identities, tokenizer/processor revision, label alignment, document boundaries, masks, target counts per sequence/microbatch/rank, final-window policy, weighting law, gradient-reducer operator, loss scale, accumulation dtype, clipping boundary, and optimizer-transition count. Compare gradients before clipping and parameters plus optimizer state after one accepted transition. Retain failed windows separately from accepted updates so a rejection cannot silently alter the data or schedule ledger.

[OFFICIAL-DOCUMENTATION] Documentation inspection used the PyTorch 2.14 page namespace on 2026-10-08; the online page contents are not commit-pinned. TorchTitan inspection used commit `dd4d4830c121aa5dc73ffeee85b1a5009bf91122`. Installed runtime compatibility and execution are UNVERIFIED, as recorded in the [reference ledger](references.md).

## References

[P13](references.md#p13), [P44](references.md#p44), [R19.2](references.md#r192), [R19.3](references.md#r193), [R19.20](references.md#r1920), [R19.21](references.md#r1921), [R19.22](references.md#r1922), [R19.23](references.md#r1923).
