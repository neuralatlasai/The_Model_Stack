---
id: ms.section.49.3
entity_type: section
title: Search infrastructure
volume: 3
part: 9
chapter: 49
section: 49.3
slug: 49-3-search-infrastructure
parent: ms.chapter.49
prev_sibling: ms.section.49.2
next_sibling: ms.section.49.4
children: []
prerequisites: [ms.chapter.6, ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.chapter.12, ms.chapter.18, ms.chapter.48, ms.section.49.2]
downstream: [ms.chapter.50, ms.chapter.51, ms.chapter.52, ms.chapter.53, ms.chapter.55, ms.chapter.63]
related: []
relations: []
axes: {lifecycle: [inference, evaluation, serving], mechanism: [evidence_access], feedback_setting: [], modality: [text, image]}
papers: [P39, P40]
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 49.3 — Search infrastructure


## Scope

[DERIVED] Search infrastructure realizes a fixed representation/metric contract under finite memory, latency, update and access constraints. We cover exhaustive search, HNSW, IVF and product quantization, plus identity, deletion and replication. The baseline is an exact scan over eligible vectors. Success separates approximation to that scan from relevance to the user's evidence need; neither metric substitutes for the other.

## Why this exists

[DERIVED] Computing every query–document distance is straightforward and often competitive for small or highly filtered collections. At larger scale, reading the complete vector matrix becomes expensive. Two independent interventions reduce that work: visit fewer vectors, or store/compare cheaper representations. HNSW and IVF prune candidates; PQ compresses vectors. Combining them creates two error sources that require separate diagnosis.

[PAPER-REPORTED] The Faiss library report explicitly separates encoding from non-exhaustive search and describes their compositions [R49.5, §§3–5]. [DERIVED] A fast compressed scan may inspect every code and still be approximate relative to original embeddings. Conversely, an IVF index storing full vectors can recover exhaustive results when every relevant list is actually scanned. “Exact index” and “ANN index” are insufficient descriptions without their runtime settings.

## Intuition

[DERIVED] Graph search follows local geometric links toward a query; coarse partitioning visits selected regions; compression replaces coordinates with codebook approximations. A missed neighbor can therefore be absent from the visited set, misordered within it, filtered incorrectly or stale. These mechanisms have different remedies: wider exploration, better codes/exact refinement, correct policy enforcement or snapshot repair.

[DERIVED] Infrastructure must retain the mapping from vector IDs to evidence revisions. Returning the correct vector distance with the wrong source mapping is a correctness failure. Replicas need the same embedding/index/policy identity, not merely the same vector count. A revoked unit remaining in a replica must remain unavailable even before physical index compaction finishes.

## Formulation

| Local symbol | Meaning |
|---|---|
| $n_c,d_e$ | Number of stored vectors and embedding dimension |
| $d(q,u)$ | Declared distance, with smaller values preferred |
| $\mathcal V(q)$ | Vectors actually visited by the search |
| $k$ | Requested result count, positive integer |
| $n_{\rm list},n_{\rm probe}$ | IVF list count and lists selected per query |
| $m_p,b_p$ | PQ subspaces and bits per subspace; $m_p$ divides $d_e$ |
| $\ell_g,m_\ell$ | HNSW level and positive level-distribution scale |
| $M_g$ | Graph degree budget, distinct from memory quantities |

[DERIVED] Exact eligible search is

$$
\mathcal T_k(q)=
\operatorname{TopK}_{u\in\mathcal C_{v,p,t}}
[-d(q,u)].
$$
*(Eq. 49.11)*

A tie policy, numeric precision and transformed-vector identity are part of this definition. For fewer than $k$ eligible units, return the available count explicitly.

[MATHEMATICALLY-DERIVED] Let $\tilde d(q,u)$ approximate $d(q,u)$ with uniform error at most $\epsilon_d$ for all visited candidates. If the exact kth-versus-next distance gap exceeds $2\epsilon_d$, order at that boundary is preserved **within the visited set**. Candidate omission is not bounded by this statement:

$$
d(q,u_{k+1})-d(q,u_k)>2\epsilon_d
\ \Longrightarrow\
\tilde d(q,u_k)<\tilde d(q,u_{k+1}).
$$
*(Eq. 49.12)*

## Mechanism

### Methodology

[DERIVED] Exhaustive search reads each eligible vector, computes the declared distance and maintains top-k. With dense vectors, arithmetic is $O(n_cd_e)$ per query and an ordinary heap adds $O(n_c\log k)$ selection work; tiled matrix multiplication/top-k can have different constants and auxiliary storage. Query batches amortize memory reads and improve device utilization. Small eligible subsets can make a filtered exact scan preferable to global ANN plus aggressive overfetch.

[PAPER-REPORTED] HNSW inserts vectors into exponentially thinned graph levels, searches greedily in upper levels and uses a bounded best-candidate set at the base level; neighbor selection favors geometric diversity [R49.4, Algorithms 1–5; R49.5, §5.2]. [DERIVED] Degree, construction exploration and query exploration are different controls. Increasing the retained candidate set can visit more nodes; it does not itself set an exact number of distance evaluations.

[DERIVED] Construction samples $\ell_g=\lfloor-m_\ell\log U\rfloor$ for $U$ uniform on $(0,1)$. For integer $h\ge0$,

$$
\Pr(\ell_g\ge h)=e^{-h/m_\ell},
\qquad
\mathbb E[\ell_g+1]
=\frac1{1-e^{-1/m_\ell}}.
$$
*(Eq. 49.13)*

[MATHEMATICALLY-DERIVED] Summing level-membership probabilities gives expected linear total memberships at fixed $m_\ell$. A union bound gives $\Pr(\max\ell_g\ge h)\le n_ce^{-h/m_\ell}$, so high-probability height grows logarithmically. This height bound does not prove logarithmic query work: routing can inspect many nodes, and the original paper's stronger argument uses idealized graph assumptions [R49.4, §4.2].

[DERIVED] Insertion descends to the new node's level, explores candidate neighbors and adds bidirectional connections subject to degree pruning. A diversity rule can preserve links between clusters that nearest-neighbor-only selection would omit. At query time, a frontier orders unexpanded candidates and a result set retains the best explored points. Termination when the nearest frontier item is worse than the retained worst is a heuristic relative to undiscovered graph regions. A separate finite visit/deadline cap bounds operational work but may reduce recall further.

[DERIVED] For a finite graph, visited-state storage can reach $O(n_c)$ and traversal can inspect all stored edges. With a per-level degree cap and random levels, expected graph storage is $O(n_cM_g)$, plus vector storage and level/offset metadata. This is a storage statement under the level model, not a worst-case logarithmic search guarantee. Pointer/ID chasing can be memory-latency sensitive even when distance arithmetic is cheap.

[DERIVED] IVF trains coarse centroids, assigns each document vector to a list, and probes selected lists for each query. The exact scanned count is $\sum_{j\in\mathcal L(q)}n_j$, where $n_j$ is list occupancy. The familiar $n_c n_{\rm probe}/n_{\rm list}$ expression needs balanced lists or an appropriate selection model. Popular dense regions can produce long lists and tail latency. If a query's target lies in an unvisited list, exact rescoring of visited vectors cannot recover it.

[MATHEMATICALLY-DERIVED] In a deliberately restricted one-probe model where query assignment probabilities equal corpus occupancy $n_j/n_c$, the expected scanned count is

$$
\mathbb E[n_{\rm scan}]=
\frac{\sum_jn_j^2}{n_c}
=\frac{n_c}{n_{\rm list}}
\left(\frac{n_{\rm list}\sum_jn_j^2}{n_c^2}\right).
$$
*(Eq. 49.14)*

The parenthesized imbalance factor is at least one by Cauchy–Schwarz. This derivation is conditional on the assignment model; an arbitrary query distribution can concentrate on even more expensive lists.

[PAPER-REPORTED] Product quantization trains separate codebooks on vector subspaces and evaluates asymmetric distances against the uncompressed query [R49.5, §4.1, compressed-domain search]. [DERIVED] For positive integer $m_p,b_p$, $m_p$ equal subspaces, $2^{b_p}$ centroids per subspace and code $c_j(u)$, the reconstructed vector concatenates the selected centroids. With each vector's packed code rounded up to whole bytes, code storage is

$$
M_{\rm codes}=n_c\left\lceil m_pb_p/8\right\rceil\ \text{bytes}.
$$
*(Eq. 49.15)*

[OFFICIAL-DOCUMENTATION] The inspected Faiss ProductQuantizer::set_derived_values computes this byte-rounded code_size and checks subspace divisibility [R49.19, ProductQuantizer.cpp lines 61–71 in raw source]. [DERIVED] The ideal bit payload $n_cm_pb_p/8$ equals this expression only for byte-aligned per-vector codes. Codebooks contain $d_e2^{b_p}$ scalar coordinates, not $m_pd_e2^{b_p}$. IDs, IVF centroids/list headers, direct maps, alignment, original vectors retained for refinement and replicas are additional. Codebook training is data-dependent iterative clustering; finite iteration counts bound work without establishing a global optimum.

[DERIVED] Squared-L2 asymmetric distance uses per-query lookup tables:

$$
\tilde d(q,u)=
\sum_{j=1}^{m_p}
\|e_q^{(j)}-c_{j,c_j(u)}\|_2^2.
$$
*(Eq. 49.16)*

Building the tables costs $O(d_e2^{b_p})$ arithmetic; scanning one code costs $O(m_p)$ lookups/additions. Residual IVF-PQ quantizes the vector relative to its coarse centroid, so the query/centroid relationship enters the lookup path. L2 and inner-product implementations have distinct algebra and numeric behavior; do not reuse a distance table under a different metric.

[DERIVED] PQ minimizes a reconstruction surrogate, which need not preserve nearest-neighbor margins. Orthogonal preprocessing preserves the original metric while changing subspace quantization geometry; dimensional reduction changes the metric itself. Exact refinement can remove code-ordering error among retained candidates, at the cost of storing/fetching original vectors, but cannot repair search-space omissions.

[MATHEMATICALLY-DERIVED] If IVF-Flat probes all distinct lists, scans all entries with no early code cap, applies the same eligibility predicate and uses the same numeric metric/tie policy, its candidate union equals the eligible corpus:

$$
\bigcup_{j=1}^{n_{\rm list}}
(\operatorname{List}_j\cap\mathcal C_{v,p,t})
=\mathcal C_{v,p,t}.
$$
*(Eq. 49.17)*

Thus exhaustive list scanning recovers the exact candidate search. This does not hold for compressed distances or missing/stale entries.

[OFFICIAL-DOCUMENTATION] Current Faiss documents different update semantics: sequential removals can shift IDs; IVF uses explicit IDs; DirectMap.Array forbids removal, while Hashtable plus IDSelectorArray can avoid a full deletion scan. Its HNSW implementation does not support removal [R49.6–7]. [DERIVED] These are implementation-specific constraints, not impossibility results for every graph index. Tombstones, rebuilds and version swaps must preserve immediate logical revocation separately from later physical compaction.

[OFFICIAL-DOCUMENTATION] Faiss supports on-disk IVF lists and warns that its demonstration RPC is not production-secure [R49.9]. Its loader does not validate arbitrary index artifact integrity [R49.8]. [DERIVED] Authenticate manifests and treat serialized indexes as executable-system inputs. Replication adds storage and refresh bandwidth; sharding adds fan-out, partial-failure and merge costs. A global exact top-k can be merged from exact per-shard top-k over disjoint complete partitions, but ANN shard errors and missing replicas remain visible.


```figure
{
  "id": "fig-49.9",
  "kind": "diagram",
  "title": "PQ code storage",
  "caption": "Index construction creates candidate-routing and codec state. Query execution first chooses a search region, then compares and refines candidates; exact rescoring cannot recover a region never visited.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-49.15",
  "alt": "Embedding contract leads to Index training leads to Candidate exploration leads to Code distance leads to Authorized returned IDs.",
  "spec": {
    "nodes": [
      {
        "id": "n0",
        "label": "Embedding contract",
        "kind": "process"
      },
      {
        "id": "n1",
        "label": "Index training",
        "kind": "process"
      },
      {
        "id": "n2",
        "label": "Candidate exploration",
        "kind": "process"
      },
      {
        "id": "n3",
        "label": "Code distance",
        "kind": "process"
      },
      {
        "id": "n4",
        "label": "Authorized returned IDs",
        "kind": "state"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n1",
        "to": "n2"
      },
      {
        "from": "n2",
        "to": "n3"
      },
      {
        "from": "n3",
        "to": "n4"
      }
    ]
  }
}
```


## Algorithm

### Algorithm 49.3 — Budgeted search with coherent evidence identity

[DERIVED] Inputs are query vector/metric, corpus-policy snapshot, $k$, finite exploration/refinement budgets and index manifest. Output is a ranked authorized set plus exhaustion status. All failure operators terminate without publishing unauthorized or mismatched payloads.

$$
\begin{aligned}
1.\;&\operatorname{ValidateMetricDimensionRevisionAndPolicy};
\quad\text{mismatch}\Rightarrow\operatorname{Fail}.\\
2.\;&\mathcal V\leftarrow\operatorname{ExploreFlatGraphOrLists}
(q,\operatorname{FiniteBudget});
\quad\operatorname{RecordVisitedAndExhausted}.\\
3.\;&\mathcal V_{\rm ok}\leftarrow
\operatorname{FilterCurrentEligibilityAndTombstones}(\mathcal V).\\
4.\;&\tilde s\leftarrow\operatorname{ScoreWithDeclaredCodec};
\quad\text{nonfinite}\Rightarrow\operatorname{FailAffectedQuery}.\\
5.\;&\mathcal A\leftarrow\operatorname{BoundedCandidates}(\tilde s);
\quad\operatorname{OptionalExactRefine}(\mathcal A).\\
6.\;&\operatorname{ResolveStableRevisionsAndReauthorizeAtReturn};
\quad\operatorname{TopKAndReturnWithShortfallStatus}.
\end{aligned}
$$

[DERIVED] An internal visited ID is not permission to expose its text or metadata. Post-filtering can leave fewer than k results; bounded overfetch can improve coverage without guaranteeing it. Graph traversal through filtered nodes and safe returned content are different implementation obligations.

## Implementation

[OFFICIAL-DOCUMENTATION] Faiss is outside the numbered stack, routed through DPR's documented index integration. At commit a643100c88dbf3a0f06f23fa8d9d7c0b76885200, IndexIVF::search caps nprobe at nlist and delegates to search_preassigned; that function reads selector/max_codes and checks supported combinations [R49.19, lines 399–564]. This is static source inspection, not executed compatibility or performance.

[DERIVED] PyTorch (**Model / autograd framework**) and Hugging Face Transformers (**Model definition / adaptation**) produce embeddings upstream; their presence does not certify the index tuple. Record CPU/GPU codec differences, source dtype, thread count, device memory, transfer and warm/cold cache state.

## Experimental design

### Reported experiments

[PAPER-REPORTED] HNSW's historical Figure 10 reports approximately three-minute construction for 10M 128-dimensional SIFT vectors, $M_g=16$, efConstruction=100 on four ten-core 2.4GHz Xeon E5-4650 v2 CPUs. Figure 7 compares clustered/nonclustered neighbor selection; §4.2 limits its scaling analysis [R49.4]. Exact precision and a current build are not disclosed.

[PAPER-REPORTED] Faiss's report sweeps compression/pruning operating points rather than one universal index choice; Figures 3–5 and §5.4 separate codec error, list settings and search time [R49.5]. No local recall/latency frontier was executed.

## Observations

**What the paper claims.** [PAPER-REPORTED] Graph hierarchy and candidate/codec choices improve specified search tradeoffs [R49.4–5].

**What the evidence shows.** [PAPER-REPORTED] HNSW's diversity heuristic avoids the high-recall failure seen for nearest-neighbor-only links on the source's clustered data. Faiss demonstrates multiple Pareto regimes rather than one dominating configuration.

**What we infer.** [DERIVED] Choose candidates using the deployed embedding distribution, query/filter population and update workload. Neighbor recall alone cannot establish evidence relevance or authorization.

**What remains unknown.** [UNVERIFIED] Current hardware, deletion lag, replica consistency and filter-sensitive tails have not been measured.

## Failure modes

> **Failure mode — Exact refinement mistaken for exact retrieval.** [DERIVED] *Symptom:* missed relevant vectors remain absent despite precise rescoring. *Cause:* the true neighbor never entered the candidate set. *Detection:* compare visited IDs with exhaustive eligible search. *Mitigation:* diagnose exploration and codec error separately.

## Siblings

[DERIVED] Flat search spends linear reads for a clear reference; HNSW spends graph memory and irregular accesses; IVF spends centroid/list selection; PQ spends distortion to reduce code bytes. Compositions must be named by both codec and exploration policy.

## Extensions

### Improvements

[PAPER-REPORTED] The Faiss report's compositional benchmarking and refinement expose the mechanism behind speed/memory tradeoffs [R49.5, §§3.5,5.4]. [OFFICIAL-DOCUMENTATION] Current source adds explicit search parameters and update paths [R49.19]. Neither is a measured 2026 superiority claim.

## Limitations

[DERIVED] Distribution drift can invalidate centroid/codebook training and graph operating points. A genuine open question is how to retain predictable filtered recall and update cost under changing embeddings and selective policies. Evidence requires joint query/filter/update traces, not static unfiltered vector benchmarks.

## Reproducibility

[UNVERIFIED] Preserve vectors, exact baseline, metrics/ties, seeds, training sample, insertion order, codec, lists/graph settings, source commit, policy/tombstone epochs and replica manifests. Physical deletion and immediate logical revocation must be audited separately.


```figure
id: fig-49.10
kind: calculator
title: PQ code storage instrument
caption: This counts code bytes only; IDs, centroids, graph, metadata and replicas are additional.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-49.15
alt: Vector count and byte-rounded subspace codes determine PQ code storage in GiB before IDs and other index state.
states:
  - {anchor: formulation, label: Codec, note: Inspect the stated equation domain.}
  - {anchor: mechanism, label: Candidates, note: Costs and correctness have distinct boundaries.}
  - {anchor: failure-modes, label: Updates, note: No empirical result is generated by the calculator.}
spec:
  tex: 'M_{codes}/2^{30}=n_c\lceil m_pb_p/8\rceil/2^{30}'
  equation: "49.15"
  inputs:
    - {symbol: count, label: stored vectors, default: 1000000, min: 1, max: 100000000, format: integer}
    - {symbol: subspaces, label: PQ subspaces, default: 32, min: 1, max: 128, format: integer}
    - {symbol: bits, label: bits per subspace, default: 8, min: 1, max: 16, format: integer}
  outputs:
    - {symbol: result, label: packed code GiB, formula: "count*ceil(subspaces*bits/8)/1073741824", format: fixed2}
```

```figure
id: fig-49.11
kind: stat-panel
title: PQ code storage boundaries
caption: These are mechanism boundaries, not benchmark measurements.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-49.15
alt: Codec distortion, omitted candidates and update lag are separate index error boundaries.
spec:
  header: EVIDENCE CONTRACT
  rows:
    - {key: codec, value: compression error}
    - {key: candidates, value: non-exhaustive search error}
    - {key: updates, value: version and tombstone lag}
```


## References

[R49.4](references.md#r49-4), [R49.5](references.md#r49-5), [R49.6](references.md#r49-6), [R49.7](references.md#r49-7), [R49.8](references.md#r49-8), [R49.9](references.md#r49-9), [R49.19](references.md#r49-19).
