---
id: ms.section.58.4
entity_type: section
title: "Sampling and acceleration"
volume: 3
part: 10
chapter: 58
section: 58.4
slug: 58-4-sampling-and-acceleration
parent: ms.chapter.58
prev_sibling: ms.section.58.3
next_sibling: ms.section.58.5
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

# 58.4 Sampling and acceleration

## Scope

[DERIVED] A sampler maps a trained conditional field or transition model into an output under finite compute. This section develops continuous integration, guidance, distillation and approximate feature reuse. It distinguishes external denoising steps, network evaluations, internal block applications and elapsed latency. The acceptance rule is a fixed task-quality/control envelope at a declared resource budget, or a fixed budget with an explicit quality frontier. Fewer steps alone are not a successful acceleration result.

## Why this exists

[DERIVED] The trained model, numerical solver, guidance rule and cache policy jointly determine the sampled distribution. Reducing steps changes discretization; changing guidance changes the field; distillation changes the model; caching perturbs an evaluation. Their errors can interact. A cache schedule tuned for one guidance scale and solver need not remain valid after either changes, and a one-step checkpoint need not support arbitrary multistep integration.

## Intuition

> **Definition — Denoising refresh budget.** [DERIVED] The allowed number of full target-feature evaluations inside a finite sampler that otherwise permits approximate reuse.

[DERIVED] Acceleration removes or shares computation that the original procedure performed. A higher-order solver spends more evaluations per step to approximate a trajectory more accurately. Distillation pays training cost to approximate a longer computation with a shorter or smaller model. Feature reuse substitutes an earlier state for a new evaluation. These constructions address different bottlenecks, so an engineering choice must account for what work was saved and which approximation was introduced.

## Formulation

[MATHEMATICALLY-DERIVED] Using the noise-to-data convention of Eq.58.6, choose grid $0=u_0<\cdots<u_J=1$, with $h_j=u_{j+1}-u_j>0$. Euler and explicit trapezoidal/Heun updates are

$$
\begin{aligned}
z^{E}_{j+1}&=z_j+h_jv_\theta(z_j,u_j,a),\\
\widetilde z_{j+1}&=z_j+h_jv_\theta(z_j,u_j,a),\\
z^{H}_{j+1}&=z_j+\tfrac{h_j}{2}
\{v_\theta(z_j,u_j,a)+v_\theta(\widetilde z_{j+1},u_{j+1},a)\}.
\end{aligned}
$$

_(Eq. 58.12)_

[DERIVED] Heun's second field call is not free. Its usual second-order global accuracy requires sufficient regularity and a consistent evaluation at the endpoint; a singular clean-endpoint parameterization may require a different final-step rule. An embedded error estimate controls the chosen numerical norm, not semantic correctness. Adaptive rejection must consume a finite evaluation budget and retain the previous accepted state.

[MATHEMATICALLY-DERIVED] Classifier-free guidance, under this explicitly stated convention, uses

$$
v_g=v_{\varnothing}+g(v_a-v_{\varnothing}),\qquad
e_g=g e_a+(1-g)e_{\varnothing},\qquad
\|e_g\|\le |g|\|e_a\|+|1-g|\|e_{\varnothing}\|.
$$

_(Eq. 58.13)_

[DERIVED] Here $g=1$ is conditional and $g=0$ unconditional; some APIs define their scale relative to the conditional field instead. The error bound follows by substitution and triangle inequality. Large $g$ can amplify approximation errors and stiffness. Combining two predictions in a batch can reduce launch overhead while retaining their arithmetic and activation cost. Guidance embedded in weights has a different execution contract.

[MATHEMATICALLY-DERIVED] Let a cache substitution introduce velocity perturbation $\delta_j$, and suppose the fresh field is $\ell_j$-Lipschitz over both visited trajectories. Euler trajectory deviations satisfy

$$
E_{j+1}\le(1+h_j\ell_j)E_j+h_j\|\delta_j\|,
\quad
E_J\le\sum_{j=0}^{J-1}h_j\|\delta_j\|
\prod_{r=j+1}^{J-1}(1+h_r\ell_r)
$$

_(Eq. 58.14)_

[MATHEMATICALLY-DERIVED] The second expression assumes identical initialization and follows by unrolling the recurrence. No division by $\ell_j$ is required, so zero-Lipschitz cases remain valid. A small local residual error can have large downstream effect; a pessimistic product bound may also greatly overestimate actual error. Learning a useful weighting proxy does not turn it into a certified upper bound.

[MATHEMATICALLY-DERIVED] For refresh count $K\le J$, fresh cost $c_f$ and reuse cost $c_r$, the analytical work ratio and repeated-use break-even are

$$
S_{\rm work}=\frac{Jc_f}{Kc_f+(J-K)c_r},\qquad
Q_{\rm break}>\frac{C_{\rm search}}{C_{\rm base}-C_{\rm fast}}
\quad\text{if }C_{\rm base}>C_{\rm fast}.
$$

_(Eq. 58.15)_

[DERIVED] Costs in the second expression must share units, such as device-seconds or money. If quality is unacceptable, no finite request volume makes the accelerated policy admissible. Wall-clock speedup can differ from work speedup because of batching, synchronization and bandwidth.

```figure
{
  "id": "fig-58.12",
  "kind": "calculator",
  "title": "Work saved by refresh budgeting",
  "caption": "Analytical normalized work: J solver steps contain K full refreshes and J-K cheap reuse steps. Setup, communication, decoder cost and quality loss are excluded.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-58.15",
  "alt": "Analytical normalized work: J solver steps contain K full refreshes and J-K cheap reuse steps. Setup, communication, decoder cost and quality loss are excluded.",
  "spec": {
    "equation": "58.15",
    "tex": "S=J/(K+(J-K)r)",
    "inputs": [
      {
        "symbol": "f",
        "label": "full refresh fraction",
        "default": 0.5,
        "min": 0.01,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "r",
        "label": "reuse/full cost",
        "default": 0.1,
        "min": 0,
        "max": 1,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "work",
        "label": "relative work",
        "formula": "f+(1-f)*r",
        "format": "raw"
      },
      {
        "symbol": "speed",
        "label": "ideal work speedup",
        "formula": "1/(f+(1-f)*r)",
        "format": "ratio"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] GCache first analyzes propagation of cache-residual error, then replaces a conservative theoretical propagation profile with an empirically tuned weighting function [R58.7, Sec.3]. Its inner dynamic program chooses a fixed number of refresh points; its outer Bayesian optimization tunes Bernstein-polynomial coefficients against output quality. The mechanism is calibration of a schedule, not retraining of the backbone.

[MATHEMATICALLY-DERIVED] A reconstructable degree-$d_p$ Bernstein parameterization is $w(u;s)=\sum_{\nu=0}^{d_p}s_\nu\binom{d_p}{\nu}u^\nu(1-u)^{d_p-\nu}$. With precomputed weighted residual cost $E_{j,r}$, define segment cost $C(j,i)=\sum_{r=j+1}^{i-1}E_{j,r}$, and

$$
D[k,i]=\min_{j<i}\{D[k-1,j]+C(j,i)\},\qquad
D[1,0]=0.
$$

_(Eq. 58.16)_

[DERIVED] All other initial states are infinity. Include the terminal tail after the final refresh and backtrack predecessor indices. Prefix-summed segment costs permit $O(KJ^2)$ search time and $O(KJ+J^2)$ stored state/costs. This yields the optimum of the specified proxy among the allowed schedules, not the optimum semantic quality or a global optimum of the outer search.

[PAPER-REPORTED] GCache's outer study uses degree3, coefficient range [0,10], a 16-point initialization and 500 optimization steps; local error proxies are precomputed over 128 samples [R58.7, Appendix D.3]. The report also discloses hours of multi-H100 policy-search cost in Table 5, despite nearby prose describing a minutes-scale optimization component. Keep proxy reuse, optimizer overhead and full calibration cost separate.

[PAPER-REPORTED] Guidance-support theory [R58.8, Assumption3.1, Theorems3.1-3.2] studies exact scores for a finite mixture with disjoint compact convex supports, nonempty interiors and a target density bounded below on its support. The discretized result requires sufficiently fine, shrinking steps near the terminal time. It establishes convergence toward target support under those conditions, not accurate probabilities within that support, arbitrary learned-score behavior or prompt satisfaction. The report explicitly leaves realistic $L_2$ score-error transfer under guided distribution shift unresolved.

[PAPER-REPORTED] Depth as Time [R58.9] examines a different acceleration axis: one-step models can expose progressive intermediate predictions across network depth. A student shares one or two blocks over repeated internal-clock intervals and distills teacher hidden states, optionally followed by feature-distance post-training. This is evidence about the studied models and readouts; it is not a universal equivalence between layer depth and physical/denoising time.

[MATHEMATICALLY-DERIVED] A bounded interval map $\Phi_\theta(z_u,u,v)$ approximates the flow solution at $v$. Distilling it from a teacher can reduce external evaluations, but a residual block repeated $K_{\rm int}$ times still performs $K_{\rm int}$ block applications. Parameter sharing reduces stored parameters without proportionally reducing arithmetic. Native one-pass guidance and two-branch student guidance must be counted separately.

## Algorithm

### Algorithm 58.4 — Execute a bounded sampler with explicit cache state

[DERIVED] Inputs include pinned model/decoder, condition contract, valid grid or finite adaptive controller, guidance convention, evaluation cap $E_{\max}$, wall-clock deadline and cache namespace containing model/condition/solver/shape/dtype identities.

$$
\begin{aligned}
&z\leftarrow\epsilon,\quad j\leftarrow0,\quad e\leftarrow0,\quad\mathcal C\leftarrow\varnothing;\\
&\textbf{while }j<J\text{ and budget remains}:\\
&\quad \text{invalidate }\mathcal C\text{ if dependency identity changes;}\\
&\quad \text{refresh or reuse only under the declared approximation policy;}\\
&\quad \text{evaluate required guidance branches; increment }e\text{ for each call;}\\
&\quad \text{propose step; fail on nonfinite state or invalid solver domain;}\\
&\quad \text{accept and increment }j,\text{ or reject and spend bounded retry budget;}\\
&\textbf{return }\operatorname{Decode}(z)\text{ only after terminal/decoder checks;}\\
&\text{otherwise return incomplete with costs and last accepted coordinate.}
\end{aligned}
$$

[DERIVED] The invariant is that only accepted states advance the trajectory. Rejection never restores spent compute. A cache hit is exact only for invariant inputs; approximate target-feature reuse is labeled as such. Timeout/cancellation prevents publication, while buffer release waits for device work to finish. The cap guarantees termination and incomplete reporting, not successful generation.

```figure
{
  "id": "fig-58.13",
  "kind": "diagram",
  "title": "Acceleration changes different parts of execution",
  "caption": "Solver design changes evaluation placement; guidance changes the field; distillation changes the model; cache reuse approximates an evaluation. Their joint operating point must be reevaluated.",
  "placement": "inline",
  "anchor": "algorithm",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-58.14",
  "alt": "Solver design changes evaluation placement; guidance changes the field; distillation changes the model; cache reuse approximates an evaluation. Their joint operating point must be reevaluated.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "field",
        "kind": "model",
        "label": "Trained field"
      },
      {
        "id": "guid",
        "kind": "process",
        "label": "Guidance rule"
      },
      {
        "id": "solv",
        "kind": "process",
        "label": "Finite solver"
      },
      {
        "id": "reuse",
        "kind": "memory",
        "label": "Refresh/reuse policy"
      },
      {
        "id": "out",
        "kind": "state",
        "label": "Decoded output"
      },
      {
        "id": "dist",
        "kind": "model",
        "label": "Distilled replacement"
      }
    ],
    "edges": [
      {
        "from": "field",
        "to": "guid",
        "kind": "flow"
      },
      {
        "from": "guid",
        "to": "solv",
        "kind": "flow"
      },
      {
        "from": "reuse",
        "to": "solv",
        "kind": "dependency"
      },
      {
        "from": "solv",
        "to": "out",
        "kind": "flow"
      },
      {
        "from": "field",
        "to": "dist",
        "kind": "dependency",
        "label": "training cost"
      },
      {
        "from": "dist",
        "to": "guid",
        "kind": "flow",
        "label": "new field"
      }
    ]
  }
}
```

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch (#17, MODEL / AUTOGRAD FRAMEWORK) supplies the tensor/autograd substrate of the inspected originating source paths [R58.11, R58.12]. Dependency inspection does not establish runtime execution.

[DERIVED] Record every model evaluation, accepted/rejected step, guidance branch, internal block application, cache read/write and decoder invocation. A step count is insufficient. Avoid evaluating singular endpoint conversions without the documented fallback. Store intermediate states in a dtype justified by reference error tests; lower precision can alter adaptive acceptance or confidence ranking even when outputs look similar.

[OFFICIAL-DOCUMENTATION] The pinned MF pipeline [R58.11] restricts its cached block-generation path to CUDA with BF16/FP16 autocast. This is a source-level restriction for that path, not a universal property of flow sampling. Static inspection does not establish a supported configuration's runtime performance.

## Experimental design

### Reported experiments

[PAPER-REPORTED] GCache Table 1 evaluates Wan2.1-1.3B, 81 frames at 480P, 50 base steps: base latency199s, GCache-slow91.6s and ERTACache91.7s; LPIPS is0.0316 versus 0.1095 [R58.7]. Sec.4.1 states single A80080GB inference, five seeds and VBench prompts. LPIPS/PSNR/SSIM compare accelerated output with the base sampler, not measured physical truth. VBench for GCache-slow is80.81%, below the base81.30%. Similarity improvement over another cache is not improvement over the base on every quality axis.

[PAPER-REPORTED] The GCache latency comparison has the following disclosed boundary [R58.7, Sec.4.1; Appendix D].

| Timing field           | Source context                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| Hardware               | Single NVIDIA A80080GB for reported inference; policy search separately uses multiple H100s |
| Model and precision    | Wan2.1-1.3B; dtype NOT-DISCLOSED in inspected timing account                                |
| Input/output workload  | VBench prompts;81 generated frames at480P;50 base sampling steps                            |
| Concurrency            | NOT-DISCLOSED in inspected timing account                                                   |
| Runtime/kernel version | NOT-DISCLOSED; no book compatibility/execution check                                        |
| Measurement boundary   | Prompt ingestion through final generated frame                                              |
| Aggregation            | Source states averaging five random seeds; tail quantiles not supplied                      |
| Quality/reference      | LPIPS/PSNR/SSIM against base output; VBench separately measures generated-video quality     |

[PAPER-REPORTED] Depth as Time Table 1 reports a 459M-parameter teacher and 27.6M one-block student, with FID4.01 versus 4.87 after optional post-training at24 internal applications [R58.9]. Appendix C.1 states that student CFG uses two passes whereas teacher guidance is embedded; native student cost is roughly twice the teacher. The16.6-fold parameter compression is therefore not16.6-fold compute or latency acceleration.

## Observations

**What the papers claim.** [PAPER-REPORTED] GCache improves cache quality/speed tradeoffs; Depth as Time compresses parameters through shared depth computation [R58.7, R58.9].

**What the evidence shows.** [PAPER-REPORTED] GCache-fast on CogVideoX has VBench78.30% versus ERTACache-fast78.79% at similar acceleration, despite better LPIPS. Depth as Time's coarser untrained internal steps can collapse in Table 2.

**What we infer.** [DERIVED] Approximation quality and resource savings are multidimensional. A learned proxy or shared block does not confer a universal safe-step guarantee.

**What remains unknown.** [NOT-DISCLOSED] Portable latency distributions, complete precision/runtime configurations and book replications remain unavailable.

```figure
{
  "id": "fig-58.14",
  "kind": "compare",
  "title": "Keep the acceleration denominator explicit",
  "caption": "Fewer stored parameters, fewer field evaluations and lower elapsed time are distinct claims.",
  "placement": "inline",
  "anchor": "observations",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-58.15",
  "alt": "Fewer stored parameters, fewer field evaluations and lower elapsed time are distinct claims.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "params",
        "label": "Parameter compression"
      },
      {
        "id": "calls",
        "label": "Evaluation reduction"
      },
      {
        "id": "time",
        "label": "Latency reduction"
      }
    ],
    "rows": [
      {
        "dimension": "Count",
        "values": {
          "params": "Unique stored weights",
          "calls": "All guidance and solver calls",
          "time": "Complete timed pipeline"
        }
      },
      {
        "dimension": "Hidden cost",
        "values": {
          "params": "Repeated shared blocks",
          "calls": "Larger per-call work",
          "time": "Decode, transfer, synchronization"
        }
      },
      {
        "dimension": "Reversal evidence",
        "values": {
          "params": "Memory no longer controls cost",
          "calls": "Per-call work cancels savings",
          "time": "Quality or tail deadline fails"
        }
      }
    ]
  }
}
```

## Failure modes

[DERIVED] Test large guidance, endpoint conversion, stale source/condition identity, changed schedule, alternate resolution, nonfinite steps and exhausted retry budgets. Cache profiles trained under one prompt distribution can fail on unusual trajectories. A distillation objective can preserve teacher bias. A smaller checkpoint can be slower if repeated blocks, guidance or memory transfers dominate.

## Siblings

[DERIVED] [58.2](58-2-objectives.md) defines the trained field; [58.3](58-3-conditioning.md) defines exact reusable dependencies; [58.6](58-6-evaluation-and-systems.md) counts complete accepted-output cost. Chapters39-41 own distillation, quantization and structural compression; [Chapter 42](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/README.md)'s autoregressive resource model does not directly price a full denoising pass.

## Extensions

### Improvements and their evidence

[DERIVED] Prefer an acceleration only if accepted-output quality meets its threshold and total cost improves after amortized search/training. Reverse that choice when guidance, resolution, data or decoder changes invalidate calibration, or a matched comparator improves the frontier. A false theoretical bound requires a mathematical correction; a poor proxy requires recalibration; a stale tensor requires implementation repair. These are different research updates.

## Limitations

[DERIVED] No method here guarantees exact semantic preservation at a chosen step budget. The analytic error bound depends on local regularity and addresses state deviation, not semantic failure. The guidance theorem's support result is materially weaker than calibrated conditional sampling.

## Reproducibility

[UNVERIFIED] No sampler or cache benchmark was executed by the book. Pin field/decoder revisions, grid, endpoint rule, CFG convention, refresh mask, search split, proxy objective, dtype, device/runtime and complete work/latency telemetry.

## References

[R58.7] GCache v1, Secs.3-4, Appendices A/D/G. [R58.8] Guidance support v2, Assumptions3.1-3.2 and Sec.6. [R58.9] Depth as Time v1, Tables1-2 and Appendix C. [R58.11] Pinned pipeline. See the [ledger](references.md).
