---
id: ms.references.10
entity_type: references
title: "References — Chapter 10"
volume: 1
part: 2
chapter: 10
section: null
slug: references
parent: ms.chapter.10
prev_sibling: ms.verification.10
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
relations: []
axes: {lifecycle: [data, evaluation], mechanism: [data_provenance, controlled_comparison], feedback_setting: [], modality: [text]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: null
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# References — Chapter 10

This ledger restores the primary-source identities already cited by the six existing sections and verification artifact. Historical sources retain their historical dates. They are not relabeled as current-window research because they were inspected again in 2026. The sections preserve their original September inspection accounts; the continuation checked source identity and available primary pages on 2026-10-25. This is bibliography repair and targeted mathematical/interface review, not a new execution of all cited tokenizers or engines.

A moving repository or latest documentation URL does not identify the version used by a historical experiment. Versioned documentation such as Transformers v5.17.0 deliberately preserves the earlier interface account; newer displayed versions are not silently substituted. Unavailable direct web extraction is stated for individual surfaces; no runtime compatibility claim follows from a successful URL response. The original handout checksum and several repository commits remain UNVERIFIED.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| R10.1 | paper | Neural Machine Translation of Rare Words with Subword Units | Rico Sennrich, Barry Haddow, Alexandra Birch | First 2015-08-31; v5 2016-06-10 | https://arxiv.org/abs/1508.07909v5 | null | preprint | BPE construction, boundary symbols and incremental pair statistics | 2026-10-25 |
| R10.2 | paper | Language Models are Unsupervised Multitask Learners | Alec Radford et al. (OpenAI) | Technical report, 2019 | https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf | null | preprint | GPT-2 byte-level BPE and base alphabet | 2026-10-25 |
| R10.3 | paper | Subword Regularization: Improving Neural Network Translation Models with Multiple Subword Candidates | Taku Kudo | First 2018-04-29; v1 | https://arxiv.org/abs/1804.10959v1 | null | preprint | Unigram vocabulary pruning, segmentation lattice and sampled tokenization | 2026-10-25 |
| R10.4 | paper | SentencePiece: A simple and language independent subword tokenizer and detokenizer for Neural Text Processing | Taku Kudo, John Richardson | First 2018-08-19; v1 | https://arxiv.org/abs/1808.06226v1 | null | preprint | Library/algorithm distinction, raw-text training, whitespace and heap-based merging | 2026-10-25 |
| R10.5 | repository | SentencePiece repository and options | Google SentencePiece maintainers | Moving repository; historical commit not recorded | https://github.com/google/sentencepiece | https://github.com/google/sentencepiece | official documentation | Supported model types, normalization and byte fallback | 2026-10-25 |
| R10.6 | paper | Google’s Neural Machine Translation System: Bridging the Gap between Human and Machine Translation | Yonghui Wu et al. | First 2016-09-26; v2 2016-10-08 | https://arxiv.org/abs/1609.08144v2 | null | preprint | Historical WordPiece account; does not specify every modern trainer implementation | 2026-10-25 |
| R10.7 | paper | Fast WordPiece Tokenization | Xinying Song, Alex Salcianu, Yang Song, Dave Dopson, Denny Zhou | arXiv 2012.15524; EMNLP 2021 | https://aclanthology.org/2021.emnlp-main.160/ | null | peer-reviewed | MaxMatch and LinMaxMatch complexity | 2026-10-25 |
| R10.8 | paper | ByT5: Towards a token-free future with pre-trained byte-to-byte models | Linting Xue et al. | First 2021-05-28; v3 2022-03-08 | https://arxiv.org/abs/2105.13626v3 | null | preprint | Byte-sequence length, vocabulary parameters and model-specific throughput tradeoffs | 2026-10-25 |
| R10.9 | paper | Byte Latent Transformer: Patches Scale Better Than Tokens | Artidoro Pagnoni et al. | First 2024-12-13; v1 | https://arxiv.org/abs/2412.09871v1 | null | preprint | Entropy-based dynamic patches; conditional FLOP/scale comparison | 2026-10-25 |
| R10.10 | paper | Language Model Tokenizers Introduce Unfairness Between Languages | Aleksandar Petrov, Emanuele La Malfa, Philip H. S. Torr, Adel Bibi | Historical research, 2023 | https://arxiv.org/abs/2305.15425 | null | preprint | Parallel-content premium; separate byte fertility and cross-language token ratio | 2026-10-25 |
| R10.11 | paper | Scaling Laws with Vocabulary: Larger Models Deserve Larger Vocabularies | Chaofan Tao et al. | NeurIPS 2024; arXiv 2407.13623 | https://proceedings.neurips.cc/paper_files/paper/2024/file/cf5a019ae9c11b4be88213ce3f85d85c-Paper-Conference.pdf | https://github.com/sail-sg/scaling-with-vocab | peer-reviewed | IsoFLOPs vocabulary allocation and fitted-scale limits | 2026-10-25 |
| R10.12 | documentation | Tokenizers: The tokenization pipeline | Hugging Face Tokenizers maintainers | Moving documentation; historical version not recorded | https://huggingface.co/docs/tokenizers/en/pipeline | null | official documentation | Normalization, pre-tokenization, model and postprocessing; components page belongs to the same documentation | 2026-10-25 |
| R10.13 | repository | tiktoken repository | OpenAI | Moving repository; historical commit not recorded | https://github.com/openai/tiktoken | https://github.com/openai/tiktoken | official documentation | Encoding construction, merge ranks, regex and special-token handling | 2026-10-25 |
| R10.14 | documentation | Transformers: Chat templates | Hugging Face | v5.17.0; preserved historical interface version | https://huggingface.co/docs/transformers/v5.17.0/en/chat_templating | null | official documentation | Conversation rendering, generation prompt and duplicate special-token behavior | 2026-10-25 |
| R10.15 | documentation | Transformers: Writing a chat template | Hugging Face | v5.17.0 | https://huggingface.co/docs/transformers/v5.17.0/en/chat_templating_writing | null | official documentation | Jinja artifact, role/control delimiters and multimodal placeholders | 2026-10-25 |
| R10.16 | documentation | Transformers: Tool use | Hugging Face | v5.17.0 | https://huggingface.co/docs/transformers/v5.17.0/en/chat_extras | null | official documentation | Tool schemas and function/docstring conversion; model calls do not execute tools | 2026-10-25 |
| R10.17 | documentation | Transformers: Multimodal chat templates | Hugging Face | v5.17.0 | https://huggingface.co/docs/transformers/v5.17.0/en/chat_templating_multimodal | null | official documentation | Processor outputs, typed content and frame sampling; direct web extraction unavailable in the continuation, URL status checked separately | 2026-10-25 |
| R10.18 | documentation | Transformers: Tokenizer classes and apply_chat_template | Hugging Face | v5.17.0 | https://huggingface.co/docs/transformers/v5.17.0/en/main_classes/tokenizer | null | official documentation | Assistant mask generation-tag requirement; direct web extraction unavailable in the continuation, URL status checked separately | 2026-10-25 |
| R10.19 | documentation | Transformers: Model classes and resize_token_embeddings | Hugging Face | v5.17.0 | https://huggingface.co/docs/transformers/v5.17.0/en/main_classes/model | null | official documentation | Vocabulary resizing, parameter counts, mean initialization and padding alignment | 2026-10-25 |
| R10.20 | documentation | TRL: SFT Trainer | Hugging Face TRL maintainers | v1.13.0 | https://huggingface.co/docs/trl/v1.13.0/sft_trainer | null | official documentation | SFT masking/packing and chunked loss; versioned documentation is not a measured kernel result | 2026-10-25 |
| R10.22 | documentation | CS336 Assignment 1: Building a Transformer LM | Stanford CS336 staff | Spring 2026; section historical account names handout v26.0.3 | https://github.com/stanford-cs336/assignment1-basics | null | official documentation | Educational BPE boundary and tie-rule reference; moving repository identity is not proof of a frozen handout checksum | 2026-10-25 |
| R10.23 | documentation | vLLM: OpenAI-compatible server | vLLM maintainers | Moving latest documentation; historical section records developer-preview date | https://docs.vllm.ai/en/latest/serving/openai_compatible_server/ | null | official documentation | Chat-template loading, override and typed-content selection | 2026-10-25 |
| R10.24 | documentation | vLLM: Tool Calling | vLLM maintainers | Moving latest documentation | https://docs.vllm.ai/en/latest/features/tool_calling/ | null | official documentation | Model-specific parser and template dependency | 2026-10-25 |
| R10.25 | documentation | vLLM: Multimodal Inputs | vLLM maintainers | Moving latest documentation | https://docs.vllm.ai/en/latest/features/multimodal_inputs/ | null | official documentation | Online versus offline placeholders, item limits and embedding shape contracts | 2026-10-25 |
| R10.26 | documentation | SGLang: Custom Chat Template | SGLang maintainers | Moving documentation; canonical site now docs.sglang.io | https://docs.sglang.io/docs/references/custom_chat_template | null | official documentation | Default tokenizer template and named/JSON/Jinja overrides | 2026-10-25 |
| R10.27 | repository | llama.cpp HTTP server documentation | ggml-org maintainers | Moving master; historical commit not recorded | https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md | https://github.com/ggml-org/llama.cpp | official documentation | Jinja path, template overrides, tokenize endpoint and special-token options | 2026-10-25 |
| R10.28 | documentation | Templates supported by llama_chat_apply_template | llama.cpp maintainers | Historical wiki revision e0f93c250c176aab38f293c8b65815361908139b | https://github.com/ggml-org/llama.cpp/wiki/Templates-supported-by-llama_chat_apply_template/e0f93c250c176aab38f293c8b65815361908139b | null | official documentation | Legacy built-in-template path restriction; not a blanket claim about current Jinja support | 2026-10-25 |
| R10.29 | documentation | GGUF file format specification | ggml-org maintainers | Moving specification; historical revision not pinned | https://github.com/ggml-org/ggml/blob/master/docs/gguf.md | null | official documentation | Tokenizer metadata, token types, scores and model family identity | 2026-10-25 |
| R10.30 | paper | Llama 2: Open Foundation and Fine-Tuned Chat Models | Hugo Touvron et al. | First 2023-07-18; v2 2023-07-19 | https://arxiv.org/abs/2307.09288v2 | null | preprint | Historical SentencePiece BPE, digit handling and byte fallback; same work as R11.5 | 2026-10-25 |
| R10.31 | paper | The Llama 3 Herd of Models | Aaron Grattafiori et al. | First 2024-07-31; v3 2024-11-23 | https://arxiv.org/abs/2407.21783v3 | null | preprint | Vocabulary extension and reported language-specific compression; same work as R11.6 | 2026-10-25 |
| R10.32 | documentation | Llama 3.1 prompt format | Meta Llama | Historical model format; moving first-party documentation | https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/prompt_format.md | null | official documentation | Turn/message/tool-call ending and role tokens | 2026-10-25 |
| R10.33 | documentation | Qwen: Tokenizer | Qwen team | Moving documentation; historical section used English Qwen3-era page | https://qwen.readthedocs.io/en/latest/getting_started/concepts.html | null | official documentation | ChatML role and turn tokens, document termination | 2026-10-25 |
| R10.34 | paper | Qwen2-VL: Enhancing Vision-Language Model’s Perception of the World at Any Resolution | Peng Wang et al. | First 2024-09-18; v2 2024-10-03 | https://arxiv.org/abs/2409.12191v2 | null | preprint | Dynamic visual-token counts and modality delimiters | 2026-10-25 |
| R10.35 | documentation | Chat Markup Language (ChatML) historical specification | OpenAI | openai-python release-v0.28.1 | https://github.com/openai/openai-python/blob/release-v0.28.1/chatml.md | null | official documentation | Historical role/header framing; not an assertion about every current model protocol | 2026-10-25 |
| R10.36 | documentation | Initializing New Word Embeddings for Pretrained Language Models | John Hewitt | First-party mathematical article; historical publication date not re-established | https://www.cs.columbia.edu/~johnhew/vocab-expansion.html | null | official documentation | Noise-free mean-row expansion KL argument; noisy initialization is outside the proof | 2026-10-25 |
| R10.37 | paper | Fishing for Magikarp: Automatically Detecting Under-trained Tokens in Large Language Models | Sander Land, Max Bartolo | First 2024-05-08 | https://arxiv.org/abs/2405.05417 | https://github.com/cohere-ai/magikarp | preprint | Unreachable, partial-byte and under-trained tokens; vocabulary reuse risk | 2026-10-25 |
| R10.38 | paper | Zero-Shot Tokenizer Transfer | Benjamin Minixhofer, Edoardo M. Ponti, Ivan Vulić | NeurIPS 2024 | https://proceedings.neurips.cc/paper_files/paper/2024/file/532ce4fcf853023c4cf2ac38cbc5d002-Paper-Conference.pdf | https://github.com/bminixhofer/zett | peer-reviewed | Hypernetwork-predicted embeddings and continued-training regime | 2026-10-25 |
| R10.39 | paper | FOCUS: Effective Embedding Initialization for Monolingual Specialization of Multilingual Models | Dobler and de Melo | EMNLP 2023 | https://aclanthology.org/2023.emnlp-main.829/ | null | peer-reviewed | Overlap/static-embedding initialization in XLM-R specialization | 2026-10-25 |
| R10.40 | paper | Efficient and Effective Text Encoding for Chinese LLaMA and Alpaca | Yiming Cui, Ziqing Yang, Xin Yao | Historical technical report; first 2023 | https://arxiv.org/abs/2304.08177 | null | preprint | Chinese vocabulary extension plus continued pretraining; bundled intervention | 2026-10-25 |
| R10.41 | documentation | Unicode Standard Annex #15: Unicode Normalization Forms | Unicode Consortium; Ken Whistler | Unicode 18.0.0, revision58, 2026-08-12 | https://www.unicode.org/reports/tr15/tr15-58.html | null | official documentation | Canonical versus compatibility normalization and irreversible distinctions | 2026-10-25 |
| R10.42 | documentation | Unicode Technical Standard #51: Unicode Emoji | Unicode Consortium; Mark Davis, Ned Holbrook | Unicode18.0, revision31, 2026-08-28 | https://www.unicode.org/reports/tr51/tr51-31.html | null | official documentation | ZWJ, modifiers, presentation selectors and regional-indicator structure | 2026-10-25 |
| R10.43 | documentation | Mistral tokenization | Mistral AI | Moving first-party documentation | https://docs.mistral.ai/guides/tokenization/ | null | official documentation | SentencePiece and Tekken format families and tool delimiters | 2026-10-25 |
| R10.44 | repository | Liger Kernel repository | LinkedIn Liger Kernel maintainers | Moving repository; historical commit not recorded | https://github.com/linkedin/Liger-Kernel | https://github.com/linkedin/Liger-Kernel | official documentation | Fused linear cross-entropy implementation account; reported savings are workload-dependent | 2026-10-25 |
| R10.45 | paper | BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding | Jacob Devlin, Ming-Wei Chang, Kenton Lee, Kristina Toutanova | First 2018-10-11; v2 2019-05-24 | https://arxiv.org/abs/1810.04805v2 | null | preprint | Historical WordPiece vocabulary use | 2026-10-25 |
| R10.46 | paper | BPE-Dropout: Simple and Effective Subword Regularization | Ivan Provilkov, Dmitrii Emelianenko, Elena Voita | First 2019-10-29; v2 2020-05-01 | https://arxiv.org/abs/1910.13267v2 | null | preprint | Stochastic segmentation as an explicit training intervention | 2026-10-25 |
| R10.47 | documentation | Transformers: Qwen2-Audio | Hugging Face / Qwen | v5.17.0 | https://huggingface.co/docs/transformers/v5.17.0/en/model_doc/qwen2_audio | null | official documentation | Audio placeholder expansion and configured audio token identity | 2026-10-25 |

## Interpretation and reproducibility boundaries

The tokenization algorithm, implementation, vocabulary, normalization, template and multimodal processor are separate objects. A paper naming an algorithm cannot establish parity of two deployed artifact revisions. Reported throughput or memory improvements require their original workload, device and comparison; they are not universal constants. R10.28 is a historical built-in-template restriction, whereas the current server supports a separate Jinja path. The new-word KL proof requires an unchanged old-token logit vector and exact mean initialization without noise; its divergence is computed on an extended support as clarified in §10.6.

The verification artifact specifies adversarial byte/string, template, mask, migration and processor tests. Those are proposed gates, not claims that every listed external engine has passed them. Source documents, book-derived examples and measured external results retain distinct evidence labels.
