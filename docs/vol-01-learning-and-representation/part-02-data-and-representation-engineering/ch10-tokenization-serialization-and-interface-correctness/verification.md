---
id: ms.verification.10
entity_type: verification
title: Verification — tokenizer and serialization compatibility suite
short_title: Verification 10
volume: 1
part: 2
chapter: 10
section: null
slug: verification
parent: ms.chapter.10
prev_sibling: ms.section.10.6
next_sibling: ms.references.10
children: []
prerequisites: [ms.section.10.1, ms.section.10.2, ms.section.10.4, ms.section.10.5, ms.section.10.6]
downstream: [ms.section.31.6, ms.section.43.6, ms.section.47.3, ms.section.66.2]
related: []
siblings_by_mechanism: []
relations:
  - {type: implemented_by, target: impl.hugging-face-transformers}
  - {type: evaluated_by, target: experiment.10.7}
  - {type: evaluated_by, target: experiment.10.8}
axes:
  lifecycle: [data, post_training, serving, assurance]
  mechanism: [tokenization, serialization, compatibility_testing]
  feedback_setting: []
  modality: [text, image, audio]
papers: []
implementations: [impl.hugging-face-transformers, impl.vllm, impl.sglang, impl.llama-cpp]
benchmarks: []
datasets: []
status:
  maturity: established
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, OFFICIAL-DOCUMENTATION, ASSUMED, UNVERIFIED]
  empirically_observed: false
word_count_target: 1400
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# Verification — Chapter 10

## 1. Artifact specification

The chapter artifact is *a tokenizer and serialization compatibility suite*: a set of test families, each with exact assertions, that runs against a pinned artifact (Eq. 10.22) and every serving path that will consume it. It consists of five files.

| File | Contents | Fields |
|---|---|---|
| `manifest.json` | Eq. 10.22 for the artifact under test | `weights_hash, tokenizer_hash, template_hash, special_map_hash, generation_config_hash, vocab_size_weights, vocab_size_tokenizer, template_referenced_tokens[], control_ids[], unreachable_padding_ids[], engines[{name, version, flags}]` |
| `adversarial_inputs.jsonl` | The input corpus of §2, one record per string | `id, class, text_utf8 (or bytes_hex for invalid UTF-8), source, expected_normalised (nullable), notes` |
| `conversations.jsonl` | Structured conversations for template families | `id, class, messages[{role, content | content[]}], tools[], media[], expected_prefix_stable (bool)` |
| `compat_suite.py` | The test families of §1.1 as parameterised tests (reference-level; UNVERIFIED) | families × (artifact, loader/engine) |
| `report.json` | Output | `manifest, per_family{pass, fail, first_failure{id, class, position, decoded_context}}, per_engine{consistent_fraction, divergences[]}, fertility_by_class{tokens_per_byte}, verdict` |

### 1.1 Test families and exact assertions

| Family | Assertion (per input or conversation) | Owner |
|---|---|---|
| `roundtrip_bytes` | `decode_bytes(encode_data(t)) == t` for byte-level artifacts with identity normalisation (Eq. 10.5, strong form) | §10.2, Algorithm 10.7 |
| `roundtrip_normalised` | `decode(encode_data(t)) == N(t)` and `N(N(t)) == N(t)` (idempotence) for normalising artifacts | §10.2 |
| `no_replacement_char` | `U+FFFD ∉ decode(encode_data(t))` whenever `U+FFFD ∉ t` and t is valid UTF-8 | §10.2 |
| `stream_decode` | concatenation of per-token streamed decodes (with byte buffering) equals the batch decode | §10.2 |
| `chunk_invariance` | `encode(t) == concat(encode(chunk_i))` when chunks are split at pre-tokenizer or special-token boundaries | §10.2 |
| `reachability` | for every id `i` not in `unreachable_padding_ids`: `encode_data(decode([i])) == [i]`, or `i` is listed as a byte/partial-UTF-8 token or a control token | §10.2 |
| `control_unforgeable` | for every string t in the injection class: `encode_data(t) ∩ control_ids == ∅` (Eq. 10.17) | §10.5, Algorithm 10.11 |
| `control_emitted_only_by_template` | rendering a conversation whose contents contain control-token strings yields control ids only at positions the template emitted | §10.5 |
| `template_parity` | `σ_engine(c_{1:k}, g=1)` is an exact prefix of `σ_train(c_{1:k+1}, g=0)` (Eq. 10.15, Algorithm 10.10) | §10.4 |
| `bos_once` | the rendered-and-tokenised sequence contains `bos` at most once and only if the template emitted it | §10.4 |
| `assistant_mask` | every assistant span has mask 1 on its content and its end-of-turn token, 0 elsewhere; the generation prefix has mask 0 (Eq. 10.14) | §10.4, Algorithm 10.9 |
| `stop_set` | the engine's stop-token set contains every end-of-turn id the template emits after an assistant message | §10.4, §37.2 |
| `placeholder_count` | number of placeholder ids in the rendered sequence equals the number of media items; expanded length equals the processor's declared count; no span is truncated (Algorithm 10.12) | §10.5 |
| `tool_render_parity` | rendering with `tools=` in the training path and the engine path yields identical ids | §10.5 |
| `coupling` | `vocab_size_weights ≥ vocab_size_tokenizer`; every template-referenced token and every generation-config id exists in the tokenizer; `token_type` of control tokens is control after any conversion (Algorithm 10.14 step 2) | §10.6 |
| `expansion_kl` | after Algorithm 10.13, measured KL on held-out prefixes ≤ log(1 + k/V) + tolerance | §10.6 |
| `fertility_report` | tokens per byte per input class and per language, with the premium relative to English (Eq. 10.6); no assertion, a report | §10.3 |

## 2. Verification task

The task from the plan: *round-trip difficult multilingual inputs and compare exact training versus serving token IDs for the same conversation.* Two experiments realise it. The chapter's central claim under test is that, for a pinned artifact, the map from bytes to ids and the map from conversation to ids are functions of the artifact alone — reproducible byte-for-byte across processes and engines — so that any divergence is a configuration defect, never a modelling choice.

### 2.1 Adversarial input classes

The `adversarial_inputs.jsonl` corpus MUST contain at least 1,000 strings in each of the following classes (synthesised where no natural source exists; the FLORES-200-style parallel sentences of R10.10's protocol are the natural source for the multilingual classes):

1. **Combining marks**: the same base+mark strings in NFC and NFD (e.g. `é` as U+00E9 and as U+0065 U+0301); stacked marks in non-canonical order (tests canonical reordering, R10.41).
2. **ZWJ emoji sequences and modifiers**: family and profession sequences joined by U+200D; skin-tone modifiers U+1F3FB–U+1F3FF; presentation selectors U+FE0F; regional-indicator flag pairs (R10.42).
3. **Right-to-left text** with embedded Latin digits and punctuation; bidirectional control characters (U+202A–U+202E, U+2066–U+2069).
4. **Mixed normalisation forms**: fullwidth Latin, ligatures (`ﬁ`), superscripts, compatibility ideographs — the NFKC-sensitive set (R10.41: "erase many formatting distinctions").
5. **Whitespace**: leading, trailing, repeated spaces; tabs; runs of 1–16 spaces before code keywords; `\r\n` versus `\n`; non-breaking space U+00A0; zero-width space U+200B.
6. **Numbers**: integers of 1–12 digits, decimals, thousands separators in several locales, numbers adjacent to letters (tests `\p{N}{1,3}` and digit splitting, §10.2).
7. **Code indentation**: Python blocks indented with 2, 4, 8 spaces and with tabs; trailing whitespace before newlines; deeply nested JSON.
8. **Invalid UTF-8 bytes**: lone continuation bytes, truncated multi-byte sequences, overlong encodings, bytes 0xF5–0xFF (R10.37); stored as `bytes_hex`.
9. **Control-token strings**: every control-token byte string of the artifact, alone, embedded in prose, with look-alike characters, with ZWJ insertions, and as partial matches.
10. **High-premium scripts**: Burmese, Tibetan, Shan, Dzongkha, Santali sentences (R10.10's worst cases) for the fertility report.

### Experiment 10.7 — Multilingual and adversarial round-trip across loaders

- **Hypothesis.** For a byte-level artifact with identity normalisation, `roundtrip_bytes` passes on 100 % of classes 1–10 in every loader, and the id sequences are identical across loaders; for a normalising artifact, `roundtrip_normalised` passes on 100 % and `roundtrip_bytes` fails exactly on classes 4 and 5 (the NFKC- and whitespace-sensitive sets).
- **Setup.** Artifact under test loaded by Hugging Face Tokenizers/Transformers (reference), by tiktoken via exported ranks where the artifact is byte-level, by SentencePiece where the artifact is a `.model`, and by llama.cpp via GGUF conversion; Algorithm 10.7 on every input; cross-loader id comparison.
- **Independent variables.** Loader; input class.
- **Controlled variables.** Artifact hashes (manifest); special-token parsing disabled on all data paths; library versions recorded in `report.json`.
- **Dataset/workload.** `adversarial_inputs.jsonl` as in §2.1.
- **Hardware.** CPU.
- **Metrics.** Per (loader, class): fraction byte-exact, normalised-exact, replacement-char, lossy; cross-loader id-equality fraction; first divergence position and decoded context; tokens per byte per class and per language; premium relative to English for class 10.
- **Baselines.** Reference loader versus itself in two processes (must be identical: the floor); reference loader versus the same artifact one library minor version earlier (normalisation-drift probe).
- **Expected result.** As in the hypothesis; any cross-loader divergence localises to whitespace-run, newline, or control-token classes. ASSUMED.
- **Ablation.** Toggle `byte_fallback` (SentencePiece); toggle `add_dummy_prefix`; convert with `token_type` deliberately corrupted to confirm `reachability` and `control_unforgeable` detect it.
- **Interpretation.** A byte-level artifact failing `roundtrip_bytes` in any loader has a pre-tokenizer or special-token partition defect in that loader. A normalising artifact failing `roundtrip_normalised` has a normaliser mismatch between loader and artifact (Unicode version or subset, R10.4 fn. 3).
- **Threats to validity.** HTTP layers may reject invalid UTF-8 before the tokenizer; test the tokenizer library directly and the engine end-to-end and report both. Regex engines differ in Unicode property tables; record the regex engine version.

### Experiment 10.8 — Training-versus-serving token ids for the same conversation

- **Hypothesis.** For every conversation in `conversations.jsonl` and every engine, the serving ids with the generation prefix are an exact prefix of the training ids of the conversation extended by the assistant reply (Eq. 10.15); the assistant mask is 1 exactly on assistant content plus end-of-turn; the engine's stop set contains the end-of-turn id; tool and media renderings match.
- **Setup.** σ_train from Transformers `apply_chat_template(add_generation_prompt=False, return_assistant_tokens_mask=True)` and from the TRL SFT collator; σ_serve from vLLM (chat API with a tokenizer-only or small-model deployment, no `--chat-template`), SGLang (default template path), llama.cpp (`/apply-template` and `/tokenize` with the GGUF-embedded template, `--jinja` on and off, no override); Algorithm 10.10 per pair; families `template_parity`, `bos_once`, `assistant_mask`, `stop_set`, `placeholder_count`, `tool_render_parity`, `control_emitted_only_by_template`.
- **Independent variables.** Engine and template path; conversation class: {no system, system, 1/2/8 turns, assistant prefill (`continue_final_message`), reasoning-field prefill, tool definitions present, tool call + tool result turns, one/two images, one audio item, contents containing control-token strings, contents with leading/trailing whitespace and `\r\n`, non-Latin contents, contents from class 10}.
- **Controlled variables.** Manifest hashes; `add_special_tokens=False` after rendering; identical library versions; clock pinned if the template calls `strftime_now`.
- **Dataset/workload.** ≥ 500 conversations per class.
- **Hardware.** CPU for serialisation; a single accelerator only if an engine cannot expose its tokenised prompt without loading weights.
- **Metrics.** Per (engine, class): consistent fraction; first-divergence position and decoded ±3-token context; doubled-`bos` count; unmasked end-of-turn count; stop-set coverage; placeholder-count mismatches; tool-render mismatches; control ids found in data spans.
- **Baselines.** Transformers versus TRL collator (the training-side pair; must be identical); Transformers versus itself across two processes.
- **Expected result.** 100 % consistency on the training-side pair; engine divergences, if any, in whitespace-trimming, `bos`, content-format and tool-rendering classes; 0 control ids in data spans on every path. ASSUMED.
- **Ablation.** Add a CLI template override differing by one trailing newline (must be detected at the prefix end); set `--jinja` off in llama.cpp on a template outside the legacy matcher's list (must be detected as a ChatML fallback, R10.27, R10.28).
- **Interpretation.** Any `template_parity` failure is train/serve template drift (§10.6) and a release blocker under [§47.3](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch47-observability-deployment-changes-and-incident-recovery/47-3-release-control.md). A `control_unforgeable` failure is a tokenizer-configuration defect independent of the model. An `assistant_mask` failure is a training-data defect that will present as run-on generation.
- **Threats to validity.** Engines that cannot expose tokenised prompts force inference of ids from logprob streams; use the tokenize endpoints where available and mark inferred comparisons. Content-format auto-detection ("string" versus "openai", R10.23) may differ per request shape; test both shapes.

### What would reject the chapter's central claim

If the training-side pair (Transformers `apply_chat_template` versus the TRL collator on the same artifact and version) disagrees on any conversation, or if the reference loader disagrees with itself across two processes on any input, then the maps are not functions of the artifact alone even within one library, and the chapter's premise — that divergence is always a configuration defect — is false for that library version. Every other failure is a localised defect the suite is designed to name.

## 3. Acceptance criteria

| Family | Criterion | Tolerance / notes |
|---|---|---|
| `roundtrip_bytes` (byte-level, identity N) | 100 % of inputs byte-exact in every loader | none; a single failure is a defect |
| `roundtrip_normalised` (normalising artifacts) | 100 % normalised-exact; `roundtrip_bytes` failures confined to classes 4–5 and documented | failures outside classes 4–5 are defects |
| `no_replacement_char`, `stream_decode`, `chunk_invariance` | 100 % | none |
| `reachability` | every id reachable, or classified as byte/partial-UTF-8/control/padding with the classification recorded | unclassified unreachable ids are defects |
| `control_unforgeable`, `control_emitted_only_by_template` | 0 control ids in data spans on every path | none |
| `template_parity`, `bos_once`, `tool_render_parity` | 100 % consistent per engine on the paths used in production | any divergence is a release blocker for that path |
| `assistant_mask`, `stop_set` | 100 % | none |
| `placeholder_count` | 100 %; no truncated spans | none |
| `coupling` | all checks pass | none |
| `expansion_kl` | KL ≤ log(1 + k/V) + 1e−3 nats (mean initialisation, no noise) | tolerance ASSUMED for FP32 logits; the k > 1 bound is the book's DERIVED extension (§10.6) |
| `fertility_report` | reported; premiums for class 10 recorded | no pass/fail; feeds [§48.1](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-1-workload-specification.md) |

Categorical rule: the suite verdict is `pass` only if every family with a 100 % criterion passes on every production path named in the manifest; an engine path not in the manifest is not covered and MUST NOT be deployed.

### Diagnostic signatures

| Signature | Indicates | Chapter reference |
|---|---|---|
| Divergence at position 0–1 | `bos` handling (`add_special_tokens`) | §10.4 Failure modes |
| Divergence at every turn boundary by one whitespace token | Jinja trimming or engine template re-implementation | §10.4, §10.6 |
| Divergence only when contents contain control strings | special-token parsing enabled on data | §10.5 |
| Divergence only in tool-bearing conversations | tool rendering or `tool_calls` argument type | §10.5 |
| Divergence only on one engine with `--jinja` off | legacy template matcher fallback | §10.6 Implementation note |
| `roundtrip_bytes` failures on classes 4–5 only | normalising artifact behaving as designed | §10.2 |
| `roundtrip_bytes` failures on class 8 only | loader replaces invalid bytes before encoding | §10.2 |
| Unreachable ids that decode to single ASCII characters | redundant byte tokens | §10.2 (R10.37) |

## 4. What this edition did not do

This suite is a proposal. No run of Experiment 10.7 or 10.8 was executed for Edition 1.0; no `report.json` exists; the expected results are ASSUMED from the documented behaviour of the libraries and engines as opened on 2026-09-20 (R10.5, R10.12, R10.13, R10.14, R10.15, R10.18, R10.20, R10.23, R10.26, R10.27, R10.28, R10.29). The listing below is reference-level, targets the Transformers v5.17.0 `apply_chat_template` signature as documented (R10.18) and the tiktoken `Encoding` API as documented (R10.13), has not been executed against any release, and is UNVERIFIED.

## 5. Reference listing (reference-level, UNVERIFIED)

```python
"""compat_suite.py — Chapter 10 artifact (skeleton).

Reference-level, not executed for this edition: UNVERIFIED. Written against the
Transformers v5.17.0 apply_chat_template signature (return_assistant_tokens_mask,
add_generation_prompt, continue_final_message) and the tiktoken Encoding API
(encode_ordinary, decode_bytes) as documented on 2026-09-20. Engine adapters
(vLLM, SGLang, llama.cpp) are interfaces to be filled per deployment.
"""
from __future__ import annotations
import json, math, unicodedata
from dataclasses import dataclass
from typing import Callable, Iterable

@dataclass
class Loader:
    name: str
    encode_data: Callable[[bytes], list[int]]      # special-token parsing OFF
    decode_bytes: Callable[[list[int]], bytes]
    normalise: Callable[[bytes], bytes] | None      # None = identity
    control_ids: set[int]

def roundtrip_class(t: bytes, L: Loader) -> str:
    ids = L.encode_data(t)
    b = L.decode_bytes(ids)
    if b == t:
        return "byte-exact"
    if L.normalise is not None and b == L.normalise(t):
        return "normalised-exact"
    s = b.decode("utf-8", errors="replace")
    if "�" in s and b"\xef\xbf\xbd" not in t:
        return "replacement-char"
    return "lossy"

def control_unforgeable(t: bytes, L: Loader) -> bool:
    return not (set(L.encode_data(t)) & L.control_ids)

def reachability(L: Loader, vocab_size: int, exempt: set[int]) -> list[int]:
    bad = []
    for i in range(vocab_size):
        if i in exempt or i in L.control_ids:
            continue
        if L.encode_data(L.decode_bytes([i])) != [i]:
            bad.append(i)
    return bad

def prefix_consistent(serve_ids: list[int], train_ids: list[int]) -> tuple[bool, int]:
    n = min(len(serve_ids), len(train_ids))
    for p in range(n):
        if serve_ids[p] != train_ids[p]:
            return False, p
    return len(serve_ids) <= len(train_ids), len(serve_ids)

def assistant_mask_ok(ids: list[int], mask: list[int], eot_id: int, spans: list[tuple[int, int]]) -> bool:
    inside = set()
    for a, b in spans:
        inside.update(range(a, b))
    if any(mask[t] != (1 if t in inside else 0) for t in range(len(ids))):
        return False
    return all(ids[b - 1] == eot_id and mask[b - 1] == 1 for _, b in spans)

def expansion_kl_bound(k: int, V: int) -> float:
    return math.log1p(k / V)   # one-token case is R10.36's bound; k>1 is the book's DERIVED extension

def run(manifest_path: str, inputs_path: str, loaders: Iterable[Loader]) -> dict:
    manifest = json.load(open(manifest_path, encoding="utf-8"))
    report = {"manifest": manifest, "per_family": {}, "fertility_by_class": {}}
    inputs = [json.loads(l) for l in open(inputs_path, encoding="utf-8")]
    for L in loaders:
        fam = report["per_family"].setdefault(L.name, {})
        for rec in inputs:
            t = bytes.fromhex(rec["bytes_hex"]) if "bytes_hex" in rec else rec["text_utf8"].encode("utf-8")
            fam.setdefault(rec["class"], []).append(roundtrip_class(t, L))
            if rec["class"] == "control_strings" and not control_unforgeable(t, L):
                fam.setdefault("control_violations", []).append(rec["id"])
    return report
```

The engine adapters, the conversation families and the KL measurement are omitted from the skeleton; they are specified by Algorithms 10.10, 10.13 and 10.14 and by §1.1 above.
