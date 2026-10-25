---
id: "ms.section.41.4"
entity_type: "section"
title: "41.4 — Recovery"
volume: 2
part: 7
chapter: 41
section: 41.4
slug: "41-4-recovery"
parent: "ms.chapter.41"
prev_sibling: "ms.section.41.3"
next_sibling: "ms.section.41.5"
children: []
prerequisites: ["ms.chapter.13","ms.chapter.14","ms.chapter.15","ms.chapter.16","ms.chapter.17","ms.chapter.25","ms.chapter.26","ms.chapter.27","ms.chapter.28","ms.chapter.39","ms.chapter.40"]
downstream: ["ms.chapter.42","ms.chapter.43","ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle":["inference","adaptation"],"mechanism":["pruning","sparsity","adaptive_computation"],"feedback_setting":[],"modality":["text","image"]}
papers: []
implementations: ["impl.pytorch","impl.hugging-face-transformers","impl.nvidia-cutlass","impl.nvidia-cuda"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# 41.4 — Recovery

## Scope

[DERIVED] Recovery adapts a reduced model after selection. This section owns continued training, compression-specific distillation, layerwise reconstruction, and composition with quantization. The baseline is the unrecovered compressed checkpoint; an uncompressed continued-training control is necessary to distinguish recovery from ordinary adaptation. Distillation objectives are defined canonically in [Chapter 39](../ch39-knowledge-response-and-policy-distillation/README.md). Here the question is how they interact with an enforced compressed hypothesis class and a complete construction budget.

## Why this exists

[MATHEMATICALLY-DERIVED] Deleting parameters changes both the set of realizable functions and the input distributions seen by later layers. A locally optimal mask can therefore leave an avoidable error in surviving parameters. Recovery searches the remaining function class; it cannot restore a removed direction unless the retained architecture can represent a compensating function. Calling every downstream improvement “recovery” confounds correction of compression damage with new domain knowledge, alignment, or evaluation contamination.

[PAPER-REPORTED] Minitron's practical report separately compresses Llama 3.1 8B and Mistral NeMo 12B and uses corrected teachers with logit-only distillation [R41.6](references.md), §§2–3. Puzzle likewise distinguishes local block training, architecture assembly, and global distillation [R41.8](references.md), §§3–5. These multi-stage methods cannot be compared to training-free pruning without accounting for their additional tokens and teacher execution.

## Intuition

[MATHEMATICALLY-DERIVED] Recovery is constrained optimization. With a fixed mask, gradients can move only surviving entries. With a smaller dense architecture, gradients can move every parameter but cannot change removed dimensions. A teacher distribution supplies a target over possible next tokens; a reconstruction target supplies intermediate geometry. These signals constrain different errors. Optimizing one does not establish improvement in the others.

## Formulation

| Symbol | Meaning |
|---|---|
| $\theta_c,\mathcal C$ | Compressed parameters and allowed parameter/graph set |
| $\mathcal M$ | Fixed weight mask, when scalar sparsity is used |
| $p_T,p_{\theta_c}$ | Frozen teacher and recovered student distributions on a shared prefix |
| $\gamma_{\rm rec},\gamma_{\rm LM},\gamma_{\rm KD}$ | Nonnegative recovery-objective weights |
| $h^T_\ell,h^S_j,A_j$ | Teacher/student states and a declared alignment map |
| $K_{\max},\alpha_k$ | Maximum optimization steps and step-size schedule |

[DERIVED] A compression-specific objective can combine already defined likelihood and distillation terms with aligned feature reconstruction:
$$
\mathcal J(\theta_c)=
\gamma_{\rm LM}\mathcal L_{\rm LM}
+\gamma_{\rm KD}\mathcal L_{\rm KD}
+\gamma_{\rm rec}
\frac{\sum_{j,t}m_t\|A_jh^S_{j,t}-h^T_{\phi(j),t}\|_2^2}
{\sum_{j,t}m_t\,d^T_j},
\qquad\theta_c\in\mathcal C.
$$
*(Eq. 41.19)*

where $\phi$ maps student to teacher layers, $d^T_j$ is aligned feature width, and the denominator averages squared feature error per admitted coordinate. This is an explanatory composite, not a claim that every cited method uses all three terms. Token masks and temperature conventions must match Chapter 39.

[MATHEMATICALLY-DERIVED] For a fixed scalar mask, a projected update is
$$
\theta_c^{k+1}=
\mathcal M\odot\left(\theta_c^k-\alpha_k\nabla_{\theta_c}\mathcal J\right),
\qquad
(1-\mathcal M)\odot\theta_c^{k+1}=0.
$$
*(Eq. 41.20)*

Momentum, weight decay, and optimizer state must be included in the actual update contract. Zeroing gradients alone does not constrain a momentum-driven update; projecting the final weights enforces the support invariant.

```figure
{
  "id": "fig-41.12",
  "kind": "cycle",
  "title": "Recovery under a fixed compression contract",
  "caption": "Recovery updates the permitted model, then validates support and independent quality before committing a checkpoint. Export follows acceptance.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.20",
  "alt": "Compressed checkpoint enters recovery loss, constrained update, support validation, and quality evaluation. Failure returns to the previous valid checkpoint; acceptance enables export.",
  "spec": {
    "stages": [
      {
        "id": "c",
        "kind": "model",
        "label": "compressed checkpoint"
      },
      {
        "id": "l",
        "kind": "objective",
        "label": "declared recovery loss"
      },
      {
        "id": "u",
        "kind": "process",
        "label": "constrained update"
      },
      {
        "id": "v",
        "kind": "process",
        "label": "support validation"
      },
      {
        "id": "q",
        "kind": "metric",
        "label": "independent quality"
      },
      {
        "id": "e",
        "kind": "state",
        "label": "accepted export"
      }
    ],
    "edges": [
      {
        "from": "c",
        "to": "l"
      },
      {
        "from": "l",
        "to": "u"
      },
      {
        "from": "u",
        "to": "v"
      },
      {
        "from": "v",
        "to": "q"
      },
      {
        "from": "q",
        "to": "c",
        "kind": "feedback",
        "label": "retain valid checkpoint"
      },
      {
        "from": "q",
        "to": "e"
      }
    ]
  }
}
```
```figure
{
  "id": "fig-41.13",
  "kind": "calculator",
  "title": "Teacher and student recovery compute",
  "caption": "Illustrative construction accounting in Eq. 41.23 excludes selection, teacher correction, and export, which must be added separately. No named-model FLOP values are implied.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.23",
  "alt": "Calculator multiplies consumed recovery tokens by teacher forward and student training FLOPs per token, displaying both contributions and their sum.",
  "spec": {
    "tex": "F_{rec}=D_{rec}(f_T+f_S)",
    "equation": "41.23",
    "inputs": [
      {
        "symbol": "Drec",
        "label": "recovery tokens",
        "default": 1000000,
        "min": 1000,
        "max": 1000000000,
        "scale": "linear",
        "format": "tokens"
      },
      {
        "symbol": "fT",
        "label": "teacher FLOPs per token",
        "default": 1000000,
        "min": 1000,
        "max": 1000000000,
        "scale": "linear",
        "format": "flops"
      },
      {
        "symbol": "fS",
        "label": "student training FLOPs per token",
        "default": 2000000,
        "min": 1000,
        "max": 1000000000,
        "scale": "linear",
        "format": "flops"
      }
    ],
    "outputs": [
      {
        "symbol": "Ft",
        "label": "teacher FLOPs",
        "formula": "Drec*fT",
        "format": "flops"
      },
      {
        "symbol": "Fs",
        "label": "student FLOPs",
        "formula": "Drec*fS",
        "format": "flops"
      },
      {
        "symbol": "Ftot",
        "label": "recovery FLOPs",
        "formula": "Ft+Fs",
        "format": "flops",
        "emphasis": true
      }
    ]
  }
}
```
```figure
{
  "id": "fig-41.14",
  "kind": "stat-panel",
  "title": "Pruning and rounding cross term",
  "caption": "Analytical scalar perturbations show why isolated squared errors do not generally add. Positive and negative perturbations can reinforce or cancel.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.22",
  "alt": "Illustrative scalar pruning error 0.2 and rounding error minus 0.1 have isolated squared-error sum 0.05 but combined squared error 0.01.",
  "spec": {
    "header": "SCALAR ERROR COMPOSITION",
    "variables": {
      "ep": 0.2,
      "eq": -0.1,
      "g": 1
    },
    "rows": [
      {
        "key": "isolated-error sum",
        "formula": "g*(ep^2+eq^2)",
        "format": "fixed2"
      },
      {
        "key": "cross term",
        "formula": "2*g*ep*eq",
        "format": "fixed2"
      },
      {
        "key": "combined error",
        "formula": "g*(ep+eq)^2",
        "format": "fixed2"
      }
    ]
  }
}
```


## Mechanism

### Methodology

[DERIVED] **Continued training** uses the reduced model's likelihood objective on an independently specified token distribution. Initialization from the selected parent preserves surviving weights, but its optimizer state may be absent, sliced, or deliberately reset. These are distinct experimental choices. A meaningful recovered comparison holds the data, number of consumed target tokens, optimization schedule, and validation selection procedure constant. Otherwise a method with more recovery compute may appear to have a superior selection rule.

[DERIVED] **Distillation after structural reduction** requires a teacher-prefix contract. Teacher and student must see identical tokenized prefixes for categorical-logit comparison. A different vocabulary or tokenizer needs a different alignment or response-based formulation. Matching teacher hidden states requires declared layer correspondence and width mapping; forcing every surviving student block to reproduce an unrelated teacher depth can impose conflicting constraints. A frozen teacher is an information source whose original errors remain targets unless a separate correction procedure changes it.

[PAPER-REPORTED] The practical Minitron report fine-tunes teachers on its continued-training blend before distillation when original pretraining data are unavailable; it reports approximately 127B teacher-correction tokens and uses forward-KL logit-only student training, omitting hard-label language-model loss [R41.6](references.md), §3.3, Figure 4, Tables 1 and 4. This is an observed recipe on those models and that data distribution, not a general theorem that corrected teachers are always preferable.

[MATHEMATICALLY-DERIVED] If teacher correction reduces divergence from the recovery-data optimum but harms another deployment domain, the student objective inherits that trade-off. A teacher evaluated only on the recovery blend cannot establish retained general capability. The correct comparison therefore separates the original parent, corrected teacher, unrecovered student, and recovered student. Only the student-minus-unrecovered-student difference measures recovery at the selected compression point.

[DERIVED] **Layerwise reconstruction** solves a small problem against local outputs before full end-to-end training. With compressed input $X'$ and target $Y_T$, a fixed right factor $B_r$ gives $Z=B_rX'$. The least-squares left-factor update is
$$
A^\star=Y_TZ^\top(ZZ^\top)^{-1}
$$
*(Eq. 41.21)*

when $ZZ^\top$ is invertible. A rank-deficient design needs a pseudoinverse or regularization, both of which change uniqueness or the objective. The closed-form solve can correct scale and rotations within the retained subspace; it cannot recover information absent from $Z$. Reconstructing each layer on compressed upstream activations reduces one form of train/use mismatch, but local solutions can still interact after composition.

[PAPER-REPORTED] SVD-LLM v3 (2024), §3.2 Eq. 7 uses the local closed-form strategy; v5 (2025), §3.2 and Appendix A.1 replaces this with two factor-wise LoRA phases [R41.5](references.md). First it freezes the right factor while adapting the left; next it freezes the updated left while adapting the right. Updates merge into each rectangular factor, preserving the factorized artifact. Puzzle instead trains local alternatives and later applies global distillation [R41.8](references.md), §§3 and 5.

[MATHEMATICALLY-DERIVED] For factors $A\in\mathbb R^{d_o\times r}$ and $B_r\in\mathbb R^{r\times d_i}$, updates $A+\Delta A$ and $B_r+\Delta B_r$ preserve product rank at most $r$ regardless of the adapter ranks, because their shared inner dimension remains $r$. Each recovery phase has its own finite step limit and frozen-factor invariant; a failed phase retains the last valid factor pair. Joint factor optimization lacks a general monotonic-loss guarantee, but alternating stochastic optimization also lacks that guarantee without additional step-size and smoothness conditions. The source's empirical comparison must not be promoted to a convergence theorem.

[MATHEMATICALLY-DERIVED] **Adapter recovery** can preserve a structural architecture but violate scalar sparsity. A dense low-rank update $\Delta W=UV$ is generally dense even when the base $W_c$ is sparse. Merging $W_c+\Delta W$ can fill every pruned entry. Support-preserving adaptation must use $\mathcal M\odot(W_c+\Delta W)$ or an equivalent constrained representation, then verify the packed support again. Applying a mask after the low-rank merge is not equal to preserving an independently executable low-rank pair; masking can increase the effective rank. Thus the adaptation mechanism and deployment representation must be audited together.

[MATHEMATICALLY-DERIVED] **Quantization composition** introduces a second perturbation. Let pruning give $W_p=W+\Delta_p$ and quantization give $W_q=W_p+\Delta_q$. Then
$$
\mathcal E(W_q)=
\operatorname{tr}(\Delta_pG\Delta_p^\top)
+\operatorname{tr}(\Delta_qG\Delta_q^\top)
+2\operatorname{tr}(\Delta_pG\Delta_q^\top).
$$
*(Eq. 41.22)*

The cross term can be positive or negative; adding isolated error measurements omits it. Pruning changes ranges and quantization groups, while quantization changes selection scores and reconstruction residuals. Rounding must map zero to a representable zero if support is to remain exact. Recalibration after extraction is required by the artifact's numerical contract, rather than assumed equivalent to the parent's scales.

[PAPER-REPORTED] SparseGPT's joint construction quantizes retained values during its sequential compensation pass so later decisions respond to earlier pruning and rounding error [R41.1](references.md), §3.5, Eq. 7. It differs from sparsifying first and quantizing afterward without re-estimating compensation. This is an optimization interaction; executable joint sparse-low-bit support is a separate hardware question.

[MATHEMATICALLY-DERIVED] Recovery costs must include teacher correction, teacher forward passes, student forward/backward passes, stored logits or features, optimizer state, and checkpoint writes. With teacher per-token forward cost $f_T$ and student training cost $f_S$, a simple counted boundary is
$$
F_{\rm build}=F_{\rm select}+F_{\rm correct}
+D_{\rm rec}(f_T+f_S)+F_{\rm export}.
$$
*(Eq. 41.23)*

Here $D_{\rm rec}$ is consumed recovery tokens, not available dataset size. Online teacher inference adds parameters and activation memory; offline logits add storage and I/O. Distributed recovery communicates gradients and possibly teacher states under the actual sharding layout. Fewer trainable adapter parameters do not remove the teacher's forward computation. No generic energy or monetary number is disclosed; they require measured power/time and infrastructure prices over the same construction boundary.

## Algorithm

### Algorithm 41.4 — Compression-constrained recovery

[DERIVED] Inputs are a fixed extracted graph or support $\mathcal C$, a frozen declared teacher, recovery data, positive integer attempt budget $K_{\max}$, and a fixed validation rule. State comprises student parameters, optimizer state and the best admissible candidate $B$. Output is $B$ or an explicit absence of an admissible candidate; an unrecovered baseline is returned as a candidate only if it passes the same validity rule.

$$
\begin{aligned}
1.\;&\theta_c^0\leftarrow\mathsf{extract}(\theta_T);\quad o_0\leftarrow\mathsf{init};\quad
 k\leftarrow0;\quad B\leftarrow\mathsf{admissibleBaseline}(\theta_c^0).\\
2.\;&k=K_{\max}\Rightarrow\text{go to 9};\quad (x,m)\leftarrow\mathsf{nextBatch}.\\
3.\;&\sum_tm_t=0\Rightarrow
 (k\leftarrow k+1;\ (\theta_c^k,o_k)\leftarrow(\theta_c^{k-1},o_{k-1});\ \text{return to 2}).\\
4.\;&u_T\leftarrow\mathsf{stopgrad}(f_T(x));\quad
 u_S\leftarrow f_{\theta_c^k}(x);\quad \mathcal J_k\leftarrow\text{Eq. 41.19};\quad
 g_k\leftarrow\nabla\mathcal J_k.\\
5.\;&\text{nonfinite loss or gradient}\Rightarrow
 \mathsf{returnFailed}(\theta_c^k,o_k,B).\\
6.\;&(\widetilde\theta,\widetilde o)\leftarrow
 \mathsf{optimizerStep}(\theta_c^k,o_k,g_k);\quad
 \theta^+\leftarrow\mathsf{project}_{\mathcal C}(\widetilde\theta).\\
7.\;&\neg\mathsf{finite}(\theta^+,\widetilde o)\lor\neg\mathsf{valid}(\theta^+)
 \Rightarrow\mathsf{returnFailed}(\theta_c^k,o_k,B).\\
8.\;&(\theta_c^{k+1},o_{k+1})\leftarrow(\theta^+,\widetilde o);\quad
 B\leftarrow\mathsf{keepBestAdmissible}(B,\theta^+,q_{\rm val});\quad
 k\leftarrow k+1;\ \text{return to 2}.\\
9.\;&B=\varnothing\Rightarrow\mathsf{returnNoAdmissibleCandidate};\quad
 \text{otherwise return }B.
\end{aligned}
$$
*(Eq. 41.24)*

[DERIVED] Validate $K_{\max}$ and the initial finite state before entering the loop. Empty batches consume attempts and preserve both parameter and optimizer state; they cannot prevent termination. A rejected update is never followed by an optimizer commit. Support or extracted-graph validity is invariant, teacher parameters remain unchanged, and each nonterminal loop advances $k$. The validation set selects a candidate; [§40.6's independent acceptance discipline](../ch40-quantization-from-numerical-model-to-deployable-artifact/40-6-evaluation.md) still requires an untouched final evaluation. At most $K_{\max}$ batches are attempted. Exhausting this budget does not promise closure of the parent–student quality gap, and the procedure returns a failure record rather than silently treating a rolled-back state as accepted recovery.

## Implementation

[OFFICIAL-DOCUMENTATION] NVIDIA Model Optimizer's sparsity guide documents metadata-preserving save/restore and warns that exporting to a plain **PyTorch — Model / autograd framework** module stops enforcing sparsity during later fine-tuning [R41.16](references.md), “Save and restore.” This documented boundary directly motivates post-update support validation.

[DERIVED] Recovery through **Hugging Face Transformers — Model definition / adaptation** must preserve the extracted configuration, tokenizer, tied embeddings, and attention-group maps. When tensor-parallel partitions change, optimizer state and teacher-feature communication need new placements. Padding valid training examples to satisfy a kernel should not add target loss. A layerwise solver can stream batches to form normal equations, but retaining all teacher states can dominate auxiliary memory. Precision, accumulator dtype, loss scaling, and reduction order require explicit configuration; none were code-verified in this edition.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The compact Minitron study ablates logits-only versus combined intermediate-state losses and longer retraining: its Table 16 reports different MMLU, HellaSwag, and HumanEval behavior at 18.9B and 94B recovery tokens [R41.7](references.md), Appendix A.3, Table 16. This isolates a loss component at the smaller token budget and separately exposes a larger-data effect; it is not evidence that the same loss choice transfers to arbitrary compressed students.

[PAPER-REPORTED] Puzzle's global-distillation ablation compares the same assembled child before and after uptraining. For its 70B-parent-derived child, Table 13 reports MMLU 78.39 to 80.20 and MT-Bench 8.67 to 8.99 [R41.8](references.md), §8.3. Section 8.1 and Table 1 separately test local-training/data and loss choices. Evaluator and data settings remain those of the source; this manuscript did not reproduce them.

## Observations

**What the paper claims.** [PAPER-REPORTED] Puzzle attributes improved assembled-child benchmark results to final global recovery, while its loss ablation finds some combinations unhelpful [R41.8](references.md), Table 1 and §8.3.

**What the evidence shows.** [DERIVED] These are within-pipeline ablations at the source's budgets. They establish neither universal loss weights nor recovery to the original parent on every task.

**What we infer.** [MATHEMATICALLY-DERIVED] Equation 41.22 makes independent pruning/quantization error addition invalid unless the cross term vanishes. Equation 41.20 explains why support enforcement must include the optimizer's complete update.

**What remains unknown.** [NOT-DISCLOSED] Recovery-data coverage of every production domain, a universal mapping from hidden-state error to task reliability, and full construction energy are not established by the cited studies.

## Failure modes

> **Failure mode — Support regrowth.** [DERIVED] *Symptom:* exported weights violate the intended pattern after adaptation. *Cause:* dense adapter merge, momentum, or loss of mask enforcement. *Detection:* validate every packed support group after recovery. *Mitigation:* enforce the constraint throughout updates and re-export.

> **Failure mode — Recovery becomes domain overwrite.** [DERIVED] *Symptom:* target-domain gains accompany unrelated task losses. *Cause:* recovery objective and data emphasize a narrower distribution. *Detection:* compare original parent, corrected teacher, and student on independent domains. *Mitigation:* restrict claims and select checkpoints using declared retention criteria.

## Siblings

[DERIVED] [One-shot reconstruction](41-2-selection-criteria.md) spends local calibration compute without global training; [distillation](../ch39-knowledge-response-and-policy-distillation/README.md) defines information access and objectives; [quantization](../ch40-quantization-from-numerical-model-to-deployable-artifact/README.md) changes precision. They are separate interventions whose ordered composition must be evaluated.

## Extensions

### Improvements

[PAPER-REPORTED] The practical Minitron report extends the earlier compact-model recipe to parents whose original training data are unavailable and explicitly studies teacher correction [R41.6](references.md), §3.3, Figure 4. The changed mechanism adds teacher training and cost. SliceGPT reports that recovery fine-tuning did not yield improved OPT results despite its search, while helping other evaluated families [R41.4](references.md), §4, Figure 6. This negative result limits a universal “fine-tuning repairs pruning” claim.

## Limitations

[DERIVED] A recovery loss can converge inside a class that remains unable to express the required function. Local reconstruction cannot repair a discarded subspace by optimization alone. A cheaper student is economically useful only after amortizing selection, correction, recovery, and export over a sufficient deployment workload.

## Reproducibility

[UNVERIFIED] No recovery run was executed. The artifact requires separate token/compute ledgers for teacher correction and student recovery, optimizer-state policy, support enforcement, layer maps, validation selection, quantization order, and final dispatch evidence. Mutable tooling is unpinned; paper configurations are reported rather than independently validated.

## References

[R41.1](references.md), SparseGPT §3.5; [R41.4](references.md), SliceGPT §4; [R41.5](references.md), SVD-LLM §3.2; [R41.6](references.md), practical Minitron §3; [R41.7](references.md), compact Minitron Appendix A; [R41.8](references.md), Puzzle §§3–5 and §8; [R41.16](references.md), Model Optimizer guide.
