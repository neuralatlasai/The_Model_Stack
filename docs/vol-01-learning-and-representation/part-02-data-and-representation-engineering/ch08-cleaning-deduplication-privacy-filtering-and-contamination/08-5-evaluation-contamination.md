---
id: ms.section.8.5
entity_type: section
title: Evaluation contamination
short_title: Decontamination
volume: 1
part: 2
chapter: 8
section: 8.5
slug: 08-5-evaluation-contamination
parent: ms.chapter.8
prev_sibling: ms.section.8.4
next_sibling: ms.section.8.6
children: []
prerequisites: [ms.section.6.2, ms.section.6.6, ms.section.8.3, ms.section.2.5]
downstream: [ms.section.8.6, ms.section.11.4, ms.section.21.6, ms.section.61.3, ms.section.61.4]
related: [ms.section.6.2, ms.section.65.2]
siblings_by_mechanism: [ms.section.6.2, ms.section.61.4]
relations:
  - {type: supported_by, target: paper.P07}
  - {type: supported_by, target: paper.P05}
  - {type: supported_by, target: paper.P03}
  - {type: implemented_by, target: impl.vllm}
axes:
  lifecycle: [data, evaluation]
  mechanism: [decontamination, n_gram_overlap, paraphrase_detection, membership_inference]
  feedback_setting: []
  modality: [text, code]
papers: [P03, P05, P07]
implementations: [impl.vllm]
benchmarks: []
datasets: [dataset.dclm-baseline, dataset.dolma, dataset.c4, dataset.the-stack]
status:
  maturity: active
  disputed: true
evidence_summary:
  labels_used: [PAPER-REPORTED, DERIVED, MATHEMATICALLY-DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED]
  empirically_observed: false
word_count_target: 2300
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 8.5 Evaluation contamination

## Scope

Objective: give the detectors by which evaluation content is found in training data — exact and n-gram overlap, paraphrase and translation leakage, code clones, synthetic contamination, timestamp-based analysis — with the exact protocols the reference papers report, the cost of each, and the limit of what each can see. Baseline: the 13-gram protocol of R8.7 as inherited by P03, the question-plus-option rule of P07, the Bloom-seeded rule of P05. Success criterion: the reader can run a stated detector, report a clean-versus-dirty difference with an interval, and say which contamination forms the detector cannot detect. Boundaries: contamination as a partitioning failure — what a split must guarantee, test-exposure ledgers, temporal splits — is owned by [§6.2](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-2-data-partitioning.md); benchmark versioning and validity threats by [§61.3](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-3-version-and-protocol-control.md) and [§61.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-4-validity-threats.md); synthetic-data risks by [§11.4](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-4-distributional-risks.md).

## Why this exists

What failed before was post-hoc discovery. GPT-3's authors found that "a bug resulted in only partial removal of all detected overlaps", flagged ">90% of task examples from QuAC, SQuAD2, and DROP as potentially contaminated", found that four Wikipedia language-modelling benchmarks and the Children's Book Test were "almost entirely contained in our training data" and did not report them, and marked PIQA and Winograd with asterisks after clean-subset drops of 3 and 2.6 points (R8.7 §4, PAPER-REPORTED). R8.11 found verbatim test targets of generation benchmarks in C4 at 1.87–24.88 % and GLUE test inputs "from less than 2% to over 50%" (PAPER-REPORTED). The bottleneck is that string matching is the only detector cheap enough to run over 10¹³ tokens, and R8.8 showed that "simple variations of test data (e.g., paraphrasing, translation) can easily bypass these decontamination measures" — a 13 B model fine-tuned on rephrased test sets reached MMLU, GSM-8K and HumanEval scores "on par with GPT-4" while "undetectable by n-gram overlap" (PAPER-REPORTED). The dominant constraint is that every detector defines contamination by a similarity relation it can compute, and the relation the benchmark's validity depends on may be wider. What changed is that the community now reports per-detector results with their false-positive behaviour (P07 states its rule "still incurs many false positives"), runs clean-versus-dirty comparisons rather than removal alone, and has a longitudinal detector (R8.9) that needs no access to the training set.

## Intuition

Physically, a contamination detector is a membership test between two sets — training records and evaluation items — under some relation. Exact and n-gram overlap are hash-set lookups: index the evaluation set's n-grams once (megabytes), scan the corpus once (O(tokens)). Paraphrase detection needs a semantic representation: an embedding index over the evaluation set and a nearest-neighbour query per training record, then a judgement per candidate pair; cost grows with the candidate count. Temporal analysis needs no training data: it partitions the evaluation set by release date around the model's cutoff and compares pass rates. Membership inference queries the model itself. Heuristically one says the model has "seen the test"; the physical statement is that a training record shares enough of an evaluation item's surface form or content that the item's score no longer measures what [§6.2](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-2-data-partitioning.md) intended.

## Formulation

Let E be the evaluation set of items e (each a string or a (question, options, answer) tuple), and T the training corpus of records t.

> **Definition — contamination detector.** A procedure δ_R(t, e) ∈ {0, 1} that flags a training record t as overlapping evaluation item e under a stated relation R ∈ {exact, n-gram, paraphrase, translation, clone, embedding, temporal}; an item is *dirty* under R if ∃ t: δ_R(t, e) = 1.

> **Definition — rephrase contamination.** Presence in T of a paraphrase or translation of e (same answer-determining content, different surface form) such that δ_n-gram(t, e) = 0 for all t while a semantic detector or a fine-tuning test shows exposure.

The n-gram detector with window N flags e if any N-gram of e (normalised) occurs in T:

$$
\delta_N(e) = \mathbb{1}\Big[\exists\, g \in G_N(e):\; c_T(g) \ge 1\Big], \qquad \text{dirty fraction } \hat d_N = \frac{1}{|E|}\sum_{e} \delta_N(e)
$$
*(Eq. 8.13)* where G_N(e) = set of N-grams of e after lower-casing and punctuation removal; c_T(g) = count of g in T; R8.7 sets N to the 5th-percentile item length in words, clipped to [8, 13].

The clean-versus-dirty estimate of contamination's effect on a score is

$$
\Delta = \bar{a}_{\text{all}} - \bar{a}_{\text{clean}}, \qquad \operatorname{Var}(\Delta) \approx \frac{\hat d\,(1-\hat d)}{|E|}\,\big(\bar a_{\text{dirty}} - \bar a_{\text{clean}}\big)^2 + \frac{\hat d^2}{|E|}\sigma^2_{\text{dirty}} + \ldots
$$
*(Eq. 8.14)* where ā = mean accuracy on the named subset; the exact interval is obtained by bootstrapping items (§2.5) with the dirty/clean label carried; R8.7 reports Δ as the y-axis of its Figure 4.2 and the clean fraction as the x-axis.

Spurious matches set the false-positive floor. If a random N-gram of natural text appears in T with probability f_N (decreasing in N), then for an item of L words

$$
P[\text{false dirty}] \approx 1 - (1 - f_N)^{L - N + 1}
$$
*(Eq. 8.15)* where the approximation assumes independent N-grams; it is why R8.7 "ignored 13-grams that matched more than 10 training documents, as inspection showed the majority of these to contain common cultural phrases, legal boilerplate, or similar content" and why P07 restricted MMLU matching to "the last sentence from each question" and still reports many false positives (PAPER-REPORTED).

> **Assumption.** The clean subset is drawn from the same difficulty distribution as the full set · *sensitivity:* R8.7 states "we cannot be sure that the clean subset is drawn from the same distribution as the original dataset" and offers the PIQA case, where a 25× smaller model showed the same drop, as evidence that the shift there "is likely statistical bias rather than memorization" (PAPER-REPORTED); Δ is therefore an upper bound on the memorisation effect only under this assumption.

## Mechanism

**Exact overlap and n-gram checks.** R8.7's *filtering* protocol: search for 13-gram overlaps between all test/development sets and the training data, remove "the colliding 13-gram as well as a 200 character window around it, splitting the original document into pieces", discard pieces shorter than 200 characters, remove entirely documents "split into more than 10 pieces", and ignore 13-grams in more than 10 training documents; a gram is "a lowercase, whitespace delimited word with no punctuation" (R8.7 Appendix C, PAPER-REPORTED). Its *measurement* protocol used a per-dataset N (5th-percentile length, min 8, max 13), "Apache Spark to compute exact collisions across all training and test sets", and defined dirty as "any N-gram overlap with any training document" (PAPER-REPORTED). The Pile "decontaminate[s] any instances of the evaluation sets using the same 13-gram overlap filtering as in Brown et al. (2020)" (P03 §4, PAPER-REPORTED). Gopher used document-level 13-gram Jaccard above 0.8 against Wikitext103, C4, Curation Corpus and LAMBADA, and states that for benchmarks built after MassiveText — the Pile, MMLU, BIG-bench — "this has not been applied", choosing to report rather than retrain (R8.1 §A.1.1, §C, PAPER-REPORTED). R8.11 measured exact matches "normalized for capitalization and punctuation" and found LAMA T-REx and Google-RE items verbatim in C4 at 4.6 % and 5.7 % (PAPER-REPORTED). P05 seeds its Bloom filter with evaluation paragraphs and flags training paragraphs that hit it; for Paloma "only 0.003% of our dataset is removed", and a separate WIMBD analysis found "contamination of entire datasets from popular benchmarks like GLUE and SuperGLUE", largely "in our code subset, as public repositories in GitHub often contains copies of these datasets" (P05 §5.4, Appendix, PAPER-REPORTED). P07 flags "pages that contain the question text along with at least one of the corresponding answer options", removes the matched strings, and reports 7B-2x MMLU 51.8 → 52.7 and HellaSwag 77.9 → 78.4 after removal, concluding that gains "are not likely to be caused by increased presence of their test examples"; separately it measures "the number of tokens that appear in the same consecutive sequence of at least 10 tokens" between training and evaluation samples (P07 §4.6, Appendix, PAPER-REPORTED). R8.10 removed code files "that contained docstrings or solutions from HumanEval and MBPP, docstrings from APPS, questions from GSM8K, or prompts from DS1000", with 558 Python files removed at most (PAPER-REPORTED). Cost line: building the evaluation n-gram set is O(|E|·L); scanning is O(|T|) hash lookups — one pass over the corpus, CPU only, memory the size of the evaluation index (megabytes) or of the Bloom filter (P05); the expensive part is the *removal* semantics (windowed cuts change documents) and the retraining if removal is decided after training, which is the R8.7 cost that could not be paid.

**Limits of n-gram detection.** By construction δ_N sees only surface form. R8.8's Figure 1 shows an MMLU item rephrased so that "a Llama-2 13B trained on a rephrased test set can reach 85.9 accuracy on MMLU while being undetectable by n-gram overlap" (PAPER-REPORTED). R8.7's reading-comprehension case shows the converse failure: ">90%" flagged, but "the source text was present in our training data but the question/answer pairs were not" — input contamination without label contamination, which R8.11 distinguishes as "input contamination" versus "input-and-label contamination" (PAPER-REPORTED). The detector therefore over-flags passage-based benchmarks and under-flags rephrased ones, and Δ from Eq. 8.14 must be read with both in mind.

**Paraphrases and translated leakage.** R8.8 defines a rephrased sample as one with "the same semantics as the original sample but is hard to detect by existing contamination tests", generated "by using LLMs to paraphrase or translate test samples into another language"; it reports that embedding similarity "struggles to distinguish the rephrased question from other questions in the same subject" and proposes an LLM decontaminator that "first uses embedding similarity search to get the top-k samples with the highest similarity with a given test sample and then prompts a strong LLM ... to examine whether any of the top-k samples is too close to the test case"; applied to public sets it found "8-18% of the HumanEval benchmark" overlapping in RedPajama-Data-1T and StarCoder-Data and 12.8 % of HumanEval rephrased in CodeAlpaca (PAPER-REPORTED). Translation is a special case of rephrasing that additionally crosses the language filter of §8.1: a benchmark item translated into another language survives an English-only LID pass only if it is misclassified, but in a multilingual corpus (R8.12) it is retained by design. Cost line: an embedding of every training record (one encoder forward per record — for 10¹⁰ records this is the dominant cost and NOT-DISCLOSED for any corpus in the opened sources), an approximate nearest-neighbour index over |E| items (small), and one LLM judgement per (item, top-k candidate) pair — |E|·k prompts, batched offline on an inference engine (vLLM #41, R8.25); the judge's accuracy is R8.8's own report and is UNVERIFIED independently.

**Code clones.** Code contamination has a form text lacks: functionally identical programs with renamed identifiers, reordered statements or changed formatting. R8.14 reports that on duplicated code corpora "reported performance metrics are sometimes inflated by up to 100%" (PAPER-REPORTED). The detectors in the opened sources are string-level (R8.10's docstring and solution matching) and MinHash over 5-gram token shingles at Jaccard 0.7 (R8.10 §3.1); a clone detector that normalises identifiers and literals before shingling, or compares abstract-syntax-tree fingerprints, is a proposal here (ASSUMED useful; no opened source reports its contamination recall). Execution-based benchmarks add a further relation: a training record that passes the benchmark's hidden tests is contaminating regardless of surface form, which is detectable only by running the tests ([§4.3](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-3-code-and-structured-sequences.md) execution-grounded targets). Cost line: normalised shingling is the §8.3 cost; AST fingerprinting is parse cost per file; execution is the test suite's runtime per candidate.

**Synthetic contamination.** When training data is generated by a model that has itself seen the benchmark, the benchmark can re-enter the corpus rephrased. R8.8 finds this in CodeAlpaca (12.8 % of HumanEval rephrased) and cites the Phi-1 report's own discovery of synthetic data "similar to some test samples in HumanEval that is undetectable by n-gram overlap" (PAPER-REPORTED). The detector is the same LLM-decontaminator pipeline applied to the synthetic set; the mitigation belongs to generator design ([§11.1](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-1-generator-design.md), [§11.4](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-4-distributional-risks.md)).

**Timestamp-based analysis.** R8.9 uses "the natural experiment of training cutoffs" on Codeforces and Project Euler, whose problems are dated, and finds "statistically significant trends among LLM pass rate vs. GitHub popularity and release date" — a positive association between a problem's presence on GitHub and pass rate "only for problems released before the GPT training cutoff" (PAPER-REPORTED). The detector needs the model's cutoff and the items' release dates, not the training set, and it detects exposure of *content* whatever its surface form. Its limits: it needs a longitudinal benchmark; a cutoff is a stated date that models may exceed (R8.9 notes GPT-4 "acknowledges training with some small amount of data beyond its cutoff", PAPER-REPORTED); and difficulty drift over time confounds the pre/post comparison unless controlled (R8.9 controls with difficulty ratings). Canary strings — designed so trainers exclude files containing them — depend on compliance and, per R8.9, "were not sufficient to keep BIG-bench out of GPT-4's training corpus" (PAPER-REPORTED). Membership inference from the model side: R8.15's Min-K% Prob scores a text by the average log-probability of its k % least likely tokens on the premise that unseen text "contains outlier words with exceptionally low probabilities", evaluated on WIKIMIA, a benchmark built from temporally separated Wikipedia events, with a reported 7.4 % improvement over prior methods (PAPER-REPORTED); it is a black-box detector for *models*, not corpora, and belongs to §65.2 as an attack and to [§61.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-4-validity-threats.md) as an audit.

**Back to the partition contract.** Detection is downstream of design. [§6.2](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-2-data-partitioning.md) owns the rule that evaluation items must be excluded by construction — temporal splits, group splits, private test sets, one-time exams (R8.8's recommendation of "fresh, one-time exams"). This section's detectors are what remains when construction fails or when the corpus predates the benchmark, and their outputs feed the test-exposure ledger of §6.2: each dirty item gets a row (benchmark id, version, item id, detector relation, matching record ids).

<details><summary>Derivation of Eq. 8.15</summary>
An item of L words has L − N + 1 N-grams. If each independently appears in T with probability f_N, the probability that none does is (1 − f_N)^{L−N+1}; the complement is the false-dirty probability. Dependence between overlapping N-grams makes the true value smaller, so Eq. 8.15 is an upper bound under the stated approximation. MATHEMATICALLY-DERIVED; f_N is corpus-specific and NOT-DISCLOSED for any corpus in the opened sources.
</details>

## Algorithm

```text
Algorithm 8.9 — n-gram index decontamination with windowed removal (R8.7 protocol, formalised)
INPUT   evaluation manifest M = {(bench_id, version, item_id, text)}; corpus T; N (or per-benchmark N_b = clip(p5 length, 8, 13)); window w (200 chars);
        min piece length (200 chars); max pieces (10); max_df (ignore n-grams in > 10 documents); ledger L; test-exposure ledger X (§6.2)
OUTPUT  T′ with overlapping windows removed; dirty flags per item
STATE   hash set H of normalised N-grams → item ids; document-frequency counts df[g]
INVARIANT every removed window has a ledger row naming (bench_id, version, item_id); every dirty item has a row in X
1.  for (b, v, i, text) in M: for g in ngrams(normalize(text), N_b): H[g] += i
2.  first pass over T: for each document t, for each g in ngrams(normalize(t)) ∩ H: df[g] += 1
3.  H ← { g ∈ H : df[g] ≤ max_df }                                  # drop boilerplate n-grams
4.  second pass over T: for each t: hits ← positions of g ∈ H in t
5.      if hits = ∅: emit t; continue
6.      pieces ← split t by removing [pos − w, pos + |g| + w] around every hit; drop pieces shorter than min piece length
7.      if |pieces| > max pieces: L += (t.id, stage, "ngram_overlap", N_b, DROP_DOC, "contaminated_many_pieces", bench=b, item=i); continue
8.      emit pieces as new records with lineage t.id; L += one row per removed window; X += (b, v, i, "n-gram", t.id)
TERMINATION: two passes over T.
```

Complexity: O(|T|) hash lookups per pass; memory O(|M|·L) for H plus df counts; CPU only. Implementation: R8.7 used Spark for exact collisions; P05's variant seeds a Bloom filter with evaluation paragraphs (R8.29) and pays the ε false-positive rate of Eq. 8.10 instead of H's memory.

```text
Algorithm 8.10 — Semantic (rephrase) contamination detector (R8.8 pipeline, formalised)
INPUT   evaluation manifest M; corpus T (or a candidate subset, e.g. records passing a cheap lexical prefilter); embedding model φ; k; judge model J with prompt version; ledger X
OUTPUT  set of (item, record, judge verdict) triples; dirty flags under relation "paraphrase"
STATE   ANN index over φ(M); per-item candidate lists
INVARIANT every judged pair is stored with φ version, J version and prompt hash
1.  build ANN index I over {φ(e) : e ∈ M}
2.  for t in T: for (e, sim) in I.query(φ(t), k): candidates[e] += (t, sim)
3.  for e in M: for (t, sim) in top-k of candidates[e]: verdict ← J("Is t a rephrasing/translation of e?") ; store (e, t, sim, verdict)
4.  dirty[e] ← ∃ t with verdict = yes; X += (bench, version, e.id, "paraphrase", t.id, J.version)
TERMINATION: one embedding pass over T, |M|·k judge calls.
```

Complexity: |T| encoder forwards (dominant; NOT-DISCLOSED at corpus scale), |T| ANN queries, |M|·k judge prompts. Implementation: batched offline generation on an inference engine (vLLM #41, *Inference engine*; R8.25). The judge's error rates are part of the detector's version and must be estimated on a labelled set of known rephrasings (Experiment 8.5).

## Implementation

Tensors → operators: Algorithm 8.9 is hashing on CPU; Algorithm 8.10 is an encoder forward `[B, T] → [B, d]` per record and a decoder generation per judged pair. Framework: the embedding model and judge run on PyTorch (#17) through model definitions from Hugging Face Transformers (#26); generation is batched by vLLM (#41, *Inference engine*, continuous batching per R8.25, OFFICIAL-DOCUMENTATION), whose throughput for judge prompts of this length is NOT-DISCLOSED here and is developed in [§43.2](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch43-runtime-architecture-and-inference-engine-selection/43-2-vllm.md). Kernels: standard. Memory: the ANN index over |M| items is small; the embedding of T is |T|·d·b bytes if materialised (10¹⁰ × 768 × 2 ≈ 15 TB; DERIVED, illustrative), which is why R8.8 applied its detector to fine-tuning sets and selected pre-training sets rather than to full crawls. Communication: none beyond sharding. Deployment: the evaluation manifest must be frozen and versioned ([§6.6](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-6-reproducible-evidence.md)) before the corpus pass; every later benchmark addition triggers a new pass or a documented gap (R8.1's choice).

> **Implementation note [impl.vllm · landing page, R8.25, no version string shown].** Named as the engine class for batched judge prompts; no throughput figure is asserted.

## Experimental design

### Experiment 8.5 — Detector recall on injected contamination and the clean/dirty delta

- **Hypothesis.** (a) n-gram detection (N = 13) recalls ≥ 99 % of verbatim injections and < 5 % of rephrased injections; the semantic detector recalls ≥ 80 % of rephrased injections at a false-positive rate below 5 % on same-subject distractors. (b) On a model trained with verbatim injections, Δ of Eq. 8.14 is positive beyond its interval; on a model trained with rephrased injections, Δ under the n-gram labelling is ≈ 0 while Δ under the semantic labelling is positive.
- **Setup.** Take a clean base corpus (decontaminated by both detectors); inject, for a held-out benchmark, 10 % of items verbatim, 10 % paraphrased by a model, 10 % translated and back-translated, 10 % as code clones with renamed identifiers (for a code benchmark); train two 1B-class models (with and without injections) at matched tokens; run both detectors over the injected corpus.
- **Independent variables.** Injection type; detector; N ∈ {8, 13}; k and judge model for Algorithm 8.10.
- **Controlled variables.** Base corpus, model, tokens, seeds, benchmark version, evaluator.
- **Dataset / workload.** One knowledge benchmark (MMLU-style), one math benchmark (GSM-8K-style), one code benchmark with hidden tests.
- **Hardware.** Any; report CPU-hours for Algorithm 8.9 and GPU-hours for Algorithm 8.10 separately.
- **Metrics.** Detector recall and false-positive rate per injection type; Δ with item-bootstrap intervals; per-injection-type accuracy on the trained models.
- **Baselines.** The uninjected model; the R8.7 protocol as the reference n-gram detector.
- **Expected result.** As hypothesised; the code-clone case is where both detectors are expected to fail and execution-based matching to succeed.
- **Ablation.** Vary the judge model to measure verdict variance.
- **Interpretation.** A detector is adequate for a relation if its recall interval on injections of that relation exceeds a preregistered floor; the test-exposure ledger records the relations covered.
- **Threats to validity.** Injected paraphrases may be easier or harder than natural leakage; a 1B model may not exploit contamination as a 13B model did in R8.8; the judge model may itself have seen the benchmark.

## Observations

**What the paper claims.** R8.7 claims contamination "has a minimal effect on GPT-3's performance on most datasets" with PIQA and Winograd as exceptions (PAPER-REPORTED). P07 claims DCLM-Baseline's MMLU and HellaSwag gains survive removal of detected overlaps (PAPER-REPORTED). R8.8 claims n-gram and embedding detectors miss rephrased samples that a 13 B model can exploit to GPT-4-level scores, and that its LLM decontaminator finds 8–18 % HumanEval overlap in public code corpora (PAPER-REPORTED). R8.9 claims a pass-rate association with GitHub presence only before the cutoff (PAPER-REPORTED).

**What the evidence shows.** The insufficiency of n-gram detection is supported independently by R8.8 (rephrasing), R8.7 (input-only false positives) and R8.9 (exposure detectable without the training set). The claim that *detected* contamination has small effects (R8.7, P07) is consistent across two programmes but says nothing about undetected forms. No independent replication of R8.8's decontaminator recall exists in the opened sources.

**What we infer.** DERIVED: Eq. 8.14's Δ is bounded above by the detector's recall — a Δ ≈ 0 under a low-recall relation is not evidence of no contamination. DERIVED: for benchmarks distributed in public repositories, code subsets are the likely carrier (P05's WIMBD finding), so decontamination must run per source, not only on web text.

**What remains unknown.** NOT-DISCLOSED: f_N (the spurious-match rate) for any corpus; the compute of R8.8's detector at pre-training scale; the training-set membership of judge models. UNVERIFIED: transfer of R8.9's longitudinal method to non-code benchmarks; the clone-detector proposal.

## Failure modes

> **Failure mode — over-flagging passage benchmarks.** *Symptom:* > 90 % dirty on reading-comprehension sets. *Cause:* the passage is in T, the question is not (R8.7). *Detection:* separate input from label matching (R8.11). *Mitigation:* match on question and answer strings (P07's rule); report both rates.

> **Failure mode — boilerplate n-grams.** *Symptom:* every item with a licence sentence is dirty. *Cause:* high-df n-grams. *Detection:* df histogram of hits. *Mitigation:* R8.7's max_df = 10 rule; longer N for boilerplate-heavy benchmarks.

> **Failure mode — rephrase blindness.** *Symptom:* Δ ≈ 0 but scores implausibly high on a public benchmark. *Cause:* rephrased or translated leakage. *Detection:* Algorithm 8.10 on a sample; R8.9's temporal split where available. *Mitigation:* semantic pass on synthetic and fine-tuning sets first (cheapest, highest prior).

> **Failure mode — clean subset harder.** *Symptom:* Δ > 0 also for a small model. *Cause:* dirty items are easier (R8.7's PIQA reading). *Detection:* run the same Δ on a small model. *Mitigation:* report Δ with the small-model control.

> **Failure mode — post-hoc removal without retraining.** *Symptom:* the corpus card says decontaminated; the model was trained before. *Cause:* the R8.7 sequence. *Detection:* ledger timestamps versus training start. *Mitigation:* the pipeline DAG orders decontamination before tokenisation (§8.6).

## Siblings

**Partition design (temporal, group, private splits)** — [§6.2](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-2-data-partitioning.md)
Why it exists: prevention over detection. What assumption changed: the evaluation set is constructed after the cutoff or held privately. What problem it solved: no detector needed. New failure mode: benchmark ages; leakage through re-use. Changed primitive: corpus scan → split construction.

**n-gram / exact detector** — this file. Why it exists: O(tokens) cost. What assumption changed: contamination is verbatim. New failure mode: rephrasing; boilerplate false positives. Changed primitive: none.

**Semantic detector (embedding + judge)** — this file. Why it exists: rephrase blindness. What assumption changed: an LLM judge can decide "too close". New failure mode: judge cost and judge contamination. Changed primitive: hash lookup → nearest neighbour + generation.

**Temporal (cutoff) analysis** — this file. Why it exists: no training-set access. What assumption changed: items are dated and difficulty is controlled. New failure mode: cutoff leakage; drift. Changed primitive: corpus scan → pass-rate regression.

**Membership inference on the model** — [§65.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch65-security-privacy-safety-and-adversarial-robustness/65-2-training-model-attacks.md)
Why it exists: audit a released model without its data (R8.15). What assumption changed: seen text has fewer low-probability tokens. New failure mode: calibration across domains. Changed primitive: data scan → model queries.

**Benchmark validity and versioning** — [§61.3](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-3-version-and-protocol-control.md), [§61.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-4-validity-threats.md)
Why it exists: contamination is one validity threat among several. Changed primitive: detector → reporting protocol.

## Extensions

For multilingual corpora, the translation relation must be part of the manifest: each item is expanded to its machine translations in the corpus's languages before Algorithm 8.9 (a proposal; cost |M| × languages). For code, execution against hidden tests is the only relation that matches functional clones; run it on lexical candidates first. For agent benchmarks whose environments are public repositories, repository snapshots and issue threads are contamination carriers ([§63.1](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/63-1-interactive-benchmarks.md)). For synthetic data, run Algorithm 8.10 on the generator's outputs before mixing ([§11.4](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-4-distributional-risks.md)). These are proposals.

## Limitations

Every detector is defined by a relation and blind outside it; no opened source reports a detector's recall against natural (non-injected) rephrasing. Eq. 8.14 is confounded by difficulty shift. The section's claims hold for text and code benchmarks with public items; private benchmarks and interactive environments need §6.2's construction guarantees instead. The falsification condition for the "n-gram is insufficient" claim would be Experiment 8.5 showing n-gram recall on rephrased injections comparable to the semantic detector's. Decision consequence: report, for every benchmark score, which relations were checked and with what recall, and treat unchecked relations as unknown rather than clean.

## Reproducibility

Record: the evaluation manifest hash (benchmark ids, versions, item ids, normalisation), N per benchmark, window and piece thresholds, max_df, the embedding model and judge model revisions with prompt hash, k, and the test-exposure ledger rows. Unknowns: R8.7's Table C.1 per-dataset N values were not transcribed here; P07's 10-token contiguous-overlap statistics per benchmark are in its appendix and were not reproduced.

## References

P03 · P05 · P07 · R8.1 · R8.3 · R8.7 · R8.8 · R8.9 · R8.10 · R8.11 · R8.12 · R8.14 · R8.15 · R8.25 · R8.29 · [references.md](references.md)
