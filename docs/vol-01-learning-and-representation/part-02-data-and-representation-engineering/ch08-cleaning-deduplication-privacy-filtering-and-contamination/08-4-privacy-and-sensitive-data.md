---
id: ms.section.8.4
entity_type: section
title: Privacy and sensitive data
short_title: PII and secrets
volume: 1
part: 2
chapter: 8
section: 8.4
slug: 08-4-privacy-and-sensitive-data
parent: ms.chapter.8
prev_sibling: ms.section.8.3
next_sibling: ms.section.8.5
children: []
prerequisites: [ms.section.8.1, ms.section.8.3, ms.section.7.4, ms.section.2.5]
downstream: [ms.section.8.6, ms.section.24.5, ms.section.65.2, ms.section.65.4]
related: [ms.section.7.4, ms.section.11.5]
siblings_by_mechanism: [ms.section.24.5, ms.section.65.4]
relations:
  - {type: supported_by, target: paper.P05}
  - {type: supported_by, target: paper.P06}
  - {type: implemented_by, target: impl.hugging-face-transformers}
  - {type: implemented_by, target: impl.pytorch}
axes:
  lifecycle: [data, assurance]
  mechanism: [pii_detection, redaction, secret_scanning, memorization]
  feedback_setting: []
  modality: [text, code]
papers: [P05, P06]
implementations: [impl.hugging-face-transformers, impl.pytorch]
benchmarks: []
datasets: [dataset.dolma, dataset.fineweb, dataset.the-stack]
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED]
  empirically_observed: false
word_count_target: 2200
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 8.4 Privacy and sensitive data

## Scope

Objective: state why personal identifiers and credentials in training data are a model risk (memorisation evidence), give the detector families (regex, named-entity recognition, secret scanners, contextual rules) with their reported precision and recall, formalise the residual false-negative rate as an estimable quantity, and specify selective redaction versus deletion as a ledgered policy. Baseline: the PII stages of P05, P06 and R8.10. Success criterion: the reader can choose a detector per PII type, state its reported F1, estimate the residual rate after redaction with an interval, and justify a redaction policy. Boundaries: rights, consent and deletion lineage are owned by [§7.4](../ch07-data-provenance-acquisition-and-dataset-semantics/07-4-rights-and-governance-metadata.md); removing memorised content from a trained model by [§24.5](../../part-04-training-science-and-adaptation/ch24-continual-learning-model-editing-and-unlearning/24-5-unlearning.md); extraction and membership-inference attacks as threats by [§65.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch65-security-privacy-safety-and-adversarial-robustness/65-2-training-model-attacks.md).

## Why this exists

What failed before was the assumption that a language model generalises rather than stores. R8.4 extracted from GPT-2 "hundreds of verbatim text sequences from the model's training data" including "(public) personally identifiable information (names, phone numbers, and email addresses), IRC conversations, code, and 128-bit UUIDs", some "included in just one document in the training data", and found that "larger models are more vulnerable than smaller models" (PAPER-REPORTED). R8.5 then quantified three log-linear relationships: memorisation grows with model capacity, with "the number of times an example has been duplicated", and with the length of context used to prompt it; within a family "larger models memorize 2-5× more than smaller models", and GPT-J "memorizes at least 1% of its training dataset" (PAPER-REPORTED). R8.6 measured that "a sequence that is present 10 times in the training data is on average generated 1000× more often than a sequence that is present only once" (PAPER-REPORTED). The bottleneck is recall: a detector that misses one span in a thousand leaves, in a 10¹³-token corpus, millions of spans that a model of sufficient size can reproduce. The dominant constraint is that no detector guarantees completeness — the Presidio project states "there is no guarantee that Presidio will find all sensitive information" (R8.21, OFFICIAL-DOCUMENTATION) and detect-secrets that it "is not meant to be a sure-fire solution" (R8.22, OFFICIAL-DOCUMENTATION). What changed is that the open corpora now document their detectors, thresholds and policies with removal fractions (P05, P06, R8.10), which lets the residual rate be estimated rather than assumed.

## Intuition

Physically, PII redaction is a sequence-labelling problem followed by a string edit, and its cost is set by which detector runs: a regex is a finite automaton at nanoseconds per character; a token-classification encoder is a forward pass per document — R8.10 reports 800 A100 GPU-hours over 815 GB (PAPER-REPORTED), about 1 GB per GPU-hour. The value is in the recall, which cannot be measured on the corpus itself and must be estimated on a labelled sample. Deduplication (§8.3) is the cheapest privacy mitigation because memorisation is superlinear in multiplicity (R8.6); redaction addresses the single-occurrence case that deduplication cannot. Heuristically one says the model "remembers" a phone number; the physical statement is that a specific 50-token suffix becomes the greedy continuation of its training-set prefix (R8.5's definition of extractability).

## Formulation

> **Definition — PII span.** A character range [a, b) of a record classified by detector d as an identifier of a natural person, with a type label (name, email, phone, IP address, username, credential, key, password, ID) and the detector id and version.

> **Definition — redaction policy.** A function ρ: (type, span count per record, source context) → {replace-with-placeholder, replace-with-synthetic, drop-span, drop-record} applied to every detected span and written to the ledger.

> **Definition — secret scanning.** Detection of credentials by structured regex (keys with known formats), entropy of candidate strings, and keyword context (variable names), with the documented property that it cannot guarantee completeness.

Let a labelled audit sample of n records after redaction contain x residual PII spans found by human review, and let the sample be drawn so that the resampling unit is the source domain (§2.5). The residual rate per record and its interval are

$$
\hat{\rho}_{\text{res}} = \frac{x}{n}, \qquad \text{for } x = 0:\; \rho_{\text{res}} \le \frac{3}{n} \text{ at } 95\,\%, \qquad \text{for } x > 0:\; \text{Wilson interval of Eq. 2.20 with the design effect of Eq. 2.22}
$$
*(Eq. 8.11)* where the rule-of-three bound follows from (1 − ρ)^n ≤ 0.05 ⇒ ρ ≥ 1 − 0.05^{1/n} ≈ 3/n; an audit of 3,000 clean records bounds the residual rate below 10⁻³, not below 10⁻⁶.

Detector quality per type is reported as precision, recall and F1 on a held-out labelled set; the corpus-level expected number of residual spans of type t is

$$
\mathbb{E}[\text{residual}_t] = N_t\,(1 - \mathrm{Rec}_t), \qquad \mathbb{E}[\text{false redactions}_t] = \frac{N_t\,\mathrm{Rec}_t\,(1-\mathrm{Prec}_t)}{\mathrm{Prec}_t}
$$
*(Eq. 8.12)* where N_t = true spans of type t in the corpus (unknown; estimated from the audit sample); the first term is the privacy exposure, the second the collateral damage to content.

> **Assumption.** Recall measured on the annotated set transfers to the corpus · *sensitivity:* R8.10 pre-filtered 7,100 of its 12,000 annotation files "to increase the representation of rare PII types" (PAPER-REPORTED), so the annotated distribution is not the corpus distribution and the transferred recall for rare types is UNVERIFIED.

## Mechanism

**Memorisation as the reason.** R8.5 defines a string as extractable "with k tokens of context" if a length-k training prefix followed by greedy decoding reproduces it, measures 50-token suffixes after prompts of 50–500 tokens, and reports the three log-linear trends; R8.4's k-eidetic definition counts a string as memorised for k = 1 when it "appears in at most k examples", and its Table 3 lists 87-character sequences extracted from a single training document (PAPER-REPORTED). R8.6 adds that "existing methods for detecting memorized sequences have near-chance accuracy on non-duplicated training sequences" and that after deduplication "language models are considerably more secure against these types of privacy attacks" (PAPER-REPORTED). R8.3 removed 10× of unprompted memorised output by deduplication but states plainly that "deduplication is also not sufficient to remove privacy-sensitive data like bank passwords and medical records which should never be used in training data" (PAPER-REPORTED). The order of stages follows: deduplicate first (multiplicity), redact second (singletons). Cost line: none for the argument; the detectors below carry the cost.

**Regex detectors.** Dolma judged that its size "makes it impractical to use model-based PII detectors like Presidio" and used "carefully-crafted regular expressions that sacrifice some accuracy for significant speed-up" for "three kinds of PII that are detectable with high precision: email addresses, IP addresses and phone numbers" (P05 §5.3, PAPER-REPORTED). FineWeb anonymises "email addresses and public IP addresses using regex patterns" (P06 Appendix, PAPER-REPORTED); datatrove's `PIIFormatter` replaces emails and IP addresses, validates IPs with `ipaddress.ip_address(ip).is_global` so that by default "we only replace public (and thus PII) IPs", and cycles through a tuple of replacement strings (R8.16, OFFICIAL-DOCUMENTATION). R8.10 reports that enhancing an email regex to address false positives "boosted the F1 score of the regex from 81.8% to 96.83%" on its benchmark, while noting regexes "only support the detection of emails, IP addresses, and keys" (PAPER-REPORTED). Cost line: O(bytes) per record on CPU; no model; precision high for structured types, recall for names and free-form identifiers essentially zero.

**Named-entity detectors.** R8.10 collected "12,000 files with 22,950 annotated entities" through 1,399 crowd-workers, trained StarEncoder (a BERT-style encoder with MLM and NSP objectives) and fine-tuned it for token classification with six classes — names, emails, keys, passwords, IP addresses, usernames — excluding IDs "due to low annotation quality"; it reports "F1 scores of more than 90% on names, emails, and IP addresses and 73.39% on passwords", with keys at 56.66 % and usernames at 59.39 %, attributing the key result to only 308 labelled instances; pseudo-labelling on 18,000 further files was used to improve keys and passwords (R8.10 §4, PAPER-REPORTED). The token-classification head is the standard `AutoModelForTokenClassification` with B-/I- tags, first-subtoken labelling and −100 masks on special tokens as documented for Transformers v5.17.0 (R8.23, OFFICIAL-DOCUMENTATION). Presidio combines "Named Entity Recognition, regular expressions, rule based logic and checksum with relevant context in multiple languages" across analyzer, anonymizer, image-redactor and structured modules (R8.21, OFFICIAL-DOCUMENTATION). Cost line: one encoder forward per record — 800 A100 GPU-hours for 815 GB in R8.10 (PAPER-REPORTED); annotation cost 1,399 workers averaging 206 tasks and 3.1 hours each at an hourly rate of $7.30 (R8.10, PAPER-REPORTED).

**Contextual identifiers.** Some spans are identifying only in context: a first name in a thread, a username that recurs across posts, an "example@example.com" that is not a person, a licence-header email that is public by intent. R8.10's annotation scheme separates `EMAIL_EXAMPLE`, `EMAIL_LICENSE`, `NAME_EXAMPLE`, `NAME_LICENSE`, `USERNAME_EXAMPLE`, `USERNAME_LICENSE` and `AMBIGUOUS` from the base types, then collapses them because the model performed poorly at distinguishing them (PAPER-REPORTED); for GitHub issues it replaces author usernames by "a participant counter within the conversation, e.g. username_1", prepends the pseudonym so that "we preserve the speaker identity of the author", and masks mentions of participating users only (R8.10 §4.3, PAPER-REPORTED). Post-processing rules drop detected keys "with fewer than 9 characters or that are not gibberish", ignore IP addresses that "aren't valid or are private (non-Internet facing)", and ignore addresses of popular DNS servers (R8.10, PAPER-REPORTED). Cost line: the rules are O(spans); the pseudonymisation needs per-thread state, which fixes the document boundary (§8.1) at the thread.

**Secret scanning.** detect-secrets exposes three plugin families — regex rules for structured secrets "optionally verified through network calls", an entropy detector for "secret-looking" strings, and a keyword detector that "ignores the secret value itself" and searches variable names — maintains a *baseline* of known secrets, filters false positives by line, file and inline allow-lists, and states that it will not catch "multi-line secrets" (R8.22, OFFICIAL-DOCUMENTATION). Dolma runs "the detect-secrets library ... and removing any documents with a match" on its code subset (P05 §5.5, PAPER-REPORTED); R8.10 used detect-secrets "with all default plugins activated" to pre-filter files for annotation (PAPER-REPORTED). Cost line: O(bytes) plus entropy computation per candidate token; network verification, if enabled, is a per-candidate round trip and is not appropriate for a corpus pass.

**False negatives.** Eq. 8.11 is the only honest statement of recall at corpus scale. P05 reports the *positive* rates — replacement "affects 0.02% of documents", removal "0.001% of documents" — and that "execution details around PII (e.g., removal versus special token replacement) had no effect on model performance" (P05 §5.3, PAPER-REPORTED); it does not report a residual rate after redaction, which is NOT-DISCLOSED for every corpus in the opened sources. R8.10 reports per-type recall on its test split, which by Eq. 8.12 gives expected residual counts once N_t is estimated from the audit sample. Names are the hardest type for regexes (no structure) and usernames for NER (59.39 % F1 in R8.10); credentials are rare (308 key labels) so both precision and recall are poorly estimated.

**Selective redaction versus deletion.** Three policies appear in the sources. Replacement with a placeholder: P05 replaces spans with "a special token (e.g. |||EMAIL_ADDRESS|||)" when a document has 5 or fewer spans; R8.10 replaces with `<NAME>`, `<EMAIL>`, `<KEY>`, `<PASSWORD>` (PAPER-REPORTED). Replacement with a synthetic value of the same type: R8.10 masks IP addresses by "randomly selected an IP address from 5 synthetic, private, non-internet-facing IP addresses of the same type"; datatrove cycles through a replacement tuple (R8.16). Deletion of the record: P05 removes documents with more than 5 spans and removes rather than masks Reddit documents "due to the short length of many Reddit documents" (PAPER-REPORTED). The trade is Eq. 8.12's second term against the first: a placeholder preserves the surrounding content (and teaches the model the placeholder token), a synthetic value preserves format statistics, deletion removes both the span and its context and is the right choice when span density indicates a directory or dump. The policy, its thresholds (P05's 5 spans) and the placeholder vocabulary are part of the stage contract and must be identical between corpus and tokenizer ([§10.2](../ch10-tokenization-serialization-and-interface-correctness/10-2-implementations-and-normalization.md)) so that placeholders are single tokens rather than fragments.

<details><summary>Derivation of the rule-of-three bound in Eq. 8.11</summary>
If the true residual rate is ρ and n records are inspected independently, the probability of finding none is (1 − ρ)^n. The largest ρ consistent with that event at the 5 % level solves (1 − ρ)^n = 0.05, i.e. ρ = 1 − 0.05^{1/n} = 1 − e^{ln(0.05)/n} ≈ −ln(0.05)/n = 2.996/n. MATHEMATICALLY-DERIVED; the independence assumption fails when records share a domain, which is why the resampling unit must be the domain and the design effect of §2.5 applied.
</details>

## Algorithm

```text
Algorithm 8.8 — Detection, policy application and ledger emission
INPUT   record r (text, source, boundary type); detectors D = {regex_email, regex_ip(public_only), regex_phone, ner_model(version), secret_scanner(plugins)};
        policy ρ(type, count, source); placeholder vocabulary V; synthetic pools per type; ledger L
OUTPUT  redacted record r′ or ∅; ledger rows
STATE   spans (list of (a, b, type, detector, score)); count_by_type
INVARIANT spans are non-overlapping after merge; every applied edit has one ledger row; text outside spans is byte-identical to input
1.  spans ← ∪_{d∈D} d.detect(r.text)                       # regex first (cheap), NER on all records, secrets on code/config sources
2.  spans ← merge_overlaps(spans, priority: secret > key > password > email > ip > phone > name > username)
3.  spans ← apply_context_rules(spans)                     # drop example/licence emails, private/DNS IPs, keys < 9 chars or non-gibberish (R8.10 rules)
4.  if Σ_type count > ρ.max_spans(source) or source ∈ ρ.delete_sources: L += (r.id, stage, "policy", ρ.version, count, ρ.max_spans, DROP_DOC, "pii_density"); return ∅
5.  for (a, b, type, d, s) in spans sorted by a descending:
6.      action ← ρ(type, count_by_type[type], r.source)
7.      r.text ← edit(r.text, a, b, action, V[type] or sample(synthetic[type]))
8.      L += (r.id, stage, d.id, d.version, score=s, thr=d.threshold, action, "pii_"+type, span_start=a, span_end=b, reviewer_sample_flag=bernoulli(p_audit))
9.  return r
TERMINATION: one detection pass per detector, one edit pass over spans.
```

Complexity: regex and secret scanners O(bytes); NER O(T·cost_forward) per record — the dominant term, 800 A100 GPU-hours per 815 GB in R8.10. Memory: NER model weights per worker; span lists per record. Implementation: datatrove `PIIFormatter` covers step 1's regex part for emails and public IPs (R8.16); the NER path is a Transformers token-classification model (R8.23) on PyTorch (R8.32); secret scanning via detect-secrets (R8.22); the policy and ledger are the book's addition.

## Implementation

Tensors → operators: the NER detector is `[B, T] → encoder → [B, T, d] → linear → [B, T, C]` with C = 2·types + 1 for B-/I-/O tags; inference only, so no saved tensors. Framework: Hugging Face Transformers (#26, *Model definition / adaptation*) for the model definition and the label-alignment convention (first sub-token labelled, others −100; R8.23); PyTorch (#17, *Model / autograd framework*). Kernels: standard encoder attention; sequence length per record is the only lever on cost. Memory: weights plus `[B, T, d]` activations. Communication: none — records are independent. Deployment: a corpus pass is a batched offline job over shards; secret scanning and regexes run on CPU alongside; the audit sample (reviewer flags) is routed to human review with its ledger rows. Execution semantics are [§12.2](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-2-transformation-execution.md).

> **Implementation note [impl.hugging-face-transformers · v5.17.0 documentation, R8.23].** The documented recipe fine-tunes a token-classification head with `seqeval` precision/recall/F1 as metrics; R8.10's per-type F1 values are on its own annotated split and are not comparable to any other corpus's numbers.

## Experimental design

### Experiment 8.4 — Residual PII rate after redaction

- **Hypothesis.** After Algorithm 8.8 with regex + NER + secret scanning, the residual rate of high-precision types (email, IP, phone) is below 10⁻⁴ per record and the residual rate of names and usernames is above 10⁻³ per record.
- **Setup.** Stratified sample of n = 3,000 redacted records per source category (web, code, forum), each independently reviewed by two annotators with adjudication; sampling unit the source domain.
- **Independent variables.** Detector set ∈ {regex only, regex + NER, regex + NER + secrets}; policy ∈ {placeholder, synthetic, delete}.
- **Controlled variables.** Normalisation form (§8.1), record boundary, annotator instructions, PII type taxonomy (R8.10's).
- **Dataset / workload.** The retained corpus after §8.3.
- **Hardware.** CPU for regex/secrets; one accelerator for NER; report GPU-hours per TB.
- **Metrics.** Residual spans per record by type with Wilson intervals and design effect; false-redaction rate on a second sample; annotator agreement (Cohen's κ per type).
- **Baselines.** Regex-only (the P05/P06 configuration).
- **Expected result.** Regex-only leaves names untouched (residual ≈ prevalence); NER reduces names and usernames but not below the 3/n floor of the audit; secrets remain the least well estimated.
- **Ablation.** Disable context rules (step 3) to measure the false-redaction cost they prevent.
- **Interpretation.** A detector set is adopted if the upper interval bound for each type is below the policy's acceptable-error threshold ([§1.1](../../part-01-scientific-foundations/ch01-foundation-model-lifecycle/01-1-problem-formulation.md)); otherwise the residual rate is reported in the dataset record as a known limitation.
- **Threats to validity.** Annotator recall is itself below one; rare types give wide intervals; the audit sample cannot bound rates below 3/n.

## Observations

**What the paper claims.** R8.5 claims three log-linear memorisation relationships and ≥ 1 % of The Pile extractable from GPT-J (PAPER-REPORTED). R8.6 claims a 1000× regeneration ratio at 10 copies and near-chance detection on singletons (PAPER-REPORTED). R8.10 claims > 90 % F1 for names, emails and IPs with its NER model and lower F1 for passwords, keys and usernames (PAPER-REPORTED). P05 claims regex PII touched 0.02 % + 0.001 % of documents with no measurable downstream effect (PAPER-REPORTED).

**What the evidence shows.** The memorisation–duplication link is supported by three independent groups (R8.3, R8.5, R8.6) on different models and corpora and is the best-replicated result in this chapter. Detector quality is single-source per corpus; no cross-corpus comparison of PII recall exists in the opened sources. Residual rates after redaction are reported by none.

**What we infer.** DERIVED: because memorisation is superlinear in multiplicity, deduplication removes most of the *expected* extractable content, and redaction's marginal value concentrates on singletons and on structured types. DERIVED (Eq. 8.11): audits of a few thousand records cannot certify residual rates below ~10⁻³, so a corpus card claiming "PII-free" is a category error; it can claim a detector, a policy and an interval.

**What remains unknown.** NOT-DISCLOSED: residual PII rates for any released corpus; whether closed models' pipelines redact at all (P05's audit lists "N/A" for several). UNVERIFIED: transfer of R8.10's F1 to non-code text; the fraction of memorised spans that are PII rather than boilerplate (R8.3 notes most identified memorised content "was relatively innocuous", PAPER-REPORTED).

## Failure modes

> **Failure mode — placeholder fragmentation.** *Symptom:* the model emits partial placeholders or learns to complete them. *Cause:* placeholder strings not registered as single tokens. *Detection:* tokenize the placeholder vocabulary. *Mitigation:* register in the tokenizer (§10.2) or use synthetic values.

> **Failure mode — false redaction of public identifiers.** *Symptom:* licence emails, DNS addresses and example domains vanish; code stops compiling. *Cause:* context rules absent. *Detection:* false-redaction sample. *Mitigation:* R8.10's rule set; allow-lists in the policy.

> **Failure mode — density blindness.** *Symptom:* a leaked directory survives as thousands of placeholders. *Cause:* per-span policy without a per-record count. *Detection:* span count histogram. *Mitigation:* P05's > 5-span deletion rule; source-level rules.

> **Failure mode — audit floor mistaken for zero.** *Symptom:* a card states "no PII found". *Cause:* x = 0 in a small audit read as ρ = 0. *Detection:* Eq. 8.11. *Mitigation:* report 3/n as the bound.

> **Failure mode — secrets in multi-line or encoded form.** *Symptom:* base64 blobs and PEM bodies pass. *Cause:* line-scoped regex and entropy detectors (R8.22's stated limitation). *Detection:* PEM headers and long high-entropy blocks in a sample. *Mitigation:* block-level entropy rule; drop the record.

## Siblings

**Deduplication as privacy mitigation** — [§8.3](08-3-duplicate-structure.md)
Why it exists: memorisation is superlinear in multiplicity (R8.6). What assumption changed: multiplicity, not content, is the risk. What problem it solved: 10× less memorised output (R8.3). New failure mode: singletons untouched. Changed primitive: span edit → document removal.

**Unlearning after training** — [§24.5](../../part-04-training-science-and-adaptation/ch24-continual-learning-model-editing-and-unlearning/24-5-unlearning.md)
Why it exists: data discovered after training, or deletion requests (§7.4 deletion lineage). What assumption changed: the parameters, not the corpus, are edited. New failure mode: incompleteness and side effects on unrelated capability. Changed primitive: corpus edit → parameter update.

**Runtime controls (output filtering, refusal)** — [§65.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch65-security-privacy-safety-and-adversarial-robustness/65-4-controls.md)
Why it exists: residual memorisation cannot be brought to zero at the data stage. What assumption changed: detection moves to generation time. New failure mode: adversarial prompts (§65.3). Changed primitive: corpus edit → serving-time filter.

**Rights and deletion lineage** — [§7.4](../ch07-data-provenance-acquisition-and-dataset-semantics/07-4-rights-and-governance-metadata.md)
Why it exists: whether a span may be used is a governance question, not a detection question. Changed primitive: span detector → admissible-use decision.

## Extensions

For code, the PII types add keys, passwords and usernames and the boundary is the file plus the issue thread (R8.10). For dialogue and user interactions ([§11.5](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-5-interactive-collection.md)), names of participants are structural and pseudonymisation must be consistent across turns. For multimodal data, faces, licence plates and text in images require image detectors (Presidio's image-redactor is one interface, R8.21). For agent trajectories, credentials in tool outputs are the dominant secret source and should be scanned at collection time. These are proposals.

## Limitations

The detectors above are validated on English text and on code; recall for other scripts is UNVERIFIED. Eq. 8.11 bounds only what annotators can find. The link from redaction to reduced extraction is inferred from the memorisation literature, not measured for any redacted corpus in the opened sources; the falsification condition is an extraction attack (R8.5 protocol) on paired models trained with and without redaction showing no difference in extractable PII. Decision consequence: treat redaction as a documented reduction with an interval, deduplicate first, and keep the ledger so that a later deletion request (§7.4) can be traced to spans and records.

## Reproducibility

Record: detector ids and versions (regex patterns as text, NER model hash and training-set hash, secret-scanner plugin list), context rules, policy ρ with thresholds, placeholder vocabulary and synthetic pools with seed, audit sample size per source, annotator protocol, and the residual-rate intervals. Unknowns: no released corpus reports an audit of residual PII; R8.10's annotated set is described by counts and types but per-type recall on non-code text is not reported.

## References

P05 · P06 · R8.3 · R8.4 · R8.5 · R8.6 · R8.10 · R8.16 · R8.21 · R8.22 · R8.23 · R8.32 · [references.md](references.md)
