---
id: ms.section.10.4
entity_type: section
title: Conversation serialization
short_title: Roles, templates, masks
volume: 1
part: 2
chapter: 10
section: 10.4
slug: 10-4-conversation-serialization
parent: ms.chapter.10
prev_sibling: ms.section.10.3
next_sibling: ms.section.10.5
children: []
prerequisites: [ms.section.4.1, ms.section.5.5, ms.section.10.2]
downstream: [ms.section.10.5, ms.section.10.6, ms.section.11.2, ms.section.12.4, ms.section.31.1, ms.section.31.3, ms.section.37.2, ms.section.43.1, ms.section.46.6]
related: [ms.section.42.1]
siblings_by_mechanism: []
relations:
  - {type: implemented_by, target: impl.hugging-face-transformers}
  - {type: implemented_by, target: impl.hugging-face-trl}
  - {type: implemented_by, target: impl.vllm}
  - {type: consumes, target: concept.loss-mask}
axes:
  lifecycle: [post_training, inference, serving]
  mechanism: [serialization, chat_template, loss_masking]
  feedback_setting: []
  modality: [text]
papers: []
implementations: [impl.hugging-face-transformers, impl.hugging-face-trl, impl.vllm, impl.sglang, impl.llama-cpp]
benchmarks: []
datasets: []
status:
  maturity: established
  disputed: false
evidence_summary:
  labels_used: [OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, UNVERIFIED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 2100
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 10.4 Conversation serialization

## Scope

Objective: define the map from a structured conversation — a list of role-tagged messages — to the single token sequence a causal model consumes, and state the three contracts that map must satisfy: the generation prefix that starts an assistant turn, the assistant-only loss mask that selects which positions are trained, and end-of-turn handling that stops generation. Baseline: prompts assembled by string concatenation with hand-written role markers, which is what every format below replaced. Success criterion: the reader can write a chat template that renders training and serving sequences consistently, can derive the assistant mask from it, and can state the prefix-consistency condition (Eq. 10.15) that the compatibility suite tests. Boundaries: the SFT objective and its normalisation ([§31.1](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/31-1-sft-objectives.md)); conversation semantics as a data question ([§31.3](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/31-3-conversation-semantics.md)); the loss mask as a symbol ([§4.1](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md)); sequence termination at decode ([§37.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-2-sequence-termination.md)); tools and multimodal spans ([§10.5](10-5-tool-and-multimodal-interfaces.md)).

## Why this exists

What failed before was the assumption that a chat is anything other than a token sequence. OFFICIAL-DOCUMENTATION (R10.14): "All causal LMs, whether chat-trained or not, continue a sequence of tokens … The list of `role` and `content` dictionaries that you pass to a chat model get converted to a token sequence, often with control tokens like `<|user|>` or `<|assistant|>` or `<|end_of_message|>`." The bottleneck was the proliferation of formats: "different models may use different formats or control tokens, even if they were fine-tuned from the same base model", and "with the wrong control tokens, these models would have drastically worse performance." The dominant constraint is that the serialisation is fixed at fine-tuning time and must be reproduced exactly by every consumer afterwards — the trainer, the evaluation harness and the serving engine — or the model is being asked to continue a sequence it never saw. What changed in the solution is that the format became data shipped with the model: "Chat models come with chat templates, which indicate how they expect chats to be formatted" (R10.14), stored as a Jinja program in the tokenizer artifact and executed identically by all consumers. This section treats the template as part of the model artifact, with the same versioning obligations as the weights.

## Intuition

Physically, the model sees one integer sequence and predicts the next integer; nothing in the architecture knows what a "turn" is. Roles and boundaries exist only as tokens the model was trained to associate with a change of speaker, and the generation prefix is the sequence of tokens after which the fine-tuning data always contained an assistant message — so the model's conditional distribution after that prefix is "what an assistant says next". Remove the prefix and the model is conditioned on a sequence that, in its training data, was followed by more user text: OFFICIAL-DOCUMENTATION (R10.14): "if you don't include these tokens, the model may get confused and do something strange, like continuing the user's message instead of replying to it!" The assistant mask is the same fact seen from training: positions inside user turns are context, not targets, and giving them loss teaches the model to write user turns. Heuristically, the template is the contract that turns a chat into a language-modelling problem, and both sides of the contract are token positions. DERIVED from the autoregressive factorisation of [§4.1](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md).

## Formulation

Let a conversation be `c = (r_1, m_1), …, (r_k, m_k)` with roles `r_i ∈ {system, user, assistant, tool}` and contents `m_i`. Let `τ` be a template and `𝒯` a tokenizer.

> **Definition — chat template.** A deterministic program τ, shipped with the tokenizer, that maps a conversation (and optional tools and documents) to a string, which the tokenizer then maps to ids; in Hugging Face Transformers it is "a Jinja template stored in the tokenizer's `chat_template` attribute" (OFFICIAL-DOCUMENTATION, R10.15) and is saved "in the `chat_template.jinja` file in the tokenizer directory".

> **Definition — generation prefix.** The tokens τ appends after the last message to mark that an assistant turn begins, emitted when the template is rendered with `add_generation_prompt=True`; for a ChatML-style template it is `<|im_start|>assistant\n` (OFFICIAL-DOCUMENTATION, R10.14: "`<|im_start|>assistant` is added at the end to indicate the start of an assistant message").

> **Definition — assistant-only loss mask (serialization contract).** The binary mask over the serialised sequence that is 1 exactly on the token positions rendered from assistant-message content (and the end-of-turn token that closes it) and 0 on system, user, tool and template-structure positions; it is the instantiation of the loss mask m_t of [§4.1](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md) produced by the template, not by the trainer. In Transformers it is produced by `return_assistant_tokens_mask=True`, which "is only available for chat templates that support it via the `{% generation %}` keyword" (OFFICIAL-DOCUMENTATION, R10.18).

$$
\sigma(c;\, \tau, \mathcal{T}, g) \;=\; \mathcal{T}\big(\tau(c,\, \text{add\_generation\_prompt}=g)\big) \in \{0,\dots,V-1\}^{T}
$$
*(Eq. 10.13)* where g ∈ {0, 1} selects the generation prefix; training uses g = 0 (OFFICIAL-DOCUMENTATION, R10.14: "Set `add_generation_prompt=False` because the additional tokens to prompt an assistant response aren't helpful during training"), serving uses g = 1.

$$
m_t \;=\; \mathbb{1}\big[\,t \in \textstyle\bigcup_{i:\, r_i = \text{assistant}} \text{span}_i\,\big]
$$
*(Eq. 10.14)* where span_i = the token positions rendered between `{% generation %}` and `{% endgeneration %}` for message i; with shifted targets ([§5.5](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/05-5-training-and-generation.md)) the mask applies to the target position. The token-mean loss over this mask is Eq. N.2.

$$
\sigma(c_{1:k};\, g{=}1) \;=\; \sigma(c_{1:k+1};\, g{=}0)\big[\,1 : |\sigma(c_{1:k};\, g{=}1)|\,\big] \quad \text{whenever } r_{k+1} = \text{assistant}
$$
*(Eq. 10.15)* — **prefix consistency**: the serving prompt for k turns with the generation prefix must be an exact prefix of the training serialisation of the same conversation extended by the assistant's reply. MATHEMATICALLY-DERIVED as the condition under which the serving-time conditional distribution equals the training-time one at the first generated position; it is the central claim tested by [verification.md](verification.md). It fails whenever the generation prefix differs from what the template emits before an assistant message, whenever the tokenizer adds `<bos>` on one path but not the other, or whenever whitespace differs.

> **Assumption.** Both paths use the same tokenizer artifact and the same `add_special_tokens` policy · *sensitivity:* OFFICIAL-DOCUMENTATION (R10.14): "Chat templates should already include all the necessary special tokens, and adding additional special tokens is often incorrect or duplicated … make sure you set `add_special_tokens=False` if you tokenize later." A doubled `<bos>` breaks Eq. 10.15 at position 1.

## Mechanism

**Roles and turn boundaries.** The common roles are "`user` for messages from the user, `assistant` for messages from the model, `system` for directives on how the model should act" (R10.14), plus `tool` for tool results (R10.15; [§10.5](10-5-tool-and-multimodal-interfaces.md)). A turn boundary is rendered as tokens; the format is model-specific and is stated only by the model's own documentation. Three published formats illustrate the space without ranking them. ChatML: OFFICIAL-DOCUMENTATION (R10.35): "ChatML documents consist of a sequence of messages. Each message contains a header (which today consists of who said it, but in the future will contain other metadata) and contents", delimited by `<|im_start|>` and `<|im_end|>`; Qwen's documentation states the same structure, `<|im_start|>{{role}}\n{{content}}<|im_end|>`, with `<|im_start|>` "prepended to each turn", `<|im_end|>` "appended to each turn" and `<|endoftext|>` reserved for "end of document, which are inserted between documents" (OFFICIAL-DOCUMENTATION, R10.33). Llama 3.1: OFFICIAL-DOCUMENTATION (R10.32): `<|begin_of_text|>` "Specifies the start of the prompt"; `<|start_header_id|>` and `<|end_header_id|>` "enclose the role for a particular message"; `<|eot_id|>` is "End of turn. Represents when the model has determined that it has finished interacting with the user message"; `<|eom_id|>` is "End of message. A message represents a possible stopping point for execution where the model can inform the executor that a tool call needs to be made"; `<|end_of_text|>` is "generated only by the base models"; and the supported roles are "system, user, assistant and ipython". Mistral: OFFICIAL-DOCUMENTATION (R10.43): `[INST]` and `[/INST]` delimit instructions, with `[TOOL_CALLS]`, `[AVAILABLE_TOOLS]`, `[TOOL_RESULTS]` as further control tokens, across tokenizer versions v1–v3 (SentencePiece-based) and "V3-Tekken: Different version based on `tiktoken`". The Transformers documentation's paired example (R10.14) shows the consequence for the same three-message chat: Mistral-7B-Instruct renders `<s>[INST] Hello, how are you? [/INST]I'm doing great. How can I help you today?</s> [INST] …`, Zephyr renders `<|user|>\nHello, how are you?</s>\n<|assistant|>\n…` — different boundary tokens, different placement of `</s>`, different whitespace. Cost: each boundary is 1–4 tokens per message; a k-turn conversation carries O(k) structural tokens that are context bytes in the cache (Eq. N.8 per token) and prefill FLOPs, but never targets.

**The template as program.** OFFICIAL-DOCUMENTATION (R10.15) gives the minimal ChatML-style template:

```jinja
{%- for message in messages %}
    {{- '<|' + message['role'] + '|>\n' }}
    {{- message['content'] + eos_token }}
{%- endfor %}
{%- if add_generation_prompt %}
    {{- '<|assistant|>\n' }}
{%- endif %}
```

Three properties of the program matter for correctness. Whitespace: "Jinja prints any whitespace before or after a block of text … adding extra whitespace that was not present during model training can harm performance", hence the `{%-`/`-%}` trimming (R10.15). Variables: "The only constants in a template are the `messages` variable and the `add_generation_prompt` boolean"; `tools`, `documents`, `bos_token`, `eos_token` and the callables `raise_exception` and `strftime_now` are also available (R10.15) — the last one makes a template's output time-dependent, which breaks byte-level reproducibility of a serialisation unless the date is pinned. Portability: a template may be "used in a non-Python implementation, for example, when deploying with Javascript or Rust", so the documentation instructs authors to "Replace Python methods with Jinja filters" and to use `tojson` so that "string entries may [not] change from single-quote to double-quote" across engines (R10.15). Storage: `chat_template.jinja` is the recommended form; the `chat_template` field of `tokenizer_config.json` and `chat_template.json` are "load-only legacy format[s]"; multiple named templates live in `additional_chat_templates/<name>.jinja`, and "`apply_chat_template()` picks the `tool_use` entry when tools are passed, and `default` otherwise" (R10.15). Cost: rendering is O(total content) string work per request, executed in the serving frontend on every chat request — a CPU term on the TTFT path ([§42.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-1-phase-decomposition.md)).

**Generation prefixes and prefill continuation.** `add_generation_prompt=True` appends the prefix; "Not all models require generation prompts, and some models, like Llama, don't have any special tokens before the assistant response. In these cases, `add_generation_prompt` has no effect" (R10.14). `continue_final_message` is the dual: it "removes end of sequence tokens so that the model continues generation from the final message", useful "for 'prefilling' a model response"; "You shouldn't use `add_generation_prompt` and `continue_final_message` together … Using them together returns an error" (R10.14). The pipeline default resolves the ambiguity by role: `TextGenerationPipeline` "sets `add_generation_prompt` to `True` by default … if the final message in the chat has the `assistant` role, it assumes the message is a prefill and switches to `continue_final_message=True`" (R10.14). For reasoning models the documentation adds that a named field can be continued instead of `content`: "Prefilling `content` closes the reasoning block before generation starts … Prefilling the reasoning field directly leaves the block open" (R10.14) — the template, not the model, decides which text is "reasoning" and which is "content". Cost: prefix tokens are prompt tokens; a prefill continuation saves the end-of-turn token and re-uses the cached prefix.

**Assistant-only loss.** The template marks assistant spans with `{% generation %}` … `{% endgeneration %}`; `apply_chat_template(..., return_assistant_tokens_mask=True)` returns a mask that "will contain 1" for assistant tokens and "0" for user and system tokens (R10.18). TRL consumes it: OFFICIAL-DOCUMENTATION (R10.20, v1.13.0): `assistant_only_loss=True` "ensures that loss is computed only on the assistant responses, ignoring user or system messages", "requires the chat template to include `{% generation %}` and `{% endgeneration %}` keywords", and "For known model families (e.g. Qwen3), TRL automatically patches the template". The mask is applied by setting labels to the ignore index: "Padding tokens (if present) are ignored in the loss computation by applying an ignore index (default: `-100`)" (R10.20), and pre-tokenised datasets may carry `assistant_masks` or `completion_mask` columns that are "folded in then dropped". The trainer's loss is the token-level cross-entropy with "a one-token shift" (R10.20), i.e. Eq. N.2 with m_t from Eq. 10.14 — the objective itself is [§31.1](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/31-1-sft-objectives.md)'s. Cost: the mask is T bits per sequence; with chunked NLL the head matmul "skips ignored-label tokens" (R10.20), so masked positions also save head FLOPs proportional to the masked fraction.

**End-of-turn handling.** The end-of-turn token is part of the assistant span and must be a target: it is the only way the model learns to stop. Two distinct tokens are often involved — the tokenizer's `eos_token` and the template's end-of-turn marker — and they must agree: OFFICIAL-DOCUMENTATION (R10.20): "it is necessary to align the EOS token with the chat template to ensure the model's responses terminate correctly … for `Qwen/Qwen2.5-1.5B`, one should set `eos_token="<|im_end|>"`." Llama 3.1's split into `<|eot_id|>` (turn finished) and `<|eom_id|>` (message finished, tool call expected) means the stop set at decode has two members with different control-flow consequences (R10.32; [§37.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-2-sequence-termination.md) owns the stop-set mechanics). Qwen's `<|endoftext|>` is a document boundary, not a turn boundary (R10.33); a serving stop set built from `eos_token` alone will run past `<|im_end|>` unless the template's marker is included. Cost: a missing end-of-turn target manifests as run-on generation to the length limit — wasted decode steps at TPOT each, and a cache that grows to the cap.

**Engines execute the same template.** OFFICIAL-DOCUMENTATION (R10.23, vLLM developer-preview docs dated 2026-09-16): for the chat protocol "vLLM requires the model to include a chat template in its tokenizer configuration", otherwise "the server will not be able to process chat and all chat requests will error"; `--chat-template` takes "the file path to the chat template, or the template in string form"; content may be "string" or "openai" (a list of typed parts), auto-detected and overridable with `--chat-template-content-format`. OFFICIAL-DOCUMENTATION (R10.26): SGLang's server uses "the chat template specified in the model tokenizer from Hugging Face" by default, overridable by `--chat-template` with a built-in name or a file in JSON or Jinja format. OFFICIAL-DOCUMENTATION (R10.27): llama.cpp's server has `--jinja` ("whether to use jinja template engine for chat (default: enabled)"), `--chat-template` ("set custom jinja chat template (default: template taken from model's metadata)"), `--chat-template-file`, and states that "only models with a supported chat template can be used optimally with this endpoint", with ChatML as the fallback. The GGUF key `tokenizer.chat_template` carries "a Jinja template that specifies the input format expected by the model" (R10.29). Each engine therefore has two sources of truth — the artifact's template and a CLI override — and the override is where [§10.6](10-6-migration-and-compatibility.md)'s drift enters.

## Algorithm

```text
Algorithm 10.9 — Conversation serialization with assistant mask
INPUT   conversation c = [(r_i, m_i)]; template τ with generation markers; tokenizer 𝒯; flag g (generation prefix)
OUTPUT  ids : int[T]; mask : {0,1}[T]; turn_offsets : list[(start, end, role)]
STATE   rendered string s; span list from τ's generation markers
INVARIANT no special token is added by 𝒯 outside τ (add_special_tokens = False on the rendered string)
1.  (s, spans) ← render τ(c, add_generation_prompt = g) recording the character ranges emitted inside
        {% generation %} … {% endgeneration %}
2.  ids, offsets ← 𝒯.encode(s, add_special_tokens = False, return_offsets = True, parse_special = template-emitted only)  # §10.5
3.  mask[t] ← 1 if offsets[t] ⊆ some span in spans else 0                       # Eq. 10.14
4.  assert the end-of-turn token closing each assistant span has mask 1
5.  if g = 1: assert mask is 0 on the generation prefix (it is context, not target)
6.  turn_offsets ← token ranges per message from offsets
7.  return ids, mask, turn_offsets
TERMINATION: one render, one encode.
```

Complexity: O(|s|) rendering and encoding; mask construction O(T). Implementation: `apply_chat_template(tokenize=True, return_dict=True, return_assistant_tokens_mask=True)` in Transformers v5.17.0 (R10.18); TRL's `assistant_only_loss` path (R10.20).

```text
Algorithm 10.10 — Prefix-consistency check (Eq. 10.15)
INPUT   conversation c_{1:k+1} with r_{k+1} = assistant; training serialiser σ_train (g = 0); serving serialiser σ_serve (g = 1)
OUTPUT  verdict ∈ {consistent, divergent at position p}
1.  a ← σ_serve(c_{1:k}); b ← σ_train(c_{1:k+1})
2.  p ← first index where a[p] ≠ b[p], or |a| if none within |a|
3.  if p = |a| and |a| ≤ |b|: return consistent
4.  return (divergent at p, decode(a[p−3:p+3]), decode(b[p−3:p+3]))
```

Complexity O(T). Implementation: the `template_parity` family of [verification.md](verification.md), run with σ_serve taken from each engine's `/tokenize` or `/apply-template` endpoint (R10.27) and σ_train from the trainer's collator.

## Implementation

Tensors and operators: `input_ids [B, T]`, `attention_mask [B, T]`, `labels [B, T]` with −100 at masked positions (R10.20); with packing ([§12.4](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-4-packing-and-masks.md)) the per-sequence masks concatenate and the collator must not let an end-of-turn token of one conversation become context for the next without a document boundary. Framework: *Hugging Face Transformers* (#26, Model definition / adaptation) owns `apply_chat_template`, template storage and loading precedence (R10.14, R10.15, R10.18); *Hugging Face TRL* (#29, Post-training / RL) consumes conversational datasets and produces the masked labels (R10.20). Kernels: chunked or fused cross-entropy skips masked positions (R10.20; [§10.3](10-3-vocabulary-economics.md)). Memory: the mask is negligible; masked positions still occupy activations and cache. Communication: none. Deployment: *vLLM* (#41), *SGLang* (#42), *llama.cpp* (#45) (all Inference engine layer) render the template in their frontends (R10.23, R10.26, R10.27); *SGLang* additionally caches the rendered prefix across requests ([§43.3](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch43-runtime-architecture-and-inference-engine-selection/43-3-sglang.md)), so a template whose rendering is not a prefix-stable function of the conversation (e.g. one that inserts `strftime_now`) defeats prefix caching.

> **Implementation note [impl.hugging-face-transformers · v5.17.0 documentation, accessed 2026-09-20].** Loading precedence is fixed: `chat_template.jinja` at the repository root "take[s] priority over templates embedded in the config"; then `additional_chat_templates/*.jinja` are merged; the legacy `chat_template` field is read first and overridden (R10.15). A repository that carries both a legacy field and a `.jinja` file therefore serves the `.jinja`; a downstream converter that reads only the legacy field ships a different template. Whether a given converter release reads the `.jinja` is NOT-DISCLOSED here.

## Experimental design

### Experiment 10.4 — Training-versus-serving serialisation parity

- **Hypothesis.** For a fixed tokenizer artifact and template, the ids produced by the training collator for a k+1-turn conversation begin with exactly the ids the serving engine produces for the k-turn prompt with the generation prefix (Eq. 10.15), for every engine tested and for every conversation in a stress set.
- **Setup.** One instruction-tuned checkpoint with a `chat_template.jinja` that contains generation markers; serialisers: Transformers `apply_chat_template`, TRL's SFT collator (as σ_train), and the `/tokenize`-with-template or `/apply-template` paths of vLLM, SGLang and llama.cpp (as σ_serve); Algorithm 10.10 on each pair.
- **Independent variables.** Engine; conversation class (system present/absent; 1, 2, 8 turns; empty assistant turn; assistant prefill; tool turns per [§10.5](10-5-tool-and-multimodal-interfaces.md); content containing template-marker strings; content with leading/trailing whitespace and newlines; non-Latin content; content longer than the model's context).
- **Controlled variables.** Artifact hash; `add_special_tokens=False` on the rendered string; no CLI template override; identical library versions across processes.
- **Dataset/workload.** ≥ 500 conversations per class, synthesised from the adversarial strings of Experiment 10.2 embedded as message contents.
- **Hardware.** CPU for serialisation; engines may run with a small model or in a tokenizer-only mode.
- **Metrics.** Fraction consistent per (engine, class); position and decoded context of the first divergence; count of doubled `<bos>`; count of assistant spans whose end-of-turn token is unmasked.
- **Baselines.** Transformers versus itself in two processes (floor); Transformers versus TRL (the training-side pair).
- **Expected result.** 100 % consistency within Transformers and TRL; engine divergences, if any, concentrated in whitespace-trimming, `<bos>` handling and content-format ("string" versus "openai") classes. ASSUMED.
- **Ablation.** Enable a CLI `--chat-template` override that differs from the artifact's by one trailing newline; the suite must report divergence at the prefix end.
- **Interpretation.** Any divergence is a train/serve template drift ([§10.6](10-6-migration-and-compatibility.md)) and a release blocker; a divergence only in the assistant span's end-of-turn mask is a training defect that shows as run-on generation.
- **Threats to validity.** Engines may add `<bos>` by default outside the template; the test must pin `add_special_tokens`. Reasoning-field templates render differently depending on whether a `reasoning_content` field is present; classes must cover both.

## Observations

**What the paper claims.** OFFICIAL-DOCUMENTATION (R10.14): chat templates remove the need to "memorize every possible chat format"; wrong control tokens give "drastically worse performance"; `add_generation_prompt` is needed or the model "may … continue the user's message". OFFICIAL-DOCUMENTATION (R10.20): assistant-only loss requires generation markers; EOS must be aligned with the template. OFFICIAL-DOCUMENTATION (R10.32): Llama 3.1 distinguishes `<|eot_id|>` and `<|eom_id|>`. OFFICIAL-DOCUMENTATION (R10.23, R10.26, R10.27): engines default to the artifact's template and permit overrides.

**What the evidence shows.** The claims are statements of documented behaviour, not measurements; "drastically worse performance" under a wrong template is asserted without a number in R10.14 and is UNVERIFIED as a magnitude. The prefix-consistency condition is a derivation and holds by construction when both sides run the same template on the same tokenizer; the evidence question is whether deployed pipelines do so, which only Experiment 10.4 answers.

**What we infer.** DERIVED: because the end-of-turn token is the only stop signal a chat model learns, its membership in the assistant mask and in the decode stop set are two halves of one contract; either half missing produces a visible failure (run-on or truncation). DERIVED: templates that call `strftime_now` are not pure functions of the conversation and cannot be prefix-cached across days or byte-compared across runs without pinning the clock.

**What remains unknown.** NOT-DISCLOSED: the exact serialisation used to fine-tune any closed model, including whitespace; the template shipped with an open checkpoint is the best available proxy and may post-date the training run. UNVERIFIED: whether engine-side Jinja implementations (minijinja, JavaScript) match Python Jinja on every template construct used by shipped templates. Open question: whether structural tokens should carry loss (some recipes train the role header tokens); [§31.3](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/31-3-conversation-semantics.md) takes this up.

## Failure modes

> **Failure mode — missing generation prefix.** *Symptom:* the model continues the user's message or emits a role header itself. *Cause:* `add_generation_prompt=False` at serving, or a template whose prefix differs from its pre-assistant rendering. *Detection:* Algorithm 10.10 divergence at the prompt end. *Mitigation:* render with g = 1; assert Eq. 10.15 in the release gate.

> **Failure mode — doubled or missing `<bos>`.** *Symptom:* divergence at position 0 or 1 between training and serving ids; degraded quality on the first turn. *Cause:* `add_special_tokens` applied to an already-templated string (R10.14). *Detection:* compare the first two ids across paths. *Mitigation:* `add_special_tokens=False` after templating; let the template own `bos_token`.

> **Failure mode — unmasked end-of-turn or misaligned EOS.** *Symptom:* run-on generation to the length cap; stop token never sampled. *Cause:* end-of-turn token outside `{% generation %}`, or `eos_token` ≠ the template's turn marker (R10.20). *Detection:* mask audit in Algorithm 10.9 step 4; stop-set audit. *Mitigation:* include the marker in the assistant span; set `eos_token` to it; include both `<|eot_id|>`-style and `<|eom_id|>`-style tokens in the stop set where the model defines both (R10.32).

> **Failure mode — whitespace drift across Jinja engines.** *Symptom:* one-token divergence at turn boundaries only on a specific engine. *Cause:* untrimmed `{% %}` blocks or Python-only methods in the template (R10.15). *Detection:* Experiment 10.4 by engine. *Mitigation:* `{%-`/`-%}` throughout; Jinja filters instead of Python methods; `tojson` for dicts.

> **Failure mode — loss on user turns.** *Symptom:* the model learns to produce user-like text and questions; evaluation shows role confusion. *Cause:* full-sequence loss on conversational data (`assistant_only_loss=False`). *Detection:* inspect labels for non-−100 values inside user spans. *Mitigation:* Eq. 10.14 via generation markers; audit the mask fraction per role.

## Siblings

**Raw-string prompt assembly** — this file (baseline)
Why it exists: the pre-template practice of concatenating role strings. What assumption changed (relative to templates): the format is application code, not model data. What objective changed: none. What problem it solved: none; it is the reference. What new failure mode it introduced: every consumer re-implements the format; injection through special-token syntax (R10.35: the raw format "inherently allows injections from user input containing special-token syntax, similar to SQL injections"). Changed primitive: shipped program → ad hoc strings.

**Chat template (Jinja program in the artifact)** — this file
Why it exists: one executable format per model, portable across engines (R10.14, R10.15). What assumption changed: the format is part of the model artifact. What objective changed: none. What problem it solved: train/serve consistency by construction. What new failure mode it introduced: engine-side template overrides and Jinja-implementation differences ([§10.6](10-6-migration-and-compatibility.md)). Changed primitive: strings → program.

**Prompt-completion (single-turn) serialisation** — this file; TRL `completion_only_loss` (R10.20)
Why it exists: instruction data without roles. What assumption changed: one prompt, one completion, no boundaries. What objective changed: loss on the completion only. What problem it solved: simpler data. What new failure mode it introduced: no turn structure, so no multi-turn behaviour is learned. Changed primitive: role spans → prompt/completion split.

**Conversation semantics as data ([§31.3](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/31-3-conversation-semantics.md))** — owned elsewhere
Why it exists: what the turns should contain. What assumption changed: the serialisation is fixed; the content varies. What objective changed: behaviour targets. What problem it solved: behaviour acquisition. What new failure mode it introduced: none at the serialisation level. Changed primitive: format → content.

## Extensions

Domain adaptation: a domain assistant may need a system-role convention the base template lacks; adding one is a template change and therefore a retraining-and-parity event. Long context: turn-boundary tokens are cheap, but a k-turn history is re-serialised and re-prefilled on every request unless the engine caches the prefix, which requires prefix-stable rendering ([§43.3](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch43-runtime-architecture-and-inference-engine-selection/43-3-sglang.md)). Multimodality and tools: the same template renders placeholders and tool-call blocks ([§10.5](10-5-tool-and-multimodal-interfaces.md)). Agents: trajectories with tool turns interleave three masks (assistant text, tool-call text, tool-result context); [§11.5](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-5-interactive-collection.md) and [§31.3](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/31-3-conversation-semantics.md) decide which get loss. Proposals only.

## Limitations

The formats quoted are those their vendors document; nothing is asserted about undocumented internal variants. Eq. 10.15 is a necessary condition for train/serve equivalence at the first generated token; it does not guarantee that later turns were serialised the same way in training. The section does not evaluate template quality, only consistency. Falsification: a deployment for which Algorithm 10.10 reports consistency on every class while generation quality differs measurably from the training harness would indicate a cause outside serialisation (sampling, precision, kernels — Chapters 37, 40, 43). Decision consequence: treat the template as a versioned artifact with a hash, and gate releases on Experiment 10.4.

## Reproducibility

Sources opened 2026-09-20: R10.14, R10.15, R10.17, R10.18 (Transformers v5.17.0 documentation as displayed), R10.20 (TRL v1.13.0), R10.23 (vLLM developer-preview docs dated 2026-09-16), R10.26 (SGLang docs, version not shown), R10.27 (llama.cpp server README on `master`, commit not recorded), R10.29 (GGUF spec), R10.32 (Meta Llama 3.1 prompt-format page), R10.33 (Qwen documentation, Qwen3 edition), R10.35 (ChatML document in the openai-python repository, release-v0.28.1 tag), R10.43 (Mistral tokenization guide). Engine release numbers are UNVERIFIED unless stated. Metric definitions: consistency per Algorithm 10.10.

## References

R10.14 · R10.15 · R10.18 · R10.20 · R10.23 · R10.26 · R10.27 · R10.29 · R10.32 · R10.33 · R10.35 · R10.43 · [notation.md](../../../front-matter/notation.md) · [references.md](references.md)
