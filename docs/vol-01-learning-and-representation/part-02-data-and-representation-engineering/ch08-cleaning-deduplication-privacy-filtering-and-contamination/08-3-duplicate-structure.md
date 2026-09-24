---
id: ms.section.8.3
entity_type: section
title: Duplicate structure
short_title: Deduplication
volume: 1
part: 2
chapter: 8
section: 8.3
slug: 08-3-duplicate-structure
parent: ms.chapter.8
prev_sibling: ms.section.8.2
next_sibling: ms.section.8.4
children: []
prerequisites: [ms.section.8.1, ms.section.2.2, ms.section.6.2]
downstream: [ms.section.8.4, ms.section.8.5, ms.section.8.6, ms.section.9.6, ms.section.12.2, ms.section.24.5]
related: [ms.section.9.1]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P06}
  - {type: supported_by, target: paper.P07}
  - {type: supported_by, target: paper.P04}
  - {type: supported_by, target: paper.P05}
  - {type: supported_by, target: paper.P03}
axes:
  lifecycle: [data]
  mechanism: [deduplication, hashing, locality_sensitive_hashing, suffix_array, bloom_filter]
  feedback_setting: []
  modality: [text, code]
papers: [P02, P03, P04, P05, P06, P07]
implementations: []
benchmarks: []
datasets: [dataset.fineweb, dataset.refinedweb, dataset.dolma, dataset.dclm-baseline, dataset.c4]
status:
  maturity: established
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED]
  empirically_observed: false
word_count_target: 2500
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 8.3 Duplicate structure

## Scope

Objective: model duplication in a corpus as a graph over documents and substrings, derive the detection probability of banded MinHash (the S-curve) and the memory of suffix-array and Bloom-filter detectors, and give the algorithms from shingling to connected components with their cost lines. Baseline: R8.3's two tools (exact substring at 50 tokens, MinHash with 9,000 hashes) as reused by P04, and P06's per-snapshot MinHash with 112 hashes. Success criterion: the reader can, for any (n, b, r), state which similarity range is caught, what it costs in hashes, bytes and comparisons, and what per-snapshot versus global scope changes. Boundaries: why duplicates matter for the partition contract is owned by [§6.2](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-2-data-partitioning.md); repetition as a mixture decision by [§9.6](../ch09-data-mixtures-curricula-and-sample-efficiency/09-6-data-scaling-limits.md); distributed execution by [§12.2](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-2-transformation-execution.md).

## Why this exists

What failed before was the belief that a crawl is a sample of distinct documents. R8.3 found in C4 "a single 61 word English sentence that is repeated over 60,000 times" (61,036 times in train, 61 in validation) and that "over 1% of the unprompted output of language models trained on these datasets is copied verbatim from the training data" (PAPER-REPORTED). R8.2 found duplicated paragraphs "represent 70% of the text" of a Common Crawl snapshot (PAPER-REPORTED). The bottleneck is that the naive detector — all-pairs comparison — is quadratic in documents, so the field moved to two sub-quadratic structures: locality-sensitive hashing over n-gram sets for whole-document near-duplicates, and suffix arrays for exact repeated substrings. The dominant constraint then became scope: P06 found that deduplicating 96 snapshots against each other "removed as much as 90% of the original base filtered data" from the oldest ones and that the survivors were worse than what was removed (PAPER-REPORTED), so the question is no longer whether to deduplicate but over which population. What changed is that deduplication is now treated as a parameterised filter with a measurable detection curve, ablated at matched tokens like any other stage.

## Intuition

Physically, a near-duplicate detector is a hash function whose collisions are informative. A document is reduced to a set of overlapping word n-grams (shingles); two documents that share most of their shingles are near-duplicates. A random hash applied to every shingle, keeping only the minimum, produces one number whose equality across two documents has probability exactly their Jaccard similarity; k such numbers estimate it with variance J(1−J)/k; grouping them into bands turns the estimate into a candidate test whose probability of firing is a steep function of J. The cost is k hash evaluations per shingle per document, k words of signature per document, and one hash-table probe per band. An exact-substring detector is different: it sorts all suffixes of the concatenated corpus so that any two occurrences of the same long substring become neighbours, at 8 bytes per token of index (R8.3, PAPER-REPORTED). Heuristically one says the model "sees the same page twice"; the physical statements are that duplicates re-weight the training distribution by their multiplicity and that memorised output rate rises superlinearly with that multiplicity (R8.6).

## Formulation

Let each document x be represented by its shingle set S_n(x) ⊂ Σⁿ of word n-grams.

$$
J(x, y) = \frac{|S_n(x) \cap S_n(y)|}{|S_n(x) \cup S_n(y)|}
$$
*(Eq. 8.6)* where n = shingle length in words (5 in R8.3, P04, P06, P07; 13 in R8.1).

> **Definition — MinHash signature and banding.** For hash functions h_1..h_k drawn from a family that induces a random permutation of shingle space, the signature is m_i(x) = min_{s ∈ S_n(x)} h_i(s), i = 1..k. The signature is split into b bands of r rows (k = b·r); x and y are *candidates* if m_i(x) = m_i(y) for every i in at least one band.

$$
P\big[m_i(x) = m_i(y)\big] = J(x, y)
$$
*(Eq. 8.7)* where the equality holds for a uniformly random permutation of the shingle universe; hash families in practice approximate it (R8.18 states the theorem, KNOWN; the approximation is ASSUMED).

$$
P\big[\text{candidate} \mid J = s\big] = 1 - (1 - s^{r})^{b}
$$
*(Eq. 8.8)* where r = rows per band, b = bands; this is the S-curve.

$$
s_{1/2} \approx \left(\tfrac{1}{b}\right)^{1/r}
$$
*(Eq. 8.9)* where s_{1/2} is the similarity at which the candidate probability is about one half; exact when b·s^r = ln 2 under the small-s^r approximation.

> **Definition — near-duplicate cluster.** A connected component of the graph G = (documents, {(x, y) : candidate(x, y) and, optionally, J(x, y) ≥ τ}); one representative per component is kept.

> **Definition — exact-substring duplicate.** A span of length ≥ k tokens (bytes) that occurs at two distinct positions of the concatenated corpus S; found as adjacent entries of the suffix array A of S sharing a prefix of length ≥ k.

> **Definition — cross-split / cross-source duplicate.** A duplicate pair whose members lie in different partitions (train/validation/test) of one corpus, or in different feeds (crawl snapshots, mirrors, forks) of one source.

Bloom-filter membership for n-gram deduplication (P05, P07): with m bits, h hash functions and n inserted items, the false-positive rate is ε ≈ (1 − e^{−hn/m})^h; the optimal h and m for a target ε are

$$
h^\ast = -\frac{\ln \varepsilon}{\ln 2}, \qquad m^\ast = -\frac{n \ln \varepsilon}{(\ln 2)^2}
$$
*(Eq. 8.10)* where n = number of n-grams inserted (order of the corpus token count); P07 Appendix L gives the h^* formula and solves m by binary search (PAPER-REPORTED); the closed form is MATHEMATICALLY-DERIVED.

> **Assumption.** Duplicates are harmful in proportion to their multiplicity · *sensitivity:* R8.6 reports regeneration rate "superlinearly related to a sequence's count in the training set" (PAPER-REPORTED) but P06 reports that removing small clusters (fewer than ~100 members) can hurt (PAPER-REPORTED); if the second holds generally, the right policy is cluster-size-aware down-weighting ([§9.6](../ch09-data-mixtures-curricula-and-sample-efficiency/09-6-data-scaling-limits.md), R8.12's rehydration), not removal.

## Mechanism

**Exact hashes.** The cheapest detector hashes a normalised unit and drops repeats. CCNet lower-cases, replaces digits by 0, strips punctuation and accents, and keys each paragraph by "the first 64-bits of SHA-1"; it reports 42 % of characters remaining after deduplication against one 5 GB shard and 28 % against 100 shards, with 50 shards' hashes amounting to "1.5B unique hashes, making up 13.5GB on disk" (R8.2 §3.1, §4, PAPER-REPORTED). Dolma runs three exact stages in order — URL deduplication "filters 53.2% of documents", exact document deduplication "14.9% of URL-deduped documents", exact paragraph deduplication "18.7% of paragraphs" — using a Rust Bloom filter, and performs paragraph removal last because it "risks disrupting content analysis" (P05 §5.4, PAPER-REPORTED). C4 "discarded all but one of any three-sentence span occurring more than once" (P02, PAPER-REPORTED). Cost line: one hash per unit (O(bytes)); memory a hash set of 8 bytes per unique unit (13.5 GB for 1.5 B paragraph hashes per R8.2) or a Bloom filter of m^* bits per Eq. 8.10 — P07 states that at 1 T tokens a false-positive rate of 10⁻¹² "would require 6.5TB of RAM" and argues a rate of 0.01 suffices (PAPER-REPORTED); communication is the broadcast of the hash set or filter to every worker.

**n-gram methods and MinHash.** Gopher computed "13-gram Jaccard similarities" with whitespace normalised and punctuation ignored and removed one of any pair above 0.8 (R8.1 §A.1.1, PAPER-REPORTED); the same 13-gram test at 0.8 removed training documents resembling its test sets. The Pile used MinHashLSH "with 10 hash functions for each Minhash and an approximate Jaccard similarity of 0.5", giving 28 % duplicates in OpenWebText2 and 26 % in Common Crawl (P03 Appendix D.2, PAPER-REPORTED); GPT-3 used Spark's MinHashLSH "with 10 hashes", decreasing dataset size "by an average of 10%" (R8.7 Appendix A, PAPER-REPORTED). R8.3 used 5-grams, k = 9,000, b = 20 rows per band and r = 450 bands in its notation, followed by an edit-similarity check above 0.8, and reports its S-curve as 1 − (1 − s^b)^r (PAPER-REPORTED); P04 reused those parameters ("9,000 hashes per document, calculated over 5-grams") and reports match probabilities of 76 % at similarity 0.75 and 99.4 % at 0.8, noting that the 10-hash setting of P03 "resulted in lower deduplication rates and worsened model performance" (P04 §3.3, Appendix G.3.1, PAPER-REPORTED). P06 chose k = 112 as 14 buckets of 8, reporting candidate probabilities of "56%, 77%, 92% and 98.8%" at similarities 0.7, 0.75, 0.8 and 0.85 and observing that R8.3's setting gives "a steeper, more well-defined cut off" at the cost of 80× the hashes (P06 §3.4, Appendix E.1, PAPER-REPORTED). P07 used 1,395 permutations "split into 93 buckets of size 15", chosen "programmatically to mimic the Jaccard similarity plots" of the 9,000-hash setting (P07 Appendix L.1, PAPER-REPORTED). StarCoder used 5-grams at Jaccard 0.7 for code (R8.10 §3.1, PAPER-REPORTED).

Eq. 8.8 reproduces all reported probabilities, which is the check that the formula and its variable naming are right:

| Setting | k | b bands × r rows | s_{1/2} (Eq. 8.9 / exact) | P at s = 0.7 | 0.75 | 0.8 | 0.85 |
|---|---|---|---|---|---|---|---|
| P06 FineWeb | 112 | 14 × 8 | 0.719 / 0.685 | 0.564 | 0.772 | 0.924 | 0.988 |
| R8.3 / P04 | 9,000 | 450 × 20 | 0.737 / 0.723 | 0.302 | 0.760 | 0.995 | 1.000 |
| P07 DCLM | 1,395 | 93 × 15 | 0.739 / 0.721 | 0.358 | 0.714 | 0.964 | 1.000 |

The table is MATHEMATICALLY-DERIVED from Eq. 8.8; its agreement with P06 (56/77/92/98.8 %) and P04 (76 %/99.4 %) is the cross-check. Note the naming: R8.3 and P04 write b for rows per band and r for bands, the reverse of R8.18 and of this section; P04's main text says "20 buckets of 450 hashes" while its Appendix G.3.1 defines 450 buckets of 20 hashes, and only the second reading reproduces the stated 76 %/99.4 % (UNVERIFIED which the implementation used; the chapter adopts the appendix reading). The 9,000-hash curve is steeper — it moves from 0.30 to 0.995 between s = 0.7 and 0.8 — which is what "well-defined cut off" means, and it costs 80× the hash evaluations and signature bytes of the 112-hash curve. Cost line for signatures: |S_n(x)|·k hash evaluations per document (a 1,000-word document has ~1,000 5-gram shingles, so 112 K evaluations at k = 112 and 9 M at k = 9,000); k × 4 or 8 bytes of signature per document (datatrove supports 32- or 64-bit hash precision, R8.16); 10¹⁰ documents at 112 × 8 bytes is ~9 TB of signatures (DERIVED, illustrative); banding costs b hash-table probes per document and the candidate verification costs one Jaccard or edit-similarity computation per candidate pair — R8.3 bounds the total at O(N) documents under fixed b, k and document length (PAPER-REPORTED).

**Near-duplicate clusters.** Candidate pairs form a graph; both P04 ("if documents A and B match in one bucket and B and C in another, A-B-C becomes a cluster") and P06 ("transitive clustering") take connected components and keep one random document per component (PAPER-REPORTED). datatrove implements this as a union-find with path compression in its third MinHash step, joining the smaller root under the larger "to keep sets shallow" (R8.16 `MinhashDedupCluster`, OFFICIAL-DOCUMENTATION). Transitivity is a choice: a chain of pairwise-similar documents can connect two documents with low mutual similarity, and the component then discards all but one. FineWeb2 records the component size with the kept document and uses it for rehydration (R8.12 §4.5, PAPER-REPORTED). Cost line: union-find is near-linear in candidate pairs; memory one parent pointer per document that appears in any pair.

**Suffix-array exact substrings.** R8.3 concatenates the corpus into S, builds its suffix array A in linear time, and scans adjacent entries for shared prefixes of at least k = 50 BPE tokens, which "corresponds to an average of 127 characters or 25 words" in a later analysis (R8.5, PAPER-REPORTED); the array needs "just 8 bytes per input token", construction is parallelised by partitioning into K splits and merging, and the released implementation requires "a machine with >600GB of RAM" for C4 at ~300 GB (R8.3 §4.1.1, Appendix; R8.30, PAPER-REPORTED / OFFICIAL-DOCUMENTATION). Exact-substring removal alters documents; P04 tested cutting the span, masking its loss, and dropping the document, and found no significant difference in zero-shot performance (P04 Appendix G.3.2, PAPER-REPORTED). R8.3 reports EXACTSUBSTR removes 7.18 % of C4's tokens and that "77% of the training examples that NEARDUP removes from C4 have at least one verbatim length-50 match" (PAPER-REPORTED). Cost line: O(|S|) time and 8|S| bytes of index in RAM (P07 notes the implementation "requires loading the entire corpus into RAM", PAPER-REPORTED), which is why DCLM replaced it by a Bloom filter for pools "surpassing 10TB".

**Bloom-filter near-duplicates.** P07's BFF tokenises each document, splits paragraphs on `\n`, and for each paragraph checks n-grams of size `min_ngram_size..max_ngram_size` against the filter, removing a paragraph when more than a `threshold` fraction of its n-grams were seen and removing the document when the contained-to-total ratio exceeds the threshold; it settled on min and max n-gram size 13 after a size of 5 "caused a worse performance on MMLU", uses ε = 0.01, and bounds the probability of falsely removing a 100-n-gram document with 60 seen n-grams at threshold 0.8 below 10⁻⁸ by a Hoeffding argument (P07 Appendix L.1, PAPER-REPORTED). BFF and MinHash "define duplicates in different ways: MinHash performs document-level deduplication at a document vs. document level, whereas BFF performs document-level deduplication at a document vs. corpus level", and the two were "within 0.2 CORE percentage points at the 7B-2x scale" (P07 §4.3, Appendix L, PAPER-REPORTED). Cost line: m^* bits from Eq. 8.10 — for n = 10¹² n-grams and ε = 0.01, m^* ≈ 9.6 × 10¹² bits ≈ 1.2 TB (DERIVED from Eq. 8.10; P07's 6.5 TB at ε = 10⁻¹² is the same formula at twelve times the −ln ε) — and h^* ≈ 7 hash probes per n-gram; the filter is a single shared structure, so parallelism means sharding the corpus (P07 used 10 shards at 7B-2x) at a cost in recall across shards.

**Scope: cross-split and cross-source.** R8.3 found near-duplicates of 4.6 % of C4's validation set and 14.4 % of RealNews' in their training sets, and "prioritized keeping a copy in the test or validation set and removing it from the train set" (PAPER-REPORTED) — the detection side of the §6.2 partition contract. Cross-source duplication is dominated by re-crawls: P04 found "CommonCrawl dumps had significant overlap, with URLs being revisited across dumps despite no change in content" and deduplicated on 100 parts each containing a hundredth of every dump while carrying kept-URL lists across parts (P04 §3.3, PAPER-REPORTED); Dolma's URL stage removes 53.2 % of documents (P05). P06's scope experiment is the central result: global iterative MinHash over 96 snapshots left 4 T tokens and "little improvement over a model trained on the non-deduplicated data"; on the 2013-48 snapshot the ~31 B tokens kept after global deduplication trained worse than 171 B tokens obtained by individually deduplicating the ~460 B removed tokens, with the kept data containing "more ads, incoherent lists of keywords and generally badly formatted text"; per-snapshot deduplication with the same parameters left 20 T tokens and "matched RefinedWeb's performance"; lighter global passes on top (URL: 71.5 % of tokens removed; line: 77.8 %; line with minimum words: 85 %; 3-line spans: 80.9 %) were "consistently worse" (P06 §3.4, Appendix E.3, PAPER-REPORTED). P06's stated hypothesis is that the gain "lies in the removal of large clusters of duplicates with hundreds of thousands of documents" while removing small clusters "can harm performance" (PAPER-REPORTED). FineWeb2 deduplicates globally per language but records cluster sizes and up-weights documents from clusters whose filtering removal rate is low (R8.12 §4.3, §4.5, PAPER-REPORTED). P07 reports that sharding "yields a larger token pool" because "many documents which are repeated only a small number of times can survive" (PAPER-REPORTED). The three findings are consistent with one mechanism: what matters is the multiplicity distribution the model trains on, and the scope of deduplication is a knob on that distribution, which is why §9.6 owns the repetition decision.

<details><summary>Derivation of Eq. 8.8 and Eq. 8.9</summary>
By Eq. 8.7 and independence of the k hashes, a band of r rows agrees with probability s^r; it disagrees with probability 1 − s^r; all b bands disagree with probability (1 − s^r)^b; at least one agrees with the complement. For Eq. 8.9, set 1 − (1 − s^r)^b = 1/2, so (1 − s^r)^b = 1/2 and, for small s^r, b·s^r ≈ ln 2, giving s ≈ (ln 2 / b)^{1/r} ≈ (1/b)^{1/r} up to the factor (ln 2)^{1/r} which tends to 1 as r grows. MATHEMATICALLY-DERIVED. For P06's parameters the exact s_{1/2} is 0.685 and the approximation gives 0.719; for k = 9,000 they are 0.723 and 0.737.
</details>

## Algorithm

```text
Algorithm 8.4 — Shingling and MinHash signature
INPUT   document text; word tokenizer W (per language, §8.1); n; k hash functions h_1..h_k with seed σ (identical on all workers)
OUTPUT  signature m[1..k] of 32- or 64-bit integers
STATE   shingle set S (hashed n-grams, uint64)
INVARIANT m[i] = min over S of h_i(s); identical seed ⇒ identical h_i on every worker
1.  words ← W(normalize(text))                     # lowercase, strip punctuation per pipeline choice
2.  S ← { hash64(words[j..j+n-1]) : j = 1..|words|−n+1 } ; if |S| = 0: return ⊥ (document too short)
3.  for i in 1..k: m[i] ← min_{s∈S} h_i(s)          # h_i(s) = (a_i·s + b_i) mod p, a_i,b_i from RNG(σ)
4.  return m
TERMINATION: |S|·k evaluations.
```

Complexity: O(|words|·k) hash evaluations; memory k integers per document. Implementation: datatrove `MinhashDedupSignature` with `MinhashConfig(n_grams=5, num_buckets=14, hashes_per_bucket=8, seed=1)` as defaults and hash parameters drawn from `np.random.RandomState(seed)` (R8.16, OFFICIAL-DOCUMENTATION).

```text
Algorithm 8.5 — Banding and candidate generation
INPUT   signatures m_x for all x; bands b; rows r (k = b·r)
OUTPUT  candidate pair set C
STATE   per-band hash tables T_1..T_b keyed by the r-tuple m_x[(j−1)r+1 .. jr]
INVARIANT (x, y) ∈ C ⇔ ∃ j: band_j(x) = band_j(y)
1.  for j in 1..b: for each x: T_j[band_j(x)] += x            # bucket by exact r-tuple
2.  C ← ∅ ; for j in 1..b: for each bucket B in T_j with |B| ≥ 2: C += all pairs in B (or: link consecutive members after sorting)
3.  optionally: keep (x, y) ∈ C only if J(x, y) ≥ τ (recompute from shingles) or edit-similarity ≥ 0.8 (R8.3)
4.  return C
TERMINATION: b passes over documents.
```

Complexity: O(b·N) insertions; candidate pairs O(Σ_buckets |B|²) worst case, O(N) expected under fixed parameters (R8.3). Memory: one table per band; datatrove writes per-bucket signature files and sorts them so that step 2 is a merge over sorted runs with `world_size` divisible by `num_buckets` (R8.16 `MinhashDedupBuckets`, OFFICIAL-DOCUMENTATION).

```text
Algorithm 8.6 — Connected components and representative selection
INPUT   candidate pairs C; policy ∈ {keep_random, keep_first, keep_longest}; ledger L
OUTPUT  set of dropped documents; cluster ids and sizes
STATE   parent[] (union-find with path compression), size[]
INVARIANT after processing C, find(x) = find(y) ⇔ x and y are in one component
1.  for (x, y) in C: union(find(x), find(y))     # attach smaller root under larger
2.  for each root ρ: members ← {x : find(x) = ρ}; keep ← policy(members)
3.  for x in members \ {keep}: L += (x.id, stage, "minhash", version, score=NA, thr=(n,b,r), DROP_DOC, "near_duplicate", cluster_id=ρ, kept_record_id=keep)
4.  record (ρ, |members|) with keep for §9.6 / rehydration
TERMINATION: |C| unions and N finds, near-linear.
```

Complexity: O((N + |C|)·α(N)); memory 2 integers per document in any pair. Implementation: datatrove `MinhashDedupCluster` (R8.16). The policy is a design input; P04 and P06 keep a random member (PAPER-REPORTED).

```text
Algorithm 8.7 — Suffix-array exact-substring deduplication (R8.3)
INPUT   corpus tokens S = x_1 ‖ x_2 ‖ … (byte-level BPE ids as bytes); minimum length k (50 tokens); action ∈ {cut, mask, drop}
OUTPUT  set of (position, length) duplicate spans; modified corpus
STATE   suffix array A (8 bytes per token); split arrays A_1..A_K merged
INVARIANT for adjacent A[i], A[i+1], lcp(S[A[i]..], S[A[i+1]..]) ≥ k ⇔ a duplicate of length ≥ k begins at both positions
1.  partition S into K splits; build A_j by SA-IS on each in parallel; merge into A          # O(|S|) work, O(|S|/K) wall-clock per split
2.  for i in 1..|S|−1: ℓ ← lcp(A[i], A[i+1]); if ℓ ≥ k: record spans (A[i], ℓ), (A[i+1], ℓ)
3.  merge overlapping spans per document; apply action to all but one occurrence (cut removes the span; mask zeroes its loss mask m_t; drop removes documents whose duplicated fraction exceeds a threshold)
4.  emit one ledger row per removed span with (record_id, span_start, span_end, "exact_substring", k)
TERMINATION: linear scan of A.
```

Complexity: O(|S|) time; memory 8|S| bytes for A plus |S| bytes for S — R8.30 states > 600 GB RAM for a ~300 GB corpus (OFFICIAL-DOCUMENTATION). Implementation: `google-research/deduplicate-text-datasets` (Rust; R8.30).

## Implementation

Tensors and operators: none on accelerators; all structures are CPU hash tables, sorted files, union-find arrays and bit arrays. Framework: datatrove's three-step MinHash and its `bloom_filter`, `exact_substrings`, `sentence_dedup` and `exact_dedup` modules (R8.16); Dolma's Rust Bloom filter in its mixer (P05 §4.1; R8.29); DCLM's BFF under `dedup/bff` with Ray-based exact/URL deduplication (R8.31, OFFICIAL-DOCUMENTATION); R8.3's Rust suffix array (R8.30). These are lab code surfaces (Hugging Face #27, Ai2 #22, Google Research #18), not §4 stack systems. Memory: signatures k·8 bytes per document; per-band tables; the Bloom filter's m^* bits; the suffix array's 8 bytes per token. Communication: MinHash bucketing is a shuffle keyed by band value (each band's table can live on a different worker, hence datatrove's requirement that `world_size` be divisible by `num_buckets`); the Bloom filter is either a single shared structure or sharded with lost recall; suffix arrays are single-node. Deployment: P06 reports over 70 ablation models and an estimated 80,000 H100 GPU-hours for the whole ablation programme (PAPER-REPORTED); CPU-hours for its deduplication are NOT-DISCLOSED. The execution plane — retries, resume by completion markers, shard sizing — is [§12.2](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-2-transformation-execution.md).

> **Implementation note [datatrove · commit 1ca2583, 2026-09-17, not executed].** `MinhashConfig` defaults are `n_grams = 5, num_buckets = 14, hashes_per_bucket = 8, seed = 1`, and the docstring states the seed "should be the same on all workers to ensure they all have the same parameters" (R8.16). Whether the hash family is the (a·s + b) mod p form written in Algorithm 8.4 was not verified line by line; UNVERIFIED.

## Experimental design

### Experiment 8.3 — Deduplication scope at matched tokens

- **Hypothesis.** At fixed (n, b, r), per-snapshot deduplication yields a corpus whose 350 B-token sample trains to a higher aggregate score than global deduplication, and global deduplication with cluster-size-aware rehydration recovers the per-snapshot result.
- **Setup.** Base-filtered text of ≥ 20 snapshots; three corpora: (A) per-snapshot MinHash; (B) global MinHash; (C) global MinHash with cluster sizes recorded and R8.12-style up-weighting. 350 B tokens sampled from each; two seeds.
- **Independent variables.** Scope ∈ {A, B, C}; secondary: k ∈ {112, 1,395} at matched s_{1/2}.
- **Controlled variables.** Extractor, base filters, model (1.71 B-class), tokenizer, steps, evaluator; the same hash seed.
- **Dataset / workload.** The snapshots; P06's eight benchmarks.
- **Hardware.** Any; report CPU-hours per scope and peak memory of the bucket tables.
- **Metrics.** Aggregate accuracy; tokens surviving; cluster-size histogram; fraction of tokens from clusters with > 100 members.
- **Baselines.** No deduplication.
- **Expected result.** A > B by more than the seed spread, as P06 reports; C ≈ A if the multiplicity hypothesis holds.
- **Ablation.** Remove only clusters with > 100 members globally and otherwise leave the corpus intact; compare with A.
- **Interpretation.** If the ablation matches A, the P06 hypothesis (large clusters carry the harm) is supported; if B ≈ A, scope does not matter at this scale and the P06 result was crawl-specific.
- **Threats to validity.** Two seeds; the snapshot set differs from P06's 96; the 350 B sample interacts with token starvation in B (4 T tokens available in P06's case, so not starved).

## Observations

**What the paper claims.** P06 claims per-snapshot MinHash matched RefinedWeb while global MinHash barely beat no deduplication, and that lighter global passes were consistently worse (PAPER-REPORTED). P07 claims BFF and MinHash + suffix array are within 0.2 CORE points at 7B-2x and that BFF scales past 10 TB (PAPER-REPORTED). R8.3 claims a 10× reduction in memorised output and 4.6 % validation contamination in C4 (PAPER-REPORTED). P04 claims the 10-hash setting removed less and trained worse than 9,000 hashes (PAPER-REPORTED).

**What the evidence shows.** The formula behind every reported detection probability is Eq. 8.8 and the reported numbers reproduce it exactly (table above), so the *detection* side is settled mathematics. The *benefit* side rests on single programmes: the scope result is P06's alone; the BFF-equivalence is P07's alone; both at ≤ 7 B parameters. R8.12's global-per-language choice with rehydration is a different design responding to the same finding and has not been compared head-to-head with per-snapshot scope in the opened sources.

**What we infer.** DERIVED: with k = 112 the candidate probability at s = 0.7 is 0.56, so roughly half of the pairs at that similarity are missed and the effective threshold is a band, not a point; any "75 % similar" statement is shorthand for that curve. DERIVED: the memory of exact-substring deduplication (8|S| bytes) makes it a per-shard tool above the ~10¹¹-token scale unless streamed, which is P07's reason for BFF.

**What remains unknown.** NOT-DISCLOSED: CPU-hours and peak memory for P06's or P07's deduplication at full scale. UNVERIFIED: P04's bucket convention; whether per-snapshot scope remains preferable at > 7 B parameters or with the repetition policies of §9.6.

## Failure modes

> **Failure mode — chain clustering.** *Symptom:* a component with thousands of members of pairwise low similarity; a template site's every page collapses to one. *Cause:* transitive closure over candidate edges. *Detection:* component size histogram; sample pairs from large components and compute J. *Mitigation:* verify J ≥ τ per edge (Algorithm 8.5 step 3); cap component size; treat templates as boilerplate (§8.1).

> **Failure mode — short documents never match.** *Symptom:* a corpus of short items shows near-zero duplication. *Cause:* documents shorter than n words have no shingles; below k tokens no exact substring can qualify — R8.3 found 90 % of LM1B documents under 50 tokens (PAPER-REPORTED). *Detection:* fraction of documents with |S| = 0 in the ledger. *Mitigation:* smaller n or k for that source, with its own ablation.

> **Failure mode — Bloom false positives at scale.** *Symptom:* unique paragraphs removed as duplicates late in a run. *Cause:* filter sized for fewer items than inserted; ε rises with occupancy. *Detection:* track fill ratio; compare removal rate early vs late. *Mitigation:* size m by Eq. 8.10 for the full n; shard.

> **Failure mode — seed mismatch across workers.** *Symptom:* zero candidates across shards processed on different nodes. *Cause:* different hash parameters. *Detection:* signature of a fixed probe document per worker. *Mitigation:* seed in the stage contract (R8.16's docstring requirement).

> **Failure mode — validation copies removed instead of training copies.** *Symptom:* the held-out set shrinks. *Cause:* representative policy ignores split membership. *Detection:* split label in the cluster. *Mitigation:* R8.3's rule — keep the test/validation copy.

## Siblings

**Exact hash (URL / document / paragraph)** — this file. Why it exists: O(1) per unit. What assumption changed: identity after normalisation is enough. What problem it solved: re-crawls and templates at 53 % of documents (P05). New failure mode: one changed character defeats it. Changed primitive: none.

**MinHash / LSH** — this file. Why it exists: near-identity at sub-quadratic cost. What assumption changed: Jaccard over shingles is the similarity. What problem it solved: fuzzy duplicates with a tunable S-curve. New failure mode: chain clustering; probabilistic misses below s_{1/2}. Changed primitive: hash of the unit → k minima over shingle hashes.

**Suffix-array exact substring** — this file. Why it exists: duplicated *parts* of otherwise unique documents. What assumption changed: verbatim spans, not whole documents, are the unit. What problem it solved: licences, disclaimers, boilerplate inside documents (P04 Appendix H.2). New failure mode: 8 bytes per token in RAM; alters documents. Changed primitive: document set → concatenated string.

**Bloom-filter n-gram deduplication (BFF)** — this file. Why it exists: single-pass, fixed memory. What assumption changed: document-versus-corpus rather than document-versus-document. What problem it solved: > 10 TB pools (P07). New failure mode: false positives; order dependence (the first occurrence is kept). Changed primitive: pairwise similarity → set membership.

**Semantic deduplication (embedding clusters)** — [§9.2](../ch09-data-mixtures-curricula-and-sample-efficiency/09-2-quality-and-diversity.md)
Why it exists: paraphrased redundancy. What assumption changed: embedding distance replaces lexical overlap. What problem it solved: redundancy invisible to shingles. New failure mode: threshold choice; P07 reports SemDedup below fastText filtering at 1B-1x (PAPER-REPORTED). Changed primitive: shingle sets → embedding vectors.

## Extensions

For code, R8.14 reports metric inflation "by up to 100%" on duplicated corpora (PAPER-REPORTED) and R8.10 deduplicates files at Jaccard 0.7 over 5-grams; forks and vendored dependencies make cross-source duplicates the norm. For multilingual corpora, shingles need the per-language word tokenizer of §8.1 and R8.12 deduplicates per language. For multimodal data the shingle is a perceptual hash of the image and the text pair is deduplicated jointly (Part X, multimodal chapters). For synthetic data, near-duplicate generations from one prompt are a mode-collapse symptom ([§11.4](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-4-distributional-risks.md)). These are proposals.

## Limitations

Eq. 8.7 holds for random permutations; practical hash families approximate it and the approximation error is not reported by any opened source. The benefit of deduplication is established at ≤ 7 B parameters and up to 350 B tokens; P04 cites concurrent Pythia findings that deduplicating The Pile "had a limited impact on zero-shot performance", raising whether the benefit is specific to web-dominated corpora (PAPER-REPORTED). The falsification condition for the scope claim is Experiment 8.3 with B ≥ A beyond the seed spread. Decision consequence: choose (n, b, r) by the S-curve for the similarity band you intend to remove, choose scope by the multiplicity distribution you intend to train on, and record cluster sizes so that §9.6 can revisit the decision without re-running deduplication.

## Reproducibility

Record: n, k, b, r, hash precision, seed, word tokenizer id, normalisation before shingling, candidate verification rule (J ≥ τ or edit similarity), representative policy, scope (per-snapshot / per-shard / global) with shard count, exact-substring k and action, Bloom-filter ε, n_estimated, m and h, min/max n-gram and threshold, and the removal fractions per stage in documents and tokens. Unknowns: P06's and P07's CPU-hours; the hash family of each implementation beyond datatrove's inspected defaults.

## References

P02 · P03 · P04 · P05 · P06 · P07 · R8.1 · R8.2 · R8.3 · R8.5 · R8.6 · R8.7 · R8.10 · R8.12 · R8.14 · R8.16 · R8.18 · R8.29 · R8.30 · R8.31 · [references.md](references.md)
