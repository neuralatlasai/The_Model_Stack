---
id: ms.section.42.4
entity_type: section
title: Cache reduction
volume: 2
part: 7
chapter: 42
section: 42.4
slug: 42-4-cache-reduction
parent: ms.chapter.42
prev_sibling: ms.section.42.3
next_sibling: ms.section.42.5
children: []
prerequisites: [ms.chapter.14, ms.chapter.17, ms.chapter.25, ms.chapter.37, ms.chapter.40]
downstream: [ms.chapter.43, ms.chapter.44, ms.chapter.48]
related: []
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P36}
  - {type: implemented_by, target: impl.vllm}
axes: {lifecycle: [inference, serving], mechanism: [resource_accounting, cache_representation], feedback_setting: [], modality: [text]}
papers: [P36]
implementations: [impl.vllm, impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 42.4 Cache reduction

## Scope

[DERIVED] The objective is to reduce resident state or its read/transfer cost while preserving a declared quality criterion. This section owns runtime retention, offload, recomputation and their interaction with cache quantization/compression. The baseline is exact full-history state at the model's native dtype. Architectural state parameterizations belong to Chapters 14–17; the quantization error formulation belongs to [§40.2](../ch40-quantization-from-numerical-model-to-deployable-artifact/40-2-quantization-targets.md). A smaller allocated cache is insufficient evidence of a successful intervention without its quality, latency and recovery consequences.

## Why this exists

[DERIVED] Paging recovers wasted physical allocation, but once pages are full it cannot reduce the values needed by full-history attention. A large admitted batch can then make state capacity or traffic dominant again. Different reductions attack different factors: quantization lowers bytes/value; token retention lowers attended positions; latent compression changes coordinate count; offload changes location; recomputation replaces storage with repeated work. These mechanisms have incompatible exactness and performance contracts. Treating them as one “cache optimization” prevents attribution.

[PAPER-REPORTED] KIVI studies low-bit state representation [R42.5]; StreamingLLM studies bounded retention for long streams [R42.7]; H2O studies online importance-based retention [R42.8]. Their shared memory motivation does not make their quality guarantees equivalent. Historical evidence remains useful, but none is a timeless assertion that a particular precision or token budget suffices for 2026 models.

## Intuition

[MATHEMATICALLY-DERIVED] Storage is the product of retained coordinates and bytes/coordinate, plus representation metadata. Runtime must either reconstruct missing coordinates, omit them from attention, or retrieve them from another tier. Exact retrieval and deterministic recomputation can preserve the conditional computation, subject to numerics and identity. Quantization and content eviction generally change it. The practical question is which added error or latency lies inside the acceptable task boundary.

[DERIVED] A retention policy optimized on current attention scores makes a prediction about future queries. A low-score token can become decisive after a later question. A quantization policy optimized on reconstruction error makes a different prediction about downstream sensitivity. Neither is certified by the number of bytes saved. The evaluation must exercise the future decoding trajectory, not only the first output distribution.

## Formulation

[MATHEMATICALLY-DERIVED] Let the full one-query attention weights be $a_t$, summing to one, and let $\mathcal R$ be retained positions. Define removed mass $\rho=\sum_{t\notin\mathcal R}a_t<1$. If the retained logits are unchanged, the renormalized retained output and full output satisfy

$$
o_{\mathcal R}=\frac{\sum_{t\in\mathcal R}a_tv_t}{1-\rho},\qquad
o=(1-\rho)o_{\mathcal R}+\rho o_{\rm removed},\qquad
\|o-o_{\mathcal R}\|\le2\rho V_{\max}.
$$
*(Eq. 42.9)*

| Symbol | Meaning / unit |
|---|---|
| $a_t,\mathcal R,\rho$ | attention weights, retained positions, removed attention mass |
| $v_t,V_{\max}$ | value vectors and norm bound |
| $Q_{\rm state},B_{\rm link},\chi$ | transfer bytes, bytes/s, uncovered transfer fraction |

where $\|v_t\|\le V_{\max}$ and $o_{\rm removed}$ is the normalized weighted mean over removed values when $\rho>0$. The bound follows from the triangle inequality and convexity. At $\rho=0$ the outputs agree; at $\rho=1$ the retained normalization is undefined. This local bound concerns one unchanged query and original logits. After earlier state has been approximated, future hidden states and logits can change, so it is not a sequence-level task-accuracy guarantee.

[MATHEMATICALLY-DERIVED] For an offloaded reusable prefix of $Q_{\rm state}$ bytes, define effective transfer rate $B_{\rm link}$, fixed transfer/setup time $t_{\rm setup}$, reconstruction time $t_{\rm recompute}$ and uncovered transfer fraction $0\le\chi\le1$. A simple recovery comparison is

$$
t_{\rm restore}\ge t_{\rm setup}+Q_{\rm state}/B_{\rm link},\qquad
t_{\rm uncovered}\simeq t_{\rm setup}+\chi Q_{\rm state}/B_{\rm link},\qquad
t_{\rm uncovered}<t_{\rm recompute}.
$$
*(Eq. 42.10)*

where time is seconds and bandwidth is bytes/s. The inequality is a conditional break-even criterion; $\chi$ requires a valid overlap schedule and measured resource contention. A hidden DMA transfer still consumes link and memory bandwidth.


```figure
{
  "id": "fig-42.12",
  "kind": "calculator",
  "title": "Restore versus recomputation",
  "caption": "Illustrative configuration, not benchmark evidence. This lower-bound comparison ignores contention and assumes no transfer overlap. Positive saved time favors restore under those assumptions.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.10",
  "alt": "The calculator divides state bytes by effective link bandwidth, adds setup time, and subtracts that restore time from a declared recomputation time.",
  "spec": {
    "tex": "t_{\\rm restore}=t_{\\rm setup}+Q/B_{\\rm link}",
    "equation": "42.10",
    "inputs": [
      {
        "symbol": "Q",
        "label": "State bytes",
        "default": 1073741824,
        "min": 1,
        "max": 68719476736,
        "format": "bytes"
      },
      {
        "symbol": "Bw",
        "label": "Effective link bytes per second",
        "default": 16000000000,
        "min": 1000000,
        "max": 1000000000000,
        "format": "raw"
      },
      {
        "symbol": "setup",
        "label": "Setup seconds",
        "default": 0.001,
        "min": 0,
        "max": 1,
        "format": "raw"
      },
      {
        "symbol": "recompute",
        "label": "Recompute seconds",
        "default": 0.2,
        "min": 0.0001,
        "max": 10,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "restore",
        "label": "Restore lower-bound seconds",
        "formula": "setup+Q/Bw",
        "format": "raw"
      },
      {
        "symbol": "saved",
        "label": "Recompute minus restore seconds",
        "formula": "recompute-setup-Q/Bw",
        "format": "raw"
      }
    ]
  },
  "anchor": "formulation"
}
```


## Mechanism

### Methodology

[DERIVED] Quantized state must be updated online. A newly computed key/value pair enters an append buffer, is assigned to a quantization group and eventually becomes a packed block with scales/zero points or codebook identity. The grouping axis determines when a group is complete. Tokenwise groups can be completed immediately within the new vector; channelwise groups spanning tokens require a buffer or a changing scale. Requantizing an old group on every append introduces extra traffic and changes previous codes. A residual full-precision tail avoids that behavior at the cost of extra persistent bytes.

[PAPER-REPORTED] KIVI uses per-channel key groups, per-token value groups and full-precision residual state; Appendix A's Algorithm 1 flushes completed key groups and moves old values out of the recent residual [R42.5, §3.3; Appendix A]. Its CUDA path fuses dequantization with tiled matrix multiplication and uses Triton language for group quantization. These details explain the online state transition; Chapter 40 owns the quantizer's numerical derivation.

[MATHEMATICALLY-DERIVED] If $c$ is native KV bytes/token, $r$ retained full-precision token-equivalents and $f=q/(8b)$ the ideal packed/native ratio, an analytical capacity estimate is
$M_{\rm quant}\simeq c[r+f(S-r)]+M_{\rm scales}+M_{\rm padding}$ for $S\ge r$. For $S<r$ the residual can consume the whole cache. The asymptotic saving approaches $f$, but the short-context saving does not. Keys and values may have different residual lengths and metadata, so production accounting applies the expression separately to each. Kernel scratch and decode quantization work remain additional.

[DERIVED] Numerical compression and coordinate compression should be distinguished. A low-rank runtime approximation stores factors or projected coordinates and reconstructs an approximate key/value action. Its objective, calibration population, rank choice and reconstruction location determine both error and cost. Reconstructing a full cache every decode step can save capacity while increasing HBM traffic; absorbing projection maps into query/output computation can avoid that expansion only under compatible positional and architectural algebra. This chapter does not assign undocumented latent shapes to named models. The canonical MLA derivation and its architecture/runtime boundary are in Chapter 14.

[PAPER-REPORTED] StreamingLLM retains a small initial sink region and a rolling recent window. Its RoPE treatment caches keys before the rotary transform and uses positions within the rolling cache; ALiBi uses contiguous cache-relative bias [R42.7, §3.2]. This is more specific than dropping old tokens from an unchanged full-attention implementation. The method's stable language modeling does not expand the content accessible outside retained state.

[DERIVED] The sink region protects a learned normalization pattern; it is not a lossless summary of discarded content. A windowed model trained with that restricted dependency graph has exact execution relative to its own architecture. Applying the same window after training a full-attention model is an approximation to a different computation. Retained keys at higher layers can still encode earlier context, so a rolling retained-cache method also differs from recomputing only the last window from raw tokens. These three conditionings must be separate baselines.

[PAPER-REPORTED] H2O maintains accumulated attention importance and a recent-token allowance, then evicts low-scoring eligible state under a fixed budget [R42.8, §§4.1–4.2; Algorithm 1; Appendix D.6]. Its theorem assumes a specific dynamic submodular/approximation setup; it is not a theorem that arbitrary language-model accuracy is preserved. The implementation overwrites evicted slots rather than moving all survivors.

[MATHEMATICALLY-DERIVED] A bounded explanatory heavy-hitter implementation stores one score per retained position, updates scores using the current attention weights, protects the recent region and scans eligible scores for the minimum. For a retained budget $k$ this adds $O(k)$ score work and $O(k)$ auxiliary scalars per scored head/layer; top-k heaps or different score sharing change that contract. Attention itself remains $O(kd_h)$ per query head, compared with $O(Sd_h)$ full history. Scoring that materializes large attention tensors can consume more temporary memory than an exact fused attention backend. Benefits must include this scoring path.

[OFFICIAL-DOCUMENTATION] vLLM's inspected offload guide describes completed prefix blocks copied to pinned CPU memory, optional secondary tiers staged through CPU, and promotion on demand. Its per-request load cap can force recomputation beyond aligned restored tokens [R42.9, "Overview"; "Per-request load control"]. This is prefix-cache tiering, not a promise that every active decode token can attend directly to arbitrary remote storage without restore.

[DERIVED] Exact offload requires durable block identity, dtype/layout identity, integrity checks and completion-aware ownership across source and destination. A failed transfer must fall back to recomputation from an intact token prefix or fail explicitly; partially restored state cannot be published as a hit. Recomputing from raw tokens requires the exact prefix and model state, while retrieving from an authenticated store requires the same conditioning identity as local reuse. A cache tier is a performance optimization; correctness must survive a miss.

[DERIVED] Recompute and offload trade different scarce resources. Recompute spends forward FLOPs and weight/KV reads; transfer spends link bandwidth, host capacity, DMA staging and synchronization. Offload can improve admission capacity while worsening TTFT. If a live full-history decode requires remote state every step, transfer volume can recur with each output token and become dominant. Prefix tiering can pay restoration once per reuse instead. Both add energy and money whose values are NOT-DISCLOSED without a measured deployment trace. None changes model parameter count unless the architecture itself is adapted.


```figure
{
  "id": "fig-42.13",
  "kind": "compare",
  "title": "What each reduction changes",
  "caption": "Different reductions exchange bytes, computation, traffic and approximation. A native architectural window is exact for that architecture; an imposed window changes a full-attention checkpoint.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.10",
  "alt": "Quantization changes stored values; retention removes positions; offload moves state; recomputation reconstructs it. Exactness and added cost differ.",
  "spec": {
    "axis": "State changes relative to a fixed full-attention checkpoint",
    "columns": [
      {
        "id": "q",
        "label": "Quantize"
      },
      {
        "id": "r",
        "label": "Retain subset"
      },
      {
        "id": "o",
        "label": "Offload"
      },
      {
        "id": "c",
        "label": "Recompute"
      }
    ],
    "rows": [
      {
        "dimension": "Changed object",
        "values": {
          "q": "Bytes and values",
          "r": "Attended positions",
          "o": "Location",
          "c": "Stored versus reconstructed"
        }
      },
      {
        "dimension": "Exactness",
        "values": {
          "q": "Approximate arithmetic",
          "r": "Approximate domain",
          "o": "Identity-preserving restore",
          "c": "Same prefix and parameters"
        }
      },
      {
        "dimension": "Added cost",
        "values": {
          "q": "Scales and dequantization",
          "r": "Scoring and relevance risk",
          "o": "Transfer and host capacity",
          "c": "Repeated forward work"
        }
      }
    ]
  }
}
```


## Algorithm

**Algorithm 42.4 — Bounded state recovery and reduction contract.** [DERIVED] Inputs are immutable conditioning identity, native state or exact token prefix, a declared representation/retention policy, memory cap and deadline. Output is committed usable state plus its policy manifest. This is a book reference procedure combining alternatives, not a claim that one source implements the entire sequence.

$$
\begin{aligned}
1.&\quad \kappa\leftarrow\operatorname{ConditioningIdentity};\quad
(\mathcal R,\mathrm{dtype},\mathrm{groups})\leftarrow\operatorname{DeclaredPolicy}.\\
2.&\quad \text{For each required block, prefer valid local state; otherwise inspect an authorized tier record with identity }\kappa.\\
3.&\quad \operatorname{TierHit}\land t_{\rm restore}<t_{\rm recompute}\Rightarrow
\operatorname{RestoreAndValidate};\quad\text{otherwise }\operatorname{RecomputePrefix}.\\
4.&\quad \operatorname{AppendNativeKV};\quad\operatorname{FlushCompleteQuantGroups};\quad
\operatorname{RetainOrEvictByPolicy}.\\
5.&\quad \text{Nonfinite scales, invalid layout, missing causal state or deadline}\Rightarrow
\operatorname{Rollback};\ \mathrm{RECOVERY\_FAILURE}.\\
6.&\quad \operatorname{Commit}(\mathcal K,\kappa,\mathcal R,\mathrm{dtype},\mathrm{groups});\quad
\operatorname{ReleaseProvisionalCopies}.
\end{aligned}
$$

[DERIVED] Invariants are no approximate policy mislabeled exact, no incomplete group published, no stale conditioning reused and a valid fallback for every declared exact miss. Finite prompt/block/output budgets bound the procedure. Cost is the chosen transfer/recompute path plus quantization and selection work; total peak includes provisional restored/native/packed copies during transition, not just the final cache.

## Implementation

[OFFICIAL-DOCUMENTATION] **vLLM — Inference engine** documents FP8 per-tensor and per-head scales, with backend/calibration constraints, and notes that its Flash Attention 3 FP8 path quantizes queries as well [R42.11, "Supported FP8 KV-Cache Quantization Schemes"; opening note]. Storage precision therefore need not describe the entire arithmetic path. The unpinned page does not certify support for an arbitrary model/device combination.

[PAPER-REPORTED] KIVI's implementation uses **Hugging Face Transformers — Model definition / adaptation**, **NVIDIA CUDA — Accelerator / driver / compiler**, and **Triton language — Kernels / numerics / collectives** [R42.5, §3.3]. These are reported implementation layers, not executed code verification. Scale dtype, packed strides and attention backend must accompany a runtime comparison.

## Experimental design

### Reported experiments

| Protocol | Source-disclosed design |
|---|---|
| KIVI [PAPER-REPORTED] | Llama/Llama-2, Falcon and Mistral; group size 32, residual 128; generation tasks CoQA, TruthfulQA, GSM8K and LongBench; maximum LongBench context 8192 for Mistral, 4096 otherwise [R42.5, §4.1] |
| StreamingLLM [PAPER-REPORTED] | Concatenated PG19 test books; dense, rolling-window and window-recomputation baselines; sink-count ablation and StreamEval; retained-window and long-range limitations evaluated separately [R42.7, §§4.1–4.4; Appendices C–D] |
| H2O [PAPER-REPORTED] | OPT/LLaMA/GPT-NeoX quality studies, recent-only baseline and heavy-hitter/recent budget ablations, plus system comparisons under disclosed memory budgets [R42.8, §5; Appendix A] |

[NOT-DISCLOSED] The inspected sources do not provide one common model/runtime/workload across these methods, nor enough common seeds and evaluator revisions to treat their task scores or speedups as a unified ranking.

## Observations

**What the paper claims.** [PAPER-REPORTED] Each work reports a useful resource/quality tradeoff for its distinct state policy [R42.5, §4.2; R42.7, §4; R42.8, §5].

**What the evidence shows.** [PAPER-REPORTED] KIVI's Table 3 exposes model dependence: Falcon's 2-bit result is less robust than its 4-bit counterpart. StreamingLLM's first-book PG19 ablation gives perplexity 5158.07 for 0+1024 retention and 5.40 for 4+1020; this supports the sink intervention on that test, not retention of arbitrary distant facts [R42.7, Table 1]. H2O's accumulated importance remains a heuristic for future task relevance despite its formal score-function analysis.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 42.9 explains why low removed attention mass can limit immediate output error, but gives no guarantee when later questions shift mass onto discarded facts. The residual-state expression explains why nominal bit width overstates short-context savings.

**What remains unknown.** [UNVERIFIED] Matched 2026-model quality, current kernel compatibility, cross-method tail latency and independent reproductions were not established here.


```figure
{
  "id": "fig-42.14",
  "kind": "stat-panel",
  "title": "Approximation and recovery boundaries",
  "caption": "A cache miss must recover from exact source state or fail explicitly. Approximate retention requires its own quality criterion.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.9",
  "alt": "The panel separates approximate numerical values, approximate retained domain and exact identity recovery, with transient duplicate buffers counted at peak.",
  "spec": {
    "header": "REDUCTION AUDIT",
    "rows": [
      {
        "key": "quantize",
        "value": "Values and scales"
      },
      {
        "key": "retain",
        "value": "Future-query risk"
      },
      {
        "key": "offload",
        "value": "Identity and integrity"
      },
      {
        "key": "peak",
        "value": "Include provisional copies"
      }
    ]
  },
  "anchor": "failure-modes"
}
```


## Failure modes

> **Failure mode — Memory saving becomes transfer thrashing.** [DERIVED] *Symptom:* GPU occupancy improves while repeated restoration stalls every token. *Cause:* the active working set exceeds the local tier and cannot be reused before eviction. *Detection:* correlate bytes restored, reuse distance and iteration stalls. *Mitigation:* cap admission, change placement or recompute under a measured break-even policy.

[DERIVED] Other failures include scale saturation, invalid zero-range groups, excessive residual allocation, a retained-budget policy losing a newly relevant fact, wrong rotary positions after window movement and recovery from incomplete offload. Detect these at state/logit level as well as final task level. An aggregate perplexity gain cannot rule out rare retrieval failures.

## Siblings

[DERIVED] [§42.3](42-3-cache-organization.md) preserves values and changes placement/sharing. [Chapter 40](../ch40-quantization-from-numerical-model-to-deployable-artifact/README.md) changes numerical representation. Chapters 14–17 change architectural state. Compare exactness relative to the checkpoint, capacity, per-step traffic, reconstruction/transfer work and quality under a common future-query distribution. These interventions can compose, but their individual benefits do not multiply automatically.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] vLLM's inspected 2026 surfaces document finer FP8 scale granularity and multi-tier prefix restoration controls [R42.11; R42.9]. These extend engineering control over error and transfer volume. They disclose capabilities and constraints, not an isolated benchmark proving that per-head scales or another tier always improves end-to-end performance.

## Limitations

[DERIVED] Local reconstruction or removed-mass error is only one layer of a recurrent generation process. A fixed memory budget imposes either finite accessible history, approximation, repeated computation or external traffic. The appropriate choice depends on future queries and delivery requirements. Stable streaming language modeling must not be relabeled unlimited-context retrieval.

> **Open question.** [UNVERIFIED] Which local state-compression error measures predict task failure along an autoregressive trajectory after future queries change relevance? *What evidence would settle it:* matched long-generation and delayed-query evaluations that relate layer/state errors to downstream failures, with full-history controls and independent tasks. This is a research question, separate from the missing execution of this edition.

## Reproducibility

[DERIVED] Preserve native/packed state shapes, group axes, residual thresholds, scale dtype, attention arithmetic dtype, protected positions, score updates, rotary-position convention, tier integrity/identity, transfer alignment and fallback events. Current docs are unpinned; source code was not executed. The verification protocol remains a proposal.

## References

[R42.5](references.md#r42-5), [R42.7](references.md#r42-7), [R42.8](references.md#r42-8), [R42.9](references.md#r42-9), [R42.11](references.md#r42-11).
