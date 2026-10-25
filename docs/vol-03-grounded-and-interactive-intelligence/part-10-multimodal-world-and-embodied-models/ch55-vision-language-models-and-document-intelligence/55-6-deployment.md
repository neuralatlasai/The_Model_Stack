---
id: ms.section.55.6
entity_type: section
title: Deployment
volume: 3
part: 10
chapter: 55
section: 55.6
slug: 55-6-deployment
parent: ms.chapter.55
prev_sibling: ms.section.55.5
next_sibling: null
children: []
prerequisites: [ms.chapter.18, ms.chapter.31, ms.chapter.49, ms.chapter.50]
downstream: [ms.chapter.57, ms.chapter.63]
related: [ms.chapter.15, ms.chapter.42]
relations: []
axes: {lifecycle: [inference, evaluation], mechanism: [visual_representation, spatial_sampling], feedback_setting: [], modality: [image, text]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 55.6 - Deployment

## Scope

[DERIVED] The required result is accepted visual/document answers within a declared latency, memory and resource envelope. This section connects image preprocessing, token estimation, batching, cache validity and adaptive acquisition. Generic KV ownership, serving schedulers and service economics belong to Chapters 42, 44 and 48; the present analysis adds the visual evidence and processor boundaries. Acceptance is a constrained quality-cost frontier on a fixed workload, including failure and abstention, rather than a visual-token minimum.

## Why this exists

[DERIVED] A request can be short in text and expensive in pixels, tiles or retained feature maps. Token estimates can miss thumbnails and special tokens. Reusing an image embedding does not automatically validate decoder KV states, which may depend on earlier text and positions. Approximate cache reuse can carry a stale table digit into an otherwise similar screenshot. These are correctness boundaries as well as performance decisions; they must be visible to the admission and evidence checks.

## Intuition

[MATHEMATICALLY-DERIVED] If a cache entry replaces only one stage, its speedup is limited by the time spent outside that stage and by lookup/transfer overhead. For uncached time $T=T_o+T_c$, reusable fraction $h$ of the cached stage and added overhead $T_h$,

$$
T'=T_o+(1-h)T_c+T_h,\qquad
\mathrm{speedup}=\frac{T_o+T_c}{T_o+(1-h)T_c+T_h}.
$$
*(Eq. 55.21)*

where all quantities refer to the same request boundary and $0\leq h\leq1$. Reuse helps only if $hT_c>T_h$. The formula is a conditional accounting model, not a latency prediction for a named runtime. It explains why longer inputs may cross an amortization point without implying that every short input benefits.

```figure
{
  "id": "fig-55.18",
  "kind": "diagram",
  "title": "Exact and approximate cache paths have separate obligations",
  "caption": "Cache access first validates source, processor, model, positions and authorization. Exact function-equivalent entries may be reused. Similarity-based entries require a separate quality policy and approximation provenance; failure falls back to fresh work if budget permits or terminates explicitly.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-55.24",
  "alt": "Cache access first validates source, processor, model, positions and authorization. Exact function-equivalent entries may be reused. Similarity-based entries require a separate quality policy and approximation provenance; failure falls back to fresh work if budget permits or terminates explicitly.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "req",
        "kind": "state",
        "label": "Validated visual request"
      },
      {
        "id": "key",
        "kind": "branch",
        "label": "Exact dependencies match?"
      },
      {
        "id": "exact",
        "kind": "memory",
        "label": "Exact reusable artifact"
      },
      {
        "id": "approx",
        "kind": "branch",
        "label": "Approximate policy admissible?"
      },
      {
        "id": "reuse",
        "kind": "process",
        "label": "Tagged approximate reuse"
      },
      {
        "id": "fresh",
        "kind": "process",
        "label": "Fresh computation or stop"
      },
      {
        "id": "check",
        "kind": "branch",
        "label": "Answer and evidence accepted?"
      },
      {
        "id": "pub",
        "kind": "state",
        "label": "Publish if deadline valid"
      }
    ],
    "edges": [
      {
        "from": "req",
        "to": "key"
      },
      {
        "from": "key",
        "to": "exact",
        "label": "yes"
      },
      {
        "from": "key",
        "to": "approx",
        "label": "no"
      },
      {
        "from": "approx",
        "to": "reuse",
        "label": "yes"
      },
      {
        "from": "approx",
        "to": "fresh",
        "label": "no"
      },
      {
        "from": "exact",
        "to": "check"
      },
      {
        "from": "reuse",
        "to": "check"
      },
      {
        "from": "fresh",
        "to": "check",
        "label": "fresh success"
      },
      {
        "from": "check",
        "to": "pub",
        "label": "passes"
      }
    ]
  }
}
```


## Formulation

[MATHEMATICALLY-DERIVED] Let request $i$ realize $n_{v,i}$ visual and $n_{t,i}$ text-prefix tokens after preprocessing. A conventional decoder KV payload contribution from visual positions is

$$
M_{v,i}=2L H_{kv}d_h b\,n_{v,i},\qquad
S_i=n_{v,i}+n_{t,i}+n_{\mathrm{special},i}.
$$
*(Eq. 55.22)*

where $L$ is decoder layers, $H_{kv}$ KV heads, $d_h$ head width and $b$ bytes/value. This excludes page embeddings, retained encoder features, allocator slack, temporary activations and replication/sharding metadata. Cross-attention architectures require their own state formula; the conventional self-attention prefix expression cannot simply be assigned to every VLM.

[MATHEMATICALLY-DERIVED] For separate sequences in a padded batch of size $B$, dense attention interaction can scale as $B S_{\max}^2$, while ideal separately packed interactions scale as $\sum_i S_i^2$. Thus a conditional padding amplification is

$$
A_{\mathrm{pad}}=\frac{B S_{\max}^2}{\sum_i S_i^2}\geq1.
$$
*(Eq. 55.23)*

where every $S_i>0$ and cross-request attention is prohibited. This counts attention interactions, not total FLOPs or actual elapsed time. Packed kernels, encoder bucketing and tensor-parallel synchronization have additional constraints. A workload with many high-resolution pages can defeat a text-token-only admission rule even when decoding batches appear small.

[DERIVED] A reusable artifact key identifies the input and every dependency of the cached function. For an encoder feature this includes image bytes or canonical pixels, decode/orientation/color policy, resize/crop plan, model/adapter weights, dtype and relevant execution semantics. Decoder KV can additionally depend on text preceding the image, attention mask, positions and previous states. A hash of the image alone is insufficient for ordinary causal-prefix equivalence. Tenant/access policy and retention scope are separate authorization conditions, not encoded correctness guarantees.

```figure
{
  "id": "fig-55.19",
  "kind": "calculator",
  "title": "Visual positions contribute decoder KV state",
  "caption": "Illustrative conventional self-attention-prefix payload 2 L Hkv Dh b Nv. Sharding, paging metadata, retained visual maps and encoder activations are excluded. This formula is not assigned to architectures with a different visual-state contract.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-55.22",
  "alt": "Illustrative conventional self-attention-prefix payload 2 L Hkv Dh b Nv. Sharding, paging metadata, retained visual maps and encoder activations are excluded. This formula is not assigned to architectures with a different visual-state contract.",
  "spec": {
    "tex": "M_v=2LH_{kv}d_hbn_v",
    "equation": "55.22",
    "inputs": [
      {
        "symbol": "L",
        "label": "Decoder layers",
        "default": 32,
        "min": 8,
        "max": 96,
        "format": "integer"
      },
      {
        "symbol": "Hkv",
        "label": "KV heads",
        "default": 8,
        "min": 1,
        "max": 64,
        "format": "integer"
      },
      {
        "symbol": "dh",
        "label": "Head width",
        "default": 128,
        "min": 32,
        "max": 256,
        "format": "integer"
      },
      {
        "symbol": "b",
        "label": "Bytes per KV value",
        "default": 2,
        "min": 0.5,
        "max": 4,
        "format": "fixed1"
      },
      {
        "symbol": "Nv",
        "label": "Visual positions",
        "default": 4096,
        "min": 128,
        "max": 32768,
        "format": "tokens"
      }
    ],
    "outputs": [
      {
        "symbol": "bytes",
        "label": "Visual-prefix KV payload",
        "formula": "2*L*Hkv*dh*b*Nv",
        "format": "bytes"
      }
    ]
  }
}
```


## Mechanism

### Methodology

[DERIVED] Preprocessing should be a versioned stage that emits both tensors and an audit record: decoded dimensions, orientation, raster/color conversion, crops/transforms, realized tile/grid shape and token count. Estimate before allocation, then reconcile against actual output. If the estimate is too small, reserve the extra capacity before admission or fail/replan explicitly. Silent image truncation changes the evidence regime and is not a valid resource-control implementation.

[DERIVED] Batch by the operations that actually share shapes or kernels: encoder crop dimensions, feature levels, decoder length and model revision. Separating encoder and decoder queues can reduce one source of padding while adding feature-buffer lifetimes and transfer. The capacity plan must include overlap: a new image can be encoding while prior requests retain features and KV state. OOM recovery must not publish outputs from partially overwritten state. A timeout ends logical publication; device buffers remain reserved until the asynchronous work is known to be quiescent, following Chapter 42's ownership contract.

[PAPER-REPORTED] VisMemo's approximate path first narrows cached images by geometry and regional similarity, then ranks corresponding patch embeddings. It uses early-layer attention for recomputation priority, paired low-variation/entropy conditions for reuse candidates, and masks remaining visual patches [R55.12, Sec. 3]. The reported configuration uses three warmup layers, recompute ratio 0.3 and reuse ratio 0.1. This changes information and computation; it is not exact cache equivalence.

[DERIVED] A uniform patch can still matter: its color can be the answer, and contextualized features may depend on surrounding content. Low entropy bounds neither semantic relevance nor the norm of its KV error. Even identical local pixels need not yield identical features when the encoder contextualizes them against a changed image. Warmup attention is a query-conditioned proxy, not an evidence certificate. Approximation therefore requires task-level selective error tests, especially single-cell edits, small glyph changes and changed units in similar documents.

[MATHEMATICALLY-DERIVED] If a downstream logit map $f$ were $K$-Lipschitz in a chosen norm over substituted states, then

$$
\|f(H+\Delta H)-f(H)\|\leq K\|\Delta H\|.
$$
*(Eq. 55.24)*

where both the norm and a valid bound on $K$ must be supplied. Pixel similarity or entropy supplies neither bound. A correct class decision would further need a margin exceeding the resulting perturbation of competing logits. This conditional derivation explains the missing proof obligation; it does not assert that the inspected cache system establishes it.

[DERIVED] Exact reuse should retain function identity, request ownership and immutable source provenance. Approximate reuse needs an explicit approximation tag, source entry, selected patch sets and quality policy, with a fresh-computation route. A cache hit cannot be treated as independent supporting evidence: it is a reused observation, possibly from a different image. Invalid geometry, changed weights, access revocation or incompatible positions invalidates the entry before decode, regardless of similarity score.

[DERIVED] Adaptive zoom is an acquisition policy over the original source, unlike sampling already retained features in Sec. 55.1. Let $a$ choose a crop, full re-read or stop. A development-time policy can minimize estimated selective error plus resource charge subject to caps:

$$
a^*\in\arg\min_{a\in\mathcal A_{\mathrm{admissible}}}
\bigl[\widehat R(a\mid s)+\lambda\widehat C(a\mid s)\bigr].
$$
*(Eq. 55.25)*

where $s$ is current evidence state, $\lambda$ expresses a declared tradeoff and the estimates are fitted without test labels. Stop/abstain remains an action. Cropping is useful only if the source contains additional relevant detail and the new observation survives the processor. Multiple views can be correlated; repeated agreement does not imply independent confirmation.

## Algorithm

### Algorithm 55.6 — Admitted visual request with bounded acquisition

[DERIVED] Inputs are an immutable request/source, model/processor digests, authorization scope, deadline, finite acquisition cap $J$ and reserved resource budget. Output is an accepted answer/evidence record, abstention or terminal failure.

$$
\begin{aligned}
1.&\quad \text{validate access, source and processor; estimate and reserve encoder, feature and KV resources}.\\
2.&\quad \text{for }j=0,\ldots,J:\ \text{check cancellation/deadline and remaining reservation}.\\
3.&\quad \text{process the declared view; reconcile actual shape/tokens before further allocation}.\\
4.&\quad \text{validate any exact cache dependency; admit approximate reuse only under its separate quality policy}.\\
5.&\quad (y,e,s')\leftarrow\operatorname{DecodeAndCheck}(s);\quad\text{retain source and approximation provenance}.\\
6.&\quad \text{if acceptance holds and publication remains admissible: commit }(y,e);\quad\text{return}.\\
7.&\quad \text{if no useful admissible acquisition remains: abstain; otherwise reserve and acquire the next view}.\\
8.&\quad \text{on failure/exhaustion: return explicit status; reclaim buffers only after device-use completion}.
\end{aligned}
$$

[DERIVED] The invariant is that every live tensor has a known request/version and charged lifetime, and every accepted claim resolves to source evidence. Retrying or zooming consumes the original finite budget. Expiry cannot fall through to publication. Unknown asynchronous completion quarantines resources; logical termination is distinct from physical reclamation. The loop establishes a cap on acquisitions, not a guarantee that its final answer meets quality.

## Implementation

[MATHEMATICALLY-DERIVED] An approximate reuse path adds lookup, current-image encoding, warmup, selection/mask construction, partial KV transfer and remaining-layer execution. GPU, pinned host memory and SSD traffic require separate accounting. Sparse patch reads can reduce transferred bytes while increasing small-I/O overhead; overlapping I/O hides only the portion that completes before use. A small observed wait is not the full transfer time. Complete service cost includes queueing, output generation, checks, retries and cleanup, in addition to prefill.

[PAPER-REPORTED] VisMemo's implementation account uses SGLang with FlashInfer, CUDA 12.8 and PyTorch 2.9.1; complete SGLang/FlashInfer revisions and inference precision are NOT-DISCLOSED in the inspected setup [R55.12, Sec. 4.1]. Its unified memory path and patch-first layout address copies and partial reads. The book did not execute that system, so present-day backend compatibility and production isolation remain UNVERIFIED.

```figure
{
  "id": "fig-55.20",
  "kind": "compare",
  "title": "The complete visual request owns more than prefill",
  "caption": "Compare cache-path work under the same complete service boundary. Prefill savings can be offset by lookup, warmup, transfer, acquisition or changed generation. Timed waiting is only the unhidden portion of asynchronous work.",
  "placement": "inline",
  "anchor": "implementation",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-55.21",
  "alt": "Compare cache-path work under the same complete service boundary. Prefill savings can be offset by lookup, warmup, transfer, acquisition or changed generation. Timed waiting is only the unhidden portion of asynchronous work.",
  "spec": {
    "axis": "Resource/lifetime terms that remain in a visual service comparison",
    "columns": [
      {
        "id": "fresh",
        "label": "Fresh computation"
      },
      {
        "id": "exact",
        "label": "Exact reuse"
      },
      {
        "id": "approx",
        "label": "Approximate reuse"
      }
    ],
    "rows": [
      {
        "dimension": "Image-side work",
        "values": {
          "fresh": "Decode, process, encode",
          "exact": "Validate dependencies; restore reusable stage",
          "approx": "Current encode plus similarity lookup"
        }
      },
      {
        "dimension": "Decoder-side work",
        "values": {
          "fresh": "Full admitted prefill and generation",
          "exact": "Restore equivalent state then remaining decode",
          "approx": "Warmup, selection, sparse I/O and remaining layers"
        }
      },
      {
        "dimension": "Correctness boundary",
        "values": {
          "fresh": "Current source plus model/evaluator errors",
          "exact": "Function identity and ownership",
          "approx": "Separate evidence risk plus approximation provenance"
        }
      },
      {
        "dimension": "Always charged",
        "values": {
          "fresh": "Queue, checks, output, failures, cleanup",
          "exact": "Queue, checks, output, failures, cleanup",
          "approx": "Queue, checks, output, failures, cleanup"
        }
      }
    ]
  }
}
```


## Experimental design

### Reported experiments

[PAPER-REPORTED] VisMemo preserves request order in its conversational workload and compares output quality and prefill behavior across exact/approximate-hit subsets [R55.12, Sec. 4]. Source-reported latency examples are below; the boundary is average prefill, not complete request latency. Subset composition changes with cache classification, so an approximate-hit score is not automatically a fixed-request comparison. A fresh-computation quality comparator is needed to establish loss relative to recomputation, rather than only gains over other approximate methods.

| Model | Input tokens | Miss / approximate prefill | Hardware | Precision | Input/output distribution | Concurrency | Runtime | Measurement boundary |
|---|---:|---:|---|---|---|---|---|---|
| GLM-4.6V-Flash | 2K | 48.2 / 53.7 ms | 2 H100 80GB, TP=2 | NOT-DISCLOSED | VisionArena ordered requests; output-length distribution NOT-DISCLOSED | NOT-DISCLOSED | Ubuntu24.04; CUDA12.8; PyTorch2.9.1; SGLang/FlashInfer revisions NOT-DISCLOSED | Source average prefill; includes approximate-path work; no complete queue-to-answer claim |
| Qwen3-VL-32B | 8K | 323.0 / 166.9 ms | 2 H100 80GB, TP=2 | NOT-DISCLOSED | Same source workload/limitations | NOT-DISCLOSED | Same disclosed stack | Same source average-prefill boundary |

## Observations

**What the paper claims.** [PAPER-REPORTED] The source reports improved approximate reuse quality and longer-input prefill savings [R55.12, Secs. 4.2-4.3]. Its own 2K GLM example is slower than a miss, as the table shows.

**What the evidence shows.** [DERIVED] The examples support model/input-dependent amortization. They do not establish lower end-to-end tail latency, lower energy, exact outputs or positive gains under another workload's cache locality. The paper's abstract and body also give different trace hit-rate summaries; use the precisely located experiment rather than merging them into one number.

**What we infer.** [DERIVED] More cache hits can enlarge stale-evidence exposure. The operating criterion must combine accepted answer/evidence risk, complete service cost and resource occupancy. Exact and approximate policies need separate rollback and observability.

**What remains unknown.** [UNVERIFIED] Fresh-compute item-level quality loss, tenant isolation, failure recovery, complete serving revisions, concurrency-sensitive tails and measured energy remain unresolved by this chapter's inspected evidence. No model-serving benchmark was executed here.

## Failure modes

> **Failure mode - Similar image, changed answer.** [DERIVED] *Symptom:* a cached screenshot yields the previous table value after one cell changes. *Cause:* visual similarity is mistaken for equality of answer-relevant states. *Detection:* paired single-cell/unit edits with fresh-compute reference outputs. *Mitigation:* invalidate exact reuse, recompute affected evidence or abstain under the approximation policy.

> **Failure mode - Underestimated visual occupancy.** [DERIVED] *Symptom:* encoder/prefill OOM or growing tail latency despite small text prompts. *Cause:* tiles, retained features or concurrent lifecycle overlap were omitted. *Detection:* reconcile estimated and realized resource traces per stage. *Mitigation:* reserve by complete visual shape and retain buffers until quiescent.

## Siblings

[DERIVED] Prefer exact reuse when equivalence and access conditions hold and transfer saves work. Admit approximate reuse only where held-out paired tests establish acceptable selective risk and complete latency/cost; a negative short-input amortization result reverses that choice. Prefer smaller views when their accepted error meets the target; acquire new pixels when the source contains missing evidence and the acquisition fits the budget. A fixed larger initial view is a necessary comparator for adaptive zoom. If both fail on oracle text, spend the next investigation on computation/evaluation rather than more image bandwidth.

## Extensions

### Improvements

[DERIVED] Processor-aware scheduling can jointly budget pixels, emitted tokens, retained features and expected generation. A useful measured improvement moves the accepted-quality frontier after complete acquisition/cache overhead, without hiding failures or shrinking coverage. Source-conditioned approximate caching and SCVER retrieve different objects: one substitutes historical KV; the other reads current-image features. Combining them introduces another validity boundary and needs an interaction ablation, not an assumed additive speedup.

## Limitations

[DERIVED] Analytical counts expose missing terms but cannot predict kernels, contention or tail behavior without measurement. A quality gate trained on one document genre can miss small but consequential edits in another. The bounded conclusion is a resource/evidence contract and reported amortization examples. Deployment preference remains conditional on the proposed workload evaluation and exact implementation checks.

## Reproducibility

[DERIVED] Save request order and arrival process, all source/processor/model hashes, crop actions, estimated and actual shapes, cache keys and hit type, reused/recomputed/masked sets, residency/transfers, timestamps and publication/cleanup state. Report precision, parallelism, software commits, input/output lengths, concurrency and failure policy with every performance claim. Proposed acceptance and cache-counterexample studies are in [verification](verification.md).

## References

[R55.12](references.md#r55-12), Secs. 3-4, Table 1 and Figures 12-18. State accounting and safe reclamation: Chapter 42; serving control: Chapter 44; full lifecycle measurement: Chapter 48. The navigation table in the chapter overview resolves those canonical links.
