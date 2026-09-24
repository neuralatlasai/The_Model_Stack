---
id: ms.section.10.2
entity_type: section
title: Implementations and normalization
short_title: SentencePiece, Tokenizers, tiktoken
volume: 1
part: 2
chapter: 10
section: 10.2
slug: 10-2-implementations-and-normalization
parent: ms.chapter.10
prev_sibling: ms.section.10.1
next_sibling: ms.section.10.3
children: []
prerequisites: [ms.section.8.1, ms.section.10.1]
downstream: [ms.section.10.4, ms.section.10.5, ms.section.10.6, ms.section.12.4, ms.section.43.1]
related: [ms.section.37.2]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.R10.4}
  - {type: implemented_by, target: impl.hugging-face-transformers}
  - {type: implemented_by, target: impl.llama-cpp}
axes:
  lifecycle: [data, pretraining, inference]
  mechanism: [tokenization, normalization, serialization]
  feedback_setting: []
  modality: [text]
papers: []
implementations: [impl.hugging-face-transformers, impl.llama-cpp]
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

# 10.2 Implementations and normalization

## Scope

Objective: specify what a tokenizer implementation adds to the algorithms of [§10.1](10-1-tokenization-algorithms.md) — Unicode normalisation, pre-tokenization, byte fallback, special-token matching, serialisation — and state exactly what "reversible" means for each of the three implementations in production use: SentencePiece, Hugging Face Tokenizers, tiktoken. Baseline: an algorithm applied to raw text with no normalisation, whose decode does not recover its input. Success criterion: the reader can predict, for a given implementation and configuration, which inputs round-trip byte-exactly, which round-trip only up to normalisation, and which do not round-trip at all; and can explain why the same string tokenises differently across the `▁` and `Ġ` whitespace conventions. Boundaries: corpus-level normalisation as a data-cleaning step is [§8.1](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-1-normalization.md); conversation templates are [§10.4](10-4-conversation-serialization.md); the compatibility suite that tests these properties is [verification.md](verification.md).

## Why this exists

What failed before was language-specific detokenisation. PAPER-REPORTED (R10.4, §3.1): "the raw text and tokenized sequence are not reversibly convertible. The information that no space exists between 'world' and '.' is not kept in the tokenized sequence. Detokenization … has to be language-dependent due to these irreversible operations." The subword-nmt convention of `@@` boundary markers "can not always perform lossless tokenization, as an ambiguity remains in the treatment of whitespaces. More specifically, it is not possible to encode consecutive whitespaces with this representation." The bottleneck was reproducibility: PAPER-REPORTED (R10.4, §3.5): "subtle differences in preprocessing schemes can widely change BLEU scores", and "NFKC normalization may yield different results depending on the Unicode version." The dominant constraint became that the tokenizer is a deployed component whose behaviour must be identical in the training pipeline and in every serving process, on every platform, for every byte sequence a user can send. What changed is that the implementation became a self-contained artifact: PAPER-REPORTED (R10.4, §3.5): "The SentencePiece model is designed to be purely self-contained. The model file includes not only the vocabulary and segmentation parameters, but also the pre-compiled finite state transducer for character normalization." tiktoken and Hugging Face Tokenizers make the same commitment in different serialisations.

## Intuition

Physically, a tokenizer implementation is a pipeline of four string transforms followed by an integer lookup, and reversibility is a property of the composition, not of the algorithm. Each stage can discard information: normalisation maps many strings to one; pre-tokenization decides which bytes may be merged; the segmenter chooses among segmentations; special-token matching decides whether a byte span is data or control. Heuristically, think of the pipeline as a channel: a stage that is a bijection preserves the input; a stage that is many-to-one loses the pre-image. Byte-level designs make the last three stages bijective by construction (every byte has a token); normalisation is the only stage that is deliberately lossy, and the implementations differ mostly in whether they normalise at all. DERIVED from the pipeline structure documented in R10.4 and R10.12.

## Formulation

Let `N` be the normaliser, `P` the pre-tokenizer, `E` the segmenter and `D` the decoder. The implementation computes `ids = E(P(N(t)))` and `D(ids)`.

$$
D\big(E(P(N(t)))\big) = N(t)
$$
*(Eq. 10.5)* where t = the raw input string; the identity states lossless tokenization relative to the normalised text. PAPER-REPORTED (R10.4, §3.1): "SentencePiece implements the Decoder as an inverse operation of Encoder, i.e., Decode(Encode(Normalize(text))) = Normalize(text). We call this design lossless tokenization." When N is the identity and the alphabet is bytes, the identity strengthens to `D(E(P(t))) = t` for every byte string t; this is the property tiktoken states (OFFICIAL-DOCUMENTATION, R10.13, of BPE: "It's reversible and lossless, so you can convert tokens back into the original text").

> **Definition — byte fallback.** The rule that a character absent from a tokenizer's alphabet is represented by the sequence of its UTF-8 bytes, each mapped to a dedicated byte token, so that no unknown token is emitted. OFFICIAL-DOCUMENTATION (R10.5, `--byte_fallback`): "decomposes out-of-vocabulary characters into UTF-8 byte tokens (e.g., `<0xE3>`), completely avoiding `<unk>` tokens."

Unicode normalisation forms, OFFICIAL-DOCUMENTATION (R10.41, Table 1): NFD is "Canonical Decomposition"; NFC is "Canonical Decomposition, followed by Canonical Composition"; NFKD is "Compatibility Decomposition"; NFKC is "Compatibility Decomposition, followed by Canonical Composition". The standard warns: "NFKC and NFKD must not be blindly applied to arbitrary text. Because they erase many formatting distinctions, they will prevent round-trip conversion to and from many legacy character sets." Combining marks are put "into a well-defined order" by canonical combining class. Emoji structure, OFFICIAL-DOCUMENTATION (R10.42): an emoji ZWJ sequence is `emoji_zwj_element (ZWJ emoji_zwj_element)+` with U+200D as the joiner; modifiers U+1F3FB–U+1F3FF follow a base; U+FE0F is the emoji presentation selector; flags are pairs of regional indicators. These are the inputs on which round-trip claims are most often false.

Whitespace conventions. SentencePiece: PAPER-REPORTED (R10.4, §3.1): "SentencePiece first escapes the whitespace with a meta symbol _ (U+2581)"; OFFICIAL-DOCUMENTATION (R10.5): `add_dummy_prefix` (default true) "Prepends a dummy whitespace ▁ to the beginning of the sentence", and `remove_extra_whitespaces` (default true) "Collapses duplicate internal spaces and strips leading/trailing spaces." Byte-level: OFFICIAL-DOCUMENTATION (R10.12, components): the `ByteLevel` pre-tokenizer "Splits on whitespaces while remapping all the bytes to a set of visible characters", so the space byte 0x20 appears as `Ġ` and `"Hello my friend"` becomes `"Hello", "Ġmy", "Ġfriend"`; the docs add that "For non ascii characters, it gets completely unreadable, but it works nonetheless!"

> **Assumption.** The serving process and the training pipeline load the same serialised tokenizer artifact byte-for-byte · *sensitivity:* if either re-derives the tokenizer from a different library version, Eq. 10.5 may hold in each process separately while the two id sequences differ; this is the drift case of [§10.6](10-6-migration-and-compatibility.md).

## Mechanism

**Pipeline stages.** OFFICIAL-DOCUMENTATION (R10.12, pipeline): on `encode` the text goes through "normalization, pre-tokenization, model, post-processing". Normalisation is "a set of operations you apply to a raw string to make it less random or 'cleaner'", with NFD, NFKD, NFC, NFKC, `Lowercase`, `Strip`, `StripAccents`, `Replace` and `BertNormalizer` provided; the library "keep[s] track of the alignment while normalizing", which is what makes character offsets recoverable after a many-to-one normaliser. Pre-tokenization "give[s] an upper bound to what your tokens will be at the end of training": the model "does not build tokens across multiple 'splits'". The model maps pre-tokens to ids; post-processing adds template tokens (`TemplateProcessing`, `"[CLS] $A [SEP]"`) and, unlike the earlier stages, "you don't need to retrain a tokenizer after changing its post-processor". Decoding reverses the model's conventions through a `Decoder` (`ByteLevel`, `Metaspace`, `WordPiece`). Cost: each stage is a linear pass over the string; the ByteLevel remap allocates a new string of up to 2× the byte length because each non-ASCII byte becomes a multi-byte visible character; normalisation with alignment tracking keeps an offsets array of O(|t|) integers.

**SentencePiece's four components.** PAPER-REPORTED (R10.4, §2): Normalizer, Trainer, Encoder, Decoder; "Encoder internally executes Normalizer to normalize the input text and tokenizes it into a subword sequence"; "Decoder converts the subword sequence into the normalized text." Normalisation is NFKC by default, implemented as "string-to-string mapping and leftmost longest matching … compiled into a finite state transducer (Aho-Corasick automaton)", with a documented incompleteness: "SentencePiece does not handle the full CCC reordering and only implements a subset of NFKC normalization" (R10.4, fn. 3). The option table names the rule sets: OFFICIAL-DOCUMENTATION (R10.5): `normalization_rule_name` ∈ {`nmt_nfkc` (default), `nfkc`, `nmt_nfkc_cf`, `nfkc_cf`, `identity`}. Two consequences follow. First, a SentencePiece model with the default rules is lossless only relative to NFKC-with-whitespace-collapse: leading, trailing and repeated spaces are gone before the segmenter sees them. Second, `character_coverage` (default 0.9995) prunes the alphabet: "Characters outside this limit are excluded from the alphabet and will be mapped to `<unk>` (or byte fallback)" (R10.5). Byte fallback is therefore the difference between a total and a partial encoder for the same model type. Cost: the precompiled normaliser is stored inside the model file (protobuf, R10.4 §3.5); the FST lookup is linear in the input.

**Model-type independence.** PAPER-REPORTED (R10.4, §3.3): "SentencePiece specifies the final size of vocabulary, as the number of merge operations is a BPE specific parameter and can not be applicable to other segmentation algorithms, e.g., unigram language model." This is the concrete reason the book separates implementation from algorithm: the same model file format, normaliser, whitespace convention and id management serve BPE and unigram (`model_type` ∈ {`unigram` (default), `bpe`, `char`, `word`}; R10.5). A model card that says "SentencePiece tokenizer" has not stated the algorithm; Llama 2's does: PAPER-REPORTED (R10.30, §2.1): "it employs a bytepair encoding (BPE) algorithm (Sennrich et al., 2016) using the implementation from SentencePiece … we split all numbers into individual digits and use bytes to decompose unknown UTF-8 characters. The total vocabulary size is 32k tokens."

**tiktoken.** OFFICIAL-DOCUMENTATION (R10.13): an `Encoding` is constructed from `pat_str` ("A regex pattern string that is used to split the input text"), `mergeable_ranks` ("A dictionary mapping mergeable token bytes to their ranks. The ranks must correspond to merge priority"), `special_tokens` and `explicit_n_vocab`. There is no normaliser: the pipeline is regex split → ranked byte-pair merges → ids, and decoding is byte concatenation. The two documented decode paths differ in reversibility: `decode_bytes` returns the exact bytes; `decode` "is lossy, since decoded bytes are not guaranteed to be valid UTF-8", controllable with `errors`. The reason is that byte-level merges are free to end inside a multi-byte code point, so a prefix of a token sequence can end mid-character; `encode_with_unstable` exists precisely because "the stable tokens will only represent a substring of `text`". Cost: the merge ranks are a hash map of O(V) byte strings; the repository states a throughput claim ("3-6x faster than a comparable open source tokeniser" measured "on 1GB of text using the GPT-2 tokeniser") that is a vendor figure for one workload and library pair and does not transfer (OFFICIAL-DOCUMENTATION, R10.13, context stated).

**Pre-tokenization regexes and their effects on numbers and code.** The three published tiktoken patterns are the clearest record of how pre-tokenization decisions are made. OFFICIAL-DOCUMENTATION (R10.13, `openai_public.py`):

```text
r50k/gpt2 : '(?:[sdmt]|ll|ve|re)| ?\p{L}++| ?\p{N}++| ?[^\s\p{L}\p{N}]++|\s++$|\s+(?!\S)|\s
cl100k    : '(?i:[sdmt]|ll|ve|re)|[^\r\n\p{L}\p{N}]?+\p{L}++|\p{N}{1,3}+| ?[^\s\p{L}\p{N}]++[\r\n]*+|\s++$|\s*[\r\n]|\s+(?!\S)|\s
o200k     : … |\p{N}{1,3}| ?[^\s\p{L}\p{N}]+[\r\n/]*|\s*[\r\n]+|\s+(?!\S)|\s+
```

Three effects follow mechanically. (i) Numbers: the GPT-2 pattern's ` ?\p{N}++` lets BPE merge arbitrarily long digit runs, so frequent numbers become single tokens and rare ones fragment unpredictably; `\p{N}{1,3}` in cl100k and o200k caps every numeric pre-token at three digits, so a number of k digits always costs ⌈k/3⌉ tokens; SentencePiece's `split_digits` and Llama 2's digit splitting go one step further to one token per digit ("Recommended for math or financial applications", R10.5). The trade is fertility against arithmetic regularity: per-digit splitting multiplies the token count of numeric text by up to three relative to three-digit chunks, and by more relative to whole-number merges. (ii) Whitespace runs: `\s+(?!\S)` matches a run of whitespace *except its last character* when a non-space follows, so an indentation of 8 spaces before `def` becomes one pre-token of 7 spaces plus ` def`; the merge table then decides whether 7 spaces is one token. Code indentation cost is therefore set by which whitespace runs were frequent enough to merge — a property of the training corpus, NOT-DISCLOSED for any tokenizer unless its merge list is inspected. (iii) Newlines: cl100k's `\s*[\r\n]` and o200k's `\s*[\r\n]+` isolate line breaks, so trailing whitespace before a newline and the newline itself form separate pre-tokens from the following line; the GPT-2 pattern has no such clause. The CS336 handout uses "a slightly prettier form of the original regex" (R10.22 §2.4), and the OpenAI file notes the current r50k pattern "is equivalent, but executes faster" than the original — equivalence of two regexes is a claim that must be tested, not assumed, because possessive quantifiers (`++`) change backtracking, not matches, only when the alternation order is preserved.

**Reversibility, precisely.** For byte-level BPE with no normaliser (tiktoken; the Hugging Face `ByteLevel` pre-tokenizer + `ByteLevel` decoder), `decode_bytes(encode(t)) = t` for every byte string, including invalid UTF-8, because every byte is in the alphabet and pre-tokenization is a partition of the input. For SentencePiece with `byte_fallback=true` and `normalization_rule_name=identity`, `add_dummy_prefix=false`, `remove_extra_whitespaces=false`, the same holds on the encoded text; with the defaults it holds only on `N(t)`. For character-alphabet models without byte fallback, it fails on any character outside the alphabet. For WordPiece, it fails on any word containing an unknown character (whole word → `<unk>`, R10.7). A decode of an arbitrary id sequence — not one produced by encode — is a different question: OFFICIAL-DOCUMENTATION (R10.22, §2.6.2): "input IDs are not guaranteed to map to valid Unicode strings (since a user could input any sequence of integer IDs). In the case that the input token IDs do not produce a valid Unicode string, you should replace the malformed bytes with the official Unicode replacement character U+FFFD." Cost: the replacement policy (`errors='replace'`) is a silent data change at the output boundary; a streaming decoder must buffer until a code point completes or it will emit U+FFFD for every partial byte ([§37.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-2-sequence-termination.md) owns the streaming rules).

**Unreachable and partial tokens.** PAPER-REPORTED (R10.37, §2): "UNREACHABLE TOKENS are those that are never produced as a result of tokenizing text. We test this by checking if decoding a token to a string, and re-tokenizing this string, results in the original token ID"; "PARTIAL UTF-8 SEQUENCES are tokens representing byte sequences that cannot be converted to Unicode characters"; "The most common occurrences are the bytes 0xF5–0xFF which are not used in UTF-8 encoded text", and "many tokenizers including those from the Gemma, Llama2 and Mistral families include every byte as a token, with many of them in the normal ASCII range 0x00–0x7F being redundant and unreachable due to the existence of a token for the corresponding character", while "we also find models which include precisely the 243 bytes used in UTF-8 as tokens." The decode→re-encode test is therefore a first-class check on any tokenizer artifact, independent of the model.

**Serialisation of the artifact.** Hugging Face Transformers loads `tokenizer.json` (the Tokenizers pipeline), `tokenizer.model` (a SentencePiece protobuf) or a tiktoken-style ranks file, plus `tokenizer_config.json`; GGUF embeds the vocabulary directly: OFFICIAL-DOCUMENTATION (R10.29): `tokenizer.ggml.model` is "The name of the tokenizer model" with values `llama` ("Llama style SentencePiece (tokens and scores extracted from HF tokenizer.model)"), `gpt2` ("GPT-2 / GPT-NeoX style BPE (tokens extracted from HF tokenizer.json)"), `replit`, `rwkv`; `tokenizer.ggml.token_type` is "The token type (1=normal, 2=unknown, 3=control, 4=user defined, 5=unused, 6=byte)"; `tokenizer.ggml.merges`: "If present, the merges of the tokenizer. If not present, the tokens are assumed to be atomic"; and `tokenizer.huggingface.json` may carry "the entirety of the HF tokenizer.json". The token-type enum is the GGUF encoding of SentencePiece's distinction between control symbols ("never tokenized from raw text and decode to empty strings") and user-defined symbols ("matched from raw text as indivisible tokens"), OFFICIAL-DOCUMENTATION (R10.5); [§10.5](10-5-tool-and-multimodal-interfaces.md) builds the injection argument on this distinction. Cost: a conversion between formats is a re-implementation of the pipeline in another library — the pre-tokenizer regex, the normaliser and the byte remap must all be re-expressed — and every such conversion is a drift risk that [§10.6](10-6-migration-and-compatibility.md) treats.

## Algorithm

```text
Algorithm 10.6 — Tokenizer pipeline with explicit reversibility state
INPUT   raw bytes t; artifact A = (normaliser N or identity, pre-tokenizer regex P, model E with alphabet Σ,
        byte_fallback ∈ {on, off}, special-token table S with parse policy)
OUTPUT  ids; reversibility class ∈ {byte-exact, normalised-exact, lossy}
STATE   offsets : list[(start, end)] aligning each id to a byte span of t
INVARIANT concatenation of the byte spans of the ids covers t exactly when class = byte-exact
1.  (u, align) ← N(t) with alignment; class ← byte-exact if N = identity else normalised-exact
2.  spans ← split u by S according to the parse policy (data spans and control spans; §10.5)
3.  for each data span: chunks ← P(span)                            # partition; no bytes dropped
4.  for each chunk: if every symbol of chunk ∈ Σ: pieces ← E(chunk)
5.          else if byte_fallback: pieces ← E over chunk with out-of-alphabet chars replaced by byte tokens
6.          else: pieces ← E(chunk) with <unk>; class ← lossy
7.  ids ← [id(p) for p in pieces]; offsets ← project chunk spans through align
8.  return ids, class, offsets
TERMINATION: each stage is a single pass over its input.
```

Complexity: O(|t|) for normalisation and pre-tokenization, plus the segmenter cost per chunk (Algorithms 10.2 and 10.4). Implementation: this is the structure of the Hugging Face Tokenizers pipeline (R10.12) with the SentencePiece and tiktoken cases as configurations (N = precompiled NFKC FST or identity; P = whitespace escape or regex).

```text
Algorithm 10.7 — Round-trip classification of one input
INPUT   t; artifact A; decoders D_bytes, D_str
OUTPUT  verdict ∈ {byte-exact, normalised-exact, replacement-char, lossy}
1.  ids ← encode(t) with special tokens disabled
2.  b ← D_bytes(ids); if b == t: return byte-exact
3.  if b == N(t): return normalised-exact
4.  s ← D_str(ids, errors="replace"); if U+FFFD ∈ s and U+FFFD ∉ t: return replacement-char
5.  return lossy
```

Complexity O(|t|). Implementation: the `roundtrip` family of [verification.md](verification.md), executed over the adversarial input classes listed there.

## Implementation

Tensors and operators: the output of Algorithm 10.6 is `input_ids: int32/int64 [T]` plus optional `offsets`; the CS336 handout recommends `uint16` for serialised ids when V < 65,536 (OFFICIAL-DOCUMENTATION, R10.22 §2.7), which halves storage relative to `int32` and is a data-pipeline decision owned by [§12.1](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-1-storage-and-formats.md). Framework: *Hugging Face Transformers* (#26, Model definition / adaptation) binds a tokenizer artifact to a model through `AutoTokenizer`, and the same artifact is read by the inference engines *vLLM* (#41) and *SGLang* (#42) (Inference engine layer), which run the Hugging Face tokenizer in their frontends; *llama.cpp* (#45, Inference engine) re-implements the pipeline from GGUF metadata, exposing `/tokenize` with `add_special`, `parse_special` and `with_pieces` options (OFFICIAL-DOCUMENTATION, R10.27). Kernels: none. Memory: vocabulary and merge tables; alignment arrays. Communication: none; but a tokenizer that runs in the API frontend and a detokenizer that runs per decode step are on the request's latency path ([§42.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-1-phase-decomposition.md)). Deployment: chunked encoding of large files must not split a pre-token across chunk boundaries — OFFICIAL-DOCUMENTATION (R10.22, §2.6): "we need to make sure that a token doesn't cross chunk boundaries, else we'll get a different tokenization than the naïve method" — so chunking is done at special-token or whitespace boundaries.

> **Implementation note [impl.llama-cpp · GGUF specification as of 2026-09-20; llama.cpp version UNVERIFIED].** The GGUF `token_type` field (R10.29) carries the control/user-defined distinction; a converter that writes type 1 (normal) for a control token makes that token matchable from raw text in llama.cpp while it is unmatchable in the source library, which is the injection asymmetry of [§10.5](10-5-tool-and-multimodal-interfaces.md). Whether a given converter release preserves the field for a given source tokenizer is NOT-DISCLOSED here.

## Experimental design

### Experiment 10.2 — Round-trip and cross-implementation identity on adversarial inputs

- **Hypothesis.** For a byte-level BPE artifact loaded in Hugging Face Tokenizers, tiktoken (via exported ranks) and llama.cpp (via GGUF), `encode` produces identical id sequences and `decode_bytes` is byte-exact on all input classes; for a SentencePiece artifact with default normalisation, round-trips are normalised-exact and fail byte-exactness on whitespace and NFKC-affected classes.
- **Setup.** One byte-level and one SentencePiece artifact; three loaders each; the adversarial corpus of [verification.md](verification.md): combining marks (NFC and NFD forms of the same string), ZWJ emoji sequences and modifier sequences, right-to-left text with embedded digits, fullwidth and ligature characters (NFKC-sensitive), leading/trailing/repeated whitespace, tabs versus spaces in code, numbers of 1–12 digits, and invalid UTF-8 byte strings.
- **Independent variables.** Artifact type; loader; input class.
- **Controlled variables.** Artifact bytes (hash-pinned); special tokens disabled; library versions recorded.
- **Dataset/workload.** ≥ 1,000 strings per class, drawn from FLORES-200-style parallel text where a natural source exists and synthesised otherwise.
- **Hardware.** CPU only.
- **Metrics.** Per class: fraction byte-exact, normalised-exact, replacement-char, lossy (Algorithm 10.7); cross-loader id-sequence equality rate; tokens per byte per class.
- **Baselines.** Same artifact, same loader, two processes (must be 100 % identical — the floor).
- **Expected result.** Byte-level: 100 % byte-exact within a loader; cross-loader differences, if any, localised to whitespace-run and newline classes (regex re-implementation) and to control-token handling. SentencePiece defaults: byte-exact fails on leading/trailing/repeated whitespace and on NFKC-affected classes; normalised-exact holds. ASSUMED.
- **Ablation.** Toggle `byte_fallback`; toggle `add_dummy_prefix`; replace the regex with the "equivalent" faster form and diff.
- **Interpretation.** Any cross-loader inequality on a byte-level artifact is a serving defect, not a modelling choice. A SentencePiece normalised-exact result is by design and must be documented in the artifact card.
- **Threats to validity.** Loader default arguments (e.g., `add_special_tokens`) silently differ; the test must pin them. Synthesised invalid UTF-8 may be rejected at the HTTP layer before reaching the tokenizer in a real deployment.

## Observations

**What the paper claims.** PAPER-REPORTED (R10.4): SentencePiece gives "comparable accuracy to direct subword training from raw sentences" without pre-tokenization on English–Japanese, and segmentation "about 380 times faster than that of subword-nmt" on raw Japanese (Table 2, KFTT, Xeon 3.5 GHz, 16k vocabulary). OFFICIAL-DOCUMENTATION (R10.13): tiktoken BPE is "reversible and lossless". OFFICIAL-DOCUMENTATION (R10.12): the ByteLevel pre-tokenizer makes an unknown token "absolutely unnecessary".

**What the evidence shows.** The reversibility claims are structural and hold by construction under the stated configuration; they are not empirical. The speed figures are single-workload vendor measurements. The NFKC-subset caveat (R10.4 fn. 3) is an author-acknowledged deviation from the Unicode standard and has no published characterisation of which inputs it affects (UNVERIFIED).

**What we infer.** DERIVED: because Eq. 10.5 is relative to N, two artifacts with the same vocabulary and different `normalization_rule_name` are different tokenizers; a model card that omits the rule name under-specifies the artifact. DERIVED: the `\p{N}{1,3}` clause makes numeric token cost a deterministic function of digit count, which is a property a downstream cost model ([§10.3](10-3-vocabulary-economics.md)) can use; per-digit splitting makes it exactly linear.

**What remains unknown.** NOT-DISCLOSED: which whitespace-run lengths are single tokens in any named production tokenizer (requires inspecting its merges). UNVERIFIED: the regex equivalence claim in R10.13 for all Unicode inputs. Open question: whether Unicode-version drift in NFKC tables has changed any production tokenizer's output between releases — testable by Experiment 10.2 across library versions.

## Failure modes

> **Failure mode — normalisation drift.** *Symptom:* identical text tokenises differently after a library or ICU upgrade. *Cause:* NFKC tables depend on the Unicode version (R10.4 §3.5) unless precompiled into the artifact. *Detection:* Experiment 10.2 across versions on NFKC-sensitive inputs. *Mitigation:* ship the normaliser inside the artifact or use identity normalisation with a byte alphabet.

> **Failure mode — whitespace non-reversibility.** *Symptom:* decoded output loses indentation, double spaces, or a leading space; code blocks come back mis-indented. *Cause:* `remove_extra_whitespaces` and `add_dummy_prefix` defaults, or a `Ġ`-convention decoder applied to a `▁`-convention vocabulary. *Detection:* byte-exact round trip on the whitespace class. *Mitigation:* configure the artifact for identity whitespace handling; never mix conventions across a conversion.

> **Failure mode — mid-code-point split at the stream boundary.** *Symptom:* U+FFFD characters in streamed output that are absent from the full decode. *Cause:* byte-level tokens ending inside a multi-byte character, decoded one token at a time with `errors="replace"`. *Detection:* compare streamed concatenation with batch decode. *Mitigation:* buffer bytes until a valid code point completes (R10.13 `decode_bytes`; [§37.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-2-sequence-termination.md)).

> **Failure mode — unreachable tokens after conversion.** *Symptom:* ids that never appear in encoded text but exist in the vocabulary; some are emitted by the model as glitches. *Cause:* redundant byte tokens, manually added tokens shadowed by pre-tokenization, or a converter that changed token types (R10.37). *Detection:* decode→re-encode every id. *Mitigation:* the `reachability` family of [verification.md](verification.md); treat unreachable ids as forbidden at decode.

> **Failure mode — chunk-boundary retokenisation.** *Symptom:* a file tokenised in chunks differs from the same file tokenised whole. *Cause:* a chunk boundary inside a pre-token (R10.22 §2.6). *Detection:* tokenise whole and chunked; diff. *Mitigation:* split only at special tokens or at pre-tokenizer boundaries.

## Siblings

**SentencePiece (self-contained normaliser + segmenter, `▁` convention)** — this file
Why it exists: language-independent, lossless-relative-to-normalisation tokenization trained from raw text (R10.4). What assumption changed (relative to subword-nmt): whitespace is a symbol, not a delimiter. What objective changed: none. What problem it solved: reproducible preprocessing embedded in one file. What new failure mode it introduced: NFKC subset and whitespace collapse make byte-exactness false by default. Changed primitive: external tokenizer script → embedded FST + model.

**Hugging Face Tokenizers (composable pipeline with alignment)** — this file
Why it exists: one pipeline abstraction over BPE, WordPiece, Unigram and WordLevel with offset tracking (R10.12). What assumption changed: normaliser, pre-tokenizer, model, post-processor and decoder are independent components. What objective changed: none. What problem it solved: model-agnostic loading of any published tokenizer. What new failure mode it introduced: a configuration (JSON) is the artifact; a component swap without retraining silently changes ids ("you should probably retrain it from scratch afterward", R10.12). Changed primitive: monolithic tokenizer → typed component chain.

**tiktoken (regex + ranked byte merges, no normaliser)** — this file
Why it exists: fast byte-level BPE with lossless byte decode (R10.13). What assumption changed: no normalisation at all; the pattern string is part of the artifact. What objective changed: none. What problem it solved: byte-exact reversibility and a pluggable encoding registry. What new failure mode it introduced: `decode` is lossy at UTF-8 boundaries; special-token text raises by default (a feature for [§10.5](10-5-tool-and-multimodal-interfaces.md)). Changed primitive: normaliser → identity.

**Corpus-level normalisation ([§8.1](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-1-normalization.md))** — owned elsewhere
Why it exists: cleaning before training data is stored. What assumption changed: normalisation is a data operation, not a tokenizer operation. What problem it solved: consistent corpora. What new failure mode it introduced: serving text is not cleaned the same way — a train/serve gap that only tokenizer-embedded normalisation closes. Changed primitive: pipeline step → artifact property.

## Extensions

Domain adaptation: code corpora want `identity` normalisation, preserved whitespace runs and a newline-isolating regex; mathematics wants digit splitting. Long context: none beyond fertility. Multimodality: placeholder tokens for images and audio must be user-defined symbols (matched from text) or control symbols (inserted by the processor), and the choice determines whether user text can forge them ([§10.5](10-5-tool-and-multimodal-interfaces.md)). Agents: tool-call delimiters are subject to the same rule. Proposals only.

## Limitations

The reversibility classification is exact for the configurations named and says nothing about implementations not opened here (LMDeploy, TensorRT-LLM frontends: NOT-DISCLOSED). Regex semantics are engine-dependent (possessive quantifiers, Unicode property support); an "equivalent" pattern in another regex engine is UNVERIFIED until diffed. Falsification: a byte-level artifact for which Experiment 10.2 finds a non-byte-exact round trip within one loader would falsify the structural claim and indicate a special-token or pre-tokenizer partition defect. Decision consequence: choose identity normalisation plus byte alphabet when serving arbitrary user text; accept normalised-exactness only with a documented rule set.

## Reproducibility

Sources opened 2026-09-20: R10.4 (arXiv PDF), R10.5 (repository README and `doc/options.md`), R10.12 (`pipeline` and `components` pages), R10.13 (README, `tiktoken/core.py`, `tiktoken_ext/openai_public.py` on `main`), R10.22 (handout v26.0.3), R10.27 (server README), R10.29 (GGUF spec), R10.30 (arXiv PDF), R10.37 (arXiv PDF), R10.41 (UAX #15, Unicode 18.0.0 revision 58), R10.42 (UTS #51 version 18.0). Library release numbers were not pinned by the pages opened and are UNVERIFIED. Metric definitions: byte-exact and normalised-exact as in Algorithm 10.7.

## References

R10.4 · R10.5 · R10.7 · R10.12 · R10.13 · R10.22 · R10.27 · R10.29 · R10.30 · R10.37 · R10.41 · R10.42 · [notation.md](../../../front-matter/notation.md) · [references.md](references.md)
