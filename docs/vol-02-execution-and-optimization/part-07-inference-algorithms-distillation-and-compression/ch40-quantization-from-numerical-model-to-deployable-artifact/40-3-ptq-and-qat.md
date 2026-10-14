---
id: ms.section.40.3
entity_type: section
title: PTQ and QAT
volume: 2
part: 7
chapter: 40
section: 40.3
slug: 40-3-ptq-and-qat
parent: ms.chapter.40
prev_sibling: ms.section.40.2
next_sibling: ms.section.40.4
children: []
prerequisites: [ms.chapter.23, ms.chapter.39, ms.section.40.1]
downstream: [ms.section.40.4, ms.section.40.6]
related: []
relations: []
axes: {lifecycle: [adaptation, post_training, inference], mechanism: [quantization, calibration, recovery_training], feedback_setting: [], modality: [text]}
papers: [P15]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.torchtune]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 40.3 — PTQ and QAT

## Scope

[DERIVED] This section separates choosing a representation after training, optimizing discrete rounding, training with simulated quantization and recovering a model through teacher matching. The baseline is a frozen checkpoint quantized by nearest rounding. Success requires held-out preservation under the exported numerical contract. Calibration loss, recovery-training loss and independent task evaluation are different quantities.

## Why this exists

[DERIVED] A frozen model can expose activation statistics cheaply, but cannot correct a destructive representation without changing scales, codes or parameters. A trainable model can compensate for quantization, but only if its training forward pass resembles deployment. Replacing a discontinuous quantizer by a differentiable identity in both passes trains the wrong function. Keeping quantization in the forward pass and replacing only its derivative creates a useful surrogate, whose optimization behavior must be evaluated rather than mistaken for an exact gradient.

[PAPER-REPORTED] AdaRound optimizes rounding with local reconstruction rather than assuming nearest rounding is optimal [R40.7, §3]. The 2026 QAD report changes the recovery objective from task labels to teacher distributions [R40.10, §3]. Those interventions alter different parts of the pipeline.

## Intuition

[DERIVED] Calibration estimates the workload directions that a representation should preserve. Recovery training modifies the model so useful computation lands closer to a finite codebook. Distillation additionally specifies what behavior should survive. If task labels describe only one answer, their loss does not constrain the probabilities of other answers as strongly as full distribution matching. Conversely, preserving a teacher's probabilities does not correct the teacher's errors.

## Formulation

| Local symbol | Meaning |
|---|---|
| $\phi$ | Quantizer parameters: ranges, scales and rounding controls |
| $\theta_j,\widetilde\theta_j$ | Latent trainable parameters and fake-quantized forward parameters |
| $\mathcal D_c,\mathcal D_r,\mathcal D_e$ | Calibration, recovery and independent evaluation populations |
| $h(v)$ | Relaxed rounding indicator in $[0,1]$ |
| $\gamma_j$ | Binarization-penalty coefficient at recovery step $j$ |
| $\eta_j,J_{\max}$ | Learning rate and finite update budget |

[MATHEMATICALLY-DERIVED] A calibration objective can be local:

$$
\phi^\star=\arg\min_{\phi\in\Phi}
\mathbb E_{u\sim\mathcal D_c}
\|f_\ell(u;\theta)-f_\ell(u;\mathcal Q_\phi(\theta))\|_2^2 .
$$
*(Eq. 40.9)*

where $\Phi$ specifies the searched quantizers and $u$ denotes layer inputs. Calibration estimates a population-specific criterion. Calling $\mathcal D_c$ “representative” is a hypothesis about deployment overlap, not a mathematical property of its size.

[MATHEMATICALLY-DERIVED] For uniform codes, a rounding relaxation can be written

$$
\widetilde w=s\left(\lfloor w/s\rfloor+h(v)\right),\quad
\mathcal L_{\rm round}=\mathcal L_{\rm reconstruction}
+\gamma_j\sum_i\left[1-|2h(v_i)-1|^{p_j}\right].
$$
*(Eq. 40.10)*

where the penalty favors $h=0$ or $1$ and $p_j$ controls its shape. This is an explanatory form of a rounding objective; exact AdaRound details and its asymmetric reconstruction are in [R40.7, §3.3, Eqs. 21–25]. Quantizer range and clipping remain constraints, even when they are suppressed in this local expression.

## Mechanism

### Methodology

> **Definition — PTQ.** [DERIVED] Construction of a quantized representation from an already trained model without full-model recovery training.

> **Definition — Fake quantization.** [DERIVED] Forward encode/decode simulation that retains a higher-precision tensor representation for execution or optimization.

> **Definition — QAT.** [DERIVED] Recovery optimization with a simulated quantized forward computation and an explicitly declared gradient surrogate.

[DERIVED] PTQ first freezes the source model and preprocessing, chooses eligible operators, and collects statistics on $\mathcal D_c$. It then chooses ranges or code assignments, transforms operators if applicable, and exports packed state. The held-out set must remain outside these decisions. If a layer uses inputs from the progressively quantized prefix, calibration includes upstream representation errors. If it uses only original-model inputs, it estimates a different local problem. Neither workflow should be silently substituted for the other.

[DERIVED] Outliers are not intrinsically irrelevant. A magnitude tail can reflect a feature important to the loss. Clipping it shrinks the central spacing while removing that feature's extreme response. A useful diagnostic therefore records saturation by layer, token position and domain alongside output distortion. Calibrating only short prose can miss code punctuation, long-prefix retrieval positions or rarely selected experts. This is a consequence of distribution support, not a claim of a measured universal failure frequency.

[PAPER-REPORTED] AdaRound derives local reconstruction through approximations to task curvature and uses an annealed relaxation for discrete rounding [R40.7, §3.1–3.3]. Its originating tests include vision networks. Its historical evidence does not establish unchanged effectiveness on modern reasoning models.

[MATHEMATICALLY-DERIVED] QAT evaluates $\widetilde\theta=\mathcal Q_\phi(\theta)$ in the forward pass while retaining latent parameters for updates. For a uniform nearest quantizer, the true derivative with respect to an interior weight is zero almost everywhere. A straight-through estimator replaces that derivative, for example by one inside the unclipped interval and zero outside. The resulting update is a surrogate direction, not the gradient of the exact discrete forward map.

$$
\widetilde u=s\,\operatorname{clip}(\operatorname{round}(u/s),q_-,q_+),
\qquad
\frac{\widetilde\partial\widetilde u}{\partial u}
=\mathbf1\{q_-\le u/s\le q_+\}.
$$
*(Eq. 40.11)*

where the tilde over $\partial$ denotes the chosen surrogate. Activation fake quantizers also affect gradients entering earlier layers. Their scale update schedule, observer freeze point, stochasticity and accumulation dtype are parts of the method.

[MATHEMATICALLY-DERIVED] Recovery can minimize label likelihood, a local reconstruction loss, or [Chapter 39's distribution matching](../ch39-knowledge-response-and-policy-distillation/39-1-distillation-objectives.md). Under a tied learned scale and an interior straight-through rounding derivative,

$$
\frac{\widetilde\partial\widetilde u}{\partial s}
=\operatorname{round}(u/s)-u/s,\qquad
\widetilde\nabla_s\mathcal L
=\sum_{u\in G_s}\frac{\partial\mathcal L}{\partial\widetilde u}
\left(\operatorname{round}(u/s)-u/s\right).
$$
*(Eq. 40.12)*

where $G_s$ is the scale-sharing group. The product rule yields the first term from the final multiplication and the second from the division. Clipped values have endpoint derivatives instead. For a nonuniform codebook, “round” must mean projection to that codebook, not integer rounding.

[OFFICIAL-DOCUMENTATION] September 2026 ModelOpt scale learning allows scale-only updates or joint scale/weight updates; its dual-scale variant discards the pre-scale at export and retains the post-scale [R40.19, “How Scale Learning Works”]. Export parity must therefore compare the actual final code and post-scale, not a training-only normalization tensor.

[MATHEMATICALLY-DERIVED] PTQ range search adds no inference parameters beyond metadata, but requires calibration passes and captured statistics. Rounding optimization adds latent controls, gradients and optimizer state during reconstruction. QAT adds forward fake quantization, backward work, saved activations and usually high-precision latent weights. Scale-only learning reduces trainable-state count to roughly one scale per group, while gradients still propagate through the model. QAD adds teacher forward compute and residency or communication. Energy and money for these alternatives are workload-dependent and not established by their code width.

$$
n_s=\lceil N/g\rceil
$$
*(Eq. 40.27)*

[DERIVED] Here $N$ is the number of eligible values, $g$ their full-group scale-sharing size and $n_s$ the scale count, excluding separately scaled tensor boundaries and other trainable state. This count is the analytical quantity in Fig. 40.8.

```figure
id: fig-40.9
kind: diagram
title: Recovery objectives and export
caption: The forward quantizer must agree with export even though its backward derivative is a surrogate.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.11
alt: Latent weights pass through fake quantization into a student. Label loss or teacher matching produces a surrogate update. Final codes and scales are exported to the runtime.
spec:
  direction: LR
  nodes:
    - {id: latent, kind: tensor, label: latent weights and scales}
    - {id: quant, kind: process, label: fake quantization}
    - {id: student, kind: model, label: student forward}
    - {id: loss, kind: objective, label: labels or teacher matching}
    - {id: export, kind: memory, label: exported codes and scales}
  edges:
    - {from: latent, to: quant}
    - {from: quant, to: student}
    - {from: student, to: loss}
    - {from: loss, to: latent, kind: feedback, label: surrogate gradient}
    - {from: quant, to: export}
```

## Algorithm

### Algorithm 40.3 — Finite recovery with quantizer freezing

[MATHEMATICALLY-DERIVED] Inputs are source $\theta_0$, quantizer $\phi_0$, disjoint recovery/evaluation identities, maximum updates $J_{\max}$ and a declared freeze step $j_f$. Output is the selected exported checkpoint. State includes optimizer state $o_j$ and best validation record.

$$
\begin{aligned}
1.\;&j\leftarrow0;\ o_0\leftarrow0;\quad \text{reject overlapping split identities}.\\
2.\;&u_j\sim\mathcal D_r;\quad
\phi_j\leftarrow
\begin{cases}\operatorname{Observe}(\phi_{j-1},u_j),&j<j_f\\
\phi_{j-1},&j\ge j_f.\end{cases}\\
3.\;&\widetilde\theta_j\leftarrow\mathcal Q_{\phi_j}(\theta_j);
\quad \mathcal L_j\leftarrow\operatorname{DeclaredLoss}(u_j,\widetilde\theta_j).\\
4.\;&\mathcal L_j\notin\mathbb R\Rightarrow\text{reject update and retain last finite state}.\\
5.\;&(\theta_{j+1},\phi_{j+1},o_{j+1})\leftarrow
\operatorname{Update}(\theta_j,\phi_j,o_j,\widetilde\nabla\mathcal L_j,\eta_j).\\
6.\;&j+1<J_{\max}\Rightarrow j\leftarrow j+1,\;\text{return to 2};
\quad \text{otherwise export and independently evaluate}.
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] The invariant is an explicit forward representation and recoverable finite state. An observer can be frozen while learned scales remain trainable; these are different state variables. This explanatory procedure does not claim that every named implementation uses the same freeze schedule. Runtime is bounded by $J_{\max}$ training steps plus export/evaluation.

## Implementation

[OFFICIAL-DOCUMENTATION] TorchAO's README documents preparation, training and conversion for QAT, with torchtune integration [R40.11, training discussion; R40.22, “Quantization-Aware Training”]. PyTorch is **Model / autograd framework**; torchtune and Hugging Face Transformers are **Model definition / adaptation**. NVIDIA ModelOpt is a plan-anchored transformation library. No exact package/device compatibility was executed here.

[MATHEMATICALLY-DERIVED] Conversion must remove training-only modules, preserve stored scale rounding, and select packed operators. If fake quantization simulates FP32 scales while export stores FP8 scales, training optimized a different function. Latent weights, teacher weights and optimizer moments belong in peak recovery memory; they need not exist in inference memory. A teacher on another device adds logit or activation communication according to the chosen loss.

## Experimental design

### Reported experiments

[PAPER-REPORTED] AdaRound's ResNet18 ImageNet study uses symmetric per-layer four-bit weights, FP32 activations, 1,024 unlabeled training images, Adam for 10,000 iterations and five seeds [R40.7, §5]. This isolates post-training rounding without full-model recovery.

[PAPER-REPORTED] QAD compares NVFP4 PTQ, task-loss QAT and KL-based QAD on SFT-heavy and RL-heavy models [R40.10, §3, Tables 1–3]. Table 1 uses about 0.3B SFT tokens for Llama Nemotron Super V1 and 5,000 held-out samples, approximately 8M tokens. Other comparisons use cold-start SFT data or mixtures with RL-generated responses. The report separately ablates data sources and learning rates.

[NOT-DISCLOSED] Exact dataset hashes and complete repeated-seed uncertainty are not supplied for all inspected comparisons. Matching token budgets does not prove identical optimization convergence or equal total compute, because QAD executes a teacher.

[PAPER-REPORTED] The report uses teacher/student softmax temperature one for recovery and learning rates of $10^{-6}$ or $10^{-5}$ depending on the model. It evaluates repeated sampled generations, then selects among ten validation-preferred checkpoints by average benchmark performance [R40.10, §3.4]. That selection uses the reported tasks as selection information; those results cannot be described as untouched final acceptance. For Nemotron 3 Nano, the precision map also retains attention and preceding Mamba layers in BF16 and uses FP8 cache, so its NVFP4 label does not mean every operator is four-bit.

## Observations

**What the paper claims.** [PAPER-REPORTED] QAD better preserves BF16 output behavior under its recovery setups [R40.10, §3].

**What the evidence shows.** [PAPER-REPORTED] Table 1 reports QAT/QAD KL to BF16 of 0.311/0.004, while label CE is 0.408/0.416. Appendix A includes a single-stage VLM case where QAT can match QAD. Thus task-loss parity and teacher-distribution parity are different, and QAD is not universally necessary.

[PAPER-REPORTED] AdaRound's Table 2 reports ResNet18 ImageNet top-1 accuracy 23.99% for all-layer nearest rounding and $66.56\pm0.12\%$ for its continuous local relaxation; Table 4 improves this to $68.60\pm0.09\%$ with asymmetric reconstruction and the activation function, versus 69.68% full precision [R40.7, §5]. The ablation supports those changed reconstruction choices in this vision setting, not a modern LLM guarantee.

**What we infer.** [MATHEMATICALLY-DERIVED] A scalar CE constrains one target probability per context; many distinct distributions share that probability. Equal CE cannot identify the complete conditional distribution.

**What remains unknown.** [UNVERIFIED] Independent replication, exported-kernel parity and transfer of recovery choices to unrelated architectures were not established by this chapter.

## Failure modes

> **Failure mode — Simulation/export mismatch.** [MATHEMATICALLY-DERIVED] *Symptom:* training validation is acceptable but exported logits diverge. *Cause:* different scales, rounding, clipping or fused arithmetic. *Detection:* compare decoded tensors and layer outputs on identical inputs. *Mitigation:* reproduce the deployed forward contract during recovery.

[MATHEMATICALLY-DERIVED] A teacher-preservation objective can preserve erroneous behavior. Recovery data can shift a post-trained policy even when label loss improves. Calibrating and selecting on the same tasks creates optimistic selection; more calibration tokens do not remedy evaluation reuse.

## Siblings

[MATHEMATICALLY-DERIVED] [PTQ families](40-4-method-families.md) optimize frozen representations; QAT modifies latent parameters under simulated forward quantization; QAD changes supervision. [QLoRA](../../../vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch23-parameter-efficient-adaptation-and-model-composition/README.md) trains adapters around a frozen quantized base, so it does not imply that the base codes undergo QAT.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] Scale-only learning changes the trainable object from all weights to per-block scales, using QAD for recovery in the disclosed Nemotron 3.5 Lightning case [R40.19, “Results”]. The page reports comparisons with PTQ and BF16, but its public disclosure does not supply a complete repeated-seed study. Fewer trainable scalars reduce optimizer state; they do not eliminate model-wide differentiation.

## Limitations

[MATHEMATICALLY-DERIVED] Straight-through updates have no general monotonic-descent guarantee for the true discrete loss. Local recovery can overfit captured inputs, and teacher matching cannot restore information absent from both teacher signals and representable student states. Source-supported success under a particular format is not evidence for a more aggressive format.

## Reproducibility

[MATHEMATICALLY-DERIVED] Preserve calibration/recovery/evaluation identities, observer schedule, scale dtype, latent dtype, gradient surrogate, optimizer, loss mask, teacher access, learning rates, stopping rule and conversion revision. Distinguish best-validation selection from final-step reporting. Proposed tests appear only in [verification](verification.md).

## References

[R40.7](references.md#r40-7), [R40.10](references.md#r40-10), [R40.11](references.md#r40-11), [R40.19](references.md#r40-19), [R40.22](references.md#r40-22), [P15](references.md#p15).

```figure
id: fig-40.10
kind: calculator
title: Trainable scale count
caption: Analytical full-group scale count excludes other parameters and saved activations; scale-only training still executes the network.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.27
alt: An illustrative one-billion-value tensor with groups of sixteen needs 62.5 million scales, one per group. Larger groups reduce the scale count.
states:
  - {anchor: formulation, label: Blocks of sixteen, variables: {g: 16}, note: Trainable state follows group count.}
  - {anchor: mechanism, label: Blocks of sixty-four, variables: {g: 64}, note: Four times fewer scales.}
  - {anchor: failure-modes, label: Forward cost persists, note: This count excludes model-wide differentiation.}
spec:
  tex: n_s=\lceil N/g\rceil
  equation: "40.27"
  inputs:
    - {symbol: N, label: eligible values, default: 1000000000, min: 1000000, max: 10000000000, scale: log2, format: integer}
    - {symbol: g, label: group values, default: 16, min: 8, max: 256, scale: log2, format: integer}
  outputs:
    - {symbol: ns, label: scale count, formula: ceil(N/g), format: integer}
```

```figure
id: fig-40.11
kind: stat-panel
title: Recovery loss boundaries
caption: Each objective preserves a different object; none certifies deployment quality alone.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.9
alt: Reconstruction preserves local outputs, cross entropy constrains target likelihood, and teacher KL constrains a conditional law. Export must be evaluated independently.
spec:
  header: RECOVERY AUDIT
  rows:
    - {key: reconstruction, value: local outputs}
    - {key: label loss, value: target likelihood}
    - {key: teacher KL, value: conditional law}
    - {key: runtime, value: independent check}
```
