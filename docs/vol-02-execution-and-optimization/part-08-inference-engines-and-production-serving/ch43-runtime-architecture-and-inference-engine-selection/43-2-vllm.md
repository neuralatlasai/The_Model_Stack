---
id: ms.section.43.2
entity_type: section
title: vLLM
volume: 2
part: 8
chapter: 43
section: 43.2
slug: 43-2-vllm
parent: ms.chapter.43
prev_sibling: ms.section.43.1
next_sibling: ms.section.43.3
children: []
prerequisites: [ms.chapter.28, ms.chapter.40, ms.chapter.42, ms.section.43.1]
downstream: [ms.chapter.44, ms.chapter.46, ms.chapter.48]
related: [ms.section.43.3, ms.section.43.4]
relations: []
axes: {lifecycle: [inference, serving], mechanism: [runtime_architecture, paged_execution, compilation], feedback_setting: [], modality: [text]}
papers: [P36]
implementations: [impl.vllm, impl.pytorch, impl.hugging-face-transformers, impl.flashattention]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 43.2 — vLLM

## Scope

[DERIVED] This section follows vLLM's integration of paged state, request scheduling, prefix reuse, compiled model execution and backend selection. Chapter 42 owns allocation mathematics; Chapter 44 owns scheduling policies. The baseline is a synchronous model loop with independently allocated request state. Success requires correct position/cache mapping and a measured workload benefit under a pinned engine configuration.

## Why this exists

[PAPER-REPORTED] PagedAttention's originating study connects efficient state allocation to the ability to execute larger active batches [P36, §4–6]. Its system result depends on the engine integrating allocation, scheduling and a compatible attention kernel; changing only storage organization cannot make an ordinary contiguous-state kernel interpret page tables.

[DERIVED] Modern engine integration adds another constraint: heterogeneous token work must become a regular enough tensor/operator graph for efficient execution. Request boundaries, cached prefix lengths and pending decode positions differ, while the model runner needs compact inputs, valid masks and address mappings. The engine must translate between these representations without confusing a logical sequence position with a physical slot.

## Intuition

[DERIVED] The engine core determines what work is valid; the model runner determines how valid work becomes tensors. Compiled execution can accelerate repeated operator structure, but dynamic addresses and request membership remain runtime metadata. Prefix reuse can remove computation for a matching context, but the final token still needs the correct conditional output law. The safe abstraction is semantic equality under an explicit tolerance, not an assumption of bitwise equality across cache or batch configurations.

## Formulation

| Local symbol | Meaning |
|---|---|
| $n_a,n_d,n_t,n_p$ | API processes, data-parallel groups, tensor-parallel degree and pipeline degree |
| $n_w$ | Device-worker process count |
| $h_j,u_j,\chi$ | Prefix-block digest, current block tokens and semantic namespace |
| $\mathcal B_j,\mu_j$ | Scheduled tokens and runner metadata at iteration $j$ |
| $t_c,\Delta t,n_{\rm calls}$ | Compile/setup time, saved execution time/call and number of calls |
| $q_{\rm live},q_{\rm capture}$ | Actual and captured token-work sizes |

[DERIVED] For the documented process topology,

$$
n_w=n_dn_tn_p,\qquad
n_{\rm proc}=n_a+n_d+n_w+\mathbf1\{n_d>1\}.
$$
*(Eq. 43.5)*

where the optional coordinator and API count follow the inspected configuration, not a universal process count for every deployment backend [R43.1, “Process Count Summary”]. More accelerator processes do not automatically supply sufficient host cores.

## Mechanism

### Methodology

[OFFICIAL-DOCUMENTATION] vLLM V1's API processes preprocess and stream, engine cores schedule/manage state, and device workers run forward computation [R43.1, “V1 Process Architecture”]. The source/documentation surfaces are mutable. This description is first-party documented behavior, not an executed local process inventory.

[DERIVED] The core-to-runner boundary must provide token IDs, positions, per-request lengths, block/slot mappings, adapter identity and valid output positions. Concatenating tokens from several requests does not permit cross-request attention: its metadata must reconstruct each request's permitted context. When a request reuses a prefix, computed-position state must advance while uncompacted logical token positions remain correct. Decode output corresponds to selected terminal positions, not every token in a flattened prefill batch.

[OFFICIAL-DOCUMENTATION] The prefix-caching design uses chained block hashes containing parent digest, current tokens and extra identity such as adapter, modality and cache-isolation inputs; only full blocks are cached [R43.3, introduction, “Operations”]. Its documented block pool, reference counts and free queue join reuse to allocation. A cache hit must be protected from eviction before execution consumes it.

[DERIVED] The corresponding identity recurrence is

$$
h_j=\operatorname{Hash}(h_{j-1},u_j,\chi),\qquad h_0=\operatorname{Hash}(\chi).
$$
*(Eq. 43.6)*

where $\chi$ must distinguish contexts whose same token IDs produce different state. Parent chaining is necessary because a block's state depends on preceding tokens. Cryptographic collision resistance reduces accidental identity confusion; it does not prove that every omitted semantic field was irrelevant. Serialization stability is also distinct from digest strength.

[DERIVED] Consider a request with a shared prefix followed by an unmatched suffix. Reusing the prefix permits computation to start from its cached state, but attention for the suffix still reads that state. After new positions are computed, full blocks may become reusable and incomplete tails remain request-specific. Cancellation drops that request's references; it does not imply deletion of shared cache entries. A correct cache manager separates active references, reusable cached content and physically free capacity. Chapter 42 develops their storage accounting.

[OFFICIAL-DOCUMENTATION] vLLM's compile design describes default V1 compilation, configuration/code-dependent cache identity, symbolic token-work dimensions and attention wrapped as a custom operator. It splits computation around selected operators and supports captured execution [R43.2, “Compilation Cache,” “Computation Graph Processing”]. Compile guards and supported shape domains are part of correctness, not merely tuning switches.

[DERIVED] A compiled graph can keep weights/shapes static while supplying different token values, positions and page tables. If graph capture reserves a larger work size than needed, masks must suppress padded work. If a custom operation hides attention internals from the graph tracer, its interface becomes a correctness boundary: the compiler cannot validate an incorrectly updated cache table inside that operation.

$$
n_{\rm calls}\Delta t>t_c
$$
*(Eq. 43.7)*

[DERIVED] This is the simplest amortization condition for setup time, where execution savings $\Delta t>0$ are measured on the same workload and exclude changes in quality. Cold-start services or short-lived evaluation workers can fail this condition even when steady-state kernels are faster.

[DERIVED] Captured padding has a separate efficiency ratio:

$$
\eta_{\rm useful}=\frac{q_{\rm live}}{q_{\rm capture}},\qquad
0<q_{\rm live}\le q_{\rm capture}.
$$
*(Eq. 43.8)*

where the ratio counts scheduled token-work slots, not achieved FLOP utilization. Padding can waste different amounts of compute in different operators. Choosing many capture sizes reduces padding but increases setup time and graph/workspace memory.

[OFFICIAL-DOCUMENTATION] The attention backend page derives support tables from configuration validation and describes composite execution paths [R43.4, “Backend Selection Behavior”]. Model loading resolves configuration, revision and tokenizer through a separate integration path [R43.5]. Architecture support therefore requires matching model implementation, attention mask/layout, quantization and hardware, not just finding a matching model-family name.

[DERIVED] Hash construction requires work proportional to newly considered tokens and metadata; lookup is expected constant time per digest in a hash table, while collision handling and prefix scans add work. Runner metadata scales with scheduled tokens/requests and can require host/device copies. Compiled artifacts and capture pools add memory beyond weights/cache. Distributed model execution adds the collectives required by its placement, while replicated API processing adds CPU memory. Neither prefix reuse nor compilation changes parameter count. Saved prefill FLOPs can change TTFT; decode throughput, energy and cost require their own workload measurements.

```figure
id: fig-43.6
kind: diagram
title: vLLM engine-core to runner boundary
caption: Request-level state becomes flattened token work plus metadata; compiled operators still depend on correct positions and cache addresses.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-43.6
alt: API preprocessing feeds an engine core that combines scheduler state and cache identity. The runner receives token work and metadata, invokes selected kernels and returns outputs for state updates.
spec:
  direction: LR
  nodes:
    - {id: api, kind: process, label: input processing}
    - {id: core, kind: process, label: engine core}
    - {id: cache, kind: memory, label: prefix and active references}
    - {id: runner, kind: process, label: runner tensors and metadata}
    - {id: kernel, kind: process, label: compiled graph and kernels}
    - {id: output, kind: tensor, label: sampled or scored outputs}
  edges:
    - {from: api, to: core}
    - {from: cache, to: core, kind: dependency}
    - {from: core, to: runner}
    - {from: runner, to: kernel}
    - {from: kernel, to: output}
    - {from: output, to: core, kind: feedback}
```

## Algorithm

### Algorithm 43.2 — Prefix-aware execution contract

[DERIVED] This is an explanatory integration trace, not a source-code transcription. Inputs are validated requests, finite token budget and supported runner configuration. State is active requests, reusable prefix references and completed positions.

$$
\begin{aligned}
1.\;&\text{resolve source, tokenizer, adapters and }\chi;\quad\text{reject unsupported tuple}.\\
2.\;&\text{match full prefix blocks using Eq. 43.6; protect matched references}.\\
3.\;&(\mathcal B_j,\mu_j)\leftarrow
\operatorname{ScheduleAndReserve}(\text{active requests, available capacity}).\\
4.\;&\text{empty }\mathcal B_j\Rightarrow\text{wait for admissible work or terminal event}.\\
5.\;&z_j\leftarrow\operatorname{Runner}(\mathcal B_j,\mu_j,\text{selected backend}).\\
6.\;&\text{complete events}\Rightarrow
\operatorname{UpdatePositionsAndCommit}(z_j);
\quad\text{stale epoch}\Rightarrow\text{discard}.\\
7.\;&\text{publish newly reusable full blocks; release finished references}.\\
8.\;&\text{active work and limits allow}\Rightarrow\text{return to 2};
\quad\text{otherwise terminate}.
\end{aligned}
$$

[DERIVED] Protection must precede possible eviction; publication must follow valid computation; output mappings must preserve request identities. The finite per-request cap bounds generated work, while external arrivals require a separate service-lifetime boundary.

## Implementation

[OFFICIAL-DOCUMENTATION] vLLM is **Inference engine**, PyTorch **Model / autograd framework**, Hugging Face Transformers **Model definition / adaptation**, and FlashAttention **Kernels / numerics / collectives**. At commit a2fb4827324bf023075799ef3d70d347834b8137, EngineCore.step schedules work, invokes asynchronous model execution, waits for completion, processes queued aborts and updates scheduler outputs [R43.31, core.py:657–687]. Its batch-queue alternative is separately visible at lines698–791. Static inspection establishes those call boundaries, not runtime safety, compatibility or speed. Attention, MoE and quantized linear paths must be recorded separately.

[DERIVED] CPU sizing and serialization can limit small-model or high-parallelism deployments. More API servers can reduce frontend contention but add processes, IPC and duplicate preprocessing state. A larger graph capture pool can improve repeated shapes while reducing capacity available for requests. Those are resource trades to measure, not universal defaults.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The originating PagedAttention study uses OPT/LLaMA, A100 servers and synthesized ShareGPT/Alpaca lengths with Poisson arrivals. Its Orca comparisons are author-built variants, including an output-length oracle; the latency metric is mean E2E divided by output length [P36, §6.1]. This is a historical architecture study, not a benchmark of the inspected 2026 V1 implementation.

## Observations

**What the paper claims.** [PAPER-REPORTED] Improved memory use permits more simultaneously active requests [P36, §6].

**What the evidence shows.** [PAPER-REPORTED] Figure 13 reports average active batches of 30.42 versus 13.62 for vLLM versus the oracle Orca reconstruction on OPT-13B/ShareGPT at two requests/s. That isolates an allocation-related mechanism under the paper's A100 setup; it is not a current engine ordering.

**What we infer.** [DERIVED] A capacity benefit can become throughput only if extra admitted work is useful and executable. Graph capture and backend selection add correctness/resource constraints absent from a simple cache-byte estimate.

**What remains unknown.** [UNVERIFIED] No local V1 benchmark, exact dispatched kernel trace or full compatibility matrix was executed.

## Failure modes

> **Failure mode — Reused state with wrong identity.** [DERIVED] *Symptom:* cold and warm requests disagree materially. *Cause:* missing adapter, modality, position or namespace information. *Detection:* compare exact inputs and common-prefix outputs under cache toggles. *Mitigation:* complete identity and independent parity checks.

[DERIVED] Graph replay with stale metadata, unsupported compile assumptions and rank-inconsistent work order can fail despite valid model weights. The documentation's semantic cache-equivalence description must not be interpreted as a blanket bitwise guarantee across different arithmetic paths.

## Siblings

[DERIVED] On reuse representation, vLLM's documented block-hash integration differs from [SGLang's radix organization](43-3-sglang.md). On execution integration, [TensorRT-LLM](43-4-tensorrt-llm.md) exposes its own model engine and resource manager. All may combine similar kernels; sharing a kernel does not make their frontend, scheduler or artifact contracts identical.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] Current documentation adds composite attention routing and finer compilation configuration relative to the original PagedAttention study [R43.2; R43.4]. The change is modular execution under compatible cache/shape constraints. It increases supported combinations while requiring explicit selection and warm/cold evidence; the inspected pages supply no controlled causal benchmark for every combination.

## Limitations

[DERIVED] Hash identity does not validate floating-point equivalence, compilation success does not validate every dynamic shape, and a larger active batch does not establish better p95 service latency. Valid claims remain configuration/workload-specific.

## Reproducibility

[DERIVED] Record model/tokenizer revisions, exact inputs, cache namespace, prefix mode, compile configuration/cache identity, graph sizes, attention/linear/MoE backend, worker topology, sampling implementation and failures. Separate immutable pins from the unpinned documentation inspected here.

## References

[P36](references.md#p36), [R43.1](references.md#r43-1), [R43.2](references.md#r43-2), [R43.3](references.md#r43-3), [R43.4](references.md#r43-4), [R43.5](references.md#r43-5), [R43.31](references.md#r43-31).

```figure
{
  "id": "fig-43.7",
  "kind": "calculator",
  "title": "Compilation amortization",
  "caption": "Illustrative setup and same-workload time savings define a real break-even threshold. Strictly positive net savings require the next integer call count above that threshold; cold starts repay setup separately.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-43.7",
  "alt": "At the illustrative default, sixty seconds of setup and two milliseconds saved per call give a threshold of thirty thousand calls; strictly positive net savings begin at thirty thousand and one.",
  "states": [
    {
      "anchor": "formulation",
      "label": "Two milliseconds saved",
      "variables": {
        "saved": 0.002
      },
      "note": "Setup must be charged to the deployment horizon."
    },
    {
      "anchor": "mechanism",
      "label": "Half millisecond saved",
      "variables": {
        "saved": 0.0005
      },
      "note": "Fewer savings need many more calls."
    },
    {
      "anchor": "failure-modes",
      "label": "Repeated cold starts",
      "note": "Each discarded cache can repay setup."
    }
  ],
  "spec": {
    "tex": "n_{\\rm threshold}=t_c/\\Delta t,\\quad n_{\\rm positive}=\\lfloor t_c/\\Delta t\\rfloor+1",
    "equation": "43.7",
    "inputs": [
      {
        "symbol": "setup",
        "label": "setup seconds",
        "default": 60,
        "min": 1,
        "max": 600,
        "format": "seconds"
      },
      {
        "symbol": "saved",
        "label": "saved seconds per call",
        "default": 0.002,
        "min": 0.0001,
        "max": 0.02,
        "format": "seconds"
      }
    ],
    "outputs": [
      {
        "symbol": "threshold",
        "label": "Real break-even call threshold",
        "formula": "setup/saved",
        "format": "raw"
      },
      {
        "symbol": "calls",
        "label": "Minimum calls for positive net savings",
        "formula": "floor(setup/saved)+1",
        "format": "integer",
        "emphasis": true
      }
    ]
  }
}
```

```figure
id: fig-43.8
kind: stat-panel
title: vLLM configuration identity
caption: A feature flag must be joined to its model, kernel and shape constraints before it becomes evidence.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-43.6
alt: Preserve model revision, cache namespace, compile configuration, actual kernel path and process topology separately.
spec:
  header: EXECUTION IDENTITY
  rows:
    - {key: model, value: weights tokenizer template}
    - {key: reuse, value: semantic namespace}
    - {key: compiled, value: shapes guards cache}
    - {key: operators, value: actual backend paths}
```
