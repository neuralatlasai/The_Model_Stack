---
id: ms.section.23.3
entity_type: section
title: Quantized-base adaptation
volume: 1
part: 4
chapter: 23
section: 23.3
slug: 23-3-quantized-base-adaptation
parent: ms.chapter.23
prev_sibling: ms.section.23.2
next_sibling: ms.section.23.4
children: []
prerequisites: [ms.section.23.2, ms.chapter.19]
downstream: [ms.section.23.5, ms.chapter.40]
related: [ms.chapter.29]
siblings_by_mechanism: [ms.section.23.2]
relations: [{type: supported_by, target: paper.P15}, {type: implemented_by, target: impl.hugging-face-peft}]
axes: {lifecycle: [adaptation], mechanism: [quantized_base_adaptation], feedback_setting: [], modality: [text]}
papers: [P15]
implementations: [impl.hugging-face-peft, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 23.3 Quantized-base adaptation

## Scope

**MATHEMATICALLY-DERIVED.** Quantized-base adaptation stores frozen base tensors at reduced precision and trains separate task variables. The training function depends on the decoded quantized base, not automatically on the original full-precision checkpoint. This section distinguishes packed values, quantization metadata, compute operands, task factors, optimizer state, and exported artifacts. It reconstructs the QLoRA boundary and a quantization-aware initialization alternative; general quantizer taxonomy and inference compression are owned by [Chapter 40](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch40-quantization-from-numerical-model-to-deployable-artifact/README.md).

## Why this exists

**MATHEMATICALLY-DERIVED.** Ordinary LoRA removes base optimizer state but retains the frozen base. When that term dominates resident memory, reducing $n_a$ further has limited effect. Let $M_b$ be base storage and $M_o$ all other terms. If adaptation saves a fraction $q$ of $M_b$, total saving is $qM_b/(M_b+M_o)$. As activation memory rises with sequence and batch, the same quantizer delivers a smaller fraction of total savings. A claim of fourfold base-weight compression therefore cannot be interpreted as fourfold training-memory reduction.

**PAPER-REPORTED.** QLoRA combines a frozen four-bit base, higher-precision computation and trainable low-rank factors. Its NormalFloat codebook is designed around a zero-centered normal distribution; nested quantization reduces scale metadata, while paged optimizers address memory spikes through unified-memory paging. The paper does not equate four-bit storage with four-bit matrix multiplication. [P15] (§3, Eq. 4–6)

## Intuition

**MATHEMATICALLY-DERIVED.** Write the decoded base as $\widehat W_0=W_0+E_q$. Training a correction $\Delta W$ against this base gives $\widehat W_0+\Delta W$, whose difference from the original base is $E_q+\Delta W$. The learned correction can spend capacity on target adaptation, quantization compensation, or both. Using the same correction later with $W_0$ removes $E_q$ and changes the function. This is a deployment change requiring evaluation, even if tensor shapes and factor values are identical.

## Formulation

**MATHEMATICALLY-DERIVED.** Partition a flattened base tensor into blocks $\mathcal B_j$ of at most $g_q$ values. Store code indices $q_i\in\{0,\ldots,15\}$, a fixed codebook $\mathcal C$, and block scales $a_j$. The book's blockwise reconstruction is

$$
\begin{aligned}
a_j&=\max_{i\in\mathcal B_j}|(W_0)_i|,\\
q_i&=\arg\min_{k\in\{0,\ldots,15\}}
\left|(W_0)_i/a_j-\mathcal C_k\right|,\\
(\widehat W_0)_i&=a_j\mathcal C_{q_i},\\
Y&=\operatorname{cast}_{c}(\widehat W_0)X+s\mathsf B\mathsf AX.
\end{aligned}
$$
*(Eq. 23.11)*

[DERIVED] Explanatory operator reconstruction, not a replacement for an implementation's exact NF4 codebook.

**MATHEMATICALLY-DERIVED.** A zero-valued block needs a defined $a_j=0$ path that stores zero and avoids division. Ties in nearest-code assignment require deterministic rules for byte-identical artifacts. $c$ is the compute dtype, separate from four-bit packed storage; accumulation precision is another field. Scales, block boundaries, padding, tensor orientation and codebook order are part of the decoder. The same integer bytes with different metadata are different weights.

$$
\begin{aligned}
M_{b,\rm single}&=N_q/2+4\lceil N_q/g_q\rceil,\\
M_{b,\rm nested}&\simeq N_q/2+\lceil N_q/g_q\rceil
+4\lceil\lceil N_q/g_q\rceil/g_s\rceil,\\
M_{\rm resident}&=M_b+M_{\rm unquantized}+M_a+M_g+M_{\rm opt}
+M_{\rm act}+M_{\rm workspace}+M_{\rm comm}+M_{\rm reserve}.
\end{aligned}
$$
*(Eq. 23.12)*

**MATHEMATICALLY-DERIVED.** $N_q$ is the number of quantized base scalars; remaining base tensors are separate. Assume even $N_q$; an odd count requires $\lceil N_q/2\rceil$ packed bytes. The illustrative single-level formula uses FP32 block scales. The nested formula uses one byte per first-level scale and FP32 second-level scales over $g_s$ first-level blocks; it excludes offsets, headers, padding and alignment. With $g_q=64$ and $g_s=256$, large-tensor limits are 4.5 and 4.126953125 bits per quantized scalar. These are representation calculations, not measured allocator consumption.

```figure
id: fig-23.8
kind: calculator
title: Packed base and scale metadata
caption: Illustrative four-bit block storage with FP32 scales, or nested one-byte scales plus FP32 second-level scales. Headers, offsets, padding, unquantized tensors and runtime state are excluded.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.12
alt: For seven billion quantized values, block size 64 and second-level block size 256, four-bit values alone require 3.5 billion bytes. Single-level scale metadata adds 437.5 million bytes; nested scale metadata is approximately 111.08 million bytes.
states:
  - {anchor: formulation, label: Packed representation, highlight: [mp], note: Four bits describe only the packed value term.}
  - {anchor: mechanism, label: Nested metadata, highlight: [md], note: Quantizing scales changes metadata error and decoding work.}
  - {anchor: failure-modes, label: Resident boundary, highlight: [ms], note: Packed weight storage does not bound training peaks.}
spec:
  tex: M_b=N_q/2+M_{\rm scales}
  equation: "23.12"
  inputs:
    - {symbol: Nq, label: quantized scalars, default: 7000000000, min: 100000000, max: 70000000000, step: 100000000, format: params}
    - {symbol: gq, label: first-level block size, default: 64, min: 16, max: 256, scale: log2, format: integer}
    - {symbol: gs, label: scale block size, default: 256, min: 32, max: 1024, scale: log2, format: integer}
  outputs:
    - {symbol: mp, label: packed values, formula: Nq/2, format: bytes}
    - {symbol: ms, label: with FP32 block scales, formula: Nq/2+4*ceil(Nq/gq), format: bytes}
    - {symbol: md, label: with nested scale storage, formula: Nq/2+ceil(Nq/gq)+4*ceil(ceil(Nq/gq)/gs), format: bytes, emphasis: true}
```

## Mechanism

**MATHEMATICALLY-DERIVED.** A nonuniform codebook allocates more representable values near selected parts of a distribution. Equal-probability bins under one distribution do not imply minimum distortion for every activation-weighted loss. A layer with heavy tails, blockwise normalization artifacts, or highly sensitive directions can violate the model motivating the codebook. Evaluate both tensor reconstruction and downstream behavior. The exact NF4 table contains a representable zero and is not generated by uniformly spacing sixteen integers; reproducing its name without its table and scaling semantics is insufficient.

**MATHEMATICALLY-DERIVED.** Frozen quantization state does not receive optimizer updates. Gradients propagate through the realized linear map:

$$
\nabla_X\mathcal L=\widehat W_0^\top G+s\mathsf A^\top\mathsf B^\top G,
\qquad\nabla_{q,a}\mathcal L\equiv0\quad\text{by the frozen-state contract}.
$$
*(Eq. 23.13)*

**MATHEMATICALLY-DERIVED.** This is differentiation through the decoded operator, not differentiation of discrete rounding choices. The adapter gradients remain Eq. 23.4 using the actual activations produced by the quantized base. If embeddings, norms or a head are trainable, their gradients and optimizer state must be added. A low-rank-only checkpoint cannot restore such extras when they were omitted at export.

**MATHEMATICALLY-DERIVED.** Nested scales introduce a second error source. If a decoded scale is $\widehat a_j=a_j+e_{a,j}$, then $(\widehat W_0)_i-W_i=a_j(\mathcal C_{q_i}-W_i/a_j)+e_{a,j}\mathcal C_{q_i}$. Weight-index and scale errors coexist. Dequantization can be fused into matrix multiplication or materialized; those implementations have different workspace and memory traffic, so Eq. 23.12 must not add a permanent full decoded copy unless the runtime actually retains one.

**MATHEMATICALLY-DERIVED.** Paging moves selected optimizer state between host and device. If $M_{\mathrm{moved}}$ bytes cross a link of achieved bandwidth $B_{\rm link}$, transfer time is bounded below by $M_{\mathrm{moved}}/B_{\rm link}$ before latency and synchronization. Host capacity, pinned buffers, page-fault behavior and contention remain applicable costs. Paging can avoid a device-memory failure while increasing elapsed time; storage reduction is not a guarantee of training throughput.

```figure
id: fig-23.9
kind: diagram
title: Frozen storage and trainable state
caption: Quantized storage, decoded compute operands and trainable factors have different lifetimes. The backward path uses the decoded base but updates only admitted task variables.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.13
alt: Packed base indices and scale metadata feed dequantization and the base matrix multiplication. Input also feeds trainable low-rank factors. Their outputs are added before the loss. Gradients return to factors and upstream activations, while the base indices and scales remain immutable.
spec:
  direction: TB
  nodes:
    - {id: q, kind: memory, label: Packed indices and metadata, sub: frozen}
    - {id: dq, kind: process, label: Decode to compute operands}
    - {id: x, kind: tensor, label: Input activations}
    - {id: mm, kind: process, label: Base matrix multiplication}
    - {id: lr, kind: tensor, label: Trainable low-rank factors}
    - {id: y, kind: tensor, label: Sum of base and task branches}
    - {id: loss, kind: objective, label: Masked target loss}
    - {id: opt, kind: memory, label: Task optimizer state}
  edges:
    - {from: q, to: dq}
    - {from: dq, to: mm}
    - {from: x, to: mm}
    - {from: x, to: lr}
    - {from: mm, to: y}
    - {from: lr, to: y}
    - {from: y, to: loss}
    - {from: loss, to: opt, kind: emphasis}
    - {from: opt, to: lr, kind: feedback}
```

## Algorithm

### Algorithm 23.3 - Immutable quantized-base adaptation

**MATHEMATICALLY-DERIVED.** Algorithm 23.3 binds training to its quantized base. Inputs are $W_0$, exact quantizer/decoder $Q,\mathsf D$, low-rank initialization, training contract $\mathcal M$, and finite accepted-update cap $u_{\max}$. State $\psi=(q,a,\mathcal C,\text{layout})$ is immutable. $\mathsf U$ is the Chapter 19 transition over admitted task tensors and optimizer/cursor/RNG state $z$.

$$
\begin{aligned}
1.\;&\psi\leftarrow Q(W_0),\quad h_q\leftarrow h(\psi),\quad\widehat W_0\leftarrow\mathsf D(\psi);\\
2.\;&u\leftarrow0,\quad
(\mathsf A_0,\mathsf B_0)\leftarrow\mathsf{InitFactors}(\mathcal M),\
\omega_0\leftarrow\mathsf{InitOptimizer}(\mathsf A_0,\mathsf B_0,\mathcal M),\\
&(\chi_0,\xi_0)\leftarrow\mathsf{InitCursorRNG}(\mathcal M),\
z_0\leftarrow(\mathsf A_0,\mathsf B_0,\omega_0,\chi_0,\xi_0,\mathcal M);\\
3.\;&u<u_{\max}:\quad
(X_u,\chi')\leftarrow\mathsf{Next}(\chi_u),\quad
Y_u\leftarrow\mathsf D(\psi)X_u+s\mathsf B_u\mathsf A_uX_u;\\
4.\;&g_u\leftarrow\nabla_{z_{u,\rm task}}\mathcal L(Y_u),\quad
\widetilde z\leftarrow\mathsf U(z_u,g_u,\chi');\\
5.\;&\begin{cases}
(z_{u+1},u)\leftarrow(\widetilde z,u+1),&
\mathsf{Finite}(\widetilde z)\land h(\psi)=h_q,\\
\operatorname{return}(\mathrm{rejected},z_u),&\text{otherwise};
\end{cases}\\
6.\;&u<u_{\max}\Rightarrow\operatorname{repeat}(3\text{--}5);\\
7.\;&\mathcal A_q\leftarrow(\psi,\mathsf A_u,\mathsf B_u,s,\mathcal M,\text{extra task tensors});\\
8.\;&\operatorname{return}(\mathcal A_q,z_u).
\end{aligned}
$$
*(Eq. 23.14)*

**MATHEMATICALLY-DERIVED.** $\omega_0$ initializes moments/scheduler/scaler, $\chi_0$ the consumed-data cursor and $\xi_0$ the complete RNG state; extra trained tensors join that initial task/optimizer state when configured. The transition fetches $X_u$ through $\chi_u$ and updates the candidate cursor/RNG consistently. The loop over steps 3-5 is skipped at zero cap; malformed quantization, exhausted/empty data, nonfinite state and bounded-operation timeouts reject. Every loop accepts or rejects, giving finite termination. The hash detects base modification. Adapter-only export may reference $\psi$, but it must resolve exactly. Restart includes moments/RNG/cursor; deployment can omit those training-only fields.

## Implementation

**OFFICIAL-DOCUMENTATION.** PEFT's checkpoint format separates task state from the original model and stores configuration needed to load the adapter. Its documented files include adapter tensors, adapter configuration and a model-card file. This is a serialization boundary, not a guarantee that an adapter file contains a resumable training state or the quantized base. [R23.9] (v0.21.0, “PEFT files” and “Adapter weights”)

**MATHEMATICALLY-DERIVED.** In Hugging Face PEFT and Hugging Face Transformers, the MODEL DEFINITION / ADAPTATION layer must preserve the quantization wrapper and the target operator identities. The source QLoRA implementation uses a quantization backend outside the reference stack, routed through the plan's QLoRA anchor; this manuscript describes its disclosed representation but does not certify installed backend compatibility. Record packed storage dtype, operand dtype, accumulation behavior, task-factor dtype and optimizer-state dtype individually. Kernels may have shape/alignment restrictions, and sharded storage must retain compatible block metadata across save/load.

```figure
id: fig-23.10
kind: stat-panel
title: Quantized adapter artifact closure
caption: An adapter-only file is sufficient only when every referenced dependency is recovered exactly. Restart additionally requires the training state.
placement: rail
anchor: implementation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.14
alt: The deployment record binds base hash, quantizer and layout, task tensors and scale, tokenizer and template. The training record also binds optimizer, RNG and cursor. A missing field invalidates exact reconstruction.
spec:
  header: REQUIRED IDENTITY FIELDS
  variables: {required: 5, present: 5}
  rows:
    - {key: deployment dependencies, formula: required, format: integer}
    - {key: exact recorded fields, formula: present, format: integer}
    - {key: base, value: weights + quantizer + metadata}
    - {key: restart extras, value: optimizer / RNG / cursor}
```

## Experimental design

**PAPER-REPORTED.** QLoRA compares quantized adapters with higher-precision adapters and full tuning on smaller models, using GLUE, Super-NaturalInstructions and MMLU protocols. For LLaMA 7B–65B, the large-scale comparison is primarily against 16-bit LoRA; §7 explicitly states that 33B/65B full-tuning parity was not established. Hard paging measurements are absent from the reported evaluation. [P15] (§4, Tables 2–3); §7

**PAPER-REPORTED.** LoftQ jointly chooses quantized weights and a low-rank initialization by alternating quantization with a truncated-SVD residual approximation. Its evaluation covers language understanding and generation under multiple bit settings and compares with quantize-then-adapt baselines. [R23.10] (§3–4, Algorithm 1, Tables 1–4)

## Observations

**What the paper claims.** **PAPER-REPORTED.** The disclosed QLoRA results support reduced-storage adaptation with useful quality in the tested regimes; LoftQ targets the initial discrepancy between the full-precision tensor and its quantized-plus-low-rank representation. [P15]; [R23.10]

**What the evidence shows.** **UNVERIFIED.** This chapter has not established comparable quality, paging overhead or peak memory on a current runtime. A widely quoted large-model result cannot fill the missing full-tuning baseline.

**What we infer.** **MATHEMATICALLY-DERIVED.** The $E_q+\Delta W$ decomposition and Eq. 23.12 require matching quantization identities at deployment and counting unquantized/runtime terms separately. These conclusions do not require a claim that every adapter compensates quantization error.

**What remains unknown.** **NOT-DISCLOSED.** The source papers do not provide an energy or monetary bill for this book's unspecified adaptation workload, and QLoRA does not supply a hard measurement of its paging overhead.

## Failure modes

**MATHEMATICALLY-DERIVED.** Quantizer mismatch changes $E_q$; missing scale metadata changes decoded tensors; adapting a supposedly frozen quantization buffer violates the training contract; exporting only factors loses trained extras. A merge followed by requantization realizes $Q(\widehat W_0+\Delta W)$, generally different from the unmerged compute path $\widehat W_0X+\Delta WX$. Test after requantization. OOM after paging may reflect activations or workspace that the optimizer cannot evict; host exhaustion is also a distinct failure boundary.

## Siblings

**MATHEMATICALLY-DERIVED.** Ordinary LoRA retains a higher-precision base; QLoRA changes frozen representation; full low-precision training updates the represented base and requires another gradient/state contract. Inference-only quantization does not establish adaptation correctness. Training with one four-bit codebook and serving with another is a changed model even when both containers are called “four-bit.”

## Extensions

**MATHEMATICALLY-DERIVED.** LoftQ's initialization objective can be reconstructed as minimizing $\|W_0-\widehat W-\mathsf B\mathsf A\|_F^2$ over an admitted quantized $\widehat W$ and rank-limited factors. Given $\widehat W$, truncated SVD gives the least-squares rank-$r$ residual approximation; given the factors, quantize $W_0-\mathsf B\mathsf A$. Stop at the declared iteration cap or converged residual criterion. This alternating procedure targets tensor reconstruction, not the downstream task loss, and may require original full-precision weights plus temporary dense residual/SVD workspace. A useful initialization can therefore have a substantial one-time setup cost. [R23.10] (Algorithm 1)

## Limitations

**MATHEMATICALLY-DERIVED.** A small Frobenius reconstruction error does not bound downstream loss without sensitivity assumptions. A small training-state footprint does not bound peak resident memory or host traffic. Quantized-base adaptation is viable only when its target-quality, retention, numerical and deployment gates pass together; changing the serving representation reopens those gates.

## Reproducibility

**UNVERIFIED.** Preserve the original base hash, quantized tensor hashes, quantizer revision/table/block sizes, layout, operand and accumulation dtypes, trainable extras, optimizer/paging settings, activation checkpointing, loss masks and restart state. Ledger source inspection is separate from executing those configurations. No GPU adaptation experiment was run in this edition.

## References

- [P15](references.md#p15) — QLoRA.
- [R23.9](references.md#r239) — PEFT checkpoint format.
- [R23.10](references.md#r2310) — LoftQ.
