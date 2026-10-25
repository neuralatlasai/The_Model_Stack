---
id: ms.appendix.a
entity_type: appendix
title: "Research organizations, model families, and disclosure"
short_title: Appendix A
volume: null
part: null
chapter: null
section: null
slug: appendix-a-organizations-model-families-and-disclosure
parent: ms.appendices
prev_sibling: null
next_sibling: ms.appendix.b
children: []
prerequisites: []
downstream: []
related: [ms.chapter.6, ms.chapter.66]
relations: []
axes: {lifecycle: [evaluation, assurance], mechanism: [evidence_audit, provenance], feedback_setting: [], modality: []}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: null
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Appendix A — Research organizations, model families, and disclosure

[DERIVED] This is a provenance map for the book's case studies. An organization name locates a disclosure; it does not identify a reproducible model artifact, rank research quality or establish a current affiliation. The table preserves the plan's coverage routes. Release-specific chapter ledgers carry the actual inspected versions and claim boundaries; a moving family repository cannot substitute for them.

## Case-study routes

| Organization / ecosystem | Case-study scope | Principal chapter links | Evidence route |
|---|---|---|---|
| OpenAI | Scaling, instruction following, preference/RL methods, reasoning, multimodality, tools, and open-weight disclosures where available | 21, 31–38, 51–52, 61–66 | [Scaling laws](https://arxiv.org/abs/2001.08361), [InstructGPT](https://arxiv.org/abs/2203.02155), [gpt-oss model card](https://openai.com/index/gpt-oss-model-card/) |
| Anthropic | Claude-related public research, constitutional feedback, agent engineering, interpretability, and safety | 32, 38, 51–54, 62, 64–66 | [Research](https://www.anthropic.com/research), [Constitutional AI](https://arxiv.org/abs/2212.08073), [Circuit Tracing](https://transformer-circuits.pub/2025/attribution-graphs/methods.html) |
| Google DeepMind / Google Research | Chinchilla, Gemini, Gemma, PaLM lineage, sparse models, inference-time reasoning, TPU/JAX execution | 16, 18, 21, 25–29, 38, 55–60 | [Chinchilla](https://arxiv.org/abs/2203.15556), [Gemini 2.5](https://arxiv.org/abs/2507.06261), [test-time scaling](https://arxiv.org/abs/2408.03314) |
| DeepSeek | LLM/V2/V3 lineage, MLA, MoE, mathematical data, reasoning RL, distillation, and systems co-design | 09, 14, 16, 20–22, 27–29, 35, 39 | [V3 report](https://arxiv.org/abs/2412.19437), [DeepSeekMath](https://arxiv.org/abs/2402.03300), [R1](https://arxiv.org/abs/2501.12948) |
| Alibaba / Qwen | Dense/MoE and hybrid models, coding, reasoning, vision/audio/omni families, and deployment integration | 13–18, 31–38, 43–45, 55–58 | [Qwen3 fixed-generation repository](https://github.com/QwenLM/Qwen3), [moving Qwen family repository](https://github.com/QwenLM/Qwen3.8), [Omni](https://github.com/QwenLM/Qwen2.5-Omni) |
| Z.ai / GLM | Language and multimodal models, long-horizon agent tasks, coding, and asynchronous RL infrastructure | 16, 31–36, 44, 51–54 | [GLM-4.5](https://github.com/zai-org/GLM-4.5), [GLM-5 family](https://github.com/zai-org/GLM-5) |
| Meta | Llama-family training/architecture disclosures, open-weight deployment, predictive representations, and JEPA | 07–24, 40–45, 55–60 | Release-specific technical reports and model cards; [V-JEPA 2](https://arxiv.org/abs/2506.09985) |
| Mistral AI | Dense and sparse model design, instruction tuning, multilingual deployment, and open-weight runtime studies | 13–16, 31, 40–45 | Fixed release reports, model cards, official implementation repositories |
| NVIDIA | Megatron, NeMo, Nemotron, CUDA/kernel stack, ModelOpt, TensorRT-LLM, and distributed inference integration | 25–30, 36, 40–48 | [Megatron](https://github.com/NVIDIA/Megatron-LM), [ModelOpt](https://github.com/NVIDIA/Model-Optimizer), [TensorRT-LLM](https://nvidia.github.io/TensorRT-LLM/overview.html) |
| Microsoft Research | Training-memory optimization, adaptation, compact/specialist models, and systems research | 23, 29–30, 39–45 | [ZeRO](https://arxiv.org/abs/1910.02054), [LoRA](https://arxiv.org/abs/2106.09685), release-specific model cards |
| AI2 | Open data/training recipes, OLMo lineage, post-training, and reproducible evaluation | 07–12, 19–24, 31–36, 61 | [Dolma](https://arxiv.org/abs/2402.00159), [Tulu 3](https://arxiv.org/abs/2411.15124), release-specific OLMo records |
| Hugging Face | Datasets, model artifacts, adaptation/post-training tooling, interoperability, and open research | 07–12, 23, 31–36, 40–45, 61 | [FineWeb](https://arxiv.org/abs/2406.17557), [PEFT](https://huggingface.co/docs/peft/index), [TRL](https://huggingface.co/docs/trl/main/index) |
| Apple | On-device model and systems research, unified-memory execution, and MLX ecosystem studies | 25, 28, 40, 45 | Official research publications, release cards, and MLX/MLX-LM repositories |
| Cohere | Retrieval, reranking, enterprise/domain adaptation, multilingual applications | 22–23, 49–50, 61 | Official model cards, retrieval papers, and task-specific evaluations |
| Moonshot AI / Kimi | Public long-context, sparse-model, coding, and agent-oriented disclosures | 15–16, 35–38, 43–44, 51–54 | Release-specific technical reports and repositories |
| MiniMax | Public architecture, long-context, multimodal, and deployment disclosures | 15–18, 35–38, 55–58 | Release-specific reports, cards, and code |
| xAI | Public model/system disclosures and reproducible endpoint evaluations | 21, 38, 48, 61–66 | Official disclosures; undisclosed architecture/training fields remain empty |
| Academic and independent research groups | Algorithms, statistics, retrieval, compilers, systems, robotics, and evaluations | Entire series | Primary papers, official code, course repositories, and proceedings |

## Required model record

| Field group | Required values | Decision consequence |
|---|---|---|
| Identity and time | Exact model identifier, artifact/model-card revision, release date, first-public source date, inspected revision and access date | A later access date cannot make an older report current research; a mutable service alias cannot identify the weights that produced an outcome. |
| Architecture | Primary architecture source; total and activated parameters; routing/state/cache design when disclosed | Active parameters affect one component of work; they are not an end-to-end memory or latency estimate. Undisclosed internals remain NOT-DISCLOSED. |
| Representation | Tokenizer/normalization, chat template, special-token map, modality processor, action schema and numerical format | Identical weights with different interfaces can represent different input/output systems; use Chapter 10's coupling checks. |
| Training and evidence | Starting checkpoint, disclosed stages and data, selection/reward mechanisms, optimization and resource disclosures | A model-family brand cannot fill missing data or optimization fields. Distinguish a report from independently reproduced evidence. |
| Availability and rights | Weight/data/code availability, exact license/permission source and restrictions at the inspected revision | Open weights do not imply open data, unrestricted use or a fully reproducible training recipe. Do not infer permission from downloadability. |
| Evaluated system | Task population, scaffold/tools, prompt and decoding, endpoint revision, serving configuration, hardware and workload | A benchmark score belongs to this evaluated system, not to the organization or model name in isolation. |
| Limits | Missing fields, contradictory disclosures, inspected versus executed implementation, transfer boundaries | Unknown fields constrain admissible comparisons rather than being replaced with plausible estimates. |

[DERIVED] Store the identity record beside each evaluation or deployment manifest. Compare the records before comparing scores: a changed scaffold, tool inventory, processor or budget changes the intervention. A fixed organization name is never sufficient evidence of comparability. If a hosted system omits its exact weights or hardware, publish that omission and narrow the claim to the endpoint and time actually observed.

## Using the index

[DERIVED] Follow a mechanism-driven sequence: dense reference model, sparse or recurrent variant, adapted policy, reasoning procedure, compressed student and deployed system. Each step needs its own objective, state and resource accounting. Cross-family comparisons require matched information, tasks and budgets; a common brand, parameter count or leaderboard does not supply those controls.

[DERIVED] New model releases belong in the relevant chapter only after their primary disclosure and implementation boundary have been assessed. This appendix does not certify every current product of a named organization. No model execution or organization-wide quality rating was performed for this index.
