---
id: "ms.section.39.5"
entity_type: "section"
title: "39.5 — Student optimization"
short_title: "39.5 — Student optimization"
volume: 2
part: 7
chapter: 39
section: 39.5
slug: "39-5-student-optimization"
parent: "ms.chapter.39"
prev_sibling: "ms.section.39.4"
next_sibling: "ms.section.39.6"
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.23", "ms.chapter.31", "ms.chapter.32", "ms.chapter.33", "ms.chapter.34", "ms.chapter.35", "ms.chapter.36", "ms.chapter.37", "ms.chapter.38"]
downstream: ["ms.chapter.40", "ms.chapter.41", "ms.chapter.42", "ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "adaptation", "inference"], "mechanism": ["distillation", "distribution_matching"], "feedback_setting": ["ai_feedback", "verifiable_reward", "environment_return"], "modality": ["text"]}
papers: []
implementations: ["impl.pytorch", "impl.megatron-lm", "impl.verl", "impl.vllm", "impl.sglang"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2200
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 39.5 — Student optimization

## Scope

[DERIVED] Select and optimize a student under an architecture, information and deployment contract. The baseline is an existing pretrained student followed by SFT. Success means separating inherited versus newly learned capacity, distillation versus later RL, and training parameter count versus deployable model size. Structural-pruning algorithms belong to Chapter41 and quantization to Chapter40; this section explains their interaction with the recovery objective and retained capabilities.

## Why this exists

[DERIVED] “Smaller student” leaves the most consequential choices unspecified. A model trained from random weights must acquire language structure as well as the desired task behavior. An inherited model starts with a representation and tokenizer but may be poorly suited to the target. A width-reduced teacher can reuse weights while requiring careful residual-coordinate and normalization handling. The architecture that trains cheaply may still have unfavorable decode bandwidth, attention state or output-head cost.

[PAPER-REPORTED] RED investigates width-reduced students with frozen teacher modules and trainable projections, comparing random versus activation-aware projection initialization [R39.9, §§3–6]. Its ablations show that temperature and initialization interact. The offline loss study reports feature-only training collapse under its tested recovery setting, while adding feature matching to KL improves its listed outcomes modestly [R39.1, §4.4]. These findings argue against selecting the student solely by nominal parameters or a single training-loss curve.

## Intuition

[MATHEMATICALLY-DERIVED] Initialization determines which teacher subspace the student initially preserves. A coordinate-selection projection can keep selected residual channels intact, while a random map changes that geometry immediately. A representation metric describes a chosen batch of activations; it does not by itself prove downstream reasoning capability or irreversible loss. Later SFT and RL add objectives that can preserve, recover or overwrite behavior, so their contributions need separate measurements.

## Formulation

[MATHEMATICALLY-DERIVED] Let teacher residual width be $d$, student width $d'<d$, and $H\in\mathbb R^{d\times d'}$ contain distinct standard-basis columns. Initialize down/up maps $Q=H$, $O=H^\top$:

$$
H^\top H=I_{d'},\qquad M=QO=HH^\top,\qquad M^2=M,\qquad
\operatorname{spec}_{\rm singular}(M)=\{1\ (d'\text{ times}),0\ (d-d'\text{ times})\}.
$$
*(Eq. 39.14)*

where $M$ projects teacher residual coordinates onto the selected subspace. This is an exact initialization identity; it does not state that the retained coordinates are sufficient for every task.

[MATHEMATICALLY-DERIVED] A row-vector linear module with teacher weight $W\in\mathbb R^{d\times d}$ becomes $X'OWQ$, with effective student weight $W'=OWQ\in\mathbb R^{d'\times d'}$. Rectangular attention/FFN modules use the corresponding input/output maps. When these are merged, two inference-time adapters disappear into one matrix multiplication. Nonlinearities and normalization do not commute with arbitrary projections, so an end-to-end Transformer equivalence cannot be inferred from this single linear identity.


```figure
{
  "id": "fig-39.25",
  "kind": "calculator",
  "title": "Inherited projection dimensions",
  "caption": "The linear merge reduces a square residual matrix; actual model parameters also include unchanged inner modules. Integer widths show matrix entries, not total model savings.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.14",
  "alt": "The linear merge reduces a square residual matrix; actual model parameters also include unchanged inner modules. Integer widths show matrix entries, not total model savings.",
  "spec": {
    "tex": "W_T:d^2,\\quad W_S:(d/k)^2,\\quad Q,O:2d^2/k",
    "equation": "39.14",
    "inputs": [
      {
        "symbol": "d",
        "label": "Teacher residual width",
        "default": 4096,
        "min": 512,
        "max": 8192,
        "step": 512,
        "scale": "linear",
        "format": "integer"
      },
      {
        "symbol": "k",
        "label": "Width reduction divisor",
        "default": 2,
        "min": 2,
        "max": 8,
        "options": [
          2,
          4,
          8
        ],
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "old",
        "label": "Teacher matrix entries",
        "formula": "d*d",
        "format": "params"
      },
      {
        "symbol": "new",
        "label": "Merged matrix entries",
        "formula": "(d/k)*(d/k)",
        "format": "params"
      },
      {
        "symbol": "maps",
        "label": "Training map entries",
        "formula": "2*d*d/k",
        "format": "params"
      }
    ]
  }
}
```


[MATHEMATICALLY-DERIVED] For the source's linear-autoencoder proxy, $\Sigma=X^\top X/n$ and $\mathcal L=\|X-XQO\|_F^2/(2n)$ give

$$
\dot Q=-\Sigma(QO-I)O^\top,\qquad
\dot O=-Q^\top\Sigma(QO-I),\qquad
\frac{d}{dt}(Q^\top Q-OO^\top)=0.
$$
*(Eq. 39.15)*

where differentiation follows the Frobenius inner product and continuous-time gradient flow. Exact initial balance is preserved. Independent random Gaussian maps can be approximately small and similarly scaled without satisfying exact equality; the balanced theorem does not automatically apply to each such draw. Discrete Adam updates and a nonlinear Transformer are additional departures from the proxy.

## Mechanism

### Methodology

[PAPER-REPORTED] RED estimates activation-channel importance on a small calibration set. For each sequence and layer it averages absolute activation over tokens; it aggregates sequence magnitudes using an L2 norm, then averages over layers and the embedding layer. The top $d'$ global channel indices define a shared selection map [R39.9, §5, Eqs9–10]. Each layer's projection matrices are separately trainable after this common initialization. The teacher's original weights remain frozen, and projection-wrapped attention, FFN, embedding and output modules form the student during training. After recovery, projections are merged to produce a native reduced-residual-width model [R39.9, Appendix C].

[MATHEMATICALLY-DERIVED] The source's initial singular-value derivative result is about the balanced linear proxy, not a frozen matrix. For $\Sigma=\left[\begin{smallmatrix}1&.5\\.5&1\end{smallmatrix}\right]$, $Q=(1,0)^\top$ and $O=(1,0)$, Eq.39.15 gives $\dot Q=0$, $\dot O=(0,.5)$ and $\dot M=\left[\begin{smallmatrix}0&.5\\0&0\end{smallmatrix}\right]$. The leading singular value has zero initial derivative while the matrix changes. An invariant initial spectrum does not imply zero optimization, a permanent spectral bound or absence of later collapse. The source's Appendix D.8 result must remain scoped to its assumptions.

[PAPER-REPORTED] RED computes effective rank after centering and row-normalizing an activation matrix, using entropy of normalized covariance eigenvalues. This is the effective-rank diagnostic in the paper; numerical rank, singular-value entropy and covariance-eigenvalue entropy are different quantities. Degenerate all-zero centered data have no normalized spectrum and require an explicit invalid-state outcome. The paper associates lower effective rank with worse reasoning, but neither a case study nor a bound on the closest pair of token outputs proves that every reasoning distinction has disappeared [R39.9, §§4–6].


```figure
{
  "id": "fig-39.26",
  "kind": "tensor-flow",
  "title": "Projection inheritance and merge",
  "caption": "A student-width row vector is expanded, transformed by a frozen teacher matrix, then reduced. Compatible linear factors can be merged; nonlinear normalization remains outside this identity.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.14",
  "alt": "A student-width row vector is expanded, transformed by a frozen teacher matrix, then reduced. Compatible linear factors can be merged; nonlinear normalization remains outside this identity.",
  "spec": {
    "steps": [
      {
        "shape": "[B, T, dp]",
        "op": "Student residual"
      },
      {
        "shape": "[B, T, d]",
        "op": "Up map O"
      },
      {
        "shape": "[B, T, d]",
        "op": "Frozen teacher W"
      },
      {
        "shape": "[B, T, dp]",
        "op": "Down map Q"
      }
    ],
    "dims": {
      "B": "Batch",
      "T": "Token positions",
      "d": "Teacher residual width",
      "dp": "Student residual width"
    }
  }
}
```


```figure
{
  "id": "fig-39.27",
  "kind": "matrix",
  "title": "Zero spectral slope does not freeze the matrix",
  "caption": "The finite proxy example has initial dM/dt equal to [[0,.5],[0,0]]. Its leading singular value has zero initial derivative while the matrix changes.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.15",
  "alt": "The finite proxy example has initial dM/dt equal to [[0,.5],[0,0]]. Its leading singular value has zero initial derivative while the matrix changes.",
  "spec": {
    "rows": 2,
    "cols": 2,
    "pattern": "explicit",
    "cells": [
      [
        0,
        0.5
      ],
      [
        0,
        0
      ]
    ],
    "rowLabel": "Quantity",
    "colLabel": "Access or choice",
    "rowTicks": [
      "row 1",
      "row 2"
    ],
    "colTicks": [
      "column 1",
      "column 2"
    ],
    "legend": "Cell values are the stated quantities; they are not empirical performance."
  }
}
```


[DERIVED] Student optimization can then follow several declared paths. Random initialization requires accounting for all training needed to obtain a usable language model. A pretrained independent student transfers task behavior while retaining its existing representation. An inherited width/depth student requires recovery after the structural change. SFT adds response imitation; optional verifiable-reward RL changes the objective and rollout distribution; quantization-aware recovery changes numerical operators. The order matters because the teacher's targets were generated under a particular student structure and precision. A target cache remains reusable only if its prefix law and target interface still match, regardless of student architecture.

[DERIVED] Parameter-efficient training saves optimizer state on frozen weights but can still require their forward activations and input-gradient computation. Frozen weights do not mean free backpropagation through a frozen module whose inputs depend on trainable projections. Deployment parameter count is the merged artifact's count, while trainable projection count and teacher residency describe the recovery job. Report them separately.

## Algorithm

**Algorithm 39.5 — Inherited student recovery with retention gates.** [DERIVED] Inputs are an immutable teacher, architecture specification, source-only calibration/training splits, an untouched retention split, positive integer calibration/update caps and finite deadlines. Output is a merged student artifact and full stage ledger, or a named failure. This explanatory reconstruction does not invent RED's undisclosed production checks.

$$
\begin{aligned}
1.&\quad \text{Validate }0<d'<d,\text{ shapes, tokenizer identity and distinct calibration/train/evaluation manifests.}\\
2.&\quad s_j\leftarrow0;\ \text{collect bounded calibration activations; accumulate disclosed channel statistics.}\\
3.&\quad G\leftarrow\operatorname{Top}_{d'}(s);\ H\leftarrow[e_j]_{j\in G};\ Q\leftarrow H;\ O\leftarrow H^\top.\\
4.&\quad \text{Wrap compatible modules; initialize declared student norms; freeze teacher weights and teacher targets.}\\
5.&\quad \text{For at most }U\text{ batch attempts: compute declared KL/LM/feature loss, masks and denominator.}\\
6.&\quad \text{Skip empty targets without state mutation; rollback nonfinite proposals; otherwise commit projections.}\\
7.&\quad \text{At predeclared validation checkpoints measure quality, retention and representation diagnostics separately.}\\
8.&\quad \text{Merge compatible linear maps into weights; compare wrapped and merged outputs under fixed test inputs.}\\
9.&\quad \text{On merge discrepancy return MERGE\_FAILURE; evaluate final frozen artifact on untouched splits once.}\\
10.&\quad \text{Record optional SFT/RL/quantization as separate bounded stages with new artifact identities.}
\end{aligned}
$$

[DERIVED] Invariants are no target-test selection, unchanged frozen weights during recovery, valid shape correspondence and separate pre/post-merge identities. Validation gates may select among declared checkpoints; the untouched final test cannot. If no checkpoint satisfies a retention requirement, report NO_FEASIBLE_CHECKPOINT rather than relaxing the requirement after seeing results. Costs include calibration teacher forwards, every student/teacher training pass, feature tensors, trainable optimizer state and merge validation. The finite attempt cap bounds empty-batch loops as well as successful updates.

## Implementation

[MATHEMATICALLY-DERIVED] If $N_S$ parameters are resident, $N_{
m train}$ are updated, weight bytes are $b_w$, gradient bytes $b_g$ and optimizer bytes $b_o$, a lower-level training boundary is

$$
M_{\rm student}=b_wN_S+(b_g+b_o)N_{\rm train}+M_{\rm act}+M_{\rm work};\qquad
\operatorname{eRank}=\exp\left(-\sum_jr_j\log r_j\right),\quad r_j=\lambda_j/\sum_k\lambda_k.
$$
*(Eq. 39.16)*

where teacher storage, communication and caches are additional. In the rank diagnostic $\lambda_j$ are covariance eigenvalues, not the global loss mixing weight. A width reduction does not automatically reduce every inner attention/FFN dimension; RED preserves several teacher inner dimensions. Tensor-parallel divisibility, KV-cache shape and fused-kernel compatibility therefore need an explicit deployment check after merging.

[PAPER-REPORTED] RED uses PyTorch, Transformers and DeepSpeed on8H800, packed length2048. Its reported student architectures retain teacher layer counts and attention/FFN structural settings while reducing residual width [R39.9, Appendices F.1–F.3]. Exact package commits, seeds and training precision are NOT-DISCLOSED in the inspected protocol; they are not filled from hardware conventions. Its Appendix C repeats an LM-loss label where a second loss is described, so an exact implementation coefficient map cannot be reconstructed solely from that sentence.


```figure
{
  "id": "fig-39.28",
  "kind": "memory-stack",
  "title": "Trainable state is distinct from resident weights",
  "caption": "Analytical example with 1.5 billion resident parameters and .94 billion trainable parameters. Teacher memory, caches and activations are deliberately outside these two bars.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.16",
  "alt": "Analytical example with 1.5 billion resident parameters and .94 billion trainable parameters. Teacher memory, caches and activations are deliberately outside these two bars.",
  "spec": {
    "format": "bytes",
    "variables": {
      "Ns": 1500000000,
      "Nt": 940000000,
      "bw": 2,
      "bg": 4,
      "bo": 8
    },
    "bars": [
      {
        "label": "Frozen-weight residency",
        "segments": [
          {
            "label": "Student weights",
            "formula": "bw*Ns"
          }
        ]
      },
      {
        "label": "Trainable state",
        "segments": [
          {
            "label": "Gradients",
            "formula": "bg*Nt"
          },
          {
            "label": "Optimizer moments",
            "formula": "bo*Nt"
          }
        ]
      }
    ]
  }
}
```


## Experimental design

### Reported experiments

| Field | RED source protocol [R39.9, §§5–6; Appendices F–G] |
|---|---|
| Teacher/student | Llama3.2-3B-Instruct→1.5B; Qwen2.5-3B-Instruct→1.7B; Qwen2.5-7B-Instruct→4B; inherited frozen modules/trainable maps |
| Data |10/20/18B consumed tokens respectively; mixed educational/web/instruction corpora; calibration15 examples across three Nemotron subsets |
| Optimization | Adam(.9,.999); sequence2048; token batch49152/32768/32768; LR $10^{-4}/6.7\cdot10^{-5}/10^{-4}$; linear schedule, warmup.005; default temperature1 |
| Hardware/time boundary |8H800; source reports30/79/140hours respectively;1.5B peak56GB/GPU at6144tokens/card; isolated generation/cache bill NOT-DISCLOSED |
| Evaluation | lm-evaluation-harness/Transformers; GSM8K5-shot exact match, MBPP3-shot pass@1, others0-shot; package revisions/seeds/uncertainty NOT-DISCLOSED |
| Factorial/controls | Random versus activation-aware initialization at temperature1/40; orthogonal initialization/regularization; official versus retrained LRC distinguished |

[PAPER-REPORTED] The autoencoder proxy uses teacher representations and a1200-dimensional bottleneck,100 Adam epochs at $10^{-4}$. The main text reports15 SlimOrca samples whereas Appendix F.2 mentions five for this experiment; this count discrepancy is unresolved and must remain visible. The proxy result is a representation reconstruction study, not a full model-training benchmark.

## Observations

**What the paper claims.** [PAPER-REPORTED] Activation-aware initialization stabilizes inherited representation recovery and improves reasoning in the tested width-reduced students [R39.9, §§5–6].

**What the evidence shows.** [PAPER-REPORTED] Table6's factorial GSM8K scores are random/.05 at temperature1, random/.04 at40, activation-aware/.44 at1 and/.08 at40. MMLU is.25/.50/.50/.52 respectively. The strong initialization effect at temperature1 and strong temperature interaction prevent attributing the main comparison to one scalar change alone. Table7 reports random-orthogonal GSM8K.30 versusRED.44. Appendix G.1's retrained LRC reaches.04 GSM8K, while the official checkpoint used in the main table is.21; mixing these baselines would exaggerate or obscure the comparison. Generic conversational SFT on.2B UltraChat tokens changes the cited LRC GSM8K.21→.18, a negative result for that recipe, not proof of irreversible reasoning loss.

**What we infer.** [DERIVED] Preserved initialization and an appropriate objective can interact strongly. Representation geometry is an informative diagnostic, while teacher inheritance, numerical precision, deployment shape and retention remain separate dimensions of student quality.

**What remains unknown.** [NOT-DISCLOSED] Exact artifacts/seed uncertainty, the calibration-count discrepancy, the full loss-coefficient implementation and a matched scratch-versus-inherited total-cost experiment prevent universal architecture or causal reasoning claims.


```figure
{
  "id": "fig-39.29",
  "kind": "chart",
  "title": "Initialization and temperature interact",
  "caption": "Reported RED Table6 factorial for the 1.5B comparison: GSM8K and MMLU are shown as fractions. These four settings isolate an interaction more clearly than the main combined-method comparison.",
  "placement": "wide",
  "evidence": "PAPER-REPORTED",
  "source": "R39.9",
  "alt": "Reported RED Table6 factorial for the 1.5B comparison: GSM8K and MMLU are shown as fractions. These four settings isolate an interaction more clearly than the main combined-method comparison.",
  "spec": {
    "type": "bar",
    "x": {
      "label": "Initialization and temperature"
    },
    "y": {
      "label": "Reported score",
      "format": "raw"
    },
    "categories": [
      "Random tau1",
      "Random tau40",
      "Aware tau1",
      "Aware tau40"
    ],
    "series": [
      {
        "id": "gsm",
        "label": "GSM8K",
        "values": [
          0.05,
          0.04,
          0.44,
          0.08
        ]
      },
      {
        "id": "mmlu",
        "label": "MMLU",
        "values": [
          0.25,
          0.5,
          0.5,
          0.52
        ]
      }
    ]
  },
  "context": {
    "hardware": "8 H800 GPUs",
    "model": "RED/LRC1.5B factorial",
    "precision": "NOT-DISCLOSED",
    "sequenceLength": "Packed2048 training tokens",
    "ioDistribution": "10B consumed mixed training tokens",
    "concurrency": "49152 training tokens/batch",
    "runtimeVersion": "PyTorch/Transformers/DeepSpeed unpinned",
    "measurementBoundary": "Source Table6 MMLU/GSM8K fractions"
  }
}
```


```figure
{
  "id": "fig-39.30",
  "kind": "chart",
  "title": "Proxy reconstruction and effective rank",
  "caption": "Reported RED linear-autoencoder comparisons. Effective rank and reconstruction loss are proxy diagnostics, not a causal curve of model reasoning quality; sample-count discrepancy is noted in the protocol.",
  "placement": "inline",
  "evidence": "PAPER-REPORTED",
  "source": "R39.9",
  "alt": "Reported RED linear-autoencoder comparisons. Effective rank and reconstruction loss are proxy diagnostics, not a causal curve of model reasoning quality; sample-count discrepancy is noted in the protocol.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "Reconstruction loss",
      "format": "fixed2"
    },
    "y": {
      "label": "Reconstructed effective rank",
      "format": "fixed2"
    },
    "series": [
      {
        "id": "random",
        "label": "Random",
        "points": [
          [
            1.24,
            67.06
          ]
        ]
      },
      {
        "id": "orth",
        "label": "Random orthogonal",
        "points": [
          [
            0.5,
            149.97
          ]
        ]
      },
      {
        "id": "aware",
        "label": "Activation-aware",
        "points": [
          [
            0.08,
            249.44
          ]
        ]
      }
    ]
  },
  "context": {
    "hardware": "Proxy device NOT-DISCLOSED",
    "model": "RED linear autoencoder, teacher hidden states",
    "precision": "NOT-DISCLOSED",
    "sequenceLength": "4169 teacher token rows in main text",
    "ioDistribution": "SlimOrca proxy; sample count discrepancy",
    "concurrency": "One proxy experiment, seeds NOT-DISCLOSED",
    "runtimeVersion": "Adam, exact package version NOT-DISCLOSED",
    "measurementBoundary": "Source Table3/7 proxy loss and eRank"
  }
}
```


## Failure modes

[DERIVED] A projection can preserve selected channels while deleting a rare capability. Feature loss can improve while answer quality falls. A merged artifact can differ because a nonlinear or normalized operation was folded incorrectly. Quantization after recovery can perturb low-margin decisions, while RL after SFT can overwrite retained behavior. Effective-rank collapse diagnoses one activation sample and cannot certify all-input loss or permanent irrecoverability.

## Siblings

[DERIVED] Compare random, pretrained independent and inherited students on total consumed data/compute, deployable parameter count and target quality. Compare full updates with LoRA on trainable state **and** representational freedom; Recoverability changes both update type and capacity across scales, so its downstream results do not isolate size alone [R39.3, Appendix A]. Compare output-only with output-plus-feature recovery under the same target law and denominator.

## Extensions

### Improvements

[PAPER-REPORTED] The offline study reports KL-only MMLU59.9/GSM8K65.9 and KL-plus-hidden-MSE60.6/67.5, while feature-only recovery is around28/4 under its setting [R39.1, §4.4]. RED's activation importance alternatives yield similar reported MMLU.50–.51/GSM8K.44–.45, with calibration-channel overlap used as a sensitivity diagnostic [R39.9, Appendix G.6]. Neither result establishes that feature matching or one channel-selection rule is necessary for all student architectures.

## Limitations

[DERIVED] Linear proxy dynamics, empirical representation rank and end-to-end reasoning are different evidence levels. A single final quality score cannot separate inheritance, training data, temperature, optimizer or selection. The chapter does not reproduce structural-pruning machinery owned by Chapter41 or claim tested quantization/RL recovery absent eligible evidence.

## Reproducibility

[DERIVED] Publish architecture shapes, selected channel IDs, calibration manifest, frozen/trainable parameter masks, exact loss reductions, stage budgets and merge equivalence tolerances. Retention should be reported per task rather than hidden in a pooled score. The projection identities and proxy counterexample are analytical; source training and timing remain PAPER-REPORTED, with no new model execution.

## References

[R39.1](references.md#r39-1), [R39.3](references.md#r39-3), [R39.9](references.md#r39-9).
