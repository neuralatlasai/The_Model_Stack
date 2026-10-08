---
id: ms.section.23.2
entity_type: section
title: LoRA mechanics
volume: 1
part: 4
chapter: 23
section: 23.2
slug: 23-2-lora-mechanics
parent: ms.chapter.23
prev_sibling: ms.section.23.1
next_sibling: ms.section.23.3
children: []
prerequisites: [ms.section.23.1, ms.chapter.19, ms.chapter.20]
downstream: [ms.section.23.3, ms.section.23.4, ms.section.23.5]
related: [ms.chapter.31, ms.chapter.40]
siblings_by_mechanism: [ms.section.23.1]
relations: [{type: supported_by, target: paper.P14}, {type: implemented_by, target: impl.hugging-face-peft}]
axes: {lifecycle: [adaptation, inference], mechanism: [low_rank_adaptation], feedback_setting: [], modality: [text]}
papers: [P14]
implementations: [impl.hugging-face-peft, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 23.2 LoRA mechanics

## Scope

**MATHEMATICALLY-DERIVED.** LoRA restricts each selected weight update to a factored matrix. This section reconstructs the forward and backward operators, zero-update initialization, rank/scaling interaction, target-module allocation, trainable-state accounting, and exact-arithmetic merge identity. It then separates three changes to that construction: rsLoRA scaling, LoRA+ optimizer groups, and DoRA magnitude/direction parameterization. RandLoRA provides a 2025 counterexample to equating parameter efficiency with a low-rank final update. Quantized operands and multi-model composition are treated in 23.3 and 23.4.

## Why this exists

**PAPER-REPORTED.** The originating LoRA method freezes $W_0$, trains two factors, initializes one factor randomly and the other to zero, and scales the added branch by $\alpha/r$. Selected attention projections are a source configuration, not a requirement that every architecture adapt only query/value matrices. [P14] (§4.1–4.2)

**MATHEMATICALLY-DERIVED.** The relevant restriction is $\operatorname{rank}(\Delta W)\le r$, not $\operatorname{rank}(W_0+\Delta W)\le r$. A full-rank base normally remains full-rank after a low-rank perturbation. LoRA therefore reduces trainable state without representing the entire deployed matrix in low rank. After merging, dense base storage remains $d_od_ib$ bytes for a projection with input width $d_i$ and output width $d_o$. Treating this as compression of the base confuses an update parameterization with a replacement representation.

## Intuition

**MATHEMATICALLY-DERIVED.** A factored branch first maps the input to $r$ coordinates and then reconstructs an output correction. Both factors are learned, so the input and output subspaces can move. At initialization, a zero output factor preserves the base function while a nonzero input factor exposes directions along which the output factor can start learning. Setting both factors to zero gives zero gradients to both in this bilinear parameterization. The initialization therefore fixes early optimization geometry as well as initial behavior.

## Formulation

**MATHEMATICALLY-DERIVED.** Use column-vector convention throughout this section. For $X\in\mathbb R^{d_i\times n_t}$ containing $n_t$ token positions, $W_0\in\mathbb R^{d_o\times d_i}$, $\mathsf A\in\mathbb R^{r\times d_i}$, and $\mathsf B\in\mathbb R^{d_o\times r}$:

$$
\begin{aligned}
Z&=\mathsf A X, &Y&=W_0X+s\mathsf BZ,\\
\Delta W&=s\mathsf B\mathsf A, &n_a&=r(d_i+d_o),\\
\nabla_{\mathsf B}\mathcal L&=sGZ^\top,
&\nabla_{\mathsf A}\mathcal L&=s\mathsf B^\top GX^\top,\\
\nabla_X\mathcal L&=W_0^\top G+s\mathsf A^\top\mathsf B^\top G,
&G&=\nabla_Y\mathcal L.
\end{aligned}
$$
*(Eq. 23.4)*

[DERIVED] Chain-rule reconstruction of the branch in [P14], Eq. 3.

**MATHEMATICALLY-DERIVED.** With $\mathsf B_0=0$, $\nabla_{\mathsf A}\mathcal L=0$ on the first backward pass while $\nabla_{\mathsf B}\mathcal L$ can be nonzero. This does not justify excluding $\mathsf A$ from the optimizer: later steps can make $\mathsf B$ nonzero. If the loss has no admitted targets, Chapter 19's empty-batch rule applies before either gradient is accepted.

$$
\begin{aligned}
n_{a,\mathcal J}&=\sum_{j\in\mathcal J}r_j(d_{i,j}+d_{o,j})+n_{\rm extra},\\
F_{a,\rm forward}&\simeq2n_t\sum_{j\in\mathcal J}r_j(d_{i,j}+d_{o,j}),\\
M_{a,\rm persistent}&=n_{a,\mathcal J}(b_a+b_g+b_m+b_v+b_{\rm master}).
\end{aligned}
$$
*(Eq. 23.5)*

**MATHEMATICALLY-DERIVED.** $\mathcal J$ is the exact target set; $n_{\rm extra}$ includes trained embeddings, heads, biases, or other saved modules. FLOPs use two operations per multiplication/addition and exclude dropout, casts, backward, base computation, and communication. Persistent memory uses the actual bytes of each stored state; absent master copies contribute zero. For one square width-4096 matrix at rank 16, the factors contain 131072 scalars, versus 16777216 in the base matrix: 0.78125% of that projection, before extras.

```figure
id: fig-23.5
kind: calculator
title: Low-rank branch accounting
caption: An illustrative projection calculation, not a named model. Added forward FLOPs and persistent task state exclude the frozen base, activations, backward, workspace and communication.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.5
alt: For input and output width 4096, rank 16 and 1024 token positions, one branch has 131072 trainable scalars and 268435456 added forward FLOPs. At sixteen persistent bytes per scalar its task state occupies two MiB.
states:
  - {anchor: formulation, label: One projection, highlight: [na], note: "Rank is a property of the update, not the whole base matrix."}
  - {anchor: mechanism, label: Added operators, highlight: [fa], note: Two branch matrix multiplications remain unless the artifact is merged.}
  - {anchor: failure-modes, label: Missing memory, highlight: [ma], note: "Total resident memory still includes base, activations and runtime reserve."}
spec:
  tex: n_a=r(d_i+d_o),\quad F_a=2n_tn_a
  equation: "23.5"
  inputs:
    - {symbol: di, label: input width, default: 4096, min: 256, max: 16384, scale: log2, format: integer}
    - {symbol: do, label: output width, default: 4096, min: 256, max: 65536, scale: log2, format: integer}
    - {symbol: r, label: adapter rank, default: 16, min: 1, max: 512, scale: log2, format: integer}
    - {symbol: nt, label: token positions, default: 1024, min: 1, max: 131072, scale: log2, format: tokens}
    - {symbol: bs, label: persistent bytes per scalar, default: 16, min: 2, max: 24, step: 1, format: integer}
  outputs:
    - {symbol: na, label: trainable scalars, formula: r*(di+do), format: params, emphasis: true}
    - {symbol: fa, label: added forward FLOPs, formula: 2*nt*na, format: flops}
    - {symbol: ma, label: persistent task state, formula: bs*na, format: bytes}
```

## Mechanism

**MATHEMATICALLY-DERIVED.** Target selection changes accessible interventions. Adapting a query projection changes attention queries; a value projection changes transported features; an MLP projection changes tokenwise transformations. Their actual sensitivity depends on the frozen model and task. Allocate equal total $n_a$ across competing target sets before attributing a difference to placement. For a grouped-query model, key/value widths need not equal query width; substituting $d_o=d_i$ for every target silently miscounts parameters and may load incorrectly shaped factors.

**MATHEMATICALLY-DERIVED.** Mergeability follows by distributivity:

$$
W_m=W_0+s\mathsf B\mathsf A,
\qquad W_mX=W_0X+s\mathsf B(\mathsf AX).
$$
*(Eq. 23.6)*

**MATHEMATICALLY-DERIVED.** Equality requires the same effective scale, orientation, bias, and deterministic operators; training dropout is disabled. Finite-precision evaluation can differ because multiplication and addition are reassociated, and storing $W_m$ introduces rounding. Merge exactly once against a pristine base. Adding the same correction twice realizes $W_0+2\Delta W$, not a repeatable export operation. A nonlinear or token-conditional adapter has different merge conditions.

**PAPER-REPORTED.** rsLoRA changes the scale to $s=\alpha/\sqrt r$. Its rank-limit result assumes zero $\mathsf B$, independent zero-mean input-factor entries with variance independent of rank, and specified moment stability. Its theorem does not guarantee monotonic task improvement at finite rank. LoRA+ retains the factored branch but assigns different learning rates to the two factors; its width-limit analysis assumes stable pretrained features and processed-gradient scaling. [R23.6] (Definition 3.1/Theorem 3.2); [R23.7] (§4, Algorithm 1)

**MATHEMATICALLY-DERIVED.** The distinction can be seen from a first SGD step with $\mathsf B_0=0$:

$$
\Delta W_1=-\eta_{\mathsf B}s^2GX^\top\mathsf A_0^\top\mathsf A_0.
$$
*(Eq. 23.7)*

**MATHEMATICALLY-DERIVED.** Under independent rows of $\mathsf A_0$ with covariance $\Sigma_A$, $\mathbb E[\mathsf A_0^\top\mathsf A_0]=r\Sigma_A$. The initial expected SGD correction scales with $\eta_{\mathsf B}s^2r$. Holding $\alpha$ fixed gives a factor proportional to $1/r$ for $s=\alpha/r$ and a rank-independent factor for $s=\alpha/\sqrt r$. This one-step derivation explains a confound in a rank sweep; it does not reproduce the full rsLoRA theorem or Adam dynamics. Changing rank, scale, initialization variance, and learning rate simultaneously prevents clean capacity attribution.

**MATHEMATICALLY-DERIVED.** LoRA+ changes the update map while preserving the forward representation. With processed optimizer directions $\widetilde g_{\mathsf A,u},\widetilde g_{\mathsf B,u}$ computed from the same pre-update state and ratio $\rho_\eta>0$, its grouped transition is

$$
\begin{aligned}
\mathsf A_{u+1}&=\mathsf A_u-\eta_{\mathsf A,u}\widetilde g_{\mathsf A,u},\\
\mathsf B_{u+1}&=\mathsf B_u-\rho_\eta\eta_{\mathsf A,u}\widetilde g_{\mathsf B,u},\qquad
\eta_{\mathsf B,u}=\rho_\eta\eta_{\mathsf A,u}.
\end{aligned}
$$
*(Eq. 23.31)*

[DERIVED] Grouped transition adapted from [R23.7], Algorithm 1.

**MATHEMATICALLY-DERIVED.** Moments, decay and scheduling belong to each declared group; an SGD derivation cannot be transferred unchanged to AdamW. Initialize and freeze the base as in Algorithm 23.2, advance both groups on the same accepted-update clock, stop at its finite cap, and export the same scale/factor contract. Nonfinite state rejects the complete candidate transition. The width-limit argument motivates unequal rates, while the finite task determines the useful ratio; $\rho_\eta=1$ recovers ordinary equal-rate optimization. A zero rate freezes one factor and changes the accessible optimization path.

**PAPER-REPORTED.** DoRA learns a magnitude vector and a low-rank directional correction, normalized columnwise. Its initialization preserves the pretrained weight; its implementation detaches the norm in the stated efficiency modification. The paper compares language, vision-language and image/video-text tasks, and reports improvements over its LoRA baselines. [R23.8] (§4, Eq. 5–7); §5

$$
W_D=(W_0+s\mathsf B\mathsf A)\operatorname{diag}\!\left(
\frac{m_j}{\|(W_0+s\mathsf B\mathsf A)_{:j}\|_2}\right),
\qquad m_{0,j}=\|(W_0)_{:j}\|_2.
$$
*(Eq. 23.8)*

[DERIVED] Column convention adapted from [R23.8], Eq. 5.

**MATHEMATICALLY-DERIVED.** $m\in\mathbb R^{d_i}$ adds $d_i$ trainable magnitudes in this convention. Implementations using transposed storage must normalize the corresponding opposite axis. A zero column norm is an explicit invalid boundary requiring a documented epsilon/handling rule. Normalization creates an additional representation/operator cost during training; after forming $W_D$, dense inference can use the merged tensor. Detaching the denominator changes the optimization gradient and must be recorded in reproduction metadata.

**MATHEMATICALLY-DERIVED.** For one nonzero direction column $v_j$, realized column $w_j=m_jv_j/\|v_j\|_2$ and incoming gradient $g_j=\nabla_{w_j}\mathcal L$, differentiation gives

$$
\begin{aligned}
\nabla_{m_j}\mathcal L&=g_j^\top v_j/\|v_j\|_2,\\
\nabla_{v_j}\mathcal L&=\frac{m_j}{\|v_j\|_2}
\left(I-\frac{v_jv_j^\top}{\|v_j\|_2^2}\right)g_j,\\
\nabla_{v_j}^{\mathrm{detached}}\mathcal L&=
\frac{m_j}{\operatorname{stopgrad}(\|v_j\|_2)}g_j.
\end{aligned}
$$
*(Eq. 23.32)*

[DERIVED] Full and detached cases reconstructed from [R23.8], Eq. 6–7, 11.

**MATHEMATICALLY-DERIVED.** The full gradient projects away the current normalized direction; the detached implementation omits that projector while recalculating the norm in each forward pass. Train $m,\mathsf A,\mathsf B$ jointly on Algorithm 23.2's bounded clock, check denominator validity before division, and merge the complete normalized weight rather than adding only $s\mathsf B\mathsf A$. Saving just LoRA factors loses the trained magnitudes.

```figure
id: fig-23.6
kind: diagram
title: A linear update and its merge
caption: The frozen and trainable paths share the same input. Algebraic merging removes the branch from inference, but retains a dense matrix of the original shape.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.6
alt: Input X reaches frozen W0 and trainable A. A produces rank-r coordinates, B maps them to output width, and scaling precedes addition to the frozen result. The alternative merged matrix is W0 plus sBA, with the original output-by-input shape.
spec:
  direction: TB
  nodes:
    - {id: x, kind: tensor, label: X, sub: input width by token positions}
    - {id: w, kind: model, label: Frozen W0, sub: output width by input width}
    - {id: a, kind: process, label: A projection, sub: input width to rank r}
    - {id: b, kind: process, label: B projection and scale, sub: rank r to output width}
    - {id: sum, kind: process, label: Add branch outputs}
    - {id: merge, kind: tensor, label: Merged dense weight, sub: Wm = W0 + sBA}
  edges:
    - {from: x, to: w}
    - {from: x, to: a}
    - {from: a, to: b}
    - {from: w, to: sum}
    - {from: b, to: sum, kind: emphasis}
    - {from: merge, to: sum, kind: dependency, label: equivalent linear map}
```

## Algorithm

### Algorithm 23.2 - Factor training and merge acceptance

**MATHEMATICALLY-DERIVED.** Algorithm 23.2 specifies artifact production for ordinary linear LoRA. Inputs are immutable $W_0$, target shapes, scale $s$, initializer $\mathsf I$, optimizer transition $\mathsf U$, maximum accepted updates $u_{\max}$, and numerical acceptance predicate $\mathsf Finite$. $z_u$ includes factors, optimizer state, RNG and training cursor. $\mathsf Probe$ compares the two paths on fixed inputs at a declared tolerance $\epsilon_p$.

$$
\begin{aligned}
1.\;&u\leftarrow0,\quad\mathsf A_0\leftarrow\mathsf I(r,d_i),\quad\mathsf B_0\leftarrow0,\\
&\omega_0\leftarrow\mathsf{InitOptimizer}(\mathsf A_0,\mathsf B_0),\
(\chi_0,\xi_0)\leftarrow\mathsf{InitCursorRNG}(\mathcal M),\
z_0\leftarrow(\mathsf A_0,\mathsf B_0,\omega_0,\chi_0,\xi_0,\mathcal M);\\
2.\;&u<u_{\max}:\quad
(X_u,\chi')\leftarrow\mathsf{Next}(\chi_u),\
Y_u\leftarrow W_0X_u+s\mathsf B_u\mathsf A_uX_u,\
G_u\leftarrow\nabla_Y\mathcal L_u,\
(g_{A,u},g_{B,u})\leftarrow\text{Eq. 23.4};\\
3.\;&\widetilde z\leftarrow\mathsf U(z_u,g_{A,u},g_{B,u},\chi');\\
4.\;&
\begin{cases}
(z_{u+1},u)\leftarrow(\widetilde z,u+1),&
\mathsf{Finite}(\widetilde z)\land\mathsf{BaseUnchanged}(W_0),\\
\operatorname{return}(\mathrm{rejected},z_u),&\text{otherwise};
\end{cases}\\
5.\;&u<u_{\max}\Rightarrow\operatorname{repeat}(2\text{--}4);\\
6.\;&W_m\leftarrow W_0+s\mathsf B_u\mathsf A_u;\\
7.\;&e_p\leftarrow\mathsf{Probe}(W_m,W_0,\mathsf A_u,\mathsf B_u,s);\\
8.\;&\operatorname{return}\begin{cases}(W_m,z_u,\mathcal M),&
\mathsf{Finite}(W_m,e_p)\land e_p\le\epsilon_p,\\
(\mathrm{export\ rejected},z_u),&\text{otherwise}.\end{cases}
\end{aligned}
$$
*(Eq. 23.9)*

**MATHEMATICALLY-DERIVED.** $\chi$ is the data cursor and $\xi$ the complete random state; $\omega$ includes initialized moments and the scheduler/scaler where used. The simultaneous tuple assignment in step 4 uses the old $u$ on its right-hand side and tests one unindexed candidate exactly once. The loop over steps 2-4 is skipped when $u_{\max}=0$. Invalid shapes/state, empty exhausted data or a bounded-operation timeout return rejection. The invariant is unchanged $W_0$ and merge from that tensor. Every iteration accepts or rejects, so the finite cap terminates. The probe covers fixed inputs, not task quality or another runtime. DoRA exports Eq. 23.8; token-conditional adapters cannot use this constant merge.

## Implementation

**OFFICIAL-DOCUMENTATION.** PEFT v0.21.0 LoraConfig documents rank/alpha patterns, target modules/parameters, rsLoRA, DoRA, initialization controls and modules saved outside adapters. Its documented support surfaces are operator-specific; a configuration flag is not evidence that every model/kernel/quantizer combination works. [R23.5] (LoraConfig)

**MATHEMATICALLY-DERIVED.** In the MODEL DEFINITION / ADAPTATION layer, map target names to actual Transformers operators, including fused query/key/value storage and transposed linear conventions. In the training graph, freezing $W_0$ removes its gradient GEMM but generally retains $W_0^\top G$ for upstream variables. Base forward and input-gradient work remain. For distributed adaptation, synchronize factors and all extras; sharding, optimizer offload, activation checkpointing and kernel fusion change distinct memory/traffic terms. The branch's low arithmetic size can increase launch overhead relative to useful FLOPs. An elapsed-time or energy reduction is UNVERIFIED without a timed workload and measurement boundary.

```figure
id: fig-23.7
kind: stat-panel
title: Rank sweep control variables
caption: A rank sweep changes optimization as well as capacity unless scaling, initialization and optimizer groups are controlled. Read the two scale formulas as alternatives, not measured performance.
placement: rail
anchor: implementation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.7
alt: At rank 16 and alpha 16, ordinary LoRA scale is one and rank-stabilized scale is four. The first-step expected SGD multiplier s squared times rank is sixteen versus 256 under fixed input-factor covariance.
spec:
  header: SCALE IS PART OF THE METHOD
  variables: {r: 16, alpha: 16}
  rows:
    - {key: ordinary scale, formula: alpha/r, format: fixed2}
    - {key: rank-stabilized scale, formula: alpha/sqrt(r), format: fixed2}
    - {key: ordinary s squared r, formula: alpha^2/r, format: fixed2}
    - {key: stabilized s squared r, formula: alpha^2, format: fixed2}
```

## Experimental design

**PAPER-REPORTED.** LoRA evaluates GLUE encoders and generation tasks including GPT-2 E2E and GPT-3 WikiSQL/SAMSum, with target/rank ablations and source-specific seed reporting. [P14] (§5–7, Tables 2–6) rsLoRA compares ranks on Llama 2/OpenOrca and tracks gradient norms; LoRA+ compares factor learning-rate ratios and baselines across language workloads. Their figures test optimization choices, not this book's hardware configuration. [R23.6] (§4, Figs. 2–3); [R23.7] (§5)

**PAPER-REPORTED.** LoRA+ sweeps both rates for RoBERTa/GPT-2 on GLUE and Llama-7B on MNLI/100k Flan-v2 examples; it reports repeated seeds and model/task-dependent optima. Its Llama MNLI setting offers little gain from unequal rates. The paper uses test-based selection in some reported plots; this chapter's proposed protocol instead reserves final tests. [R23.7] (§5.1–5.3, Fig. 6, Appendix C)

**PAPER-REPORTED.** DoRA combines eight commonsense training sets, evaluates their test sets separately, compares matched and halved rank with tuned learning rates, and ablates detached normalization on Llama/VL-BART. It reports improvements over its LoRA baselines; some baseline results are inherited from an earlier study rather than rerun controls. [R23.8] (§4.3, §5.1, Tables 1, 7–8)

**PAPER-REPORTED.** RandLoRA's ICLR 2025 study compares learned random-basis coefficients with LoRA, full tuning and other parameter-efficient baselines on vision, language and vision-language tasks. The supplement reports repeated GLUE runs and training-time/memory comparisons; full Llama3 tuning is absent from its memory baseline. [R23.16] (§5); supplement §B.1, §C.6.1, Table 10

## Observations

**What the paper claims.** **PAPER-REPORTED.** The inspected studies improve different restrictions: rank-dependent gradient scaling, unequal factor learning rates, magnitude/direction coupling, and the low-rank update ceiling. None establishes unconditional equivalence to full tuning. [R23.6] [R23.7] [R23.8]; [R23.16]

**What the evidence shows.** **UNVERIFIED.** No common benchmark reproduction across these variants was run for this edition. Their disclosed comparisons support their particular configurations; they do not establish a dated universal state-of-the-art ordering.

**What we infer.** **MATHEMATICALLY-DERIVED.** The counts, gradients and first-step scaling above require a multidimensional sweep. An apparently saturated rank curve can reflect optimization scaling rather than a demonstrated capacity ceiling.

**What remains unknown.** **NOT-DISCLOSED.** The original studies do not disclose the outcome of the chapter's matched-quality resident-memory protocol on its still-unspecified execution environment.

## Failure modes

**MATHEMATICALLY-DERIVED.** A both-zero initializer stalls the bilinear branch; an incorrect scale creates a systematic output discrepancy; a mismatched transpose breaks shape or parity checks; duplicated merging doubles the correction. Large factor norms with small product norm can also create numerical sensitivity: $(c\mathsf B)(\mathsf A/c)$ represents the same update for nonzero $c$, while optimizer state and rounding differ. Inspect product norm, factor norms, and actual function changes separately. Low training loss does not rule out retention loss on $\mathcal D_r$.

## Siblings

**MATHEMATICALLY-DERIVED.** rsLoRA changes $s$, LoRA+ changes the optimizer's two group rates, and DoRA changes the realized weight map. These choices are mathematically distinct and can interact. A gradient low-rank projection method that eventually updates all base coordinates is not the same fixed-rank artifact; its canonical training-memory treatment belongs to Chapters 20 and 29. Quantization is an independent representation choice.

## Extensions

**PAPER-REPORTED.** RandLoRA uses fixed random matrices and learned diagonal scalings, sharing an input-side random matrix in the efficient construction. Its update is a sum of low-rank terms rather than one learned low-rank product. [R23.16] (§4.1–4.3, Eq. 3–5)

$$
\Delta W_R=\sum_{j=1}^{n_b}\mathsf B_j\Lambda_j\mathsf A\Gamma_j,
\quad n_b=d_i/r,\quad n_R=n_b(r+d_i),\quad
\operatorname{rank}(\Delta W_R)\le\min(d_o,d_i,n_br).
$$
*(Eq. 23.10)*

[DERIVED] Divisible-width case adapted from [R23.16].

**MATHEMATICALLY-DERIVED.** $\mathsf B_j\in\mathbb R^{d_o\times r}$ and shared $\mathsf A\in\mathbb R^{r\times d_i}$ are frozen; diagonal $\Lambda_j,\Gamma_j$ supply $r+d_i$ learned scalars per basis term. The sum can reach full rank when the realized scaled row/column spaces are sufficiently independent; the rank upper bound alone does not prove that training finds useful directions. Unlike ordinary LoRA, increasing basis rank while keeping $n_b=d_i/r$ reduces learned coefficient count. Initialize coefficients so the complete correction is zero, retain the exact random bases or their verified generation state, differentiate only through coefficients, and merge the final sum once. Frozen-basis storage and repeated products must be included in memory and compute; fewer learned scalars do not make the random operators free. The theorem's per-term approximation premise in the source is a condition, not a guarantee that arbitrary random bases approximate any desired update well.

**MATHEMATICALLY-DERIVED.** Writing learned diagonals as coefficient vectors $\lambda_j,\gamma_j$, an explanatory zero-correction initialization and ordered transition are

$$
\begin{aligned}
\lambda_{j,0}&=0,\quad\gamma_{j,0}=\mathbf1,\quad
\omega_0=\mathsf{InitOptimizer}(\{\lambda_j,\gamma_j\});\\
(\lambda,\gamma,\omega)_{u+1}
&=\mathsf U((\lambda,\gamma,\omega)_u,
\nabla_{\lambda,\gamma}\mathcal L(W_0+\Delta W_R)),\qquad u<u_{\max};\\
\mathsf A_{u+1}&=\mathsf A_u,\quad
\mathsf B_{j,u+1}=\mathsf B_{j,u},\quad
W_{\mathrm{export}}=W_0+\Delta W_{R,u_{\max}}.
\end{aligned}
$$
*(Eq. 23.33)*

[DERIVED] Book initialization/transition reconstruction.

**MATHEMATICALLY-DERIVED.** Zero coefficients on one side avoid a nonzero initial correction; setting both diagonal vectors to zero would stall their bilinear term. Reject nonfinite candidates and invalid nondivisible basis layouts, or declare a padded construction explicitly. The source's implementation choices are not implied by this illustrative initializer.

## Limitations

**MATHEMATICALLY-DERIVED.** Matrix approximation error and task quality are different quantities. A high-rank update can have low effective spectral diversity, and a low-rank update may suffice for one task. A rank argument establishes representational possibilities or impossibilities under fixed targets; it does not establish generalization, retention, or runtime speed. Merge parity must be rechecked after any quantization or change of kernel.

## Reproducibility

**UNVERIFIED.** Preserve target tensor names/shapes/orientations, factor dtypes, scale formula, initializer seed, optimizer groups, dropout, extra trainable modules, merged/unmerged hashes, and probe outputs. For DoRA retain normalization axis and detach behavior; for RandLoRA retain basis state and coefficient initialization. All implementation claims here come from documentation inspection, not local training or source execution. [The ledger](references.md) records the inspected surfaces and access date.

## References

- [P14](references.md#p14) — LoRA.
- [R23.5](references.md#r235) — PEFT LoRA configuration.
- [R23.6](references.md#r236) — rsLoRA.
- [R23.7](references.md#r237) — LoRA+.
- [R23.8](references.md#r238) — DoRA.
- [R23.16](references.md#r2316) — RandLoRA and archival supplement.
