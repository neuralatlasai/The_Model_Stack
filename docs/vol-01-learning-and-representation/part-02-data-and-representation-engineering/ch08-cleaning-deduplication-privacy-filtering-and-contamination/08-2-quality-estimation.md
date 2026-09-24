---
id: ms.section.8.2
entity_type: section
title: Quality estimation
short_title: Quality filters
volume: 1
part: 2
chapter: 8
section: 8.2
slug: 08-2-quality-estimation
parent: ms.chapter.8
prev_sibling: ms.section.8.1
next_sibling: ms.section.8.3
children: []
prerequisites: [ms.section.8.1, ms.section.2.5, ms.section.4.6, ms.section.6.3]
downstream: [ms.section.8.6, ms.section.9.2, ms.section.9.4, ms.section.11.3, ms.section.21.5]
related: [ms.section.6.5]
siblings_by_mechanism: [ms.section.9.4, ms.section.11.3]
relations:
  - {type: supported_by, target: paper.P06}
  - {type: supported_by, target: paper.P07}
  - {type: supported_by, target: paper.P02}
  - {type: supported_by, target: paper.P03}
  - {type: supported_by, target: paper.P04}
  - {type: implemented_by, target: impl.pytorch}
  - {type: implemented_by, target: impl.vllm}
axes:
  lifecycle: [data]
  mechanism: [quality_filtering, classification, perplexity_scoring]
  feedback_setting: []
  modality: [text]
papers: [P02, P03, P04, P06, P07]
implementations: [impl.pytorch, impl.vllm]
benchmarks: []
datasets: [dataset.fineweb-edu, dataset.dclm-baseline, dataset.c4, dataset.the-pile]
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED]
  empirically_observed: false
word_count_target: 2300
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 8.2 Quality estimation

## Scope

Objective: treat every quality filter — hand rule, learned classifier, perplexity score — as a classifier with a threshold, derive the retained distribution it produces from its selection rate and error rates, and give the algorithms by which the reference corpora chose their thresholds. Baseline: the heuristic pipelines of P02, R8.1 and P04 and the classifier pipelines of R8.7, P03, P07 and P06. Success criterion: the reader can state, for any filter, its selection rate, which distribution survives, and what a matched-token ablation must show before the filter is adopted. Boundaries: domain reweighting after filtering is owned by [§9.2](../ch09-data-mixtures-curricula-and-sample-efficiency/09-2-quality-and-diversity.md) and learned mixture selection by [§9.4](../ch09-data-mixtures-curricula-and-sample-efficiency/09-4-learned-mixture-selection.md); synthetic-data selection by [§11.3](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-3-selection-and-verification.md).

## Why this exists

What failed before was thresholds chosen by inspection and never costed. C4's authors "only retained lines that ended in a terminal punctuation mark" and "discarded any page with fewer than 3 sentences" (P02, PAPER-REPORTED); The Pile's authors judged C4's terminal-punctuation, "javascript" and three-sentence-deduplication rules "too aggressive" (P03 Appendix C.1.1, PAPER-REPORTED); FineWeb measured the first one at "around 30% of all tokens" removed (P06 §3.5, PAPER-REPORTED). The bottleneck is that "quality" has no label: DCLM's human-judgment appendix concludes that "human quality judgments have only limited value in identifying high-quality training data" (P07 §1, PAPER-REPORTED), so a filter cannot be validated against ground truth, only against downstream outcomes at matched tokens. The dominant constraint is the coupling between selection rate and retained distribution: a strict threshold keeps a purer but narrower distribution, and the two cannot be tuned independently. What changed is that P06 derived thresholds from paired statistics of a known-better and known-worse corpus, and P07 fixed a training and evaluation recipe so that a filter is judged by one number at one scale; this section formalises both.

## Intuition

Physically, a filter is a scoring function `s(x) ∈ ℝ` on documents and a threshold τ; the corpus after the filter is the sub-population `{x : s(x) ≥ τ}`. The cost of scoring ranges from a few string counts per document (rules), through a linear classifier over hashed n-grams (fastText, logistic regression), to a forward pass of a 70 B-parameter model per document (LLM annotation), a range of roughly six orders of magnitude in FLOPs per document. The value of a filter is not its precision on a labelled set but the change in downstream score of a model trained on the survivors at the same token count. Heuristically, one speaks of "educational" or "high-quality" text; the physical statement is that documents scored by a classifier trained on reference set R are close to R under the classifier's features, and training on them moves the model toward whatever R makes easy to learn.

## Formulation

Let the input population be a mixture p = π p_g + (1−π) p_b of "good" and "bad" documents under whatever criterion the downstream evaluation rewards (the criterion is not observed; π, p_g, p_b are latent). A filter with score s and threshold τ has TPR(τ) = P(s ≥ τ | g) and FPR(τ) = P(s ≥ τ | b).

> **Definition — selection rate (of a filter).** σ(τ) = P(s ≥ τ) = π·TPR(τ) + (1−π)·FPR(τ), the fraction of input units kept.

> **Definition — retained distribution.** The distribution of surviving documents, q_τ = [π·TPR(τ)·p_g|keep + (1−π)·FPR(τ)·p_b|keep] / σ(τ), where p_g|keep is p_g restricted to {s ≥ τ}.

$$
\sigma(\tau) = \pi\,\mathrm{TPR}(\tau) + (1-\pi)\,\mathrm{FPR}(\tau), \qquad
\mathrm{Prec}(\tau) = \frac{\pi\,\mathrm{TPR}(\tau)}{\sigma(\tau)}, \qquad
\mathrm{Rec}(\tau) = \mathrm{TPR}(\tau)
$$
*(Eq. 8.3)* where π = good prior in the input; Prec = fraction of survivors that are good; Rec = fraction of good input that survives.

Two consequences follow. First, tokens available after filtering are D_keep = σ(τ)·D_in, so at a fixed training budget D the filter is neutral to compute only while σ(τ)·D_in ≥ D; below that the model repeats data ([§9.6](../ch09-data-mixtures-curricula-and-sample-efficiency/09-6-data-scaling-limits.md)). Second, the retained *good* distribution p_g|keep is not p_g: it is p_g re-weighted toward high scores, so a filter with perfect precision still narrows the good distribution. That narrowing is the "rare-data loss" of §8.6.

> **Definition — rule filter / learned quality filter / perplexity filter.** Three families of s: a rule filter computes document statistics and thresholds them individually; a learned quality filter is a classifier trained to separate a reference set from the crawl; a perplexity filter scores documents by a reference language model's cross-entropy.

A stochastic threshold replaces the step at τ by an acceptance probability a(s). GPT-3 kept a document iff `np.random.pareto(α) > 1 − document_score` with α = 9 (R8.7 Appendix A, PAPER-REPORTED). Under NumPy's Lomax parameterisation, P(X > x) = (1 + x)^{−α}, so

$$
a(s) = P(\text{keep} \mid s) = (2 - s)^{-\alpha}, \qquad a(1) = 1,\; a(0.9) \approx 0.42,\; a(0.5) \approx 0.026 \text{ at } \alpha = 9
$$
*(Eq. 8.4)* where s ∈ [0,1] is the classifier score; the parameterisation of the sampler is ASSUMED to be NumPy's Lomax form because R8.7 names the function but not the distribution.

A perplexity filter scores a document by the reference model's per-token or per-byte cross-entropy ([§2.3](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/02-3-information-theory.md), [§4.6](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-6-likelihood-and-capability.md)):

$$
s_{\text{ppl}}(x) = -\frac{1}{|x|_{\text{bytes}}}\sum_{t} \log_2 q_{\text{ref}}(x_t \mid x_{<t})
$$
*(Eq. 8.5)* where q_ref = the reference model (a 5-gram Kneser–Ney model over SentencePiece tokens in R8.2); byte normalisation removes tokenizer dependence; low s_ppl means close to the reference domain.

A percentile threshold is the quantile of s over the input: τ_p = Q_s(1 − p) keeps the top fraction p, so σ = p by construction and the threshold is a function of the crawl, not a constant (P07's top-10 % rule; the Pareto rule above targets a similar σ implicitly).

> **Assumption.** The downstream criterion is monotone in the classifier score within the retained range · *sensitivity:* P07 Appendix N reports that ROC-AUC of filters against human labels does not order their CORE scores (Fig. 9, PAPER-REPORTED); if the assumption fails, a higher threshold can lower downstream quality, which is why thresholds are ablated rather than set.

## Mechanism

**Rule filters.** The MassiveText rules that P04 and P06 reuse "using the original thresholds" are: remove a document that "does not contain between 50 and 100,000 words, or whose mean word length is outside the range of 3 to 10 characters"; remove documents "with a symbol-to-word ratio greater than 0.1 for either the hash symbol or the ellipsis"; remove documents "with more than 90% of lines starting with a bullet point, or more than 30% ending with an ellipsis"; require "that 80% of words in a document contain at least one alphabetic character"; and drop documents that do not contain "at least two of the following English words: the, be, to, of, and, that, have, with" (R8.1 §A.1.1, PAPER-REPORTED). The repetition table removes documents above a duplicate-line fraction of 0.30, duplicate-paragraph fraction 0.30, duplicate-line-character fraction 0.20, duplicate-paragraph-character fraction 0.20, top-2/3/4-gram character fractions 0.20/0.18/0.16, and duplicate-5- through 10-gram character fractions 0.15 down to 0.10 (R8.1 Table A1, PAPER-REPORTED). Cost: O(words) counting plus O(n·words) n-gram hashing per document; no model.

FineWeb's contribution is a procedure rather than a rule. It computed "over 50 high-level statistics" on a known-better corpus (the individually deduplicated 2013-48 snapshot) and a known-worse one (the globally deduplicated remainder), "identified metrics for which the distribution of values differed significantly", chose thresholds "where the lower quality dataset frequency was higher", obtained "16 candidate metric-threshold pairs", ablated each at 28 B tokens, and kept three: fraction of lines ending with punctuation ≤ 0.12 (10.14 % of tokens removed, against 30 % for C4's rule), fraction of characters in duplicated lines ≥ 0.1 (12.47 %; MassiveText's threshold is 0.2), and fraction of lines shorter than 30 characters ≥ 0.67 (3.73 %); together "~22% of tokens were removed and the aggregate score increased by about 1%" (P06 §3.6, PAPER-REPORTED). The paper is inconsistent on two of these numbers: its Appendix E.4 Table 2 lists the duplicated-line-character threshold as 0.01, not 0.1, and 3.37 % rather than 3.73 % for the short-line rule at 0.67 (P06 App. E.4, PAPER-REPORTED), and datatrove's `FineWebQualityFilter`, which the reference FineWeb script runs with defaults, sets `char_duplicates_ratio = 0.01` (R8.16, main at `356bca2`, read 2026-09-25, not executed); which value produced the release is therefore UNVERIFIED from the paper alone. The procedure is Algorithm 8.2. Its cost is the 16 ablation runs, not the rules.

**Learned classifiers.** GPT-3 trained a "logistic regression classifier with features from Spark's standard tokenizer and HashingTF" with WebText, Wikipedia and a books corpus as positives and unfiltered Common Crawl as negatives, then resampled by Eq. 8.4 "in order to take mostly documents the classifier scored highly, but still include some documents that were out of distribution" (R8.7 Appendix A, PAPER-REPORTED). The Pile used "fasttext with an n-gram size of 2" with OpenWebText2 as positives and the same Pareto thresholding "with α = 3" (P03 Appendix C.1.4, PAPER-REPORTED). DCLM trained fastText with 400 K examples (200 K positive, 200 K negative), negatives sampled from its RefinedWeb reproduction, positives from OpenHermes 2.5 and "high-scoring posts from the r/ExplainLikeImFive (ELI5) subreddit", with `wordNgrams = 2` (unigrams + bigrams raised CORE from 40.0 to 41.0 at 7B-1x), and kept "the top-10% of examples" (P07 §4.4, Appendix J.1, PAPER-REPORTED). At 1B-1x the fastText filter reached CORE 30.2 against PageRank 26.1, SemDedup 27.1, a BGE-embedding classifier 27.2, AskLLM 28.6, perplexity filtering 29.0 and top-k average logits 29.2 (P07 Table 4, PAPER-REPORTED); those are one programme's numbers at one scale with one seed and are not a ranking of methods in general. FineWeb-Edu scored 460,000 pages with Llama-3-70B-Instruct on an additive 0–5 scale prompted "to focus on grade-school and middle-school level knowledge", trained a linear regressor on the frozen Snowflake-arctic-embed-m embedding on 410,000 annotations with 50,000 held out, rounded outputs to integers, chose threshold 3 as "the best trade-off between performance on knowledge and reasoning intensive benchmarks and the performance on other benchmarks like HellaSwag", reports F1 82 % at that threshold, and states that "applying the classifier to the 15 trillion tokens of FineWeb required 6,000 H100 GPU hours" (P06 §4, PAPER-REPORTED); the released card repeats the threshold recommendation and adds a weighted six-class F1 of 0.71 (R8.27, OFFICIAL-DOCUMENTATION). Cost line: fastText scoring is O(words) per document on CPU and a 126 MB-class model; the embedding regressor is one encoder forward pass per document on GPU — 6,000 H100-hours per 15 T tokens is 2.5 T tokens per 1,000 GPU-hours; the LLM annotation is 460 K forward passes of a 70 B model, whose GPU-hours are NOT-DISCLOSED.

**Perplexity signals.** CCNet trained per-language 5-gram Kneser–Ney models in KenLM on Wikipedia with a SentencePiece tokenizer, scored each paragraph, and split each language "into three even parts head, middle and tail" by perplexity; it reports that "journalistic and well written content ends up in the head" but also that valid text "ends up in the tail because they have a vocabulary very different from Wikipedia", including "blog comments with spoken-like text, or very specialized forums with specific jargon", and therefore "decided to not remove content based on the LM score" (R8.2 §3.4, §5.2, PAPER-REPORTED). Gopher's authors considered ranking by an existing model's likelihood and declined because "samples that are assigned high likelihood by a model are not necessarily high quality", it "requires inferring likelihoods for a large number of documents", and it "carries an increased risk of introducing unintentional bias" (R8.1 §A.1.1, PAPER-REPORTED). Cost line: a KenLM 5-gram is CPU-bound; CCNet reports the LM at 13 % and SentencePiece at 33 % of per-shard CPU time (R8.2 §4, PAPER-REPORTED); a neural reference model costs one forward pass per document (2N FLOPs per token by the §5.6 rule).

**Domain-sensitive filters.** Filters encode the domain of their reference set. R8.11 found that C4's bad-word blocklist "disproportionately removes documents in dialects of English associated with minority identities" (PAPER-REPORTED); P04 chose "neutral filtering" — "we avoid using ML-based filtering outside of language identification" and "use only URL filtering for adult content" — citing that content-word blocklists over-filter "legal and medical content" (P04 §3, Appendix G.1, PAPER-REPORTED); R8.1 used SafeSearch signals rather than word lists for the same reason (PAPER-REPORTED). The educational classifier of P06 is domain-sensitive by design (grade-school focus) and its card warns that "the model's performance might change for other datasets" (R8.27, OFFICIAL-DOCUMENTATION). Eq. 8.3 states the trade: raising precision on the reference domain raises the FPR on every domain the reference set under-represents.

<details><summary>Derivation of Eq. 8.4</summary>
NumPy's `pareto(a)` draws from the Lomax (Pareto II) distribution with survival function P(X > x) = (1 + x)^{−a} for x ≥ 0. The keep condition X > 1 − s has probability (1 + 1 − s)^{−a} = (2 − s)^{−a}. At a = 9: (1.1)^{−9} = 0.424, (1.5)^{−9} = 0.026. MATHEMATICALLY-DERIVED under the ASSUMED parameterisation.
</details>

## Algorithm

```text
Algorithm 8.2 — Statistic-driven threshold selection (P06 procedure, formalised)
INPUT   corpora H (known-better) and W (known-worse) of documents; statistic functions f_1..f_m; ablation budget K runs;
        training recipe R (model, tokens, seeds); evaluator E
OUTPUT  set F of (f_j, direction, τ_j) rules with measured removal fraction and paired score delta
STATE   histograms h_H[j], h_W[j]; candidate list C
INVARIANT a rule enters F only if its paired delta interval (§2.5) excludes zero
1.  for j in 1..m: h_H[j], h_W[j] ← histogram(f_j over H), histogram(f_j over W)
2.  C ← { j : divergence(h_H[j], h_W[j]) > δ }                       # metrics whose distributions differ
3.  for j in C: τ_j ← argmax over bins of (h_W[j] − h_H[j]) region boundary; direction ← side where W dominates
4.  for j in C (at most K): corpus_j ← apply rule (f_j, direction, τ_j) to a fresh snapshot; train R on corpus_j and on baseline, two seeds each; score with E
5.  keep rule j iff mean paired delta > 0 and its interval excludes 0; record removal fraction
6.  F ← kept rules; optionally re-run step 4 on their conjunction
TERMINATION: m statistics, ≤ K ablations.
```

Complexity: step 1–3 O(|H| + |W|) document passes; step 4 K training runs — at the P06 scale each is a 1.71 B model on 28 B tokens, two seeds. Implementation: statistics are the `stats` blocks of datatrove (R8.16); training is outside this chapter (Chapter 19).

```text
Algorithm 8.3 — Learned quality filter with percentile threshold and ledger
INPUT   reference set R_pos; crawl sample R_neg; crawl D; keep fraction p; feature spec (unigram | unigram+bigram); ledger L
OUTPUT  retained corpus D_keep; classifier id and version; τ_p
STATE   classifier c; score array S
INVARIANT |D_keep| / |D| = p ± sampling error; every dropped document has a ledger row with score and τ_p
1.  c ← train_linear_classifier(R_pos labelled 1, R_neg labelled 0, features)     # fastText-class or logistic regression
2.  for x in D: S[x] ← c.prob_positive(x)
3.  τ_p ← quantile(S, 1 − p)
4.  for x in D: if S[x] ≥ τ_p: D_keep += x else L += (x.id, stage, c.id, c.version, S[x], τ_p, DROP_DOC, "quality_below_percentile")
5.  return D_keep, c.id, τ_p
TERMINATION: two passes over D (score, threshold) plus one quantile computation.
```

Complexity: training O(|R_pos| + |R_neg|) epochs over hashed features; scoring O(words) per document; the quantile needs either a full score pass or a streaming estimator. Memory: model size (fastText-class, ~10²–10³ MB depending on buckets — NOT-DISCLOSED for P07's released classifier) plus S. Implementation: fastText for P07; the FineWeb-Edu regressor runs as an encoder head in the *Model / autograd framework* layer (PyTorch, R8.32) and scoring 15 T tokens is the 6,000 H100-hour cost above.

## Implementation

Tensors → operators: rule filters are string counters; fastText is an embedding-bag over hashed n-grams and a linear layer; the FineWeb-Edu filter is an encoder forward `[B, T] → [B, d]` pooled embedding → linear → scalar, with the encoder frozen (P06 §4). Framework: PyTorch (#17, *Model / autograd framework*; documentation at 2.14 opened as R8.32) hosts the encoder head; Hugging Face Transformers (#26, *Model definition / adaptation*) supplies the encoder definition. Kernels: none specific; the encoder is a standard forward. Memory: scoring is inference-only, so activation memory is `[B, T, d]` per layer without saved tensors. Communication: none; documents are independent, so scoring shards trivially. Deployment: LLM annotation at the P06 scale (460 K documents through a 70 B-parameter instruct model) is a batched offline-inference workload of the kind vLLM (#41, *Inference engine*) serves with continuous batching (R8.25, OFFICIAL-DOCUMENTATION); its throughput for this prompt length and model is NOT-DISCLOSED and is developed in [§43.2](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch43-runtime-architecture-and-inference-engine-selection/43-2-vllm.md).

> **Implementation note [impl.pytorch · 2.14 documentation redirect, R8.32, no API page opened].** No claim in this section depends on a PyTorch API; the framework is named as the layer at which the regressor head runs.

## Experimental design

### Experiment 8.2 — Threshold sweep at matched tokens

- **Hypothesis.** For a learned quality filter, downstream aggregate score is non-monotone in the keep fraction p: it rises as p falls from 1.0, peaks, then falls as the retained good distribution narrows (Eq. 8.3) and the token pool forces repetition.
- **Setup.** One filtered-and-deduplicated pool (P06 or P07 baseline); classifier fixed; p ∈ {1.0, 0.5, 0.3, 0.2, 0.1, 0.05}; 28 B tokens sampled per p (or all tokens with repetition when σ·D_in < 28 B, recorded); two seeds.
- **Independent variables.** p; classifier reference set (OH-2.5 + ELI5 vs Wikipedia vs OpenWebText2, following P07 Table 5).
- **Controlled variables.** Model, tokenizer, steps, batch, optimizer, evaluator (lighteval R8.26 or the P07 suite), benchmark set.
- **Dataset / workload.** The pool; P06's eight benchmarks and P07's CORE subset.
- **Hardware.** Any; report GPU-hours per run and CPU-hours of scoring.
- **Metrics.** Aggregate and per-benchmark accuracy; removal fraction; epochs over the pool at each p.
- **Baselines.** p = 1.0 (no classifier).
- **Expected result.** A peak between p = 0.1 and 0.3 for reasoning-heavy benchmarks and a monotone decline on HellaSwag-type benchmarks beyond a stricter p, consistent with P06's threshold-3 trade-off statement.
- **Ablation.** Replace the step threshold with the Pareto rule of Eq. 8.4 at matched σ.
- **Interpretation.** The adopted p is the largest p whose paired delta against the peak includes zero (cheapest configuration not distinguishable from the best measured).
- **Threats to validity.** Two seeds; benchmark truncation; peak location may shift with model scale (P07 reports high but imperfect rank correlation across scales: Pearson r = 0.838, 0.956, 0.982 for 400M-1x, 1B-1x, 3B-1x against 7B-1x, PAPER-REPORTED).

## Observations

**What the paper claims.** P07 claims fastText OH-2.5 + ELI5 at top-10 % "gives a 3.5 percentage point lift on CORE" over its RefinedWeb reproduction and outperforms six other model-based filters at 1B-1x (PAPER-REPORTED). P06 claims three statistically derived rules remove ~22 % of tokens for ~1 % aggregate gain at 28 B tokens, and that FineWeb-Edu "outperforms all openly accessible web-based datasets" on MMLU, ARC and OpenBookQA at 1.71 B / 350 B (PAPER-REPORTED). R8.2 claims perplexity is "a relative good proxy for quality" with stated tail exceptions (PAPER-REPORTED).

**What the evidence shows.** The classifier results of P06 and P07 come from two independent programmes with different reference sets, both finding classifier filtering beneficial at matched tokens; that convergence is the strongest evidence in this section. The relative ordering among model-based filters is one programme's single-seed result. The human-judgment finding of P07 is an argument against validating filters by annotation and has no independent replication in the opened sources.

**What we infer.** DERIVED: Eq. 8.3 implies that any filter with σ < 1 narrows the good distribution, so the trade-off P06 reports between knowledge-intensive benchmarks and "other benchmarks like HellaSwag" is a predictable consequence, not an anomaly. ASSUMED: the Pareto acceptance function of Eq. 8.4 uses NumPy's Lomax form.

**What remains unknown.** NOT-DISCLOSED: the GPU-hours of the 460 K LLM annotations; fastText model sizes for P07's released classifier; the human-label agreement on "educational" scores. UNVERIFIED: whether the top-10 % rule transfers to crawls other than Common Crawl or to non-English text.

## Failure modes

> **Failure mode — classifier learns the extractor.** *Symptom:* the classifier scores boilerplate-heavy pages low regardless of content. *Cause:* negatives extracted with a different tool than positives; P07 notes trafilatura-extracted negatives "may lead to the fastText models over-relying on these 'spurious' features" (PAPER-REPORTED). *Detection:* score the same pages through two extractors. *Mitigation:* extract positives and negatives identically.

> **Failure mode — token starvation.** *Symptom:* the ablation at a strict p repeats data; downstream gain vanishes or reverses. *Cause:* σ(τ)·D_in < D. *Detection:* epochs > 1 in the training log. *Mitigation:* record epochs; compare at matched *unique* tokens ([§9.6](../ch09-data-mixtures-curricula-and-sample-efficiency/09-6-data-scaling-limits.md)).

> **Failure mode — reference-domain over-filtering.** *Symptom:* a domain (medical, legal, dialect, code) nearly disappears after filtering. *Cause:* the reference set under-represents it (R8.11, P04). *Detection:* removal fraction per source domain and per language in the ledger. *Mitigation:* neutral rules for that stage; per-domain thresholds; §8.6 rare-data audit.

> **Failure mode — threshold tied to a crawl.** *Symptom:* a percentile threshold copied to a new crawl keeps a different fraction. *Cause:* τ_p is a quantile of the crawl's score distribution. *Detection:* recompute σ on the new crawl. *Mitigation:* store τ and σ together in the stage contract.

## Siblings

**Rule filter** — this file. Why it exists: cheap, inspectable, no reference set. What assumption changed: none. What objective changed: none. What problem it solved: removes structurally broken documents at O(words). What new failure mode it introduced: thresholds are language-specific (R8.12). Changed primitive: none.

**Learned quality filter** — this file. Why it exists: rules cannot express "reads like a reference corpus". What assumption changed: a reference set defines quality. What problem it solved: 3.5 CORE points at 7B-1x in P07. What new failure mode it introduced: reference-domain bias; extractor leakage. Changed primitive: statistic threshold → linear classifier over hashed n-grams or an embedding.

**Perplexity filter** — this file. Why it exists: a language model of a reference domain is a density estimate. What assumption changed: low cross-entropy under the reference means quality. What problem it solved: language-agnostic scoring with one model per language (R8.2). What new failure mode it introduced: jargon and dialogue land in the tail (R8.2); samples "assigned high likelihood by a model are not necessarily high quality" (R8.1). Changed primitive: classifier → reference LM.

**Learned mixture selection** — [§9.4](../ch09-data-mixtures-curricula-and-sample-efficiency/09-4-learned-mixture-selection.md)
Why it exists: choose domain weights rather than document membership. What assumption changed: the unit is the domain. Changed primitive: per-document threshold → per-domain weight.

**Synthetic-data selection and verification** — [§11.3](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-3-selection-and-verification.md)
Why it exists: generated data can be verified by execution or a judge, not only scored. Changed primitive: score threshold → verifier outcome.

## Extensions

For code, quality statistics are per-file (line length, alphanumeric fraction, auto-generated markers) and R8.10 combined visual inspection of 30,000 files per language with per-extension caps (PAPER-REPORTED). For mathematics and science, a domain classifier's reference set is the domain itself and Eq. 8.3's narrowing is the intended effect. For multilingual corpora, R8.12 adapted the tunable thresholds of three FineWeb filter groups per language by comparing distribution-based rules and reports 207 ablation models of 29B tokens each to choose among them (PAPER-REPORTED). For LLM-scored data, the annotation prompt is part of the filter's version. These are proposals for the reader's pipeline.

## Limitations

Every threshold above is a design input validated at ≤ 7 B parameters and ≤ 276 B tokens; P07 states it "could not test all approaches at larger scales nor train models beyond 7B parameters" (PAPER-REPORTED). Eq. 8.3 treats "good" as a latent binary; real utility is continuous and task-dependent. The falsification condition is a matched-token ablation in which a stricter threshold at σ·D_in ≥ D lowers the aggregate score on the benchmarks the filter was built for. Decision consequence: adopt a filter only with its ablation manifest, its σ on the target crawl, and its per-domain removal fractions.

## Reproducibility

Record: rule set and thresholds with version; classifier training data (positive and negative sets with hashes), features, hyperparameters, model file hash; threshold τ and realised σ; the LLM annotation prompt and model revision for synthetic labels; evaluator version; seeds. Unknowns: P07's fastText hyperparameters beyond `wordNgrams = 2` are "mostly ... the default settings" (PAPER-REPORTED) and are not enumerated; P06's regressor is fully specified (20 epochs, lr 3e-4, frozen encoder) but the embedding model revision is given only by name.

## References

P02 · P03 · P04 · P06 · P07 · R8.1 · R8.2 · R8.7 · R8.10 · R8.11 · R8.12 · R8.16 · R8.25 · R8.26 · R8.27 · R8.32 · [references.md](references.md)
