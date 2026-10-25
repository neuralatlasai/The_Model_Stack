---
id: ms.section.58.2
entity_type: section
title: "Objectives"
volume: 3
part: 10
chapter: 58
section: 58.2
slug: 58-2-objectives
parent: ms.chapter.58
prev_sibling: ms.section.58.1
next_sibling: ms.section.58.3
children: []
prerequisites:
  [
    ms.chapter.4,
    ms.chapter.18,
    ms.chapter.25,
    ms.chapter.26,
    ms.chapter.27,
    ms.chapter.28,
    ms.chapter.37,
    ms.chapter.38,
    ms.chapter.39,
    ms.chapter.40,
    ms.chapter.41,
    ms.chapter.55,
    ms.chapter.56,
    ms.chapter.57,
  ]
downstream: [ms.chapter.59, ms.chapter.60]
related: [ms.chapter.42, ms.chapter.48, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [pretraining, inference, evaluation],
    mechanism: [multimodal_generation, predictive_representation, control],
    feedback_setting: [],
    modality: [image, text, audio, video],
  }
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: { maturity: active, disputed: false }
evidence_summary:
  {
    labels_used:
      [
        DERIVED,
        MATHEMATICALLY-DERIVED,
        PAPER-REPORTED,
        OFFICIAL-DOCUMENTATION,
        ASSUMED,
        NOT-DISCLOSED,
        UNVERIFIED,
      ],
    empirically_observed: false,
  }
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 58.2 Objectives

## Scope

[DERIVED] This section distinguishes a modeled distribution, a training objective and an inference algorithm. Autoregression specifies a factorization. Gaussian denoising and score estimation specify noisy prediction tasks. Flow matching regresses a transport velocity. Masked discrete generation learns categorical reconstruction under a corruption process. A transformer can implement any of these; the backbone name does not identify the objective. The acceptance rule is accurate conditional generation under the same information and resource constraints, with numerical and statistical approximations made explicit.

## Why this exists

[DERIVED] Comparing a token cross-entropy with a latent MSE is meaningless without their variables, reductions and downstream decoders. Low latent MSE can coexist with poor decoded text; good categorical likelihood can coexist with expensive sequential sampling. A masked training objective does not automatically provide an exact joint likelihood, and a flow model's external fluency score is not its own log likelihood. These distinctions determine which evaluations and accelerations are admissible.

## Intuition

> **Definition — Endpoint-to-velocity conversion.** [DERIVED] The path-dependent transformation from a predicted clean state to a transport field, including its singular or clipped endpoint behavior.

> **Definition — Hybrid absorbing state.** [DERIVED] A categorical corruption endpoint mixing source-code anchors with mask states; unresolved status is tracked independently of token value.

[DERIVED] A generative objective makes one prediction tractable: the next symbol given a prefix, a clean state given a corrupted state, or a velocity along an interpolating distribution. Inference assembles many such predictions into an output. The assembly can introduce errors absent from teacher-forced training: generated prefixes, finite integration steps, greedily committed discrete positions and altered guidance all change the visited state distribution.

## Formulation

[MATHEMATICALLY-DERIVED] For visual code sequence $c_{1:n}$, condition $a$ and a chosen ordering $\pi$, the chain rule and its per-position training objective are

$$
p_\theta(c|a)=\prod_{j=1}^{n}
p_\theta(c_{\pi(j)}|c_{\pi(<j)},a),\qquad
\mathcal J_{\rm AR}=-\mathbb E\frac1n\sum_{j=1}^{n}
\log p_\theta(c_{\pi(j)}|c_{\pi(<j)},a).
$$

_(Eq. 58.4)_

[DERIVED] Chapter 04 owns categorical likelihood and [Chapter 37](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/README.md) owns autoregressive decoding. Here the consequence is that exact ancestral sampling has $n$ dependent symbol decisions unless an independently justified grouping or speculative mechanism changes the execution. Parallel teacher forcing does not remove those inference dependencies. Changing raster order to scale/chunk order changes the conditional variables and can also change the approximation class.

[MATHEMATICALLY-DERIVED] To compare continuous objectives, fix a differentiable scalar path $z_u=\alpha(u)X+\sigma(u)\epsilon$, with $\epsilon\sim\mathcal N(0,I)$, condition $a$, and $\sigma(u)>0$. Differentiating the Gaussian conditional density gives

$$
s^\star(z,u,a)=\nabla_z\log p_u(z|a)
=-\frac{\mathbb E[\epsilon|z_u=z,a]}{\sigma(u)},\qquad
\mathcal J_{\rm DSM}=\mathbb E\,w(u)
\left\|s_\theta(z_u,u,a)+\frac{\epsilon}{\sigma(u)}\right\|_2^2.
$$

_(Eq. 58.5)_

[MATHEMATICALLY-DERIVED] This identity assumes differentiation under the mixture integral is valid and noise is independent of the data conditional on $a$. The MSE minimizer is the conditional expectation. Weight $w(u)\ge0$, time sampling and coordinate normalization define the actual objective. A noise predictor, clean predictor and score predictor become algebraically related only in the nonsingular region; finite precision and endpoint clipping break a naive equivalence.

[MATHEMATICALLY-DERIVED] Use the chapter convention $u=0$ for noise and $u=1$ for data:

$$
z_u=(1-u)\epsilon+uX,\quad
\mathcal J_{\rm FM}=\mathbb E\frac{\|v_\theta(z_u,u,a)-(X-\epsilon)\|_2^2}{d_X},
\quad
v^\star(z,u,a)=\mathbb E[X-\epsilon|z_u=z,a].
$$

_(Eq. 58.6)_

[MATHEMATICALLY-DERIVED] For $0<u<1$, $v^\star=(z+(1-u)s^\star)/u$. This is a relation between optimal conditional fields for this path, not a statement that arbitrary trained score/velocity networks are interchangeable. Transporting the noise law with $dz_u/du=v^\star(z_u,u,a)$ requires a well-defined flow and the corresponding continuity equation. It does not imply that each marginal trajectory follows the straight line of one training pair.

[MATHEMATICALLY-DERIVED] If a clean-endpoint network predicts $\widehat X_\theta$, conversion gives

$$
\widehat v_\theta=\frac{\widehat X_\theta-z_u}{1-u},\qquad
\|\widehat v_\theta-(X-\epsilon)\|_2^2
=\frac{\|\widehat X_\theta-X\|_2^2}{(1-u)^2}.
$$

_(Eq. 58.7)_

[DERIVED] Endpoint MSE and velocity MSE therefore use different time weights unless compensated. At $u=1$, this quotient is undefined. Replacing the denominator by $\max(1-u,\varepsilon_u)$ creates a different field and loss near the endpoint. Keep the regularization value and target construction in the experiment record.

```figure
{
  "id": "fig-58.6",
  "kind": "compare",
  "title": "What is actually learned",
  "caption": "The targets and inference obligations differ even when the same transformer computes them.",
  "placement": "inline",
  "anchor": "formulation",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-58.4",
  "alt": "The targets and inference obligations differ even when the same transformer computes them.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "ar",
        "label": "Autoregressive"
      },
      {
        "id": "flow",
        "label": "Continuous flow"
      },
      {
        "id": "mask",
        "label": "Masked discrete"
      }
    ],
    "rows": [
      {
        "dimension": "Prediction",
        "values": {
          "ar": "Next code distribution",
          "flow": "Velocity or clean endpoint",
          "mask": "Corrupted-code reconstruction"
        }
      },
      {
        "dimension": "Assembly",
        "values": {
          "ar": "Ordered symbol decisions",
          "flow": "Numerical transport",
          "mask": "Progressive categorical commitments"
        }
      },
      {
        "dimension": "Unresolved error",
        "values": {
          "ar": "Generated-prefix shift",
          "flow": "Field and solver approximation",
          "mask": "Schedule and commitment mismatch"
        }
      }
    ]
  }
}
```

```figure
{
  "id": "fig-58.8",
  "kind": "calculator",
  "title": "Endpoint conversion amplification",
  "caption": "For unclipped conversion, an endpoint error is amplified by 1/(1-u) in velocity. At u=1 the conversion is undefined; the calculator stops below that endpoint.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-58.7",
  "alt": "For unclipped conversion, an endpoint error is amplified by 1/(1-u) in velocity. At u=1 the conversion is undefined; the calculator stops below that endpoint.",
  "spec": {
    "equation": "58.7",
    "tex": "a(u)=1/(1-u)",
    "inputs": [
      {
        "symbol": "u",
        "label": "clean-time coordinate",
        "default": 0.95,
        "min": 0,
        "max": 0.999,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "a",
        "label": "velocity error multiplier",
        "formula": "1/(1-u)",
        "format": "ratio"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] Multimodal Flow uses the noise-to-data convention above and a clean-endpoint prediction converted to velocity [R58.2, Sec.2.3]. It models text blocks and whole-image hyperchunks under a chunk-causal factorization. Appendix B.3 clamps the denominator at 0.05; this implementation detail matters when interpreting the idealized Eq.9. A single named objective does not make all modality losses equally weighted.

[OFFICIAL-DOCUMENTATION] Pinned originating source [R58.11] independently confirms interpolation direction and denominator clipping. Its velocity_mse_values averages squared error over the final latent channel dimension before token reduction. Paper Eq.10 writes a squared vector norm divided by valid-position count. For different modality widths, those reductions differ by a modality-dependent factor; the inspected helper also supports multiple sample/token weighting modes. Static source inspection cannot determine the exact reduction/configuration that produced every report row.

[MATHEMATICALLY-DERIVED] Let $m_i$ indicate a valid target position, $d_i$ its channel count, and $e_i$ its squared vector error. Position-average vector loss $\sum m_ie_i/\sum m_i$ and coordinate-normalized token loss $\sum m_ie_i/d_i\,/\,\sum m_i$ weight modalities differently when $d_i$ varies. Declare the choice; do not describe them as equivalent solely because both are MSE.

[PAPER-REPORTED] Discrete Diffusion Bridges (DDB) supplies a distinct current categorical case [R58.3, Sec.3]. Its corrupted state mixes a target code, a source-code anchor and a mask. Training prioritizes corruption according to target-source difference for translation, or target local variance for unanchored generation, with uniform stochastic mixing. Inference commits confident predictions and resamples unresolved positions from the source/mask hybrid. Target-dependent training difficulty is available during training, not an oracle required at deployment.

[MATHEMATICALLY-DERIVED] With target one-hot code $e_{c_i}$, source code $e_{s_i}$, mask $e_M$, retained-target indicator $r_i$ and source-injection $\rho_s\in[0,1]$, a normalized corruption distribution is

$$
q_i=r_i e_{c_i}+(1-r_i)
\{\rho_s e_{s_i}+(1-\rho_s)e_M\},\qquad
\mathcal J_{\rm mask}=
-\mathbb E\frac{\sum_i w_i\log p_\theta(c_i|z_u,a)}
{\sum_i w_i}.
$$

_(Eq. 58.8)_

[DERIVED] This analytical form uses declared weights $w_i\ge0$ on predicted positions with positive denominator; it does not replace the paper's specific sampled schedule. $\rho_s=0$ removes source injection. $\rho_s=1$ is still a corrupted/unresolved state, even though no mask symbol remains. Track resolution separately from token value. Greedy confidence decoding is a chosen sampler, not exact reversal of every corruption kernel.

[DERIVED] Costs follow the assembly: dense AR training uses teacher-forced sequence attention; continuous sampling repeats all active target updates; masked sampling repeatedly evaluates a partially resolved sequence and a potentially large categorical head. Logits scale as $BnV_z$; one vector-field output scales as $Bnd_z$. Teacher forcing, latent extraction and decoder work remain inside training and inference boundaries, respectively.

```figure
{
  "id": "fig-58.7",
  "kind": "diagram",
  "title": "Source anchors are not resolved outputs",
  "caption": "An unresolved position can contain a source token. Resolution status must be tracked independently, or source anchors can be incorrectly frozen as final predictions.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-58.8",
  "alt": "An unresolved position can contain a source token. Resolution status must be tracked independently, or source anchors can be incorrectly frozen as final predictions.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "q",
        "kind": "state",
        "label": "Unresolved source or mask"
      },
      {
        "id": "p",
        "kind": "model",
        "label": "Categorical prediction"
      },
      {
        "id": "rank",
        "kind": "process",
        "label": "Stable confidence ranking"
      },
      {
        "id": "yes",
        "kind": "state",
        "label": "Committed target prediction"
      },
      {
        "id": "no",
        "kind": "state",
        "label": "Resampled unresolved anchor"
      }
    ],
    "edges": [
      {
        "from": "q",
        "to": "p",
        "kind": "flow"
      },
      {
        "from": "p",
        "to": "rank",
        "kind": "flow"
      },
      {
        "from": "rank",
        "to": "yes",
        "kind": "flow",
        "label": "quota satisfied"
      },
      {
        "from": "rank",
        "to": "no",
        "kind": "flow",
        "label": "outside quota"
      },
      {
        "from": "no",
        "to": "p",
        "kind": "feedback",
        "label": "next bounded round"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 58.2 — Bounded hybrid discrete decoding

[DERIVED] This reconstructable reference procedure follows DDB's hybrid commitment principle, adding explicit edge handling. Inputs are a pinned model, source or pure-mask prior, finite rounds $J$, nondecreasing integer commitment counts $0=k_0\le\cdots\le k_J=n$, and deterministic tie-breaking.

$$
\begin{aligned}
&z\leftarrow\operatorname{Sample}(h),\quad A\leftarrow\varnothing;\\
&\textbf{for }j=1,\ldots,J:\\
&\quad p_i\leftarrow p_\theta(c_i|z,a),\quad i\notin A;\\
&\quad \text{fail explicitly if a categorical row is invalid or nonfinite;}\\
&\quad G\leftarrow\operatorname{TopStable}(p,k_j-|A|)\text{ among }i\notin A;\\
&\quad z_i\leftarrow\arg\max_c p_i(c),\quad i\in G;\quad A\leftarrow A\cup G;\\
&\quad z_i\leftarrow\operatorname{Sample}(h_i),\quad i\notin A;\\
&\textbf{return }z\text{ if }|A|=n,\text{ otherwise incomplete.}
\end{aligned}
$$

[DERIVED] Invariant: committed positions never change, and unresolved source-valued positions remain eligible for prediction. A final quota of $n$ ensures completion for valid logits. Sorting costs $O(Jn\log n)$, or less with selection; network/categorical-head work usually dominates. This does not claim stochastic sampling from the model's exact joint distribution.

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch (#17, MODEL / AUTOGRAD FRAMEWORK) supplies the tensor/autograd substrate of the inspected originating source paths [R58.11, R58.12]. Dependency inspection does not establish runtime execution.

[DERIVED] Declare time orientation, target parameterization, dtype, clipping, loss reductions, attention mask and padding. For discrete schedules, distinguish selection without replacement from repeated categorical draws; deduplicate indices before interpreting a quota. DDB's normalized information map is undefined on a constant/identical target with zero total information; an explicitly chosen uniform fallback is a book implementation requirement, not a verified behavior of its uninspected code.

[MATHEMATICALLY-DERIVED] Under a Lipschitz velocity and regular time derivatives, Euler global error is first order in maximum step size on a bounded interval. This condition concerns the field/solver pair. It does not establish semantic fidelity, and endpoint singularity can violate regularity. [58.4](58-4-sampling-and-acceleration.md) develops the resulting execution contract.

## Experimental design

### Reported experiments

[PAPER-REPORTED] DDB uses an 8B Lumina-DiMOO backbone and a stride-16 tokenizer producing 1024 codes for a 512-square image. Appendix S2.2 specifies four A100 GPUs, per-GPU batch 8, full-parameter training and center crops [R58.3]. Table 7 compares fixed decoding-step budgets; it does not establish equal FLOPs or equal latency across architectures. Precision, training-duration uncertainty and latency distributions are NOT-DISCLOSED in the inspected setting.

[DERIVED] To isolate objective effects, hold representation/decoder, parameter budget, examples and tuning budget fixed. Also compare matched total training compute, since equal token exposure does not ensure equal work. Evaluate both native samplers and a declared resource frontier; forcing one sampler onto an objective can measure incompatibility rather than an objective's best attainable behavior.

## Observations

**What the paper claims.** [PAPER-REPORTED] DDB describes its schedule and source anchors as aligning training and inference [R58.3].

**What the evidence shows.** [PAPER-REPORTED] Its ablations favor stochastic over certain deterministic anchor allocations on the studied tasks. Table 4 also shows preservation/edit-alignment tradeoffs with injection ratio.

**What we infer.** [DERIVED] Better conditional state coverage is a plausible mechanism. Target-difference difficulty, model confidence and a posterior probability of correctness remain different quantities.

**What remains unknown.** [UNVERIFIED] The specific trained-config interpretation of the Multimodal Flow paper/code reduction difference and DDB's zero-information fallback require execution or additional source disclosure.

## Failure modes

[DERIVED] Test $u$ near both endpoints, no active targets, variable modality widths, one-token examples, tied confidence, zero information and all-source hybrid initialization. A loss improvement caused only by rescaling channels is not improved generation. Persist failed samples and empty reductions instead of averaging them away.

## Siblings

[DERIVED] [58.1](58-1-generative-representations.md) owns the representation; [58.3](58-3-conditioning.md) owns information access; [58.4](58-4-sampling-and-acceleration.md) owns finite transport. Chapter 04 supplies likelihood, [Chapter 19](../../../vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/README.md) training objectives, and Chapter 37 constrained/token sampling; these foundations are linked in the chapter overview.

## Extensions

### Improvements and their evidence

[DERIVED] Prefer a current objective only after decoded outputs meet the same acceptance rule under comparable information and resources. Reverse the preference if a stronger matched comparator improves the accepted-output frontier, if clipping dominates the learned field, or if the claimed objective is not the configured loss. Resolve paper/code discrepancies before calling an experiment a replication.

## Limitations

[DERIVED] The conditional derivations specify ideal minimizers, not finite-data convergence guarantees. A correct corruption distribution is necessary for reconstructing training but insufficient to prove a greedy reverse sampler's distributional correctness. These limits are distinct from a failed implementation.

## Reproducibility

[UNVERIFIED] No objective was trained or sampled by the book. Preserve exact revisions, corruption/noise randomness, condition availability, active masks, reductions, coordinate widths, solver and decoding schedule. Proposed tests remain in [verification](verification.md).

## References

[R58.2] Multimodal Flow v1, Sec.2.3, Appendix B.3. [R58.3] DDB v1, Sec.3, Tables4-7, Appendix S2. [R58.11] Pinned interpolation/loss source. See the [ledger](references.md).
