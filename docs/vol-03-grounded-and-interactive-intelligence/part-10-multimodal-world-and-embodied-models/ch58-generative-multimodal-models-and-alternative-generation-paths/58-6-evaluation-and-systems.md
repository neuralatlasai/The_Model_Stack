---
id: ms.section.58.6
entity_type: section
title: "Evaluation and systems"
volume: 3
part: 10
chapter: 58
section: 58.6
slug: 58-6-evaluation-and-systems
parent: ms.chapter.58
prev_sibling: ms.section.58.5
next_sibling: ms.verification.58
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

# 58.6 Evaluation and systems

## Scope

[DERIVED] The evaluation object is the complete generation policy: representation, condition, model, sampler, guidance, candidate search, verifier, stopping and release. This section connects fidelity, controllability, diversity, temporal consistency and full execution cost. It develops a bounded policy-calibration construction and identifies its statistical limits. Acceptance requires a declared task-quality/risk envelope, coverage, resource limits and uncertainty; a single scalar quality score cannot silently replace those obligations.

## Why this exists

[DERIVED] A generator can match a feature distribution while placing the wrong objects in each requested image. Search can improve a selector's favorite outputs while changing prompt coverage or exploiting its blind spots. Faster denoising can increase total cost if more candidates or verifier calls become necessary. The consequence is that accepted-output quality and cost must be evaluated at the same policy boundary. Reporting only the winning sample or successful requests changes the estimand.

## Intuition

> **Definition — Objective/sampler/runtime comparison.** [DERIVED] A comparison that fixes task acceptance and admissible information while recording complete distributional, sampling and execution conditions.

[DERIVED] Distributional fidelity asks whether generated and real sets resemble each other in a chosen feature space. Controllability asks whether a particular output meets its condition. Diversity asks which valid alternatives the policy retains. Temporal consistency asks whether a sequence preserves specified identities, event relations and dynamics. Systems evaluation asks what work and delay were needed to release an acceptable result. These questions require different measurements and can disagree.

## Formulation

[MATHEMATICALLY-DERIVED] For feature means $\mu_r,\mu_g$ and positive-semidefinite covariances $\Sigma_r,\Sigma_g$, the Gaussian feature-distance construction is

$$
F_{\rm feat}=\|\mu_r-\mu_g\|_2^2+
\operatorname{tr}\!\left[
\Sigma_r+\Sigma_g-
2(\Sigma_r^{1/2}\Sigma_g\Sigma_r^{1/2})^{1/2}
\right].
$$

_(Eq. 58.20)_

[DERIVED] The symmetric covariance product exposes the real positive-semidefinite square root needed by the expression. Finite-sample covariance estimates, singular features, regularization and numerical eigenvalue handling affect its estimate. Inception-feature FID instantiates a particular feature extractor/protocol; it is not a general semantic distance. The score is invariant to permuting generated outputs across prompts, proving that it cannot alone establish prompt alignment.

[MATHEMATICALLY-DERIVED] Let prompt $p$, policy randomness $\omega$, released output $\pi_\xi(p,\omega)$ or abstention $\bot$, release indicator $A_\xi$, and held-out target loss $\ell\in[0,1]$ define

$$
R_\pi(\xi)=
\frac{\mathbb E[A_\xi\ell(\pi_\xi,p)]}{\mathbb E[A_\xi]},
\quad
C_\pi(\xi)=\mathbb E[A_\xi],
\quad
\overline c_{\rm accepted}=
\frac{\sum_{i=1}^{m}c_i}{\sum_{i=1}^{m}A_i}.
$$

_(Eq. 58.21)_

[DERIVED] Risk and accepted-output cost are undefined when their release denominators vanish. Zero coverage is not zero risk. Cost $c_i$ includes failed/abstained requests, all candidates and verification. Target loss is explicitly chosen; a model-based soft score is not the same as a binary human error rate.

[MATHEMATICALLY-DERIVED] For a prespecified threshold grid $\Xi$, iid complete prompt-policy trials, fixed bounded loss and accepted calibration count $n_\xi>0$, a simultaneous Hoeffding construction is

$$
U_\xi=\widehat R_\pi(\xi)+
\sqrt{\frac{\log(|\Xi|/\delta)}{2n_\xi}},
\qquad
\xi^\star=\max\{\xi\in\Xi:U_\xi\le r_{\max}\}.
$$

_(Eq. 58.22)_

[MATHEMATICALLY-DERIVED] Set $U_\xi=+\infty$ when $n_\xi=0$, and return no release policy if the feasible set is empty. For each fixed threshold, conditional on its accepted count, released losses are iid draws from the corresponding conditional law; Hoeffding and a union bound give simultaneous coverage at least $1-\delta$. The grid, generator, selector, policy transitions and target loss must be fixed independently of calibration observations. Distribution shift, threshold-dependent trajectories replayed incorrectly, or reuse of calibration to redesign the evaluator invalidates that argument.

```figure
{
  "id": "fig-58.18",
  "kind": "calculator",
  "title": "Calibration uncertainty grows as coverage falls",
  "caption": "Analytical simultaneous Hoeffding radius for a fixed grid. The count is accepted independent calibration prompts, not all generated candidates; zero accepted prompts cannot certify a policy.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-58.22",
  "alt": "Analytical simultaneous Hoeffding radius for a fixed grid. The count is accepted independent calibration prompts, not all generated candidates; zero accepted prompts cannot certify a policy.",
  "spec": {
    "equation": "58.22",
    "tex": "r=\\sqrt{\\log(m/\\delta)/(2n)}",
    "inputs": [
      {
        "symbol": "m",
        "label": "fixed thresholds",
        "default": 201,
        "min": 1,
        "max": 1001,
        "format": "integer"
      },
      {
        "symbol": "delta",
        "label": "failure probability",
        "default": 0.1,
        "min": 0.001,
        "max": 0.5,
        "format": "percent"
      },
      {
        "symbol": "n",
        "label": "accepted prompts",
        "default": 200,
        "min": 1,
        "max": 100000,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "rad",
        "label": "risk upper-bound increment",
        "formula": "sqrt(ln(m/delta)/(2*n))",
        "format": "raw"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] SHIP calibrates the released output of the complete inference policy rather than pooled image candidates [R58.10, Sec.3]. Its selector and held-out target judge score atomic requirements using soft probabilities, aggregated by geometric mean. Policy replay is valid for threshold-independent cached streams; a threshold that changes adaptive transitions needs its own complete rollout. The formal certificate uses a prespecified201-point grid and simultaneous bounds. Main operating-point tables instead use pointwise threshold scans and are explicitly descriptive, not covered by that certificate.

[DERIVED] Best-of-many selection changes both within-prompt candidate selection and the prompt distribution among released outputs. Even if a candidate threshold has low conditional loss, the full policy may preferentially release difficult prompts at a different rate or exploit extreme selector errors. Cluster dependence matters: sixteen candidates for one prompt are not sixteen independent deployment prompts. Resample complete prompt trajectories for uncertainty.

[PAPER-REPORTED] The current setting-matched benchmark [R58.13, v4] evaluates eight checkpoint families across native guidance and a common nominal scale, using class-conditioned ImageNet-family references and text templates for text-conditioned systems. It reports FID, IS, CLIP and PickScore, plus scaled metric combinations. It explicitly acknowledges the conditioning disadvantage of text models in a label-ID protocol and retains SiT's adaptive solver rather than forcing identical steps.

[DERIVED] Equal numerical CFG values do not imply equal effective guidance across trained models; equal denoising steps do not imply equal field calls, arithmetic or latency. The study is useful diagnostic evidence, not a controlled causal ranking of objective families. Its scaled FID/IS remain evaluator-dependent summaries: multiplying/dividing by another proxy does not prove correspondence to human utility or remove blind spots. Preserve component metrics and uncertainty.

[MATHEMATICALLY-DERIVED] A complete work ledger separates phases:

$$
F_{\rm request}=
F_{\rm condition}
+\sum_{k=1}^{n_{\rm cand}}\sum_{e=1}^{E_k}F_{k,e}
+F_{\rm decode}+F_{\rm verify}+F_{\rm search},
\qquad
F_{\rm attention\ pairs}=4B\,n_qn_kd.
$$

_(Eq. 58.23)_

[MATHEMATICALLY-DERIVED] The second expression counts query-key and attention-value multiply-adds, two FLOPs each, for dense attention with total head width $d$; it excludes projections, normalization, softmax and feed-forward work. A target denoising pass updates many positions together. Its target state changes at every step, so autoregressive append-only KV accounting cannot simply price it. Immutable prefix/condition caches and approximate target-feature caches require separate ledgers.

[MATHEMATICALLY-DERIVED] A phase-aware peak-memory definition is

$$
M_{\rm peak}=\max_r\{
M_{\rm weights}^{(r)}+M_{\rm persistent}^{(r)}
+M_{\rm workspace}^{(r)}+M_{\rm active}^{(r)}
\}.
$$

_(Eq. 58.24)_

[DERIVED] Summing each phase's separate peak can overstate simultaneous memory; excluding a resident encoder/decoder can understate it. State lifetime and overlap determine the correct maximum. Record output dimensions, duration/frame rate, latent shape, batch/concurrency, precision, solver/guidance, cache, hardware/runtime and timing boundary next to performance.

## Algorithm

### Algorithm 58.6 — Calibrate the policy that will actually release outputs

[DERIVED] This source-scoped reconstruction follows SHIP's formal fixed-stream setting. Inputs are iid held-out prompt-policy trials, fixed grid $\Xi$, bounded independent target judge, risk cap, confidence level and finite candidate/deadline budgets.

$$
\begin{aligned}
&\text{freeze generator, selector, policy transitions, grid and target judge;}\\
&\textbf{for each calibration prompt: generate the complete declared stream;}\\
&\textbf{for each }\xi\in\Xi:\\
&\quad \text{replay the exact release/abstention rule;}\\
&\quad \text{evaluate only the output it releases with the held-out target;}\\
&\quad \text{compute }n_\xi,\widehat R_\pi(\xi),U_\xi;\\
&\text{select the most permissive feasible threshold, or return no policy;}\\
&\text{deploy the frozen rule; stop at first valid release or bounded abstention.}
\end{aligned}
$$

[DERIVED] Invariant: offline and online state transitions match. A timeout, invalid image or verifier failure follows the declared failure rule and remains in cost/coverage. For $m$ prompts, $n_{\rm cand}$ candidates and $|\Xi|$ thresholds, cached generation costs $O(mn_{\rm cand})$ model generations; naive replay costs $O(mn_{\rm cand}|\Xi|)$ comparisons. Target scores can be memoized for immutable prompt-output pairs. Threshold-dependent adaptive search needs additional actual trajectories, not counterfactual reuse of incompatible streams.

```figure
{
  "id": "fig-58.19",
  "kind": "diagram",
  "title": "Evaluate the released distribution",
  "caption": "Generation, search and selection produce a release or abstention. Held-out target loss is evaluated on the actual release, while all attempts remain in the resource ledger.",
  "placement": "inline",
  "anchor": "algorithm",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-58.21",
  "alt": "Generation, search and selection produce a release or abstention. Held-out target loss is evaluated on the actual release, while all attempts remain in the resource ledger.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "prompt",
        "kind": "dataset",
        "label": "Independent prompt trial"
      },
      {
        "id": "gen",
        "kind": "model",
        "label": "Candidates and search"
      },
      {
        "id": "sel",
        "kind": "branch",
        "label": "Frozen release policy"
      },
      {
        "id": "release",
        "kind": "state",
        "label": "Released output or abstention"
      },
      {
        "id": "judge",
        "kind": "metric",
        "label": "Held-out target loss"
      },
      {
        "id": "cost",
        "kind": "hardware",
        "label": "All-attempt cost"
      }
    ],
    "edges": [
      {
        "from": "prompt",
        "to": "gen",
        "kind": "flow"
      },
      {
        "from": "gen",
        "to": "sel",
        "kind": "flow"
      },
      {
        "from": "sel",
        "to": "release",
        "kind": "flow"
      },
      {
        "from": "release",
        "to": "judge",
        "kind": "flow"
      },
      {
        "from": "gen",
        "to": "cost",
        "kind": "flow"
      },
      {
        "from": "sel",
        "to": "cost",
        "kind": "flow"
      }
    ]
  }
}
```

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch (#17, MODEL / AUTOGRAD FRAMEWORK) supplies the tensor/autograd substrate of the inspected originating source paths [R58.11, R58.12]. Dependency inspection does not establish runtime execution.

[DERIVED] Persist prompt/group ids, candidate seeds, full intermediate search decisions, verifier probabilities and revisions, release threshold, abstention reason and exact output hash. Distinguish cached replay time from generation/scoring time. Do not double-count a shared prefix encoder or omit it. Latency spans admission through final valid output or failure, including queueing and transfers; also report the model-only boundary if useful.

[DERIVED] A streaming video/audio policy needs buffer growth, first usable output, steady-state goodput and temporal seams at chunk boundaries. High adjacent-frame similarity can reward a frozen scene; evaluate requested motion and event ordering separately. A high semantic score can miss local text errors, identity changes or a physically inconsistent transition. Chapters56-57 provide the clock/state contracts and Chapter 59 separates generated realism from predictive/control utility.

## Experimental design

### Reported experiments

[PAPER-REPORTED] SHIP's principal setup uses 800 GenEval2 prompts split 400/400, FLUX.1-dev at1024-square with28 denoising steps and guidance 3.5, a Qwen2.5-VL-7B selector and Qwen3-VL-8B target [R58.10, Sec.4; Appendix A]. Core runs use an RTX5090,32GB, CUDA12.8 and PyTorch2.10.0. Table 1's sequential pooled threshold has released soft loss 0.310 and coverage 0.573; sequential SHIP reports 0.162 and0.438, with higher full-generation equivalents10.68 versus 9.10. Lower risk here trades coverage and compute, and these pointwise-scan rows are not formal certificates.

[PAPER-REPORTED] SHIP Appendix A specifies this systems context; omitted fields remain explicit rather than inferred [R58.10].

| Timing field           | Source context                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| Hardware               | One RTX5090 with32GB; driver580.159.03                                                         |
| Model and precision    | FLUX.1-dev plus named selector/target VLMs; measured-path dtype NOT-DISCLOSED                  |
| Input/output workload  | GenEval2;1024-square images;28 denoising steps; guidance3.5                                    |
| Concurrency            | NOT-DISCLOSED in inspected wall-clock description                                              |
| Runtime/kernel version | CUDA12.8/PyTorch2.10.0; baseline-specific environments may differ                              |
| Measurement boundary   | Single-GPU policy wall-clock; generation/search/verification calls separately reported         |
| Aggregation            | Prompt-level operating points; bootstrap uncertainty is not independent generation replication |
| Released quality       | Held-out judge-dependent soft loss, coverage and complete policy compute                       |

[PAPER-REPORTED] The setting-matched benchmark's Appendix C records reimplementation discrepancies, including iMF FID3.85 versus original1.70 in its reported natural setting [R58.13]. This prevents treating its outputs as exact reproductions of every published baseline. Its v4 metric construction supersedes v1's earlier composite; use the inspected revision's definitions.

[DERIVED] A book experiment should first validate metric extraction, paired prompts, evaluator sensitivity and exact sampler settings, then compare fixed budgets and fixed acceptance separately. Select configurations on development data; preserve one held-out evaluation. Report per-prompt constraints, output diversity, invalid/timeouts, uncertainty and full cost, including calibration/amortization.

## Observations

**What the papers claim.** [PAPER-REPORTED] SHIP identifies candidate-to-policy calibration mismatch; the setting-matched benchmark identifies guidance/metric sensitivity [R58.10, R58.13].

**What the evidence shows.** [PAPER-REPORTED] Calibrating complete releases changes observed risk/coverage; changing sampling steps can improve semantic proxies while worsening FID. Reimplementation discrepancies and conditioning differences remain disclosed.

**What we infer.** [DERIVED] Quality must be assessed at the actual release and resource boundary. Lower conditional risk can be purchased with more abstention or compute; the decision requires explicit constraints.

**What remains unknown.** [UNVERIFIED] Proxy calibration does not establish real-world human error guarantees, arbitrary distribution-shift validity, or performance on the book's unexecuted workloads.

## Failure modes

[DERIVED] Guard against prompt leakage, tuning on test outputs, dependent candidate pseudoreplication, evaluator exploitation, omitted failures, zero-coverage "success," and source-specific best-sample selection. A changed model, prompt distribution, guidance, search budget or judge can invalidate calibration. A confidence interval over bootstrap resamples is not an independent generation replication.

## Siblings

[DERIVED] [58.4](58-4-sampling-and-acceleration.md) supplies the work/approximation ledger; [58.5](58-5-joint-understanding-and-generation.md) supplies per-capability retention. Chapters06,48,61 and63 own experimental design, capacity economics, evaluation methodology and deployment assurance. [59.6](../ch59-predictive-representations-jepa-and-world-models/59-6-limitations-and-transfer.md) tests whether generated/predicted states transfer to decisions.

## Extensions

### Improvements and their evidence

[DERIVED] Prefer the least-cost policy whose held-out constraints pass at required coverage. Reverse that choice if a new evaluator exposes hidden failures, a more representative prompt distribution breaks calibration, or a stronger comparator improves the admissible frontier. Judge failure calls for evaluator repair; incomplete source disclosure calls for a replication gap; a statistically inconclusive comparison calls for additional independent evidence. None licenses a claim of universal superiority.

```figure
{
  "id": "fig-58.20",
  "kind": "compare",
  "title": "Which finding changes which decision",
  "caption": "Different failures require different updates; a budget-exhausted study has terminated without necessarily establishing acceptable quality.",
  "placement": "inline",
  "anchor": "extensions",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-58.21",
  "alt": "Different failures require different updates; a budget-exhausted study has terminated without necessarily establishing acceptable quality.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "finding",
        "label": "Observed finding"
      },
      {
        "id": "update",
        "label": "Decision update"
      }
    ],
    "rows": [
      {
        "dimension": "Control counterexample",
        "values": {
          "finding": "Output misses required constraint",
          "update": "Reopen model/condition/sampler choice"
        }
      },
      {
        "dimension": "Evaluator defect",
        "values": {
          "finding": "Judge rewards an invalid output",
          "update": "Repair evaluator and repeat affected comparison"
        }
      },
      {
        "dimension": "Cost increase",
        "values": {
          "finding": "Verification removes denoising savings",
          "update": "Recompute complete accepted-output frontier"
        }
      },
      {
        "dimension": "Inconclusive",
        "values": {
          "finding": "Intervals do not resolve admissibility",
          "update": "Gather independent evidence or remain unresolved"
        }
      }
    ]
  }
}
```

## Limitations

[DERIVED] Formal coverage applies to the bounded target loss under iid complete-policy trials and a fixed grid, not arbitrary human semantics or deployment drift. Finite-sample certificates can be too conservative to admit a policy; that is an unresolved feasibility result, not permission to replace simultaneous control with an unlabelled pointwise scan.

## Reproducibility

[UNVERIFIED] No book generation, search, calibration or systems benchmark was executed. The [verification protocol](verification.md) defines typed proposals; the [ledger](references.md) records actual primary-text inspection and remaining implementation gaps.

## References

[R58.10] SHIP v1, Secs.3-4, Appendices A/B/E/J. [R58.13] Setting-Matched Benchmark v4, Secs.3-5, Appendices C/L. See the [ledger](references.md).
