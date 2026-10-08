---
id: ms.section.20.1
entity_type: section
title: Optimizer mechanics
short_title: Optimizer mechanics
volume: 1
part: 4
chapter: 20
section: 20.1
slug: 20-1-optimizer-mechanics
parent: ms.chapter.20
prev_sibling: null
next_sibling: ms.section.20.2
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

# 20.1 Optimizer mechanics

## Scope

[DERIVED] This section owns SGD/momentum, Adam/AdamW, factored Adafactor and finite matrix/Muon transitions. The baseline is an already normalized Chapter 19 gradient; success means an unambiguous parameter/state update with explicit persistent and temporary costs. It does not establish a universal optimizer ranking.

## Why this exists

[DERIVED] An optimizer is a state transition whose input is the gradient of a specified batch objective, not merely a formula that subtracts a learning rate. Two implementations bearing the same name can disagree because they initialize momentum differently, place epsilon differently, partition matrices differently, or advance counters on different events. The unit of comparison here is one accepted update with parameters, persistent statistics, parameter groups and numerical policy specified. Batch construction belongs to Chapter 19; conversion and accumulation contracts belong to Chapter 03.

## Intuition

[MATHEMATICALLY-DERIVED] A scalar rate cannot identify an update when the direction itself changes. Adam divides coordinates by estimated magnitudes; Adafactor compresses that statistic; a polar-style direction changes singular-value weighting. The map from gradient to direction and the map from direction to parameter displacement must therefore be inspected separately.

## Formulation

| Symbol | Meaning and domain |
|---|---|
| $g_k,\theta_k$ | Objective-normalized gradient and parameters at accepted update $k$; matching tensor shapes |
| $a_k,v_k$ | First and second raw moment arrays; $v_k\ge0$ in exact arithmetic |
| $\eta_k,\omega$ | Nonnegative learning rate and decoupled decay coefficient in Eq. 20.2 |
| $r,c,J$ | Matrix rows, columns and prescribed finite transform iterations |
| $R_i,C_j$ | Row and column sums of a nonnegative second-moment matrix |
| $\epsilon,\beta_1,\beta_2$ | Positive denominator guard; moment coefficients in $[0,1)$ |

[MATHEMATICALLY-DERIVED] Let $g_k=\nabla_\theta\mathcal L_k(\theta_{k-1})$ be the already normalized and synchronized gradient at accepted update $k$. The scalar learning rate $\eta_k$ has units of parameter change per unit update direction; its numerical value is meaningful only with that direction's normalization. Write $\theta_k=\theta_{k-1}-\eta_k u_k$ and retain the optimizer state $s_k$ needed to construct $u_k$. The index $k$ counts optimizer updates, whereas tokens consumed $D$ and attempted batches are separate clocks. A rejected nonfinite batch need not advance all three clocks together.

[OFFICIAL-DOCUMENTATION] Plain SGD uses $u_k=g_k$. A commonly used momentum convention is $v_k=\mu v_{k-1}+g_k$ followed by $u_k=v_k$; the exponentially normalized convention multiplies the new gradient by $1-\mu$ and therefore changes the effective learning rate. PyTorch's documented SGD initializes its first momentum buffer from the first gradient rather than from zero followed by a dampened update. Its dampening starts on the second step. The alternative convention that inserts the learning rate inside the buffer agrees under some constant-rate reparameterizations but differs when the rate changes. Reproducing an SGD baseline requires the convention and initial state, not just $\mu$. [R20.22]

[PAPER-REPORTED] Adam maintains first and second raw moments, rather than a centered variance estimate. Its paper's Algorithm 1 gives

$$
a_k=\beta_1 a_{k-1}+(1-\beta_1)g_k,\qquad
v_k=\beta_2 v_{k-1}+(1-\beta_2)g_k^{\odot2},
$$
$$
\widehat a_k=\frac{a_k}{1-\beta_1^k},\qquad
\widehat v_k=\frac{v_k}{1-\beta_2^k},\qquad
u_k=\frac{\widehat a_k}{\sqrt{\widehat v_k}+\epsilon}.
$$
*(Eq. 20.1)*

[MATHEMATICALLY-DERIVED] All operations in Eq.20.1 are coordinatewise; $a_k,v_k$ have the parameter's shape. Expanding $v_k$ gives $(1-\beta_2)\sum_{j=1}^k\beta_2^{k-j}g_j^{\odot2}$. Division by $1-\beta_2^k$ removes the missing mass caused by zero initialization. It does not make the estimate equal to the current moment under an arbitrarily changing gradient distribution. The recurrence has a characteristic memory measured in updates, approximately $1/(1-\beta_2)$ for $\beta_2$ near one. Changing batch size changes how many tokens that memory spans. [R20.1]

## Mechanism

### Methodology: Decoupled decay changes the transition

[PAPER-REPORTED] AdamW separates shrinkage from the adaptive gradient transform. In the learning-rate-coupled convention used by the inspected PyTorch API, write the coefficient as $\omega$ to distinguish it from the book's loss-mixture symbol:

$$
\theta_k=(1-\eta_k\omega)\theta_{k-1}-\eta_k u_k.
$$
*(Eq. 20.2)*

[MATHEMATICALLY-DERIVED] Adding an L2 penalty instead replaces the input gradient by $g_k+\omega\theta_{k-1}$, altering both moment recurrences and applying the adaptive denominator to the regularizer. Even with a fixed diagonal preconditioner $P$, shrinkage becomes $\eta_k\omega P\theta$ rather than uniform $\eta_k\omega\theta$. Thus decoupling is an algebraic change, not a naming preference. The original AdamW paper also parameterizes decay with a separate schedule multiplier; its coefficient cannot be copied into a framework without identifying which factor multiplies it. [R20.2], [R20.19]

[MATHEMATICALLY-DERIVED] If all data gradients vanish and the first-moment state is zero, cumulative decay in Eq.20.2 is exactly $\prod_j(1-\eta_j\omega)$ times the initial parameter. For small positive $\eta_j\omega$, its logarithm is approximately $-\omega\sum_j\eta_j$. Matching final learning rates does not match total shrinkage. Changing the schedule, batch size, update count or exclusion list changes the regularization trajectory even when the displayed decay coefficient stays fixed. When $\eta_j\omega>1$, the factor changes sign; usual shrinkage reasoning presumes a nonnegative factor.

### Adafactor approximates statistics, then controls the update

[PAPER-REPORTED] For a matrix $W\in\mathbb R^{r\times c}$, Adafactor replaces a full second-moment array by row sums $R$ and column sums $C$. Its nonnegative rank-one reconstruction is

$$
\widetilde V_{ij}=\frac{R_i C_j}{\sum_a R_a}.
$$
*(Eq. 20.3)*

[MATHEMATICALLY-DERIVED] When $R_i=\sum_j V_{ij}$ and $C_j=\sum_i V_{ij}$, Eq.20.3 preserves both marginals: summing across columns returns $R_i$. Because summation is linear, the marginals can be exponentially updated without materializing the full $V$. This saves state while losing interactions between row and column identities. It is exact for a rank-one nonnegative moment matrix, not for a general matrix. A zero total requires the stated epsilon regularization; an unguarded ratio is undefined. [R20.3]; section 3

[PAPER-REPORTED] The paper's final matrix algorithm adds $\epsilon_1$ to squared gradients, uses a time-varying second-moment coefficient starting at zero, forms $U=G/\sqrt{\widetilde V}$, and clips the RMS of this *preconditioned update* by $U/\max(1,\operatorname{RMS}(U)/d)$. Its absolute step is $\rho_k\max(\epsilon_2,\operatorname{RMS}(W))$. Vectors retain an unfactored second moment. Removing first momentum is necessary for the full sublinear-state claim; adding an $r c$ momentum buffer restores linear persistent storage. Gradient clipping before the denominator is a different operation from this update clipping. [R20.3]; Algorithms 4-6

### Muon transforms matrix directions

[PAPER-REPORTED] Muon acts on eligible hidden weight matrices. If a momentum matrix has thin singular decomposition $M=U\Sigma V^\top$, its idealized polar direction is $UV^\top$, retaining singular vectors while replacing nonzero singular values by one. This is the maximizer of $\langle M,A\rangle_F$ over the spectral-norm unit ball, with nonunique extensions on null spaces. The actual method approximates a spectral transform using a finite polynomial iteration, not an exact SVD at each step. The originating implementation and later scaled recipe differ in momentum/Nesterov conventions and shape scaling. [R20.4], [R20.30]

[MATHEMATICALLY-DERIVED] With $X_0=M/(\|M\|_F+\epsilon)$ and the smaller Gram orientation, an iteration has the form $X_{j+1}=aX_j+bX_jX_j^\top X_j+c(X_jX_j^\top)^2X_j$. Each singular value follows the scalar polynomial $p(z)=az+bz^3+cz^5$. A zero singular value remains zero. Finite iterations need not map every positive singular value to one, and coefficients optimized for a few iterations need not converge under indefinite repetition. Calling the returned matrix exactly orthogonal discards the implemented algorithm's approximation. A zero momentum input needs an explicit denominator guard.

[PAPER-REPORTED] Moonlight's scalable variant adds decoupled decay and multiplies the transformed matrix by $0.2\sqrt{\max(r,c)}$. For an exact rank-$q$ polar factor with $q=\min(r,c)$, $\|UV^\top\|_F^2=q$, so its entry RMS is $1/\sqrt{\max(r,c)}$; the shape multiplier would produce RMS 0.2. The derivation explains that calibration's rectangular-matrix correction. Finite Newton-Schulz output does not satisfy this identity exactly. Embeddings, readouts and scalar/vector parameters follow separately specified optimizers; two-dimensional shape alone does not establish semantic eligibility. [R20.4]; sections 2.2-3.1

```figure
id: fig-20.1
kind: diagram
title: Optimizer transforms and persistent state
caption: State arrays and update transforms belong to different mechanisms. Master parameters and temporary workspace are separate from optimizer statistics.
placement: inline
evidence: DERIVED
source: [R20.1, R20.3, R20.4]
alt: A normalized gradient feeds SGD, Adam, Adafactor or Muon. Each uses its own persistent state, then rate and decay produce a candidate update.
spec:
  direction: TB
  nodes:
    - {id: g, kind: node, label: normalized gradient}
    - {id: sgd, kind: process, label: SGD or momentum}
    - {id: adam, kind: process, label: elementwise moments}
    - {id: ada, kind: process, label: factored second moment}
    - {id: mu, kind: process, label: finite matrix transform}
    - {id: update, kind: node, label: calibrated candidate update}
  edges:
    - {from: g, to: sgd}
    - {from: g, to: adam}
    - {from: g, to: ada}
    - {from: g, to: mu}
    - {from: sgd, to: update}
    - {from: adam, to: update}
    - {from: ada, to: update}
    - {from: mu, to: update}
```

[MATHEMATICALLY-DERIVED] For statistic storage width $b_s$ bytes, persistent array payloads are

$$
M_{\mathrm{Adam}}=2Nb_s,\qquad M_{\mathrm{momentum}}=Nb_s.
$$
*(Eq. 20.12)*

[MATHEMATICALLY-DERIVED] For one eligible matrix without first momentum, the full-to-factored second-moment entry ratio is

$$
\kappa_{\mathrm{state}}=\frac{rc}{r+c}.
$$
*(Eq. 20.13)*

```figure
{
  "id": "fig-20.2",
  "kind": "calculator",
  "title": "Persistent optimizer arrays",
  "caption": "Analytical array payload only. Parameters, gradients, master weights, activations, workspace and sharding are excluded; the model is illustrative.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-20.12",
  "alt": "At one billion parameters and four bytes per statistic, Adam moments use eight billion bytes and one momentum array uses four billion bytes.",
  "states": [
    {
      "anchor": "formulation",
      "label": "Array count",
      "variables": {
        "N": 1000000000
      },
      "note": "Two full statistics versus one; persistent payload only."
    },
    {
      "anchor": "mechanism",
      "label": "Larger parameter count",
      "variables": {
        "N": 4000000000
      },
      "note": "State grows linearly; this does not predict total training memory."
    }
  ],
  "spec": {
    "tex": "M_{\\mathrm{Adam}}=2Nb_s,\\quad M_{\\mathrm{momentum}}=Nb_s",
    "equation": "20.12",
    "inputs": [
      {
        "symbol": "N",
        "label": "parameters",
        "default": 1000000000,
        "min": 1000000,
        "max": 100000000000,
        "format": "params",
        "scale": "log10"
      },
      {
        "symbol": "bs",
        "label": "bytes per statistic",
        "default": 4,
        "min": 2,
        "max": 8,
        "format": "bytes",
        "options": [
          2,
          4,
          8
        ]
      }
    ],
    "outputs": [
      {
        "symbol": "Adam",
        "label": "Adam moments",
        "formula": "2*N*bs",
        "format": "bytes",
        "emphasis": true
      },
      {
        "symbol": "Momentum",
        "label": "one momentum array",
        "formula": "N*bs",
        "format": "bytes",
        "emphasis": false
      }
    ]
  }
}
```

```figure
{
  "id": "fig-20.3",
  "kind": "calculator",
  "title": "Factored second-moment compression",
  "caption": "This compares one full second-moment statistic with row/column sums. Adding full first momentum restores linear state; no measured memory saving is asserted.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-20.13",
  "alt": "The illustrative 4096 by 16384 matrix has 67108864 full entries versus 20480 factored entries, a ratio of 3276.8.",
  "spec": {
    "tex": "\\kappa_{\\mathrm{state}}=\\frac{rc}{r+c}",
    "equation": "20.13",
    "inputs": [
      {
        "symbol": "rows",
        "label": "matrix rows",
        "default": 4096,
        "min": 64,
        "max": 16384,
        "format": "integer",
        "scale": "log2"
      },
      {
        "symbol": "cols",
        "label": "matrix columns",
        "default": 16384,
        "min": 64,
        "max": 65536,
        "format": "integer",
        "scale": "log2"
      }
    ],
    "outputs": [
      {
        "symbol": "Full",
        "label": "full statistic entries",
        "formula": "rows*cols",
        "format": "integer",
        "emphasis": false
      },
      {
        "symbol": "Factored",
        "label": "factored entries",
        "formula": "rows+cols",
        "format": "integer",
        "emphasis": false
      },
      {
        "symbol": "Ratio",
        "label": "full / factored",
        "formula": "rows*cols/(rows+cols)",
        "format": "ratio",
        "emphasis": true
      }
    ]
  }
}
```

## Algorithm

[DERIVED] This reconstruction separates pure candidate construction from acceptance. It specifies correctness semantics; it is not a claim that existing fused optimizers allocate a complete candidate copy.

### Algorithm 20.1 — One accepted optimizer transition

[DERIVED] Inputs are the synchronized gradient $g$, current state $X=(\theta,s,k,z)$, disjoint parameter groups $\{\mathcal P_j\}$, and group policies $\psi_j$. Here $z$ is the declared schedule clock. The group maps $\mathcal M_j$ and $\mathcal U_j$ are respectively the exact statistic recurrence and direction transform defined above, including initialization, epsilon, finite iterations and calibration. A post-update constraint is $\mathcal C_j$, the identity when absent. Candidate construction is pure with respect to persistent state:

$$
\begin{aligned}
\text{(1)}\quad &\bigsqcup_j\mathcal P_j=\mathcal P,\qquad
 f_0=\mathbf1\{g\text{ is finite and shape-compatible}\};\\
\text{(1a)}\quad &f_0=0\ \Longrightarrow\ \operatorname{return}(X,0);\\
\text{(2)}\quad &(\eta_j,\omega_j)=\psi_j(z),\qquad
 s_j^{+}=\mathcal M_j(s_j,g_j;k+1);\\
\text{(3)}\quad &u_j=\mathcal U_j(g_j,s_j^{+}),\qquad
 \theta_j^{+}=\mathcal C_j((1-\eta_j\omega_j)\theta_j-\eta_j u_j);\\
\text{(4)}\quad &a=f_0\prod_j\mathbf1\{(s_j^{+},\theta_j^{+})\in\mathcal V_j\};\\
\text{(5)}\quad &X_{\mathrm{out}}=
 \begin{cases}(\theta^{+},s^{+},k+1,z+\delta_z),&a=1,\\X,&a=0.\end{cases}
\end{aligned}
$$

[DERIVED] $\mathcal V_j$ specifies candidate finiteness and any additional declared checks; $\delta_z$ is the accepted clock increment. Failure of the group partition or $f_0=0$ returns $(X,0)$ before evaluating any moment or direction map. Lines (2)-(5) have the explicit precondition $f_0=1$. The output is $(X_{\mathrm{out}},a)$ plus diagnostics. Every group commits together or none commits; scale-control and consumption clocks outside $X$ follow the explicit rejection policy in Chapter 19. Termination is one finite candidate evaluation, including $J$ prescribed polynomial iterations for Muon; elementwise work is $O(N)$ and matrix costs follow below. This acceptance specification does not assert transactional behavior for an arbitrary framework optimizer.

## Implementation

[DERIVED] Persistent optimizer payload for $N$ scalar parameters is zero extra arrays for plain SGD, $N$ for momentum and $2N$ for Adam moments, before counters or master parameters. With FP32 statistics this is $0,4N,8N$ bytes respectively. Factored Adafactor without first momentum stores $r+c$ statistics per eligible matrix and one per vector element; Muon stores one momentum array plus transformation workspace. Parameters, gradients, master copies, communication buffers and allocator overhead are separate terms of the shared training-memory identity. Reducing optimizer state can expose activation or communication memory as the new constraint rather than reduce total memory proportionally.

[MATHEMATICALLY-DERIVED] Adam and Adafactor each visit $O(N)$ elements per update. A matrix Muon transform with $q=\min(r,c)$, $p=\max(r,c)$ and $J$ iterations costs $\Theta(Jq^2p)$ arithmetic and needs Gram/work buffers. A square width-$d$ matrix therefore adds cubic optimizer arithmetic, whereas its forward/backward work scales with tokens processed. An optimizer that reduces required tokens can still increase step time. Full-matrix transformations also couple shards: independently orthogonalizing disjoint blocks defines a different algorithm. [R20.17]; section 2

[OFFICIAL-DOCUMENTATION] PyTorch is the reference-stack MODEL / AUTOGRAD FRAMEWORK layer. Its inspected 2.14 AdamW surface documents for-loop, foreach and fused paths; foreach can consume approximately one additional parameter-sized intermediate tensor list. Muon exposes finite iteration count, coefficients and distinct shape-scaling options, with the default not identical to Moonlight RMS matching. PyTorch Adafactor explicitly documents differences from the original paper in relative-rate cap and epsilon placement. An API name is insufficient to reproduce a paper setting. These are documentation inspections, not runtime compatibility tests. [R20.19]; [R20.20]; [R20.21]

## Experimental design

### Reported experiments

[PAPER-REPORTED] Adafactor's controlled translation study used Tensor2Tensor Transformers on WMT14 English-German, 100000 updates, approximately 4096 input and 4096 target tokens per batch, on one TPU v2. Table 2 varies factorization, first momentum, second-moment schedule, update clipping and relative step with/without warmup. This isolates statistic compression from the accompanying stability changes. Its final factored relative-step configuration reports 25.0/25.5 BLEU with/without warmup; plain factored Adam without those changes reports 25.4/0.2. Factorization alone is therefore not the demonstrated robust method. [R20.3]; sections 8-9/Table 2

[PAPER-REPORTED] Moonlight's shape-calibration ablation changes the MLP to a rectangular $[H,4H]$ projection and evaluates after 4B of a 20B-token schedule. Validation loss is 2.812 for the hidden-width-only baseline and 2.789 for both full update-RMS normalization and shape-adjusted learning rate. The authors select the latter for lower cost. These are within-study alternatives, not a universally optimal 0.2 RMS proof. Larger-scale efficiency evidence is analyzed in section 20.6. [R20.4]; Table 1

## Observations

### Observation 20.1 - State compression and geometry are distinct interventions

**What the paper claims.** [PAPER-REPORTED] Adafactor combines state compression with mechanisms controlling update size; Moonlight calibrates rectangular matrix updates. [R20.3]; [R20.4]

**What the evidence shows.** [PAPER-REPORTED] The Adafactor ablations retain a failed naive factored configuration alongside successful stabilized variants. Moonlight's calibration ablation separates its rectangular scaling change from the uncalibrated direction. These are distinct interventions. [R20.3]; Table 2; [R20.4]; Section 2

**What we infer.** [DERIVED] Compression changes the estimated denominator, whereas a polar-style transform changes singular-direction weighting. Training duration, epsilon, warmup, exclusions, and baseline tuning remain potential comparison confounders.

**What remains unknown.** [UNVERIFIED] The manuscript supplies no independent execution of these optimizers or confirmation that their reported gains transfer to a different architecture and state representation.

## Failure modes

[PAPER-REPORTED] Adam's original convergence argument cannot be promoted to an unconditional theorem. Reddi et al. construct bounded one-dimensional convex examples where exponential forgetting leads to nonvanishing regret, and introduce AMSGrad's running maximum second-moment statistic under stated convergence conditions. This is negative evidence against a blanket guarantee, not evidence that AMSGrad universally improves transformer pretraining. [R20.18]; sections 3-5

[DERIVED] Nonfinite second moments, duplicate parameter membership, a stale accepted-step counter, a zero factor denominator or a misoriented matrix can silently change later updates. Large gradients clipped to a finite norm do not guarantee finite squared moments or valid candidate parameters in every arithmetic path. Epsilon inside versus outside the square root changes its units and effect. Bias correction for scheduled coefficients uses their accumulated product, not a constant coefficient raised to the step count.

## Siblings

[DERIVED] On the axis of transformed direction and persistent state, plain SGD has no adaptive history; momentum smooths the direction with one array; AdamW uses two coordinatewise statistics; Adafactor compresses one statistic but adds update/relative-step controls; Muon couples eligible matrix coordinates through a finite spectral map. These mechanisms are defined in [this section](#mechanism). [Parameterization transfer](20-2-hyperparameter-scaling.md#mechanism) changes scale rules, while [clipping interventions](20-5-recovery-interventions.md#mechanism) regulate different quantities and cannot substitute for a specified optimizer.

## Extensions

### Improvements

[PAPER-REPORTED] Muon+ adds a row/column normalization after the finite spectral transform; its Algorithm 1 normalizes selected vector norms and uses its own shape multiplier. This generally changes the spectrum again, so it cannot simultaneously be described as preserving exact polar geometry. Its inspected May 2026 revision extends GPT- and Llama-style experiments to approximately 7B parameters, with separate longer-duration and selected five-seed studies; its gains remain attributed to those protocols. Spectral Scaling Laws of Muon instead studies when finite iterations fail to amplify small singular directions, motivating layer-dependent iteration budgets rather than an indiscriminate increase. [R20.15], [R20.16]

## Limitations

[DERIVED] Exact polar identities require the stated rank and exact arithmetic; finite polynomial output must be evaluated as its own direction. Factoring a second moment preserves selected marginals, not arbitrary coordinate correlations. State-byte identities omit workspace, master weights, sharding and execution overhead. Neither conditional convex theory nor a named-model ablation establishes a universal Transformer convergence guarantee.

## Reproducibility

[DERIVED] A recoverable optimizer record includes parameter names/shapes, grouping and exclusions, state dtypes, initialized versus absent buffers, coefficients, epsilon location, momentum convention, matrix orientation/blocking, finite-transform coefficients/iterations, rate calibration and counters. The chapter supplies equations and source reconstruction; no optimizer training run or distributed implementation has been executed for this manuscript. The next section explains why these representations must be fixed before hyperparameters can transfer.


## References

[P13](references.md) ? [R20.22](references.md) ? [R20.1](references.md) ? [R20.2](references.md) ? [R20.19](references.md) ? [R20.3](references.md) ? [R20.4](references.md) ? [R20.30](references.md) ? [R20.17](references.md) ? [R20.20](references.md) ? [R20.21](references.md) ? [R20.18](references.md) ? [R20.15](references.md) ? [R20.16](references.md)
