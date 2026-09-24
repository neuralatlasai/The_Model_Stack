---
id: ms.frontmatter.notation
entity_type: frontmatter
title: Notation and the shared mathematical contract
short_title: Notation
volume: null
part: null
chapter: null
section: null
slug: notation
parent: ms.frontmatter
prev_sibling: null
next_sibling: ms.frontmatter.reading-routes
children: []
prerequisites: []
downstream: [ms.chapter.2, ms.chapter.4, ms.chapter.21, ms.chapter.25, ms.chapter.29, ms.chapter.34, ms.chapter.39, ms.chapter.42, ms.chapter.48]
related: []
relations: []
axes: {lifecycle: [], mechanism: [], feedback_setting: [], modality: []}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: foundational, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, ASSUMED], empirically_observed: false}
word_count_target: 1200
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# Notation and the shared mathematical contract

This page fixes the symbols, shapes, units, and accounting identities used across all 66 chapters. It restates the *shared mathematical contract* of `book_plan.md` and adds the symbol table that chapters must not redefine. Chapters may introduce local symbols in a variable table at first use; they may not reuse a symbol below with a different meaning.

Logarithms are natural unless a chapter states otherwise. Bytes are counted in binary units (1 GiB = 2^30 bytes) unless a vendor figure is quoted in decimal units, in which case the chapter must say so.

## 1. Global symbols

| Symbol | Meaning | Unit / shape | Owner |
|---|---|---|---|
| θ | model parameters (all trainable tensors) | — | 04 |
| N | parameter count (total; say "activated" explicitly for MoE) | count | 13, 21 |
| D | training tokens consumed (say "available", "sampled", or "consumed") | tokens | 09, 21 |
| C | training compute | FLOPs | 21 |
| L | number of Transformer layers (blocks) | count | 05 |
| d_model | residual-stream width | count | 05 |
| d_ff | feed-forward hidden width | count | 05, 13 |
| H_q | query heads | count | 14 |
| H_kv | key/value heads (H_kv = H_q for MHA, 1 for MQA, 1 < H_kv < H_q for GQA) | count | 14 |
| d_h | head dimension | count | 05, 14 |
| V | vocabulary size | count | 10 |
| B | number of sequences in a batch | count | 19, 42 |
| S | tokens per sequence in an inference/cache context | tokens | 42 |
| T | sequence length in a training/objective context | tokens | 04, 19 |
| x, y | token sequences (input / output or chosen response) | — | 04, 34 |
| c | conditioning (prefix, document, image, tool output) | — | 04 |
| m_t | binary target/loss mask at position t | {0,1} | 04, 31 |
| p_θ | model distribution | — | 04 |
| π_θ, π_ref | policy, reference policy | — | 34 |
| β | KL-regularisation coefficient (RL, DPO) | scalar ≥ 0 | 33, 34 |
| R(x,y) | scalar reward | scalar | 32, 34 |
| A_t | advantage at step t | scalar | 34 |
| τ | distillation temperature | scalar > 0 | 39 |
| λ | mixing weight in a two-term loss (state which) | [0,1] | 39 |
| b | bytes per stored value (2 for BF16/FP16, 1 for FP8/INT8, 0.5 for 4-bit) | bytes | 03, 40, 42 |
| I | arithmetic intensity | FLOPs/byte | 25 |
| P_peak, P_achieved | peak / achieved compute | FLOP/s | 25 |
| B_mem | memory bandwidth | bytes/s | 25 |
| M_* | a memory quantity (M_KV, M_params, M_opt, M_act) | bytes | 29, 42 |
| λ (queueing) | arrival rate — local to Chapter 48 only; do not confuse with the loss weight | requests/s | 48 |
| W | mean residence time | s | 48 |
| t_0, t_i | request start; delivery time of token i | s | 48 |

Shapes are written `[B, T, D]` in tensor traces, with the axis names `B` batch, `T` sequence, `H` heads, `Dh` head dimension, `D` model width.

## 2. Shared mathematical contract

These identities establish accounting conventions. They are not substitutes for the derivations in the owning chapters.

### 2.1 Likelihood (Chapters 04, 19, 31) — MATHEMATICALLY-DERIVED

For parameters θ, token sequence x of length T, and conditioning c:

$$
p_\theta(x \mid c) = \prod_{t=1}^{T} p_\theta(x_t \mid x_{<t}, c)
$$
*(Eq. N.1)*

With a binary target mask m_t, the token-mean loss is

$$
\mathcal{L} = -\frac{\sum_{t=1}^{T} m_t \log p_\theta(x_t \mid x_{<t}, c)}{\sum_{t=1}^{T} m_t}
$$
*(Eq. N.2)*

Every chapter that reports a loss MUST state whether the mean is over tokens, sequences, or ranks. Two losses with different normalisation are not comparable.

### 2.2 Scaling (Chapter 21) — PAPER-REPORTED MODEL FAMILY

An empirical fit may use

$$
L(N, D) = E + A N^{-\alpha} + B D^{-\beta}
$$
*(Eq. N.3)*

where E, A, B, α, β are fitted parameters. `C ≈ 6ND` is a dense-Transformer training approximation under stated accounting assumptions (forward + backward, no attention-score term, no recomputation). It is not a universal MoE, long-context, or multimodal cost formula. Fits require validation on held-out runs.

### 2.3 Roofline (Chapter 25) — ENGINEERING APPROXIMATION

For arithmetic intensity I in FLOPs/byte, peak compute P_peak, and bandwidth B_mem:

$$
P_{\text{achieved}} \le \min\big(P_{\text{peak}},\; I \cdot B_{\text{mem}}\big)
$$
*(Eq. N.4)*

This is a bound. Launch overhead, dependency stalls, occupancy limits, and communication further reduce achieved performance. Advertised peak FLOPs are not application throughput.

### 2.4 Training memory (Chapters 29–30) — MATHEMATICALLY-DERIVED accounting, ASSUMED constants

$$
M_{\text{train}} = M_{\text{params}} + M_{\text{grads}} + M_{\text{opt}} + M_{\text{act}} + M_{\text{comm}} + M_{\text{runtime}}
$$
*(Eq. N.5)*

Apply the actual sharding/replication factor to each term separately. A single bytes-per-parameter constant is insufficient when dtypes and sharding differ across terms.

### 2.5 Reinforcement learning (Chapters 34–35) — MATHEMATICALLY-DERIVED

For prompt distribution 𝒟, policy π_θ, sequence y, scalar reward R, reference π_ref, and β ≥ 0:

$$
J(\theta) = \mathbb{E}_{x \sim \mathcal{D},\, y \sim \pi_\theta(\cdot \mid x)}\big[R(x,y)\big] - \beta\, \mathbb{E}_{x \sim \mathcal{D}}\Big[\mathrm{KL}\big(\pi_\theta(\cdot \mid x)\,\|\,\pi_{\text{ref}}(\cdot \mid x)\big)\Big]
$$
*(Eq. N.6)*

Specify sequence versus token factorisation, estimator, clipping, baseline, and masking before implementing a particular algorithm. RLVR names the reward source; GRPO names an optimisation construction; neither is synonymous with reasoning.

### 2.6 Distillation (Chapter 39) — MATHEMATICALLY-DERIVED

For teacher p_T and student p_S softened by temperature τ:

$$
\mathcal{L}_{\text{KD}} = \lambda\, \tau^{2}\, \mathrm{KL}\big(p_T^{\tau}\,\|\,p_S^{\tau}\big) + (1-\lambda)\, \mathrm{CE}(y, p_S), \qquad 0 \le \lambda \le 1
$$
*(Eq. N.7)*

Response-only distillation does not require teacher logits and MUST NOT be described as this loss.

### 2.7 KV storage (Chapter 42) — MATHEMATICALLY-DERIVED

For a conventional cache with L layers, B equal-length sequences of length S, H_kv KV heads, head dimension d_h, and b bytes per value:

$$
M_{KV} = 2\, L\, B\, S\, H_{kv}\, d_h\, b \;\text{ bytes}
$$
*(Eq. N.8)*

before paging or metadata overhead. For unequal lengths use Σ_i S_i. This formula does not directly describe MLA, recurrent state, layer-varying windows, or compressed caches.

Illustrative value: L=32, B=8, S=8192, H_kv=8, d_h=128, b=2 gives 8,589,934,592 bytes = 8 GiB for the KV tensors alone. This is not a specification for any named model.

### 2.8 Latency (Chapter 48) — MATHEMATICALLY-DERIVED definitions

Let request start be t_0 and token delivery times be t_1,…,t_n.

- TTFT = t_1 − t_0
- ITL_i = t_i − t_{i−1}, i ≥ 2
- TPOT = (t_n − t_1)/(n − 1) for n > 1

TPOT is an average, not a tail-ITL statistic. Every latency figure MUST state whether delivery is client-visible or measured inside the server.

### 2.9 Queueing (Chapter 48) — MATHEMATICALLY-DERIVED

In a stable system over consistent boundaries, mean in-flight requests N̄ = λ·W (Little's law). It is not a p99-latency prediction.

### 2.10 Economics (Chapters 48, 63) — DEFINITION

Cost per accepted task = (total relevant compute + infrastructure + generation + retry + retrieval + tool cost) / (number of tasks meeting the declared quality and service criteria). Report the denominator and the attribution window.

## 3. Fixed metric vocabulary

From `Instruction/AI_REFERENCE_STACK.md` §4.2. Chapters use these names unchanged.

| Metric | Definition anchor |
|---|---|
| MFU | model FLOPs utilisation: useful model FLOP/s ÷ P_peak; the "useful" FLOP count MUST be stated (Chapter 30) |
| HFU | hardware FLOPs utilisation: all executed FLOP/s including recomputation ÷ P_peak (Chapter 30) |
| FLOP/s, HBM bandwidth, network bandwidth | achieved rates; state the measurement window (Chapter 25) |
| tokens/s/GPU | training or decode throughput per accelerator; state which (Chapters 30, 48) |
| TTFT, TPOT, ITL, E2E latency | §2.8 |
| p50 / p95 / p99 | quantiles of a stated distribution over a stated window |
| goodput | throughput of requests that met their SLO (Chapter 44, 48) |
| requests/s, cost/token, cost per accepted task | §2.10 |

## 4. Evidence-label reminder

Every non-trivial statement carries exactly one label from `CONTENT_CONTRACT.md` §6. EMPIRICALLY-OBSERVED does not appear in Edition 1.0.
