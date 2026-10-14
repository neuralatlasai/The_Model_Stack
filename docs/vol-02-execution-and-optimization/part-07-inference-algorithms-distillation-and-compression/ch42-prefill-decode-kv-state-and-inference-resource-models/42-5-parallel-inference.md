---
id: ms.section.42.5
entity_type: section
title: Parallel inference
volume: 2
part: 7
chapter: 42
section: 42.5
slug: 42-5-parallel-inference
parent: ms.chapter.42
prev_sibling: ms.section.42.4
next_sibling: ms.section.42.6
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

# 42.5 Parallel inference

## Scope

[DERIVED] The question is how a fixed inference workload changes when weights, layer execution, experts or independent requests are placed across devices. This section owns the inference resource consequences of tensor, pipeline, expert and data parallelism, including replication, collective cost and concurrency. Chapter 29 owns parallel decomposition mathematics; Chapter 44 owns placement/scheduling policies. Success means a per-rank capacity and critical-path model, not an ideal device-count divisor applied to every tensor.

## Why this exists

[DERIVED] Parallelism can be necessary to fit weights, useful to fit more state, or useful to process independent requests. These are different objectives. A strategy that lowers weight bytes/rank can increase token latency through synchronization. A strategy that increases aggregate throughput can leave one request's latency unchanged. Sparse activated parameters can lower arithmetic while all experts still require storage somewhere. Without a workload and evaluation axis, the word "scaling" does not specify a scientific claim.

[PAPER-REPORTED] Sarathi-Serve analyzes pipeline bubbles caused by unlike prefill/decode microbatches and evaluates combinations of tensor and pipeline parallelism [R42.6, §§2.3,4.4,5.3]. Its evidence is useful because it connects decomposition to actual iteration composition rather than attributing all inefficiency to the interconnect.

## Intuition

[MATHEMATICALLY-DERIVED] Tensor parallelism splits a layer's operators and joins partial results before the next dependent operation. Pipeline parallelism places successive layers on different stages, so a token traverses them in order while different microbatches overlap. Expert parallelism routes token representations to their selected parameter owners. Data parallel replicas execute independent requests with separate model/state copies. The first three add communication within one model replica; the last adds routing and cache-locality decisions across replicas.

[DERIVED] A request's KV does not disappear when its model is distributed. It follows layer/head ownership, possibly with replication required by the kernel's head partition. Per-rank capacity is determined by its actual state, weights and buffers. An eight-device deployment can still fail because one stage or expert rank exceeds capacity; an aggregate byte total is insufficient.

## Formulation

[MATHEMATICALLY-DERIVED] Let $p_t,p_p,p_e,p_d$ denote declared tensor, pipeline, expert and replica degrees. They are not automatically independent dimensions whose product is a supported topology. Let $a_{rj}$ be the stored-byte fraction/multiplicity of source tensor $j$ on rank $r$ (fractional for slices, greater than one for duplicate representations). Then

$$
M_{\rm weights,r}=\sum_j a_{rj}\operatorname{bytes}(W_j),\qquad
M_{\rm KV,r}=\sum_{\ell\in\mathcal L_r}\sum_i S_{i\ell}c_{\ell r},
\qquad
t_{\rm step}\ge\max_r t_{\rm local,r}.
$$
*(Eq. 42.11)*

| Symbol | Meaning / unit |
|---|---|
| $p_t,p_p,p_e,p_d$ | declared tensor/pipeline/expert/replica degrees |
| $a_{rj},c_{\ell r}$ | stored-byte fraction/multiplicity, local KV bytes/token |
| $m,\alpha_{\rm net},B_{\rm net}$ | message bytes, stage seconds, effective bytes/s |

where $\mathcal L_r$ contains local layers and $c_{\ell r}$ is local KV bytes/token including replicated heads. Dependencies can make step time exceed this lower bound. For ideally balanced sharding, $a_{rj}=1/p_t$ is shorthand for equal disjoint slices, not a literal fractional copy.

[MATHEMATICALLY-DERIVED] In an analytical ring all-reduce of $m$ bytes over $p_t$ ranks, with per-stage latency $\alpha_{\rm net}$ and effective link rate $B_{\rm net}$,

$$
t_{\rm ar}\simeq2(p_t-1)\alpha_{\rm net}+
\frac{2(p_t-1)m}{p_tB_{\rm net}}.
$$
*(Eq. 42.12)*

where seconds are counted on the communicating rank. This derives from reduce-scatter plus all-gather, each with $p_t-1$ stages and $m/p_t$ bytes/stage. It is an analytical algorithm model, not a statement that NVIDIA NCCL chooses a ring for every message or topology. Other collectives, overlap and contention require their own measured model.


```figure
{
  "id": "fig-42.15",
  "kind": "calculator",
  "title": "Analytical ring all-reduce time",
  "caption": "Illustrative effective-rate inputs, not a hardware specification or a claim about NCCL algorithm selection. Small messages expose the per-stage latency term.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.12",
  "alt": "For p ranks, message bytes m, latency a and effective bandwidth Bw, calculate two times p minus one latency stages plus the ring payload term.",
  "spec": {
    "tex": "t=2(p-1)a+2(p-1)m/(pB_{\\rm net})",
    "equation": "42.12",
    "inputs": [
      {
        "symbol": "p",
        "label": "Ranks",
        "default": 4,
        "min": 1,
        "max": 64,
        "format": "integer"
      },
      {
        "symbol": "m",
        "label": "Message bytes",
        "default": 65536,
        "min": 1,
        "max": 1073741824,
        "format": "bytes"
      },
      {
        "symbol": "a",
        "label": "Per-stage seconds",
        "default": 5e-06,
        "min": 0,
        "max": 0.01,
        "format": "raw"
      },
      {
        "symbol": "Bw",
        "label": "Effective link bytes per second",
        "default": 100000000000,
        "min": 1000000,
        "max": 1000000000000,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "lat",
        "label": "Latency term seconds",
        "formula": "2*(p-1)*a",
        "format": "raw"
      },
      {
        "symbol": "payload",
        "label": "Payload term seconds",
        "formula": "2*(p-1)*m/(p*Bw)",
        "format": "raw"
      },
      {
        "symbol": "total",
        "label": "Total analytical seconds",
        "formula": "2*(p-1)*a+2*(p-1)*m/(p*Bw)",
        "format": "raw"
      }
    ]
  },
  "anchor": "formulation"
}
```


## Mechanism

### Methodology

[DERIVED] Tensor-parallel linear execution typically partitions an expansion along output channels and a following contraction along input channels. The former produces local output slices; the latter needs a sum of partial contributions. The exact sequence depends on fused operators, residual placement, normalization and attention-head assignment. For the conventional two-reduction-per-block decomposition, a decode activation message has scale $m=Bd_{\rm model}b_a$, while a prefill/chunk message has $m=n_ud_{\rm model}b_a$. Small decode messages can be dominated by $\alpha_{\rm net}$ despite low byte volume; large prefills can be dominated by bandwidth. Using peak fabric bandwidth alone misses the first regime.

[MATHEMATICALLY-DERIVED] If $H_{kv}$ is divisible by $p_t$ and heads are independently sharded, local KV heads are $H_{kv}/p_t$. If $p_t>H_{kv}$, that integer rule fails; replication or another state partition is required. A possible replicated-head layout assigns one KV head to each rank and replicates each across $p_t/H_{kv}$ ranks when divisible. Its aggregate KV then exceeds unreplicated logical storage by that factor. This is an analytical layout example; actual backend support must be verified rather than inferred. Weight sharding and KV sharding can therefore have different scaling factors.

[DERIVED] Tensor parallelism can decrease the local GEMM shape until hardware efficiency falls. Increasing degree then reduces arithmetic/rank but increases synchronization count and makes launch/latency overhead harder to amortize. A valid speedup analysis compares the saved local execution time with added critical-path communication and changed kernel efficiency. It also records vocabulary-head placement and sampling: sharded logits require gathering or distributed selection before the next token identity is globally consistent.

[MATHEMATICALLY-DERIVED] For $p_p$ balanced pipeline stages and $m_b$ identical microbatches, each taking stage time $t_s$, a fill-and-drain forward schedule takes $(m_b+p_p-1)t_s$, with utilization $m_b/(m_b+p_p-1)$. This follows by counting the initial $p_p-1$ slots before the pipeline is full and $m_b$ output slots. Ordinary single-request decode cannot independently start its next token until the current token's final-stage selection returns; filling the pipeline requires independent requests or other allowed work. Unequal stage times replace $t_s$ by a schedule constrained by the slowest stages and their ordering.

[DERIVED] Pipeline state belongs to the stage owning each layer, so layer-count balance alone does not ensure memory balance. Embeddings, output heads, full-attention layers and experts can be uneven. Activations cross stage boundaries; final token identities return to the first stage. A stalled downstream stage can hold buffers and state upstream. Failure recovery must coordinate all stages so that one request does not advance on one stage while another retries an old token elsewhere. The minimal transaction boundary includes token index and state generation across the replica.

[MATHEMATICALLY-DERIVED] Expert routing for $n_u$ new token rows, $k_e$ selected experts/token and width $d_{\rm model}$ moves up to order $2n_uk_ed_{\rm model}b_a$ representation bytes for dispatch plus return before metadata and locality reductions. This is aggregate payload accounting, not bytes on each link. If expert $e$ receives $n_e$ rows, the slowest expert's compute depends on $\max_e n_e$, not just $n_uk_e/E$. Padding, grouped GEMM shapes, routing skew and shared experts alter the execution boundary.

[DERIVED] An expert replica can improve the tail of $n_e$ at the cost of extra weight storage and mapping coordination. It does not automatically duplicate the attention cache: attention ownership and expert ownership are different dimensions. Data-parallel attention ranks coupled to expert-parallel feed-forward ranks require a precise mesh description. Activated parameter count predicts arithmetic only under its routing distribution; total parameter count remains relevant to cluster storage, initialization and failure recovery.

[DERIVED] Independent data-parallel replicas avoid model-internal cross-replica collectives for ordinary request execution. They multiply weight storage and separate prefix-cache contents. A uniformly random router can sacrifice prefix locality; a locality-only router can overload one replica. Compare independent capacity against both queue lengths and available reusable state. Multi-replica aggregate tokens/s is not per-request token speed, and count of in-flight requests is not the current device batch.

[MATHEMATICALLY-DERIVED] Weight read amortization illustrates batch dependence. If a dense weight inventory of $M_w$ bytes is read once per iteration and $B$ ordinary decode rows each apply $N_{\rm lin}$ linear parameters, the weight-only arithmetic intensity is approximately $2BN_{\rm lin}/M_w$. Under uniform storage $M_w=N_{\rm lin}b_w$, this is $2B/b_w$. KV traffic adds roughly $\sum_i cS_i$ bytes, so increasing $B$ also increases state reads and capacity. This calculation is conditional on one effective weight read, independent sequence state and no large extra buffers; it is not a claim that batching improves latency indefinitely.

[DERIVED] Cost accounting must include duplicated weights, per-rank KV, activation/collective buffers, initialization traffic, dispatch/collective bytes and pipeline idle time. Parallelism changes no generated-token requirement for a fixed decoding policy. Cluster energy is the time integral over all participating devices and host/network components; more devices with shorter latency can consume either more or less total energy. Monetary comparison requires instance topology, utilization and allocation window; these values are NOT-DISCLOSED for an arbitrary deployment.


```figure
{
  "id": "fig-42.16",
  "kind": "diagram",
  "title": "Inference placement boundaries",
  "caption": "Tensor, pipeline and expert ownership are optional, composable placement axes. The expert path applies only to MoE layers; this dependency map is not a mandatory sequence of execution stages.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.11",
  "alt": "A router chooses a replica. Optional branches describe tensor/KV ownership, pipeline layer transfers, and MoE-only expert dispatch. Each must preserve consistent token selection; an unsharded route is also shown.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "r",
        "kind": "process",
        "label": "Request router"
      },
      {
        "id": "rep",
        "kind": "model",
        "label": "Selected replica"
      },
      {
        "id": "tp",
        "kind": "process",
        "label": "Optional tensor ownership"
      },
      {
        "id": "kv",
        "kind": "memory",
        "label": "Local or replicated KV heads"
      },
      {
        "id": "pp",
        "kind": "flow",
        "label": "Optional layer / pipeline ownership"
      },
      {
        "id": "ep",
        "kind": "process",
        "label": "MoE-only expert dispatch"
      },
      {
        "id": "out",
        "kind": "state",
        "label": "Consistent token selection"
      }
    ],
    "edges": [
      {
        "from": "r",
        "to": "rep"
      },
      {
        "from": "rep",
        "to": "tp",
        "label": "tensor axis"
      },
      {
        "from": "tp",
        "to": "kv",
        "kind": "dependency"
      },
      {
        "from": "tp",
        "to": "out"
      },
      {
        "from": "rep",
        "to": "pp",
        "label": "pipeline axis"
      },
      {
        "from": "pp",
        "to": "out"
      },
      {
        "from": "rep",
        "to": "ep",
        "label": "expert axis, if MoE"
      },
      {
        "from": "ep",
        "to": "out"
      },
      {
        "from": "rep",
        "to": "out",
        "label": "unsharded route"
      }
    ]
  }
}
```


## Algorithm

**Algorithm 42.5 — Feasibility before parallel performance.** [DERIVED] Inputs are a finite set of supported mesh candidates, tensor inventory, workload class, measured operator/collective surfaces and latency budget. Output is a feasible set with predicted per-rank peaks and critical-path costs, not a universal engine ranking.

$$
\begin{aligned}
1.&\quad \mathcal F\leftarrow\varnothing;\quad\text{for each candidate }g\in\mathcal G:\\
2.&\quad \operatorname{Supported}(g,\mathrm{model},\mathrm{dtype},\mathrm{backend})=\mathrm{false}\Rightarrow\operatorname{Reject}(g).\\
3.&\quad (a_{rj},c_{\ell r},\mathcal L_r)\leftarrow\operatorname{ActualPlacement}(g);\quad
\text{reject missing or nonintegral head assignments}.\\
4.&\quad \max_tM_{\rm process,r}(t)>M_{\rm usable,r}\text{ for any }r\Rightarrow\operatorname{Reject}(g).\\
5.&\quad \mathcal D_g\leftarrow\operatorname{ExecutionDAG}(\mathrm{operators},\mathrm{transfers},\mathrm{selection});\
\widehat t_g\leftarrow\operatorname{CriticalPath}(\mathcal D_g).\\
6.&\quad \text{Missing calibrated surface}\Rightarrow\operatorname{MarkUnverified}(g);\
\text{otherwise append }(g,\widehat t_g,\{M_r\})\text{ to }\mathcal F.
\end{aligned}
$$

[DERIVED] Invariants are matching sequence/token state across ranks, no omitted replicated tensors and no use of unsupported combinations. The loop terminates after $|\mathcal G|$ candidates; DAG evaluation is linear in its nodes and edges after the schedule is fixed. Actual collective timeout or rank failure invalidates the replica's in-flight operation; retry begins from a consistent committed prefix, not from independently advanced shards.

## Implementation

[OFFICIAL-DOCUMENTATION] **vLLM — Inference engine** documents tensor/pipeline inference and distinguishes per-replica strategy from distributed MoE deployment [R42.12, "Distributed inference strategies"; R42.13, "Layer Behavior with EP Enabled"]. The expert guide warns that specialized high-throughput/low-latency kernels can perform poorly on mixed workloads [R42.13, "Performance Optimization"]. Its guidance is configuration-sensitive and unpinned.

[DERIVED] **NVIDIA NCCL — Kernels / numerics / collectives** is the reference-stack collective layer; Chapter 29 owns its detailed implementation. No executable NCCL path was inspected for this chapter, so a claimed particular collective algorithm would be UNVERIFIED. The predictive model uses Eq. 42.12 only as an explicit analytical ring case. Log topology, message shape, actual backend and overlap before interpreting a profiler trace.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Sarathi-Serve evaluates Mistral-7B on A100, Yi-34B with TP2, Llama2-70B with TP4/PP2 on A40 and Falcon-180B with TP4/PP2 on A100. ShareGPT/arXiv-summarization length traces use Poisson arrivals, length caps and strict/relaxed p99 token-latency targets; its ablations examine chunking and mixed scheduling [R42.6, §5; Tables 2–3; §5.4]. This is scheduling under specific distributed configurations, not a factorial test of every parallel degree. Current runtime revisions and complete seed-level uncertainty remain NOT-DISCLOSED.

## Observations

**What the paper claims.** [PAPER-REPORTED] Uniformized mixed batches reduce generation stalls and pipeline bubbles [R42.6, §§4–5].

**What the evidence shows.** [PAPER-REPORTED] Its TP/PP results and ablations support the scheduling contribution for those models and traces. They do not isolate a universal advantage of pipeline parallelism over tensor parallelism at equal hardware, degree and workload.

**What we infer.** [MATHEMATICALLY-DERIVED] The pipeline fill/drain expression makes microbatch count a first-order variable; degree alone is insufficient. The KV head-count example shows why a weight divisor cannot be reused blindly for cache storage.

**What remains unknown.** [UNVERIFIED] Matched-current-engine latency, expert-skew tails and failure recovery across the candidate meshes have not been measured here.


```figure
{
  "id": "fig-42.17",
  "kind": "stat-panel",
  "title": "Parallelism accounting units",
  "caption": "A device-count divisor is valid only for the tensors actually sliced that way. Per-request latency and aggregate replica throughput are separate axes.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.11",
  "alt": "The panel associates tensor parallelism with operator joins, pipeline parallelism with ordered stages, expert parallelism with routed parameters and replicas with independent requests.",
  "spec": {
    "header": "PLACEMENT AUDIT",
    "rows": [
      {
        "key": "TP",
        "value": "Actual head and tensor slices"
      },
      {
        "key": "PP",
        "value": "Stage liveness and bubbles"
      },
      {
        "key": "EP",
        "value": "Expert skew and dispatch"
      },
      {
        "key": "DP",
        "value": "Copies and prefix locality"
      }
    ]
  },
  "anchor": "siblings"
}
```


## Failure modes

> **Failure mode — Aggregate fit hides rank OOM.** [DERIVED] *Symptom:* total cluster memory appears sufficient but one worker fails. *Cause:* uneven layers, logits, experts or replicated KV. *Detection:* per-rank liveness ledger. *Mitigation:* revise supported placement or reduce admissible workload.

[DERIVED] Other symptoms include collective stalls from rank divergence, pipeline starvation from too few independent requests, poor small GEMMs at excessive tensor degree and expert skew that raises iteration tails. Numerical reassociation across degrees can alter logits and sampled trajectories; validate equivalence before comparing speed.

## Siblings

[DERIVED] Tensor parallelism reduces operator-local storage with frequent joins; pipeline parallelism reduces layer-local storage with ordered transfers; expert parallelism changes conditional parameter ownership; data parallelism increases independent capacity. Canonical decompositions are in Chapter 29. [§42.6](42-6-predictive-models.md) compares their resulting cost surfaces; Chapter 44 develops routing and scheduling.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] vLLM documents expert load balancing with redundant expert placement and overlap controls [R42.13, "Expert Parallel Load Balancer"; "Memory Footprint Overhead"]. The changed mechanism is additional expert copies and routing adaptation, which consume memory. The guide does not provide a universal isolated performance result, so the improvement is a capability with workload-dependent benefit.

## Limitations

[DERIVED] Supported mesh composition, model shape and topology delimit every calculation. A degree that fits weights can be too communication-heavy for latency. A degree that increases aggregate throughput can reduce per-GPU efficiency. Capacity, goodput, per-request latency and total cost require separate comparisons.

## Reproducibility

[DERIVED] Record mesh/rank topology, physical head/expert assignment, redundant copies, collective backend and message sizes, microbatch/token composition, cache locality, sampling placement, timeouts and committed-prefix recovery. Exact current configurations and executed checks are absent; the chapter remains a draft.

## References

[R42.6](references.md#r42-6), [R42.12](references.md#r42-12), [R42.13](references.md#r42-13).
