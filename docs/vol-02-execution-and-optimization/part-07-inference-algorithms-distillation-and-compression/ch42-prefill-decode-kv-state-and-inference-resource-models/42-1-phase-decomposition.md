---
id: ms.section.42.1
entity_type: section
title: Phase decomposition
volume: 2
part: 7
chapter: 42
section: 42.1
slug: 42-1-phase-decomposition
parent: ms.chapter.42
prev_sibling: null
next_sibling: ms.section.42.2
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

# 42.1 Phase decomposition

## Scope

[DERIVED] The question is which dependency and physical resource determine each segment of an autoregressive request. The baseline is a single undifferentiated "generation time"; success means an accounting that distinguishes input processing, state construction, first-token selection, subsequent token generation, and client delivery. The mathematical boundary is a causal decoder with an immutable model and declared decoding policy. Speculation is owned by Chapter 37; scheduling policies are developed in Chapter 44. Timing definitions remain those in the [shared notation](../../../front-matter/notation.md#2-8-latency-chapter-48-mathematically-derived-definitions).

## Why this exists

[PAPER-REPORTED] PagedAttention separates prompt processing from subsequent autoregressive steps because the prompt positions are available together, while each new output depends on the preceding generated token [P36, Section 2.2]. This dependency structure is more fundamental than the familiar assertion that prefill is compute bound and decode is bandwidth bound. Those resource classifications depend on batch, context, architecture, and execution path; the dependency distinction survives changes in hardware.

[DERIVED] A tokenizer bottleneck cannot be repaired by reducing attention FLOPs. A long admission delay cannot be inferred from kernel latency. A buffered stream can have fast generation and slow visible delivery. Conversely, a server can deliver its first content chunk before a speculative verification group has produced all of its eventual tokens. A resource model must therefore carry both a computational trace and a delivery trace. Combining them prematurely hides the intervention that can change the measured quantity.

## Intuition

[MATHEMATICALLY-DERIVED] For a prompt of length $S_p$, all input token identities are known. Causality restricts which preceding positions each query reads, but does not require sampling those positions sequentially. A matrix operation can compute many causal queries in one invocation. After the final prompt position has produced logits, the decoder selects $y_1$. To obtain $y_2$, it must process $y_1$, whose identity was unavailable before selection. Parallelism across requests amortizes weight reads; it does not remove this within-request dependency. This statement assumes ordinary autoregressive generation rather than the distribution-preserving speculative procedures in Chapter 37.

[DERIVED] "Prefill" consequently describes semantic work, not a required number of launches. The prompt can be processed as one matrix, several causal chunks, or sequential invocations on a particular accelerator. "First-token generation" includes a last-position output projection and selection; it is not automatically one extra full-model pass after prefill. This distinction prevents a systematic extra-step error in both compute and latency estimates.

## Formulation

[MATHEMATICALLY-DERIVED] Let $S_p$ be prompt tokens, $S_o\ge1$ emitted model tokens, $u$ an iteration index, $n_u$ the new token rows processed in that iteration, and $s_i(u)$ the total attended key positions, including the current processed token, of request $i$. Let $F_w(n_u)$ denote forward arithmetic for tokenwise learned linear maps, excluding pairwise attention. For a dense model whose counted maps contain $N_{\rm lin}$ parameters and use one multiply and add per weight application,

$$
F_w(n_u)\simeq 2N_{\rm lin}n_u,\qquad
F_{{\rm att},p}=2LH_qd_hS_p(S_p+1),\qquad
F_{{\rm att},d}(u)=4LH_qd_h\sum_{i=1}^{B}s_i(u).
$$
*(Eq. 42.1)*

| Symbol | Meaning / unit |
|---|---|
| $S_p,S_o,n_u,s_i$ | prompt/output/new/attended tokens, with $s_i$ including current processed key |
| $N_{\rm lin},L,H_q,d_h$ | counted linear parameters, layers, query heads, head dimension |
| $F_w,F_{{\rm att},p},F_{{\rm att},d}$ | forward arithmetic, FLOPs |

where $F$ is FLOPs, $N_{\rm lin}$ counts the actually applied linear weights, $L$ is layers, $H_q$ query heads, $d_h$ head dimension and $B$ active sequences. The first attention term counts two operations per multiply-accumulate in both $QK^\top$ and attention-times-$V$, and only admitted causal pairs. Softmax, normalization, positional transforms, and output processing are additional. Dense masked kernels can execute more than the admitted-pair count. GQA changes KV projection and storage; the query-side pair arithmetic still depends on $H_q$.

[DERIVED] The tokenwise term must state the output-head boundary. A prefill implementation that computes logits only for the final prompt position avoids an $S_p$-fold full-vocabulary projection. A scorer returning every prompt log probability cannot make that omission. Similarly, embedding lookup is not a dense multiply through the whole vocabulary. The approximation $2NS_p$ is useful only after these choices are reconciled with the counted $N$.

[MATHEMATICALLY-DERIVED] For nonoverlapping critical-path spans, the first visible content time can be decomposed as

$$
t_1-t_0=t_{\rm ingress}+t_{\rm tokenize}+t_{\rm wait}+t_{\rm prompt}+t_{\rm select,1}+t_{\rm publish,1}.
$$
*(Eq. 42.2)*

where each $t_{\rm *}$ is elapsed seconds on the same request path. This is an accounting identity under the stated partition, not a claim that CPU and GPU work never overlap. If spans overlap, construct their dependency graph and take the longest path; summing inclusive durations double counts overlap. Clock domains must be synchronized or joined by explicit send/receive events.


```figure
{
  "id": "fig-42.3",
  "kind": "calculator",
  "title": "Prompt and decode attention arithmetic",
  "caption": "Compare one prefill with a separately configured batched decode iteration. For the same full-retention trajectory, attended decode keys must be at least prompt length plus one; independent workloads need not share that length. Projection and softmax work are additional.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.1",
  "alt": "With 32 layers, 32 query heads, dimension 128, prompt 2048 and 8 decode rows attending 2049 keys, compare prompt attention arithmetic with one decode iteration.",
  "spec": {
    "tex": "F_p=2LH_qd_hS_p(S_p+1),\\quad F_d=4LH_qd_hBS",
    "equation": "42.1",
    "inputs": [
      {
        "symbol": "L",
        "label": "Layers",
        "default": 32,
        "min": 1,
        "max": 128,
        "format": "integer"
      },
      {
        "symbol": "H",
        "label": "Query heads",
        "default": 32,
        "min": 1,
        "max": 128,
        "format": "integer"
      },
      {
        "symbol": "dh",
        "label": "Head dimension",
        "default": 128,
        "min": 16,
        "max": 256,
        "format": "integer"
      },
      {
        "symbol": "Sp",
        "label": "Prompt tokens",
        "default": 2048,
        "min": 1,
        "max": 131072,
        "format": "tokens"
      },
      {
        "symbol": "B",
        "label": "Decode rows",
        "default": 8,
        "min": 1,
        "max": 256,
        "format": "integer"
      },
      {
        "symbol": "S",
        "label": "Independent decode attended keys",
        "default": 2049,
        "min": 1,
        "max": 131072,
        "format": "tokens"
      }
    ],
    "outputs": [
      {
        "symbol": "Fp",
        "label": "Prompt attention FLOPs",
        "formula": "2*L*H*dh*Sp*(Sp+1)",
        "format": "flops"
      },
      {
        "symbol": "Fd",
        "label": "One decode attention FLOPs",
        "formula": "4*L*H*dh*B*S",
        "format": "flops"
      }
    ]
  },
  "anchor": "formulation"
}
```


## Mechanism

### Methodology

[DERIVED] Input processing begins with bytes, normalization, template expansion, and tokenization. The model sees token identifiers and any separately encoded modality inputs, not the raw character count. Fix the tokenizer revision, special-token insertion, template, and truncation policy before predicting $S_p$. UTF-8 bytes, characters, and tokens are different workload dimensions. A tokenizer's CPU time and a model's GPU time need separate instruments; an empirical bytes-to-token conversion is a distributional estimate, not an identity.

[MATHEMATICALLY-DERIVED] Prompt processing constructs per-layer causal state and computes the last prompt position's conditional distribution. If no reusable prefix state exists, every required prefix position must participate. If $h$ prompt tokens already have valid state, the remaining $S_p-h$ queries still attend to the reused prefix, so subtracting the prefix's entire attention cost is incorrect. The admitted attention pairs become $h(S_p-h)+(S_p-h)(S_p-h+1)/2$ per query head. Prefix reuse eliminates old queries and their linear work; it does not eliminate reads of reused keys and values by new queries.

[DERIVED] Selection then transforms logits according to the declared decoding policy. Its result becomes an output token, but may not immediately become user-visible text. Incremental decoding can need more bytes to complete a character; a stop-string detector can retain a suffix that might complete a forbidden delivery boundary. Tool calls, reasoning channels, and content channels may expose different subsets of model tokens. Therefore the $S_o$ used for FLOPs must count generated model tokens, while the visible-delivery trace records precisely the observable stream. Provider-undisclosed internal tokens cannot be inferred from visible output and remain NOT-DISCLOSED.

[MATHEMATICALLY-DERIVED] With $S_o$ output tokens and the first selected from prefill logits, ordinary decode requires $S_o-1$ additional model steps. Immediately after selecting output token $j$, a minimal implementation has cache state through $S_p+j-1$ positions; the newest selected token enters state when it is processed to select the next one. Reserving capacity for that token is a separate allocator decision. This off-by-one distinction matters for short outputs and for audit logs that describe "generated" versus "computed" tokens.

[DERIVED] During decode, tokenwise activations shrink to roughly $B$ new rows, but attention reads a growing history. Weight arithmetic scales with new rows; KV traffic scales with context. Output projection, sampling, CPU scheduling, interprocess messages and stream serialization can dominate when the model is small or highly optimized. None is bounded away merely by a large hardware peak FLOP/s figure. Parameters are unchanged across phases; retained tokens and temporary activation liveness change. Energy and money require measured device/system power, duration and an explicitly allocated infrastructure boundary; neither is determined by Eq. 42.1.


```figure
{
  "id": "fig-42.4",
  "kind": "diagram",
  "title": "Causal execution and visible delivery",
  "caption": "Selection closes the prompt phase; only later selections require processing a previously generated token. Publication can lag either phase.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.1",
  "alt": "Request bytes pass through encoding, waiting, prompt computation, selection and publication. Selection feeds the next decode step, while publication reaches the client separately.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "b",
        "kind": "dataset",
        "label": "Request bytes"
      },
      {
        "id": "e",
        "kind": "process",
        "label": "Encode template and tokens"
      },
      {
        "id": "w",
        "kind": "state",
        "label": "Wait for admission"
      },
      {
        "id": "p",
        "kind": "process",
        "label": "Compute causal prompt"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "Select next token"
      },
      {
        "id": "d",
        "kind": "process",
        "label": "Process selected token"
      },
      {
        "id": "o",
        "kind": "flow",
        "label": "Publish permitted bytes"
      }
    ],
    "edges": [
      {
        "from": "b",
        "to": "e"
      },
      {
        "from": "e",
        "to": "w"
      },
      {
        "from": "w",
        "to": "p"
      },
      {
        "from": "p",
        "to": "s"
      },
      {
        "from": "s",
        "to": "d"
      },
      {
        "from": "d",
        "to": "s"
      },
      {
        "from": "s",
        "to": "o"
      }
    ]
  }
}
```


## Algorithm

**Algorithm 42.1 - Bounded request state machine.** [DERIVED] Inputs are immutable model/template/tokenizer identities, request bytes, finite context cap $S_{\max}$, output cap $S_{o,\max}$, deadline $t_{\max}$, positive integer chunk cap $q$ and a declared selection rule. State is $(z,h,j,\mathcal K,\mathcal E)$: phase, processed prefix length, selected output count, committed cache and delivery events. Output is a terminal status and ordered stream.

$$
\begin{aligned}
1.&\quad z\leftarrow\mathrm{INGRESS};\ (x,S_p)\leftarrow\operatorname{Encode}(\mathrm{bytes});\quad S_p>S_{\max}\Rightarrow\mathrm{REJECT}.\\
2.&\quad z\leftarrow\mathrm{WAIT};\ h\leftarrow\operatorname{ValidPrefix}(x);\ j\leftarrow0;\quad t>t_{\max}\Rightarrow\mathrm{TIMEOUT}.\\
3.&\quad z\leftarrow\mathrm{PREFILL};\quad h<S_p\Rightarrow(\mathcal K,h)\leftarrow\operatorname{CausalAdvance}(x,h,\min(h+q,S_p)).\\
4.&\quad h<S_p\Rightarrow\text{repeat line 3 within the deadline};\quad \ell\leftarrow\operatorname{FinalLogits}(\mathcal K,x).\\
5.&\quad \ell\text{ nonfinite}\Rightarrow\mathrm{NUMERICAL\_FAILURE};\quad y_{j+1}\leftarrow\operatorname{Select}(\ell);\ j\leftarrow j+1.\\
6.&\quad \mathcal E\leftarrow\operatorname{PublishAllowed}(\mathcal E,y_j);\quad \operatorname{Stop}(y_{1:j})\lor j=S_{o,\max}\Rightarrow\mathrm{COMPLETE}.\\
7.&\quad h+1>S_{\max}\Rightarrow\mathrm{CONTEXT\_LIMIT};\quad z\leftarrow\mathrm{DECODE};\ (\mathcal K,\ell,h)\leftarrow\operatorname{Advance}(\mathcal K,y_j);\quad\text{return to line 5.}
\end{aligned}
$$

[DERIVED] Invariants are causal prefix order, immutable conditioning, committed state only after successful execution, and publication only after stop/channel rules. If all prompt tokens are reused, final logits still need an appropriate retained hidden state or recomputation of the last token; KV alone does not store the final probability vector. The procedure bounds advances by $S_p+S_{o,\max}$ and time by the deadline, assuming each operator itself has a timeout. Cancellation releases references after in-flight accesses finish. Its arithmetic is Eq. 42.1 plus output-policy work; cache space is developed in Section 42.2.

## Implementation

[OFFICIAL-DOCUMENTATION] **vLLM - Inference engine** documents separate prefix-state reuse and execution, with only full reusable blocks in the inspected prefix design [R42.1, "Automatic Prefix Caching", "Operations"]. **PyTorch - Model / autograd framework** documents CUDA execution and memory behavior [R42.3, "Memory management"]. These are interface/documentation claims, not an executed compatibility test of a pinned runtime.

[DERIVED] At the operator boundary, represent prefill as ragged new rows plus sequence offsets and previous context lengths; represent decode as one new row per ordinary active sequence. A causal mask must include the prior chunk and prevent reading future rows. The runtime maps these tensors to the selected attention and GEMM backends, whose temporary memory and graph shape affect both phase cost and measured latency. A CUDA event measures device work inside its stream boundary; an HTTP timestamp measures a different boundary. Capturing only the former cannot establish client-visible TTFT. Record sampling placement and flush frequency as part of execution, not as cosmetic frontend options.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The 2026 phase-aware study [R42.10, Sections III-IV] uses Llama2-7B FP16, one A100-SXM-40GB with vLLM 0.12.0 and a 72-card GroqRack implementation. Random-token workloads set input and output lengths equal, from 100 to 1600; GPU batches range from 1 to 32, while the evaluated rack binary serves one request. Warmup avoids reused prefixes; tokenization/detokenization and semantic quality are excluded. Exact binary hashes and repeated-run uncertainty are not sufficiently disclosed for a book reproduction.

## Observations

**What the paper claims.** [PAPER-REPORTED] The study reports different phase and batching tradeoffs across the evaluated platforms [R42.10, Section V].

**What the evidence shows.** [PAPER-REPORTED] Its controlled kernel-oriented study supports those configurations, not a client-streaming or cost comparison. Algorithm 1 selects a first token before a decode loop of $L_{\rm out}$ iterations, while the surrounding workload describes $L_{\rm out}$ generated tokens; this creates an accounting ambiguity requiring artifact clarification [R42.10, Algorithm 1; Table II].

**What we infer.** [MATHEMATICALLY-DERIVED] A model that charges $S_o$ ordinary decode passes after first-token selection overcounts by one under this section's output convention. Equal prompt/output lengths cannot identify separate effects across the full two-dimensional workload space.

**What remains unknown.** [UNVERIFIED] The study's executable interpretation of that output counter and transfer to online arrivals, natural text and independently varied lengths remain unchecked here.


```figure
{
  "id": "fig-42.5",
  "kind": "stat-panel",
  "title": "Token and clock boundary",
  "caption": "A delivery event is not necessarily one model token. Preserve the distinction when interpreting client latency.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.2",
  "alt": "The panel separates processed prompt positions, selected model tokens, visible content bytes and device versus client clocks.",
  "spec": {
    "header": "PHASE BOUNDARIES",
    "rows": [
      {
        "key": "cache",
        "value": "Computed positions"
      },
      {
        "key": "output",
        "value": "Selected model tokens"
      },
      {
        "key": "stream",
        "value": "Visible permitted bytes"
      },
      {
        "key": "clock",
        "value": "Device or client; declare one"
      }
    ]
  },
  "anchor": "observations"
}
```


## Failure modes

> **Failure mode - Boundary substitution.** [DERIVED] *Symptom:* device timing improves while visible TTFT does not. *Cause:* queueing or publication dominates the omitted span. *Detection:* join client and engine events by request/token identity. *Mitigation:* optimize the measured critical path and preserve separate timing boundaries.

[DERIVED] Empty prompts require an explicit beginning-token policy. Stop tokens that never become visible still consume selection work. A transport disconnect does not imply the GPU has stopped, and a cancelled request must not retain live cache indefinitely. A dropped streaming chunk is an output-consistency failure even if the generated token sequence was correct.

## Siblings

[DERIVED] [Section 42.3](42-3-cache-organization.md) changes which already-computed state is reused; [Section 42.4](42-4-cache-reduction.md) changes its representation or retention. [Chapter 37](../ch37-decoding-constrained-generation-and-speculative-execution/README.md) changes token selection/verification. [Chapter 44](../../part-08-inference-engines-and-production-serving/ch44-scheduling-distributed-serving-and-disaggregation/README.md) changes when and where work executes. Their comparison axis is eliminated work versus changed critical-path placement, with the conditional model and delivery contract fixed.

## Extensions

### Improvements

[PAPER-REPORTED] Sarathi-Serve's 2024 refinement uses bounded prompt chunks and mixed iterations to control interference with running decodes [R42.6, Sections 4.1-4.3]. Its contribution is a scheduling/execution change, not a change in autoregressive probability factorization. Full scheduling reconstruction belongs to Chapter 44; Section 42.5 examines the resulting pipeline cost.

## Limitations

[DERIVED] The phase trace is exact only after its events and token counter are specified. The resource classification is conditional: large batches can raise decode arithmetic intensity, long contexts can make attention traffic dominant, and CPU/output work can dominate small-model requests. A semantic phase name is not a hardware theorem.

## Reproducibility

[DERIVED] Retain raw bytes, encoded tokens, template revision, special tokens, prompt-cache hit length, processed and selected token counters, stop policy, channel visibility, per-iteration composition and timestamp boundaries. The estimator must expose omitted spans. No book-authored inference measurements were executed; the proposed protocol is in [verification](verification.md).

[OFFICIAL-DOCUMENTATION] vLLM qualifies reproducibility by same hardware/version and documents scheduling or batch-invariance controls [R42.16, opening guidance]. A fixed random seed is therefore not a substitute for preserving the execution identity in a phase comparison.

## References

[P36](references.md#p36), [R42.1](references.md#r42-1), [R42.3](references.md#r42-3), [R42.6](references.md#r42-6), [R42.10](references.md#r42-10), [R42.16](references.md#r42-16).
