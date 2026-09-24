---
id: ms.section.5.5
entity_type: section
title: Training and generation
short_title: Train, prefill, decode
volume: 1
part: 1
chapter: 5
section: 5.5
slug: 05-5-training-and-generation
parent: ms.chapter.5
prev_sibling: ms.section.5.4
next_sibling: ms.section.5.6
children: []
prerequisites: [ms.section.3.3, ms.section.4.1, ms.section.5.1, ms.section.5.2]
downstream: [ms.section.5.6, ms.section.19.3, ms.section.37.1, ms.section.42.1, ms.section.42.2]
related: [ms.section.14.1]
siblings_by_mechanism: [ms.section.42.1]
relations:
  - {type: supported_by, target: paper.P01}
  - {type: implemented_by, target: impl.pytorch}
  - {type: implemented_by, target: impl.flashattention}
axes:
  lifecycle: [pretraining, inference]
  mechanism: [backpropagation, cache_representation, decoding]
  feedback_setting: []
  modality: [text]
papers: [P01]
implementations: [impl.pytorch, impl.flashattention]
benchmarks: []
datasets: []
status:
  maturity: foundational
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, UNVERIFIED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 1100
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 5.5 Training and generation

## Scope

Objective: run the §5.1 trace in its three modes — a training step (forward, shifted-target loss, backward), a prompt prefill, and a cached decode step — and state exactly which tensors are alive in each. Baseline: the teacher-forced likelihood of [§4.1](../ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md). Success criterion: the reader can explain why prefill and cached decode compute the same logits, what the cache stores, and what differs between train and eval mode. Boundaries: optimiser mechanics ([§19.3](../../part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/19-3-parameter-updates.md)), sampling distributions ([§37.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-1-sampling-distributions.md)), and the serving-phase decomposition and cache accounting ([§42.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-1-phase-decomposition.md), [§42.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-2-state-accounting.md), which owns the definition of the KV cache and Eq. N.8) are elsewhere. This section introduces the cache as the chapter's first memory trace; it does not own its accounting.

## Why this exists

What failed before was generation by recomputation: producing token t+1 by re-running the full forward pass over t tokens costs O(t) per step and O(T²) per sequence in weight FLOPs alone, and the attention term makes it O(T³). The bottleneck is that, under a causal mask, the K and V of positions < t are identical at every step — recomputing them is pure waste. PAPER-REPORTED (R5.6, abstract): incremental inference is often slow due to the memory-bandwidth cost of repeatedly loading the large keys and values tensors — which is the constraint that appears once recomputation is removed. What changed is that the K and V lines of the trace are retained across steps, converting per-step arithmetic that grows with t into per-step memory reads that grow with t. Training has no such reuse because every position is computed at once; its distinctive feature is instead the set of tensors the backward pass needs.

## Intuition

Physically, a training step touches every weight three times (forward GEMM, input-gradient GEMM, weight-gradient GEMM) and touches every retained activation twice; a prefill touches every weight once and retains only K and V; a decode step touches every weight once for a single token and reads the whole cache. The decode step is therefore a matrix–vector product per weight matrix — the lowest-intensity regime an accelerator sees ([§25.3](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch25-accelerators-memory-hierarchy-and-performance-models/25-3-roofline-reasoning.md)) — and batching across sequences is what restores intensity. MATHEMATICALLY-DERIVED from the trace.

## Formulation

Let `x ∈ {0,…,V−1}^{B×(T+1)}` be a training sequence (T+1 tokens so that T predictions exist). Inputs are `x_{1:T}`, targets are `x_{2:T+1}`, mask `m_t ∈ {0,1}`.

> **Definition — shifted targets.** The target tensor `y = x_{2:T+1}` aligned with inputs `x_{1:T}` so that the logits at position t score token x_{t+1}; in a packed batch the last input position has no target unless the next sequence's first token is used.

> **Definition — prompt prefill.** One full-sequence forward pass over a prompt of S tokens under the causal mask that returns the logits at position S and stores K_ℓ, V_ℓ for all positions and all ℓ.

> **Definition — cached decode step.** One forward pass over a single new token at position S+1 that computes its Q, K, V, appends K and V to the stored tensors, attends over S+1 keys, and returns one logit row.

$$
\mathcal{L}(\theta) = -\frac{\sum_{b,t} m_{b,t}\,\log \mathrm{softmax}\big(z_{b,t}\big)_{x_{b,t+1}}}{\sum_{b,t} m_{b,t}}
$$
*(Eq. 5.18)* where z is Eq. 5.3; the mean is over unmasked tokens (Eq. N.2 of [notation.md](../../../front-matter/notation.md)); log-softmax is computed in the stable form of §3.2, up-cast to FP32.

$$
\text{FLOPs}_{\text{backward}} \approx 2\times\text{FLOPs}_{\text{forward}}
$$
*(Eq. 5.19)* where for each forward GEMM `y = xW` the backward pass computes `∂x = ∂y Wᵀ` and `∂W = xᵀ ∂y`, each of the same cost as the forward GEMM; MATHEMATICALLY-DERIVED for GEMM-dominated compute, with element-wise and reduction costs omitted.

$$
a_{S+1} = \mathrm{softmax}\!\Big(\frac{q_{S+1}\,[K_{1:S};\,k_{S+1}]^{\top}}{\sqrt{D_h}}\Big)\,[V_{1:S};\,v_{S+1}]
$$
*(Eq. 5.20)* where `q_{S+1}, k_{S+1}, v_{S+1} ∈ ℝ^{1×Dh}` per head are computed from the new token only and no mask is needed because all stored keys are in the past.

$$
\Delta M_{KV} = 2\,L\,H_{kv}\,d_h\,b \;\text{ bytes per token}
$$
*(Eq. 5.21)* where the per-token increment follows from Eq. N.8 by dividing by B·S; with the reference form H_kv = H so `2·L·D·b` per token.

```figure
id: fig-5.22
kind: calculator
title: KV-cache bytes per token and per sequence
caption: >-
  Eq. 5.21 at the §5.6 configuration (illustrative, not a named model):
  36 KiB per token and 36 MiB for a 1024-token sequence. The cache is the
  only state that grows with s, so this number times the context length, not
  the parameter count, sizes decode memory. The H_kv preset previews the
  head-sharing lever that §14.1 owns.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.21"
alt: >-
  Calculator for Eq. 5.21, ΔM_KV = 2·L·H_kv·d_h·b bytes per token, and the
  cache for B sequences of length s. At the defaults (L = 12, H_kv = 12,
  d_h = 64, b = 2, s = 1024, B = 1) the increment is 36,864 bytes, 36 KiB, per
  token and the cache is 36 MiB. Preset s = 8192 gives 288 MiB; preset
  H_kv = 1 gives 3 KiB per token and 3 MiB at s = 1024.
spec:
  tex: >-
    \Delta M_{KV} = 2\,L\,H_{kv}\,d_h\,b
  equation: "5.21"
  inputs:
    - { symbol: L, label: "blocks L", default: 12, min: 1, max: 128, step: 1, format: integer }
    - { symbol: H_kv, label: "K, V heads H_kv", default: 12, min: 1, max: 64, options: [1, 2, 4, 8, 12, 16, 32, 64], format: integer }
    - { symbol: d_h, label: "head dimension d_h", default: 64, min: 32, max: 256, options: [32, 64, 128, 256], format: integer }
    - { symbol: b, label: "cache bytes per value", default: 2, min: 1, max: 4, options: [1, 2, 4], format: bytes }
    - { symbol: s, label: "tokens in context s", default: 1024, min: 1, max: 131072, scale: log2, format: tokens }
    - { symbol: B, label: "sequences B", default: 1, min: 1, max: 256, scale: log2, format: integer }
  outputs:
    - { symbol: dM, label: "cache bytes per token, all layers", formula: "2*L*H_kv*d_h*b", format: bytes }
    - { symbol: M, label: "cache for B sequences of length s", formula: "dM*s*B", format: bytes, emphasis: true }
  presets:
    - { label: "s = 8192", values: { s: 8192 } }
    - { label: "H_kv = 1, MQA-style (§14.1)", values: { H_kv: 1 } }
```

> **Assumption.** Dropout probability 0 in the reference model · *sensitivity:* PAPER-REPORTED (P01, §5.4): the original model applies dropout 0.1 to sub-layer outputs and embedding sums; with dropout > 0 train mode and eval mode compute different functions and the equivalence test of [verification.md](verification.md) must run in eval mode.

## Mechanism

**Training step.** Forward as Algorithm 5.1 with all T positions; loss as Eq. 5.18; backward by reverse-mode autodiff ([§3.3](../ch03-numerical-computation-and-trustworthy-training/03-3-automatic-differentiation.md)). The backward pass needs, per block: the inputs of every GEMM (n, Q, K, V, P or its recomputation, C, n_ffn, v), the pre-activation u for the activation's derivative, and the norm inputs — the retained set enumerated in §5.6. Cost: Eq. 5.19 gives about `3×` the forward FLOPs in total, i.e. `6N` per token from weight GEMMs plus three times the attention score term; retained activations are `O(L·B·T·(D + F + H·T))` bytes without recomputation. MATHEMATICALLY-DERIVED. Gradient of the logits with respect to z is `softmax(z) − onehot(y)` scaled by the token weight — the derivation of [§2.4](../ch02-mathematical-and-statistical-foundations/02-4-differential-calculus.md).

**Prefill.** Forward as Algorithm 5.1 over the prompt with `is_causal=True`, retaining K_ℓ and V_ℓ (`[B, H, S, Dh]` each) and discarding everything else; only `z[:, S−1]` is needed. Cost: `2N·S + 4·L·S²·D/2` FLOPs (causal average) and `2·L·B·S·H·Dh·b` cache bytes written. MATHEMATICALLY-DERIVED.

**Cached decode step.** Eq. 5.20 per block: the new token's Q, K, V cost `6D²` FLOPs; the append is a copy of `2·H·Dh·b` bytes per block; the attention over S+1 keys costs `4·(S+1)·D` FLOPs per block and reads `2·(S+1)·D·b` bytes of cache per block; the FFN and output projection cost the same as for any token. Per step: `2N + 4·L·(S+1)·D` FLOPs for one token, against `N·b_w` bytes of weight reads (every weight read once; b_w bytes per weight) plus `2·L·(S+1)·D·b` bytes of cache reads. The arithmetic intensity is therefore about `1 FLOP per byte` at B = 1 — memory-bound by orders of magnitude on any current accelerator — and scales with the number of sequences decoded together for the weight term but not for the cache term, which is per-sequence. MATHEMATICALLY-DERIVED; this is the observation of R5.6 in trace form, and its consequences are Chapter 42's subject.

```figure
id: fig-5.23
kind: calculator
title: Decode-step FLOPs, bytes and arithmetic intensity
caption: >-
  At B = 1 with BF16 weights and cache the step does exactly one FLOP per byte
  read, whatever s is. Raise B and the intensity rises only because weight
  reads are shared; each sequence brings its own cache, so the ceiling is set
  by the cache term. Weight bytes are N·b_w, as in Algorithm 5.7 line 4; the
  last output is the crossover of the Experimental design. Composes
  Eq. 5.21 with the per-step expressions of this paragraph.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.21", "DERIVED:eq-5.22", "DERIVED:alg-5.6"]
alt: >-
  Calculator for one cached decode step of B sequences at context length s.
  At the defaults (B = 1, s = 1024, N = 110,316,288 tied parameters, L = 12,
  D = 768, b_w = 2, b = 2; illustrative configuration, not a named model):
  258,381,312 FLOPs, 210 MiB of weight reads, 36 MiB of cache reads,
  arithmetic intensity 1.00 FLOP per byte, and a crossover at s ≈ 5,985
  tokens where one sequence's cache reads equal the weight reads. Preset
  B = 64 raises the intensity to about 6.27; preset s = 8192 leaves it at
  1.00.
spec:
  tex: >-
    \text{FLOPs} = B\,(2N + 4LsD),\qquad \text{bytes} = N\,b_w + B\cdot 2LsDb
  inputs:
    - { symbol: B, label: "sequences decoded together", default: 1, min: 1, max: 256, scale: log2, format: integer }
    - { symbol: s, label: "context length s", default: 1024, min: 128, max: 131072, scale: log2, format: tokens }
    - { symbol: N, label: "parameters N", default: 110316288, min: 10000000, max: 100000000000, scale: log10, format: params }
    - { symbol: L, label: "blocks L", default: 12, min: 1, max: 128, step: 1, format: integer }
    - { symbol: D, label: "width D = H·Dh", default: 768, min: 512, max: 8192, options: [512, 768, 1024, 2048, 4096, 8192], format: integer }
    - { symbol: b_w, label: "bytes per weight", default: 2, min: 1, max: 4, options: [1, 2, 4], format: bytes }
    - { symbol: b, label: "cache bytes per value", default: 2, min: 1, max: 4, options: [1, 2, 4], format: bytes }
  outputs:
    - { symbol: C, label: "FLOPs per step", formula: "B*(2*N + 4*L*s*D)", format: flops }
    - { symbol: Wb, label: "weight bytes read, N·b_w", formula: "N*b_w", format: bytes }
    - { symbol: Kb, label: "cache bytes read, B·2·L·s·D·b", formula: "B*2*L*s*D*b", format: bytes }
    - { symbol: I, label: "FLOP per byte", formula: "C/(Wb + Kb)", format: fixed2, emphasis: true }
    - { symbol: sx, label: "s where one cache = weight reads", formula: "N*b_w/(2*L*D*b)", format: tokens }
  presets:
    - { label: "B = 64 sequences", values: { B: 64 } }
    - { label: "s = 8192", values: { s: 8192 } }
```

**Why the two agree.** Under the causal mask, row t of P in Algorithm 5.2 depends only on `q_t` and `K_{1:t}, V_{1:t}`; those K and V rows depend only on `n_{1:t}`, which in a pre-norm block depend only on `h_{1:t}` of the previous block, and so on down to the embeddings of `x_{1:t}`. Hence the logits at position t computed by a full pass over T ≥ t tokens equal those computed by a pass over exactly t tokens, and by induction equal those of prefill-then-decode, exactly in real arithmetic. MATHEMATICALLY-DERIVED. In floating point they differ by reduction order (the softmax denominator over t keys is accumulated in different chunks) and by dtype of the stored cache; [verification.md](verification.md) bounds this.

**Train versus eval mode.** Differences in the reference model: (i) dropout, if enabled, is active only in train mode; (ii) the mask — training uses the causal mask plus a loss mask `m_t` on targets; prefill uses the causal mask and, in a padded batch, a padding mask on keys; decode uses no query-side mask and a key-side padding mask only in padded batches; (iii) train mode retains activations for backward, eval mode does not; (iv) the head is evaluated at all T positions in training and at one position in decode. OFFICIAL-DOCUMENTATION (R5.13): `scaled_dot_product_attention` accepts `dropout_p` and raises if `attn_mask` and `is_causal` are both given, so a padded-batch prefill must encode causality inside the explicit mask.

```figure
id: fig-5.24
kind: systems-trace
title: Train step, prefill and decode step on one device
caption: >-
  Read the memory column top to bottom: training keeps the whole per-block
  activation set alive for the backward pass, prefill keeps only K and V, and
  a decode step keeps nothing new except one K, V row per block. The compute
  column shrinks from T tokens to one while the bytes read per step grow with
  s, which is why the last row is the one marked. Communication is none on
  one device and is omitted.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.18", "DERIVED:eq-5.19", "DERIVED:eq-5.20", "DERIVED:eq-5.21"]
alt: >-
  Systems trace with four columns (latency, memory, compute, failure) and
  five stages. Training forward over T positions: one pass with GEMMs over
  B·T rows; retains n, Q, K, V, P, C, n_ffn, u and v per block; 2N FLOPs per
  token plus the 4·L·T·D score term; failure is future leakage from a wrong
  mask. Loss, Eq. 5.18: [B, T, V] logits with log-softmax up-cast to FP32;
  failure is off-by-one targets. Backward, Eq. 5.19: about twice the forward
  FLOPs from input-gradient and weight-gradient GEMMs; consumes the retained
  set. Prefill of S tokens: one pass under no_grad that keeps only K and V,
  2·L·B·S·H·Dh·b bytes; 2N·S + 2·L·S²·D FLOPs; failures are score OOM at
  large S, dropout left on, and a padded batch without an explicit causal
  mask. Cached decode step at length s, emphasised: bandwidth-bound at about one
  FLOP per byte for B = 1; reads N·b_w weight bytes and 2·L·s·D·b cache bytes
  and appends 2·H·Dh·b per block; 2N + 4·L·s·D FLOPs; failures are cache
  indexing and position offset.
spec:
  columns: [latency, memory, compute, failure]
  stages:
    - { name: "train: forward over T positions", values: { latency: "one pass; GEMMs over B·T rows", memory: "retains n, Q, K, V, P, C, n_ffn, u, v per block", compute: "2N per token + 4·L·T·D score term", failure: "future leakage from a wrong mask" } }
    - { name: "train: loss, Eq. 5.18", values: { memory: "[B, T, V] logits; log-softmax up-cast to FP32", compute: "O(V) per token, omitted from FLOP totals", failure: "off-by-one targets" } }
    - { name: "train: backward, Eq. 5.19", values: { memory: "consumes and frees the retained set", compute: "≈ 2 × forward: ∂x = ∂y·Wᵀ and ∂W = xᵀ·∂y per GEMM" } }
    - { name: "prefill, S prompt tokens", values: { latency: "one full-sequence pass", memory: "no_grad; keeps only K, V: 2·L·B·S·H·Dh·b bytes written", compute: "2N·S + 2·L·S²·D, causal average", failure: "score OOM at large S; dropout left on; padded batch needs an explicit causal mask" } }
    - { name: "cached decode step at length s", emphasis: true, values: { latency: "bandwidth-bound, ≈ 1 FLOP per byte at B = 1", memory: "reads N·b_w + 2·L·s·D·b; appends 2·H·Dh·b per block", compute: "2N + 4·L·s·D per token", failure: "cache indexing; position offset" } }
```

## Algorithm

```text
Algorithm 5.5 — Training step (single device, no accumulation)
INPUT   x : int64 [B, T+1]; m : {0,1} [B, T]; θ; optimiser state
OUTPUT  updated θ; scalar loss
STATE   retained activations (per block: n, Q, K, V, P, C, n_ffn, u, v)
INVARIANT loss is a mean over Σ m (Eq. 5.18); gradients are zero for masked targets
1.  model.train(); zero gradients
2.  z ← Forward(x[:, :T])                         # Algorithm 5.1; retains activations
3.  loss ← Eq. 5.18 with targets x[:, 1:T+1] and mask m; log-softmax in FP32
4.  ∂θ ← backward(loss)                           # reverse-mode; Eq. 5.19 cost
5.  optionally clip ‖∂θ‖ (§19.3)
6.  θ ← optimiser.step(θ, ∂θ); free retained activations
7.  return loss
TERMINATION: one step.
```

```text
Algorithm 5.6 — Prompt prefill and cached decode step
INPUT   prompt p : int64 [B, S]; θ; steps G; sampler (§37.1)
OUTPUT  generated tokens y : [B, G]; cache K_ℓ, V_ℓ : [B, H, S+G, Dh] for ℓ = 1..L
STATE   cache; current length s
INVARIANT after each step, cache[:, :, :s] holds K, V of exactly the first s tokens, and
          logits for position s equal those of a full pass over the first s tokens (real arithmetic)
--- prefill ---
1.  model.eval(); s ← S
2.  h ← E[p] + P[0:S]
3.  for ℓ = 1 … L:
4.      n ← RMSNorm(h); Q, K_ℓ, V_ℓ ← split_heads(n W_Q), split_heads(n W_K), split_heads(n W_V)
5.      cache[ℓ] ← (K_ℓ, V_ℓ)                     # 2·L·B·S·H·Dh·b bytes written
6.      h ← h + merge_heads(Attention(Q, K_ℓ, V_ℓ; causal)) W_O
7.      h ← h + FFN(RMSNorm(h))
8.  z ← RMSNorm(h[:, S−1]) W_out                   # one logit row per sequence
9.  y_1 ← sampler(z)
--- decode step (repeat for g = 1 … G−1) ---
10. h ← E[y_g] + P[s]                              # [B, 1, D]
11. for ℓ = 1 … L:
12.     n ← RMSNorm(h); q, k, v ← projections of n  # [B, H, 1, Dh]
13.     cache[ℓ] ← append(cache[ℓ], k, v)          # write 2·H·Dh·b bytes per sequence
14.     h ← h + merge_heads(Attention(q, cache[ℓ].K, cache[ℓ].V; no mask)) W_O   # Eq. 5.20
15.     h ← h + FFN(RMSNorm(h))
16. s ← s + 1; z ← RMSNorm(h[:, 0]) W_out; y_{g+1} ← sampler(z)
17. return y, cache
TERMINATION: G steps, or an end-of-sequence token (§37.2).
```

Complexity: prefill `2N·S + 2·L·S²·D` FLOPs (causal average); each decode step `2N + 4·L·s·D` FLOPs and `N·b_w + 2·L·s·D·b` bytes read; cache growth Eq. 5.21 per token. Implementation: `generate()` in `reference_transformer.py`, [verification.md](verification.md).

```figure
id: fig-5.25
kind: diagram
title: Prefill and cached-decode dataflow
caption: >-
  Prefill runs once and its only lasting output is the KV cache; every decode
  step then computes q, k, v for one token, appends one row, and reads the
  whole cache. The emphasised edge is the only one whose cost grows with s.
  The weights are read in full by both phases, which is why decode at small
  batch is a matrix–vector workload.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:alg-5.6", "DERIVED:eq-5.20", "DERIVED:eq-5.21"]
alt: >-
  Left-to-right diagram of Algorithm 5.6. The prompt [B, S] enters the prefill
  group, a causal forward pass costing 2N·S + 2·L·S²·D FLOPs that writes
  2·L·B·S·H·Dh·b bytes into the KV cache [L, 2, B, H, S_max, Dh] and emits one
  logit row [B, V] to the sampler. The sampler's token y_g enters the decode
  group: embedding plus the position row P[s] gives [B, 1, D]; the q, k, v
  projections give [B, H, 1, Dh]; k and v are appended at slot s, 2·H·Dh·b
  bytes per block; attention over s keys without a mask (Eq. 5.20) reads the
  cache, the emphasised edge, 2·L·s·D·b bytes per step; W_O, the FFN, the
  final norm and the head produce one logit row, which returns to the sampler
  as the next token. The weights feed both phases and are read in full every
  step.
spec:
  direction: LR
  nodes:
    - { id: p, kind: tensor, label: "prompt p", sub: "[B, S] int64" }
    - { id: w, kind: model, label: "weights θ", sub: "N·b_w bytes, read in full every step" }
    - { id: pf, kind: process, label: "prefill forward, causal", sub: "2N·S + 2·L·S²·D FLOPs", group: pre }
    - { id: zs, kind: tensor, label: "logit row at position S", sub: "[B, V]", group: pre }
    - { id: kv, kind: memory, label: "KV cache, all L blocks", sub: "[L, 2, B, H, S_max, Dh]", emphasis: true }
    - { id: smp, kind: process, label: "sampler (§37.1)", sub: "y_g, one token per sequence" }
    - { id: emb, kind: process, label: "embed y_g + P[s]", sub: "[B, 1, D]; absolute position s", group: dec }
    - { id: qkv, kind: process, label: "q, k, v projections", sub: "[B, H, 1, Dh] · 6·D² FLOPs per block", group: dec }
    - { id: app, kind: process, label: "append k, v at slot s", sub: "2·H·Dh·b bytes per block", group: dec }
    - { id: att, kind: process, label: "attend over s keys, no mask", sub: "Eq. 5.20 · 4·s·D FLOPs per block", group: dec }
    - { id: rest, kind: process, label: "W_O, FFN, final norm, head", sub: "one logit row [B, V]", group: dec }
  edges:
    - { from: p, to: pf }
    - { from: w, to: pf, kind: dependency, label: "read once" }
    - { from: pf, to: kv, label: "writes 2·L·B·S·H·Dh·b" }
    - { from: pf, to: zs }
    - { from: zs, to: smp }
    - { from: smp, to: emb, label: "y_g" }
    - { from: emb, to: qkv }
    - { from: w, to: qkv, kind: dependency, label: "read in full" }
    - { from: qkv, to: app }
    - { from: app, to: kv, label: "append" }
    - { from: kv, to: att, kind: emphasis, label: "reads 2·L·s·D·b per step" }
    - { from: qkv, to: att, label: "q" }
    - { from: att, to: rest }
    - { from: rest, to: smp, kind: feedback, label: "next token, s ← s + 1" }
  groups:
    - { id: pre, label: "prefill, once per prompt" }
    - { id: dec, label: "decode step, once per generated token" }
```

## Implementation

Tensors → operators: the cache is a pre-allocated `[L, 2, B, H, S_max, Dh]` tensor written by slice assignment, or a list of per-block tensors grown by `torch.cat` — the former avoids reallocation, the latter is simpler and O(s) per step in copies. Framework: PyTorch; `torch.no_grad()` or inference mode for prefill and decode so that no activations are retained. Kernels: OFFICIAL-DOCUMENTATION (R5.15): the FlashAttention repository provides `flash_attn_with_kvcache` for incremental decoding with in-place cache updates, and aligns the causal mask to the bottom-right corner when the query length is shorter than the key length — the convention under which a chunked prefill of several new tokens against an existing cache is correct. Memory: the cache is the only state that grows with s; weights are read in full every step. Communication: none on one device. Deployment: inference engines replace the contiguous cache by paged blocks with a block table ([§42.3](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-3-cache-organization.md)); the invariant of Algorithm 5.6 is what the block table must preserve.

```figure
id: fig-5.26
kind: matrix
title: Bottom-right causal alignment for a chunk against a cache
caption: >-
  Three new queries at positions 6 to 8 attend over five cached keys plus
  themselves. Aligning the mask to the bottom-right corner, the convention
  R5.15 documents, gives each new query all cached keys and the new keys up to
  its own position. A decode step is the one-row case, where the whole row is
  admitted and no mask is needed.
placement: rail
anchor: implementation
evidence: OFFICIAL-DOCUMENTATION
source: [R5.15, "DERIVED:eq-5.20"]
alt: >-
  Three by eight grid: rows are new query positions 6, 7 and 8; columns are
  key positions 1 to 8, of which 1 to 5 are already cached. Query 6 admits
  keys 1 to 6, query 7 admits keys 1 to 7, and query 8 admits all 8 keys; the
  first row is highlighted across keys 1 to 6. The filled region is a causal
  triangle aligned to the bottom-right corner, 21 of 24 cells.
spec:
  rows: 3
  cols: 8
  pattern: causal
  rowLabel: "new query position"
  colLabel: "key position, 5 cached + 3 new"
  rowTicks: ["6", "7", "8"]
  colTicks: ["1", "2", "3", "4", "5", "6", "7", "8"]
  highlight:
    - { row: 0, col: 0 }
    - { row: 0, col: 1 }
    - { row: 0, col: 2 }
    - { row: 0, col: 3 }
    - { row: 0, col: 4 }
    - { row: 0, col: 5 }
  legend: "bottom-right aligned: query at position 5 + r sees keys 1 to 5 + r"
```

> **Implementation note [impl.pytorch · 2.14.0 documentation, execution UNVERIFIED].** With learned absolute positions, the decode step must index `P[s]` with the absolute position s, not 0; a RoPE model rotates q and k by the absolute position for the same reason. This is the position-offset error that [verification.md](verification.md) is designed to catch.

## Experimental design

The chapter's verification task: see [verification.md](verification.md), Experiment 5.1. For this section the additional proposal is a cost trace: count FLOPs and bytes per decode step for s ∈ {128, 1024, 8192} with the expressions above and tabulate the cache-read share; expected: the cache term overtakes the weight-read term at `s > N·b_w/(2·L·D·b)` — for the §5.6 configuration with BF16 weights and cache, at s ≈ 6,000 tokens. This is arithmetic, not a measurement.

## Observations

**What the paper claims.** PAPER-REPORTED (P01, §3.2.3): decoder self-attention masks out (sets to −∞) all values in the softmax input corresponding to illegal connections to preserve the auto-regressive property. PAPER-REPORTED (R5.6): the cost of incremental decoding is dominated by loading K and V; sharing K and V across heads reduces it. PAPER-REPORTED (R5.8, §2.4): LLaMA's training implementation does not store attention weights and does not compute masked scores, and reduces recomputed activations with checkpointing.

**What the evidence shows.** The prefill/decode equivalence is a theorem under the causal mask; the bandwidth-bound character of decode is a consequence of the FLOP and byte counts above and is consistent with R5.6's motivation; no measured latency is asserted here.

**What we infer.** DERIVED: decode arithmetic per token is fixed at `2N` while decode bytes per token grow with s, so context length, not model size alone, sets decode cost at long s; this is why cache bytes (Eq. 5.21) are the chapter's first memory trace and Chapter 42's central quantity.

**What remains unknown.** UNVERIFIED: the realised tolerance between prefill and cached logits on a named accelerator (protocol proposed, not run). NOT-DISCLOSED: cache dtype and layout of production engines are release-specific.

## Failure modes

> **Failure mode — off-by-one targets.** *Symptom:* loss near log V that never falls, or an implausibly low loss. *Cause:* targets not shifted (model predicts the current token), or shifted by two. *Detection:* hand-audit one sequence: `logits[t]` must be scored against `x[t+1]`. *Mitigation:* construct inputs and targets from one `[B, T+1]` tensor by slicing.

> **Failure mode — cache indexing error.** *Symptom:* the first decoded token matches the full-pass prediction, later ones diverge. *Cause:* K/V appended at the wrong slot or read past the current length. *Detection:* [verification.md](verification.md), position-resolved differences. *Mitigation:* pre-allocated cache with an explicit length counter.

> **Failure mode — position offset error.** *Symptom:* divergence that grows with decode step. *Cause:* `P[0]` (or RoPE angle 0) used for every decoded token. *Detection:* [verification.md](verification.md), monotone growth of the error with position. *Mitigation:* pass the absolute position into the decode step.

> **Failure mode — train-mode leakage into evaluation.** *Symptom:* non-deterministic logits for the same input. *Cause:* dropout active. *Detection:* two evaluations differ. *Mitigation:* `model.eval()` and `torch.no_grad()`.

## Siblings

**Full recompute per generated token** — this file (baseline)
Why it exists: simplest correct generation. What assumption changed (relative to cached decode): nothing is retained across steps. What objective changed: none. What problem it solved: none — it is the reference semantics. What new failure mode it introduced: O(s) FLOPs per step and O(s²) score work. Changed primitive: cached K, V → recomputed K, V.

**Cached decode** — this file, Algorithm 5.6
Why it exists: the redundancy of recomputing K, V under a causal mask. What assumption changed: K, V rows are immutable once computed. What objective changed: none. What problem it solved: per-step arithmetic becomes O(1) in s for weights. What new failure mode it introduced: cache bytes growing as Eq. 5.21 and bandwidth-bound steps. Changed primitive: full-sequence attention → one-row query against stored keys.

**Serving-phase decomposition** — [§42.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-1-phase-decomposition.md)
Why it exists: client-visible latency has phases (TTFT, TPOT) that map onto prefill and decode. What assumption changed: many sequences, arrivals over time. What objective changed: throughput under SLOs. What problem it solved: scheduling prefill and decode jointly. What new failure mode it introduced: interference between phases. Changed primitive: one sequence → a batch with a scheduler.

**Speculative decoding** — [§37.5](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-5-speculative-decoding.md)
Why it exists: decode is bandwidth-bound at small batch. What assumption changed: several candidate tokens can be verified in one forward pass. What objective changed: none (distribution preserved). What problem it solved: more tokens per weight read. What new failure mode it introduced: drafting overhead and acceptance variance. Changed primitive: one query row per step → several.

## Extensions

Long context makes the cache the dominant memory term (Eq. 5.21 × s); multimodal prefixes are prefilled once and cached like text; agents interleave prefill (tool outputs) and decode, so the cache is repeatedly extended, which [§42.3](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-3-cache-organization.md)'s prefix sharing exploits. Proposals only.

## Limitations

The equivalence holds for causal, position-stationary models without cross-sequence state; it does not hold for models whose per-token computation depends on future tokens (encoders) or on the batch (batch-dependent normalisation). The FLOP and byte expressions ignore sampler cost and framework overhead, which dominate at very small models. Falsification: a cached implementation that fails the tolerance of [verification.md](verification.md) at position 1 has a mask or indexing defect, not a numerical one.

## Reproducibility

`generate()` and `train_step()` in [verification.md](verification.md); PyTorch 2.14.0 documented API (R5.13); FlashAttention cache function per R5.15 as of 2026-09-20; execution UNVERIFIED.

## References

P01 · R5.6 · R5.8 · R5.13 · R5.15 · [notation.md](../../../front-matter/notation.md) · [references.md](references.md)
