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
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 5.5 Training and generation

## Scope

Training, prompt prefill, and cached decoding execute related forward functions with different target sets, tensor lifetimes, and persistent state. Training differentiates a masked next-token objective; prefill computes prompt representations and initializes per-layer keys/values; a decode step processes a new token against that retained prefix. The cache is correct only when the stored states remain valid under the same model parameters, positions, conditioning, and visibility policy. This section derives that invariant and its arithmetic costs, distinguishes module mode from autograd mode, and specifies when full and incremental evaluation are equivalent. (MATHEMATICALLY-DERIVED; PAPER-REPORTED: P01 section 3; R5.6 section 2.)

## Why this exists

With an unchanging causal model, the representation of an earlier position does not depend on tokens appended later. Recomputing the complete prefix for each generated token therefore repeats earlier projections and feed-forward transformations. Storing layer-specific K/V avoids that repeated branch computation, while each new query still interacts with the allowed cached keys and values. Cached generation reduces one kind of work and introduces persistent state; it does not make the attention work independent of context length. (MATHEMATICALLY-DERIVED.)

Training has a different state requirement. Reverse-mode differentiation needs values used by backward operators, or a plan to reconstruct them. An inference cache is not a substitute for this saved graph. Detaching cached activations during a training algorithm can truncate gradients through earlier tokens, changing the optimization even when current forward logits appear plausible. Parameter updates can also invalidate previously computed K/V, so inference-cache reuse assumes fixed parameters or an explicit invalidation protocol.

## Intuition

The three modes can be distinguished by which rows they compute and which values they preserve. Teacher-forced training produces a logit row for every scored input position and accumulates derivatives from all eligible targets. Prefill processes all prompt positions inside the blocks but may project only the last hidden row to the vocabulary when only the next-token distribution is requested. Decode processes one new hidden row per active sequence, reads its permitted prefix state, and appends its newly computed K/V.

The distinction between block rows and head rows matters for compute. A prefill that returns only last-position logits should not be charged for an S-row vocabulary projection unless it actually performs one. Similarly, resident embedding storage is not the same as the embedding bytes read in one step: input embedding is a gather over used IDs, whereas the output head uses a dense vocabulary matrix. Tying those weights shares storage without equating the two access patterns. (MATHEMATICALLY-DERIVED.)

## Formulation

Use a zero-based training stream x with shape `[B, T+1]`, input `x[:,: T]`, targets `x[:,1: T+1]`, and target eligibility m[B, T]. In a packed dataset, document boundaries and whether cross-document conditioning is allowed must be specified separately from the target mask. Assume at least one eligible target for a token-mean update.

$$
\mathcal L=-\frac{\sum_{b=1}^B\sum_{t=0}^{T-1}m_{b,t}\log\operatorname{softmax}(z_{b,t})_{x_{b,t+1}}}{n_{\mathrm{valid}}},\qquad n_{\mathrm{valid}}=\sum_{b,t}m_{b,t}>0.
$$
*(Eq. 5.18)* A zero target mask makes the direct derivative of that logit row0; its hidden state can still receive gradients through later supervised positions' attention. An all-masked microbatch needs an explicit skip or accumulation policy, rather than division by 0.

$$
C_{\mathrm{backward,GEMM}}\simeq2C_{\mathrm{forward,GEMM}}.
$$
*(Eq. 5.19)* The approximation counts both input and weight gradients for each dense product. It excludes reductions, activation derivatives, optimizer operations, and extra recomputation, and changes when a required gradient is absent.

$$
a_{s}=\operatorname{softmax}\left(q_s[K_{0:s-1};k_s]^{\top}/\sqrt{d_h}\right)[V_{0:s-1};v_s].
$$
*(Eq. 5.20)* Here s past/current indexing means the newly consumed token is at absolute index s and there are s+1 valid keys. Padding, document, sliding-window, or other visibility restrictions must still be applied when they exist.

$$
\Delta M_{\mathrm{KV}}=2LH_{\mathrm{kv}}d_h b_{\mathrm{kv}}\quad\text{bytes per consumed token per sequence}.
$$
*(Eq. 5.21)* For the equal-head reference this is 2Ld*b_kv. It counts K and V for all layers, without allocator padding, page metadata, or quantization scales. (MATHEMATICALLY-DERIVED.)

```figure
id: fig-5.22
kind: calculator
title: KV-cache bytes per token and per sequence
caption: >-
  The reference stores 36 KiB of K/V per consumed token across layers and
  36 MiB for one 1024-token sequence. This is the cache term; total inference
  memory also includes parameters, temporaries, logits, workspaces, and
  allocator reserve. Lengths above T_max=1024 require a changed positional
  specification. Head sharing changes this cache count and the model.
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

## Mechanism

### Methodology

A training step first constructs shifted targets and a mask whose denominator agrees with the intended objective. It evaluates the forward graph, computes stable log-softmax/target selection, differentiates, and applies the chosen optimizer update. For an eligible hard target, the logit cotangent is `m/n_valid*(softmax(z)-onehot(target))`. Those cotangents propagate through the head, all residual/normalization/branch paths, and all earlier visible positions. Accumulating unequal-sized microbatches or ranks requires the global target-count scaling developed in 4.1; a mean of local means is not generally the same gradient. (MATHEMATICALLY-DERIVED.)

The saved training set depends on the backward implementation. A materialized attention path can retain probabilities and projection inputs; a fused attention backward can reconstruct tiled probabilities. A plain FFN can retain its activation inputs/outputs, while checkpointing re-executes some forward operations. Thus the saved state and recomputation plan determine peak memory and training FLOPs together. `3*forward` is a leading GEMM approximation under a declared no-recomputation, all-required-gradients account, rather than a universal measured training-cost multiplier.

For a prompt of S tokens, prefill computes all S rows through each block and stores every layer's K/V at their absolute positions. The final hidden row at index S-1 predicts the first generated token at index S. That generated token is not in the cache until it is consumed by the next forward step. After generating G>=1 tokens in the ordinary loop and returning immediately after the last sample, the cache holds S+G-1 consumed tokens. A cache containing S+G tokens would require consuming the last generated token as an additional operation. This boundary matters in capacity, equivalence, and latency accounting. (MATHEMATICALLY-DERIVED.)

The equivalence proof is an induction on both layer and absolute token position. Embedding and position values for a fixed token/position agree in full and incremental execution. Assume all required earlier layer-input rows agree. Causal attention for the new row then sees the same normalized query and the same permitted K/V rows as a full pass. The value combination, output projection, residual update, row-wise normalization, and FFN consequently agree. Applying this argument through all L layers gives the same next-token logit row in real arithmetic. Future input positions cannot alter those earlier rows under the stipulated causal, row-local computation.

The proof requires unchanged parameters, token IDs, position mapping, attention policy, conditioning, and deterministic non-stochastic operators. A normalization across the full sequence, changing position-scale policy, or a new visibility rule can violate these premises. Dropping old cache entries also does not automatically equal recomputing a model on a truncated prefix: retained earlier states may already encode information from removed positions. A changed cache policy therefore needs its own functional specification. Floating-point equality is weaker still because kernel tiling, reduction order, casts, and cache dtype can differ. (MATHEMATICALLY-DERIVED.)

For explicit cost accounting define `N_dense=L*(4d^2+2dF)+dV` for the matrices used in the block and vocabulary projections. It excludes position tables, normalization gains, and input-only embedding storage when untied. With B prompts and a head evaluated only on the final row, an ideal allowed-pair causal prefill has leading work

$$
C_{\mathrm{prefill}}=2BSL(4d^2+2dF)+2BdV+2BL S(S+1)d.
$$
The final term counts both attention products over allowed pairs. A dense masked implementation replaces it by 4BL*S^2*d. If all prompt logits are requested, the head term becomes2BSdV.

A one-token decode step whose total valid key length is s has leading work `2B*N_dense+4BLsd`. An ideal one-read account for its dense weights plus cache is `N_dense*b_w+2BLsd*b_kv` bytes per batch, with embedding gathers, gains, intermediate traffic, and workspaces additional. This expression is an access model, not a guarantee that hardware reads each weight/cache element exactly once. Batching can amortize dense-weight reads while cache reads still grow with the individual sequence lengths. Device-specific bandwidth and compute limits are needed before inferring a runtime bottleneck. (MATHEMATICALLY-DERIVED.)

```figure
id: fig-5.23
kind: calculator
title: Decode-step FLOPs, bytes and arithmetic intensity
caption: >-
  This calculator uses N_dense, not all resident parameters, and an ideal
  one-read matrix/cache model. With B=1 and two-byte storage its leading
  arithmetic divided by the counted reads is one FLOP per byte. This omits
  other traffic and does not establish measured intensity or a bandwidth
  bottleneck. The matrix/cache crossing is beyond the reference position
  limit; longer-length presets are algebraic sensitivity studies.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.21", "DERIVED:eq-5.22", "DERIVED:alg-5.6"]
alt: >-
  Ideal decode account with B=1, s=1024, N_dense=109510656, L=12, d=768,
  two-byte matrix/cache storage:256770048 leading FLOPs,208.875 MiB
  matrix reads, and 36 MiB cache reads. Their ratio is 1 FLOP per byte. The
  counted read terms cross at 5941.333 tokens, beyond T_max=1024. B=64
  gives approximately6.24 FLOPs per counted byte under shared matrix reads.
spec:
  tex: >-
    \text{FLOPs} = B\,(2N + 4LsD),\qquad \text{bytes} = N\,b_w + B\cdot 2LsDb
  inputs:
    - { symbol: B, label: "sequences decoded together", default: 1, min: 1, max: 256, scale: log2, format: integer }
    - { symbol: s, label: "context length s", default: 1024, min: 128, max: 131072, scale: log2, format: tokens }
    - { symbol: N, label: "N_dense: dense matrix elements", default: 109510656, min: 10000000, max: 100000000000, scale: log10, format: params }
    - { symbol: L, label: "blocks L", default: 12, min: 1, max: 128, step: 1, format: integer }
    - { symbol: D, label: "width D = H·Dh", default: 768, min: 512, max: 8192, options: [512, 768, 1024, 2048, 4096, 8192], format: integer }
    - { symbol: b_w, label: "bytes per weight", default: 2, min: 1, max: 4, options: [1, 2, 4], format: bytes }
    - { symbol: b, label: "cache bytes per value", default: 2, min: 1, max: 4, options: [1, 2, 4], format: bytes }
  outputs:
    - { symbol: C, label: "FLOPs per step", formula: "B*(2*N + 4*L*s*D)", format: flops }
    - { symbol: Wb, label: "ideal dense-matrix reads, N_dense*b_w", formula: "N*b_w", format: bytes }
    - { symbol: Kb, label: "cache bytes read, B·2·L·s·D·b", formula: "B*2*L*s*D*b", format: bytes }
    - { symbol: I, label: "FLOP per byte", formula: "C/(Wb + Kb)", format: fixed2, emphasis: true }
    - { symbol: sx, label: "s where one cache = weight reads", formula: "N*b_w/(2*L*D*b)", format: tokens }
  presets:
    - { label: "B = 64 sequences", values: { B: 64 } }
    - { label: "s = 8192", values: { s: 8192 } }
```

```figure
id: fig-5.24
kind: systems-trace
title: Train step, prefill and decode step on one device
caption: >-
  Training preserves or reconstructs a backward graph; prefill preserves
  K/V while also producing logits and transient activations; decode consumes
  a new token and appends K/V. Costs depend on head rows, saved tensors,
  mask execution, and reuse. No latency or peak-memory measurement is shown.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.18", "DERIVED:eq-5.19", "DERIVED:eq-5.20", "DERIVED:eq-5.21"]
alt: >-
  Mode comparison with declared leading matrix work and persistent state.
  Training evaluates all scored head rows. Prefill computes all block rows
  but may evaluate only the last head row. Decode computes one new row per
  active sequence. The table separates logical storage from measured peak
  and does not classify a hardware bottleneck.
spec:
  columns: [latency, memory, compute, failure]
  stages:
    - { name: "train: forward over T positions", values: { latency: "one pass; GEMMs over B·T rows", memory: "retains n, Q, K, V, P, C, n_ffn, u, v per block", compute: "2*N_dense per token + 4*L*T*d for dense pairs", failure: "future leakage from a wrong mask" } }
    - { name: "train: loss, Eq. 5.18", values: { memory: "[B, T, V] logits; log-softmax up-cast to FP32", compute: "O(V) per token, omitted from FLOP totals", failure: "off-by-one targets" } }
    - { name: "train: backward, Eq. 5.19", values: { memory: "consumes and frees the retained set", compute: "≈ 2 × forward: ∂x = ∂y·Wᵀ and ∂W = xᵀ·∂y per GEMM" } }
    - { name: "prefill, S prompt tokens", values: { latency: "one full-sequence pass", memory: "persistent K/V plus transient activations,logits,workspace", compute: "2*B*S*N_block-mat + 2*B*d*V + 2*B*L*S*(S+1)*d,last-row head", failure: "score OOM at large S; dropout left on; padded batch needs an explicit causal mask" } }
    - { name: "cached decode step at length s", emphasis: true, values: { latency: "requires device/kernel measurement", memory: "ideal reads N_dense*b_w + 2*B*L*s*d*b; new K/V per sequence", compute: "B*(2*N_dense+4*L*s*d) per step", failure: "cache indexing; position offset" } }
```

## Algorithm

```text
Algorithm 5.5 - One single-device next-token update
INPUT: x[B,T+1]; mask m[B,T] with positive valid count; model parameters; optimizer state
OUTPUT: updated parameters and scalar token-mean loss
STATE: gradients and declared saved/recomputed activation state
INVARIANT: logits at index t score x at t+1; the denominator is the total eligible-target count
1. Set the declared training mode and clear gradients.
2. Evaluate logits on x[:,:T] with the declared causal/document attention mask.
3. Compute stable masked target NLL, summed and divided by sum(m).
4. Differentiate through every required input and parameter path.
5. Apply the declared clipping and optimizer update; retain its updated state.
6. Release activation state after its last use and return the loss.
TERMINATION: one finite update.
```

```text
Algorithm 5.6 - Prefill and ordinary cached generation
INPUT: prompt[B,S] with S>=1; generation count G>=0; fixed parameters; sampler; capacity>=S+max(G-1,0)
OUTPUT: generated tokens; cache for the tokens actually consumed
STATE: cache length s; one K/V array per layer; current next-token logits
INVARIANT: cached rows equal the declared full-pass rows for exactly the consumed prefix
1. If G is zero, return an empty generation without running prefill.
2. Enter deterministic evaluation and disable autograd; pass dropout_p=0 to functional attention.
3. Prefill all S prompt rows using absolute positions0..S-1 and the correct visibility mask.
4. Store each layer's prompt K/V; set s=S; project the final hidden row to logits.
5. Sample the first generated token and append it to the output.
6. While fewer than G tokens have been sampled and no stopping condition holds:
7.     Embed the most recently sampled token at absolute position s.
8.     For each layer, compute new Q/K/V, store K/V at slot s, and attend to valid keys0..s.
9.     Complete residual and FFN updates; increment s; compute one next-token logit row.
10.    Sample and append the next output token.
11. Return the sampled tokens and the cache, without consuming the last sample again.
TERMINATION: G samples or the declared stopping condition.
```

For an early-stopped nonempty generation of g tokens, cache length is S+g-1. The generation count, consumed-token count, and requested logit rows are separate quantities. Learned-position capacity must cover every consumed absolute position. (MATHEMATICALLY-DERIVED.)

```figure
id: fig-5.25
kind: diagram
title: Prefill and cached-decode dataflow
caption: >-
  For G>0, prefill consumes the prompt and produces its next-token logit
  row. Each subsequent call consumes the previously sampled token; the last
  sample need not be consumed. Thus G samples ordinarily require G-1 cached
  decode calls and leave S+G-1 consumed tokens. Let s denote the valid cache
  length after the current append; its new token occupies absolute slot s-1.
  Single-query unmasked attention requires all s cached keys to be valid.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:alg-5.6", "DERIVED:eq-5.20", "DERIVED:eq-5.21"]
alt: >-
  Prompt prefill writes per-layer K/V and produces the first sampling
  distribution. Subsequent calls embed the previous sample at its absolute
  position, append K/V, and attend over valid keys. The head evaluates one row.
  The loop returns after the last sample without consuming it; parameters,
  transient buffers, and cache reads have separate resource accounts.
spec:
  direction: LR
  nodes:
    - { id: p, kind: tensor, label: "prompt p", sub: "[B, S] int64" }
    - { id: w, kind: model, label: "weights θ", sub: "resident storage differs from dense matrix reads" }
    - { id: pf, kind: process, label: "prefill forward, causal", sub: "last-row head; formula in Mechanism", group: pre }
    - { id: zs, kind: tensor, label: "logit row at index S-1 predicts token S", sub: "[B, V]", group: pre }
    - { id: kv, kind: memory, label: "KV cache, all L blocks", sub: "[L, 2, B, H, S_max, Dh]", emphasis: true }
    - { id: smp, kind: process, label: "sampler (§37.1)", sub: "y_g, one token per sequence" }
    - { id: emb, kind: process, label: "embed previous sample + P[s-1]", sub: "s is valid length after append", group: dec }
    - { id: qkv, kind: process, label: "q, k, v projections", sub: "[B, H, 1, Dh] · 6·D² FLOPs per block", group: dec }
    - { id: app, kind: process, label: "append k,v at absolute slot s-1", sub: "2·H·Dh·b bytes per block", group: dec }
    - { id: att, kind: process, label: "attend over s keys, no mask", sub: "Eq. 5.20 · 4·s·D FLOPs per block", group: dec }
    - { id: rest, kind: process, label: "W_O, FFN, final norm, head", sub: "one logit row [B, V]", group: dec }
  edges:
    - { from: p, to: pf }
    - { from: w, to: pf, kind: dependency, label: "matrix operations" }
    - { from: pf, to: kv, label: "writes 2·L·B·S·H·Dh·b" }
    - { from: pf, to: zs }
    - { from: zs, to: smp }
    - { from: smp, to: emb, label: "y_g" }
    - { from: emb, to: qkv }
    - { from: w, to: qkv, kind: dependency, label: "dense matrix operations" }
    - { from: qkv, to: app }
    - { from: app, to: kv, label: "append" }
    - { from: kv, to: att, kind: emphasis, label: "reads 2·L·s·D·b per step" }
    - { from: qkv, to: att, label: "q" }
    - { from: att, to: rest }
    - { from: rest, to: smp, kind: feedback, label: "next token, s ← s + 1" }
  groups:
    - { id: pre, label: "prefill, once per prompt" }
    - { id: dec, label: "consume previous sample; G-1 calls for G samples" }
```

## Implementation

Module evaluation mode and autograd mode are independent. `model.eval()` changes mode-dependent modules; it does not generally disable gradient recording. Conversely, disabling autograd does not by itself disable dropout. Functional SDPA uses its explicit dropout_p, so deterministic inference supplies0. A validation forward may run evaluation mode with gradients enabled when an attribution or derivative check requires them. (OFFICIAL-DOCUMENTATION: R5.13; operator distinction.)

For a single new query with only valid past/current keys, use unmasked attention rather than an upper-left non-square causal triangle. For a cached chunk of q new rows after s old rows, row i permits keys through s+i; combine that relation with padding/document constraints. The inspected PyTorch lower-right bias uses diagonal offset `T_k-T_q`, while its ordinary non-square is_causal alignment is upper-left. The FlashAttention README documents its own API's lower-right convention. Equivalent argument names across APIs therefore need not imply equivalent masks. (OFFICIAL-DOCUMENTATION: R5.13; R5.15; R5.20.)

A preallocated cache writes new K/V into bounded slots and maintains an explicit per-sequence valid length. Repeated concatenation instead copies an increasing prefix; across G steps it adds O(G*S+G^2) element-copy work even though the logical append is constant-sized. Ragged batches require individual lengths or an equivalent packed/paged index representation; reading unused slots as valid keys changes the model. Position IDs must track consumed absolute positions, and cache invalidation must cover any changed parameter or conditioning input.

Autograd-free inference releases transient layer tensors after their last use, but weights, cache, current activations, logits, and workspace can coexist. The cache is the reference's sequence-growing persistent state, not the only live allocation. The single-device account excludes communication; tensor-parallel and serving engines add their own collective, scheduling, and allocator boundaries. No particular backend is claimed to satisfy the numerical equivalence proposal until checked.

```figure
id: fig-5.26
kind: matrix
title: Bottom-right causal alignment for a chunk against a cache
caption: >-
  The figure uses one-based display labels: three queries at positions 6-8
  follow five valid cached keys (zero-based query indices 5-7). Lower-right
  causal alignment admits 21 of 24 pairs. PyTorch SDPA's non-square is_causal
  uses upper-left alignment, so this cached chunk requires an explicitly
  correct mask/bias. The one-row case needs no causal exclusion only when
  all cached keys are valid; padding and other restrictions still apply.
placement: rail
anchor: implementation
evidence: OFFICIAL-DOCUMENTATION
source: [R5.13, R5.20, "DERIVED:eq-5.20"]
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

## Experimental design

### Reported experiments

R5.6 section 3 evaluates multi-query decoding against the source's multi-head baseline in its translation setup, with separate quality and execution results. The altered K/V projection and cache shape address incremental decoding's memory movement. This is a source-specific architecture comparison, not a measured performance result for the equal-head reference here. (PAPER-REPORTED: R5.6 sections 2-3.)

P19's training and runtime studies compare an exact IO-aware execution in documented configurations. They support a distinction between the attention function and how its backward state is saved or reconstructed; they do not establish the exact training multiplier of every framework. The chapter's full-versus-cached comparison remains an unexecuted numerical proposal in [verification.md](verification.md). (PAPER-REPORTED: P19 sections 3-4; UNVERIFIED: reference execution.)

## Observations

**What the paper claims.** R5.6 motivates shared K/V through incremental decoding's memory movement and reports a source-specific comparison. P19 changes exact attention execution and backward state. PyTorch/FlashAttention documents masking and dropout semantics for their respective interfaces. (PAPER-REPORTED; OFFICIAL-DOCUMENTATION.)

**What the evidence shows.** Real-arithmetic full/incremental equivalence follows from causal, row-local operations and unchanged cache premises. A generation loop returning its final sample has not yet cached that sample. Head-row selection also changes prefill arithmetic. (MATHEMATICALLY-DERIVED.)

**What we infer.** Correctness and cost accounting must track consumed tokens, sampled tokens, valid cache length, position IDs, visibility, and requested head rows separately. A phase name alone is insufficient. (MATHEMATICALLY-DERIVED.)

**What remains unknown.** No executed tolerance, selected kernel, peak memory, latency, or task score is available for this reference. Real cache traffic and weight reuse depend on the runtime. (UNVERIFIED.)

## Failure modes

An unshifted target teaches current-token reconstruction rather than next-token prediction. Audit input/target IDs and masks at a few boundaries before interpreting loss. A loss-masked context row can still receive attention gradients; testing for globally zero gradients at every masked position would reject correct behavior.

A cache may be off by one, contain stale rows after a parameter/context change, or use incorrect position IDs. Compare position-resolved intermediate K/V and logits against a full pass over the same consumed prefix. Sampling can amplify a small logit difference into a different discrete continuation, so logit equivalence should be checked before comparing sampled strings.

A non-square upper-left causal mask can hide most cached prefix keys, while unused padded slots can expose invalid state. Inspect absolute allowed index pairs and valid lengths directly. Training-mode dropout or a nonzero functional dropout_p can defeat deterministic comparisons. Finally, returning a cache length S+G when only S+G-1 tokens were consumed misstates capacity and the next write slot. These are analytical failure mechanisms and proposed checks.

## Siblings

Full-prefix recomputation is a semantic reference when it evaluates the same conditioning prefix and numerical policy. Cached decoding preserves that function only under the invariant proved above. Chunked prefill processes several new query rows against a stored prefix and needs an offset causal mask, rather than the square prefill triangle.

Shared-key attention, paged allocation, continuous batching, prefix reuse, and speculative execution change different parts of the state or scheduling contract. Their detailed methods belong to Chapters 14,37,42-44. A serving optimization does not by itself change the next-token training objective, and a speculative decoder needs an explicit acceptance procedure to justify its output distribution.

## Extensions

### Improvements

Cache preallocation removes repeated prefix copies from an append implementation. Paged allocation can reduce capacity waste for variable-length sequences while requiring an index mapping that preserves the same logical rows. Shared K/V reduces state per token by changing projection dimensions, whereas exact IO-aware kernels change how attention is executed. These mechanisms have different quality and equivalence questions and must be evaluated on their own axes. (MATHEMATICALLY-DERIVED; PAPER-REPORTED: R5.6; P19.)

A multi-token chunk or speculative proposal can reuse the same causal invariants, but it introduces several query rows, offset positions, and possible acceptance/rollback. The cache must retain precisely the accepted/consumed prefix after that procedure. The complete algorithm and its distributional conditions belong to37.5.

## Limitations

The proof excludes changing weights, stochastic operators, sequence-global statistics, and changing positional/visibility policies unless their effects are explicitly handled. It establishes equality in real arithmetic, rather than bitwise equality, a universal numerical tolerance, or equality of sampled continuations. Leading costs omit elementwise operations, optimizer work, embedding gathers, and implementation overhead. Cache lifetime and allocation depend on a declared runtime representation.

## Reproducibility

Use the same consumed token stream, parameters, position mapping, conditioning, document mask, and precision policy for full and cached paths. Disable stochastic behavior explicitly and compare logits and intermediate cache rows before sampling. Record head-row selection and whether the final sampled token was consumed. Proposed numerical and performance checks remain in [verification.md](verification.md), with no model run claimed. Inspected API/source versions are in [references.md](references.md).

## References

P01 ? P19 ? R5.6 ? R5.8 ? R5.13 ? R5.15 ? R5.20 ? [references.md](references.md)
