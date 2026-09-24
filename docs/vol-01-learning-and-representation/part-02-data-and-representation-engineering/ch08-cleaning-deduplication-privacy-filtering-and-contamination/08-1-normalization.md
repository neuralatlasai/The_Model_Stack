---
id: ms.section.8.1
entity_type: section
title: Normalization
short_title: Normalization
volume: 1
part: 2
chapter: 8
section: 8.1
slug: 08-1-normalization
parent: ms.chapter.8
prev_sibling: null
next_sibling: ms.section.8.2
children: []
prerequisites: [ms.section.7.3, ms.section.7.2]
downstream: [ms.section.8.2, ms.section.8.3, ms.section.8.6, ms.section.10.2, ms.section.12.4]
related: [ms.section.9.5]
siblings_by_mechanism: [ms.section.7.3, ms.section.10.2]
relations:
  - {type: supported_by, target: paper.P06}
  - {type: supported_by, target: paper.P07}
  - {type: supported_by, target: paper.P04}
  - {type: supported_by, target: paper.P05}
  - {type: consumes, target: concept.extraction-lineage}
axes:
  lifecycle: [data]
  mechanism: [normalization, language_identification, segmentation]
  feedback_setting: []
  modality: [text]
papers: [P02, P03, P04, P05, P06, P07]
implementations: []
benchmarks: []
datasets: [dataset.fineweb, dataset.refinedweb, dataset.dolma, dataset.c4]
status:
  maturity: established
  disputed: false
evidence_summary:
  labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED]
  empirically_observed: false
word_count_target: 2100
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 8.1 Normalization

## Scope

Objective: turn the extracted text that [§7.3](../ch07-data-provenance-acquisition-and-dataset-semantics/07-3-acquisition-and-extraction.md) hands over into a stream of well-formed, language-labelled documents with explicit boundaries, so that every later filter scores the same object. Baseline: the base-filtering stage of P06 and the pre-filtering stages of P04 and P05. Success criterion: each normalisation transform is declared reversible or irreversible, each language label carries its score and threshold, and each boundary decision is recorded. Boundaries: HTML extraction and source identifiers are owned by §7.3; tokenizer-side Unicode normalisation is owned by [§10.2](../ch10-tokenization-serialization-and-interface-correctness/10-2-implementations-and-normalization.md); packing and masks by [§12.4](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-4-packing-and-masks.md).

## Why this exists

What failed before was that quality filters were applied to text whose form was undefined. Common Crawl's WET files "retained too much boilerplate and menu text" (P06 §3.2, PAPER-REPORTED), so a filter that counts lines ending in punctuation was counting navigation menus; The Pile's authors judged the same and chose jusText on WARC because WET output "often containing large amounts of boilerplate text like menus and page footers" made "document level filtering" insufficient (P03 Appendix C.1.1, PAPER-REPORTED). The bottleneck is that every downstream statistic — word count, mean word length, duplicate-line fraction, n-gram shingles, PII regexes — is defined over characters, lines and words, and none of those units exists until encoding, segmentation and boundaries are fixed. The dominant constraint is irreversibility: a transform such as compatibility normalisation "may remove distinctions that are important to the semantics of the text" (R8.19, OFFICIAL-DOCUMENTATION), and once applied before the ledger is written it cannot be undone by replay. What changed is that the open pipelines now treat normalisation as ordered, versioned stages (P05's taggers, P06's datatrove blocks, R8.16) whose choices are ablated like any other filter, and this section formalises that practice.

## Intuition

Physically, normalisation is a set of cheap, streaming, per-document string operations whose cost is linear in bytes and whose value is that they make every later stage's statistics comparable across documents. Encoding repair is a decoding problem: a byte string that was UTF-8, decoded as a legacy code page and re-encoded, contains a characteristic pattern that can be reversed. Boilerplate removal is a density problem: lines with low text density and high link or symbol density are navigation, not content. Language identification is a classification problem whose precision, for a rare language in a crawl dominated by a few languages, is set by the prior more than by the classifier. Document boundaries are a modelling decision: they determine what the loss mask of Eq. N.2 treats as one context. Heuristically, normalisation "tidies" the text; the physical statement is that it fixes the measure over which every later selection rate is defined.

## Formulation

Let a record from §7.3 be `(source_id, bytes, extraction_lineage)`. Normalisation produces `(record_id, text, lang, lang_score, boundaries[], transforms[])` where `transforms` is the ordered list of applied stage ids with a reversibility flag.

> **Definition — normalization stage.** A transform on extracted text (encoding repair, boilerplate removal, segmentation, boundary assignment) that maps one record to zero or more records, is declared reversible or irreversible, and writes one ledger row per changed unit.

> **Definition — language-identification threshold.** The minimum classifier score τ_L at which a document is assigned its top language ℓ; below τ_L the document is dropped or routed to an "undetermined" pool.

> **Definition — document boundary.** The rule that decides where one training document ends and the next begins — one crawled page, one paragraph, one file, one thread — and therefore what packing (§12.4) treats as one context.

Language identification is a multi-class classifier with per-language prior π_ℓ in the crawl, true-positive rate TPR_ℓ(τ) and false-positive rate FPR_ℓ(τ) at threshold τ. The precision of the retained pool for language ℓ is

$$
\mathrm{Prec}_\ell(\tau) = \frac{\pi_\ell\,\mathrm{TPR}_\ell(\tau)}{\pi_\ell\,\mathrm{TPR}_\ell(\tau) + (1-\pi_\ell)\,\mathrm{FPR}_\ell(\tau)}
$$
*(Eq. 8.1)* where π_ℓ = fraction of crawl documents truly in ℓ; TPR, FPR = classifier rates at threshold τ measured on a labelled set.

The expected count of foreign documents retained under label ℓ from a crawl of N documents is

$$
\mathbb{E}[\text{false}_\ell] = N\,(1-\pi_\ell)\,\mathrm{FPR}_\ell(\tau), \qquad \frac{\mathbb{E}[\text{false}_\ell]}{\mathbb{E}[\text{true}_\ell]} = \frac{(1-\pi_\ell)}{\pi_\ell}\cdot\frac{\mathrm{FPR}_\ell(\tau)}{\mathrm{TPR}_\ell(\tau)}
$$
*(Eq. 8.2)* where the ratio shows that for π_ℓ = 10⁻⁴ even FPR = 10⁻⁴ at TPR = 0.9 yields roughly one false document per true one.

> **Assumption.** TPR and FPR measured on a balanced benchmark transfer to the crawl · *sensitivity:* R8.12 reports that for low-resource languages "real precision is often much lower than that measured on a balanced test set" and that false positives from a related high-resource language can account "for more than 90% of the data" (PAPER-REPORTED); Eq. 8.1 is the mechanism.

## Mechanism

**Encoding repair.** The repair target is mojibake — text "that were clearly meant to be UTF-8 but were decoded as something else" — and the reference tool states "a strongly-held goal of avoiding false positives – it should never change correctly-decoded text to something else" (R8.20, ftfy 6.3, OFFICIAL-DOCUMENTATION). Repair is reversible in principle (the bad decoding is a bijection) but is recorded as irreversible because the original bytes are not retained past this stage unless the dataset record keeps them. Unicode normalisation is a separate decision. UAX #15 defines NFD as canonical decomposition, NFC as canonical decomposition followed by canonical composition, and NFKC/NFKD as their compatibility counterparts, and warns that "Normalization Forms KC and KD must not be blindly applied to arbitrary text" because "they erase many formatting distinctions" (R8.19, Unicode 18.0.0 rev. 58, OFFICIAL-DOCUMENTATION). For a pretraining corpus the consequence is concrete: NFKC maps ligatures, full-width forms and superscripts to base characters, which changes byte counts, n-gram shingles and PII regex matches, and it changes them irreversibly. The tokenizer may apply its own normalisation later (§10.2); applying NFKC here as well is a double transform whose interaction is NOT-DISCLOSED for any released corpus unless its card says so. Cost: O(bytes) CPU per document; memory negligible; no accelerator.

**Boilerplate removal.** Two families exist. The first is inside the extractor (§7.3): DCLM compared resiliparse, trafilatura and WET at the 1B-1x scale and reports that "both resiliparse and trafilatura improve CORE by at least 2.5 points over the WET extraction" and that "resiliparse is 8× faster to run" (P07 §4.2, PAPER-REPORTED); FineWeb reports that trafilatura on WARC "clearly results in a more performant model" than WET (P06 §3.2, PAPER-REPORTED). The second family operates on extracted text and is what this section owns: line-wise rules. C4 kept only lines "that ended in a terminal punctuation mark", removed lines containing "Javascript", and removed lines with any of "terms of use", "privacy policy", "cookie policy", "uses cookies", "use of cookies", or "use cookies" (P02 §2.2, PAPER-REPORTED). RefinedWeb added "line-wise corrections" targeting "navigation buttons, social counters, etc." and drops the document "if these corrections remove more than 5% of a document" (P04 §3.2, PAPER-REPORTED). FineWeb tested C4's rules and found the terminal-punctuation rule alone "removes around 30% of all tokens" while the remaining rules together remove about 7 %, and adopted "all C4 filters mentioned above except the terminal punctuation filter, as it eliminates an excessively large amount of data" (P06 §3.5, PAPER-REPORTED). Cost: O(lines) regex and character counting per document; the removal fraction is the cost that matters and is the quantity the ledger must record.

**Segmentation.** Lines are split on newline; paragraphs on blank lines or `\n` (P07's BFF splits "on the newline character \n", PAPER-REPORTED); sentences by a language-aware splitter (P05 names BlingFire for its toxicity filter, PAPER-REPORTED); words by whitespace for English. FineWeb2 makes the word tokenizer a per-language object because "many writing systems use different boundary markers or have no visible markers at all", collecting tokenizers from SpaCy, Stanza and language-specific libraries (R8.12 §2, PAPER-REPORTED). Every later statistic that says "word" — Gopher's 50–100,000 words, mean word length 3–10 characters, FineWeb's lines shorter than 30 characters — depends on this choice, so the segmenter id is part of the stage contract. Cost: O(bytes); a learned sentence splitter is still CPU-bound at microseconds per sentence.

**Language identification.** The reference classifier is fastText's `lid.176`, which recognises 176 languages, ships as a 126 MB `.bin` and a 917 kB `.ftz`, was trained on Wikipedia, Tatoeba and SETimes, and is distributed under CC-BY-SA 3.0 (R8.17, OFFICIAL-DOCUMENTATION); CCNet reports it "processes 1k documents per second on a single CPU core" (R8.2 §3, PAPER-REPORTED). Thresholds differ by corpus and are a design input, not a constant: CCNet and Dolma keep documents whose score is "higher than 0.5" (R8.2) / "greater than or equal to 0.5 (removed 61.7% of the data, by byte size)" (P05 §5.1, PAPER-REPORTED); RefinedWeb and FineWeb drop documents "for which the top language scores below 0.65" (P04 §3.1) / keep "English text with a score >= 0.65" (P06 §3.3, PAPER-REPORTED); C4 used langdetect "with a probability of at least 0.99" (P02, PAPER-REPORTED); The Pile used pycld2 because "it is capable of classifying the language from the HTML directly" and roughly halved jusText compute by running it only on English pages (P03 Appendix C.1.3, PAPER-REPORTED). FineWeb2 replaced a single threshold by a per-language rule: after training models at thresholds corresponding to 5 % removal steps, it set thresholds "one standard deviation below the median of the score distributions, clipped to the range [0.3, 0.9]" and found "Arabic ... or Russian ... prefer high thresholds (>0.8), while for Swahili a lower threshold around 0.3 (corresponding to a removal rate of almost 65%) performs best" (R8.12 §4.2, PAPER-REPORTED). It also found that GlotLID "outperforms FT176 (Fig. 5) on higher resource languages while being slightly behind on lower resource languages", and adopted it for its wider language coverage (R8.12 §4.2, PAPER-REPORTED). Eq. 8.1 explains why one threshold cannot serve all languages: at fixed classifier quality, precision falls with π_ℓ, so the rare language needs either a higher threshold (losing recall) or a second precision filter — FineWeb2's "high-affinity" word lists, applied because "roughly a third of the 1900 languages had contamination scores above 10%" (R8.12 §4.4.3, PAPER-REPORTED). Cost: ~1 ms per document per core for fastText (from R8.2's rate), CPU only; memory the model size; the removal fraction (61.7 % of bytes in Dolma) dominates all other stages' removals and is the first ledger entry most documents receive.

**Formatting.** Gopher's extractor took "care to preserve any meaningful formatting, such as indentation, newlines and bullet points" and its authors attribute generative formatting diversity to that choice (R8.1 §A.1.1, PAPER-REPORTED); the same document statistics are then used as filters (more than 90 % of lines starting with a bullet is a removal rule, §8.2). Whitespace collapsing, quote uncurling and HTML-entity unescaping are irreversible transforms and belong in `transforms[]`. Cost: O(bytes).

**Document boundaries.** For web text the default boundary is one crawled page; for code it is one file (R8.10), for forums one thread or one post (P05 removes rather than masks PII in Reddit "due to the short length of many Reddit documents", PAPER-REPORTED), for paragraph-level deduplication (R8.2, P05) a document may lose interior paragraphs and keep its boundary. The boundary decides three later quantities: the unit of MinHash shingling (§8.3), the unit of quality statistics (§8.2), and the context the model sees after packing (§12.4). GPT-3 packed multiple documents into 2048-token sequences "delimited with a special end of text token" without cross-document masking (R8.7 Appendix B, PAPER-REPORTED); whether that is acceptable depends on §12.4, but the boundary itself must be fixed here and recorded.

<details><summary>Derivation of Eq. 8.1–8.2</summary>
Among N documents, Nπ_ℓ are truly ℓ and N(1−π_ℓ) are not. The classifier labels ℓ a fraction TPR of the first group and FPR of the second. Precision is true positives over all positives, giving Eq. 8.1; the ratio of expected false to true positives is the ratio of the two terms, giving Eq. 8.2. MATHEMATICALLY-DERIVED; the assumption is that TPR and FPR are the same functions of τ on the crawl as on the labelled set.
</details>

## Algorithm

```text
Algorithm 8.1 — Normalization stage with ledger emission
INPUT   record r = (source_id, bytes, lineage); stage config S = (encoding_repair, unicode_form ∈ {none, NFC, NFKC},
        line_rules[], segmenter_id, lid_model, τ_L per language, boundary_rule); ledger L
OUTPUT  zero or more records (record_id, text, lang, lang_score, boundaries[], transforms[]) ; appended rows in L
STATE   text (mutable string); transforms (list); removed_chars (int)
INVARIANT every irreversible transform appended to transforms[] before the next stage reads text;
          every dropped line or document has exactly one ledger row with reason_code
1.  text ← decode(bytes, declared_charset) ; if mojibake_detected(text): text ← repair(text); transforms += ("enc_repair", irreversible)
2.  if unicode_form ≠ none: text ← normalize(unicode_form, text); transforms += ("unicode_"+form, irreversible)
3.  removed_chars ← 0
4.  for line in split_lines(text):
5.      for rule in line_rules:
6.          if rule.matches(line): drop line; removed_chars += len(line); L += (r.id, S.id, rule.id, rule.version, score=1, thr=NA, DROP_LINE, rule.reason); break
7.  if removed_chars / len(text) > S.max_line_removal_fraction: L += (r.id, S.id, "line_frac", ..., DROP_DOC, "boilerplate_dominant"); return ∅
8.  (ℓ, s) ← lid_model.predict(text)
9.  if s < τ_L[ℓ]: L += (r.id, S.id, lid_model.id, lid_model.version, score=s, thr=τ_L[ℓ], DROP_DOC, "lid_below_threshold"); return ∅
10. boundaries ← boundary_rule.apply(text, segmenter_id)          # may split one page into several records
11. for each (record_id, span) in boundaries: emit (record_id, text[span], ℓ, s, boundaries, transforms)
TERMINATION: single pass over lines and one classifier call; no loops over the corpus.
```

Complexity: O(|bytes|) per record for steps 1–7 and 10–11; step 8 is O(|bytes|) character n-gram hashing plus a hierarchical-softmax lookup. Memory: the LID model (126 MB or 917 kB, R8.17) shared across workers; per-record buffers only. Implementation: the block order matches datatrove's `formatters` (ftfy, symbol-line remover, PII), `filters` (`url_filter`, `language_filter`, `c4_filters`, `gopher_quality_filter`, `gopher_repetition_filter`, `fineweb_quality_filter`) and `extractors` (`trafilatura`) modules as listed in the repository tree at commit `1ca2583` (R8.16, OFFICIAL-DOCUMENTATION); the ledger emission is the book's addition.

## Implementation

Tensors and operators: none — this stage is byte and string manipulation on CPU. Framework: the reference open implementations are datatrove (R8.16; `LocalPipelineExecutor`, `SlurmPipelineExecutor`, `RayPipelineExecutor`, with completion markers "by creating a marker (an empty file) in the `${logging_dir}/completions` folder" for resumption, OFFICIAL-DOCUMENTATION) and Ai2's dolma toolkit (R8.29; "a high-performance toolkit for curating datasets for language modeling" with taggers for Gopher, C4 and OpenWebText rules, OFFICIAL-DOCUMENTATION); both are outside the §4 systems table and are named here as lab code surfaces (Hugging Face #27, Ai2 #22), not as stack systems. Kernels: none. Memory: per-worker LID model plus streaming buffers; the paragraph-hash tables of §8.3 are not yet needed. Communication: none within a document; cross-document state begins in §8.3. Deployment: the stage is embarrassingly parallel over records, which is why it runs first and why its removal fraction (Dolma's 61.7 % of bytes at LID, P05) is the cheapest place to shed volume. Distributed execution — sharding, retries, resume semantics — is owned by [§12.2](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-2-transformation-execution.md).

> **Implementation note [datatrove · commit 1ca2583, 2026-09-17, not executed].** The repository's `pipeline/filters/language_filter.py`, `pipeline/formatters/ftfy.py` and `pipeline/extractors/trafilatura.py` exist at the inspected commit (R8.16); their default thresholds and behaviour beyond the module names were not read and are UNVERIFIED here.

## Experimental design

### Experiment 8.1 — Normalisation choices at matched tokens

- **Hypothesis.** Unicode form (none vs NFC vs NFKC), line-rule set (C4-all vs C4-minus-terminal-punctuation vs RefinedWeb line corrections) and LID threshold (0.5 vs 0.65 vs per-language median − 1 sd) each change the aggregate downstream score of a fixed small model by more than the seed-to-seed spread.
- **Setup.** One Common Crawl snapshot extracted once (§7.3); each configuration applied independently; 28 B tokens sampled per configuration; two seeds per configuration with different random subsets (the P06 recipe).
- **Independent variables.** Unicode form; line-rule set; LID threshold rule.
- **Controlled variables.** Extractor, model (1.71 B-class dense decoder), tokenizer, sequence length, batch size, optimizer, steps, evaluator version, benchmark truncation.
- **Dataset / workload.** The snapshot; evaluation on the eight P06 benchmarks, large ones truncated to 1,000 samples.
- **Hardware.** Any cluster; the CPU stage cost is reported separately from GPU-hours.
- **Metrics.** Aggregate accuracy; per-benchmark accuracy; removal fraction per configuration (bytes and tokens); LID precision on a 2,000-document human-labelled sample.
- **Baselines.** P06 base filtering (trafilatura, URL blocklist, fastText ≥ 0.65, MassiveText rules).
- **Expected result.** Line-rule set moves the aggregate more than Unicode form; NFKC changes token counts by a measurable fraction without a matching score change; per-language thresholds change non-English precision by Eq. 8.1 but leave the English aggregate unchanged.
- **Ablation.** Apply NFKC after tokenizer-side normalisation to test the double-transform interaction.
- **Interpretation.** A configuration is adopted only if its paired difference (§2.5) excludes zero; otherwise the cheaper or more reversible option is kept.
- **Threats to validity.** Two seeds resolve only large effects (P07 states it "could not sufficiently explore run-to-run variation", PAPER-REPORTED); benchmark truncation adds sampling noise; effects may not transfer beyond 1.71 B.

## Observations

**What the paper claims.** P06 reports that trafilatura extraction outperforms WET and that base filtering (URL blocklist, fastText ≥ 0.65, MassiveText rules) "results in a performance uplift" and yields "roughly 36 trillion tokens" over 96 snapshots (PAPER-REPORTED). P07 reports resiliparse and trafilatura within 0.4 CORE points of each other at 1B-1x and resiliparse 8× faster (PAPER-REPORTED). R8.12 reports that its per-language LID threshold formula selects values within the highest-scoring range for all nine canary languages except Chinese and Hindi, and that GlotLID leads on higher-resource and trails slightly on lower-resource languages (PAPER-REPORTED). P05 reports LID ≥ 0.5 removed 61.7 % of bytes (PAPER-REPORTED).

**What the evidence shows.** The extractor and line-rule results are supported by two independent ablation programmes (P06, P07) at different scales with consistent direction; the threshold results are supported by one programme each (P06 for 0.65, R8.12 for per-language). No independent reproduction of the FineWeb2 threshold rule exists in the sources opened. The claim that WET is worse than WARC extraction is the most replicated (P03, P06, P07).

**What we infer.** DERIVED: because LID precision is prior-limited (Eq. 8.1), a single global threshold is a design choice that favours high-prior languages, and any multilingual corpus built with one must be audited per language. ASSUMED: NFKC is not applied before the ledger in the reference pipeline; reversibility flags are the book's addition.

**What remains unknown.** NOT-DISCLOSED: which Unicode normalisation, if any, the released FineWeb, Dolma and DCLM-Baseline texts underwent, and whether datatrove's ftfy formatter was enabled for the release. UNVERIFIED: the transfer of any threshold to crawls other than Common Crawl.

## Failure modes

> **Failure mode — double normalisation.** *Symptom:* token counts differ between the corpus card and the tokenizer's count on the same text; PII regexes miss full-width characters. *Cause:* NFKC applied in the pipeline and again in the tokenizer, or applied after PII scanning. *Detection:* hash a sample before and after each stage; compare `transforms[]`. *Mitigation:* declare the Unicode form once in the stage contract; scan PII after the final form.

> **Failure mode — prior-limited language precision.** *Symptom:* a low-resource language pool is dominated by a related high-resource language. *Cause:* Eq. 8.1 with small π_ℓ. *Detection:* high-affinity word lists (R8.12) or a human-labelled sample per language. *Mitigation:* per-language threshold; second precision filter; report precision per language in the dataset record.

> **Failure mode — boilerplate-dominated documents survive.** *Symptom:* duplicate-line fractions (§8.2) are high after line rules. *Cause:* extractor kept menus; line rules do not match the site's template. *Detection:* per-domain distribution of the removed-line fraction. *Mitigation:* RefinedWeb's document drop at > 5 % line removal (P04); paragraph deduplication (§8.3).

> **Failure mode — boundary drift.** *Symptom:* packing yields many contexts that begin mid-thread or mid-file. *Cause:* boundary rule changed between pipeline versions without a ledger row. *Detection:* boundary rule id in every record; distribution of record lengths per version. *Mitigation:* boundary rule is part of the stage contract and the dataset record.

## Siblings

**HTML extraction (extractor choice)** — [§7.3](../ch07-data-provenance-acquisition-and-dataset-semantics/07-3-acquisition-and-extraction.md)
Why it exists: WET text carries menus and footers. What assumption changed: the DOM, not the text, is the input. What objective changed: none. What problem it solved: 2.5+ CORE points over WET (P07). What new failure mode it introduced: extractor-specific truncation and 8× cost differences. Changed primitive: text-level line rules → DOM-tree density rules.

**Tokenizer-side normalisation** — [§10.2](../ch10-tokenization-serialization-and-interface-correctness/10-2-implementations-and-normalization.md)
Why it exists: the tokenizer must see a canonical form at inference too. What assumption changed: normalisation is part of the model interface, not the corpus. What objective changed: none. What problem it solved: train/inference form mismatch. What new failure mode it introduced: double normalisation with the pipeline. Changed primitive: corpus transform → tokenizer pre-tokenizer.

**Multilingual segmentation and thresholds** — [§9.5](../ch09-data-mixtures-curricula-and-sample-efficiency/09-5-multilingual-and-specialist-mixtures.md) (mixture consequences); mechanism here.
Why it exists: word and sentence units are script-dependent. What assumption changed: one segmenter per language. What problem it solved: filter statistics comparable across languages (R8.12). What new failure mode it introduced: per-language tooling gaps. Changed primitive: whitespace split → language-specific tokenizer.

## Extensions

For code, the boundary is the file and the "language" is the programming language detected from extension and content (R8.10 keeps per-extension inspection samples, PAPER-REPORTED); encoding repair must not touch string literals. For dialogue and threads, boundary rules must keep speaker alternation intact and PII policy differs (P05). For multimodal documents, text normalisation applies to captions and OCR output while the image boundary is the record; OCR noise is a quality-filter concern (§8.2). For agent trajectories the unit is an episode ([§11.5](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-5-interactive-collection.md)). These are proposals for the reader's pipeline.

## Limitations

The stage's rules are English-derived and their thresholds transfer to other languages only after the adaptation of R8.12. Eq. 8.1 assumes classifier rates measured off-crawl apply on-crawl, which R8.12 states — citing Caswell et al. (2020) and auditing three languages — fails for low-resource languages. The falsification condition is a matched-token ablation in which a normalisation change moves the aggregate score by more than the seed spread in the direction opposite to the one predicted here. Decision consequence: no threshold in this section is a constant; each is a design input that must be re-ablated when the crawl, extractor or language set changes.

## Reproducibility

Record: extractor id and version (§7.3), ftfy version, Unicode form, line-rule set with version, segmenter id per language, LID model file and hash (`lid.176.bin` or `.ftz`), τ_L per language, boundary rule id, and per-stage removal fractions in bytes and documents. Unknowns: no removal fraction for encoding repair is reported by any opened source; the fraction of documents whose language label changes between fastText and GlotLID on a given crawl is reported only as downstream-score differences in R8.12.

## References

P02 · P03 · P04 · P05 · P06 · P07 · R8.1 · R8.2 · R8.7 · R8.10 · R8.12 · R8.16 · R8.17 · R8.19 · R8.20 · R8.29 · [references.md](references.md)
