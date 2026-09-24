---
id: ms.section.10.1
entity_type: section
title: Tokenization algorithms
short_title: BPE, unigram, WordPiece, bytes
volume: 1
part: 2
chapter: 10
section: 10.1
slug: 10-1-tokenization-algorithms
parent: ms.chapter.10
prev_sibling: null
next_sibling: ms.section.10.2
children: []
prerequisites: [ms.section.2.3, ms.section.4.1, ms.section.4.6, ms.section.9.5]
downstream: [ms.section.10.2, ms.section.10.3, ms.section.10.6, ms.section.13.5, ms.section.21.2]
related: [ms.section.8.1]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.R10.1}
  - {type: supported_by, target: paper.R10.3}
  - {type: variant_of, target: concept.subword-segmentation}
  - {type: implemented_by, target: impl.hugging-face-transformers}
axes:
  lifecycle: [data, pretraining]
  mechanism: [tokenization, vocabulary_construction]
  feedback_setting: []
  modality: [text]
papers: []
implementations: [impl.hugging-face-transformers]
benchmarks: []
datasets: []
status:
  maturity: established
  disputed: false
evidence_summary:
  labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, UNVERIFIED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 2200
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 10.1 Tokenization algorithms

## Scope

Objective: state the four subword construction algorithms in production use — byte-pair encoding (BPE), its byte-level variant, WordPiece, and unigram language-model tokenization — as training and encoding procedures with complexities, and place character/byte-level and tokenizer-free approaches as siblings. Baseline: a fixed word vocabulary with an unknown token, the design all four replaced. Success criterion: the reader can, from this section alone, implement BPE training and encoding, unigram EM with pruning and Viterbi segmentation, and MaxMatch, and can say which of the three properties — reversibility, determinism, probabilistic segmentation — each has. Boundaries: implementations, Unicode normalisation and whitespace conventions ([§10.2](10-2-implementations-and-normalization.md)); the cost of a vocabulary of size V ([§10.3](10-3-vocabulary-economics.md)); the information-theoretic quantities bits per byte and coding length ([§2.3](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/02-3-information-theory.md)).

## Why this exists

What failed before was the closed vocabulary. PAPER-REPORTED (R10.1, abstract): neural translation models "typically operate with a fixed vocabulary, but translation is an open-vocabulary problem", and earlier systems backed off to a dictionary for out-of-vocabulary words. The bottleneck was statistical, not computational: a word-level softmax over hundreds of thousands of types spends its parameters on rare rows that receive almost no gradient, while a character-level model spends its sequence budget on positions that carry almost no information. The constraint that became dominant as models grew was the product of the two: the vocabulary size V multiplies the embedding and output-head parameters, and the number of tokens per byte multiplies every other cost in the model. Subword segmentation is the mechanism that trades one against the other under a single scalar, V.

What changed in the solution is that segmentation became a learned compression scheme rather than a linguistic one. PAPER-REPORTED (R10.3, §3.4): BPE "is a variant of dictionary (substitution) encoder that incrementally finds a set of symbols such that the total number of symbols for encoding the text is minimized", and the unigram model "is reformulated as an entropy encoder that minimizes the total code length for the text". Both are compressors with a fixed-size codebook; the difference is the objective and whether the segmentation is deterministic. Everything that follows in this chapter — reversibility, fertility, migration — is downstream of the fact that the tokenizer is a codec.

## Intuition

Physically, the tokenizer sets the exchange rate between bytes of text and positions in the sequence. Every position costs the same forward FLOPs (≈ 2N per token, [§5.6](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/05-6-reference-accounting.md)) and the same cache bytes (Eq. N.8 per token), so a tokenizer that emits fewer tokens for the same bytes buys compute; but every distinct token it can emit costs a row in two `[V, d_model]` matrices and a column in every logits tensor. A subword vocabulary is a codebook whose entries are bought with parameters and spent as sequence-length savings. Heuristically, BPE is a greedy dictionary builder: it repeatedly buys the most frequently adjacent pair. Unigram is a pruned codebook: it starts with too many entries and discards those whose removal costs the least likelihood. WordPiece encoding is a longest-match lookup against a fixed codebook. None of these is a linguistic analysis; morphology emerges only where frequency happens to align with it. This paragraph is DERIVED from the cost identities of §5.6 and Eq. N.8.

## Formulation

Let the training text be a multiset of pre-tokens (word-like chunks, defined below) with frequencies `c(w)`. A symbol vocabulary is a finite set `𝒱` of strings over an alphabet `Σ` (characters or bytes). A segmentation of a pre-token `w` is a sequence `x = (x₁,…,x_M)`, `x_i ∈ 𝒱`, with `x₁‖…‖x_M = w`.

> **Definition — tokenization algorithm versus tokenizer implementation.** A tokenization algorithm is the pair (vocabulary-construction procedure, segmentation procedure) — BPE, WordPiece, unigram — that maps a corpus to a vocabulary and a string to a token sequence. A tokenizer implementation is a software artifact (SentencePiece, Hugging Face Tokenizers, tiktoken) that realises one or more algorithms together with normalisation, pre-tokenization, special-token handling and serialisation. SentencePiece is an implementation that supports BPE and unigram (OFFICIAL-DOCUMENTATION, R10.5: "It implements subword units — including Byte-Pair-Encoding (BPE) and the unigram language model"); it is not an algorithm parallel to BPE.

> **Definition — pre-tokenization.** The deterministic split of normalised text into chunks (pre-tokens) across whose boundaries no merge or subword may extend; the split is fixed before vocabulary construction and reused unchanged at encoding time.

> **Definition — BPE merge table.** The ordered list `((a₁,b₁),…,(a_M,b_M))` of symbol pairs produced by BPE training, whose order is the encoding priority; the vocabulary is the alphabet plus the M merged symbols.

$$
|\mathcal{V}| = |\Sigma| + M
$$
*(Eq. 10.1)* where Σ = initial alphabet (characters, or the 256 byte values), M = number of merge operations. PAPER-REPORTED (R10.1, §3.2): "The final symbol vocabulary size is equal to the size of the initial vocabulary, plus the number of merge operations – the latter is the only hyperparameter of the algorithm."

> **Definition — byte-level BPE.** BPE whose alphabet Σ is the 256 byte values of the UTF-8 encoding of the text, so that every string is representable and no unknown token is needed. PAPER-REPORTED (R10.2, §2.2): "a byte-level version of BPE only requires a base vocabulary of size 256."

> **Definition — unigram LM tokenization.** Segmentation under a vocabulary 𝒱 and per-piece probabilities `p(x_i)` that treats pieces as independent draws, chooses the maximum-probability segmentation by Viterbi, and constructs 𝒱 by EM over a large seed vocabulary followed by loss-ranked pruning.

$$
P(x) = \prod_{i=1}^{M} p(x_i), \qquad \forall i\; x_i \in \mathcal{V}, \qquad \sum_{x \in \mathcal{V}} p(x) = 1
$$
*(Eq. 10.2)* where x = a segmentation of the input, p = piece probabilities. PAPER-REPORTED (R10.3, Eq. 6).

$$
x^{*} = \arg\max_{x \in S(X)} P(x), \qquad \mathcal{L} = \sum_{s=1}^{|D|} \log \sum_{x \in S(X^{(s)})} P(x)
$$
*(Eq. 10.3)* where S(X) = the set of candidate segmentations of sentence X, D = the training corpus. The left expression is the Viterbi objective (R10.3, Eq. 7); the right is the marginal likelihood maximised by EM with the segmentation as the hidden variable (R10.3, §3.2). PAPER-REPORTED.

$$
P(x_i \mid X) = \frac{P(x_i)^{\alpha}}{\sum_{j=1}^{l} P(x_j)^{\alpha}}
$$
*(Eq. 10.4)* where l = number of best segmentations considered, α ∈ ℝ⁺ = smoothing hyperparameter; sampling from this distribution during training is subword regularization. PAPER-REPORTED (R10.3, §3.3): "A smaller α leads to sample x_i from a more uniform distribution. A larger α tends to select the Viterbi segmentation."

> **Definition — WordPiece.** A subword scheme whose vocabulary is grown greedily to maximise training-corpus likelihood under a language model and whose encoding segments each pre-token by greedy longest-match-first (MaxMatch) against the vocabulary, marking word-internal pieces with a continuation prefix. PAPER-REPORTED (R10.6, §4.1): the wordpiece model is "completely data-driven and guaranteed to generate a deterministic segmentation for any possible sequence of characters"; PAPER-REPORTED (R10.7, abstract): "WordPiece uses a longest-match-first strategy, known as maximum matching."

> **Assumption.** Pre-tokens are treated as independent for counting and merging · *sensitivity:* if a merge were allowed across pre-token boundaries the vocabulary could contain multi-word units and the sequence length would fall further, at the cost of an encoder that must scan the whole text rather than each chunk; the CS336 handout states the same boundary rule (OFFICIAL-DOCUMENTATION, R10.22: "we do not consider pairs that cross pre-token boundaries").

## Mechanism

**BPE training.** PAPER-REPORTED (R10.1, §3.2): "we initialize the symbol vocabulary with the character vocabulary, and represent each word as a sequence of characters, plus a special end-of-word symbol '·', which allows us to restore the original tokenization after translation. We iteratively count all symbol pairs and replace each occurrence of the most frequent pair ('A', 'B') with a new symbol 'AB'." Because pairs never cross word boundaries, "the algorithm can thus be run on the dictionary extracted from a text, with each word being weighted by its frequency." The paper's Algorithm 1 is the naive form: recount all pairs after each merge. Cost per merge, naive: one pass over the pre-token dictionary, O(Σ_w |w|) symbol-pair visits; M merges cost O(M·Σ_w|w|) time and O(|dictionary|) memory. With incremental pair indexing ("in practice, we increase efficiency by indexing all pairs, and updating data structures incrementally", R10.1) each merge touches only the pre-tokens containing the merged pair. The CS336 handout adds a determinism rule absent from the paper: OFFICIAL-DOCUMENTATION (R10.22, §2.4): "deterministically break ties in pair frequency by preferring the lexicographically greater pair." Ties are common in the tail of the merge list, so without a tie rule two trainers on the same corpus produce different merge tables — a reproducibility defect that surfaces as different token ids for the same text.

**Byte-level BPE.** The GPT-2 report identifies why character-level BPE fails as a universal codec: PAPER-REPORTED (R10.2, §2.2): reference implementations "operate on Unicode code points and not byte sequences" and "would require including the full space of Unicode symbols in order to model all Unicode strings. This would result in a base vocabulary of over 130,000 before any multi-symbol tokens are added." Applying BPE to raw bytes removes the unknown token but changes what frequency counting sees: "directly applying BPE to the byte sequence results in suboptimal merges due to BPE using a greedy frequency based heuristic … We observed BPE including many versions of common words like dog since they occur in many variations such as dog. dog! dog?" The fix is pre-tokenization by character category: "we prevent BPE from merging across character categories for any byte sequence. We add an exception for spaces which significantly improves the compression efficiency while adding only minimal fragmentation of words across multiple vocab tokens." The regex that encodes this rule is owned by [§10.2](10-2-implementations-and-normalization.md). The end-of-word symbol disappears: OFFICIAL-DOCUMENTATION (R10.22, footnote 2): "We do not add an end-of-word-token when training byte-level BPE models because all bytes (including whitespace and punctuation) are included in the model's vocabulary." Cost: the alphabet shrinks from |Σ| ≈ 1.3·10⁵ code points to 256, so Eq. 10.1 gives almost the whole vocabulary to merges; the price is that a non-ASCII character occupies two to four alphabet symbols before merging, so under-merged scripts pay a multiplicative fertility penalty ([§10.3](10-3-vocabulary-economics.md)).

**BPE encoding.** Encoding replays training: PAPER-REPORTED (R10.1, §3.2): "At test time, we first split words into sequences of characters, then apply the learned operations to merge the characters into larger, known symbols." The merge table is applied in creation order to each pre-token; OFFICIAL-DOCUMENTATION (R10.22, §2.6.1): "We then take the sequence of vocabulary element merges created during BPE training, and apply it to our pre-tokens in the same order of creation." The order matters because merges are not confluent: a later merge may consume a symbol that an earlier merge would have produced. Two implementation strategies with different complexities are documented: PAPER-REPORTED (R10.7, §2): enumerate merges in creation order and scan the sequence for each, O(|V|·n) for a pre-token of length n; or "repeatedly select the pair of symbols from the current sequence that has the highest priority (e.g., the maximum frequency). Using a heap, this approach can be done in O(n log n)". PAPER-REPORTED (R10.4, §3.2): SentencePiece "adopts an O(N log(N)) algorithm in which the merged symbols are managed by a binary heap (priority queue)". Cost per pre-token: O(n log n) time, O(n) memory; the merge table itself is O(M) entries of two symbol ids.

**Unigram construction.** PAPER-REPORTED (R10.3, §3.2), the iterative algorithm: (1) "Heuristically make a reasonably big seed vocabulary from the training corpus" — "the union of all characters and the most frequent substrings", enumerable "in O(T) time and O(20T) space with the Enhanced Suffix Array algorithm"; (2) repeat until |𝒱| reaches the target: (a) "Fixing the set of vocabulary, optimize p(x) with the EM algorithm"; (b) "Compute the loss_i for each subword x_i, where loss_i represents how likely the likelihood L is reduced when the subword x_i is removed"; (c) "Sort the symbols by loss_i and keep top η% of subwords (η is 80, for example). Note that we always keep the subwords consisting of a single character to avoid out-of-vocabulary." The E-step is a forward–backward over the segmentation lattice of each sentence; the M-step renormalises expected piece counts. Cost: per EM iteration O(T·ℓ_max) lattice edges, where ℓ_max is the maximum piece length (the SentencePiece default `max_sentencepiece_length` is 16; OFFICIAL-DOCUMENTATION, R10.5), and the number of pruning rounds is logarithmic in seed size over target size at shrink factor η (default 0.75 in SentencePiece; OFFICIAL-DOCUMENTATION, R10.5). The loss_i in step (b) is a leave-one-out approximation, not an exact marginal, which is why the final vocabulary is not a likelihood optimum; the paper does not claim it is. PAPER-REPORTED (R10.3): "the joint optimization of vocabulary set and their occurrence probabilities is intractable".

**Unigram segmentation.** Viterbi over the lattice: for each position j of a pre-token of length n, the best score is `max_{i<j, w[i:j]∈𝒱} best(i) + log p(w[i:j])`. Cost O(n·ℓ_max) per pre-token, linear in the input; PAPER-REPORTED (R10.4, §3.2): "the training and segmentation complexities of unigram language models are linear to the size of input data." Sampling instead of maximising: l-best by the Forward-DP Backward-A* algorithm, or exact sampling by Forward-Filtering Backward-Sampling for l = ∞ (R10.3, §3.3). Because single characters are never pruned, every string has at least one segmentation; the model is total over its alphabet, which is why the byte-fallback question of [§10.2](10-2-implementations-and-normalization.md) is about the alphabet, not the segmenter.

**WordPiece.** Construction, PAPER-REPORTED (R10.6, §4.1): "Given a training corpus and a number of desired tokens D, the optimization problem is to select D wordpieces such that the resulting corpus is minimal in the number of wordpieces when segmented according to the chosen wordpiece model. Our greedy algorithm to this optimization problem is similar to [BPE]"; the difference, per Kudo's footnote (R10.3, fn. 1–2), is that "Wordpiece model uses a likelihood instead of frequency" to choose the next merge. The original construction code is not public, so the exact likelihood gain criterion is NOT-DISCLOSED beyond these statements. Encoding is MaxMatch: PAPER-REPORTED (R10.7, §3): "iteratively pick the longest prefix of the remaining text that matches a vocabulary token until the entire word is segmented. If a word cannot be tokenized, the entire word is mapped to a special token <unk>." Naive MaxMatch is O(n²) or O(n·m) with m the longest vocabulary entry; the LinMaxMatch construction of R10.7 reaches O(n) with a trie augmented by precomputed failure links. Cost: a trie of |𝒱| entries in memory; O(n) per pre-token. BERT states its usage: PAPER-REPORTED (R10.45, §3): "We use WordPiece embeddings (Wu et al., 2016) with a 30,000 token vocabulary."

**Character and byte models.** ByT5 removes the codebook entirely: PAPER-REPORTED (R10.8, abstract): "a standard Transformer architecture can be used with minimal modifications to process byte sequences"; the price is length: "byte sequences tend to be significantly longer than token sequences." The parameter side of the trade is stated exactly: "the vocabulary and softmax output matrices in the mT5-Base model amount to 256 million parameters, or about 66% of the total parameter count", which ByT5 reallocates into layers. Costs, PAPER-REPORTED (R10.8, §7): "Across all model sizes, ByT5 requires 1.2× more operations" in pre-training, and inference is "1.5 to 2.6 times slower" on a transliteration task and "3.7 to 6.4 times slower" on document summarisation relative to mT5 on TPUv3 — figures that transfer only to that encoder–decoder configuration. The Byte Latent Transformer keeps bytes as input but replaces the fixed codebook by dynamic patches: PAPER-REPORTED (R10.9, abstract): "Patches are segmented based on the entropy of the next byte, allocating more compute and model capacity where increased data complexity demands it"; "Unlike tokenization, BLT has no fixed vocabulary for patches." The reported result is flop-controlled parity with a BPE baseline "up to 8B scale while having the option to trade minor losses in evaluation metrics for flop efficiency gains of up to 50%" (R10.9, §1), which has not been independently reproduced at that scale as of this edition (UNVERIFIED).

**Vocabulary construction as a decision.** All four algorithms take V (or M) as the input and return a codebook; none returns the V that a model should use. The selection is a joint cost problem developed in [§10.3](10-3-vocabulary-economics.md); the algorithm choice determines only the shape of the codebook at a given V: BPE and WordPiece grow it bottom-up and are deterministic; unigram prunes it top-down and yields segmentation probabilities. A joint vocabulary over source and target (R10.1: "joint BPE") or over languages is a construction choice with its own consequence: shared strings segment identically, which R10.6 exploits so that "the same string in source and target sentence will be segmented in exactly the same way".

## Algorithm

```text
Algorithm 10.1 — BPE vocabulary construction (frequency-greedy, pre-token weighted)
INPUT   pre-token counts c : dict[str -> int]; alphabet Σ; merge budget M; tie rule ≺
OUTPUT  merges : list[(sym, sym)] of length M; vocabulary 𝒱 = Σ ∪ {a‖b for (a,b) in merges}
STATE   seq[w] : list[sym] for each pre-token w (initially its characters or bytes);
        pairs : dict[(sym,sym) -> int]; index : dict[(sym,sym) -> set[w]]
INVARIANT after k merges, |𝒱| = |Σ| + k (Eq. 10.1); every seq[w] concatenates to w
1.  for w in c: seq[w] ← split(w); for each adjacent (a,b) in seq[w]: pairs[(a,b)] += c[w]; index[(a,b)] ∪= {w}
2.  for k = 1 … M:
3.      if pairs is empty: break                                  # nothing left to merge
4.      (a,b) ← argmax pairs, ties broken by ≺ (lexicographically greater, R10.22)
5.      append (a,b) to merges; 𝒱 ← 𝒱 ∪ {a‖b}
6.      for w in index[(a,b)]:                                    # only affected pre-tokens
7.          for each occurrence of (a,b) in seq[w] (left to right, non-overlapping):
8.              decrement pairs for the neighbours (x,a) and (b,y) by c[w]
9.              replace a,b by a‖b in seq[w]
10.             increment pairs for (x,a‖b) and (a‖b,y) by c[w]; update index
11.     delete pairs[(a,b)]
12. return merges, 𝒱
TERMINATION: at most M iterations; each iteration strictly shortens some seq[w].
```

Complexity: step 1 O(Σ_w |w|); each merge O(Σ_{w∈index[(a,b)]} |w|) with a heap over `pairs` giving O(log |pairs|) selection; memory O(Σ_w |w| + |pairs|). Implementation: the naive form is R10.1 Algorithm 1; the incremental form is what R10.22 asks students to build ("indexing all pairs, and updating data structures incrementally", R10.1).

```text
Algorithm 10.2 — BPE encoding of one pre-token by merge priority
INPUT   pre-token w; merges with rank r : (sym,sym) -> int; vocabulary id : sym -> int
OUTPUT  ids : list[int]
STATE   seq : list[sym]; heap of (rank, position) for adjacent pairs present in r
INVARIANT seq concatenates to w; every element of seq is in 𝒱
1.  seq ← split(w) into alphabet symbols
2.  push every adjacent pair (seq[i], seq[i+1]) with a rank onto heap keyed by rank
3.  while heap not empty:
4.      (rank, i) ← pop; if (seq[i], seq[i+1]) no longer matches the ranked pair: continue   # stale
5.      seq[i] ← seq[i]‖seq[i+1]; delete seq[i+1]
6.      push (r[(seq[i−1], seq[i])], i−1) and (r[(seq[i], seq[i+1])], i) if ranked
7.  return [id[s] for s in seq]
TERMINATION: each pop either discards a stale entry or shortens seq; at most |w| merges.
```

Complexity O(n log n) time and O(n) memory per pre-token of n symbols (R10.4 §3.2, R10.7 §2). The merge-list scan alternative is O(M·n) and is what R10.22 describes for pedagogy.

```text
Algorithm 10.3 — Unigram vocabulary construction (EM with loss-ranked pruning)
INPUT   corpus D of normalised pre-tokens; seed vocabulary 𝒱₀ (all characters ∪ frequent substrings);
        target size V; keep ratio η; EM sub-iterations E
OUTPUT  𝒱 with |𝒱| = V; log-probabilities log p(x) for x ∈ 𝒱
STATE   p : dict[piece -> prob]
INVARIANT every single character of the corpus alphabet remains in 𝒱 (no OOV within the alphabet)
1.  𝒱 ← 𝒱₀; initialise p from substring frequencies
2.  while |𝒱| > V:
3.      repeat E times:                                           # EM, 𝒱 fixed
4.          E-step: for each pre-token, forward–backward over the lattice of segmentations
                    under Eq. 10.2; accumulate expected count n(x) for each piece
5.          M-step: p(x) ← n(x) / Σ_y n(y)
6.      for x in 𝒱 with |x| > 1: loss(x) ← 𝓛(𝒱) − 𝓛(𝒱 \ {x})   # approximated by re-segmenting
                    the occurrences of x with its best alternative under current p
7.      keep the single-character pieces and the top max(V, η·|𝒱|) pieces by loss; drop the rest
8.  return 𝒱, log p
TERMINATION: |𝒱| decreases geometrically by factor η each round until it reaches V.
```

Complexity: E-step O(T·ℓ_max) per sub-iteration, T = corpus size in symbols; rounds ≈ log(|𝒱₀|/V)/log(1/η). Implementation: `model_type=unigram` in SentencePiece with `seed_sentencepiece_size`, `shrinking_factor` and `num_sub_iterations` (OFFICIAL-DOCUMENTATION, R10.5).

```text
Algorithm 10.4 — Viterbi segmentation under a unigram vocabulary
INPUT   pre-token w of length n; 𝒱 with log p; maximum piece length ℓ_max
OUTPUT  best segmentation x*
STATE   best[0..n] : float (best[0] = 0, else −∞); back[0..n] : int
1.  for j = 1 … n:
2.      for i = max(0, j−ℓ_max) … j−1:
3.          if w[i:j] ∈ 𝒱 and best[i] + log p(w[i:j]) > best[j]:
4.              best[j] ← best[i] + log p(w[i:j]); back[j] ← i
5.  follow back from n to 0; return the pieces in order
TERMINATION: n outer iterations, ≤ ℓ_max inner.
```

Complexity O(n·ℓ_max) time, O(n) memory; membership tests by trie or hash. Sampling variant: replace `max` by the forward sum and draw backward (FFBS, R10.3 §3.3).

```text
Algorithm 10.5 — WordPiece MaxMatch encoding (reference, quadratic form)
INPUT   pre-token w; vocabulary 𝒱 with continuation prefix "##"; unknown id
OUTPUT  ids
1.  i ← 0; out ← []
2.  while i < n:
3.      j ← n; found ← false
4.      while j > i: piece ← (i == 0 ? w[i:j] : "##" + w[i:j]); if piece ∈ 𝒱: found ← true; break; j ← j − 1
5.      if not found: return [unknown id]                          # whole word → <unk> (R10.7 §3)
6.      append id[piece]; i ← j
7.  return out
TERMINATION: i strictly increases.
```

Complexity O(n²) worst case (or O(n·m)); the linear-time construction with failure links is R10.7's contribution. The "##" convention is BERT's; other WordPiece models mark boundaries differently (R10.6 marks word beginnings with a prefix symbol).

## Implementation

Tensors and operators: a tokenizer produces `int` ids in `[0, V)`; the ids are consumed by an embedding gather `[B, T] → [B, T, d_model]` ([§5.1](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/05-1-end-to-end-forward-pass.md)) and, at the head, define the width of the `[B, T, V]` logits tensor. Framework: the algorithms of this section are realised by three implementations, each a §4 reference-stack system or a lab code surface rather than a training-stack layer — Hugging Face Tokenizers (models `BPE`, `Unigram`, `WordPiece`, `WordLevel`; OFFICIAL-DOCUMENTATION, R10.12), SentencePiece (`model_type` ∈ {unigram, bpe, char, word}; OFFICIAL-DOCUMENTATION, R10.5) and tiktoken (byte-level BPE with a regex pre-tokenizer and ranked merges; OFFICIAL-DOCUMENTATION, R10.13) — bound to the model-definition layer *Hugging Face Transformers* (#26, Model definition / adaptation) through `tokenizer.json`, `tokenizer.model` and `tokenizer_config.json`. Kernels: none; tokenization runs on CPU and is a serial per-pre-token loop, which is why inference engines (vLLM #41, SGLang #42, *Inference engine* layer) place it in a frontend process separate from the GPU executor ([§43.1](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch43-runtime-architecture-and-inference-engine-selection/43-1-runtime-decomposition.md)). Memory: a merge table of M entries and a vocabulary of V byte strings; tens of megabytes for V ≈ 10⁵. Communication: none. Deployment: the artifact must be pinned by hash alongside the checkpoint ([§10.6](10-6-migration-and-compatibility.md)).

> **Implementation note [impl.hugging-face-transformers · Tokenizers documentation as of 2026-09-20, version UNVERIFIED].** OFFICIAL-DOCUMENTATION (R10.12, components): Hugging Face Tokenizers describes BPE as "starting with characters, while merging those that are the most frequently seen together", WordPiece as "a greedy algorithm, that tries to build long words first", and Unigram as "not deterministic based on a set of rules applied sequentially. Instead Unigram will be able to compute multiple ways of tokenizing, while choosing the most probable one." The library therefore keeps the three algorithms as interchangeable `Model` components behind one pipeline; the pipeline itself is [§10.2](10-2-implementations-and-normalization.md)'s subject.

## Experimental design

### Experiment 10.1 — BPE versus unigram at matched vocabulary and matched bytes

- **Hypothesis.** At equal V and equal normalisation, byte-level BPE and unigram produce token counts within a few percent of each other on in-distribution text, and the difference in downstream loss at matched training tokens is smaller than the difference produced by changing V by a factor of two.
- **Setup.** Train four tokenizers on the same 10 GB normalised sample: BPE and unigram at V ∈ {32k, 128k}, byte fallback on, identical pre-tokenization. Train a small decoder (the reference model of Chapter 05, ≈ 125M non-embedding parameters) on each for a fixed byte budget.
- **Independent variables.** Algorithm ∈ {BPE, unigram}; V ∈ {32k, 128k}.
- **Controlled variables.** Corpus, normalisation, pre-tokenization regex, byte budget, model non-embedding size, optimizer, seed.
- **Dataset/workload.** A web-text sample with a held-out multilingual and a held-out code split; token counts reported per split.
- **Hardware.** Any single accelerator; tokenizer training on CPU with wall-clock and peak memory recorded.
- **Metrics.** Tokens per byte per split; bits per byte on held-out splits ([§2.3](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/02-3-information-theory.md) — the only comparable loss across tokenizers, see [§4.6](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-6-likelihood-and-capability.md)); tokenizer training wall-clock.
- **Baselines.** Character-level (V = alphabet) and byte-level (V = 256) at the same byte budget.
- **Expected result.** Token counts differ by single-digit percent between algorithms at fixed V; bits per byte differences between algorithms are within seed noise; the V = 32k → 128k change moves tokens per byte more than the algorithm change does. ASSUMED.
- **Ablation.** Unigram with subword regularization (α = 0.1, l = 64, R10.3's setting) versus deterministic Viterbi; BPE-dropout (R10.46) versus deterministic BPE.
- **Interpretation.** If confirmed, algorithm choice is a secondary decision to V and normalisation; if bits per byte separate the algorithms beyond noise, the segmentation prior matters at this scale.
- **Threats to validity.** Byte fallback and pre-tokenization differences dominate on non-Latin scripts unless held fixed; bits per byte comparisons require identical byte counting of the normalised text.

## Observations

**What the paper claims.** PAPER-REPORTED (R10.1): subword models "improve over a back-off dictionary baseline for the WMT 15 translation tasks English→German and English→Russian by 1.1 and 1.3 BLEU". PAPER-REPORTED (R10.3): subword regularization gives "consistent improvements especially on low resource and out-of-domain settings". PAPER-REPORTED (R10.4, Table 2 caption): "We found that BPE and unigram language models show almost comparable performance." PAPER-REPORTED (R10.8): ByT5 is "competitive with parameter-matched mT5 models" and better "on tasks that are sensitive to spelling and pronunciation". PAPER-REPORTED (R10.9): BLT matches a BPE baseline at flop parity up to 8B parameters.

**What the evidence shows.** The open-vocabulary claim of BPE is supported by every later system that adopted it and needs no further reproduction. The BPE-versus-unigram quality question has only in-paper comparisons at translation scale (R10.3, R10.4); no independent large-scale controlled comparison at fixed V is cited here (UNVERIFIED). The byte-level parity claims of R10.8 and R10.9 are single-lab results; R10.9's own text acknowledges byte models were previously "prohibitively costly at scale".

**What we infer.** DERIVED: since both BPE and unigram are compressors with the same codebook size, their difference at fixed V is bounded by how far the greedy dictionary is from the entropy-coded codebook on the training distribution; on distribution shift the unigram prior can degrade differently from the merge table, which is the regime in which R10.3 reports its gains.

**What remains unknown.** NOT-DISCLOSED: the exact likelihood-gain criterion of the original WordPiece trainer. UNVERIFIED: whether entropy-patched byte models retain their reported efficiency beyond 8B parameters. Open question: whether a vocabulary constructed to minimise sequence length also minimises downstream loss at fixed compute — [§10.3](10-3-vocabulary-economics.md) shows the two objectives are not the same.

## Failure modes

> **Failure mode — non-reproducible merge table.** *Symptom:* two trainers on the same corpus emit different token ids for the same text. *Cause:* pair-frequency ties broken by dictionary iteration order. *Detection:* train twice, diff the merge lists. *Mitigation:* a deterministic tie rule (R10.22) recorded in the artifact.

> **Failure mode — merge order violated at encoding.** *Symptom:* encoding differs from training encoding for the same string; unreachable tokens appear. *Cause:* merges applied by frequency or by longest-match instead of by rank. *Detection:* the round-trip and reachability checks of [verification.md](verification.md). *Mitigation:* Algorithm 10.2 with ranks from the merge table.

> **Failure mode — unknown-token collapse.** *Symptom:* long runs of a single id on non-Latin input. *Cause:* character-level alphabet with `character_coverage` < 1 and no byte fallback, or WordPiece mapping whole words to `<unk>` (R10.7 §3). *Detection:* count `<unk>` per language on a parallel corpus. *Mitigation:* byte alphabet or byte fallback ([§10.2](10-2-implementations-and-normalization.md)).

> **Failure mode — greedy frequency capturing punctuation variants.** *Symptom:* many vocabulary rows for `dog.`, `dog!`, `dog?`. *Cause:* no pre-tokenization by character category (R10.2 §2.2). *Detection:* inspect the longest tokens; count tokens containing both letters and punctuation. *Mitigation:* category-splitting pre-tokenizer.

## Siblings

**Word-level vocabulary with back-off dictionary** — this file (baseline)
Why it exists: the simplest closed vocabulary. What assumption changed (relative to subwords): every type is atomic. What objective changed: none. What problem it solved: none; it is the reference. What new failure mode it introduced: OOV words become `<unk>` or dictionary look-ups (R10.1 §1). Changed primitive: subword codebook → word table.

**Byte-level BPE** — this file
Why it exists: character alphabets are too large to make every Unicode string representable. What assumption changed: the alphabet is bytes, not characters. What objective changed: none. What problem it solved: no unknown token (R10.2). What new failure mode it introduced: multi-byte characters can be split mid-code-point, producing invalid UTF-8 on decode ([§10.2](10-2-implementations-and-normalization.md)). Changed primitive: character alphabet → 256 bytes.

**Unigram LM tokenization** — this file
Why it exists: BPE is deterministic and cannot give segmentation probabilities (R10.3 §3.1). What assumption changed: pieces are independent draws from a distribution. What objective changed: frequency-greedy merging → marginal likelihood with pruning. What problem it solved: multiple segmentations for regularization. What new failure mode it introduced: the pruning approximation and the seed-vocabulary heuristic determine the final codebook. Changed primitive: merge table → piece probabilities.

**WordPiece** — this file
Why it exists: likelihood-driven vocabulary growth for production translation and later BERT. What assumption changed: the next merge is chosen by likelihood gain, not raw frequency. What objective changed: minimal wordpiece count under a language model (R10.6). What problem it solved: same open-vocabulary problem with deterministic encoding. What new failure mode it introduced: whole-word `<unk>` under MaxMatch when a character is missing (R10.7). Changed primitive: rank-ordered merges → longest-match lookup.

**Byte/character-level models (ByT5) and byte-latent models (BLT)** — this file; architecture consequences in [§13.5](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-5-embeddings-and-heads.md)
Why it exists: remove the codebook and its brittleness to noise and unseen scripts. What assumption changed: the model, not a preprocessor, groups bytes. What objective changed: none (next-byte or next-patch prediction). What problem it solved: no vocabulary to migrate or expand. What new failure mode it introduced: 2–10× longer sequences (R10.8) or a second, small model that decides patch boundaries (R10.9). Changed primitive: static codebook → learned grouping.

**Subword regularization and BPE-dropout** — this file
Why it exists: exploit segmentation ambiguity as training noise. What assumption changed: one string may be presented in several segmentations. What objective changed: expectation over sampled segmentations. What problem it solved: robustness on low-resource and out-of-domain data (R10.3); PAPER-REPORTED (R10.46): BPE-dropout "stochastically corrupts the segmentation procedure of BPE" and reports up to 2.3 BLEU over BPE. What new failure mode it introduced: train/serve mismatch if the serving tokenizer is deterministic while training was sampled. Changed primitive: Viterbi/greedy → sampled segmentation.

## Extensions

Domain adaptation: a codebook trained on web text under-merges code and mathematics; [§10.2](10-2-implementations-and-normalization.md) covers the pre-tokenization decisions (digits, indentation) that dominate there. Long context: fertility multiplies directly into the effective context ([§15.4](../../part-03-model-architectures-and-state/ch15-position-long-context-and-effective-information-access/15-4-effective-context.md)). Multimodality: image and audio "tokens" are not produced by these algorithms but by encoders; only their placeholders pass through the text tokenizer ([§10.5](10-5-tool-and-multimodal-interfaces.md)). Agents: tool-call syntax is text, so its tokenization is subject to the same merge table; a schema token split across merges is a source of parse fragility ([§51.1](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-1-tool-representation.md)). Embodiment: action tokenization (discretised continuous controls) is a separate codebook design owned by Chapter 60. Proposals only.

## Limitations

The algorithms are stated for a fixed normalised corpus; on a streaming corpus the merge table depends on the sample. The complexities assume pre-tokens of bounded length; a pathological pre-token (a megabyte without whitespace) makes Algorithm 10.2's n large and is a denial-of-service surface at serving time. Falsification: a pair of tokenizers with identical V and normalisation whose bits-per-byte on held-out text differ by more than the V-doubling effect in Experiment 10.1 would show that the segmentation prior is a first-order design variable, contrary to the working assumption of this section. Decision consequence: choose the algorithm by the properties needed (probabilistic segmentation, deterministic replay, byte totality), not by expected loss.

## Reproducibility

Sources: R10.1 (arXiv v5, ACL 2016 text), R10.2 (OpenAI PDF), R10.3 (arXiv PDF), R10.4 (arXiv PDF), R10.6–R10.9 (arXiv PDFs), R10.22 (handout v26.0.3), all opened 2026-09-20 with local text extraction. Algorithms 10.1–10.5 are the book's restatements and have not been executed (UNVERIFIED). Exact metric definitions: tokens per byte over the UTF-8 bytes of the normalised text; bits per byte per [§2.3](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/02-3-information-theory.md). Unresolved: the WordPiece likelihood criterion (NOT-DISCLOSED); the tie rule of any production tokenizer other than the CS336 reference (NOT-DISCLOSED).

## References

R10.1 · R10.2 · R10.3 · R10.4 · R10.5 · R10.6 · R10.7 · R10.8 · R10.9 · R10.12 · R10.13 · R10.22 · R10.45 · R10.46 · [notation.md](../../../front-matter/notation.md) · [references.md](references.md)
