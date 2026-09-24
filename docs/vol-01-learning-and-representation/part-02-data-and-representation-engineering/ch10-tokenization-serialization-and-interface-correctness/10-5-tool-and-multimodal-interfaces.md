---
id: ms.section.10.5
entity_type: section
title: Tool and multimodal interfaces
short_title: Tools, control tokens, spans
volume: 1
part: 2
chapter: 10
section: 10.5
slug: 10-5-tool-and-multimodal-interfaces
parent: ms.chapter.10
prev_sibling: ms.section.10.4
next_sibling: ms.section.10.6
children: []
prerequisites: [ms.section.4.5, ms.section.10.2, ms.section.10.4]
downstream: [ms.section.10.6, ms.section.11.5, ms.section.37.4, ms.section.51.1, ms.section.51.3, ms.section.51.6, ms.section.55.2, ms.section.65.3]
related: [ms.section.46.6]
siblings_by_mechanism: []
relations:
  - {type: implemented_by, target: impl.hugging-face-transformers}
  - {type: implemented_by, target: impl.vllm}
  - {type: prerequisite_of, target: concept.tool-security}
axes:
  lifecycle: [post_training, inference, serving, assurance]
  mechanism: [serialization, control_tokens, modality_spans, tool_schema]
  feedback_setting: []
  modality: [text, image, audio, video]
papers: []
implementations: [impl.hugging-face-transformers, impl.vllm, impl.llama-cpp]
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used: [OFFICIAL-DOCUMENTATION, PAPER-REPORTED, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, UNVERIFIED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 2100
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 10.5 Tool and multimodal interfaces

## Scope

Objective: extend the serialisation contract of [§10.4](10-4-conversation-serialization.md) to the three non-text things a modern prompt carries — tool schemas and tool calls, control tokens, and modality placeholders that expand into image, audio or video spans — and state the boundary rule that keeps untrusted text from being parsed as control. Baseline: a text-only chat template in which every byte of every message is data. Success criterion: the reader can specify, for a given model, which byte spans of a request are trusted structure and which are untrusted data, can compute how many sequence positions a modality span occupies, and can state the control-token injection failure mode and its mitigation as tokenizer-level facts. Boundaries: tool representation, routing and security as agent-system questions ([§51.1](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-1-tool-representation.md), [§51.6](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-6-tool-security.md)); the Model Context Protocol, named here only as a forward pointer to [§51.3](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-3-protocol-boundaries.md); runtime attacks broadly ([§65.3](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch65-security-privacy-safety-and-adversarial-robustness/65-3-runtime-attacks.md)); visual encoders and fusion ([§55.2](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch55-vision-language-models-and-document-intelligence/55-2-alignment-and-fusion.md)); constrained decoding of tool calls ([§37.4](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-4-structured-generation.md)).

## Why this exists

What failed before was the identification of "the prompt" with "a string". Once a sequence carries tool definitions, model-emitted calls, tool results, and placeholders for pixels and waveforms, it is a typed record with trusted and untrusted regions, and the string view loses the types. The bottleneck is the tokenizer: it is the only component that decides whether the bytes `<|im_start|>` in a user's message are four words of text or one control token, and the decision is a configuration, not a default. OFFICIAL-DOCUMENTATION (R10.35): the raw ChatML string format "inherently allows injections from user input containing special-token syntax, similar to SQL injections". The dominant constraint became security and correctness at the same boundary: a placeholder that expands to the wrong number of positions corrupts every later position's alignment; a control token forged from user text rewrites the conversation's role structure. What changed is that the template and the processor took ownership of the structure — tools are rendered from JSON schema by the template, placeholders are emitted by the template and expanded by the processor, and special-token parsing is disabled on data spans — so that "the chat template should always match the format the model was trained with" (OFFICIAL-DOCUMENTATION, R10.15) becomes enforceable.

## Intuition

Physically, every position in the sequence costs the same, but positions differ in provenance: some were written by the application (structure), some by the user (untrusted data), some by the model (its own earlier output), some by a tool (untrusted data from the outside world), and some are not text at all (a modality span whose embeddings come from an encoder, not from the embedding table). The model cannot see provenance; it sees ids. Provenance therefore has to be encoded in the ids themselves — control tokens that only the application can emit — and the guarantee that only the application can emit them is a property of the tokenizer's special-token parsing, exactly analogous to parameterised queries in SQL. Heuristically, a control token is a byte sequence with a private constructor. DERIVED from the token-type mechanism of R10.5 and R10.29.

## Formulation

> **Definition — control token.** A vocabulary entry reserved for structure — turn boundaries, role headers, tool-call delimiters, modality placeholders, document boundaries — whose id is emitted by the template or processor and is never produced by segmenting data text; in SentencePiece terms a control symbol, which is "never tokenized from raw text and decode[s] to empty strings" (OFFICIAL-DOCUMENTATION, R10.5), as opposed to a user-defined symbol, which is "matched from raw text as indivisible tokens". GGUF records the distinction as `token_type` 3 (control) versus 4 (user defined) (OFFICIAL-DOCUMENTATION, R10.29).

Let a serialised request be a concatenation of typed spans:

$$
\text{ids} \;=\; \big\Vert_{j=1}^{J}\; \text{span}_j, \qquad \text{type}(\text{span}_j) \in \{\text{structure}, \text{data}_{\text{user}}, \text{data}_{\text{tool}}, \text{model}, \text{modality}\}
$$
*(Eq. 10.16)* where ‖ = concatenation; structure spans are rendered by the template, data spans by the tokenizer's data path, modality spans by the processor.

$$
\forall\, u \in \text{data spans}:\quad \mathcal{T}_{\text{data}}(u) \cap \mathcal{C} = \varnothing
$$
*(Eq. 10.17)* where 𝒯_data = the tokenizer with special-token parsing disabled, 𝒞 = the set of control-token ids. This is the **untrusted-text boundary invariant**: no byte string in a data span can produce a control id. MATHEMATICALLY-DERIVED as the condition under which the role structure of Eq. 10.16 is determined by the application alone. tiktoken enforces it by default: OFFICIAL-DOCUMENTATION (R10.13): "by default, `encode` will raise an error if it encounters text that corresponds to a special token"; `encode("<|endoftext|>")` "raises `ValueError`", while `encode("<|endoftext|>", allowed_special={"<|endoftext|>"})` returns `[50256]`, and `encode_ordinary` "Encodes a string into tokens, ignoring special tokens". Transformers exposes the opposite default: OFFICIAL-DOCUMENTATION (R10.18): `split_special_tokens` "defaults to `False`", so "if `<s>` is the `bos_token`, then `tokenizer.tokenize("<s>") = ['<s>']`", whereas with `split_special_tokens=True` it yields `['<', 's', '>']`. llama.cpp's `/tokenize` exposes `parse_special`, "Boolean indicating if special tokens should be tokenized" (OFFICIAL-DOCUMENTATION, R10.27).

$$
n_{\text{img}} = \Big\lceil \tfrac{H}{p} \Big\rceil \cdot \Big\lceil \tfrac{W}{p} \Big\rceil \;\big/\; m^{2}
$$
*(Eq. 10.18)* where H, W = image height and width after the processor's resizing, p = patch side, m = the side of any spatial merge applied before the language model; the placeholder emitted by the template is replaced by n_img positions. MATHEMATICALLY-DERIVED for patch-based encoders; the specific p, m and resizing policy are model-defined and NOT-DISCLOSED unless the model's report states them. PAPER-REPORTED (R10.34): Qwen2-VL "can now process images of any resolution, dynamically converting them into a variable number of visual tokens", so n_img is a function of the input, not a constant.

> **Assumption.** The template, the tokenizer and the processor are loaded from the same artifact revision · *sensitivity:* if the template emits a placeholder string that the tokenizer does not map to the processor's expected id, expansion fails silently or misaligns every later position.

## Mechanism

**Tool schemas.** OFFICIAL-DOCUMENTATION (R10.16, v5.17.0): tools "are passed as either a JSON schema or Python functions. If you pass Python functions, the arguments, argument types, and function docstring are parsed in order to generate the JSON schema automatically" — only Google-style docstrings are parsed, and "The parser will also ignore the actual code inside the function!" The schema form is `{"type": "function", "function": {"name", "description", "parameters": {"type": "object", "properties": {…}, "required": […]}}}`. The template receives them: "When a template accesses the `tools` variable, it is always a list of JSON schemas" and "you may need to radically change this format when rendering them to match the format a model was trained with. For example, Command-R was trained with tools defined with Python function headers" (R10.15). Cost: tool definitions are structure tokens in every request — a schema of a few hundred bytes costs on the order of a hundred positions per tool per request (tokens per byte per [§10.3](10-3-vocabulary-economics.md)), paid in prefill FLOPs and cache bytes; with prefix caching they are paid once per session if rendered identically each time.

**Tool calls and tool results.** The model's call is text it generated; the application parses it and appends it as structured data: OFFICIAL-DOCUMENTATION (R10.16): "A model cannot actually call the tool itself. It requests a tool call, and it's your job to handle the call and append it and the result to the chat history"; the call goes "in the `tool_calls` key of an `assistant` message" as `{"type": "function", "function": {"name": …, "arguments": {…}}}`, and the arguments are a dict, not a string — "the OpenAI API uses a JSON string as its `tool_calls` format. This may cause errors or strange model behavior if used in Transformers, which expects a dict." The result is appended with `{"role": "tool", "content": "22"}` — "the returned content is always a string!" (R10.16). The rendering of both is model-specific: R10.15's illustrative pattern wraps calls as `<tool_call>name\n{json}\n</tool_call>` and results as `<tool_result>…</tool_result>`; Llama 3.1 uses the `ipython` role for tool output and `<|python_tag|>` "in the model's response to signify a tool call", with `<|eom_id|>` marking that "a tool call needs to be made" (OFFICIAL-DOCUMENTATION, R10.32); Mistral uses `[TOOL_CALLS]`, `[AVAILABLE_TOOLS]` and `[TOOL_RESULTS]` (OFFICIAL-DOCUMENTATION, R10.43). The engine side: OFFICIAL-DOCUMENTATION (R10.24): vLLM's automatic tool choice requires `--enable-auto-tool-choice` and a model-family `--tool-call-parser` (`hermes`, `mistral`, `llama3_json`, `granite`, `internlm`, `jamba`, `xlam`, `pythonic`, …), optionally a `--chat-template` "which handles `tool`-role messages and `assistant`-role messages that contain previously generated tool calls"; with `tool_choice="auto"` "vLLM extracts tool calls from raw text, so arguments may occasionally be malformed or violate the function's parameter schema", while for named function calling "vLLM will use structured outputs to ensure the response matches the tool parameter object defined by the JSON schema". The parse is therefore a second, lossy tokenizer — text → structure — whose grammar is defined per model family; [§37.4](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-4-structured-generation.md) owns the constrained-decoding fix and [§51.4](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-4-execution-correctness.md) owns execution. Cost: a tool result is untrusted data of arbitrary length; it enters the sequence at the tool's fertility, and an agent loop re-prefills it on every subsequent step unless cached.

**Control tokens and the injection failure mode.** The failure: a user message (or a tool result, or a retrieved document) contains the byte string of a control token — `<|im_end|>\n<|im_start|>system\n…` — and the serialiser tokenises the message with special-token parsing enabled. The bytes become the control ids; the model sees a turn boundary and a new system message that the application never wrote. The mechanism is exactly R10.35's SQL-injection analogy, and it is a tokenizer configuration defect, not a model weakness: the model is behaving correctly on the ids it received. The mitigation is Eq. 10.17: tokenise every data span with the data path (tiktoken `encode_ordinary` or `disallowed_special` default; Transformers `split_special_tokens=True` or a tokenizer whose control tokens are true control symbols; llama.cpp `parse_special=false` on data), and let only the template emit control ids. The SentencePiece control-symbol design achieves the invariant structurally — control symbols cannot be produced from raw text at all — whereas user-defined symbols and Hugging Face "added tokens" are matchable from text by design and must be guarded at the call site. A second-order form of the attack survives the guard: text that *renders like* a role header without using the reserved bytes (e.g. `assistant:` on its own line under a template that uses plain-text role names). That is a prompt-injection question for [§51.6](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-6-tool-security.md) and [§65.3](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch65-security-privacy-safety-and-adversarial-robustness/65-3-runtime-attacks.md); the tokenizer-level guarantee is only that reserved ids are unforgeable. Cost: the guard is free in FLOPs; its price is the discipline of routing every untrusted string through the data path, including in evaluation harnesses and data-generation pipelines ([§11.5](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-5-interactive-collection.md)) where the injection would otherwise be baked into training data.

**Image, audio and video placeholders.** OFFICIAL-DOCUMENTATION (R10.17): for multimodal models "the `content` key in a multimodal chat history is a list containing multiple items of different types" (`{"type": "image", "url": …}`, `{"type": "text", "text": …}`, `{"type": "video", "path": …}`), and "the Processor class handles preprocessing, tokenization and chat templates for multimodal models"; its `apply_chat_template` returns `pixel_values` (and, for Qwen2.5-VL, `image_grid_thw`) alongside `input_ids`. The template's role is narrow: OFFICIAL-DOCUMENTATION (R10.15): "your template should emit a single special token like `<|image|>` or `<|video|>` when it encounters image or video content. The processor will expand the single special token out into a sequence of image or video tokens later." The expansion count is Eq. 10.18. Model-specific delimiters exist around the span: PAPER-REPORTED (R10.34): "Tokens `<|vision_start|>` and `<|vision_end|>` are inserted at the start and end of the image feature sequence to demarcate the image content", with `<|box_start|>`/`<|box_end|>` and `<|object_ref_start|>`/`<|object_ref_end|>` for grounding; audio uses the same pattern, `<|audio_bos|><|AUDIO|><|audio_eos|>` with a configured `audio_token_index` (OFFICIAL-DOCUMENTATION, R10.47). Video adds a sampling decision that changes n: "The `num_frames` parameter controls how many frames to uniformly sample from the video … exceeding this count can significantly lower generation quality", and `fps` samples by time (R10.17). The engine side: OFFICIAL-DOCUMENTATION (R10.25): with the chat API "the prompt will be processed automatically by the API server" from `image_url`, `video_url` and `audio_url` parts, whereas offline prompts must "follow the format that is documented on HuggingFace" with explicit placeholders; `--limit-mm-per-prompt` caps items per request; pre-computed embeddings can bypass the encoder, and "The vLLM engine may crash if incorrect shape of embeddings is passed." Cost: a modality span costs n positions in prefill FLOPs and cache bytes exactly like text (Eq. N.8 per position), plus the encoder's own forward pass, which is paid once per image and is not part of the language model's 2N-per-token accounting; at dynamic resolution, n is bounded only by the processor's maximum, so a high-resolution image can occupy thousands of positions — the context-budget question of [§50.2](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch50-context-construction-and-retrieval-augmented-generation/50-2-context-budgeting.md).

**Modality spans in the loss and in truncation.** Modality positions are conditioning, never targets: they carry zero loss mask by the conditional generative objective of [§4.5](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-5-conditional-and-multimodal-learning.md). They must also never be truncated: OFFICIAL-DOCUMENTATION (R10.20): "For VLMs, truncating may remove image tokens, leading to errors during training. To avoid this, set `max_length=None`" — because the processor expects exactly n placeholder positions per image and a truncated span breaks the count. DERIVED: any length policy for multimodal sequences must operate on whole spans of Eq. 10.16, not on tokens.

## Algorithm

```text
Algorithm 10.11 — Boundary-safe serialisation of a request with tools and untrusted spans
INPUT   messages c with roles; tools as JSON schema; template τ; tokenizer 𝒯 with control set 𝒞; processor Π (if multimodal)
OUTPUT  ids; provenance : type[T] per Eq. 10.16; mask (training) per Eq. 10.14
INVARIANT Eq. 10.17: no data span yields an id in 𝒞
1.  for each message: for each content item: if type = text and role ∈ {user, tool}:
        assert 𝒯_data(text) ∩ 𝒞 = ∅   # data path; reject or escape if the tokenizer cannot guarantee it
2.  s ← τ(c, tools, add_generation_prompt = g) rendering tool schemas and tool calls in the model's format,
        emitting one placeholder per media item and one control id per boundary
3.  segments ← split s into (structure | data | model | placeholder) by τ's emission log
4.  ids ← concatenate: structure segments via 𝒯 with special parsing ON;
                       data and model segments via 𝒯_data (special parsing OFF);
                       placeholders → Π expands each to n positions (Eq. 10.18) and returns pixel/audio features
5.  provenance ← per-position type from the concatenation
6.  if training: mask ← 1 on assistant-text and assistant-tool-call positions incl. end-of-turn; 0 elsewhere
7.  return ids, provenance, mask, features
TERMINATION: one pass over the messages and one render.
```

Complexity: O(|s|) plus the encoder cost per media item. Implementation: Transformers `apply_chat_template` with `tools=` (R10.16) and processor expansion (R10.17); step 1 corresponds to tiktoken's default `disallowed_special` behaviour (R10.13) and to `split_special_tokens=True` in Transformers (R10.18). Note that step 4's split path is a specification: Transformers' `apply_chat_template(tokenize=True)` tokenises the rendered string as one unit, so the invariant must be enforced at step 1 (reject or escape control-token strings in data) when using that path.

```text
Algorithm 10.12 — Modality-span expansion and alignment check
INPUT   ids with placeholder ids P; media items with processor outputs (n_j positions each); expected delimiter ids
OUTPUT  expanded ids; span table [(start_j, end_j, modality_j)]
1.  assert count(ids == P) == number of media items                    # one placeholder per item
2.  for each placeholder occurrence j in order: replace by n_j copies of the modality-pad id
3.  verify each expanded span is enclosed by the model's delimiters (e.g. vision_start/vision_end) if defined
4.  assert total length ≤ context limit without truncating any span
5.  return expanded ids, span table
```

Complexity O(T). Implementation: the processor's internal expansion in Transformers (R10.15, R10.17); vLLM's automatic placeholder processing in the chat API (R10.25).

## Implementation

Tensors and operators: `input_ids [B, T]` with modality positions holding a pad id, `inputs_embeds [B, T, d_model]` after the encoder's outputs are scattered into those positions ([§55.2](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch55-vision-language-models-and-document-intelligence/55-2-alignment-and-fusion.md)); `pixel_values` and grid tensors per model. Framework: *Hugging Face Transformers* (#26, Model definition / adaptation) owns schema generation (`get_json_schema`), template rendering with `tools`, processor expansion and `parse_response` for models with response parsing (R10.16, R10.17); *Hugging Face TRL* (#29, Post-training / RL) trains on tool-calling and vision datasets and warns against truncating image tokens (R10.20). Kernels: none specific; the encoder's kernels are Chapter 55's. Memory: modality spans occupy cache like text; encoder activations are transient. Communication: none. Deployment: *vLLM* (#41, Inference engine) implements the chat-API placeholder path, per-request media limits, embedding inputs and the tool-call parsers (R10.24, R10.25); *llama.cpp* (#45, Inference engine) exposes `parse_special` at the tokenize endpoint (R10.27), the switch that decides whether Eq. 10.17 holds on that path.

> **Implementation note [impl.vllm · developer-preview documentation, accessed 2026-09-20; release UNVERIFIED].** The tool-call parser is selected per model family by name (R10.24); a parser chosen for the wrong family silently fails to extract calls or extracts malformed arguments. The documentation's own caveat — extraction from raw text "may occasionally be malformed" — means the correctness of `tool_choice="auto"` is bounded by the parser's grammar, not by the model.

## Experimental design

### Experiment 10.5 — Control-token injection and modality-span alignment

- **Hypothesis.** With Eq. 10.17 enforced, no user or tool string in an adversarial corpus produces a control id, and the role structure recovered from the serialised ids equals the application's; with the invariant not enforced (special parsing on for data), a measurable fraction of adversarial strings alters the recovered role structure. Separately, for every media item the number of expanded positions equals the processor's declared count and no span is truncated.
- **Setup.** Two serialisation paths (guarded per Algorithm 10.11; unguarded via whole-string tokenisation with special parsing on) for three tokenizer families (SentencePiece control symbols; Hugging Face added tokens; tiktoken special tokens); an adversarial corpus of strings containing every control-token byte string of the target model, in isolation, embedded in prose, with Unicode look-alikes, with zero-width joiners inserted, and with partial matches; a media set of images at 8 resolutions and videos at 3 frame counts.
- **Independent variables.** Path; tokenizer family; adversarial class; resolution/frame count.
- **Controlled variables.** Artifact hash, template, engine version, `add_special_tokens` policy.
- **Dataset/workload.** ≥ 200 strings per class; ≥ 50 media items per setting.
- **Hardware.** CPU for serialisation; one accelerator for processor expansion if the encoder must run.
- **Metrics.** Control-id rate in data spans; role-structure recovery error rate (parse the ids back to a message list and compare); placeholder count mismatch rate; span truncation rate; positions per image as a function of resolution (to recover p and m of Eq. 10.18 empirically).
- **Baselines.** Guarded path on clean strings (must be 0 % control ids).
- **Expected result.** Guarded: 0 % control ids for all families; unguarded: > 0 % for added-token and special-token families, 0 % for true control symbols (they cannot be produced from text); look-alike and ZWJ classes produce 0 % control ids on both paths (they are not the reserved bytes) but may still alter parsed structure under plain-text role names — reported separately as a prompt-injection surface for [§51.6](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-6-tool-security.md). ASSUMED.
- **Ablation.** Convert the artifact to GGUF and re-run; a change in control-id rate isolates a token-type conversion defect ([§10.2](10-2-implementations-and-normalization.md)).
- **Interpretation.** A non-zero control-id rate on the guarded path is a tokenizer configuration defect and a release blocker; a placeholder mismatch is a template/processor revision mismatch.
- **Threats to validity.** Engines may strip or normalise control-token strings in the HTTP layer before tokenisation, masking the defect in the serialiser; test the tokenizer directly and the engine end-to-end.

## Observations

**What the paper claims.** OFFICIAL-DOCUMENTATION (R10.35): raw-string chat formats allow special-token injection "similar to SQL injections". OFFICIAL-DOCUMENTATION (R10.13): tiktoken raises on special-token text by default. OFFICIAL-DOCUMENTATION (R10.16): models request tool calls; the application executes them; arguments are dicts. OFFICIAL-DOCUMENTATION (R10.15, R10.17): templates emit one placeholder per media item; processors expand it. PAPER-REPORTED (R10.34): Qwen2-VL demarcates vision spans with dedicated tokens and produces a variable number of visual tokens per image. OFFICIAL-DOCUMENTATION (R10.24): vLLM's auto tool parsing extracts from raw text and can produce malformed arguments.

**What the evidence shows.** All of the above are documented behaviours; none is a measured rate. The injection mechanism is deterministic given the tokenizer configuration, so Experiment 10.5's guarded/unguarded contrast is a check of configuration, not a statistical claim. The frequency with which deployed systems tokenise untrusted data with special parsing enabled is UNVERIFIED and is the quantity that would make the failure mode an incident rather than a possibility.

**What we infer.** DERIVED: Eq. 10.17 is a property of the encode path chosen, and libraries differ in their defaults (tiktoken safe-by-default, Transformers permissive-by-default), so the same application code is safe with one artifact and unsafe with another unless it sets the policy explicitly. DERIVED: because modality spans have variable n at dynamic resolution, any context-budget computation ([§50.2](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch50-context-construction-and-retrieval-augmented-generation/50-2-context-budgeting.md)) must call the processor, not estimate from the placeholder count.

**What remains unknown.** NOT-DISCLOSED: the exact patch and merge geometry (p, m) and resizing policy of any model whose report does not state them. UNVERIFIED: whether engine tool-call parsers agree with the model's own training-time rendering for every family listed. Open question: whether control tokens should be reachable from text at all in any path (a tokenizer design choice), or whether escaping should be the universal mechanism; the SentencePiece control-symbol design answers "never reachable", and the Hugging Face added-token design answers "reachable unless split".

## Failure modes

> **Failure mode — control-token injection.** *Symptom:* a user message changes the effective system prompt or ends the assistant's turn early; logs show role headers inside data spans. *Cause:* untrusted text tokenised with special-token parsing enabled (Eq. 10.17 violated). *Detection:* control-id scan of data spans; Experiment 10.5. *Mitigation:* data path for all untrusted spans (`encode_ordinary`, `split_special_tokens=True`, `parse_special=false`); prefer true control symbols in the artifact; escape or reject reserved byte strings at the API boundary.

> **Failure mode — placeholder count mismatch.** *Symptom:* processor error, or silently shifted alignment between text and pixels; the model describes the wrong image. *Cause:* template emitted k placeholders for k′ ≠ k media items, or a template/processor revision mismatch. *Detection:* Algorithm 10.12 step 1. *Mitigation:* load template and processor from the same revision; assert counts before expansion.

> **Failure mode — truncated modality span.** *Symptom:* training error or degraded multimodal quality after length capping. *Cause:* token-level truncation through a span (R10.20). *Detection:* span table versus `max_length`. *Mitigation:* `max_length=None` for VLM training, or span-aware truncation.

> **Failure mode — tool-call parse failure.** *Symptom:* valid-looking model output not executed, or executed with wrong arguments. *Cause:* wrong `--tool-call-parser` family, or JSON-string arguments where a dict is expected (R10.16, R10.24). *Detection:* parse-success rate on a replay set. *Mitigation:* structured outputs for named calls ([§37.4](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-4-structured-generation.md)); schema validation before execution ([§51.4](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-4-execution-correctness.md)).

> **Failure mode — end-of-message versus end-of-turn confusion.** *Symptom:* the agent loop terminates when the model requested a tool, or waits for a tool when the model finished. *Cause:* a stop set that treats `<|eom_id|>`-style and `<|eot_id|>`-style tokens identically (R10.32). *Detection:* per-stop-token outcome logging. *Mitigation:* route on the specific stop id ([§37.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-2-sequence-termination.md), [§52.4](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch52-planning-control-flow-verification-and-recovery/52-4-adaptive-execution.md)).

## Siblings

**Text-only chat template ([§10.4](10-4-conversation-serialization.md))** — sibling at lower structure
Why it exists: role structure alone. What assumption changed (relative to this section): all content is text and all text is data. What objective changed: none. What problem it solved: turn boundaries. What new failure mode it introduced: none of the tool/modality failures above; injection exists already. Changed primitive: typed spans → text spans.

**Tool schemas in the template (JSON schema → model format)** — this file
Why it exists: the model was trained on a specific rendering of tool definitions (R10.15). What assumption changed: tools are structure, rendered by the template, not user text. What objective changed: none. What problem it solved: portability of tool definitions across models via a standard input API. What new failure mode it introduced: rendering mismatch with training; schema bloat in every request. Changed primitive: free-text tool description → schema-driven rendering.

**Structured/constrained tool-call decoding ([§37.4](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-4-structured-generation.md))** — owned elsewhere
Why it exists: raw-text extraction produces malformed calls (R10.24). What assumption changed: the decoder is constrained by a grammar derived from the schema. What objective changed: sampling restricted to valid strings. What problem it solved: parse failures. What new failure mode it introduced: grammar/tokenizer boundary mismatches (a grammar terminal that is not a token boundary). Changed primitive: parse after decode → constrain during decode.

**Protocol-level tool boundaries ([§51.3](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-3-protocol-boundaries.md), including the Model Context Protocol)** — owned elsewhere; forward pointer only
Why it exists: tools live in separate processes with their own trust boundaries. What assumption changed: the boundary is a network protocol, not a token type. What objective changed: none at the token level. What problem it solved: tool discovery and invocation across systems. What new failure mode it introduced: protocol-level injection and authorisation, developed in §51.3 and §51.6. Changed primitive: in-process schema → remote protocol.

**Modality placeholders and encoder-produced spans ([§55.2](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch55-vision-language-models-and-document-intelligence/55-2-alignment-and-fusion.md))** — this file for the serialisation; §55.2 for the fusion
Why it exists: pixels have no vocabulary. What assumption changed: some positions receive embeddings from an encoder, not from the embedding table. What objective changed: conditional generation with zero loss on the span ([§4.5](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-5-conditional-and-multimodal-learning.md)). What problem it solved: one sequence for all modalities. What new failure mode it introduced: variable and possibly large n per item; alignment fragility. Changed primitive: id → embedding injection.

## Extensions

Domain adaptation: adding a new tool format requires a template change and retraining on the new rendering; adding a modality requires new control tokens and placeholder ids, which is a vocabulary expansion event ([§10.6](10-6-migration-and-compatibility.md)). Long context: tool schemas and media spans dominate context budgets in agent workloads; the span table of Algorithm 10.12 is the unit that budgeting and eviction must operate on ([§50.2](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch50-context-construction-and-retrieval-augmented-generation/50-2-context-budgeting.md)). Agents: every tool result is an untrusted data span; the boundary invariant is the first line of defence and is necessary but not sufficient ([§51.6](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-6-tool-security.md)). Embodiment: action and observation streams are further modality spans with their own placeholders; Chapter 60. Proposals only.

## Limitations

The section states what the documentation of the named libraries and models says as of the access date; other engines' special-token handling is NOT-DISCLOSED here. Eq. 10.18 assumes patch-based encoders and does not describe resampler-based or query-token designs, for which n is a fixed hyperparameter of the resampler. The injection analysis covers reserved-byte forgery only; semantic injection through ordinary text is out of scope. Falsification: a guarded serialisation path (Algorithm 10.11) under which Experiment 10.5 still finds control ids in data spans would show that the artifact's control tokens are matchable from text — a property that no call-site policy can fix and that requires re-issuing the tokenizer. Decision consequence: choose artifacts whose control tokens are unreachable from text, and make the data-path policy explicit in every serialiser.

## Reproducibility

Sources opened 2026-09-20: R10.13 (tiktoken `core.py`), R10.15–R10.18 (Transformers v5.17.0 documentation), R10.20 (TRL v1.13.0), R10.24, R10.25 (vLLM developer-preview docs), R10.27 (llama.cpp server README), R10.29 (GGUF spec), R10.32 (Meta Llama 3.1 prompt-format page), R10.34 (arXiv PDF), R10.35 (ChatML document, openai-python release-v0.28.1), R10.43 (Mistral tokenization guide), R10.47 (Transformers Qwen2-Audio model doc, v5.17.0). Metric definitions: control-id rate and role-structure recovery as in Experiment 10.5. Unresolved: patch/merge geometry per model (NOT-DISCLOSED unless reported).

## References

R10.5 · R10.13 · R10.15 · R10.16 · R10.17 · R10.18 · R10.20 · R10.24 · R10.25 · R10.27 · R10.29 · R10.32 · R10.34 · R10.35 · R10.43 · R10.47 · [notation.md](../../../front-matter/notation.md) · [references.md](references.md)
