---
id: ms.section.42.3
entity_type: section
title: Cache organization
volume: 2
part: 7
chapter: 42
section: 42.3
slug: 42-3-cache-organization
parent: ms.chapter.42
prev_sibling: ms.section.42.2
next_sibling: ms.section.42.4
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
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 42.3 Cache organization

## Scope

[DERIVED] The objective is exact attention over dynamically allocated state, with safe sharing and bounded reclamation. This section owns contiguous versus paged placement, logical-to-physical block tables, prefix sharing, copy-on-write and physical cache eviction. Removing live tokens from the attention domain is a different operation, owned by [§42.4](42-4-cache-reduction.md). Success means preserving the declared conditional computation while reducing unused allocation and duplicated state, not asserting bitwise equivalence across every kernel and batch.

## Why this exists

[PAPER-REPORTED] PagedAttention's baseline problem was a growing request state whose eventual output length was unknown, often reserved in a contiguous maximum-length region. The paper's solution maps logical token blocks onto fixed-size physical blocks and adds sharing with reference counts [P36, §§3–4]. The dominant constraint was unavailable capacity created by reservation and duplication; it was not attention arithmetic alone.

[DERIVED] A general-purpose contiguous tensor interface can be an excellent primitive when shapes are fixed and allocations short-lived. Autoregressive serving changes that contract: requests have different lifetimes, state expands incrementally, branches share prefixes and completed requests can leave useful prefixes behind. Reallocating a growing contiguous region repeatedly costs copies; reserving its maximum size wastes capacity. Paging exposes address translation to the kernel so growth need not move earlier state.

## Intuition

[MATHEMATICALLY-DERIVED] Attention depends on the ordered keys and values, not on their physical adjacency. Partition the same logical sequence into blocks, evaluate scores against each block, and combine their normalization statistics. If the complete key set and mask are preserved, partitioning changes execution order but not the real-arithmetic result. This is the correctness basis for paging. Floating-point reassociation still changes rounding, so mathematical equivalence does not imply identical sampled outputs.

[DERIVED] Sharing adds a second invariant: a physical block read by several sequences must remain immutable until their logical histories diverge. Full prefix blocks are naturally immutable. A partially filled shared tail is not; appending different tokens into that same physical region would silently couple requests. Copy-on-write separates the tail before modification, while leaving completed prefix blocks shared.

## Formulation

[MATHEMATICALLY-DERIVED] Let $p$ be tokens/block, $S_i$ the computed sequence length, $T_i[j]$ the physical block identifier for logical block $j$, and $o=t\bmod p$ the within-block offset. Then

$$
j=\lfloor t/p\rfloor,\qquad
\operatorname{address}(i,\ell,t)=\operatorname{base}_{\ell,T_i[j]}+o\,c_\ell,
\qquad
M_{\rm pages}=\sum_{\ell}c_\ell p\,U_\ell.
$$
*(Eq. 42.6)*

| Symbol | Meaning / unit |
|---|---|
| $p,S_i,T_i[j],o$ | tokens/block, computed tokens, physical block ID, within-block token offset |
| $c_\ell,U_\ell$ | bytes/token/layer, unique physical blocks |
| $m_j,a_j,u_j$ | block maximum, exponential sum, weighted value sum |

where $c_\ell$ is bytes/token/layer for the actual cache representation and $U_\ell$ counts unique physical blocks at layer $\ell$. Layout-dependent head/channel strides refine the address expression. Without sharing and with one page size per layer, allocated token slots are $\sum_i p\lceil S_i/p\rceil$, not $B\max_iS_i$.

[MATHEMATICALLY-DERIVED] For $B$ nonempty sequences the tail waste obeys

$$
0\le M_{\rm tail}<B(p-1+1)\sum_\ell c_\ell,\qquad
M_{\rm tail}=\sum_i\left[p\lceil S_i/p\rceil-S_i\right]\sum_\ell c_\ell
\le B(p-1)\sum_\ell c_\ell .
$$
*(Eq. 42.7)*

where all quantities are bytes. This is the tight integer bound; there is no assumption that all last-block occupancies are uniform. Expected half-page waste requires an explicit occupancy distribution and is not a universal allocator property.


```figure
{
  "id": "fig-42.9",
  "kind": "calculator",
  "title": "Maximum integer page-tail waste",
  "caption": "Illustrative byte cost, not a model specification. Each nonempty request wastes at most p minus one token slots; no uniform tail-occupancy assumption is used.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.7",
  "alt": "For 8 requests, blocks of 16 tokens and 131072 cache bytes per token across layers, the upper bound is 15728640 bytes.",
  "spec": {
    "tex": "M_{\\rm tail}\\le B(p-1)c",
    "equation": "42.7",
    "inputs": [
      {
        "symbol": "B",
        "label": "Nonempty sequences",
        "default": 8,
        "min": 1,
        "max": 256,
        "format": "integer"
      },
      {
        "symbol": "p",
        "label": "Tokens per block",
        "default": 16,
        "min": 1,
        "max": 256,
        "format": "integer"
      },
      {
        "symbol": "c",
        "label": "KV bytes per token",
        "default": 131072,
        "min": 1,
        "max": 1048576,
        "format": "bytes"
      }
    ],
    "outputs": [
      {
        "symbol": "M",
        "label": "Tail waste bound",
        "formula": "B*(p-1)*c",
        "format": "bytes"
      }
    ]
  },
  "anchor": "formulation"
}
```


## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] For one query, partition logits $z_t=q^\top k_t/\sqrt{d_h}$ into blocks $\mathcal B_j$. Each block yields a maximum $m_j$, shifted exponential sum $a_j$ and shifted weighted value sum $u_j$:

$$
m_j=\max_{t\in\mathcal B_j}z_t,\quad
a_j=\sum_{t\in\mathcal B_j}e^{z_t-m_j},\quad
u_j=\sum_{t\in\mathcal B_j}e^{z_t-m_j}v_t.
$$
*(Eq. 42.8)*

[MATHEMATICALLY-DERIVED] Set $m=\max_jm_j$. The complete attention output is
$o=(\sum_je^{m_j-m}u_j)/(\sum_je^{m_j-m}a_j)$. Multiplying each block's numerator and denominator by $e^{m_j-m}$ reconstructs the common normalization. Masked or invalid tail positions contribute zero; an entirely masked query requires an explicit contract because its denominator is zero. This explanatory reconstruction shows why noncontiguous blocks are compatible with exact attention; it does not claim that every engine uses precisely these intermediate tensors.

[DERIVED] The block table is therefore executable model state. A stale identifier is not merely a hit-rate problem: it directs the kernel to another sequence's values. Allocate a physical block, establish its ownership, write its valid positions, then publish the mapping. On asynchronous devices, a host-side table update needs ordering with the writes and any reading kernel. Reclaim only after all readers have completed. Reference counts track logical ownership; completion events track in-flight physical use. Neither replaces the other.

[PAPER-REPORTED] PagedAttention supports shared prefix blocks and copy-on-write for branching outputs, as well as swapping or recomputation when memory pressure forces preemption [P36, §§4.3–4.5]. These are distinct transitions: sharing reduces duplication, copy-on-write protects diverging state, and preemption changes residency or recomputes missing state.

[MATHEMATICALLY-DERIVED] Suppose $k$ continuations share $h$ full prompt blocks and each owns $d_i$ continuation blocks. Unique storage is $h+\sum_i d_i$ blocks rather than $kh+\sum_i d_i$, saving $(k-1)h$ blocks. This gain vanishes for nonmatching prefixes and can be offset by duplicated partial tails. Shared reads do not automatically imply one HBM read across all queries: the kernel must exploit that reuse, otherwise storage capacity improves while aggregate traffic remains similar.

[DERIVED] Prefix identity must describe the computation, not merely visible text. At minimum it is conditional on exact tokens, all earlier prefix tokens, model/executable state identity, adapter identity, positions, attention-mask semantics, modality embeddings or their content identity, and cache representation. Some components can be constant within a worker and therefore belong to its namespace rather than every hash. A tokenizer/template changes the token sequence; two matching strings alone establish no state equivalence. Changing weights invalidates previously computed state even if tokens are unchanged.

[OFFICIAL-DOCUMENTATION] The inspected vLLM design chains a parent hash, block tokens and extra identities such as LoRA identifiers, multimodal input hashes and cache salts. It caches full blocks, documents hash/serialization options and organizes a pool, free queue, hash mapping and request-to-block mapping [R42.1, opening notes; "Data Structure"; "Operations"]. Its security salting partitions reuse across trust groups. This does not prove that every conceivable model-specific dependency has been encoded automatically.

[DERIVED] The cache key should therefore be treated as a sufficient-statistic claim with a testable equivalence relation: equal keys imply equal state under the declared namespace. Cryptographic hashing limits accidental digest collisions; it cannot repair omitted conditioning. A salt provides reuse isolation, not authorization by itself. Permissions must determine which salt/namespace a request may use. Invalidating a namespace on model or adapter replacement is generally safer than attempting partial identity repair after the fact.

[DERIVED] Physical eviction removes an unreferenced retained block from the cache index and makes its region available for a new allocation. It need not alter an active request's attention history. Under pressure, referenced blocks are not eligible unless their owners are explicitly preempted, moved or recomputed. LRU orders reusable candidates, but its unit and touch semantics matter: request access, block lookup and completion time give different orderings. A new cache hit can remove a formerly free block from the reclaimable queue without copying its tensor.

[MATHEMATICALLY-DERIVED] Lookup requires $O(\lceil S_p/p\rceil)$ chained block identities for a prompt; metadata is $O(\sum_i\lceil S_i/p\rceil+U)$ references/entries, with $U$ physical blocks. Tail copy-on-write costs at most one block's payload for a single append divergence under this representation. Attention arithmetic remains $O(BLH_qSd_h)$ per ordinary decode step, and raw state traffic remains proportional to attended positions unless the kernel exploits reuse or changes retention. Table loads, indirect addressing, page size, occupancy and reduction scratch add execution costs; energy and money need measured runtime and infrastructure allocation.


```figure
{
  "id": "fig-42.10",
  "kind": "diagram",
  "title": "Logical blocks and immutable sharing",
  "caption": "Two requests can address the same completed prefix block, while their writable continuation blocks remain distinct. Copy-on-write protects a shared partial tail.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.6",
  "alt": "Logical block tables for requests A and B both point to one immutable prefix block. Each points to its own writable tail; readers must finish before retired physical blocks are reclaimed.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "state",
        "label": "Request A table"
      },
      {
        "id": "b",
        "kind": "state",
        "label": "Request B table"
      },
      {
        "id": "p",
        "kind": "memory",
        "label": "Shared immutable prefix"
      },
      {
        "id": "ta",
        "kind": "memory",
        "label": "Writable tail A"
      },
      {
        "id": "tb",
        "kind": "memory",
        "label": "Writable tail B"
      },
      {
        "id": "e",
        "kind": "process",
        "label": "Completion-aware reclaim"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "p"
      },
      {
        "from": "b",
        "to": "p"
      },
      {
        "from": "a",
        "to": "ta"
      },
      {
        "from": "b",
        "to": "tb"
      },
      {
        "from": "ta",
        "to": "e"
      },
      {
        "from": "tb",
        "to": "e"
      }
    ]
  }
}
```


## Algorithm

**Algorithm 42.3 - Append with sharing and reclamation.** [DERIVED] Inputs are one append operation, immutable namespace, logical table, physical pool of $U_{\max}$ blocks, reference counts and completion events. Output is an atomically committed table or a named failure. Serialize mutations of each logical sequence. Pool acquisition atomically reserves a block; a tail-write guard prevents a concurrent fork or alias publication from racing the reference-count test. State includes a private table snapshot $T'_i$, expected sequence version $v$, and provisional block/event ownership. The candidate scan and host waiting have finite deadlines.

$$
\begin{aligned}
1.&\quad \operatorname{AcquireSequenceAndTailGuards};\quad
 (T'_i,v)\leftarrow\operatorname{Snapshot}(T_i);\quad
 (j,o)\leftarrow(\lfloor S_i/p\rfloor,S_i\bmod p).\\
2.&\quad o=0\Rightarrow b_{\rm new}\leftarrow
 \operatorname{AcquireFreeOrEvictUnreferenced}(U_{\max}).\\
3.&\quad o>0\land\operatorname{refs}(T_i[j])>1\Rightarrow
 b_{\rm new}\leftarrow\operatorname{Acquire};\quad
 \operatorname{Acquired}(b_{\rm new})\Rightarrow\operatorname{CopyValidTail}(T_i[j],b_{\rm new},o).\\
4.&\quad \text{No guarded ownership, eligible block, valid copy or remaining time}
 \Rightarrow\operatorname{AbortAndRetireProvisionals};\quad\mathrm{CAPACITY\_OR\_TIMEOUT}.\\
5.&\quad b_{\rm target}\leftarrow b_{\rm new}\text{ if acquired, else }T_i[j];\quad
 \operatorname{WriteKV}(b_{\rm target},o);\quad\operatorname{WaitWriteCompletion};\quad
 T'_i[j]\leftarrow b_{\rm target}.\\
6.&\quad \operatorname{WriteFailedOrExpired}\Rightarrow
 \operatorname{AbortAndRetireProvisionals};\quad
 \text{otherwise }\operatorname{AtomicCommit}(T'_i,S_i+1,\operatorname{refDeltas},v).\\
7.&\quad \operatorname{CommitFailed}\Rightarrow\operatorname{AbortAndRetireProvisionals};\quad
 o=p-1\Rightarrow\operatorname{PublishCommittedFullBlockHash}(T'_i[j]).\\
8.&\quad \operatorname{ReleaseGuards};\quad
 \operatorname{ReclaimRetiredAfterReadersComplete};\quad\operatorname{Return}(T_i,S_i).
\end{aligned}
$$

[DERIVED] The table pointer, logical length, reference deltas and version change at one host-visible commit boundary. A failed append preserves the old committed table and length. An unused position in an exclusive old tail can have provisional bytes, but readers must obey the old length and those bytes are not reusable state. No multiply referenced tail is modified in place. Guards and pool reservations must also cover alias/fork operations; a reference count sampled without that synchronization is insufficient. Abort releases guards but retires or quarantines buffers until submitted copies/writes have completed, rather than immediately returning them to the free pool. Hash publication follows commit and full-block initialization. These are requirements of this book procedure, not claims that a named engine uses this exact locking scheme. Selection among eviction candidates can require $O(U_{\max})$ in this bounded reference; an indexed free queue reduces ordinary acquisition metadata work. Copy volume and KV generation are counted separately. For cross-worker ownership changes, use [Chapter 44's handoff contract](../../part-08-inference-engines-and-production-serving/ch44-scheduling-distributed-serving-and-disaggregation/44-4-disaggregation.md) instead of treating this local transaction as a distributed commit.

## Implementation

[OFFICIAL-DOCUMENTATION] **vLLM — Inference engine** provides the reference pool/hash design [R42.1]. Its hybrid manager intersects compatible reuse across cache groups, rather than assuming that a full-attention hit proves all layer types reusable [R42.2, "Prefix caching"]. The design page explicitly identifies historical commit 458e74; the served page remains unpinned and is not a statement that every current code path equals that revision.

[DERIVED] **PyTorch — Model / autograd framework** supplies tensors and stream/event semantics [R42.3]. The implementation path is logical token index, device block table, typed cache pointer, attention kernel, HBM reads and per-query reduction. Tables need the same device-visible generation as the cache they address. Deployment must bound pool use, enforce namespace isolation, flush on incompatible state changes and recover a failed transaction without reusing partially written pages.

## Experimental design

### Reported experiments

[PAPER-REPORTED] PagedAttention evaluates ordinary, parallel-sampling and beam-search workloads plus shared-prefix prompts, with OPT/LLaMA models on A100-based instances, input/output lengths drawn from ShareGPT and Alpaca and Poisson arrivals [P36, §§6.1–6.4]. Figures 14–16 separate branching/sharing cases; the baselines include an Orca reimplementation. The reuse experiment varies few-shot shared prefixes, not arbitrary document substrings. Precision/instance configuration is given in Table 1; modern engine commits and multi-tenant isolation tests are outside that protocol.

## Observations

**What the paper claims.** [PAPER-REPORTED] Block sharing is especially useful when the decoding procedure creates related continuations [P36, §6.3].

**What the evidence shows.** [PAPER-REPORTED] Figure 15 shows larger storage savings for beam search than parallel sampling in the reported workloads. This isolates a sharing opportunity associated with their common-prefix structure, not a guarantee that page layout alone reduces every kernel's execution time.

**What we infer.** [MATHEMATICALLY-DERIVED] Savings scale with unique prefix blocks and branch count, as the $(k-1)h$ calculation shows. A reported engine throughput gain combines capacity, scheduling and kernel effects unless the ablation isolates them.

**What remains unknown.** [UNVERIFIED] Cross-version numerical equality, current end-to-end hit-key completeness and race-free reuse under failures have not been executed or audited here.


```figure
{
  "id": "fig-42.11",
  "kind": "stat-panel",
  "title": "Reuse invariants",
  "caption": "Hash strength cannot compensate for omitted conditioning. Reclamation needs device completion in addition to host reference counts.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.6",
  "alt": "The invariant panel records model namespace, full prefix identity, immutable shared blocks and completion-aware reclamation.",
  "spec": {
    "header": "REUSE CONTRACT",
    "rows": [
      {
        "key": "identity",
        "value": "Tokens plus conditioning"
      },
      {
        "key": "namespace",
        "value": "Model and executable state"
      },
      {
        "key": "write",
        "value": "Private writable tail"
      },
      {
        "key": "free",
        "value": "No owners and no readers"
      }
    ]
  },
  "anchor": "failure-modes"
}
```


## Failure modes

> **Failure mode — Semantically incomplete reuse key.** [DERIVED] *Symptom:* output changes incorrectly when a prefix cache becomes warm. *Cause:* tokens match while adapters, positions, masks or modality inputs differ. *Detection:* compare cold/warm logits under each changed condition. *Mitigation:* complete the namespace/key, invalidate incompatible state and reject unauthorized sharing.

[DERIVED] A second failure is reference-count correctness without device lifetime correctness: the last host owner can release while its GPU kernel still reads. A third is caching an incompletely written block after cancellation. Both require completion-aware reclamation. Debugging only final text may miss rare cross-request corruption; retain allocation-generation and ownership events.

## Siblings

[DERIVED] Contiguous state minimizes address-translation metadata but needs a growth/reservation policy. Paged state changes placement while preserving logical history. [§42.4](42-4-cache-reduction.md) changes representation, location or retained history. Compare capacity utilization, added metadata/indirection, exactness and transfer/reconstruction cost; a sparse attention domain is not a competing memory allocator.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] Current vLLM documentation adds cache-group-aware reuse and deterministic cross-language hash serialization options [R42.1; R42.2]. These address heterogeneous state and reproducible identities respectively. Their benefit is a stronger documented contract; no measured application gain follows from the documentation alone.

## Limitations

[DERIVED] Paging removes external fragmentation inside a homogeneous fixed-block pool, not all memory waste in the process. Large blocks reduce table entries but increase tail waste and copy volume. Small blocks reduce tail waste but can increase metadata and kernel overhead. Neither choice is optimal without the request-length and hardware distribution.

> **Open question.** [UNVERIFIED] How should exact prefix reuse, placement and completion-aware reclamation be optimized jointly when failures and multi-tenant isolation constrain sharing? *What evidence would settle it:* matched placement studies retaining ownership/completion traces, cache misses, failures and client latency under fixed correctness and authorization criteria. This is a research question, separate from the missing execution of this edition.

## Reproducibility

[DERIVED] Record block sizes, physical strides, cache-group rules, namespaces, hash serialization, ownership and completion transitions, eviction touch semantics and warm/cold state. Preserve numerical tolerance and sampling policy when comparing outputs. No book cache-race or hit-key experiment was run.

## References

[P36](references.md#p36), [R42.1](references.md#r42-1), [R42.2](references.md#r42-2), [R42.3](references.md#r42-3).
