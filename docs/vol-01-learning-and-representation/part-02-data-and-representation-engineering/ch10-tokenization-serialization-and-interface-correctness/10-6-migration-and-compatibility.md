---
id: ms.section.10.6
entity_type: section
title: Migration and compatibility
short_title: Expansion, retokenization, drift
volume: 1
part: 2
chapter: 10
section: 10.6
slug: 10-6-migration-and-compatibility
parent: ms.chapter.10
prev_sibling: ms.section.10.5
next_sibling: ms.verification.10
children: []
prerequisites: [ms.section.10.1, ms.section.10.2, ms.section.10.3, ms.section.10.4, ms.section.10.5]
downstream: [ms.section.12.5, ms.section.13.5, ms.section.22.1, ms.section.22.2, ms.section.40.5, ms.section.43.1, ms.section.43.5, ms.section.47.3, ms.section.66.2]
related: [ms.section.24.1]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.R10.36}
  - {type: supported_by, target: paper.R10.37}
  - {type: implemented_by, target: impl.hugging-face-transformers}
  - {type: implemented_by, target: impl.vllm}
  - {type: implemented_by, target: impl.sglang}
  - {type: implemented_by, target: impl.llama-cpp}
axes:
  lifecycle: [continued_training, adaptation, serving, assurance]
  mechanism: [vocabulary_expansion, embedding_initialization, retokenization, artifact_coupling]
  feedback_setting: []
  modality: [text]
papers: []
implementations: [impl.hugging-face-transformers, impl.vllm, impl.sglang, impl.llama-cpp]
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, UNVERIFIED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 2100
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 10.6 Migration and compatibility

## Scope

Objective: treat the tokenizer and template as versioned components of the model artifact and specify the four operations that change them after pretraining — vocabulary expansion with embedding initialisation, retokenization of stored data, checkpoint–tokenizer coupling, and the train/serve template drift that arises when different engines render the same conversation — each with its cost and its failure signature. Baseline: a checkpoint whose tokenizer and template are implicit (whatever the library loaded), which is the state in which drift goes undetected. Success criterion: the reader can expand a vocabulary without destroying the model's next-token distribution, can decide when retokenization is possible losslessly, can write the coupling manifest that pins weights, tokenizer and template together, and can enumerate where drift enters in vLLM, SGLang and llama.cpp. Boundaries: continued pretraining as a training stage ([§22.1](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-1-stage-definitions.md), [§22.2](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-2-distribution-transitions.md)); artifact formats and quantised checkpoints ([§40.5](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch40-quantization-from-numerical-model-to-deployable-artifact/40-5-artifact-runtime-interfaces.md)); release control and canaries ([§47.3](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch47-observability-deployment-changes-and-incident-recovery/47-3-release-control.md)); resume semantics of data pipelines ([§12.5](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-5-resume-semantics.md)).

## Why this exists

What failed before was the assumption that a tokenizer is immutable and a template is a detail. Both are changed routinely: PAPER-REPORTED (R10.40): Chinese LLaMA extends "LLaMA's existing vocabulary with an additional 20,000 Chinese tokens, thereby improving its encoding efficiency" before "secondary pre-training using Chinese data"; PAPER-REPORTED (R10.31): Llama 3 adds "28K additional tokens to better support non-English languages". The bottleneck at expansion time is the head: a new row initialised at random sits in the same softmax as rows trained for trillions of tokens, and the model's distribution over old tokens changes before a single gradient step. PAPER-REPORTED (R10.36): with the default "small-norm random noise" initialisation, "the model *only* generated new tokens" in the reported case. The bottleneck at serving time is duplication: the same template exists in the Hugging Face artifact, in a GGUF file, in an engine's built-in list and in a CLI override, and each is a place for the sequences to diverge. The dominant constraint is that a checkpoint is only defined together with the exact byte string → id map and the exact conversation → id map used to train it; any component that re-derives either map is a candidate for drift. What changed is the discipline: pinned artifacts with hashes, initialisation rules with a bound, and a parity gate (Eq. 10.15) run across every serving path before release.

## Intuition

Physically, an embedding row and a head row are coordinates in the model's geometry; a new token with no history has no place in that geometry, and wherever it is put it competes in every softmax with every old token. Placing it at the centre of the existing rows makes it a plausible-but-uncommitted token whose logit is the average logit, which bounds how much probability it can steal. Placing it at the origin makes its logit zero — and if trained logits are large and negative, zero is the largest logit in the row, and the new token wins every position. Heuristically, initialise a stranger where the crowd is, not where the coordinates are zero. For drift, the physical picture is simpler: two processes that produce different integer sequences for the same conversation are conditioning the model on different pasts; the model has no way to know, and the symptom is a quality difference that no weight comparison can find. DERIVED from R10.36 and Eq. 10.15.

## Formulation

> **Definition — vocabulary expansion.** Adding k new entries to a trained model's tokenizer (new merges or pieces, new control tokens) and correspondingly k new rows to the embedding matrix `E ∈ ℝ^{V×d}` and, if untied, the head `U ∈ ℝ^{V×d}`, without altering the ids of the existing V entries.

> **Definition — retokenization.** Re-encoding a corpus under a tokenizer different from the one under which it was stored or previously trained; lossless only when the stored form permits exact recovery of the original bytes (Eq. 10.5 with identity normalisation, or the original bytes retained).

> **Definition — train/serve template drift.** Any difference between the conversation → id map used when the model was trained (σ_train of Eq. 10.13) and the map applied by a serving path (σ_serve), including differences in template text, Jinja implementation, special-token policy, whitespace, and generation prefix; detected by the failure of prefix consistency (Eq. 10.15).

$$
E' = \begin{bmatrix} E \\ E_{\text{new}} \end{bmatrix} \in \mathbb{R}^{(V+k)\times d}, \qquad U' = \begin{bmatrix} U \\ U_{\text{new}} \end{bmatrix}
$$
*(Eq. 10.19)* where k = number of added tokens; the old rows are unchanged so old ids keep their meaning. MATHEMATICALLY-DERIVED (definition of expansion).

$$
U_{\text{new},j} = \bar{u} \;:=\; \frac{1}{V}\sum_{i=1}^{V} U_i \quad (+\,\epsilon_j,\; \epsilon_j \sim \mathcal{N}(0, \Sigma_U)\ \text{optionally})
$$
*(Eq. 10.20)* where ū = mean of the existing head rows, Σ_U = their covariance. PAPER-REPORTED (R10.36): "just average all existing embeddings to initialize new embeddings", optionally adding noise drawn as e_{n+1} ~ 𝒩(μ, Σ) with Σ the covariance of the existing embeddings; OFFICIAL-DOCUMENTATION (R10.19, v5.17.0): `resize_token_embeddings(mean_resizing=True)` initialises "the added embeddings from a multivariate normal distribution that has old embeddings' mean and covariance", which "will reduce the kl-divergence between the next token probability before and after adding the new embeddings".

$$
\mathrm{KL}\big(p_{\theta}(\cdot \mid x_{<t}) \,\big\|\, p_{\theta'}(\cdot \mid x_{<t})\big) \;\le\; \log\Big(1 + \frac{1}{V}\Big) \quad \text{for one added token at } \bar{u},\ \text{no noise}
$$
*(Eq. 10.21)* where p_θ′ = the expanded model's distribution restricted appropriately; PAPER-REPORTED (R10.36): the bound "holds for any LM, for any prefix you give it", and the author notes that the "bounds we give below don't hold when we add noise. In practice, this seems to be fine." DERIVED extension: for k tokens each placed at ū the same argument gives log(1 + k/V), because each new logit equals the log-mean-exp-bounded average and cannot exceed the maximum existing logit; this extension is the book's and is UNVERIFIED as a tight bound.

$$
\text{artifact} \;=\; \big(\text{weights}, \text{tokenizer}, \text{template}, \text{special-token map}, \text{generation config}\big), \qquad h = \text{hash}(\text{artifact})
$$
*(Eq. 10.22)* where every consumer verifies h; a checkpoint is undefined without the other four components. DERIVED from Eq. 10.13 and Eq. 10.17: the ids the model was trained on are a function of all five.

> **Assumption.** The base model's head logits for common tokens are large relative to zero · *sensitivity:* PAPER-REPORTED (R10.36): the pathology "doesn't happen for all (or even most) LMs", and "One model that doesn’t exhibit the “only generate the new tokens” behavior is GPT2-large"; when logits are near zero, random initialisation and mean initialisation behave similarly and Eq. 10.21 is still the safe choice.

## Mechanism

**Vocabulary expansion and initialisation.** Steps: extend the tokenizer (new merges, or new added tokens whose type — control versus matchable — is set deliberately per [§10.5](10-5-tool-and-multimodal-interfaces.md)); resize E and U (Eq. 10.19); initialise the new rows (Eq. 10.20); continue training on data that fires the new rows. The initialisation choice is the correctness step. R10.36 explains the mechanism of the failure: trained logits for existing tokens become large and negative, and "the new words’ logits – roughly 0, since the zero vector dotted with anything is zero – dominate the partition function of the softmax, since exp(0) ≫ exp(−β) for large β", so the KL divergence between the pre- and post-expansion distributions spikes. Mean initialisation gives the bound of Eq. 10.21. Alternatives with published evidence: PAPER-REPORTED (R10.39, EMNLP 2023): FOCUS "represents newly added tokens as combinations of tokens in the overlap of the source and target vocabularies", using auxiliary static embeddings for similarity, and reports improvements over random initialisation for XLM-R specialisation; PAPER-REPORTED (R10.38, NeurIPS 2024): Zero-Shot Tokenizer Transfer trains "a hypernetwork taking a tokenizer as input and predicting the corresponding embeddings", and reports that performance gaps to the original model "can be quickly closed by continued training on less than 1B tokens" for the models it studies. Mean-of-subtokens — initialising a new merged token's row as the mean of the rows of the pieces it replaces under the old tokenizer — is a widely used heuristic that combines Eq. 10.20's centring with content; the book cites no fetched source that evaluates it in isolation, so its relative merit is UNVERIFIED. The tensor-core note: `pad_to_multiple_of` pads V to a multiple to enable "Tensor Cores on NVIDIA hardware with compute capability >= 7.5" (R10.19), which adds unreachable rows — they must be recorded as such so that the reachability test of [§10.2](10-2-implementations-and-normalization.md) does not flag them as defects. Cost: k·d new parameters per matrix (Eq. 10.7's marginal cost), plus the optimizer state for them; the covariance draw of Eq. 10.20 is a d×d factorisation, negligible; continued training to make the rows useful is the dominant cost and is bounded below by the data that contains the new tokens — undertrained rows are the glitch tokens of R10.37, whose detection by embedding norm ("the norm of the input embeddings thus provides an additional indicator of under-trained tokens") is the post-hoc check.

**Retokenization.** A corpus stored as ids under tokenizer 𝒯₁ can be re-encoded under 𝒯₂ only via bytes: `𝒯₂(decode₁(ids))`. If 𝒯₁ is byte-exact (Eq. 10.5 with identity N), the bytes are the originals and the operation is lossless; if 𝒯₁ normalised (NFKC, whitespace collapse), the recovered text is N(t), and 𝒯₂ is trained and applied on already-normalised text — a silent distribution shift relative to raw serving text. Cost: O(bytes) decode plus O(bytes·log n) encode over the whole corpus (Algorithm 10.2), and a full re-write of the packed dataset; with the CS336 `uint16` storage convention (R10.22) an expansion past 65,536 ids also changes the storage dtype and doubles the dataset's bytes. Retokenization also invalidates document-boundary and packing metadata ([§12.4](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-4-packing-and-masks.md)) and any resume cursor expressed in token offsets ([§12.5](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-5-resume-semantics.md)); the safe unit for cursors is the document, not the token.

**Checkpoint coupling.** The weights encode V in the shapes of E and U; `config.json` states `vocab_size`; the generation configuration names `bos`, `eos` and `pad` ids; the tokenizer artifact defines the id map and the special-token map; the template defines the conversation map. Any one of these loaded from a different revision than the others produces a model that runs and is wrong. Concrete couplings, OFFICIAL-DOCUMENTATION: TRL states that when a Jinja template file is supplied "you must ensure that any special tokens referenced in the template are added to the tokenizer and that the model's embedding layer is resized accordingly" (R10.20); Transformers' loading precedence puts `chat_template.jinja` above the legacy config field (R10.15); `resize_token_embeddings` "Takes care of tying weights embeddings afterwards if the model class has a `tie_weights()` method" (R10.19) — so an expansion on a tied model changes the head, and on an untied model must resize both. GGUF carries all of it in one file — `tokenizer.ggml.tokens`, `scores`, `token_type`, `merges`, `added_tokens`, the special ids and `tokenizer.chat_template` (R10.29) — which removes cross-file drift and introduces converter drift: every field is re-derived by the conversion script. Cost: a manifest (Eq. 10.22) is bytes; the cost of not having one is an incident whose localisation requires the parity suite ([§47.4](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch47-observability-deployment-changes-and-incident-recovery/47-4-regression-localization.md)).

**Train/serve template drift across engines.** Where the second copy of the template comes from, per engine, as documented:

| Engine (§4 layer: Inference engine) | Default source of the template | Override surface | Documented caveat |
|---|---|---|---|
| vLLM (#41) | "vLLM requires the model to include a chat template in its tokenizer configuration" (R10.23) | `--chat-template` file path or inline string; `--chat-template-content-format` (string / openai) auto-detected | without a template "all chat requests will error"; "vLLM community provides a set of chat templates for popular models … under the examples directory" (R10.23) |
| SGLang (#42) | "the chat template specified in the model tokenizer from Hugging Face" (R10.26) | `--chat-template` with a built-in name (e.g. `llama-2`) or a file in JSON (`conversation.py` fields: prefixes, separator style, stop strings) or Jinja format | the JSON format is a second template language whose stop strings and separators are not derived from the artifact (R10.26) |
| llama.cpp (#45) | GGUF `tokenizer.chat_template` (R10.29); `--jinja` "default: enabled" (R10.27) | `--chat-template` built-in names (chatml, llama2, llama3, gemma, deepseek, command-r, phi3, …) or `--chat-template-file`; `--chat-template-kwargs` | non-Jinja path matches known templates by name: "Currently, it's not possible to use your own chat template with llama.cpp server's `/chat/completions`" on that path (R10.28); ChatML "will be used" as fallback when unsupported (R10.27) |

Every row has at least two ways to obtain a σ_serve that differs from σ_train: an override that post-dates the artifact, and an engine-side re-implementation (a JSON conversation spec, a named built-in, a non-Python Jinja engine) that approximates it. The community-template directory of vLLM and the built-in list of llama.cpp are helpful precisely for models whose artifacts lack a template, and are drift by construction for models that have one. Cost: drift has no compute cost and an unbounded quality cost; the parity gate of Algorithm 10.10 is O(T) per test conversation.

**Loading-time coercions that look like drift.** `add_special_tokens` defaults ([§10.4](10-4-conversation-serialization.md)), `parse_special`/`split_special_tokens` policies ([§10.5](10-5-tool-and-multimodal-interfaces.md)), whitespace trimming in Jinja, `strftime_now` in system prompts, and reasoning-field prefills are all sources of a divergent prefix that the template text itself does not reveal. They are enumerated as test families in [verification.md](verification.md).

## Algorithm

```text
Algorithm 10.13 — Vocabulary expansion with distribution-preserving initialisation
INPUT   model (E ∈ ℝ^{V×d}, U ∈ ℝ^{V×d} or tied), tokenizer 𝒯 with V entries, new entries N (k of them) with types,
        noise ∈ {none, covariance}; pad multiple q
OUTPUT  expanded tokenizer 𝒯′, model with E′, U′; expansion record
INVARIANT ids 0..V−1 unchanged; Eq. 10.21 holds before any training step when noise = none
1.  𝒯′ ← 𝒯 with N appended; assert 𝒯′(t) = 𝒯(t) for all t containing no new piece (old ids stable)
2.  for control-type entries in N: assert they are unreachable from text (Eq. 10.17)
3.  V′ ← V + k rounded up to a multiple of q; record the V′ − (V + k) padding ids as unreachable
4.  ū ← mean_i U_i ; Σ ← cov(U) if noise = covariance
5.  U′ ← [U; rows ū + ε_j] for j = 1..k (ε_j = 0 or ε_j ~ N(0, Σ)); padding rows ← ū
6.  E′ ← same construction from E if untied; if tied, E′ ← U′
7.  measure KL(p_θ ∥ p_θ′) on a held-out prefix set; assert ≤ log(1 + k/V) + tolerance
8.  write record: (hash 𝒯, hash 𝒯′, k, types, q, noise, measured KL, V′)
9.  return 𝒯′, model
TERMINATION: one pass.
```

Complexity: O(V·d) for the mean and O(V·d²) for the covariance; the KL check is one forward pass per held-out prefix. Implementation: `resize_token_embeddings(new_num_tokens, pad_to_multiple_of, mean_resizing=True)` in Transformers v5.17.0 (R10.19) performs steps 3–6; steps 1, 2, 7 and 8 are the book's additions.

```text
Algorithm 10.14 — Artifact coupling manifest and cross-engine parity gate
INPUT   candidate release: weights W, tokenizer 𝒯, template τ, special map S, generation config G; engines 𝓔 = {vLLM, SGLang, llama.cpp, …};
        test conversations 𝒞 (the classes of Experiment 10.4 and 10.5)
OUTPUT  manifest with hashes; pass/fail per engine with first-divergence reports
1.  manifest ← {hash(W), hash(𝒯), hash(τ), hash(S), hash(G), V from W's embedding shape, 𝒯′s size, τ's referenced tokens}
2.  assert V(W) ≥ |𝒯| and every token referenced by τ ∈ 𝒯 and every id in G ∈ 𝒯     # coupling
3.  σ_train ← Transformers apply_chat_template(g = 0) on 𝒯, τ                            # reference
4.  for each engine e ∈ 𝓔: load the artifact with no template override; obtain σ_e via the engine's
        tokenize/apply-template path with g = 1
5.  for each c ∈ 𝒞: run Algorithm 10.10 on (σ_e, σ_train); record first divergence
6.  for each e: pass iff 0 divergences and the engine's reported stop set ⊇ τ's end-of-turn ids
7.  return manifest, per-engine results
TERMINATION: |𝓔|·|𝒞| checks.
```

Complexity: O(|𝓔|·|𝒞|·T). Implementation: the `coupling` and `cross_engine` families of [verification.md](verification.md); engine paths per R10.23, R10.26, R10.27.

## Implementation

Tensors and operators: `E′ [V′, d]`, `U′ [V′, d]`; the resize is a copy plus k·d (or (V′−V)·d) new values; the KL check needs logits `[n_prefix, V]` and `[n_prefix, V′]` with the new columns marginalised. Framework: *Hugging Face Transformers* (#26, Model definition / adaptation) provides the resize with mean initialisation and tying (R10.19) and the template loading precedence (R10.15); *Hugging Face TRL* (#29, Post-training / RL) requires template-referenced tokens to exist and embeddings to be resized (R10.20); *Hugging Face PEFT* (#28, Model definition / adaptation) is named only to note that adapters do not resize base embeddings — an expansion under an adapter workflow must make the new rows trainable explicitly, a detail whose current API is NOT-DISCLOSED here. Kernels: none. Memory: k·d·(weights + grads + optimizer) during continued training. Communication: under tensor-parallel vocabulary sharding the new rows land on one shard unless V′ is rebalanced (Chapter 29). Deployment: the three engines of the table above (Inference engine layer) plus GGUF conversion for *llama.cpp* (#45), whose `token_type` and `chat_template` fields are what the coupling gate must read back and compare.

> **Implementation note [impl.llama-cpp · server README and wiki as of 2026-09-20; release UNVERIFIED].** Two template paths coexist: the Jinja path (`--jinja`, default enabled, using the GGUF-embedded template) and a legacy path that recognises a fixed list of templates by name (R10.28). A GGUF converted from an artifact whose template uses constructs the legacy matcher does not recognise falls back to ChatML on that path (R10.27). A parity gate must therefore test the path the deployment actually uses, and the flag must be part of the manifest.

## Experimental design

### Experiment 10.6 — Expansion initialisation and its effect on the base distribution and on adaptation

- **Hypothesis.** Mean (covariance-noise) initialisation keeps the pre/post-expansion KL below log(1 + k/V) on held-out prefixes and yields lower held-out bits per byte on the target domain after a fixed continued-pretraining budget than zero-mean random initialisation; mean-of-subtokens initialisation matches or improves on mean initialisation early in continued training and converges to it.
- **Setup.** A base decoder with an untied head; three expansions of k ∈ {1k, 8k, 32k} new byte-level merges trained on a target-domain corpus (a non-Latin-script language, or code); initialisations ∈ {random N(0, initializer_range), mean, mean + covariance noise, mean-of-subtokens}; continued pretraining for a fixed byte budget on the target domain mixed with replay.
- **Independent variables.** Initialisation; k.
- **Controlled variables.** Base checkpoint hash, target corpus, budget, optimizer, learning rate, replay fraction, seed.
- **Dataset/workload.** Target-domain held-out set and a source-domain held-out set (to measure retention, [§22.4](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-4-retention-and-interference.md)).
- **Hardware.** One accelerator per run; wall-clock recorded.
- **Metrics.** KL at step 0 on 1,000 held-out prefixes; bits per byte on both held-out sets at fixed steps; fraction of new tokens with embedding norm below the R10.37 indicator threshold at the end; fertility on the target domain before and after expansion.
- **Baselines.** The unexpanded base (fertility and bits per byte on the target domain); the expanded model at step 0.
- **Expected result.** Step-0 KL: random ≫ mean ≈ mean+noise ≈ mean-of-subtokens; Eq. 10.21's bound holds for mean without noise; after training, the ordering of bits per byte follows the step-0 ordering early and narrows. ASSUMED.
- **Ablation.** Tied head (mean initialisation also changes inputs); k rows padded to a multiple of 64 with padding rows at ū versus at zero.
- **Interpretation.** Confirmation supports Eq. 10.20 as the default; a persistent advantage for mean-of-subtokens would justify content-aware initialisation as the default for merged (non-control) tokens.
- **Threats to validity.** The R10.36 pathology depends on logit scale, which varies by base model; results on one base may not transfer. Bits per byte across tokenizers must be computed on identical bytes ([§4.6](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-6-likelihood-and-capability.md)).

## Observations

**What the paper claims.** PAPER-REPORTED (R10.36): averaging bounds the KL by log(1 + 1/n) "for any LM, for any prefix"; the failure "doesn't happen for all (or even most) LMs". OFFICIAL-DOCUMENTATION (R10.19): `mean_resizing=True` reduces the KL and is the documented default. PAPER-REPORTED (R10.39): FOCUS beats random initialisation for XLM-R specialisation. PAPER-REPORTED (R10.38): a hypernetwork can predict embeddings for a new tokenizer and the gap closes with under 1B tokens of continued training. PAPER-REPORTED (R10.40): +20,000 Chinese tokens improved encoding efficiency for LLaMA. PAPER-REPORTED (R10.37): models that "re-use a large external tokenizer, and then train on distinct data from scratch, are among those with the highest number of detected under-trained tokens", and the authors recommend "checking for unreachable tokens by encoding and decoding the vocabulary".

**What the evidence shows.** The KL bound is a proof under its stated conditions. The comparative claims (FOCUS, ZeTT, mean-of-subtokens) are each from one group on the models they chose; no fetched source compares all initialisations on one base model at one budget (UNVERIFIED). The engine-drift table is documented behaviour, not measured incidence.

**What we infer.** DERIVED: expansion is safe at step 0 under Eq. 10.20 and becomes a data problem thereafter; the number of new rows that can be trained is bounded by the target-domain tokens available, which links expansion size to [§10.3](10-3-vocabulary-economics.md)'s data-per-row constraint. DERIVED: because every engine offers an override, the absence of drift is a property of a deployment's configuration, not of the engine; the manifest of Eq. 10.22 must include the engine flags.

**What remains unknown.** NOT-DISCLOSED: the initialisation used by any named model release for its added tokens (Llama 3's 28K, Chinese LLaMA's 20,000) beyond what the papers state. UNVERIFIED: the k-token generalisation of Eq. 10.21. Open question: whether tokenizer swaps (ZeTT-style) can replace expansion for domain adaptation at scale.

## Failure modes

> **Failure mode — new-token takeover at step 0.** *Symptom:* the expanded model emits only new tokens; perplexity on old text explodes before training. *Cause:* near-zero initialisation against large negative trained logits (R10.36). *Detection:* step-0 KL on held-out prefixes (Algorithm 10.13 step 7). *Mitigation:* Eq. 10.20.

> **Failure mode — shape/vocabulary mismatch.** *Symptom:* index out of range at the embedding, or silent garbage for ids ≥ V. *Cause:* tokenizer expanded without resizing, or a checkpoint loaded with a different tokenizer revision. *Detection:* Algorithm 10.14 step 2. *Mitigation:* the manifest; refuse to load on mismatch.

> **Failure mode — template override drift.** *Symptom:* quality regression on one engine only; Algorithm 10.10 reports divergence at turn boundaries. *Cause:* `--chat-template`/built-in template differs from the artifact's, or the legacy matcher fell back to ChatML (R10.27, R10.28). *Detection:* Experiment 10.4 per engine. *Mitigation:* no overrides in production; template hash in the manifest; test the actual path (`--jinja` on/off).

> **Failure mode — lossy retokenization.** *Symptom:* re-encoded corpus has different whitespace/normalisation statistics from raw serving text. *Cause:* original tokenizer normalised; bytes recovered are N(t) (Eq. 10.5). *Detection:* compare byte histograms of raw and recovered text. *Mitigation:* retain raw bytes; retokenize from bytes.

> **Failure mode — stale resume cursor.** *Symptom:* training resumes from the wrong document after retokenization. *Cause:* cursor in token offsets. *Detection:* document-id check at resume. *Mitigation:* document-level cursors ([§12.5](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-5-resume-semantics.md)).

> **Failure mode — control token converted to normal type.** *Symptom:* injection succeeds on the converted artifact only. *Cause:* converter wrote `token_type` normal for a control token (R10.29). *Detection:* Experiment 10.5 ablation on the converted file. *Mitigation:* read back `token_type` in the coupling gate.

## Siblings

**Vocabulary expansion with continued pretraining** — this file
Why it exists: reduce fertility on a new domain or language without retraining from scratch (R10.40, R10.31). What assumption changed (relative to a fixed vocabulary): the id map may grow but not change. What objective changed: none; the data mixture changes. What problem it solved: the premium on the target domain ([§10.3](10-3-vocabulary-economics.md)). What new failure mode it introduced: undertrained rows; step-0 distribution shift. Changed primitive: fixed E, U → appended rows.

**Tokenizer replacement (ZeTT, R10.38)** — this file
Why it exists: swap the tokenizer entirely. What assumption changed: embeddings can be predicted from the tokenizer. What objective changed: a hypernetwork objective over tokenizers. What problem it solved: detaching the model from its tokenizer. What new failure mode it introduced: a second model to train; gap requiring continued training. Changed primitive: appended rows → predicted E, U.

**Byte-level and tokenizer-free models ([§10.1](10-1-tokenization-algorithms.md))** — sibling that removes the migration problem
Why it exists: no vocabulary to migrate. What assumption changed: the model groups bytes. What problem it solved: expansion, retokenization and vocabulary coupling disappear. What new failure mode it introduced: sequence-length cost. Changed primitive: codebook → none.

**Continued pretraining stages ([§22.1](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-1-stage-definitions.md))** — owned elsewhere
Why it exists: the training that makes expanded rows useful. What assumption changed: the tokenizer is an input to the stage. What objective changed: mixture and schedule. What problem it solved: adaptation. What new failure mode it introduced: interference and forgetting ([§22.4](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-4-retention-and-interference.md)). Changed primitive: initialisation → optimisation.

**Release control ([§47.3](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch47-observability-deployment-changes-and-incident-recovery/47-3-release-control.md))** — owned elsewhere
Why it exists: immutable artifacts, canaries, rollback. What assumption changed: the parity gate is one check among many. What problem it solved: safe rollout. What new failure mode it introduced: none at this level. Changed primitive: artifact manifest → deployment process.

## Extensions

Domain adaptation: expansion size should be set by the target domain's fertility elasticity (Eq. 10.12) and the tokens available to train the rows. Long context: none specific. Multimodality: adding a modality adds control tokens and placeholder ids — an expansion whose new rows are never targets and whose initialisation matters less, but whose types must be control ([§10.5](10-5-tool-and-multimodal-interfaces.md)). Agents: new tool-call delimiters are the same case. Proposals only.

## Limitations

The KL bound covers the step-0 distribution only; nothing here predicts post-training quality. The engine table reflects documentation opened on the access date and the engines' release numbers are UNVERIFIED; other engines are NOT-DISCLOSED. Falsification: an expansion under Eq. 10.20 whose measured step-0 KL exceeds log(1 + k/V) by more than numerical tolerance would falsify the DERIVED k-token extension (the one-token bound is a proof). Decision consequence: never ship a checkpoint without the manifest of Eq. 10.22, and never accept an engine template override in production without re-running the parity gate.

## Reproducibility

Sources opened 2026-09-20: R10.15, R10.19 (Transformers v5.17.0), R10.20 (TRL v1.13.0), R10.22 (handout v26.0.3), R10.23 (vLLM developer-preview docs dated 2026-09-16), R10.26 (SGLang docs), R10.27 and R10.28 (llama.cpp server README and wiki), R10.29 (GGUF spec), R10.31, R10.37, R10.38, R10.39, R10.40 (arXiv), R10.36 (author page, redirected from the Stanford URL to the Columbia URL). Metric definitions: KL on held-out prefixes with new tokens marginalised; bits per byte on identical bytes. Unresolved: initialisation used by named releases (NOT-DISCLOSED); k-token bound (UNVERIFIED).

## References

R10.15 · R10.19 · R10.20 · R10.22 · R10.23 · R10.26 · R10.27 · R10.28 · R10.29 · R10.31 · R10.36 · R10.37 · R10.38 · R10.39 · R10.40 · [notation.md](../../../front-matter/notation.md) · [references.md](references.md)
