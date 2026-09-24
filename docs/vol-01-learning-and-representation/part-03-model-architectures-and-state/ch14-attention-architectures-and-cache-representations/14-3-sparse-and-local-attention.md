---
id: ms.section.14.3
entity_type: section
title: Sparse and local attention
short_title: Sparse and local attention
section: 14.3
slug: 14-3-sparse-and-local-attention
parent: ms.chapter.14
prev_sibling: ms.section.14.2
next_sibling: ms.section.14.4
children: []
prerequisites: [ms.chapter.5, ms.chapter.13, ms.section.14.2]
downstream: [ms.chapter.15, ms.chapter.27, ms.chapter.42]
word_count_target: 1900
volume: 1
part: 3
chapter: 14
related: []
relations: []
axes: {lifecycle: [pretraining, inference], mechanism: [attention, cache_representation], feedback_setting: [], modality: [text, image, audio, video]}
papers: [P13, P19, P20]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.flashattention]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 14.3 — Sparse and local attention

## Scope

**DERIVED.** This section treats sparsity as a contract over visible positions, executed blocks, and retained state. Sliding windows, global positions, fixed blocks, and learned selection alter different parts of that contract. The artifact is a causal coverage map with explicit selector and storage costs. Kernel scheduling is owned by Chapter 27; long-context task design is owned by Chapter 15. Both are routed through the [book's part structure](../README.md).

## Why this exists

**PAPER-REPORTED — [R14.3](references.md#r143).** Longformer combines local attention with task-motivated global attention. **PAPER-REPORTED — [R14.4](references.md#r144).** Native Sparse Attention studies a trainable combination of compressed information, selected detail, and a local window.

**DERIVED.** Dense attention spends work on every admissible query/key pair even when a task uses only some of them. Sparsity can reduce that interaction count, but selecting useful information is itself a computation. Moreover, “not read for this query” does not mean “safe to delete before future queries.” An architecture can have sparse reads and a cache that continues to grow linearly with history. This distinction prevents an attention-FLOP saving from being reported as a cache-capacity saving.

## Intuition

> **Definition — Attention coverage contract.** The rule specifying which past states each query may access, how that set is produced, and which future accesses must remain possible after eviction.

**DERIVED.** A fixed sliding window offers a structural exclusion rule: positions outside the next query's permitted window cannot be read through that layer's direct attention. Learned selection can revisit a distant token later, so current nonselection usually provides no deletion guarantee. A global token can relay information across positions, but its finite representation is not an exact copy of every token it has encountered.

**DERIVED.** The correct architectural question is therefore which information paths remain possible. The execution question is how the permitted paths map to blocks, gathers, and transfers. The retention question is which source states must remain available for all allowed future queries. These are connected questions with different answers.

## Formulation

**MATHEMATICALLY-DERIVED.** For zero-based query position $t$, define a causal set

$$
\mathcal A_t=
\left(\mathcal W_t\cup\mathcal G_t\cup\mathcal K_t\right)
\cap\{0,\ldots,t\},
\qquad
\mathcal W_t=\{\max(0,t-w+1),\ldots,t\}.
$$
*(Eq. 14.9)*

where $w\ge1$ includes the current position, $\mathcal G_t$ denotes declared global positions, and $\mathcal K_t$ selected positions. Use set union: a token present in two branches must not be counted twice unless the architecture deliberately defines separate attention branches.

**MATHEMATICALLY-DERIVED.** A pure causal sliding-window layer with no future use of evicted states has logical retained capacity

$$
M_{\mathrm{window}}=
LBH_{kv}(d_k+d_v)b\,\min(S,w).
$$
*(Eq. 14.10)*

where the count is taken during an attention step including the current token. An after-step cache can retain only the entries required by the next call; record that boundary rather than treating a one-token difference as an implementation defect. Global, summary, selector and other full-history state are excluded.

**MATHEMATICALLY-DERIVED.** To analyze truncating a fixed dense distribution, let $\epsilon_t$ be its probability mass outside a nonempty retained set and bound every value norm by $v_{\max}$. Renormalizing retained probabilities gives

$$
\|o_t-o_t^{\mathrm{retained}}\|
\le 2\epsilon_t v_{\max}.
$$
*(Eq. 14.11)*

where the dense and retained computations use identical logits and values on surviving positions. This is a conditional one-layer bound, not a guarantee for a retrained sparse model.

<details><summary>Derivation of Eq. 14.11</summary>

**MATHEMATICALLY-DERIVED.** Split the dense weighted average into retained and omitted conditional averages: $o=(1-\epsilon)o_r+\epsilon o_o$. Then $o-o_r=\epsilon(o_o-o_r)$. Both conditional averages have norm at most $v_{\max}$ by convexity, giving the bound. If omitted mass is zero, outputs agree. If no positions are retained, renormalization is undefined and the premise fails.

</details>

~~~figure
id: fig-14.9
kind: calculator
title: Window-limited logical state
caption: Eq. 14.10 applies only to a pure window with safe eviction. Selected full-history attention does not inherit this capacity bound.
placement: rail
anchor: formulation
states:
  - {anchor: formulation, label: Before the window fills, variables: {S: 1024, w: 4096}, note: "State grows with the available history before reaching the window."}
  - {anchor: mechanism, label: Window filled, variables: {S: 16384, w: 4096}, note: "The specified local state is capped at 4096 positions per sequence."}
  - {anchor: failure-modes, label: Smaller local contract, variables: {S: 16384, w: 1024}, note: "A smaller window changes coverage as well as state capacity."}
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-14.10
alt: At 32 layers, eight KV heads, 128-dimensional keys and values, one sequence and two-byte values, a 4096-token window caps logical state at 512 MiB.
spec:
  tex: M=2LBH_{kv}d_hb\min(S,w)
  equation: "14.10"
  inputs:
    - {symbol: L, label: layers, default: 32, min: 1, max: 128, format: integer}
    - {symbol: B, label: sequences, default: 1, min: 1, max: 64, format: integer}
    - {symbol: Hkv, label: KV heads, default: 8, min: 1, max: 64, format: integer}
    - {symbol: dh, label: equal key and value width, default: 128, min: 16, max: 512, format: integer}
    - {symbol: b, label: bytes per scalar, default: 2, min: 1, max: 4, format: integer}
    - {symbol: S, label: available tokens, default: 1024, min: 1, max: 131072, format: tokens}
    - {symbol: w, label: window including current, default: 4096, min: 1, max: 131072, format: tokens}
  outputs:
    - {symbol: M, label: local cache, formula: "2*L*B*Hkv*dh*b*min(S,w)", format: bytes}
~~~

## Mechanism

**MATHEMATICALLY-DERIVED.** For one query head, attention-product work is proportional to $|\mathcal A_t|(d_k+d_v)$. Across training positions it depends on $\sum_t|\mathcal A_t|$, not on the total context length alone. A bounded window gives $O(Tw)$ admitted pairs. A fixed number of global positions adds $O(T|\mathcal G|)$ pairs, but the cost grows differently if their number scales with $T$.

**DERIVED.** Block sparsity changes the execution granularity. Selecting one relevant token in a block may cause the entire block to be loaded or processed. Logical selected-token count, selected-block count, valid lanes, and padded work must be reported separately. A block-sparse kernel can exploit contiguous memory even when it performs extra arithmetic on padding; an irregular token gather can do less arithmetic but generate more transactions.

~~~figure
id: fig-14.10
kind: diagram
title: Selection does not imply eviction
caption: A current query selects a subset from retained history. Deletion needs a separate proof that future permitted queries cannot require an entry.
placement: inline
evidence: DERIVED
source: DERIVED:eq-14.9
alt: Full history feeds a selector and selected attention. The coverage contract separately controls retention and eviction.
spec:
  direction: LR
  nodes:
    - {id: past, kind: memory, label: retained history}
    - {id: selector, kind: process, label: select for current query}
    - {id: selected, kind: tensor, label: selected positions}
    - {id: attend, kind: process, label: sparse attention}
    - {id: rule, kind: dependency, label: future coverage contract}
    - {id: evict, kind: process, label: justified eviction}
  edges:
    - {from: past, to: selector}
    - {from: selector, to: selected}
    - {from: selected, to: attend}
    - {from: rule, to: evict}
    - {from: evict, to: past, kind: feedback}
~~~

**DERIVED.** A learned selector must be costed before its expensive attention stage. Scoring every historical key with a cheaper representation still scans history. Hierarchical summaries or an index can change that scan, but their construction, updates, persistent metadata and misses become part of the mechanism. Calling the second stage sparse does not establish sublinear total work.

**MATHEMATICALLY-DERIVED.** For a pure causal window of width $w$ at each of $L$ layers, a position can receive information from at most $L(w-1)$ positions back through successive attention edges, apart from other mixing mechanisms. This receptive-field bound is a connectivity statement. It neither guarantees that the network preserves an arbitrary distant fact nor implies direct access to its original representation.

**DERIVED.** Causal global or compressed states must themselves be causally constructed. A summary covering tokens after the query position leaks information even if the summary's index is placed in the past. Likewise, a global token that read future content in one layer can transmit that content later through apparently causal edges. Causality must hold over the entire dependency graph, not only the final sparse mask.

**DERIVED.** Equation 14.11 clarifies why counting retained positions is insufficient. A small set can preserve most probability mass or almost none. Its usefulness depends on logits, values and the query. Measuring omitted mass against a dense reference can diagnose selection, but obtaining that reference incurs dense work and is normally an offline audit rather than a free deployment statistic.

## Algorithm

**DERIVED — bounded selection and coverage audit.**

~~~text
Algorithm 14.3 — Audit sparse visibility and retention
INPUT: query positions, window, globals, selector outputs, block layout, future-use rule
OUTPUT: causal selected sets and a state-retention ledger
STATE: sorted bounded position lists and block ownership records
INVARIANT: selected positions are valid, causal and counted once per defined branch
1. Validate source positions, selector budget and maximum retained history.
2. Merge sorted window, global and selected lists; deduplicate their union.
3. Reject future dependencies, including dependencies hidden in summaries.
4. Map selected positions to physical blocks and count padding separately.
5. Retain every state still permitted by the future-use rule.
6. On bounded fixtures, compare selected attention with an explicit masked reference.
7. Report selector work, summary state, attention work and eviction separately.
~~~

**DERIVED — complexity.** Merging pre-sorted lists is linear in their combined length; sorting $k$ arbitrary selected indices costs $O(k\log k)$. A heap-based top-$k$ selector scanning $S$ fixed-width scores costs $O(S\log k)$ and $O(k)$ auxiliary state, in addition to computing the scores. These are specified alternatives, not a claim that all selectors have that complexity. Bound $S$, $k$, and summary construction explicitly.

## Implementation

**OFFICIAL-DOCUMENTATION — [R14.8](references.md#r148).** FlashAttention exposes window parameters in its documented interface. **OFFICIAL-DOCUMENTATION — [R14.6](references.md#r146).** Hugging Face Transformers documents window-limited cache growth for layers using sliding attention. These occupy *Kernels / numerics / collectives* and *Model definition / adaptation* respectively.

**DERIVED.** PyTorch's *Model / autograd framework* layer supplies a bounded masked reference [R14.5](references.md#r145). A mask declaring fewer valid positions does not by itself prove that a backend skips their arithmetic. Inspect dispatch and allocation separately. A sparse implementation may also need gather buffers, selector logits, integer indices and page tables absent from the mathematical attention state.

**DERIVED.** Training and inference must share the intended coverage rule or document the intervention. Applying a narrower window only at inference changes the trained computation. Native sparse training can adapt representations to its pattern, but adaptation quality is an experimental result. Neither route justifies transferring a benchmark gain from one context distribution to another.

## Experimental design

**PROPOSAL — no quality or timing results reported.**

### Experiment 14.3 — Coverage, selection and retained history

- **Hypothesis:** equal selected-token counts can have different causal coverage, persistent state and task fidelity.
- **Setup:** compare pure local, local-plus-global and learned-selection patterns under explicit retention rules.
- **Independent variables:** window, global count, selected budget, block size and selector representation.
- **Controlled variables:** source tokens, masks, model size reporting, dtype and training/adaptation budget.
- **Dataset/workload:** versioned retrieval, aggregation and multi-hop fixtures with support positions swept across history.
- **Hardware:** record backend, device, memory, topology and runtime.
- **Metrics:** admitted pairs, executed blocks, selector work, cache bytes, evidence retention, task accuracy and phase latency.
- **Baselines:** dense attention and a causal masked oracle on bounded inputs.
- **Expected result:** local capacity saturates only under the specified eviction contract; learned selection need not reduce stored history.
- **Ablation:** remove global paths, hide evidence outside the window, and inject a future-dependent summary.
- **Interpretation:** attribute failures to visibility, selection or computation before attributing them to language-model reasoning.
- **Threats to validity:** unequal training, duplicated positions, summary leakage, block padding and benchmark shortcuts.

## Observations

**What the paper claims.** **PAPER-REPORTED — R14.3, R14.4.** Different sparse designs combine local and broader information paths.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** Coverage and retention determine different counts; omitted probability mass bounds one restricted output error.

**What we infer.** **DERIVED.** Sparse-read claims must expose selector cost and future-state obligations.

**What remains unknown.** **UNVERIFIED.** Task quality and physical savings for any proposed pattern require controlled execution.

## Failure modes

~~~figure
id: fig-14.11
kind: stat-panel
title: Sparse attention cost inventory
caption: Eq. 14.9 defines admitted positions but does not include selector execution or establish which past state can be deleted.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-14.9
alt: Report selection work, executed attention blocks, retained history and summary metadata separately.
spec:
  header: SPARSITY AUDIT
  rows:
    - {key: selector, value: score and index work}
    - {key: attention, value: admitted and executed pairs}
    - {key: persistent state, value: future-readable history}
    - {key: auxiliary state, value: summaries and metadata}
~~~

> **Failure mode — selection mistaken for deletion.** **DERIVED.** *Symptom:* a later query cannot retrieve previously unselected evidence. *Cause:* eviction without a future-use guarantee. *Detection:* delayed retrieval fixtures. *Mitigation:* retain or reconstruct all required state.

> **Failure mode — hidden causal leakage.** **DERIVED.** *Symptom:* training loss improves with access to unavailable information. *Cause:* a compressed/global state includes future tokens. *Detection:* perturb future inputs and trace dependencies. *Mitigation:* enforce causality during state construction.

## Siblings

**DERIVED.** Sliding windows impose a fixed locality prior; global tokens add designated paths; learned selection spends computation to choose query-dependent paths. [GQA](14-1-mha-mqa-and-gqa.md) and [MLA](14-2-latent-attention.md) alter per-position representations instead. [Exact IO-aware execution](14-5-exact-versus-approximate-computation.md) can preserve dense visibility while reducing temporary traffic.

## Extensions

**DERIVED.** Multimodal blocks require coordinates beyond token offsets: frames, patches and time boundaries can define locality. Retrieval-conditioned attention can supply external states, but missing source evidence remains missing even if the attention kernel is exact. Routing and retrieval policy belong in their downstream chapters.

## Limitations

**DERIVED.** Pair counts and one-layer error bounds do not determine global quality. Sparse patterns can alter gradients and learned representations. Hardware utilization, communication, energy and financial cost remain workload-dependent and cannot be read from asymptotic sparsity alone.

## Reproducibility

**DERIVED.** Preserve the exact pattern, causal construction, selector weights and budget, position ordering, deduplication rule, summary contents, block size, padding, retention boundary and backend revision. Report whether the pattern was trained natively, adapted, or imposed only at inference.

## References

[R14.3](references.md#r143); [R14.4](references.md#r144); [R14.5](references.md#r145); [R14.6](references.md#r146); [R14.8](references.md#r148).
