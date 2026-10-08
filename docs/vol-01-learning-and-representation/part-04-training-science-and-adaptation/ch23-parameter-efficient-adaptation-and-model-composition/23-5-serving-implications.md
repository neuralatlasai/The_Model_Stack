---
id: ms.section.23.5
entity_type: section
title: Serving implications
volume: 1
part: 4
chapter: 23
section: 23.5
slug: 23-5-serving-implications
parent: ms.chapter.23
prev_sibling: ms.section.23.4
next_sibling: ms.section.23.6
children: []
prerequisites: [ms.section.23.2, ms.section.23.3, ms.section.23.4, ms.chapter.14]
downstream: [ms.chapter.42, ms.chapter.44, ms.chapter.47]
related: [ms.chapter.46]
siblings_by_mechanism: [ms.section.23.4]
relations: [{type: supported_by, target: paper.P14}, {type: implemented_by, target: impl.vllm}, {type: implemented_by, target: impl.hugging-face-peft}]
axes: {lifecycle: [inference, serving], mechanism: [multi_adapter_serving], feedback_setting: [], modality: [text]}
papers: [P14, P15]
implementations: [impl.hugging-face-peft, impl.vllm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 23.5 Serving implications

## Scope

**MATHEMATICALLY-DERIVED.** A serving request must identify the function that produced its tokens, not merely a human-readable adapter name. This section compares merged copies, separate low-rank branches, heterogeneous adapter batches and token-conditional activation. Success requires compatible artifacts, bounded resident memory, version-stable execution and valid cache reuse. It derives costs and correctness conditions; measured engine performance, scheduling and service-level policies belong to Chapters 42–48.

## Why this exists

**MATHEMATICALLY-DERIVED.** Storing many small task artifacts solves only the disk-storage problem. A device still needs base weights, active task state, KV tensors and runtime workspace. Serving each task through a separate merged model duplicates the base; sharing one base requires adapter-aware operators and scheduling. Loading on demand adds transfer and admission delay. Grouping requests by adapter improves weight reuse but can increase waiting for rare adapters. The dominant constraint therefore moves from trainable parameters to concurrent state and useful device work.

**PAPER-REPORTED.** Punica introduces segmented gather matrix-vector operations for mixed-LoRA batches; S-LoRA combines on-demand adapter handling, heterogeneous-rank kernels and unified paging of adapter/KV storage. Their evaluations demonstrate the importance of the adapter working set and workload distribution under their disclosed systems. Historical baseline support must not be mistaken for present engine capability. [R23.14] (§4–7); [R23.15] (§5–7)

## Intuition

**MATHEMATICALLY-DERIVED.** For requests using adapters $k_1,\ldots,k_B$, the dense base multiplication is shared as a batched operator. The correction depends on each request's adapter. Sorting token rows by adapter creates segments that reuse the same factor pair; it does not turn distinct updates into one matrix. Decode often exposes small segments, where launch, indexing and weight-fetch costs matter. Prefill supplies more rows per request, changing the balance. A lower algebraic FLOP count alone cannot predict either phase's latency.

## Formulation

**MATHEMATICALLY-DERIVED.** Let $K_r$ adapters be resident, $n_{a,k}$ their scalar counts, $b_{a,k}$ bytes per scalar and $M_b$ the shared base. At attention layer $\ell$, request $i$ retains $T_i$ positions with $H_{kv,\ell}$ KV heads, head width $d_{h,\ell}$ and $b_{kv,\ell}$ bytes per scalar. For an ordinary uncompressed KV layout,

$$
\begin{aligned}
M_{\mathrm{adapters}}&=\sum_{k=1}^{K_r}b_{a,k}n_{a,k},\\
M_{\mathrm{KV}}&=\sum_{i=1}^{B}\sum_{\ell=1}^{L}
2T_iH_{kv,\ell}d_{h,\ell}b_{kv,\ell},\\
M_{\mathrm{live}}&=M_b+M_{\mathrm{adapters}}+M_{\mathrm{KV}}
+M_{\mathrm{workspace}}+M_{\mathrm{reserve}},\\
M_{\mathrm{live}}&\le M_{\mathrm{device}},\qquad
t_{\mathrm{load},k}\ge M_{\mathrm{transfer},k}/B_{\mathrm{achieved}}.
\end{aligned}
$$
*(Eq. 23.22)*

**MATHEMATICALLY-DERIVED.** $M$ has units bytes and $B_{\mathrm{achieved}}$ bytes/second. Quantized/compressed KV layouts replace the KV term with their actual payload and metadata. Placement, parallelism, padding, page fragmentation, communication buffers and allocator reservation modify per-device capacity. The transfer bound excludes startup, deserialization and synchronization; it is not a measured activation latency.

```figure
id: fig-23.14
kind: calculator
title: Shared base, finite adapter working set
caption: Analytical capacity example with explicitly chosen inputs. The adapter limit leaves a KV and workspace allowance before division; it is not an admission policy or an observed engine capacity.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.22
alt: A 24 GiB device with a 14 GiB base, 6 GiB KV allowance, 2 GiB workspace and reserve, and 16 MiB per adapter has an analytical maximum of 128 resident adapters. Increasing KV to 8 GiB leaves zero adapter allowance.
spec:
  tex: K_r\le\left\lfloor(M_{\rm device}-M_b-M_{\rm KV}-M_{\rm other})/M_a\right\rfloor
  inputs:
    - {symbol: device, label: Device bytes, format: bytes, default: 25769803776, min: 17179869184, max: 85899345920, step: 1073741824}
    - {symbol: base, label: Shared base bytes, format: bytes, default: 15032385536, min: 1073741824, max: 25769803776, step: 1073741824}
    - {symbol: kv, label: KV allowance bytes, format: bytes, default: 6442450944, min: 0, max: 17179869184, step: 1073741824}
    - {symbol: other, label: Workspace and reserve bytes, format: bytes, default: 2147483648, min: 0, max: 8589934592, step: 1073741824}
    - {symbol: adapter, label: One adapter bytes, format: bytes, default: 16777216, min: 1048576, max: 268435456, step: 1048576}
  outputs:
    - {symbol: Kr, label: Resident adapter bound, formula: "max(0,floor((device-base-kv-other)/adapter))", format: integer}
```

**MATHEMATICALLY-DERIVED.** A request's immutable identity is $\iota=(h_b,h_a,h_q,h_{\mathrm{tok}},h_{\mathrm{template}},h_{\mathrm{runtime}},g)$: base, adapter, quantization, tokenizer, template, runtime configuration and activation-rule hashes. $h_a=\varnothing$ denotes base-only execution. A cache key also includes the exact token prefix and relevant positional/attention state. A mutable alias resolves to $\iota$ before admission; changing it must not change an already admitted request.

## Mechanism

### Methodology

**MATHEMATICALLY-DERIVED.** Merged inference computes $(W_0+\Delta W)X$ and removes the separate correction operator for that projection. It produces one fixed dense function. Serving $K_r$ such functions independently can require approximately $K_rM_b$ base payload rather than $M_b$, unless a separate sharing mechanism is specified. Unmerged inference retains $W_0X+s\mathsf B_k\mathsf A_kX$ and enables substitution. Its task-state storage grows with the resident working set. The equations are equivalent in exact arithmetic under 23.2's conditions, while kernel rounding and quantized exports require parity evaluation.

**MATHEMATICALLY-DERIVED.** Let $X_k$ contain $n_k$ token columns for adapter $k$, so $\sum_kn_k=n_t$. One projection's heterogeneous correction work is

$$
\begin{aligned}
Y_k&=W_0X_k+s_k\mathsf B_k(\mathsf A_kX_k),\\
F_{\mathrm{branch}}&\simeq
2\sum_k n_kr_k(d_i+d_o),\\
\mathcal C_k&=(\mathsf A_k,\mathsf B_k,s_k,\mathcal J_k,\iota_k).
\end{aligned}
$$
*(Eq. 23.23)*

**MATHEMATICALLY-DERIVED.** $\mathcal C_k$ binds factors, scale and target layout to their identity. Different ranks or target sets require correctly masked/grouped operations; padding to a common kernel width consumes padded work and storage. Reordering token columns must be inverted before attention/output association. Mixing factors from different adapters can yield finite, fluent outputs, making identity checks essential.

```figure
id: fig-23.15
kind: diagram
title: Adapter identity travels with the request
caption: One shared base can serve several task corrections, but each request pins an immutable adapter version and compatible cache lineage through completion.
placement: inline
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ['DERIVED:eq-23.22', 'DERIVED:eq-23.23']
alt: A request resolves a version, checks compatibility, then pins resident adapter and cache identity. Tokens use a shared base plus an adapter-specific correction before ordered outputs are restored. Completion releases the pinned resources.
spec:
  direction: TB
  nodes:
    - {id: req, label: Request and immutable version, kind: dependency}
    - {id: check, label: Compatibility and capacity gate, kind: process}
    - {id: pin, label: Pin adapter and cache lineage, kind: state}
    - {id: base, label: Shared base multiplication, kind: process}
    - {id: branch, label: Segmented task correction, kind: process}
    - {id: restore, label: Restore request token order, kind: process}
    - {id: out, label: Output and resource release, kind: boundary}
  edges:
    - {from: req, to: check}
    - {from: check, to: pin}
    - {from: pin, to: base}
    - {from: pin, to: branch}
    - {from: base, to: restore}
    - {from: branch, to: restore}
    - {from: restore, to: out}
```

**MATHEMATICALLY-DERIVED.** Residency and batching are coupled. Eviction may choose among unpinned adapters but cannot reclaim an adapter referenced by a running kernel. A copy must complete before publishing residency; cancellation releases references after outstanding work finishes. Host-resident factors reduce the transfer path relative to disk retrieval only under the stated loading design, and consume host capacity. Repeated loading under a changing working set can make transfer the limiting resource even when individual files are small.

## Algorithm

### Algorithm 23.5 - Version-pinned adapter admission

**MATHEMATICALLY-DERIVED.** Inputs are request $q$, immutable registry $\mathcal R$, residency map $\mathcal H$, device budget, finite admission/execution deadlines $t_d,t_e$ and bounded cleanup deadline $t_c$. State includes pin counts $\nu_k$, copy events, capacity reservations and request identity $\iota$. Output is a completed request, typed rejection or quarantined failure. This is an explanatory correctness protocol, not one engine's scheduler.

$$
\begin{aligned}
1.\;&p\leftarrow0,\quad
\iota\leftarrow\mathsf{ResolveUntil}(q,\mathcal R,t_d),\quad
\neg\mathsf{Compatible}(\iota)\Rightarrow\operatorname{return}(\mathrm{reject}),\quad
e_\iota\leftarrow\bot;\\
2.\;&p=0\land t<t_d:\quad
\mathsf{VerifiedResident}(\iota,\mathcal H)\Rightarrow
\mathsf{Atomic}(\nu_\iota\leftarrow\nu_\iota+1,\ p\leftarrow1);\\
3.\;&p=0:\quad E\leftarrow\mathsf{ChooseUnpinned}(\mathcal H),\\
&\neg\mathsf{Fits}(\iota,E)\Rightarrow
(\mathsf{WaitUntilEventOrDeadline}(t_d),\
\operatorname{continue}_{\mathrm{admission}}),\quad
R\leftarrow\mathsf{ReserveLock}(\iota,E,t_d),\quad
R=\bot\Rightarrow\operatorname{continue}_{\mathrm{admission}};\\
4.\;&p=0:\quad\sigma_E\leftarrow\mathsf{EvictUntil}(E,t_d),\quad
\sigma_E=\mathrm{success}\Rightarrow\mathcal H\leftarrow\mathcal H\setminus E,\quad
\sigma_E\ne\mathrm{success}\Rightarrow\mathsf{RejectOrQuarantine}(R,t_c);\\
5.\;&p=0:\quad(\sigma_C,e_\iota)\leftarrow\mathsf{CopyVerifyUntil}(\iota,t_d),\\
&\sigma_C=\mathrm{success}\Rightarrow
\mathsf{Atomic}(\mathcal H\leftarrow\mathcal H\cup\{\iota\},\
\nu_\iota\leftarrow\nu_\iota+1,\ p\leftarrow1,\ \mathsf{Release}(R)),\\
&\sigma_C\ne\mathrm{success}\Rightarrow\mathsf{RejectOrQuarantine}(R,t_c);\\
6.\;&p=0\Rightarrow\operatorname{return}(\mathrm{deadline\ rejected}),\quad
c\leftarrow\mathsf{CompatibleCache}(q,\iota);\\
7.\;&(\sigma,y,d)\leftarrow\mathsf{ExecuteUntil}(q,\iota,c,t_e,t_c);\\
8.\;&d=\mathrm{quiescent}\Rightarrow\nu_\iota\leftarrow\nu_\iota-1,\quad
d\ne\mathrm{quiescent}\Rightarrow\mathsf{Quarantine}(\iota),\quad
\operatorname{return}(\sigma,y,\iota).
\end{aligned}
$$
*(Eq. 23.24)*

**MATHEMATICALLY-DERIVED.** Admission repeats steps 2–5 until $p=1$ or $t_d$; $t$ is the monotonic clock reread before each operation. The already-resident branch skips eviction/copy. Verified residency reads the completed hash/event and pins atomically. $\mathsf{ReserveLock}$ atomically revalidates current capacity and $\nu_k=0$ for every $k\in E$ before reserving; conflicts return $\bot$ and retry within the deadline. Reservations exclude $E$ from new pins until reconciliation. Partial eviction removes completed evictions from $\mathcal H$. $\mathsf{RejectOrQuarantine}$ returns a terminal failure: cleanup completes before release, or unfinished work is quarantined. Copy success requires verified completion. $\mathsf{ExecuteUntil}$ returns by its deadlines after completion/cancellation or quarantine. Only quiescent work releases a pin.

## Implementation

**OFFICIAL-DOCUMENTATION.** Reference-stack systems are PEFT, layer **MODEL DEFINITION / ADAPTATION**, and vLLM, layer **INFERENCE ENGINE**. Inspected vLLM documentation describes per-request LoRA selection and resident/concurrent controls including maximum adapter count and rank. Its mutable latest page is an API disclosure, not a locally verified runtime. PEFT supplies load/merge operations; neither page establishes parity for this book's hardware. [R23.5]; [R23.9]; [R23.19]

```figure
id: fig-23.16
kind: stat-panel
title: Cache reuse requires a function history
caption: Derived correctness conditions, not cache-hit measurements. Activated adapters add a time boundary; ordinary adapters generally affect the entire cached prefix.
placement: rail
anchor: implementation
evidence: MATHEMATICALLY-DERIVED
source: ['DERIVED:eq-23.25', 'DERIVED:eq-23.26']
alt: Cache reuse checks exact tokens and positions, identical prior active functions, compatible base quantization and runtime, and immutable versions. Disabling an adapter does not erase adapted KV history.
spec:
  header: CACHE VALIDITY PREDICATES
  rows:
    - {key: token state, value: Exact prefix and positions}
    - {key: function history, value: Same prior active operator}
    - {key: numerical identity, value: Compatible base and quantization}
    - {key: version identity, value: Immutable artifact references}
    - {key: disabling an adapter, value: Does not erase adapted KV history}
```

## Experimental design

### Reported experiments

**PAPER-REPORTED.** Punica evaluates Llama-2-sized workloads with rank-16 branches, ShareGPT-derived lengths and distinct/uniform/skewed popularity on disclosed A100 systems; random task weights support systems tests rather than quality claims. S-LoRA varies model/rank, arrival rate and popularity, including heterogeneous ranks and paging ablations. Compare within each paper's hardware, workload and historical baseline configuration. [R23.14] (§7); [R23.15] (§7, Table 1)

**PAPER-REPORTED.** aLoRA compares conventional/activated adaptation on seven selected instruction tasks across Llama-1B/3B/8B and Mistral-7B, using validation rank/rate grids. It excludes very small, overly open-ended and chance-level tasks; reported accuracy is variable without a consistent winner. Granite-based intrinsic tests include answerability, uncertainty and query rewriting. [R23.17] (§4, Appendix F–G)

**MATHEMATICALLY-DERIVED.** Failure to reject equal mean accuracy does not prove equivalence: an equivalence claim requires a prespecified margin and appropriately powered design. Task exclusions and small test sets bound the reported comparison.

**UNVERIFIED.** The proposed book comparison includes base-only, one merged adapter, one unmerged adapter and many-adapter workloads, with identical admitted tokens and quality-accepted artifacts. Report cold/warm requests, adapter cardinality, popularity, ranks, KV occupancy, prefill/decode lengths, arrivals, concurrency, runtime commit and cancellation behavior. Measure request latency including loading/queueing alongside device execution; moving work outside the timer can resemble an improvement.

## Observations

**What the paper claims.** **PAPER-REPORTED.** These systems exploit base sharing and structured task operations. The 2025 activated-adapter studies add selective cache reuse under a token-level activation rule. [R23.14]; [R23.15]; [R23.17]; [R23.18]

**What the evidence shows.** **UNVERIFIED.** Published results do not establish this chapter's engine behavior or current latency. No serving experiment has been run for this manuscript.

**What we infer.** **MATHEMATICALLY-DERIVED.** Eq. 23.22 makes KV occupancy and resident task state compete for capacity. Eq. 23.23 shows that heterogeneous batching preserves distinct branches.

**What remains unknown.** **NOT-DISCLOSED.** The deployment's artifact working set, acceptable cold-start delay and request-level error budget are unspecified here.

## Failure modes

**MATHEMATICALLY-DERIVED.** Observe incorrect-task outputs for identity mixups, latency spikes for residency thrashing, allocation failures for underestimated KV growth and persistent disagreement for changed quantization/layout. Stale caches can appear correct on common tokens while diverging later. Reproduce an incident using exact request identity, tokens and activation history; retaining only an alias discards necessary evidence. Reloading publishes a new immutable version and retains old pinned state until its last request completes.

## Siblings

**MATHEMATICALLY-DERIVED.** A merged model favors a fixed function and ordinary dense operators. Unmerged adapters favor shared-base modularity. Composition in 23.4 combines updates into one function; multi-adapter batching executes separate functions for separate requests. Continuous batching selects token work; adapter-aware kernels execute its corrections. These decisions require joint evaluation.

## Extensions

### Improvements

**PAPER-REPORTED.** Activated LoRA (aLoRA) trains a correction that begins at an invocation boundary. Before it, causal computation uses the base, enabling base-aligned prefix reuse. Training masks and invocation conventions matter; ordinary LoRA checkpoints do not acquire this property by toggling late. [R23.17] (§2, Eq. 6, Proposition 1); Appendix E–G

**MATHEMATICALLY-DERIVED.** For one causal sequence and activation position $t_a$,

$$
\begin{aligned}
W(t)&=W_0+\mathbf1[t\ge t_a]\Delta W,\\
t<t_a&\Rightarrow h_\ell^{a}(t)=h_\ell^0(t)
\Rightarrow(K_\ell^{a}(t),V_\ell^{a}(t))=(K_\ell^0(t),V_\ell^0(t)),\\
t\ge t_a&\Rightarrow\text{base-cache equality is no longer guaranteed}.
\end{aligned}
$$
*(Eq. 23.25)*

**MATHEMATICALLY-DERIVED.** Equality follows by induction over layers/positions when tokens, positions, attention rules, base numerics and earlier states agree, with stochastic layers disabled. An adapted token can influence later hidden states even if the correction is subsequently disabled:

$$
\begin{aligned}
c_t&=\mathsf{KV}(x_{\le t},W(1),\ldots,W(t)),\\
W(t+1)=W_0&\;\not\Rightarrow\;
c_t=\mathsf{KV}(x_{\le t},W_0,\ldots,W_0).
\end{aligned}
$$
*(Eq. 23.26)*

**MATHEMATICALLY-DERIVED.** Thus aLoRA is not generally mergeable into one time-independent matrix. Cross-adapter cache reuse is valid only over a prefix with common effective history. Copying or partitioning clean/adapted blocks must preserve that distinction.

**PAPER-REPORTED.** The follow-up modifies vLLM with base-aligned hashing and activation-aware execution. It tests Granite-8B, Llama-70B and Mistral-123B on H100 systems, with BF16, rank-8 conventional LoRA versus rank-32 aLoRA, varied contexts and synthetic task weights. The timed adapter-evaluation stage follows base generation; reported improvements are not whole-application quality results. Cross-adapter batching and realistic reasoning tasks remain future work. [R23.18] (§3–5, Appendix A–B)

## Limitations

**MATHEMATICALLY-DERIVED.** Base-aligned reuse needs causal activation and compatible numerical execution; it does not follow for bidirectional encoders, changed templates or arbitrary cache transformations. Random adapters characterize cost but cannot establish learned-task fidelity. Serving choices remain conditional on quality, workload and service constraints; no universally optimal merge/residency choice follows.

## Reproducibility

**UNVERIFIED.** Preserve base/quantization/adapter hashes, targets, ranks/scales, invocation tokenization, registry resolution, engine commit, cache keys, hardware, arrivals, lengths, residency events and timer boundaries. The mutable vLLM page is unpinned; no API was exercised locally. [Verification](verification.md) specifies the unexecuted experiment.

## References

- [P14](references.md#p14) — LoRA.
- [R23.5](references.md#r235) — PEFT LoRA.
- [R23.9](references.md#r239) — PEFT artifacts.
- [R23.14](references.md#r2314) — Punica.
- [R23.15](references.md#r2315) — S-LoRA.
- [R23.17](references.md#r2317) — Activated LoRA.
- [R23.18](references.md#r2318) — activated-adapter serving.
- [R23.19](references.md#r2319) — vLLM LoRA documentation.
