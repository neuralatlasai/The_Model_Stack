---
id: ms.section.43.3
entity_type: section
title: SGLang
volume: 2
part: 8
chapter: 43
section: 43.3
slug: 43-3-sglang
parent: ms.chapter.43
prev_sibling: ms.section.43.2
next_sibling: ms.section.43.4
children: []
prerequisites: [ms.chapter.26, ms.chapter.29, ms.chapter.37, ms.chapter.42, ms.section.43.1]
downstream: [ms.chapter.44, ms.chapter.46, ms.chapter.47]
related: []
relations: []
axes: {lifecycle: [inference, serving], mechanism: [runtime_architecture, prefix_reuse, structured_generation], feedback_setting: [], modality: [text]}
papers: [P37]
implementations: [impl.sglang, impl.pytorch, impl.flashattention]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 43.3 — SGLang

## Scope

[DERIVED] SGLang combines structured application execution with model-serving machinery. This section examines how program structure, prefix state, constraint state and distributed workers interact. The reference baseline independently executes each model call and recomputes its prompt. The target is reduced redundant work with an explicit semantic contract. Chapter 37 owns constrained-decoding theory; Chapter 42 owns cache-storage accounting.

## Why this exists

[DERIVED] Applications repeatedly extend, branch and revisit related contexts. Treating every call as an unrelated text string discards that structure. Conversely, recognizing a repeated prefix is insufficient if the runtime does not preserve ownership while branches execute, route to a worker possessing the state, or synchronize decoding constraints with accepted tokens. The central systems question is which application dependencies can become physical reuse without changing the intended conditional distribution.

[PAPER-REPORTED] The original SGLang paper combines a program interface with RadixAttention, compressed finite-state-machine execution and API-call optimization [P37, §§2–5]. These are historical mechanisms. The current server documentation describes additional execution paths; a feature in the paper is not proof of the current default.

## Intuition

[DERIVED] A program's branch point is a common prefix, not necessarily a shared mutable buffer. Branches can reference immutable completed state and allocate their own suffixes. The runtime should exploit that relation while keeping each branch's sampling state, grammar state and cancellation independent. A radix index records common token sequences; the actual attention state remains a physical resource with lifetimes and layout constraints. An index hit does not remove the need to read the matched state during suffix attention.

## Formulation

> **Definition — Prefix-reuse domain.** [DERIVED] The set of requests for which identical indexed tokens and execution identity imply compatible cached model state under a declared numerical equivalence criterion.

| Local symbol | Meaning |
|---|---|
| $\chi$ | Model, adapter, positional, modality and cache-format identity |
| $x_r$, $c_r$ | Request token sequence and compatible matched-prefix length |
| $F(l)$ | Reference cost of processing a prefix of length $l$ |
| $R(c,l)$ | Actual suffix-processing cost with a reusable prefix |
| $g_r$ | Grammar/constraint state of request $r$ |
| $H,G,D$ | Host preparation, device forward and decode-update stage durations |
| $n_s,\ell_{\max}$ | Number of graph segments and maximum request token limit |

[MATHEMATICALLY-DERIVED] Under the declared identity, matching requires equality of the *entire* indexed prefix:

$$
c_r=\max\{c:\ (x_{r,1:c},\chi) \text{ has compatible completed state}\}.
$$
*(Eq. 43.9)*

The counterexample to token-only matching is immediate: the same tokens under two adapters can produce different key/value state. Equality of a suffix without its ancestors is also insufficient in a causal model.

[MATHEMATICALLY-DERIVED] Reuse is beneficial for a request only when

$$
F(|x_r|)-R(c_r,|x_r|)>
t_{\rm lookup}+t_{\rm protect}+t_{\rm route}+t_{\rm transfer}.
$$
*(Eq. 43.10)*

This is a cost comparison, not a prediction of savings. $R$ includes suffix attention reading the prefix. For full attention it cannot generally be replaced by $F(|x_r|-c_r)$, because attention sees a longer history. State transfer and cache locality can reverse an otherwise attractive reuse decision.

## Mechanism

### Methodology

[PAPER-REPORTED] RadixAttention indexes token prefixes in a radix tree, references paged state, and evicts unreferenced leaves. Its cache-aware traversal has an offline hit-rate argument under specified assumptions and an online approximation [P37, §3; Appendix A]. The useful generalization is a separation between logical prefix identity and physical state ownership.

[DERIVED] A radix edge compresses a token run. Matching descends while tokens agree, and a partial match can split an edge. With direct token comparison, worst-case matching work is linear in the inspected prefix length; this is an index cost, not a statement about GPU attention complexity. An active request protects the matched path before capacity reclamation. A completed branch may leave reusable state after its active references disappear. Eviction must not reclaim state still referenced by device work, including work whose host-side request has been cancelled.

[OFFICIAL-DOCUMENTATION] The current session-aware cache uses soft session references with UnifiedRadixCache. Referenced state may still be reclaimed when necessary; a session identifier neither reconstructs nor automatically appends conversation history [R43.7, “Session-Aware Radix Cache”]. Clients must supply the intended full prompt. Session closure releases session ownership rather than promising immediate physical deletion.

[DERIVED] This distinction matters for recovery. A client that resends only a new user turn after a cache eviction can silently change the modeled conversation unless a separate durable history service restores it. Session affinity is therefore a performance hint and ownership relation; application history is semantic input. Eviction behavior and cancellation behavior should be tested independently.

[OFFICIAL-DOCUMENTATION] The inspected structured-output interface supports XGrammar, Outlines and llguidance, with XGrammar the documented default. JSON schema, regular expression and EBNF constraints are alternative request specifications [R43.6, “Structured Outputs”]. Constraint support must be checked for the actual backend and schema subset.

[DERIVED] At generation step $t$, the grammar state defines admissible token IDs $\mathcal A(g_t)$. Integrating it with sampling requires

$$
\widetilde p_t(v)=
\frac{p_t(v)\mathbf1[v\in\mathcal A(g_t)]}
{\sum_{u\in\mathcal A(g_t)}p_t(u)},\qquad
g_{t+1}=\delta(g_t,y_t).
$$
*(Eq. 43.11)*

[MATHEMATICALLY-DERIVED] The denominator must be positive; otherwise the request needs a declared failure branch. Constraint transitions must follow accepted model tokens, not merely proposed tokens or published text chunks. A tokenizer can map one token to several bytes, so character-level validation and token-level masking are different operations. Syntactic acceptance does not certify factual accuracy, tool authorization or schema-level semantic meaning. The historical paper's compressed-FSM path must not be assumed to implement the current grammar backend.

[OFFICIAL-DOCUMENTATION] Current deterministic-inference documentation explicitly discusses variation from batching/reduction paths and provides a backend-dependent support table [R43.8]. Its FlashInfer row excludes radix-cache support in the declared deterministic mode, whereas listed FA3/Triton paths differ. These are configuration-specific promises, not universal cross-engine reproducibility.

[DERIVED] Host planning can overlap a device forward only when planning does not require unavailable sampled results, or when it carries placeholders that are resolved before use. Let $H$, $G$ and $D$ denote three serialized stages in a simple pipeline. The optimistic steady-state initiation interval is at least $\max(H,G,D)$; dependencies may force a larger interval. Removing a host/device synchronization is valid only if the consumer still waits on the producing event. A missing event can yield stale sequence lengths rather than a visible crash.

[OFFICIAL-DOCUMENTATION] Breakable CUDA graphs divide selected execution into captured segments and eager regions [R43.10, “Breakable CUDA Graph”]. They provide a way to preserve dynamic or debug execution boundaries. They do not guarantee that every operation becomes captured or faster.

[MATHEMATICALLY-DERIVED] If segment $s$ saves launch time $a_s$ but adds boundary cost $b_s$, the modeled saving per invocation is

$$
\Delta t=\sum_{s=1}^{n_s}(a_s-b_s)-t_{\rm extra\ sync}.
$$
*(Eq. 43.12)*

Positive savings require the whole expression to be positive. More segments can improve eligibility while diminishing launch savings. Captured workspaces also compete with request state for device capacity.

[OFFICIAL-DOCUMENTATION] The current distributed guide distinguishes full-model DP replicas from attention-DP groups with separate cache ownership. Attention-DP is explicitly configured; its size must divide TP size. The guide states that ordinary DP and attention-DP sizes cannot both exceed one in this interface [R43.9, “Activation Logic”]. MoE expert dispatch/combine adds communication between these locally owned attention workloads.

[DERIVED] Thus a router cannot treat all workers as interchangeable: a cache-aware destination may reduce recomputation but increase queue delay; a less loaded replica may lack the state. Collective order must remain consistent even when attention groups are in different forward modes. These are integration constraints; Chapter 44 treats the policy tradeoff.

```figure
id: fig-43.9
kind: diagram
title: Structured execution with separate state owners
caption: Application history, prefix state and grammar state are distinct; a cache hit cannot reconstruct missing conversation input.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-43.9
alt: Full prompt and execution identity enter a prefix index. Protected state feeds suffix execution. Accepted tokens update grammar and model state before output publication.
spec:
  direction: LR
  nodes:
    - {id: prompt, kind: tensor, label: full prompt and identity}
    - {id: index, kind: process, label: radix match}
    - {id: cache, kind: memory, label: protected completed state}
    - {id: run, kind: process, label: suffix forward}
    - {id: grammar, kind: state, label: grammar state}
    - {id: accept, kind: process, label: accepted token}
    - {id: publish, kind: process, label: output processing}
  edges:
    - {from: prompt, to: index}
    - {from: index, to: cache}
    - {from: cache, to: run}
    - {from: run, to: accept}
    - {from: grammar, to: accept, kind: dependency}
    - {from: accept, to: grammar, kind: feedback}
    - {from: accept, to: publish}
```

## Algorithm

### Algorithm 43.3 — Branch-safe prefix and constraint integration

[DERIVED] Inputs are full prompts, compatible identity, a constraint automaton and finite token limits. Outputs are accepted token sequences and terminal reasons. This mathematical trace specifies obligations rather than transcribing current source.

$$
\begin{aligned}
1.\;&(c_r,\mathcal H_r)\leftarrow\operatorname{MatchAndProtect}(x_r,\chi);
\quad\text{incompatible state}\Rightarrow c_r=0.\\
2.\;&g_r\leftarrow\operatorname{InitializeConstraint}(x_r);
\quad\text{invalid specification}\Rightarrow\operatorname{Reject}(r).\\
3.\;&\mathcal B\leftarrow\operatorname{AdmitAndReserve}(\{r\},\{\mathcal H_r\});
\quad\mathcal B=\varnothing\Rightarrow\operatorname{WaitOrFailDeadline}.\\
4.\;&z_r\leftarrow\operatorname{ForwardSuffix}(\mathcal B,\text{positions, handles});
\quad\operatorname{AwaitCompletion}.\\
5.\;&\mathcal A(g_r)=\varnothing\Rightarrow\operatorname{FailConstraint}(r);
\quad\text{otherwise sample with Eq. 43.11}.\\
6.\;&\operatorname{Commit}(y_r);\quad
g_r\leftarrow\delta(g_r,y_r);\quad\operatorname{PublishAfterStopProcessing}.\\
7.\;&\text{stop, cancellation or }\ell_{\max}\Rightarrow
\operatorname{ReleaseAfterLastRead}(r);\\
&\text{otherwise return to 3; publish completed reusable state when valid}.
\end{aligned}
$$

[DERIVED] Invariants are compatible prefix identity, protection before eviction, grammar/model position agreement and release after device completion. Per-step masking can cost $O(V)$ for a dense vocabulary mask; sparse or compiled representations change constants and work. Prefix inspection is $O(|x_r|)$ worst case. Model execution and distributed collectives dominate separately. Finite request caps bound each branch; an application spawning unbounded branches needs its own budget.

## Implementation

[OFFICIAL-DOCUMENTATION] SGLang is **Inference engine**, PyTorch **Model / autograd framework**, and FlashAttention **Kernels / numerics / collectives**. The plugin interface assigns process topology, hardware dependencies and model endpoints to the selected serving extension [R43.30, “Add an out-of-tree serve backend”]. A CLI-compatible plugin is not automatically equivalent to the native engine.

[DERIVED] Record backend, model class, attention/MoE kernels, quantized artifact, cache representation, graph mode, grammar backend, router and worker grouping. Otherwise an “SGLang” result identifies an umbrella project rather than an executable path.

[OFFICIAL-DOCUMENTATION] At commit 6f646563a253d6e573fe340a30ec4bbfa642eafa, scheduler.py's event_loop_overlap queues results, invokes a write-after-read barrier and processes prior results before dependent sampling [R43.33, lines1975–2048]. This concrete ordering corroborates the dependency boundary discussed above. It does not prove that every branch, backend or configuration is safe; no runtime execution occurred.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The historical study compares Guidance 0.1.8, LMQL 0.7.3 and vLLM 0.2.5 on FP16 open models, with A10G/A100 setups. Workloads include few-shot benchmarks, agent traces, branching reasoning, JSON and multi-turn chat. Throughput is batched programs/s; latency is single-program average [P37, §6.1; Appendix C].

[OFFICIAL-DOCUMENTATION] A July 2026 first-party report uses v0.5.15.post1 on eight B300 GPUs with NVFP4 weights and FP8 cache. Its agent replay averages approximately 80k input tokens, 220 output tokens/turn and 92% prefix reuse. Removing synchronization/metadata bubbles reports an 11% E2E TPS gain [R43.11, “Runtime Optimization,” “Performance Results,” “Reproduction”]. This is a workload-specific combined intervention, not independent kernel attribution.

## Observations

**What the paper claims.** [PAPER-REPORTED] Exploiting program structure improves execution efficiency [P37].

**What the evidence shows.** [PAPER-REPORTED] Reported maxima are 6.4× throughput and 3.7× latency improvement across different settings; long-output chat has little gain [P37, §6.2]. They are not paired universal multipliers.

**What we infer.** [DERIVED] Prefix reuse helps redundant prefill; long decode can dominate after that saving. The 2026 trace demonstrates that metadata dependencies remain material even when model kernels are optimized.

**What remains unknown.** [UNVERIFIED] The book has not executed these releases or independently measured quality, tail latency, routing failures or deterministic-mode costs.

## Failure modes

> **Failure mode — Constraint state ahead of accepted tokens.** [DERIVED] *Symptom:* legal outputs become impossible after speculative rejection. *Cause:* updating grammar on proposed tokens. *Detection:* trace accepted-token positions and automaton transitions. *Mitigation:* rollback or transactional acceptance of both states.

[DERIVED] Other failures include treating a soft session as durable history, releasing shared branch state prematurely and applying backend-independent determinism claims. A correct JSON parser cannot detect these model-state errors.

## Siblings

[DERIVED] [vLLM](43-2-vllm.md) emphasizes block-hash prefix identity; SGLang's historical radix organization exposes tree structure. [TensorRT-LLM](43-4-tensorrt-llm.md) has a different executor/resource interface. Shared kernels do not establish equal routing, grammar or cancellation behavior.

## Extensions

### Improvements

[DERIVED] The lineage proceeds from independent calls to structured branches and prefix reuse, then to finer asynchronous planning, graph boundaries and distributed ownership. Current session hints improve reuse retention without making history durable. Attention-DP avoids selected replicated-state costs while introducing different communication and scheduling obligations. Each improvement changes a bottleneck or contract; none eliminates correctness validation.

## Limitations

[DERIVED] Reuse opportunities depend on exact input structure and cache locality. Syntax constraints can lower unconstrained likelihood while meeting application requirements; quality must be evaluated for that requirement. A research question is whether cache-aware routing can jointly control tail delay and recomputation under nonstationary branching workloads. Evidence would require identical arrival traces, token semantics and resource budgets, with both client deadlines and state-transfer costs measured.

## Reproducibility

[UNVERIFIED] Current documentation is mutable and unpinned; P37 is inspected at v2 and the archival NeurIPS paper. No local server was run. Version/commit, resolved plugin, model revision, template/token IDs, constraints, kernel choices, graph settings, distributed groups and warm-state policy are required before a comparison is reproducible. Book experiments remain in [verification](verification.md).

```figure
id: fig-43.10
kind: calculator
title: Prefix-reuse break-even
caption: A hypothetical cost model; the result is arithmetic, not a measured SGLang speedup.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-43.10
alt: Controls compare reference prefill time with suffix execution and lookup, routing and transfer costs.
states:
  - {anchor: formulation, label: Declared model, note: Inputs are hypothetical analysis values.}
  - {anchor: mechanism, label: Inspect dependencies, note: Actual costs require measurement at the stated boundary.}
  - {anchor: failure-modes, label: Check the omitted cost, note: A favorable calculation cannot certify a deployment.}
spec:
  tex: "F-R-overhead"
  equation: "43.10"
  inputs:
    - {symbol: full, label: reference prefill, min: 1, max: 100, default: 30, format: fixed2}
    - {symbol: suffix, label: suffix execution, min: 1, max: 100, default: 12, format: fixed2}
    - {symbol: overhead, label: lookup route transfer, min: 0, max: 100, default: 4, format: fixed2}
  outputs:
    - {symbol: saving, label: modeled saving, formula: "full-suffix-overhead", format: fixed2}
```

```figure
id: fig-43.11
kind: stat-panel
title: Session ownership is a soft hint
caption: Current session references do not guarantee retention or reconstruct conversation history.
placement: rail
anchor: mechanism
evidence: OFFICIAL-DOCUMENTATION
source: R43.7
alt: A stat card states that a session identifier is not durable conversation input.
spec:
  header: EXECUTION CONTRACT
  rows:
    - {key: cache ownership hint, value: soft}
    - {key: boundary, value: Full intended prompt remains required}
```

## References

[P37](references.md#p37), [R43.6](references.md#r43-6), [R43.7](references.md#r43-7), [R43.8](references.md#r43-8), [R43.9](references.md#r43-9), [R43.10](references.md#r43-10), [R43.11](references.md#r43-11), [R43.30](references.md#r43-30), [R43.33](references.md#r43-33).
