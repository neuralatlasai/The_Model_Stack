# The Model Stack

From Data and Silicon to Intelligence

Why it works: it is short, technically accurate, broad enough to cover data, pretraining, post-training, RL, distillation, hardware, kernels, inference, serving, agents, evaluation, labs, papers, and future model paradigms. It also sounds like a serious systems/research reference rather than a generic AI textbook.



## Foundation Models: Learning Science, Systems Engineering, and Intelligent Applications

**Final chapter architecture and development matrix · Edition 1.0 · 20 September 2026**

**Audience:** principal scientists, research engineers, AI systems architects, and advanced graduate researchers.

**Scope:** 3 volumes, 11 parts, 66 chapters, 396 numbered sections, and 8 reference appendices. This document is the complete editorial specification and detailed table of contents for developing the book. It defines chapter ownership, dependencies, technical depth, verification requirements, and source routes; it is not the completed chapter manuscripts.

The book develops one central relationship: a learning objective induces a representation and an algorithm; those choices determine execution, memory, communication, and deployment behavior; deployment evidence then informs the next learning intervention. Architecture, data, optimization, hardware, and evaluation must therefore be studied jointly.

The supplied draft provides the initial topic inventory. This edition reorganizes that inventory around prerequisites, restores missing sibling concepts, corrects category errors, and separates durable mechanisms from release-specific implementations. Multimodal generation, world models, and embodied policies are advanced extensions of the foundation-model treatment. They are included to explain their interfaces with language, representation learning, planning, and control; the book does not attempt to replace a complete robotics or computer-architecture textbook.

## Editorial decisions and estimated book size

**ASSUMPTION — production format.** Plan for a technical reference series, with mathematics, algorithms, implementation studies, and experiments in every substantive chapter. Page counts below are planning estimates, not measured pagination. They assume approximately 18–24 composed pages per chapter, including figures and tables.

| Volume | Parts and chapters | Technical responsibility | Estimated chapter pages |
|---|---|---|---:|
| I — Learning and Representation | I–IV; Chapters 01–24 | Scientific foundations, data, tokenization, architecture, pretraining, adaptation, continual learning | 432–576 |
| II — Execution and Optimization | V–VIII; Chapters 25–48 | Hardware, kernels, distributed execution, post-training, inference, compression, serving | 432–576 |
| III — Grounded and Interactive Intelligence | IX–XI; Chapters 49–66 | Retrieval, agents, multimodality, world models, evaluation, interpretability, security, release science | 324–432 |
| Reference appendices | A–H | Labs, software, datasets, papers, researchers, venues, learning resources, editorial schemas | 120–180 |
| Front matter and indexes | Across the series | Notation, reading routes, glossary, subject and implementation indexes | 24–36 |
| **Series total** | **66 chapters** | **Full reference treatment** | **1,332–1,800** |

An indicative manuscript budget is 5,000–7,000 words per chapter, or 330,000–462,000 chapter words, before reference appendices. Word count and pagination are separate estimates because equation, code, and figure density vary. A single printed volume would require materially reducing the promised depth; the digital edition can retain the full structure.

| Part | Chapters | Subject | Principal development outcome |
|---|---|---|---|
| I | 01–06 | Scientific foundations | A correct reference model and defensible experiment |
| II | 07–12 | Data and representation | A versioned corpus, tokenizer, and ingestion pipeline |
| III | 13–18 | Architecture | Explicit representation, state, and computation tradeoffs |
| IV | 19–24 | Training science | Pretraining/adaptation recipes with scaling and retention evidence |
| V | 25–30 | Hardware and distributed execution | Measured kernels, parallelization, and recoverable training |
| VI | 31–36 | Post-training | Auditable supervised, preference, and reinforcement-learning pipelines |
| VII | 37–42 | Inference and compression | Quality/resource frontiers and validated state accounting |
| VIII | 43–48 | Production serving | SLO-driven deployment with capacity and cost evidence |
| IX | 49–54 | Retrieval and agents | Grounded context, reliable tools, and consistent long-horizon state |
| X | 55–60 | Multimodal and embodied models | Modality-aware learning, prediction, planning, and control studies |
| XI | 61–66 | Evaluation and assurance | Reproducible evidence and an accountable release dossier |

### Completion criteria for this architecture

1. Each concept has a canonical teaching location and explicit cross-references.
2. Each chapter contains six ordered sections, an identifiable artifact, and a falsifiable verification task.
3. Learning objectives, optimization algorithms, feedback sources, architectures, and software implementations occupy separate categories.
4. Evaluation enters before model development and recurs at every transformation.
5. Hardware cost, numerical behavior, and deployment constraints accompany algorithmic treatment.
6. Publicly undocumented model details remain **NOT-DISCLOSED**. Proposed experiments remain proposals.
7. Every chapter manuscript must replace broad source anchors with equation-, section-, commit-, or configuration-level evidence.

## Corrections incorporated from the initial draft

The following are substantive corrections, not naming changes alone.

| Draft issue | Corrected treatment | Canonical location |
|---|---|---|
| Organizations, methods, tools, and courses appear as equivalent branches | The chapter sequence contains concepts; typed reference indexes connect organizations, artifacts, and evidence | All chapters; Appendices A–H |
| Pretraining → SFT → preference training → RL is presented as obligatory | Training is a branching, iterative process. SFT, direct preference optimization, RL, and distillation are selectable interventions with distinct prerequisites | 19, 22–24, 31–39 |
| Evaluation appears predominantly near the end | Define data splits and metrics first; assess every data, model, runtime, and agent change | 06; verification tasks throughout; 61–66 |
| “Pretraining objective” is reduced to next-token prediction | Autoregressive, masked, denoising, prefix, infilling, contrastive, predictive, and multimodal objectives are distinguished | 04, 18–19, 55–60 |
| RLVR and GRPO appear at the same conceptual level | RLVR describes the reward/feedback setting; GRPO is an optimization construction. Neither is synonymous with reasoning itself | 32–35 |
| LoRA is classified as model compression | LoRA is parameter-efficient adaptation. It reduces trainable state; it does not by itself make the base model smaller at inference | 23; cross-reference 39–41 |
| SentencePiece is listed as an algorithm parallel to BPE | Separate tokenization algorithms from implementations; SentencePiece supports algorithms including BPE and unigram tokenization | 10 |
| A larger vocabulary is shown as an unconditional reduction in sequence cost | Vocabulary, token fertility, embedding/output-head cost, and realized sequence length must be measured jointly | 10, 21, 42 |
| “Hidden reasoning” is treated as a standalone method | Separate observable traces, latent computation, provider controls, and unavailable internals | 38, 62, 64 |
| Memory is a single branch | Distinguish weights, recurrent state, KV cache, retrieval stores, agent working state, episodic memory, and checkpoints | 17, 24, 30, 42, 49–53 |
| All attention optimizations are grouped together | Separate architecture changes, approximation/sparsity, exact IO-aware kernels, and cache allocation | 14–17, 27, 42–44 |
| Hardware and software layers are intermixed | Accelerator architecture, kernel languages, compilers, collectives, distributed runtimes, and serving control planes have separate ownership | 25–30, 43–47 |
| CXL is treated as another memory technology; RoCE and Ethernet as disjoint fabrics | Separate storage media from interconnect protocols; explain RoCE as RDMA carried over Ethernet | 25, 29 |
| GGUF, GGML, llama.cpp, and Ollama are grouped as engines | Distinguish artifact format, tensor library, inference implementation, and model-management/serving product | 40, 43, 45; Appendix B |
| The student-distillation pipeline implies a universal subsequent RL stage | Teacher-output SFT, logit distillation, student RL, and quantization are separate experimental branches | 39 |
| An empirical preference ranking is used as general capability evidence | Human preference, task correctness, robustness, system performance, and economic efficiency are separate evaluation axes | 06, 48, 61–63 |
| Physical/cognitive intuition risks becoming an explanation of mechanism | Physical analysis concerns measured resource constraints; cognitive analogies are explicitly heuristic unless supported by intervention | 01, 38, 59, 64; Appendix H |

The distinction between adaptation and compression is grounded in [LoRA](https://arxiv.org/abs/2106.09685) and [QLoRA](https://arxiv.org/abs/2305.14314). The separation of exact attention from IO optimization is grounded in [FlashAttention](https://arxiv.org/abs/2205.14135). The branching post-training treatment is supported by the published [DeepSeek-R1 release](https://github.com/deepseek-ai/DeepSeek-R1), which distinguishes its training variants and distilled releases.

### Version-sensitive corrections verified for this edition

**OFFICIAL-DOCUMENTATION**, accessed 20 September 2026:

| Item | Evidence and editorial consequence |
|---|---|
| TGI | Its repository is archived and its README describes maintenance mode. Preserve it as a historical architecture and migration case, not an undifferentiated current recommendation. [TGI repository](https://github.com/huggingface/text-generation-inference) |
| TensorRT-LLM | Current documentation describes a PyTorch-native architecture and provides a TensorRT-backend removal guide. Separate legacy engine-building workflows from the current runtime. [Overview](https://nvidia.github.io/TensorRT-LLM/overview.html), [migration guide](https://nvidia.github.io/TensorRT-LLM/legacy/tensorrt-backend-removal.html) |
| FlashAttention-4 | It has a 2026 paper and an implementation in the official project. Include it as a versioned hardware/algorithm case study, without extrapolating reported speedups to other workloads. [Paper](https://arxiv.org/abs/2603.05451), [implementation](https://github.com/Dao-AILab/flash-attention) |
| CS336 | Use the Spring 2026 course as the current curriculum reference; retain the 2025 archive for reproducible assignment references. [Current course](https://cs336.stanford.edu/), [2025 archive](https://cs336.stanford.edu/spring2025/) |
| Qwen and GLM | Keep fixed historical case studies separately from moving release indexes. The accessed Qwen3.5 repository redirects to Qwen3.8; the GLM-5 repository contains later family releases. Pin artifacts before deriving architecture claims. [Qwen repository](https://github.com/QwenLM/Qwen3.8), [GLM repository](https://github.com/zai-org/GLM-5) |
| Epoch AI | Retain compute, hardware, and economic measurement as major uses, while acknowledging its capability and benchmark work. It should not be categorically excluded from evaluation. [Epoch data and measurement programs](https://epoch.ai/data) |

## The knowledge structure

### Conceptual dependency graph

Solid arrows denote the principal pedagogical dependencies between parts. Detailed chapter prerequisites refine this graph. Dashed arrows denote cross-cutting verification, not a requirement to read the last volume first.

~~~mermaid
flowchart TD
    A["I. Scientific foundations"] --> B["II. Data and representation"]
    A --> C["III. Model architectures"]
    B --> D["IV. Training science"]
    C --> D
    A --> E["V. Hardware and distributed execution"]
    C --> E
    D --> F["VI. Post-training"]
    E --> F
    C --> G["VII. Inference and compression"]
    F --> G
    E --> H["VIII. Serving systems"]
    G --> H
    B --> I["IX. Retrieval and agents"]
    H --> I
    C --> J["X. Multimodal and embodied models"]
    I --> J
    F --> J
    I --> K["XI. Evaluation and assurance"]
    J --> K
    K -. "verification criteria" .-> D
    K -. "verification criteria" .-> H
~~~

### Training and deployment are a conditional graph

This graph describes permissible intervention routes, not a universal recipe. Each edge requires a compatible objective, data distribution, artifact interface, and evaluation gate.

~~~mermaid
flowchart TD
    D["Versioned data"] --> B["Base-model training"]
    B --> M["Optional continued training"]
    M --> S
    M --> R
    M --> E
    B --> S["Optional SFT"]
    B --> R["Optional RL"]
    S --> P["Preference optimization"]
    S --> R
    B --> E["Evaluation gates"]
    S --> E
    P --> E
    R --> E
    E --> T["Optional distillation"]
    T --> E
    E --> Q["Optional compression"]
    Q --> E
    E --> V["Versioned deployment"]
    V --> O["Observed interactions"]
    O --> C["Curated feedback"]
    C --> D
~~~

Evaluation may reject a transformation or return it for revision. Deploying an uncompressed model is valid. Distillation can create new training data or a new student; a quantized artifact requires its own evaluation. Production logs become training data only after selection, permissions, sanitization, and leakage checks.

### Graph semantics for the digital edition

| Entity or edge | Definition | Example |
|---|---|---|
| Concept | A mechanism, mathematical object, or engineering concern | Grouped-query attention |
| Method | A specified procedure or objective | DPO |
| Artifact | A model checkpoint, dataset snapshot, implementation, or report | A pinned model release |
| Organization / person / venue | Provenance and attribution entities | A paper's authors and publication venue |
| prerequisite_of | A learning dependency; keep this subgraph acyclic | Conditional likelihood → SFT |
| variant_of | A constrained relationship within a method family | GQA → attention architecture |
| implemented_by | A mechanism-to-code relationship | Cache paging → a runtime implementation |
| evaluated_by | A claim-to-protocol relationship | Tool-use policy → a versioned agent benchmark |
| supported_by / contradicted_by | Evidence with scope and provenance | Scaling hypothesis → controlled experiment |
| consumes / produces | Artifact interfaces in an execution graph | SFT consumes labeled trajectories |
| trades_off_with | A conditional engineering relationship | Cache reuse ↔ tenant isolation |

Use a four-level editorial hierarchy: **Volume → Part → Chapter → Section**. Concept-level relationships remain a graph. Labs, papers, and libraries should not be inserted as parents of every method they discuss.

## How to read the chapter matrices

Each chapter owns six numbered sections. The listed prerequisites refer to earlier chapters; “applications” may point forward. The artifact and verification statements are specifications for writing and experimentation, not claims that those experiments have already been run.

The chapter source anchors below identify primary starting points. Appendix D supplies a mechanism-organized paper spine; Appendix H defines the stronger evidence standard for the eventual manuscripts.

# Volume I — Learning and Representation

## Part I — Scientific Foundations

### 01 — The foundation-model lifecycle as a scientific system

**Prerequisites:** graduate-level ML and software engineering. **Artifact:** a system specification with measurable objectives and resource constraints.

| Section | Required coverage |
|---|---|
| 01.1 Problem formulation | Task distribution, intended users, capabilities, acceptable errors, operating conditions, and measurable success criteria. |
| 01.2 Levels of analysis | Objective, representation, algorithm, implementation, runtime, infrastructure, and product behavior; distinguish evidence at each level. |
| 01.3 Model categories | General versus specialized models; dense versus sparse; autoregressive versus other generative/predictive families; open weights versus reproducible training. |
| 01.4 Lifecycle and intervention | Pretraining, continued training, adaptation, preference learning, RL, distillation, retrieval, compression, deployment, and feedback. |
| 01.5 Resource accounting | Parameters, tokens, FLOPs, memory capacity, memory traffic, communication, latency, throughput, energy, and monetary cost. |
| 01.6 Scientific interpretation | Mechanistic explanation, physical constraints, cognitive analogy, causal evidence, competing hypotheses, and falsification. |

**Verification:** express one application as a constrained optimization problem; show which measurements would reject the proposed design. Source anchors: [CS336](https://cs336.stanford.edu/), [HELM](https://arxiv.org/abs/2211.09110).

### 02 — Mathematical and statistical foundations

**Prerequisites:** 01. **Artifact:** a consistent notation and statistical-estimation reference.

| Section | Required coverage |
|---|---|
| 02.1 Tensor algebra | Shapes, contractions, batched matrix multiplication, broadcasting, rank, norms, singular values, and conditioning. |
| 02.2 Probability | Conditional distributions, factorization, Bayes' rule, expectation, variance, sampling, and Monte Carlo estimation. |
| 02.3 Information theory | Entropy, cross-entropy, KL divergence, mutual information, likelihood, coding length, and bits per byte. |
| 02.4 Differential calculus | Jacobians, vector–Jacobian products, chain rule, automatic differentiation, Hessian approximations, and gradient estimators. |
| 02.5 Statistical inference | Confidence intervals, bootstrap units, paired tests, dependence, multiple comparisons, effect sizes, and power. |
| 02.6 Optimization language | Decision variables, constraints, Lagrangians, Pareto frontiers, sensitivity analysis, and uncertainty propagation. |

**Verification:** derive cross-entropy gradients and implement a paired bootstrap that resamples independent experimental units. Source anchor: [CS336 prerequisites and technical syllabus](https://cs336.stanford.edu/).

### 03 — Numerical computation and a trustworthy training program

**Prerequisites:** 02. **Artifact:** a numerically checked single-device training skeleton.

| Section | Required coverage |
|---|---|
| 03.1 Numeric representations | FP32, FP16, BF16, FP8, FP4, integer formats; exponent range, precision, rounding, overflow, and underflow. |
| 03.2 Stable primitives | Log-sum-exp, softmax, normalization, reduction order, accumulation dtype, and cancellation. |
| 03.3 Automatic differentiation | Graph construction, saved tensors, in-place operations, gradient accumulation, clipping, and gradient checking. |
| 03.4 Mixed-precision execution | Storage versus compute versus accumulation dtype; scaling, master weights where used, and optimizer-state precision. |
| 03.5 Reference implementation | Shape contracts, causal masks, padding masks, loss masks, initialization, deterministic fixtures, and tiny-batch overfitting. |
| 03.6 Reproducibility limits | Seeds, RNG state, nondeterministic kernels, reduction-order effects, hardware changes, and tolerance-based equivalence. |

**Verification:** compare forward values and gradients against a high-precision reference across ordinary and extreme inputs. Source anchors: [CS336](https://cs336.stanford.edu/), [TorchAO](https://github.com/pytorch/ao).

### 04 — Language modeling and learning objectives

**Prerequisites:** 02–03. **Artifact:** an objective ledger specifying conditioning, targets, masks, and normalization.

| Section | Required coverage |
|---|---|
| 04.1 Autoregressive modeling | Sequence factorization, teacher forcing, causal conditioning, token likelihood, and sequence likelihood. |
| 04.2 Alternative objectives | Masked language modeling, span corruption, denoising, prefix language modeling, and encoder–decoder objectives. |
| 04.3 Code and structured sequences | Fill-in-the-middle, syntax-sensitive data, execution-grounded targets, and serialization of structured outputs. |
| 04.4 Auxiliary prediction | Multi-token prediction, auxiliary losses, loss weighting, and the distinction between training heads and inference algorithms. |
| 04.5 Conditional and multimodal learning | Conditioning on documents, images, audio, actions, and environments; generative versus discriminative objectives. |
| 04.6 Likelihood and capability | Perplexity, tokenizer dependence, distribution mismatch, calibration, and why likelihood is an incomplete deployment objective. |

**Verification:** reproduce objective masking on a hand-audited sequence and show when two reported perplexities are incomparable. Source anchors: [Transformer](https://arxiv.org/abs/1706.03762), [T5](https://arxiv.org/abs/1910.10683), [DeepSeek-V3](https://arxiv.org/abs/2412.19437).

### 05 — A minimal Transformer and its execution trace

**Prerequisites:** 03–04. **Artifact:** a small reference Transformer with inspectable intermediate tensors.

| Section | Required coverage |
|---|---|
| 05.1 End-to-end forward pass | Token IDs, embeddings, position information, residual stream, attention, feed-forward blocks, normalization, and output head. |
| 05.2 Attention calculation | Query/key/value projections, scaled dot products, masking, probability normalization, head combination, and output projection. |
| 05.3 Feed-forward computation | Expansion, nonlinear activation, gated alternatives, parameter count, and per-token compute. |
| 05.4 Residual organization | Pre-norm/post-norm, signal propagation, residual scaling, and initialization assumptions. |
| 05.5 Training and generation | Backpropagation, shifted targets, prompt prefill, cached decoding, and train/evaluation mode differences. |
| 05.6 Reference accounting | Parameter-by-component table, activation shapes, major FLOPs, and a first memory trace. |

**Verification:** check that full-sequence and incrementally cached inference agree within numerical tolerance. Source anchors: [Transformer paper](https://arxiv.org/abs/1706.03762), [CS336 assignments](https://cs336.stanford.edu/).

### 06 — Experimental design and evaluation before optimization

**Prerequisites:** 01–05. **Artifact:** a preregistered experiment and benchmark manifest.

| Section | Required coverage |
|---|---|
| 06.1 Evaluation units | Model, checkpoint, tokenizer, prompt, scaffold, endpoint, engine, hardware system, and complete product. |
| 06.2 Data partitioning | Train/development/test separation, temporal splits, group splits, contamination, and repeated test-set exposure. |
| 06.3 Controlled comparisons | Baselines, ablations, factorial designs, paired prompts, fixed budgets, and interaction effects. |
| 06.4 Measurement uncertainty | Seed variance, task variance, confidence intervals, sample dependence, and significance versus practical effect. |
| 06.5 Quality/resource frontiers | Fixed quality, fixed latency, fixed compute, fixed cost, and Pareto-dominance comparisons. |
| 06.6 Reproducible evidence | Immutable manifests, raw outcomes, provenance, negative results, and explicit limitations on extrapolation. |

**Verification:** design an ablation that distinguishes data-quality gains from extra training compute. Source anchors: [HELM](https://arxiv.org/abs/2211.09110), [DCLM](https://arxiv.org/abs/2406.11794).

## Part II — Data and Representation Engineering

### 07 — Data provenance, acquisition, and dataset semantics

**Prerequisites:** 04, 06. **Artifact:** a dataset inventory with provenance and admissible-use fields.

| Section | Required coverage |
|---|---|
| 07.1 Source categories | Web, books, science, code, mathematics, dialogue, enterprise records, user interactions, and simulation. |
| 07.2 Orthogonal dataset axes | Modality, language, domain, origin, supervision, training role, chronology, quality, and difficulty. |
| 07.3 Acquisition and extraction | Crawling, APIs, repositories, document parsing, OCR, metadata retention, and source identifiers. |
| 07.4 Rights and governance metadata | Licenses, consent records, contractual restrictions, retention conditions, access boundaries, and deletion lineage. |
| 07.5 Dataset documentation | Datasheets/cards, sampling frames, known omissions, population coverage, collection bias, and unresolved provenance. |
| 07.6 Corpus case studies | C4, The Pile, RedPajama, RefinedWeb, Dolma, FineWeb families, DCLM, code corpora, and multilingual corpora. |

**Verification:** trace sampled training records back to their source and transformation history; report missing lineage explicitly. Source anchors: [Dolma](https://arxiv.org/abs/2402.00159), [FineWeb](https://arxiv.org/abs/2406.17557).

### 08 — Cleaning, deduplication, privacy filtering, and contamination

**Prerequisites:** 06–07. **Artifact:** an auditable filtering pipeline and removal ledger.

| Section | Required coverage |
|---|---|
| 08.1 Normalization | Encoding repair, boilerplate removal, segmentation, language identification, formatting, and document boundaries. |
| 08.2 Quality estimation | Rules, learned classifiers, perplexity-based signals, domain-sensitive filters, and precision/recall tradeoffs. |
| 08.3 Duplicate structure | Exact hashes, n-gram methods, MinHash/LSH, near-duplicate clusters, cross-split and cross-source duplicates. |
| 08.4 Privacy and sensitive data | PII detection, contextual identifiers, secret scanning, false negatives, and selective redaction. |
| 08.5 Evaluation contamination | Exact overlap, paraphrases, translated leakage, code clones, synthetic contamination, and timestamp-based analysis. |
| 08.6 Filter interactions | Ordering effects, multilingual bias, rare-data loss, adversarial documents, and controlled downstream ablations. |

**Verification:** estimate duplicate and contamination rates on a labeled sample; measure downstream effects at matched token budgets. Source anchors: [FineWeb](https://arxiv.org/abs/2406.17557), [DCLM](https://arxiv.org/abs/2406.11794).

### 09 — Data mixtures, curricula, and sample efficiency

**Prerequisites:** 06–08. **Artifact:** a mixture policy and exposure accounting report.

| Section | Required coverage |
|---|---|
| 09.1 Mixture formulation | Domain probabilities, sampling units, token/document weighting, temperature sampling, and repeated exposure. |
| 09.2 Quality and diversity | Coverage, redundancy, long-tail retention, domain balance, and interaction with model capacity. |
| 09.3 Curriculum design | Easy-to-hard, difficulty-adaptive, competence-based, sequence-length, and domain curricula. |
| 09.4 Learned mixture selection | Proxy runs, reweighting, bandit-style allocation, validation leakage, and transfer from small to large models. |
| 09.5 Multilingual and specialist mixtures | Token fertility, resource imbalance, cross-lingual transfer, code/math mixtures, and domain interference. |
| 09.6 Data scaling limits | Data exhaustion, repetition, synthetic fractions, saturation, and inference-aware allocation of training compute. |

**Verification:** compare mixtures at equal tokens and equal FLOPs; include a held-out domain to expose over-specialization. Source anchors: [DCLM](https://arxiv.org/abs/2406.11794), [compute-optimal training](https://arxiv.org/abs/2203.15556).

### 10 — Tokenization, serialization, and interface correctness

**Prerequisites:** 04, 07–09. **Artifact:** a tokenizer and serialization compatibility suite.

| Section | Required coverage |
|---|---|
| 10.1 Tokenization algorithms | BPE, byte-level BPE, WordPiece, unigram tokenization, character/byte approaches, and vocabulary construction. |
| 10.2 Implementations and normalization | SentencePiece, Hugging Face Tokenizers, Unicode, byte fallback, reversibility, and whitespace semantics. |
| 10.3 Vocabulary economics | Fertility by language/domain, embedding/output-head size, sequence length, and model/runtime tradeoffs. |
| 10.4 Conversation serialization | Roles, turn boundaries, chat templates, generation prefixes, assistant-only loss, and end-of-turn handling. |
| 10.5 Tool and multimodal interfaces | Tool schemas, control tokens, image/audio placeholders, modality spans, and untrusted text boundaries. |
| 10.6 Migration and compatibility | Vocabulary expansion, embedding initialization, retokenization, checkpoint coupling, and train/serve template drift. |

**Verification:** round-trip difficult multilingual inputs and compare exact training versus serving token IDs for the same conversation. Source anchor: [CS336 tokenizer and model-construction assignments](https://cs336.stanford.edu/).

### 11 — Synthetic data, preferences, and interactive trajectories

**Prerequisites:** 06–10. **Artifact:** a supervised-data and trajectory schema with quality gates.

| Section | Required coverage |
|---|---|
| 11.1 Generator design | Teacher selection, prompting, seed diversity, sampling controls, and synthetic-data provenance. |
| 11.2 Target types | Instructions, responses, rationales, demonstrations, preferences, reward labels, verifier labels, and tool trajectories. |
| 11.3 Selection and verification | Execution checks, symbolic checks, human review, model judges, rejection sampling, and disagreement analysis. |
| 11.4 Distributional risks | Teacher errors, style convergence, benchmark leakage, coverage collapse, feedback loops, and generator–student coupling. |
| 11.5 Interactive collection | Environment states, actions, observations, terminal outcomes, partial episodes, censoring, and policy versions. |
| 11.6 Synthetic-data economics | Useful samples per cost, acceptance rate, deduplication after generation, and student learning-curve evaluation. |

**Verification:** compare unfiltered, verifier-filtered, and diversity-controlled synthetic sets using an independent evaluator. Source anchors: [DeepSeek-R1](https://arxiv.org/abs/2501.12948), [Constitutional AI](https://arxiv.org/abs/2212.08073).

### 12 — Scalable data infrastructure and reproducible ingestion

**Prerequisites:** 07–11. **Artifact:** a resumable dataset build and loading pipeline.

| Section | Required coverage |
|---|---|
| 12.1 Storage and formats | Columnar files, object storage, compressed shards, indexed sequences, metadata tables, and immutable snapshots. |
| 12.2 Transformation execution | Distributed parsing/filtering, map/reduce stages, resource estimates, skew, and incremental rebuilds. |
| 12.3 Sampling and loading | Streaming, shuffling, bucketing, worker partitioning, sample weights, and avoiding accidental replication. |
| 12.4 Packing and masks | Document packing, block-diagonal attention, EOS boundaries, truncation, and token-loss accounting. |
| 12.5 Resume semantics | Shard versions, iterator state, RNG state, consumed-token counters, and exact versus approximate replay. |
| 12.6 Operational observability | Input throughput, stalls, corruption, missing objects, lineage audits, and deletion propagation. |

**Verification:** interrupt and resume a miniature run; detect duplicated or skipped examples and quantify any replay discrepancy. Source anchors: [Hugging Face Datasets](https://huggingface.co/docs/datasets/index), [Dolma](https://arxiv.org/abs/2402.00159).

## Part III — Model Architectures and State

### 13 — Dense Transformer design and parameter allocation

**Prerequisites:** 05, 10. **Artifact:** a parameter/FLOP model for a family of dense architectures.

| Section | Required coverage |
|---|---|
| 13.1 Architectural families | Decoder-only, encoder-only, encoder–decoder, conditional generation, and task-specific heads. |
| 13.2 Width, depth, and heads | Capacity allocation, head dimensions, bottlenecks, tensor shapes, and scaling constraints. |
| 13.3 Feed-forward alternatives | GELU, GLU variants, SwiGLU, expansion ratios, activation memory, and fused execution. |
| 13.4 Normalization and residuals | LayerNorm, RMSNorm, pre/post-norm, residual scaling, and signal/gradient propagation. |
| 13.5 Embeddings and heads | Tied weights, vocabulary cost, output projection, auxiliary heads, and vocabulary parallelism preview. |
| 13.6 Architectural ablations | Matched-parameter versus matched-FLOP comparisons, quality/latency tradeoffs, and domain sensitivity. |

**Verification:** explain why equal parameter counts do not imply equal training or inference costs. Source anchors: [Transformer](https://arxiv.org/abs/1706.03762), [CS336](https://cs336.stanford.edu/).

### 14 — Attention architectures and cache representations

**Prerequisites:** 05, 13. **Artifact:** an attention-family comparison with explicit cached state.

| Section | Required coverage |
|---|---|
| 14.1 MHA, MQA, and GQA | Query/KV-head relationships, parameter sharing, representational tradeoffs, and cache size. |
| 14.2 Latent attention | MLA-style compression, latent dimensions, position-related state, weight absorption, and implementation-dependent cache layouts. |
| 14.3 Sparse and local attention | Sliding windows, block sparsity, global tokens, learned selection, and coverage constraints. |
| 14.4 Cross-attention | Encoder–decoder state, multimodal conditioning, retrieval-conditioned attention, and cache lifetimes. |
| 14.5 Exact versus approximate computation | Architecture modification, sparsity approximation, numerical precision, and exact IO-aware execution. |
| 14.6 Quality–state tradeoffs | Retrieval fidelity, long-context behavior, cache capacity, bandwidth, and training/inference asymmetry. |

**Verification:** derive storage for MHA/MQA/GQA and a specified MLA implementation separately; validate against allocated tensors. Source anchors: [DeepSeek-V3](https://arxiv.org/abs/2412.19437), [FlashAttention](https://arxiv.org/abs/2205.14135).

### 15 — Position, long context, and effective information access

**Prerequisites:** 10, 13–14. **Artifact:** a long-context experiment matrix.

| Section | Required coverage |
|---|---|
| 15.1 Position representations | Learned/absolute positions, relative schemes, RoPE, ALiBi, and interaction with attention. |
| 15.2 Context extension | Position interpolation, scaling methods including YaRN, frequency adjustment, and adaptation data. |
| 15.3 Long-sequence training | Length curricula, packing, numerical stability, sparse patterns, and context-parallel execution preview. |
| 15.4 Effective context | Needle retrieval, multi-hop aggregation, position sensitivity, distractors, and distributed evidence. |
| 15.5 Long context versus retrieval | Freshness, provenance, irrelevant tokens, update cost, latency, and compositional evidence selection. |
| 15.6 Deployment consequences | KV growth, prompt reuse, chunking, truncation policy, and quality under a bounded context budget. |

**Verification:** vary evidence position, distractor density, and number of required facts; do not infer usable context from the advertised limit. Source anchor: [Gemini 2.5 technical report](https://arxiv.org/abs/2507.06261).

### 16 — Mixture-of-experts architectures

**Prerequisites:** 13–14. **Artifact:** an MoE routing and resource-accounting study.

| Section | Required coverage |
|---|---|
| 16.1 Conditional computation | Total versus activated parameters, sparse activation, dense components, and capacity interpretation. |
| 16.2 Router design | Top-k selection, gating scores, routing granularity, shared experts, and expert specialization. |
| 16.3 Training dynamics | Load balance, auxiliary losses, alternative balancing mechanisms, router stability, and expert collapse. |
| 16.4 Capacity and execution | Token dropping, padding, dropless execution, grouped GEMM, and token permutation. |
| 16.5 Distributed implications | Expert placement, all-to-all traffic, load skew, redundant experts, and communication/computation overlap. |
| 16.6 Comparative methodology | Equal active compute, equal total memory, dense baselines, batch-size effects, and long-tail routing behavior. |

**Verification:** report quality, expert-load histograms, token-drop rate, communication bytes, and tail latency together. Source anchors: [Switch Transformers](https://arxiv.org/abs/2101.03961), [DeepSeek-V3](https://arxiv.org/abs/2412.19437).

### 17 — State-space, recurrent, linear-attention, and hybrid models

**Prerequisites:** 02, 13–15. **Artifact:** a sequence-model comparison under explicit state budgets.

| Section | Required coverage |
|---|---|
| 17.1 Recurrent state | State updates, sufficient statistics, finite-state capacity, and parallel training versus sequential inference. |
| 17.2 State-space models | Discretization, selective dynamics, scanning algorithms, and Mamba-family design principles. |
| 17.3 Linear attention | Kernelized formulations, associative state, normalization, and retrieval limitations. |
| 17.4 Delta-rule mechanisms | Targeted state updates, gating, forgetting, and gated delta networks. |
| 17.5 Hybrid composition | Attention/recurrent layer placement, shared representations, heterogeneous cache/state, and training stability. |
| 17.6 Evaluation boundaries | Length extrapolation, associative recall, exact copying, throughput, state size, and workload-dependent crossovers. |

**Verification:** compare recall and generation quality as sequence length grows while separately measuring persistent state and compute. Source anchors: [Mamba](https://arxiv.org/abs/2312.00752), [Gated Delta Networks](https://arxiv.org/abs/2412.06464).

### 18 — Multimodal architectural primitives

**Prerequisites:** 04, 10, 13–17. **Artifact:** a modality-to-model interface specification.

| Section | Required coverage |
|---|---|
| 18.1 Modality representation | Image patches, latent tokens, audio frames/codecs, video frames, spatial signals, and action representations. |
| 18.2 Encoders and adapters | Vision/audio encoders, projectors, resamplers, query transformers, and frozen versus trainable interfaces. |
| 18.3 Fusion | Early fusion, late fusion, cross-attention, interleaving, shared backbones, and modality-specific branches. |
| 18.4 Learning objectives | Contrastive alignment, conditional generation, masked prediction, latent prediction, and reconstruction. |
| 18.5 Sequence and time alignment | Timestamps, sampling rates, asynchronous streams, temporal positions, and synchronization errors. |
| 18.6 Transfer and interference | Modality imbalance, forgetting, representation bottlenecks, missing modalities, and cross-modal evaluation. |

**Verification:** isolate encoder, connector, and language-backbone effects with controlled freezing/unfreezing. Source anchors: [CLIP](https://arxiv.org/abs/2103.00020), [BLIP-2](https://arxiv.org/abs/2301.12597).

## Part IV — Training Science and Adaptation

### 19 — Pretraining objectives and the full training loop

**Prerequisites:** 04, 06, 12–18. **Artifact:** a complete single-device reference training recipe.

| Section | Required coverage |
|---|---|
| 19.1 Objective selection | Match autoregressive, denoising, infilling, auxiliary, and multimodal objectives to the intended model family. |
| 19.2 Batch semantics | Microbatch, optimizer-step batch, gradient accumulation, valid-token counts, and variable-length weighting. |
| 19.3 Parameter updates | Initialization, forward/backward passes, optimizer steps, clipping, scheduling, and numerical checks. |
| 19.4 Training-state transitions | Data iterator, RNG, scheduler, optimizer, model state, checkpoint contents, and resume invariants. |
| 19.5 Monitoring | Loss by slice, gradient/parameter norms, activation statistics, learning-rate traces, and early instability signals. |
| 19.6 Reference-to-scale handoff | Correctness gates, pilot run design, resource estimates, and distributed execution prerequisites in Part V. |

**Verification:** overfit a tiny corpus, resume from a checkpoint, and reproduce a short-run loss trajectory within declared tolerance. Source anchors: [CS336](https://cs336.stanford.edu/), [TorchTitan](https://github.com/pytorch/torchtitan).

### 20 — Optimization, schedules, and training stability

**Prerequisites:** 02–03, 19. **Artifact:** an optimizer/schedule ablation protocol.

| Section | Required coverage |
|---|---|
| 20.1 Optimizer mechanics | SGD/momentum as references; Adam/AdamW, Adafactor, matrix-aware/Muon-family methods, and optimizer-state costs. |
| 20.2 Hyperparameter scaling | Learning rate, batch size, gradient noise, width/depth transfer, and parameterization-dependent scaling. |
| 20.3 Scheduling | Warmup, cosine/linear decay, warmup–stable–decay, restart decisions, and comparison at matched budgets. |
| 20.4 Stability instrumentation | Gradient spikes, outlier activations, NaNs, router instability, norm drift, and numerical diagnostics. |
| 20.5 Recovery interventions | Batch isolation, rollback, schedule changes, clipping, precision changes, and data-quality investigation. |
| 20.6 Comparative evidence | Convergence per token, per FLOP, per second, and per cost; sensitivity across seeds and architectures. |

**Verification:** distinguish a numerical failure from an optimizer or data-distribution failure using controlled replay. Source anchors: [CS336](https://cs336.stanford.edu/), [DeepSeek-V3 training report](https://arxiv.org/abs/2412.19437).

### 21 — Scaling laws and compute allocation

**Prerequisites:** 06, 09, 13, 19–20. **Artifact:** a fitted scaling model with uncertainty and held-out validation.

| Section | Required coverage |
|---|---|
| 21.1 Empirical scaling | Loss versus parameters, tokens, and compute; irreducible loss; fitting assumptions and domain dependence. |
| 21.2 Compute-optimal design | Iso-compute curves, optimal allocation, model/data scaling, and sensitivity to recipe changes. |
| 21.3 Inference-aware training | Longer training of smaller models, lifecycle demand assumptions, deployment cost, and break-even analysis. |
| 21.4 Beyond dense pretraining | MoE, data quality, multilinguality, context length, distillation, RL, and inference-time scaling. |
| 21.5 Pilot methodology | Proxy models, extrapolation range, fit uncertainty, confounding, and independent validation points. |
| 21.6 Capability prediction | Continuous loss versus thresholded metrics, apparent emergence, benchmark saturation, and failed extrapolations. |

**Verification:** fit on one subset of model sizes and predict held-out runs; show confidence bands and sensitivity to the fit family. Source anchors: [Kaplan et al.](https://arxiv.org/abs/2001.08361), [Hoffmann et al.](https://arxiv.org/abs/2203.15556), [Epoch AI](https://epoch.ai/data).

### 22 — Continued pretraining, mid-training, and domain adaptation

**Prerequisites:** 09–12, 19–21. **Artifact:** an adaptation decision record and retention evaluation.

| Section | Required coverage |
|---|---|
| 22.1 Stage definitions | Continued pretraining, domain-adaptive training, task-adaptive training, and release-specific meanings of “mid-training.” |
| 22.2 Distribution transitions | New domains/languages, long context, code/math emphasis, data mixtures, and changing sequence structure. |
| 22.3 Optimizer transitions | Restart versus continuation, scheduler reset, learning-rate selection, and checkpoint compatibility. |
| 22.4 Retention and interference | General-skill regression, mixing/replay, capability balance, and targeted validation. |
| 22.5 Alternative interventions | Retrieval, prompt/context changes, SFT, adapters, and full parameter updates under the same objective. |
| 22.6 Adaptation economics | Data availability, task frequency, freshness, amortization, rollback, and deployment constraints. |

**Verification:** compare retrieval, SFT, and continued pretraining on a fixed domain task while measuring general-capability retention. Source anchors: [DeepSeekMath](https://arxiv.org/abs/2402.03300), [DeepSeek-V3](https://arxiv.org/abs/2412.19437).

### 23 — Parameter-efficient adaptation and model composition

**Prerequisites:** 13, 19–22. **Artifact:** an adapter lifecycle and composition study.

| Section | Required coverage |
|---|---|
| 23.1 Adaptation families | Full fine-tuning, adapters, prompt/prefix tuning, low-rank updates, and selective parameter training. |
| 23.2 LoRA mechanics | Rank, target modules, scaling, initialization, trainable-state accounting, and merging behavior. |
| 23.3 Quantized-base adaptation | QLoRA-style training, frozen quantized weights, compute dtypes, optimizer states, and checkpoint artifacts. |
| 23.4 Multi-task composition | Adapter selection, task vectors, weight merging, interference, and incompatible base checkpoints. |
| 23.5 Serving implications | Merged/unmerged updates, multi-adapter batching, memory residency, activation cost, and version management. |
| 23.6 Evaluation | Rank/capacity tradeoffs, domain retention, generalization, quantization interactions, and deployment parity. |

**Verification:** compare full tuning and adapter tuning at matched quality, reporting total resident memory as well as trainable parameters. Source anchors: [LoRA](https://arxiv.org/abs/2106.09685), [QLoRA](https://arxiv.org/abs/2305.14314), [PEFT](https://huggingface.co/docs/peft/index).

### 24 — Continual learning, model editing, and unlearning

**Prerequisites:** 06, 19–23. **Artifact:** a sequential-task evaluation with explicit data-retention constraints.

| Section | Required coverage |
|---|---|
| 24.1 Sequential learning regimes | Task-, domain-, and class-incremental learning; stationary versus evolving distributions; replay permissions. |
| 24.2 Forgetting and transfer | Retention matrices, forward/backward transfer, plasticity, order sensitivity, and long-horizon evaluation. |
| 24.3 Mechanism families | Replay, rehearsal-free anchors, regularization, distillation constraints, parameter isolation, and modular adapters. |
| 24.4 Model editing | Local knowledge interventions, edit locality, collateral effects, compositional edits, and persistence. |
| 24.5 Unlearning | Deletion objectives, retraining baselines, residual memorization, relearning, privacy tests, and limits of behavioral evidence. |
| 24.6 Parametric versus external memory | Weight updates, retrieval updates, agent memory, freshness, provenance, and system-level alternatives. |

**Verification:** run a controlled sequence of tasks with and without replay; report full retention matrices and intervention costs. Source anchor: [catastrophic forgetting and parameter anchoring](https://arxiv.org/abs/1612.00796). New LLM-specific methods require their own primary-paper records before inclusion in the manuscript.

# Volume II — Execution and Optimization

## Part V — Hardware, Kernels, and Distributed Execution

### 25 — Accelerators, memory hierarchy, and performance models

**Prerequisites:** 01–03, 05, 13–17. **Artifact:** a hardware/resource model for a specified workload.

| Section | Required coverage |
|---|---|
| 25.1 Accelerator organization | GPU execution units, tensor/matrix units, warps/wavefronts, vector units, TPUs, and other AI accelerators. |
| 25.2 Memory hierarchy | Registers, shared memory/SRAM, caches, HBM, host DRAM, persistent storage, and placement/lifetime. |
| 25.3 Roofline reasoning | Arithmetic intensity, bandwidth ceilings, compute ceilings, launch overhead, occupancy, and bottleneck transitions. |
| 25.4 Physical connectivity | PCIe, NVLink/NVSwitch, scale-up/scale-out distinctions, RDMA, Ethernet/RoCE, InfiniBand, and CXL. |
| 25.5 Platform comparison | NVIDIA, AMD, TPU/JAX platforms, Trainium/Inferentia, CPU/Apple silicon, NPUs, and specialized ASICs. |
| 25.6 Cluster constraints | Rack topology, power/cooling envelopes, failure domains, storage throughput, scheduling, and achieved utilization. |

**Verification:** predict whether selected operators are bandwidth- or compute-limited, then compare with profiler evidence. Vendor specifications must be versioned; advertised peak FLOPs are not application throughput. Source anchors: [CS336 hardware material](https://cs336.stanford.edu/), [Epoch hardware data](https://epoch.ai/data).

### 26 — Kernel programming and numerical equivalence

**Prerequisites:** 03, 05, 25. **Artifact:** a profiled operator with a correctness reference.

| Section | Required coverage |
|---|---|
| 26.1 Execution primitives | Threads/program instances, tiling, vectorization, coalescing, synchronization, and reduction patterns. |
| 26.2 Programming ecosystems | CUDA, HIP/ROCm, Triton, CUTLASS/CuTe, CuTeDSL, Pallas, TileLang, and ThunderKittens as distinct interfaces. |
| 26.3 Core operators | GEMM/GEMV, embedding lookup, normalization, RoPE, softmax, cross-entropy, and optimizer kernels. |
| 26.4 Fusion and dataflow | Eliminating intermediate writes, layout selection, register pressure, shared-memory staging, and asynchronous copies. |
| 26.5 Tuning and portability | Shape/dtype specialization, autotuning, occupancy, compiler effects, device families, and fallback paths. |
| 26.6 Correctness under optimization | Accumulation, tolerances, race detection, synchronization bugs, boundary cases, and forward/backward parity. |

**Verification:** measure speed and memory traffic across a shape matrix; reject optimizations that fail accuracy or boundary conditions. Source anchors: [Triton documentation](https://triton-lang.org/main/index.html), [CS336 systems assignment](https://cs336.stanford.edu/).

### 27 — Attention, latent-attention, and expert kernels

**Prerequisites:** 14–17, 25–26. **Artifact:** an algorithm-to-kernel analysis with hardware-specific measurements.

| Section | Required coverage |
|---|---|
| 27.1 IO-aware attention | Tiling, online softmax, recomputation, causal masks, and avoiding materialized attention matrices. |
| 27.2 FlashAttention lineage | Original IO analysis, parallelism refinements, asynchronous pipelines, and version-specific hardware co-design through FA4. |
| 27.3 Decode-specialized attention | Small query dimensions, large KV reads, paged layouts, split reductions, and batching effects. |
| 27.4 MLA and sparse kernels | Compressed latent state, position components, sparse selection, FlashMLA-style implementations, and shape constraints. |
| 27.5 MoE execution | Routing, token dispatch/combine, grouped GEMM, capacity padding, quantized experts, and communication overlap. |
| 27.6 Integration libraries | FlashInfer, FlashAttention, FlashMLA, Liger/xFormers examples; capability depends on backend, dtype, shape, and release. |

**Verification:** compare a kernel against a mathematical reference and report accuracy, HBM traffic, achieved FLOPs, and unsupported cases. Source anchors: [FlashAttention](https://arxiv.org/abs/2205.14135), [FlashAttention-4](https://arxiv.org/abs/2603.05451), [official implementation](https://github.com/Dao-AILab/flash-attention).

### 28 — Frameworks, graph compilers, and runtime integration

**Prerequisites:** 19, 25–27. **Artifact:** a reproducible framework/compiler execution profile.

| Section | Required coverage |
|---|---|
| 28.1 Framework semantics | PyTorch eager/autograd, JAX transformations, functional state, tracing, and distributed tensor abstractions. |
| 28.2 Compilation pipeline | Graph capture, guards, graph breaks, specialization, scheduling, lowering, and code generation. |
| 28.3 Compiler families | torch.compile/Inductor, XLA, MLIR, TVM, and backend-specific compilation routes. |
| 28.4 Runtime execution | CUDA graphs and analogues, memory pools, shape buckets, operator dispatch, and launch amortization. |
| 28.5 Integration boundaries | Custom ops, autograd registration, dtype/layout contracts, fallback behavior, and compile-cache correctness. |
| 28.6 Deployment reproducibility | Compiler/runtime versions, build artifacts, warmup, cold-start costs, portability, and numerical drift. |

**Verification:** separate compile time, warmup, steady-state execution, and recompilation under changing shapes. Source anchors: [TorchTitan](https://github.com/pytorch/torchtitan), [MaxText](https://github.com/AI-Hypercomputer/maxtext).

### 29 — Parallelism, collectives, and distributed optimization

**Prerequisites:** 16, 19–20, 25–28. **Artifact:** a distributed placement and communication plan.

| Section | Required coverage |
|---|---|
| 29.1 Data/state parallelism | Replicated data parallelism, gradient synchronization, optimizer/gradient/parameter sharding, ZeRO stages, and FSDP variants. |
| 29.2 Tensor and pipeline parallelism | Matrix partitioning, activation exchange, pipeline bubbles, microbatch scheduling, interleaving, and topology. |
| 29.3 Sequence and context parallelism | Activation partitioning versus sequence/context distribution; exact definitions depend on the framework and algorithm. |
| 29.4 Expert parallelism | Expert placement, router imbalance, all-to-all exchange, hybrid data/expert parallelism, and shared experts. |
| 29.5 Collective communication | All-reduce, reduce-scatter, all-gather, all-to-all, point-to-point, algorithms, NCCL/RCCL, MPI/UCX, and NVSHMEM. |
| 29.6 Joint optimization | Hierarchical groups, overlap, recomputation, offload, topology-aware placement, and communication lower bounds. |

**Verification:** predict per-rank state and communication, then measure step time as parallel degrees change; explain scaling losses. Source anchors: [ZeRO](https://arxiv.org/abs/1910.02054), [Megatron-LM](https://arxiv.org/abs/1909.08053), [Megatron implementation](https://github.com/NVIDIA/Megatron-LM).

### 30 — Large training runs: reliability, monitoring, and recovery

**Prerequisites:** 12, 19–21, 25–29. **Artifact:** a training runbook and fault-injection report.

| Section | Required coverage |
|---|---|
| 30.1 Training orchestration | Job launch, placement, configuration validation, quotas, dependency pinning, and experiment identity. |
| 30.2 Memory management | Activation checkpointing/recomputation, optimizer sharding, activation/optimizer offload, and fragmentation. |
| 30.3 Checkpoint design | Distributed shards, atomic completion, optimizer/RNG/data state, integrity checks, format conversion, and retention. |
| 30.4 Failure taxonomy | Device/node loss, collective hangs, stragglers, network faults, storage stalls, numerical divergence, and silent corruption. |
| 30.5 Observability | Tokens/sec, step-time decomposition, MFU/HFU definitions, loss/gradient statistics, network health, and restart overhead. |
| 30.6 Recovery and reproducibility | Checkpoint selection, replay policy, elastic changes, altered parallelism, incident analysis, and cost of lost work. |

**Verification:** terminate a worker and restore training; verify model, optimizer, data-position, and scheduler consistency. Source anchors: [Megatron](https://github.com/NVIDIA/Megatron-LM), [TorchTitan](https://github.com/pytorch/torchtitan), [MaxText](https://github.com/AI-Hypercomputer/maxtext).

## Part VI — Post-Training and Reinforcement Learning

### 31 — Supervised fine-tuning and behavior acquisition

**Prerequisites:** 10–12, 19–24, 30. **Artifact:** an SFT recipe with exact target masks and template fixtures.

| Section | Required coverage |
|---|---|
| 31.1 SFT objectives | Conditional maximum likelihood, response-only versus full-sequence loss, example/token normalization, and target weighting. |
| 31.2 Data families | Instructions, multi-turn dialogue, reasoning demonstrations, coding, tool use, multimodal instruction, and long-context tasks. |
| 31.3 Conversation semantics | Role boundaries, system/context treatment, assistant turns, tool observations, truncation, and packed examples. |
| 31.4 Training choices | Full tuning versus PEFT, learning rate, epochs, mixture balance, curriculum, and sequence lengths. |
| 31.5 Behavioral failure modes | Overfitting style, loss of base capabilities, fabricated tool calls, verbose imitation, and demonstration leakage. |
| 31.6 Validation and handoff | Task utility, instruction compliance, domain retention, calibration, and compatibility with subsequent preference/RL stages. |

**Verification:** compare two loss-mask policies on the same examples and inspect both task quality and unintended behavior. Source anchors: [InstructGPT](https://arxiv.org/abs/2203.02155), [TRL](https://huggingface.co/docs/trl/main/index).

### 32 — Preferences, reward models, verifiers, and oversight

**Prerequisites:** 02, 06, 11, 31. **Artifact:** a reward/verification specification and calibration study.

| Section | Required coverage |
|---|---|
| 32.1 Feedback ontology | Human preference, AI feedback, deterministic verification, execution outcomes, process labels, and environment returns. |
| 32.2 Preference models | Bradley–Terry assumptions, pairwise/listwise labels, ties, annotator disagreement, and contextual preferences. |
| 32.3 Reward-model training | Ranking losses, reference data, calibration, distribution shift, ensembles, and uncertainty. |
| 32.4 Outcome and process verification | Final-answer correctness, intermediate-step supervision, executable tests, proof checkers, and verifier incompleteness. |
| 32.5 Oversight strategies | Constitutional feedback, critique/revision, weak-to-strong supervision, scalable oversight, and independent validation. |
| 32.6 Reward exploitation | Goodhart effects, verbosity/format shortcuts, reward hacking, distributional overoptimization, and adversarial tests. |

**Verification:** measure reward–human/ground-truth agreement and evaluate a deliberately optimized adversarial response set. Source anchors: [Constitutional AI](https://arxiv.org/abs/2212.08073), [Let's Verify Step by Step](https://arxiv.org/abs/2305.20050).

### 33 — Direct preference optimization and related objectives

**Prerequisites:** 02, 23, 31–32. **Artifact:** an objective-comparison sheet and controlled preference experiment.

| Section | Required coverage |
|---|---|
| 33.1 DPO derivation | KL-regularized reward maximization, policy/reward reparameterization, preference likelihood, and assumptions. |
| 33.2 Reference-policy effects | Reference choice, beta, support mismatch, log-probability computation, and numerical stability. |
| 33.3 Objective families | IPO, KTO, ORPO and related methods; distinguish pairwise/unpaired feedback and reference-dependent/reference-free formulations. |
| 33.4 Offline versus online data | Fixed preference sets, resampling, iterative labeling, stale support, and evaluation-distribution mismatch. |
| 33.5 Bias and pathology | Length effects, chosen/rejected quality, label noise, margin behavior, and overoptimization. |
| 33.6 Controlled comparison | SFT baselines, equal data/compute, held-out preferences, independent task metrics, and calibration. |

**Verification:** test sensitivity to beta, preference noise, and length distribution; report actual task outcomes alongside preference fit. Source anchors: [DPO](https://arxiv.org/abs/2305.18290), [TRL](https://huggingface.co/docs/trl/main/index).

### 34 — Policy gradients, PPO, and RLHF

**Prerequisites:** 02, 30–32. **Artifact:** a transparent rollout-to-update implementation specification.

| Section | Required coverage |
|---|---|
| 34.1 Sequential decision process | State/history, action tokens, policy, reward, return, termination, discounting, and credit assignment. |
| 34.2 Policy gradients | Score-function estimator, baselines, variance, advantages, and token/sequence objectives. |
| 34.3 PPO | Importance ratios, clipping, value estimation, GAE where used, update epochs, and approximate on-policy assumptions. |
| 34.4 RLHF components | Actor, reference policy, critic/value model, reward model, KL controls, and rollout generation. |
| 34.5 Stability and exploitation | Reward scale, KL drift, entropy collapse, length growth, truncation, and mismatched rollout/update policies. |
| 34.6 Resource accounting | Policy/reference/critic/reward memory, generation versus training compute, synchronization, and evaluation cadence. |

**Verification:** audit a toy rollout by hand and verify advantage, ratio, clipping, and masking computations. Source anchors: [PPO](https://arxiv.org/abs/1707.06347), [InstructGPT](https://arxiv.org/abs/2203.02155).

### 35 — Verifiable-reward RL and reasoning policy optimization

**Prerequisites:** 11, 32–34. **Artifact:** a verifier-grounded RL experiment with failure analysis.

| Section | Required coverage |
|---|---|
| 35.1 RLVR formulation | Reward source, answer checking, execution/proof-based verification, task sampling, and limits of verifiability. |
| 35.2 Group-relative optimization | GRPO construction, within-prompt groups, baselines/normalization, clipping, and reference regularization variants. |
| 35.3 Reasoning-policy development | Cold-start data, pure-RL research baselines, curriculum, response-length control, and rejected/accepted trajectories. |
| 35.4 Algorithmic refinements | DAPO, Dr. GRPO and related work; bias, normalization, entropy, dynamic sampling, and truncation treatment. |
| 35.5 What improved? | Sampling success, pass@1, verifier selection, diversity, generalization, and elicitation versus new capability claims. |
| 35.6 Scientific boundaries | Reward gaming, insufficient tests, task leakage, non-verifiable transfer, and separating traces from causal reasoning evidence. |

**Verification:** report pass@1 and pass@k with fixed budgets; use independent hidden tests and inspect zero-variance reward groups. Source anchors: [DeepSeekMath](https://arxiv.org/abs/2402.03300), [DeepSeek-R1](https://arxiv.org/abs/2501.12948), [DAPO](https://arxiv.org/abs/2503.14476), [R1-Zero training analysis](https://arxiv.org/abs/2503.20783).

### 36 — Agent RL and distributed rollout systems

**Prerequisites:** 11, 29–30, 34–35. **Artifact:** a versioned environment/rollout/update architecture.

| Section | Required coverage |
|---|---|
| 36.1 Agent trajectories | Tool calls, observations, partial observability, external state, multi-turn episodes, and long-horizon outcomes. |
| 36.2 Credit assignment | Terminal versus dense rewards, intermediate checks, hierarchical tasks, delayed feedback, and failed/aborted episodes. |
| 36.3 Environment infrastructure | Sandboxed execution, reset determinism, tool schemas, simulators, resource quotas, and reward isolation. |
| 36.4 Distributed roles | Actor/learner separation, rollout workers, reward services, environment pools, and weight synchronization. |
| 36.5 Asynchrony and mismatch | Policy lag, stale trajectories, importance corrections where appropriate, tokenization/log-probability parity, and backpressure. |
| 36.6 Efficiency and reproducibility | Rollout utilization, tail episodes, data queues, replay semantics, checkpointing, and cost per successful update. |

**Verification:** inject delayed rollout workers and environment faults; quantify policy staleness and recovery correctness. Source anchors: [verl](https://github.com/verl-project/verl), [AReaL](https://github.com/areal-project/AReaL), [GLM's published agent-training/infrastructure account](https://github.com/zai-org/GLM-5).

## Part VII — Inference Algorithms, Distillation, and Compression

### 37 — Decoding, constrained generation, and speculative execution

**Prerequisites:** 04–05, 14, 31. **Artifact:** a decoding-policy comparison with distributional checks.

| Section | Required coverage |
|---|---|
| 37.1 Sampling distributions | Greedy decoding, temperature, top-k, top-p, penalties, stochasticity, and reproducibility. |
| 37.2 Sequence termination | EOS/stop semantics, truncation, token limits, streaming boundaries, and length-conditioned evaluation. |
| 37.3 Search versus sampling | Beam search, sequence scores, length normalization, diverse candidates, and task-dependent utility. |
| 37.4 Structured generation | Grammars, finite-state constraints, JSON/schema constraints, tool argument validation, and semantic correctness. |
| 37.5 Speculative decoding | Draft models, acceptance/rejection, correction distributions, exactness assumptions, tree/multi-token proposals, and overhead. |
| 37.6 Runtime coupling | Draft/target placement, batch effects, acceptance rate, parser overhead, and quality/latency evaluation. |

**Verification:** distinguish exact target-distribution sampling from heuristic acceleration; measure accepted tokens per verification pass. Source anchors: [speculative decoding](https://arxiv.org/abs/2211.17192), [vLLM documentation](https://docs.vllm.ai/en/stable/).

### 38 — Inference-time reasoning, search, and adaptive compute

**Prerequisites:** 06, 32, 35, 37. **Artifact:** a quality-versus-inference-budget frontier.

| Section | Required coverage |
|---|---|
| 38.1 Computation dimensions | Serial deliberation, parallel candidates, retrieval/tool computation, verifier calls, and external search. |
| 38.2 Candidate aggregation | Self-consistency, majority voting, best-of-N, weighted voting, and correlated-error effects. |
| 38.3 Guided search | Process/outcome scorers, tree search, beam variants, Monte Carlo methods, and environment feedback. |
| 38.4 Revision and adaptive stopping | Critique/refinement, uncertainty-driven allocation, budget policies, and diminishing returns. |
| 38.5 Representation and evidence | Textual traces, latent/continuous computation research, reasoning controls, and undocumented provider behavior. |
| 38.6 Evaluation and economics | Fixed token/FLOP/time/cost budgets, verifier cost, answer length, hard/easy mixtures, and routing. |

**Verification:** compare serial and parallel compute at matched total cost, including selection overhead and unsuccessful attempts. Source anchors: [test-time scaling study](https://arxiv.org/abs/2408.03314), [process supervision](https://arxiv.org/abs/2305.20050).

### 39 — Knowledge, response, and policy distillation

**Prerequisites:** 11, 23, 31–38. **Artifact:** a teacher–student experiment with transparent information access.

| Section | Required coverage |
|---|---|
| 39.1 Distillation objectives | Soft targets, KL direction, temperature, hard-target mixtures, and representation matching. |
| 39.2 Information access | Logits, top-k probabilities, generated responses, internal features, and black-box versus white-box assumptions. |
| 39.3 Sequence and reasoning data | Response imitation, filtered rationales, answer-only supervision, teacher mistakes, and student capacity. |
| 39.4 Policy and trajectory transfer | Agent demonstrations, tool traces, on-policy student data, online/offline distillation, and self-distillation. |
| 39.5 Student optimization | Architecture selection, SFT, optional RL, compression interactions, and retention of non-target capabilities. |
| 39.6 Experimental accounting | Teacher generation cost, acceptance rates, matched-data baselines, leakage, and deployment break-even. |

**Verification:** compare logits/response/answer-only variants where access permits; do not assume teacher traces reveal causal internal computation. Source anchors: [knowledge distillation](https://arxiv.org/abs/1503.02531), [DeepSeek-R1 releases](https://github.com/deepseek-ai/DeepSeek-R1).

### 40 — Quantization from numerical model to deployable artifact

**Prerequisites:** 03, 23, 25–28, 39. **Artifact:** a quantized checkpoint with calibration and runtime evidence.

| Section | Required coverage |
|---|---|
| 40.1 Quantization formulation | Scale/zero point, symmetric/asymmetric mappings, group/channel/tensor granularity, clipping, and error. |
| 40.2 Quantization targets | Weights, activations, gradients where relevant, optimizer states, KV cache, and mixed-precision layer allocation. |
| 40.3 PTQ and QAT | Calibration, data representativeness, outliers, fake quantization, rounding optimization, and recovery training. |
| 40.4 Method families | GPTQ, AWQ, SmoothQuant, bitsandbytes formats, integer versus low-bit float, and hardware-supported variants. |
| 40.5 Artifact/runtime interfaces | Packing, metadata, dequantization, kernel availability, GGUF, safetensors, conversion, and export compatibility. |
| 40.6 Evaluation | Quality by task/length, numerical divergence, memory including scales/metadata, and actual end-to-end speed. |

**Verification:** compare BF16 and quantized artifacts at the same prompt/template, hardware, and workload; include unsupported/fallback kernels. Source anchors: [GPTQ](https://arxiv.org/abs/2210.17323), [AWQ](https://arxiv.org/abs/2306.00978), [TorchAO](https://github.com/pytorch/ao), [ModelOpt](https://github.com/NVIDIA/Model-Optimizer).

### 41 — Pruning, sparsity, rank reduction, and adaptive execution

**Prerequisites:** 13–17, 25–28, 39–40. **Artifact:** an executable compression comparison.

| Section | Required coverage |
|---|---|
| 41.1 Sparsity taxonomy | Unstructured, block, N:M, channel, head, layer, and expert sparsity; distinguish storage from executable sparsity. |
| 41.2 Selection criteria | Magnitude, activation/gradient sensitivity, second-order approximations, calibration data, and reconstruction objectives. |
| 41.3 Structural reduction | Width/depth pruning, head/expert removal, low-rank factorization, and architecture extraction. |
| 41.4 Recovery | Distillation, continued training, layerwise reconstruction, and interaction with quantization. |
| 41.5 Adaptive computation | Early exit, token/patch pruning, dynamic depth, conditional routing, and quality-aware execution policies. |
| 41.6 Hardware realization | Supported sparse kernels, index overhead, load imbalance, shape alignment, and failure of theoretical speedup. |

**Verification:** show whether reduced operations translate to wall-clock and energy gains, while reporting quality loss and kernel support. Source anchor: [NVIDIA Model Optimizer](https://github.com/NVIDIA/Model-Optimizer); method-specific papers are mandatory for each manuscript case study.

### 42 — Prefill, decode, KV state, and inference resource models

**Prerequisites:** 14–17, 25, 37–41. **Artifact:** an inference memory/latency estimator validated against measurements.

| Section | Required coverage |
|---|---|
| 42.1 Phase decomposition | Tokenization, prefill, first-token generation, decode, output processing, and client-visible streaming. |
| 42.2 State accounting | Weights, per-layer KV or recurrent state, workspaces, temporary activations, allocator reserve, and fragmentation. |
| 42.3 Cache organization | Contiguous/paged state, block tables, prefix sharing, copy-on-write, eviction, and correctness of reuse keys. |
| 42.4 Cache reduction | Quantization, compression, offload, sliding windows, recomputation, and architectural versus runtime changes. |
| 42.5 Parallel inference | Tensor/pipeline/expert/data parallelism, replicas, collective cost, and batch/concurrency effects. |
| 42.6 Predictive models | Memory ceilings, bandwidth/compute/network bounds, workload distributions, and latency under queueing. |

**Verification:** reconcile theoretical KV bytes with actual allocations and explain the gap; evaluate multiple prompt/output lengths. Source anchors: [PagedAttention](https://arxiv.org/abs/2309.06180), [vLLM](https://docs.vllm.ai/en/stable/).

## Part VIII — Inference Engines and Production Serving

### 43 — Runtime architecture and inference-engine selection

**Prerequisites:** 26–29, 37, 40–42. **Artifact:** a version-pinned engine comparison.

| Section | Required coverage |
|---|---|
| 43.1 Runtime decomposition | Frontend/API, tokenizer/template, request state, scheduler, executor, kernels, cache manager, and distributed workers. |
| 43.2 vLLM | Paged state, scheduling, prefix reuse, compilation, model execution, and supported integration boundaries. |
| 43.3 SGLang | Structured execution, radix/prefix reuse, scheduling, distributed execution, and model/runtime interfaces. |
| 43.4 TensorRT-LLM | Current PyTorch-native runtime, optimized kernels, serving integration, and explicitly separate legacy TensorRT backend workflows. |
| 43.5 Other deployment routes | ONNX Runtime, OpenVINO, MLC-LLM, vendor runtimes, and historical TGI/MII designs as relevant cases. |
| 43.6 Selection methodology | Required model/dtype/hardware support, correctness, p95 latency, goodput, operational complexity, and migration cost. |

**Verification:** hold model weights, template, decoding, hardware, and workload fixed; investigate output differences before ranking speed. Source anchors: [vLLM](https://docs.vllm.ai/en/stable/), [SGLang](https://github.com/sgl-project/sglang), [TensorRT-LLM](https://nvidia.github.io/TensorRT-LLM/overview.html).

### 44 — Scheduling, distributed serving, and disaggregation

**Prerequisites:** 29, 42–43. **Artifact:** a serving-scheduler and placement experiment.

| Section | Required coverage |
|---|---|
| 44.1 Batching | Static/dynamic/continuous batching, iteration-level admission, token budgets, and heterogeneous request lengths. |
| 44.2 Prefill management | Chunked prefill, decode interference, starvation, fairness, and latency–throughput tradeoffs. |
| 44.3 Prefix and state placement | Cache-aware routing, replica locality, eviction, multi-tenant isolation, and shared-prefix economics. |
| 44.4 Disaggregation | Separate prefill/decode pools, KV handoff, transport, serialization, placement, and break-even conditions. |
| 44.5 Distributed execution | Parallel degrees, MoE/expert balance, heterogeneous pools, multi-node collectives, and failure behavior. |
| 44.6 Load adaptation | Bursty traffic, long-tail requests, cancellation, preemption, scheduling classes, and goodput under SLOs. |

**Verification:** identify workloads where disaggregation loses to colocation because state movement or queueing dominates. Source anchors: [DistServe](https://arxiv.org/abs/2401.09670), [SGLang](https://github.com/sgl-project/sglang).

### 45 — Local, edge, and heterogeneous inference

**Prerequisites:** 25, 37, 40–43. **Artifact:** a constrained-device deployment profile.

| Section | Required coverage |
|---|---|
| 45.1 Device constraints | Memory capacity/bandwidth, unified memory, thermal limits, energy, offline operation, and interactive latency. |
| 45.2 llama.cpp stack | GGML computation, GGUF artifacts, model loading, quantization, backend dispatch, and server interfaces. |
| 45.3 Apple and mobile execution | MLX/MLX-LM, Metal, mobile runtimes including ExecuTorch, and available NPU/CPU/GPU paths. |
| 45.4 Portable runtimes | ONNX Runtime, OpenVINO, MLC-LLM, Vulkan/WebGPU routes, and model/operator coverage. |
| 45.5 Hybrid placement | CPU/GPU partitioning, memory mapping, layer offload, NUMA effects, and data-transfer overhead. |
| 45.6 Device evaluation | Warm/cold performance, battery/energy, thermal throttling, context limits, and privacy-preserving operation. |

**Verification:** run a sustained workload, not only a short peak-throughput sample; report memory pressure and thermal behavior. Source anchor: [llama.cpp implementation and backend documentation](https://github.com/ggml-org/llama.cpp).

### 46 — Admission control, routing, autoscaling, and service contracts

**Prerequisites:** 06, 42–45. **Artifact:** an SLO-driven serving control-plane design.

| Section | Required coverage |
|---|---|
| 46.1 Service contracts | TTFT, token-delivery latency, completion deadlines, availability, quality thresholds, quotas, and cancellation semantics. |
| 46.2 Admission and backpressure | Bounded queues, request/token quotas, predicted cost, overload rejection, and fairness. |
| 46.3 Routing | Model selection, capability/cost routing, provider routing, cache affinity, geography, and data-access constraints. |
| 46.4 Autoscaling | Queue/load signals, warm capacity, model-loading delay, hysteresis, scale-down drain, and KV-state implications. |
| 46.5 Resilience | Deadlines, bounded retries, retry amplification, circuit breakers, failover, idempotency, and duplicate work. |
| 46.6 API behavior | Authentication, streaming, partial failures, structured errors, version contracts, and client-observed metrics. |

**Verification:** replay bursts and long requests; demonstrate overload recovery without unbounded queues or retry storms. Source anchors: [vLLM deployment documentation](https://docs.vllm.ai/en/stable/), [TensorRT-LLM integration overview](https://nvidia.github.io/TensorRT-LLM/overview.html).

### 47 — Observability, deployment changes, and incident recovery

**Prerequisites:** 30, 43–46. **Artifact:** an instrumented deployment and rollback runbook.

| Section | Required coverage |
|---|---|
| 47.1 Telemetry | Request traces, queue time, prefill/decode timing, token counts, hardware counters, and errors by version. |
| 47.2 Quality observability | Task outcomes, user corrections, drift, safety events, abstentions, and delayed ground truth. |
| 47.3 Release control | Immutable model/tokenizer/engine artifacts, shadow traffic, canaries, staged rollout, and compatibility checks. |
| 47.4 Regression localization | Data/model changes, quantization, templates, kernel/compiler changes, caching, and serving policy. |
| 47.5 Recovery | Traffic drain, rollback, cache invalidation, state migration, replay, and degraded-mode operation. |
| 47.6 Operational learning | Incident timelines, counterfactual replay, root-cause evidence, remediation, and updated test sets. |

**Verification:** inject a template or cache-key regression and show that monitoring localizes it and rollback restores the prior behavior. Source anchors: [vLLM](https://docs.vllm.ai/en/stable/), [MLPerf measurement framework](https://mlcommons.org/benchmarks/inference-datacenter/).

### 48 — Capacity planning, benchmarking, and lifecycle economics

**Prerequisites:** 06, 21, 25, 42–47. **Artifact:** a workload-specific capacity/cost model.

| Section | Required coverage |
|---|---|
| 48.1 Workload specification | Arrival process, prompt/output distributions, conversation depth, cache reuse, model mix, and concurrency. |
| 48.2 Load-test methodology | Open-loop versus closed-loop load, warmup, duration, coordinated omission, saturation, and measurement boundaries. |
| 48.3 Metrics | TTFT, TPOT, ITL distributions, E2E latency, throughput, goodput, memory use, utilization, and error rates. |
| 48.4 Queueing and capacity | Little's law, utilization headroom, tail amplification, admission policy, and failure-capacity reserves. |
| 48.5 Economics | Cost per accepted task/token, training amortization, idle capacity, redundancy, retries, tools, energy, and storage/network costs. |
| 48.6 External measurements | MLPerf, Artificial Analysis, Epoch, and reproducible internal measurements; distinguish model from endpoint and system. |

**Verification:** test capacity predictions on a held-out traffic trace and report the cost of meeting p95/p99 SLOs. Source anchors: [MLPerf](https://mlcommons.org/benchmarks/inference-datacenter/), [Artificial Analysis methodology](https://artificialanalysis.ai/methodology), [Epoch AI](https://epoch.ai/data).

# Volume III — Grounded and Interactive Intelligence

## Part IX — Retrieval, Context, and Agent Systems

### 49 — Retrieval models, indexing, and evidence access

**Prerequisites:** 06–12, 18, 48. **Artifact:** a versioned retrieval pipeline and recall/latency evaluation.

| Section | Required coverage |
|---|---|
| 49.1 Corpus construction | Parsing, semantic units, chunking, tables/code, document structure, stable IDs, and access-controlled metadata. |
| 49.2 Retrieval representations | Sparse lexical retrieval, BM25, dense embeddings, contrastive training, hard negatives, and domain adaptation. |
| 49.3 Search infrastructure | Exact versus ANN search, HNSW, IVF/PQ, index memory, updates, deletions, and replication. |
| 49.4 Ranking and fusion | Hybrid retrieval, score normalization, rank fusion, cross-encoder reranking, and late interaction. |
| 49.5 Query and evidence strategy | Rewriting, decomposition, multi-hop retrieval, time filters, structured queries, and relational/graph retrieval. |
| 49.6 Retrieval evaluation | Recall@k, ranking quality, evidence coverage, freshness, access leakage, latency, and cost. |

**Verification:** evaluate retrieval independently of generation, including deliberately missing evidence and inaccessible documents. Source anchors: [DPR](https://arxiv.org/abs/2004.04906), [RAG](https://arxiv.org/abs/2005.11401).

### 50 — Context construction and retrieval-augmented generation

**Prerequisites:** 10, 15, 37–38, 49. **Artifact:** a context compiler with evidence provenance.

| Section | Required coverage |
|---|---|
| 50.1 Context assembly | Instructions, user input, retrieved evidence, conversation history, tool outputs, and explicit trust boundaries. |
| 50.2 Context budgeting | Token allocation, evidence ordering, deduplication, compression, summaries, and retained source references. |
| 50.3 Generation strategies | Single-pass RAG, iterative retrieval, query planning, corrective retrieval, and answer revision. |
| 50.4 Grounding and abstention | Claim–evidence alignment, citations, conflict resolution, missing evidence, confidence, and selective answering. |
| 50.5 Retrieval versus context length | Equal-quality comparisons, evidence density, freshness, long-document reasoning, and cost. |
| 50.6 End-to-end evaluation | Retrieval failure, context omission, unsupported generation, citation errors, and changes under corpus updates. |

**Verification:** label failures by stage and test whether oracle retrieval or oracle context fixes the final answer. Source anchors: [RAG](https://arxiv.org/abs/2005.11401), [HELM](https://arxiv.org/abs/2211.09110).

### 51 — Tool use, protocol interfaces, and reliable execution

**Prerequisites:** 10–11, 37, 46–47, 50. **Artifact:** a typed tool-execution contract.

| Section | Required coverage |
|---|---|
| 51.1 Tool representation | Function schemas, types, capabilities, required arguments, result schemas, and semantic preconditions. |
| 51.2 Routing and selection | Tool discovery, retrieval over tools, constrained selection, argument grounding, and unsupported requests. |
| 51.3 Protocol boundaries | MCP and other interfaces; transport, lifecycle, authentication/authorization, version negotiation, and capability discovery. |
| 51.4 Execution correctness | Validation, timeouts, cancellation, retries, idempotency, asynchronous completion, and result interpretation. |
| 51.5 Side-effect management | Dry runs, approval boundaries, transactional updates, compensating actions, resource isolation, and auditability. |
| 51.6 Tool security | Prompt injection through results, secret handling, least privilege, confused-deputy behavior, and sandbox escape surfaces. |

**Verification:** test duplicate delivery, timeouts, malformed outputs, and partial side effects; confirm that protocol access does not substitute for authorization. Source anchors: [MCP specification](https://modelcontextprotocol.io/specification/2026-07-28), [τ-bench](https://arxiv.org/abs/2406.12045).

### 52 — Planning, control flow, verification, and recovery

**Prerequisites:** 36, 38, 50–51. **Artifact:** a bounded agent controller with explicit state transitions.

| Section | Required coverage |
|---|---|
| 52.1 Controller families | Deterministic workflows, reactive loops, plan–execute architectures, search-based planning, and hierarchical decomposition. |
| 52.2 State and constraints | Goal state, observations, partial observability, action preconditions, budgets, and stopping criteria. |
| 52.3 Plan verification | Dependency checks, executable tests, constraint solvers, evidence review, and independent outcome verification. |
| 52.4 Adaptive execution | Replanning, reflection supported by new evidence, tool substitution, escalation, and uncertainty-aware stopping. |
| 52.5 Recovery | Partial progress, checkpoints, retries, compensating actions, environmental drift, and irrecoverable failures. |
| 52.6 Performance analysis | Success rate, steps to completion, wasted tool calls, E2E latency, cost, and fault sensitivity. |

**Verification:** compare a fixed workflow, a reactive agent, and a planner under equal tools and budgets; inject environmental changes. Source anchors: [ReAct](https://arxiv.org/abs/2210.03629), [Anthropic's agent design account](https://www.anthropic.com/engineering/building-effective-agents).

### 53 — Agent memory, persistent state, and long-horizon consistency

**Prerequisites:** 24, 42, 49–52. **Artifact:** a memory/state policy with provenance and deletion semantics.

| Section | Required coverage |
|---|---|
| 53.1 Memory taxonomy | Working context, episodic events, semantic facts, procedural knowledge, plans, external state, and parametric memory. |
| 53.2 Write policies | Selection, extraction, confidence, provenance, timestamps, permissions, and consolidation. |
| 53.3 Retrieval and use | Relevance, recency, salience, contradiction handling, source grounding, and memory-aware context assembly. |
| 53.4 State consistency | Authoritative state versus summaries, transactional updates, stale reads, versioning, and concurrent access. |
| 53.5 Forgetting and deletion | Expiry, retention, invalidation, correction, privacy boundaries, and contaminated-memory removal. |
| 53.6 Long-horizon evaluation | Cross-session tasks, cumulative errors, false memories, adaptation, interference, and memory utility per cost. |

**Verification:** insert outdated and contradictory records; test whether the agent recovers the current authoritative state and explains provenance. Source anchors: [RAG](https://arxiv.org/abs/2005.11401) for external retrieval, [catastrophic forgetting](https://arxiv.org/abs/1612.00796) for the distinct parametric problem. The proposed memory architecture is an engineering synthesis.

### 54 — Multi-agent coordination and system-level evaluation

**Prerequisites:** 06, 36, 48, 51–53. **Artifact:** a coordination experiment with a budget-matched single-agent baseline.

| Section | Required coverage |
|---|---|
| 54.1 Decomposition | Independent tasks, dependent tasks, specialist roles, planner/worker designs, and conditions for useful parallelism. |
| 54.2 Communication | Message schemas, shared artifacts, context transfer, evidence provenance, and synchronization. |
| 54.3 Shared state | Ownership, locks/version checks, conflict resolution, duplicate work, and irreversible side effects. |
| 54.4 Coordination policies | Centralized versus decentralized control, delegation, voting/debate, critic roles, and correlated failures. |
| 54.5 Resource control | Token/tool budgets, concurrent execution, stragglers, critical paths, cancellation, and runaway coordination. |
| 54.6 Evaluation | End-task success, robustness, cost, latency, reproducibility, and attribution of gains to decomposition versus extra compute. |

**Verification:** compare one agent with a larger compute budget against multiple agents with the same total budget; measure coordination overhead. Source anchors: [ReAct](https://arxiv.org/abs/2210.03629) and [τ-bench](https://arxiv.org/abs/2406.12045) anchor agent interaction/evaluation concepts. Multi-agent superiority is a hypothesis to test, not a premise.

## Part X — Multimodal, World, and Embodied Models

### 55 — Vision-language models and document intelligence

**Prerequisites:** 18, 31, 49–50. **Artifact:** a vision/document evaluation with component ablations.

| Section | Required coverage |
|---|---|
| 55.1 Visual representations | Patches, multi-resolution processing, cropping/tiling, spatial positions, and token-budget effects. |
| 55.2 Alignment and fusion | Contrastive pretraining, captioning, projectors/resamplers, cross-attention, and backbone adaptation. |
| 55.3 Instruction and reasoning data | Visual QA, grounding, counting, diagrams, charts, OCR, and compositional instructions. |
| 55.4 Document structure | Layout, reading order, tables, formulas, figures, page references, and multimodal retrieval. |
| 55.5 Reliability | Hallucinated visual evidence, resolution failures, spatial errors, distractors, and answer-language confounds. |
| 55.6 Deployment | Image preprocessing, token estimates, batching, cache boundaries, and quality/latency under resolution changes. |

**Verification:** separate OCR errors, perception errors, and reasoning errors using controlled inputs and oracle-text baselines. Source anchors: [CLIP](https://arxiv.org/abs/2103.00020), [BLIP-2](https://arxiv.org/abs/2301.12597), [Qwen multimodal releases](https://github.com/QwenLM/Qwen3.8).

### 56 — Audio, speech, and real-time interaction

**Prerequisites:** 18, 31, 42, 46–47. **Artifact:** an audio-language latency and task-quality profile.

| Section | Required coverage |
|---|---|
| 56.1 Audio representation | Waveforms, spectrograms, learned features, codec tokens, sample rates, and temporal resolution. |
| 56.2 Task families | Speech recognition, speech synthesis, audio understanding, spoken dialogue, and speech-to-speech systems. |
| 56.3 Architecture | Cascaded versus integrated models, text/semantic/acoustic representations, and alignment. |
| 56.4 Streaming interaction | Chunking, turn detection, interruptions, full-duplex behavior, endpointing, and partial hypotheses. |
| 56.5 Evaluation | Transcription accuracy, semantic correctness, speaker/acoustic robustness, response delay, and perceptual quality. |
| 56.6 Systems constraints | Codec latency, buffering, network jitter, synchronization, device compute, and graceful degradation. |

**Verification:** decompose microphone-to-response latency and evaluate interruptions, background noise, accents, and packet delays. Source anchor: [Qwen2.5-Omni](https://github.com/QwenLM/Qwen2.5-Omni).

### 57 — Video, temporal reasoning, and streaming multimodality

**Prerequisites:** 15, 18, 55–56. **Artifact:** a temporally grounded multimodal evaluation.

| Section | Required coverage |
|---|---|
| 57.1 Temporal representations | Frame sampling, clips, motion information, event boundaries, timestamps, and temporal compression. |
| 57.2 Cross-modal alignment | Audio/video synchronization, subtitles, speech events, missing streams, and causal timing. |
| 57.3 Task structure | Temporal localization, event ordering, causal questions, long-video summarization, and state tracking. |
| 57.4 Streaming inference | Bounded buffers, rolling context, state updates, delayed evidence, and incremental answers. |
| 57.5 Evaluation | Temporal grounding, counterfactual clips, sampling sensitivity, distractor frames, and leakage from text/audio. |
| 57.6 Compute and deployment | Tokens per second of media, batching, encoder reuse, recurrent state, network transfer, and real-time deadlines. |

**Verification:** alter temporal order while holding frames fixed; determine whether performance depends on actual sequence structure. Source anchors: [Gemini 2.5](https://arxiv.org/abs/2507.06261), [V-JEPA 2](https://arxiv.org/abs/2506.09985).

### 58 — Generative multimodal models and alternative generation paths

**Prerequisites:** 04, 18, 25–28, 37–41, 55–57. **Artifact:** an objective/sampler/runtime comparison.

| Section | Required coverage |
|---|---|
| 58.1 Generative representations | Pixel, latent, patch, codec, and discrete-token generation; autoencoders and representation bottlenecks. |
| 58.2 Objectives | Autoregressive generation, diffusion, score-based formulations, flow matching, and masked/discrete generation. |
| 58.3 Conditioning | Text, image, audio, video, spatial controls, multimodal prompts, and cross-attention or joint backbones. |
| 58.4 Sampling and acceleration | Iterative solvers, step budgets, guidance, distillation, caching, and quality/diversity effects. |
| 58.5 Joint understanding and generation | Shared representations, task interference, unified models, and modality-specific execution. |
| 58.6 Evaluation and systems | Fidelity, controllability, temporal consistency, latency, memory, and resource models that differ from autoregressive decoding. |

**Verification:** compare at a fixed quality or fixed compute budget and document which metrics fail to capture semantic/control errors. Source anchors: [π0's flow-based policy formulation](https://arxiv.org/abs/2410.24164) for a concrete flow-model application, [TensorRT-LLM generation/runtime scope](https://nvidia.github.io/TensorRT-LLM/overview.html). General diffusion/flow derivations require their own primary sources in the manuscript.

### 59 — Predictive representations, JEPA, and world models

**Prerequisites:** 17–18, 24, 38, 57–58. **Artifact:** a representation-prediction experiment and bounded planning study.

| Section | Required coverage |
|---|---|
| 59.1 World-model problem | Observations, latent state, actions, dynamics, uncertainty, partial observability, and deployment environment. |
| 59.2 Predictive learning | Observation reconstruction versus latent prediction; invariance, sufficiency, and loss of task-relevant detail. |
| 59.3 JEPA-family mechanisms | Context/target representations, predictors, target updates, masking, collapse avoidance, and evaluation protocol. |
| 59.4 Action-conditioned dynamics | Multi-step prediction, planning in latent space, model-predictive control, and model error accumulation. |
| 59.5 Physical and cognitive interpretation | Object permanence, temporal structure, action consequences, and memory analogies; distinguish tests from interpretation. |
| 59.6 Limitations and transfer | Observational shortcuts, out-of-distribution dynamics, uncertainty calibration, real-world control validity, and sim-to-real gaps. |

**Verification:** test downstream prediction and action-conditioned planning separately; low latent loss alone is insufficient evidence of physical understanding. Source anchor: [V-JEPA 2](https://arxiv.org/abs/2506.09985).

### 60 — Vision-language-action policies and embodied learning

**Prerequisites:** 18, 24, 34–36, 52, 55–59. **Artifact:** a simulation-first embodied-policy evaluation.

| Section | Required coverage |
|---|---|
| 60.1 Policy interfaces | Vision/language/proprioception inputs; discrete/continuous actions; coordinate systems, units, and control frequency. |
| 60.2 Action generation | Autoregressive action tokens, action chunking, diffusion/flow policies, hierarchical actions, and low-level controllers. |
| 60.3 Learning pathways | Demonstration learning, imitation, offline/online RL, multi-task mixtures, and embodiment adaptation. |
| 60.4 World-model integration | Predictive state, planning, closed-loop correction, uncertainty, and model/controller interfaces. |
| 60.5 Simulation and transfer | Domain randomization, system identification, resets, dynamics mismatch, sensor noise, and sim-to-real validation. |
| 60.6 Real-time assurance | End-to-end control delay, action limits, intervention policies, failure recovery, success/generalization metrics, and deployment authorization. |

**Verification:** report task success and failure severity under controlled perturbations; validate timing and physical action constraints before real hardware execution. Source anchors: [OpenVLA](https://arxiv.org/abs/2406.09246), [π0](https://arxiv.org/abs/2410.24164), [V-JEPA 2](https://arxiv.org/abs/2506.09985).

## Part XI — Evaluation, Interpretability, and Deployment Assurance

### 61 — Capability portfolios and benchmark validity

**Prerequisites:** 06, 21, 31–40, 49–60. **Artifact:** a versioned evaluation portfolio with coverage and contamination analysis.

| Section | Required coverage |
|---|---|
| 61.1 Capability dimensions | Knowledge, reasoning, mathematics, coding, instruction following, multilinguality, multimodality, and long-context use. |
| 61.2 Benchmark families | MMLU/MMLU-Pro, GPQA, HLE, ARC, BBH, GSM8K, MATH, AIME, HumanEval, MBPP, and domain-specific tasks. |
| 61.3 Version and protocol control | Dataset revision, prompt/scaffold, answer extraction, sampling, tool access, reasoning budget, and grading. |
| 61.4 Validity threats | Contamination, saturation, selection effects, shortcuts, mislabeled items, and narrow distribution coverage. |
| 61.5 Robustness and transfer | Paraphrases, perturbations, distribution shift, language slices, rare tasks, and calibrated abstention. |
| 61.6 Reporting | Per-task and aggregate results, uncertainty, sample sizes, cost/latency, and restrictions on cross-paper ranking. |

**Verification:** rerun the same checkpoint under altered prompts/budgets and quantify ranking sensitivity. Source anchors: [HELM](https://arxiv.org/abs/2211.09110), [LM Evaluation Harness](https://github.com/EleutherAI/lm-evaluation-harness).

### 62 — Human preference, model judges, and uncertainty

**Prerequisites:** 02, 06, 32–33, 61. **Artifact:** a human/judge evaluation with calibration and disagreement analysis.

| Section | Required coverage |
|---|---|
| 62.1 Human evaluation design | Rubrics, blind comparisons, sampling, annotator expertise, consent, and repeated items. |
| 62.2 Pairwise aggregation | Bradley–Terry/Elo-style approaches, ties, confidence intervals, population effects, and non-transitivity. |
| 62.3 Model-as-judge | Absolute/pairwise grading, reference answers, judge prompts, ensembles, and independent validation. |
| 62.4 Judge failure modes | Position, verbosity, style and self-preference biases; prompt injection; domain limitations; and correlated errors. |
| 62.5 Confidence and abstention | Calibration, selective risk, uncertainty proxies, answer confidence, and limits of verbal self-assessment. |
| 62.6 Interpreting scores | User preference versus truth, usefulness versus safety, endpoint versus model, and benchmark sampling scope. |

**Verification:** randomize answer order and control length/style; measure agreement with domain-qualified adjudication. Source anchors: [Chatbot Arena methodology](https://arxiv.org/abs/2403.04132), [Artificial Analysis methodology](https://artificialanalysis.ai/methodology).

### 63 — Agent, retrieval, multimodal, and system reliability evaluation

**Prerequisites:** 48–62. **Artifact:** an end-to-end reliability report with stage-level attribution.

| Section | Required coverage |
|---|---|
| 63.1 Interactive benchmarks | SWE-bench variants, Terminal-Bench, τ-bench families, browser/computer-use tasks, and environment pinning. |
| 63.2 Repeated-run reliability | Success variance, pass@k versus repeated consistency measures, flaky tools, and nondeterministic environments. |
| 63.3 Stage attribution | Retrieval recall, grounding, planning, tool execution, state consistency, verification, and final outcome. |
| 63.4 Stress and fault testing | Delays, timeouts, stale data, contradictions, missing modalities, overload, and partial failures. |
| 63.5 Performance/quality coupling | Long outputs, retries, search depth, budget limits, cache behavior, and cost per completed task. |
| 63.6 Realistic evaluation | User/task distributions, long horizons, adversarial content, unseen workflows, and offline-to-online transfer. |

**Verification:** report task success together with policy compliance, cost, latency, and repeated-run consistency. Source anchors: [SWE-bench](https://arxiv.org/abs/2310.06770), [τ-bench](https://arxiv.org/abs/2406.12045), [MLPerf](https://mlcommons.org/benchmarks/inference-datacenter/).

### 64 — Mechanistic interpretability and causal model analysis

**Prerequisites:** 02, 05, 13–18, 32, 61–62. **Artifact:** a mechanistic hypothesis with intervention controls.

| Section | Required coverage |
|---|---|
| 64.1 Behavioral versus mechanistic evidence | Correlation, probing, causal intervention, localization, and limits of output-only explanations. |
| 64.2 Representation analysis | Activations, residual streams, attention patterns, superposition, feature directions, and representational similarity. |
| 64.3 Feature decomposition | Sparse autoencoders, dictionary learning, sparsity/reconstruction tradeoffs, feature splitting, and missing mechanisms. |
| 64.4 Causal tracing | Activation/path patching, ablation, counterfactual interventions, circuit hypotheses, and distributional artifacts. |
| 64.5 Attribution graphs | Replacement-model approaches, cross-layer mechanisms, faithful explanations, and intervention-based validation. |
| 64.6 Applications and limits | Debugging, behavior modification, safety signals, representation drift, and failure of mechanistic generalization. |

**Verification:** validate a proposed circuit by intervention and out-of-distribution counterexamples; report reconstruction and replacement-model limits. Source anchor: [Circuit Tracing](https://transformer-circuits.pub/2025/attribution-graphs/methods.html).

### 65 — Security, privacy, safety, and adversarial robustness

**Prerequisites:** 07–08, 24, 32–36, 46–47, 51–64. **Artifact:** a threat model and evidence-backed mitigation evaluation.

| Section | Required coverage |
|---|---|
| 65.1 Threat surfaces | Training data, weights, dependencies, retrieval, prompts, tools, persistent memory, interfaces, and infrastructure. |
| 65.2 Training/model attacks | Poisoning, backdoors, extraction, membership inference, memorization, and malicious artifacts. |
| 65.3 Runtime attacks | Jailbreaks, indirect prompt injection, tool-output manipulation, credential exposure, and unauthorized actions. |
| 65.4 Controls | Isolation, access control, provenance, secret separation, bounded capabilities, output/action checks, and monitoring. |
| 65.5 Safety evaluation | Harmful-capability/behavior testing, false refusals, robustness, adversarial evaluation, and human oversight. |
| 65.6 Residual risk | Distribution shift, adaptive adversaries, attack/defense evaluation budgets, and limitations of benchmark assurance. |

**Verification:** test mitigations on held-out attacks and legitimate workloads; report both attack success and useful-task degradation. Source anchors: [Anthropic research](https://www.anthropic.com/research), [MCP specification](https://modelcontextprotocol.io/specification/2026-07-28), [Constitutional AI](https://arxiv.org/abs/2212.08073).

### 66 — Release decisions, reproducibility, and research-to-production closure

**Prerequisites:** 06, 30, 47–48, 61–65. **Artifact:** a complete release dossier and reproducibility package.

| Section | Required coverage |
|---|---|
| 66.1 Evidence synthesis | Objective, baseline, intervention, controlled results, uncertainty, failure cases, and unresolved assumptions. |
| 66.2 Artifact integrity | Dataset/checkpoint/tokenizer/engine versions, configurations, evaluation manifests, licenses, and provenance. |
| 66.3 Release gates | Capability floors, regression ceilings, SLOs, security tests, monitoring, rollback, and accountable authorization. |
| 66.4 Deployment strategy | Shadow/canary stages, experiment population, outcome monitoring, data drift, and rollback criteria. |
| 66.5 Reproducibility and disclosure | Executable instructions, unavailable artifacts, compute requirements, confidential elements, and public-claim boundaries. |
| 66.6 Research feedback | Negative results, unresolved mechanisms, updated hypotheses, collected evidence, and subsequent experiments. |

**Verification:** an independent reviewer must reproduce the evaluation or identify exactly which missing artifacts prevent it. Source anchors: [HELM](https://arxiv.org/abs/2211.09110), [ML Evaluation Harness](https://github.com/EleutherAI/lm-evaluation-harness), [CS336](https://cs336.stanford.edu/).

## Shared mathematical contract

These equations establish accounting conventions for the book. They are not substitutes for the detailed derivations in the corresponding chapters. Symbols are local to each row; logarithms are natural unless specified otherwise.

| Location | Formulation and assumptions |
|---|---|
| 04, 19, 31 — likelihood | For parameters θ, token sequence x of length T, and conditioning c: pθ(x given c) = ∏ from t=1 to T of pθ(x_t given x_<t, c). With a binary target mask m_t, token-mean loss is −Σ_t m_t log pθ(x_t given x_<t, c) / Σ_t m_t. Define whether the mean is over tokens, sequences, or ranks. |
| 21 — scaling | For parameter count N and training-token count D, an empirical fit may use L(N,D) = E + A N^(−α) + B D^(−β). E, A, B, α, β are fitted parameters. C ≈ 6ND is a dense-Transformer training approximation under stated accounting assumptions, not a universal MoE, long-context, or multimodal cost formula. |
| 25 — roofline | For arithmetic intensity I in FLOPs/byte, peak compute P_peak in FLOPs/s, and bandwidth B_mem in bytes/s: P_achieved ≤ min(P_peak, I B_mem). This is a bound; launch, dependency, occupancy, and communication effects can further reduce performance. |
| 29–30 — training memory | Memory = parameters + gradients + optimizer states + activations + communication buffers + runtime/workspace overhead. Apply the actual sharding/replication factor to each term separately. A single bytes-per-parameter constant is insufficient when dtypes and sharding differ. |
| 34–35 — RL | For prompt distribution 𝒟, policy πθ, sequence y, scalar reward R, reference policy π_ref, and β ≥ 0: J(θ) = E over x~𝒟, y~πθ [R(x,y)] − β E over x~𝒟 [KL(πθ(· given x) ∥ π_ref(· given x))]. Specify sequence versus token factorization, estimator, clipping, baseline, and masking before implementing a particular algorithm. |
| 39 — distillation | For teacher p_T and student p_S softened by temperature τ, a common loss is λ τ² KL(p_T^τ ∥ p_S^τ) + (1−λ) CE(y,p_S), where 0 ≤ λ ≤ 1. Response-only distillation does not require teacher logits and should not be described as this exact loss. |
| 42 — KV storage | For a conventional cache with layer count L, B equal-length sequences, length S, H_KV KV heads, head dimension d_h, and b bytes/value: M_KV = 2 L B S H_KV d_h b bytes, before paging/metadata overhead. For unequal lengths use Σ_i S_i. This formula does not directly describe MLA, recurrent state, layer-varying windows, or compressed caches. |
| 48 — latency | Let request start be t₀ and token delivery times be t₁,…,t_n. TTFT = t₁−t₀; ITL_i = t_i−t_(i−1), i≥2; TPOT = (t_n−t₁)/(n−1) for n>1. TPOT is an average, not a tail-ITL statistic. State whether delivery is client-visible or measured inside the server. |
| 48 — queueing | In a stable system over consistent boundaries, mean in-flight requests N̄ = arrival rate λ × mean residence time W. This is Little's law, not a p99-latency prediction. |
| 48, 63 — economics | Cost per accepted task = total relevant compute, infrastructure, generation, retry, retrieval, and tool cost / number of tasks meeting the declared quality and service criteria. Report the denominator and attribution window. |

**MATHEMATICALLY-DERIVED:** likelihood factorization, the stated loss normalizations, KV tensor storage, and timing identities follow from their definitions. **PAPER-REPORTED MODEL FAMILY:** empirical scaling forms require fitted assumptions and validation. **ENGINEERING APPROXIMATION:** roofline and simplified compute/memory models require measurement of omitted overheads.

For example, with L=32 layers, B=8 sequences, S=8,192 tokens, H_KV=8, d_h=128, and b=2 bytes, the conventional KV tensors alone occupy **8,589,934,592 bytes = 8 GiB**. This is an illustrative calculation, not a specification for any named model. Cache metadata, workspaces, weights, and allocator overhead are additional.

## Integrated experiments and reading routes

The experiments below connect chapters into complete studies. They are proposed deliverables for the book, not completed benchmark results.

| Study | Chapter route | Required outcome |
|---|---|---|
| A — Build and audit a base model | 01–12 → 13–21 → 25–30 → 61 | A reproducible tokenizer/data/training pipeline; contamination report; scaling pilot; matched-budget baseline. |
| B — Adapt a specialist model | 06–12 → 22–24 → 31–33 → 39–40 → 61–62 | Compare retrieval, continued pretraining, full tuning, and adapters; report retention, quality, and cost. |
| C — Train a reasoning policy | 11 → 31–36 → 37–39 → 61–63 | Independent verifier; SFT/RL ablations; fixed-budget pass@1/pass@k; reward-exploitation analysis. |
| D — Build a serving system | 14–17 → 25–29 → 37–48 → 63, 66 | Predict/measure memory; compare engines; load-test SLOs; inject faults; demonstrate rollback. |
| E — Build a grounded agent | 46–54 → 61–66 | Evidence-aware context construction; typed tools; persistent state; retry/side-effect tests; budget-matched baselines. |
| F — Study embodied transfer | 18, 24, 34–36 → 55–60 → 63–66 | Perception/dynamics/action ablations; simulation perturbations; real-time constraints; documented transfer limits. |

**Reader entry routes:** model researchers can begin with Volume I and Part VI; systems engineers with Chapters 01–06, 13–17, and Volume II; application/agent engineers with Chapters 06, 10, 37–38, 42–54, and 61–66. Cross-referenced prerequisites still apply. These routes change reading order, not chapter ownership.

# Reference Appendices

## Appendix A — Research organizations, model families, and disclosure

Organizations are provenance indexes. Their published methods enter the appropriate technical chapters. The table defines coverage, not a ranking or an assertion that every listed family has an equally complete public training recipe.

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

**Required model record:** exact model identifier; release date; access date; architecture source; total and activated parameters when disclosed; tokenizer; training stages and data disclosure; numerical format; context protocol; license; evaluated task/scaffold; serving configuration; availability of weights/data/code; reproducibility limits. Unknown values are null with **NOT-DISCLOSED** or **UNVERIFIED**, not inferred from brand or model name.

The case-study sequence is mechanism-driven: dense reference model → sparse/latent-attention model → SFT/preference model → reasoning policy → distilled/quantized student → deployed agent. A newly released model belongs at the relevant step only after its evidence is assessed.

## Appendix B — Software ecosystem and implementation roles

The entries below are implementation coverage targets. Inclusion does not certify current maintenance, universal hardware support, or superiority. Each worked example must pin a release or commit and verify the features it actually uses.

| Layer | Representative projects / objects | Role and chapter ownership |
|---|---|---|
| Model and data interchange | Hugging Face Hub, model/dataset cards, safetensors, GGUF | Registries/documentation versus tensor/container formats; 07, 10–12, 40, 43 |
| Data tooling | Datasets, Tokenizers, SentencePiece, corpus-specific pipelines | Loading/transformation/tokenization; 07–12 |
| Model frameworks | Transformers, PyTorch, JAX | Model implementations and tensor/autodiff frameworks; 05, 13–20, 28 |
| Training launch and adaptation | Accelerate, PEFT, torchtune, Axolotl, LlamaFactory, Unsloth | Launch/adaptation/recipe layers; implementation boundaries differ; 23, 30–31 |
| Distributed training | Megatron-Core, DeepSpeed, FSDP/DTensor, TorchTitan, MaxText, NeMo, ColossalAI | Parallel execution, state distribution, and training recipes; 28–30 |
| Historical distributed-system studies | Alpa and other paper-specific systems | Algorithmic/partitioning case studies; verify maintenance separately; 28–29 |
| Post-training | TRL, verl, OpenRLHF, AReaL, slime | Trainer and rollout/environment orchestration roles; 31–36 |
| GPU kernel programming | CUDA, ROCm/HIP, Triton, CUTLASS, CuTe/CuTeDSL, Pallas, TileLang, ThunderKittens | Languages, compiler interfaces, and kernel libraries; 25–28 |
| Model kernels | FlashAttention, FlashInfer, FlashMLA, Liger Kernel, xFormers | Operator implementations with shape/dtype/device constraints; 26–27 |
| Graph compilation | torch.compile/Inductor, XLA, MLIR, TVM | Capture, transformation, lowering, and runtime integration; 28 |
| Communication | NCCL, RCCL, NVSHMEM, MPI, UCX | Collectives, one-sided communication, transport and runtime interfaces; 29–30 |
| Quantization/compression | TorchAO, NVIDIA ModelOpt, bitsandbytes; GPTQ/AWQ method implementations | Separate algorithm, artifact format, transformation tool, and execution kernel; 23, 39–41 |
| Datacenter inference | vLLM, SGLang, TensorRT-LLM | Model runtime/serving frameworks with overlapping responsibilities; 42–44 |
| Portable inference | ONNX Runtime, OpenVINO, MLC-LLM | Model representation, compilation, and target runtime routes; 43, 45 |
| Local inference | llama.cpp, GGML, MLX, MLX-LM, ExecuTorch | Engine, tensor library/framework, model layer, and edge runtime; 45 |
| Model-management interfaces | Ollama and comparable products | Packaging, model lifecycle, and serving interfaces; 43, 45–47 |
| Serving control/integration | NVIDIA Dynamo, Triton Inference Server, routing/scheduling infrastructure | Disaggregated serving/control integration; distinguish Triton Server from Triton kernel language; 43–47 |
| Evaluation | LM Evaluation Harness, HELM, benchmark-specific harnesses, MLPerf tooling | Reproducible task/system measurement; 06, 48, 61–63 |
| Tool connectivity | MCP implementations and typed tool adapters | Interoperability interfaces, not planning algorithms or authorization substitutes; 51–54 |
| Legacy/migration coverage | TGI, DeepSpeed-MII, older TensorRT-backend workflows, AutoGPTQ/AutoAWQ-era integrations | Retain important mechanisms and migration lessons; verify each project's status before adoption |

Primary implementation anchors checked for this edition: [Datasets](https://huggingface.co/docs/datasets/index), [PEFT](https://huggingface.co/docs/peft/index), [TRL](https://huggingface.co/docs/trl/main/index), [Megatron](https://github.com/NVIDIA/Megatron-LM), [TorchTitan](https://github.com/pytorch/torchtitan), [MaxText](https://github.com/AI-Hypercomputer/maxtext), [verl](https://github.com/verl-project/verl), [AReaL](https://github.com/areal-project/AReaL), [TorchAO](https://github.com/pytorch/ao), [ModelOpt](https://github.com/NVIDIA/Model-Optimizer), [Triton](https://triton-lang.org/main/index.html), [vLLM](https://docs.vllm.ai/en/stable/), [SGLang](https://github.com/sgl-project/sglang), [TensorRT-LLM](https://nvidia.github.io/TensorRT-LLM/overview.html), [llama.cpp](https://github.com/ggml-org/llama.cpp), and [LM Evaluation Harness](https://github.com/EleutherAI/lm-evaluation-harness).

**Comparison record:** model revision; tokenizer/template; precision; framework and engine revision; enabled kernels; device/driver/compiler; parallel configuration; prompt/output distribution; arrival process; cache state; warmup; quality check; latency/throughput units; errors; confidence intervals. “Supports feature X” must include the model/backend/dtype combinations that were actually verified.

## Appendix C — Dataset atlas and training-role taxonomy

A dataset is not identified solely by where it appears in the training cycle. Its provenance, modality, supervision, domain, language, generation method, version, and restrictions are independent attributes.

| Training/evaluation role | Data unit and supervision | Required distinctions |
|---|---|---|
| Base pretraining | Documents or multimodal sequences; self-supervised targets | Source mix, deduplication, document boundaries, token counts, language/domain coverage |
| Continued/mid-training | Domain/length/task-focused sequences | Starting checkpoint, exposure changes, replay mixture, and retention evaluation |
| SFT | Context–target examples or conversations | Demonstrator/generator, target masks, tool turns, task coverage, and template |
| Preferences | Chosen/rejected pairs, rankings, or scalar feedback | Annotator population, rubric, ties, noise, and provenance |
| Reward-model training | Examples with preference/outcome/process labels | Label semantics, calibration distribution, and evaluator independence |
| RL rollout | Policy/environment trajectories | Policy revision, sampling settings, state/action/observation sequence, rewards, and termination |
| Verifier training | Answers/steps/actions with correctness evidence | Execution/proof criteria, hidden tests, ambiguity, and error rates |
| Distillation | Soft targets, responses, features, or trajectories | Teacher revision, accessible information, temperature, selection, and reuse rights |
| Retrieval corpus | Documents plus identifiers/metadata | Freshness, permissions, chunk lineage, update/delete behavior, and provenance |
| Agent memory | Selected experiences/facts/procedures | Source evidence, confidence, timestamps, scope, retention, and invalidation |
| Evaluation | Independent tasks, environments, and labels | Version, contamination checks, task distribution, protocol, and non-reuse for tuning |
| Embodied interaction | Observations, actions, state, and outcomes | Units, coordinate systems, embodiment, control rate, resets, and intervention records |

### Representative corpus and resource studies

These are coverage anchors, not a claim of license equivalence, unchanged download availability, or directly comparable corpus sizes.

| Resource | Why it belongs in the book | Source |
|---|---|---|
| C4 / T5 | Web cleaning and text-to-text/denoising objectives | [T5 paper](https://arxiv.org/abs/1910.10683) |
| The Pile | Multi-domain corpus composition and documentation | [The Pile paper](https://arxiv.org/abs/2101.00027) |
| RedPajama | Reproducible corpus-preparation infrastructure and source mixtures | [Official data repository](https://github.com/togethercomputer/RedPajama-Data) |
| RefinedWeb | Web filtering/deduplication as an experimental variable | [RefinedWeb paper](https://arxiv.org/abs/2306.01116) |
| Dolma | Open corpus construction, provenance, and research reproducibility | [Dolma paper](https://arxiv.org/abs/2402.00159) |
| FineWeb / FineWeb-Edu | Filtering, quality selection, and educational-data selection | [FineWeb paper](https://arxiv.org/abs/2406.17557), [dataset card](https://huggingface.co/datasets/HuggingFaceFW/fineweb) |
| FineWeb2 | Multilingual data coverage and language-sensitive data engineering | [Official dataset card](https://huggingface.co/datasets/HuggingFaceFW/fineweb-2) |
| DCLM | Controlled data-selection experiments and matched training recipes | [DCLM paper](https://arxiv.org/abs/2406.11794) |
| Code corpora | Repository provenance, licenses, file/repository splits, deduplication, execution, and benchmark contamination | Use exact official dataset cards; integrate into 07–12 and 61 |
| Mathematics/science corpora | Symbolic parsing, formulas, proofs, verification, and domain mixtures | [DeepSeekMath](https://arxiv.org/abs/2402.03300) as a method/data account |
| Tulu-family post-training data | Mixtures spanning SFT, preferences, and verifiable tasks | [Tulu 3 report](https://arxiv.org/abs/2411.15124) |
| Process-supervision data | Intermediate-step labels and verifier reliability | [Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) |
| Distilled reasoning data | Teacher generation, selection, student supervision, and disclosure limits | [DeepSeek-R1](https://arxiv.org/abs/2501.12948) |
| Agent/software environments | State, actions, repository snapshots, tests, and reproducibility | [SWE-bench](https://arxiv.org/abs/2310.06770), [τ-bench](https://arxiv.org/abs/2406.12045) |
| Multimodal/robot trajectories | Time alignment, embodiment, action semantics, and transfer | [OpenVLA](https://arxiv.org/abs/2406.09246), [V-JEPA 2](https://arxiv.org/abs/2506.09985) |

**Mandatory dataset fields:** dataset ID; snapshot/hash; origin; acquisition time; modality; language; domain; unit of sampling; label schema; generator/policy if synthetic; license/permission record; extraction/filter/dedup versions; training role; train/evaluation membership; contamination results; retention/deletion conditions; known limitations. Token counts must identify the tokenizer and distinguish available, sampled, and consumed tokens.

## Appendix D — Primary-paper spine

The following 52 entries form the initial primary-paper and technical-report spine. Their order follows mechanisms, not popularity. Publication status, latest revision, official implementation, and reproducibility fields must be recorded when a paper is developed into a chapter study. A preprint's presence here is not a claim of peer review.

| ID | Primary work | Mechanism or question | Chapters |
|---|---|---|---|
| P01 | [Attention Is All You Need](https://arxiv.org/abs/1706.03762) | Transformer computation and reference architecture | 04–05, 13–14 |
| P02 | [Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683) | Denoising, transfer learning, and C4 | 04, 07–08, 19 |
| P03 | [The Pile](https://arxiv.org/abs/2101.00027) | Diverse corpus composition | 07–09 |
| P04 | [The RefinedWeb Dataset for Falcon LLM](https://arxiv.org/abs/2306.01116) | Web-data filtering and deduplication | 07–09 |
| P05 | [Dolma](https://arxiv.org/abs/2402.00159) | Open corpus engineering and provenance | 07–12 |
| P06 | [The FineWeb Datasets](https://arxiv.org/abs/2406.17557) | Controlled web-data preparation | 07–09 |
| P07 | [DataComp-LM](https://arxiv.org/abs/2406.11794) | Data-selection experiments | 06–09, 21 |
| P08 | [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) | Empirical loss/compute relationships | 21 |
| P09 | [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556) | Parameter–data compute allocation | 09, 21 |
| P10 | [Switch Transformers](https://arxiv.org/abs/2101.03961) | Sparse conditional computation | 16, 29 |
| P11 | [Mamba](https://arxiv.org/abs/2312.00752) | Selective state-space sequence modeling | 17 |
| P12 | [Gated Delta Networks](https://arxiv.org/abs/2412.06464) | Gating and targeted recurrent-state updates | 17 |
| P13 | [DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) | Joint architecture/training/systems design | 14, 16, 19–21, 27–30 |
| P14 | [LoRA](https://arxiv.org/abs/2106.09685) | Low-rank parameter adaptation | 23 |
| P15 | [QLoRA](https://arxiv.org/abs/2305.14314) | Adaptation of quantized base models | 23, 40 |
| P16 | [Overcoming catastrophic forgetting in neural networks](https://arxiv.org/abs/1612.00796) | Parameter anchoring and sequential retention | 24 |
| P17 | [Megatron-LM](https://arxiv.org/abs/1909.08053) | Transformer model parallelism | 29–30 |
| P18 | [ZeRO](https://arxiv.org/abs/1910.02054) | Partitioning training state | 29–30 |
| P19 | [FlashAttention](https://arxiv.org/abs/2205.14135) | Exact attention with IO-aware execution | 14, 26–27 |
| P20 | [FlashAttention-4](https://arxiv.org/abs/2603.05451) | Algorithm/pipeline co-design under asymmetric hardware scaling | 25–27 |
| P21 | [Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) | SFT and RLHF pipeline | 31–34 |
| P22 | [Constitutional AI](https://arxiv.org/abs/2212.08073) | AI feedback and oversight | 11, 32, 65 |
| P23 | [Direct Preference Optimization](https://arxiv.org/abs/2305.18290) | Preference objectives through policy reparameterization | 33 |
| P24 | [Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347) | Clipped policy optimization | 34 |
| P25 | [DeepSeekMath](https://arxiv.org/abs/2402.03300) | Mathematical adaptation and group-relative RL | 22, 35 |
| P26 | [DeepSeek-R1](https://arxiv.org/abs/2501.12948) | Reasoning RL and student-model pathways | 11, 35, 39 |
| P27 | [DAPO](https://arxiv.org/abs/2503.14476) | Scaled RL optimization choices | 35–36 |
| P28 | [Understanding R1-Zero-Like Training: A Critical Perspective](https://arxiv.org/abs/2503.20783) | Bias and interpretation in reasoning RL | 35 |
| P29 | [Tulu 3](https://arxiv.org/abs/2411.15124) | Open post-training recipes and data mixtures | 11, 31–36 |
| P30 | [Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) | Process supervision and verification | 32, 38 |
| P31 | [Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters](https://arxiv.org/abs/2408.03314) | Inference-budget allocation | 38 |
| P32 | [Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531) | Teacher–student soft-target learning | 39 |
| P33 | [GPTQ](https://arxiv.org/abs/2210.17323) | Post-training weight quantization | 40 |
| P34 | [AWQ](https://arxiv.org/abs/2306.00978) | Activation-aware weight quantization | 40 |
| P35 | [Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) | Draft/verify generation and distribution preservation | 37 |
| P36 | [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) | KV allocation, sharing, and serving | 42–44 |
| P37 | [SGLang: Efficient Execution of Structured Language Model Programs](https://arxiv.org/abs/2312.07104) | Program/runtime co-design and reuse | 43–44 |
| P38 | [DistServe](https://arxiv.org/abs/2401.09670) | Prefill/decode disaggregation and goodput | 44, 48 |
| P39 | [Dense Passage Retrieval](https://arxiv.org/abs/2004.04906) | Learned retrieval representations | 49 |
| P40 | [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) | Parametric and nonparametric evidence | 49–50, 53 |
| P41 | [ReAct](https://arxiv.org/abs/2210.03629) | Interleaved reasoning and environment actions | 51–52 |
| P42 | [SWE-bench](https://arxiv.org/abs/2310.06770) | Repository-level software-task evaluation | 61, 63 |
| P43 | [τ-bench](https://arxiv.org/abs/2406.12045) | Tool–agent–user interaction evaluation | 51–54, 63 |
| P44 | [Learning Transferable Visual Models From Natural Language Supervision](https://arxiv.org/abs/2103.00020) | Contrastive vision–language learning | 18, 55 |
| P45 | [BLIP-2](https://arxiv.org/abs/2301.12597) | Connecting visual encoders to language models | 18, 55 |
| P46 | [Gemini 2.5 Technical Report](https://arxiv.org/abs/2507.06261) | Reasoning, multimodality, and long-context system study | 15, 38, 55–57 |
| P47 | [V-JEPA 2](https://arxiv.org/abs/2506.09985) | Predictive representations, planning, and action-conditioned transfer | 57, 59–60 |
| P48 | [OpenVLA](https://arxiv.org/abs/2406.09246) | Vision–language–action policies | 60 |
| P49 | [π0](https://arxiv.org/abs/2410.24164) | Flow-based action generation | 58, 60 |
| P50 | [Holistic Evaluation of Language Models](https://arxiv.org/abs/2211.09110) | Multi-dimensional evaluation design | 06, 61–63, 66 |
| P51 | [Chatbot Arena](https://arxiv.org/abs/2403.04132) | Human-preference measurement | 62 |
| P52 | [Circuit Tracing: Revealing Computational Graphs in Language Models](https://transformer-circuits.pub/2025/attribution-graphs/methods.html) | Mechanistic attribution and intervention | 64 |

For every paper study, record: problem and prior baseline; exact assumptions; representation; equations and estimator; algorithm; compute/memory/communication implications; experimental protocol; author-reported results; independent results if available; limitations; competing explanations; official code; and descendants. **PAPER-REPORTED** results must never silently become **EMPIRICALLY-OBSERVED** results of this book.

## Appendix E — Researchers indexed by documented contribution

This index uses authorship and contribution domains. It does not imply a current employer, a complete author list, or an ordinal ranking. A researcher may appear in several categories.

| Contribution area | Representative researchers | Primary linkage |
|---|---|---|
| Transformer architecture | Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin | P01 |
| Transfer learning and data objectives | Colin Raffel, Adam Roberts, Katherine Lee, Sharan Narang | P02 |
| Corpus design and open data | Leo Gao, Stella Biderman, Guilherme Penedo, Hynek Kydlíček, Loubna Ben Allal, Luca Soldaini, Jeffrey Li, Alex Fang | P03–P07 |
| Scaling science | Jared Kaplan, Sam McCandlish, Tom Henighan, Jordan Hoffmann, Sebastian Borgeaud, Arthur Mensch | P08–P09 |
| Sparse and recurrent architectures | William Fedus, Barret Zoph, Albert Gu, Songlin Yang | P10–P12 |
| Adaptation and efficient numerics | Edward J. Hu, Tim Dettmers, Elias Frantar, Ji Lin | P14–P15, P33–P34 |
| Continual learning | James Kirkpatrick, Razvan Pascanu, Raia Hadsell | P16 |
| Distributed training | Mohammad Shoeybi, Samyam Rajbhandari, Jeff Rasley, Olatunji Ruwase, Yuxiong He | P17–P18 |
| IO-aware algorithms and kernels | Tri Dao, Daniel Y. Fu, Atri Rudra, Christopher Ré, Ted Zadouri, Markus Hoehnerbach | P19–P20 |
| Human feedback and policy optimization | Long Ouyang, Yuntao Bai, John Schulman | P21–P24 |
| Preference optimization | Rafael Rafailov, Archit Sharma, Eric Mitchell, Stefano Ermon, Chelsea Finn | P23 |
| Inference-time compute | Charlie Snell, Jaehoon Lee, Kelvin Xu, Aviral Kumar | P31 |
| Serving systems | Woosuk Kwon, Zhuohan Li, Lianmin Zheng, Ying Sheng, Ion Stoica, Yinmin Zhong | P36–P38 |
| Retrieval and grounded language models | Vladimir Karpukhin, Patrick Lewis, Danqi Chen, Wen-tau Yih | P39–P40 |
| Agent reasoning and interaction | Shunyu Yao, Karthik Narasimhan, Yuan Cao | P41 |
| Predictive/embodied learning | Mido Assran, Adrien Bardes, Yann LeCun, Moo Jin Kim, Karl Pertsch, Sergey Levine | P47–P49 |
| Evaluation and measurement | Percy Liang, Wei-Lin Chiang, Anastasios Nikolas Angelopoulos | P50–P51 |

Maintain author identifiers from primary-paper metadata; preserve accents and disambiguate identical names. Institution relations must be dated to the relevant paper or verified independently.

## Appendix F — Conferences, journals, and publication routes

Venues organize evidence discovery. They are not a quality score and do not replace examination of methods, experimental controls, or artifact availability. This is a research-coverage map, not a calendar of currently scheduled events.

| Research axis | Venues and publication routes | Why the book needs them |
|---|---|---|
| Machine learning and statistics | NeurIPS, ICML, ICLR, AISTATS, UAI, JMLR, TMLR | Objectives, optimization, generalization, architectures, and learning theory |
| Language modeling and NLP | ACL, EMNLP, NAACL, EACL, COLING, COLM | Language representations, data, multilinguality, alignment, and evaluation |
| ML systems | MLSys | Compiler/runtime, distributed training, serving, and algorithm–system interactions |
| Operating/distributed systems | OSDI, SOSP, NSDI, EuroSys; USENIX ATC proceedings as an archive | Scheduling, state management, disaggregation, and fault tolerance |
| Architecture and hardware | ISCA, MICRO, HPCA, ASPLOS, Hot Chips | Memory hierarchy, accelerators, interconnects, and hardware/software co-design |
| Parallel/HPC | SC, PPoPP, IPDPS | Parallel algorithms, communication, scaling, and cluster execution |
| Retrieval and data systems | SIGIR, WSDM, The Web Conference, KDD, SIGMOD, VLDB | Retrieval, ranking, indexing, data processing, and storage |
| Vision and multimodality | CVPR, ICCV, ECCV | Visual representations, video, generative models, and multimodal reasoning |
| Speech/audio | ICASSP, Interspeech | Speech understanding/generation, streaming, and acoustic evaluation |
| Robotics and embodied AI | CoRL, RSS, ICRA, IROS | Policy learning, control, simulation, and embodied generalization |
| Security and privacy | IEEE S&P, USENIX Security, ACM CCS, NDSS, PETS | Adversarial behavior, privacy, systems security, and threat modeling |

Use [PMLR](https://proceedings.mlr.press/), [ACL Anthology](https://aclanthology.org/), [OpenReview](https://openreview.net/), [USENIX](https://www.usenix.org/conferences), and [MLSys](https://mlsys.org/About) as primary discovery/proceedings routes where applicable. Also use the relevant ACM, IEEE, CVF, and official venue archives. “SysML” should be handled as historical naming/context associated with MLSys, rather than automatically treated as another independent contemporary venue.

Record preprint date, conference/journal publication, acceptance status, revision, corrections/retractions, artifact evaluation, and official code separately.

## Appendix G — Curricula, reference ecosystems, and independent measurement

### Curriculum mapping

| Resource | Main role | Mapping into this book |
|---|---|---|
| [Stanford CS336, Spring 2026](https://cs336.stanford.edu/) | Implementation-driven language-model construction | Tokenizer/model/optimizer → 03–05, 10, 19–20; systems → 25–30; scaling → 21; data → 07–12; alignment/reasoning → 31–35 |
| [CS336, Spring 2025 archive](https://cs336.stanford.edu/spring2025/) | Stable prior curriculum/assignment reference | Compare versioned exercises and preserve reproducibility |
| [Stanford CS224N](https://web.stanford.edu/class/cs224n/) | NLP/deep-learning foundations | 02, 04–05, 10, 13–18, 49–50 |
| Stanford CS25 | Research talks and evolving Transformer/foundation-model topics | Supplementary mechanism and case-study discovery; pin the talk and year |
| Stanford CS324 / foundation-model courses | Broader foundation-model lifecycle and impacts | 01, 06–12, 21, 61–66; use the specific archived offering |
| [Deep Learning Systems](https://dlsyscourse.org/) | Framework, automatic differentiation, and systems implementation | 03, 25–29 |
| [Berkeley deep RL course](https://rail.eecs.berkeley.edu/deeprlcourse/) | Sequential decision-making and RL foundations | 34–36, 52, 59–60 |
| Full Stack Deep Learning | Application/system lifecycle studies | 46–54, 63–66; pin the course edition |
| Official implementation tutorials | PyTorch/JAX, Hugging Face, vendor/kernel/runtime documentation | Implementation references; never substitute tutorial claims for measured performance |

Courses provide a learning route and exercises. Their ordering is not evidence that an algorithm is optimal. The book's own capstones must be original experiments with explicit attribution for reused datasets, code, and methods.

### Measurement and discovery sources

| Source | Appropriate use | Boundary on interpretation |
|---|---|---|
| [Artificial Analysis](https://artificialanalysis.ai/methodology) | Model/endpoint evaluations, performance methodology, and cost/performance comparisons | Record workload, date, provider, and token-counting conventions; endpoint results are not intrinsic model constants |
| [Epoch AI](https://epoch.ai/data) | Compute/hardware/data-center/economic trends and capability/benchmark measurement | Preserve estimation methods, uncertainty, measured versus estimated fields, and benchmark scope |
| [Arena methodology](https://arxiv.org/abs/2403.04132) | Pairwise human-preference evidence | Voting population, task mixture, model identities, and statistical uncertainty constrain interpretation |
| [Hugging Face](https://huggingface.co/) | Model/dataset artifacts, cards, code links, papers, and community discovery | Likes, downloads, or paper votes measure attention, not scientific validity |
| [arXiv](https://arxiv.org/) | Primary manuscript discovery and version history | Submission does not imply peer review; inspect revisions and later publication |
| [OpenReview](https://openreview.net/) | Papers, reviews, decisions, and public discussion where available | Distinguish submission, review, and acceptance; venue policies vary |
| [Semantic Scholar](https://www.semanticscholar.org/) | Citation graph and literature discovery | Retrieve the primary work before making a technical claim |
| Papers with Code references | Historical paper–implementation links and previously collected records | Resolve to the actual paper and repository; verify current availability before using it as a maintained discovery dependency |

Artificial Analysis's accessed methodology describes a standardized token convention for its throughput reporting. Reusing a displayed tokens/sec figure without its unit definition can invalidate cross-source comparisons. [Methodology and definitions](https://artificialanalysis.ai/methodology)

## Appendix H — Editorial specification, metadata, and coverage audit

### Required chapter structure

Every full chapter manuscript should use the following sequence, with the emphasis adjusted to the subject:

1. **Objective and scope:** identify the problem, baseline, success criteria, and chapter boundaries. Keep the opening introduction at approximately 200–300 words.
2. **Intuition:** explain the representational or computational difficulty. Separate physical resource reasoning from cognitive analogy.
3. **Formulation:** define symbols, shapes, units, objective, constraints, estimators, and assumptions before derivation.
4. **Methodology:** derive the core mechanism; preserve the source's conditions and mark any adaptation.
5. **Algorithm:** give executable pseudocode, input/output contracts, loop invariants, termination, and state transitions.
6. **Implementation:** connect tensors and operators to framework, kernels, memory, communication, and deployment.
7. **Experimental design:** specify datasets, splits, baselines, ablations, budgets, seeds, evaluator independence, and uncertainty.
8. **Observations:** distinguish source-reported, code-verified, and independently measured results.
9. **Failure analysis:** characterize numerical, statistical, systems, and distributional failure modes with observable symptoms.
10. **Extensions:** identify what changes for domain adaptation, long context, multimodality, agents, or embodiment; mark proposals explicitly.
11. **Limitations and implications:** explain the valid operating regime, falsification conditions, and practical decision consequences.
12. **Reproducibility:** provide source versions, artifacts, configurations, exact metric definitions, and unresolved unknowns.

The six section headings in each chapter matrix organize subject matter. The twelve elements above define depth and presentation across those sections; they do not require twelve additional sections in every chapter.

### Evidence labels and knowledge status

| Label | Permitted meaning |
|---|---|
| KNOWN | Directly supported by the supplied material or identified evidence; specify that evidence |
| DERIVED | Follows from stated assumptions/calculations; show the auditable derivation |
| ASSUMED | A design or planning input chosen for the analysis; include sensitivity when material |
| NOT-DISCLOSED | The required detail is absent from the inspected public disclosure |
| UNVERIFIED | A candidate statement remains unchecked or could not be validated |
| PAPER-REPORTED | The cited authors report the method or result; it has not thereby been independently reproduced |
| OFFICIAL-DOCUMENTATION | The project/vendor/organization documents the claim for the stated version |
| MATHEMATICALLY-DERIVED | The result follows under explicit mathematical assumptions |
| CODE-VERIFIED | The relevant implementation was inspected or a targeted executable check established the stated property |
| EMPIRICALLY-OBSERVED | A specified experiment was actually performed and its measurements retained |

Knowledge status and evidence type are different fields. An official benchmark claim may be known to have been reported while its generalization remains unverified. This specification contains proposed experiments; it does not report newly trained models, reproduced benchmark scores, or measured engine performance.

### Canonical content record

The following is an illustrative schema instance. Null fields are intentionally unresolved; they are not inferred values.

~~~json
{
  "content_id": "na.method.grpo",
  "entity_type": "method",
  "title": "Group Relative Policy Optimization",
  "primary_section": "35.2",
  "chapter_id": "35",
  "prerequisite_chapters": ["02", "32", "34"],
  "related_sections": ["11.5", "32.4", "34.2", "36.5", "38.6"],
  "relations": [
    {"type": "supported_by", "target": "paper.deepseekmath"},
    {"type": "used_in", "target": "topic.rlvr"}
  ],
  "axes": {
    "lifecycle": ["post_training"],
    "mechanism": ["policy_optimization"],
    "feedback_setting": ["verifiable_reward", "learned_reward"],
    "modality": ["text", "tool_trajectory"]
  },
  "evidence": [{
    "type": "PAPER-REPORTED",
    "url": "https://arxiv.org/abs/2402.03300",
    "accessed": "2026-09-20",
    "claim": "Primary source for the original GRPO construction",
    "exact_equation_or_section": null
  }],
  "implementation": {
    "repository": null,
    "commit": null,
    "configuration": null,
    "independent_test_result": null
  },
  "editorial_status": "architecture_complete_manuscript_pending"
}
~~~

The axes in this schema support search; they do not assert that every listed application was demonstrated in the original paper. A chapter-level claim must point to the exact evidence record that supports it.

### Review gates for the full manuscript

| Gate | Required evidence |
|---|---|
| Taxonomy | One canonical section per concept; valid typed relations; aliases normalized; no duplicate sibling under a different name |
| Dependency | Earlier prerequisites or an explicit prerequisite primer; no cycles in prerequisite_of edges |
| Mathematics | Defined symbols, valid shapes/units, explicit approximation regime, correct estimator and normalization |
| Implementation | Exact repository/commit/configuration; API and tensor contracts; no inferred undocumented internals |
| Numerical behavior | Reference comparisons, dtype/accumulation details, extreme-input cases, and tolerances |
| Experiment | Comparable budgets, independent evaluation, contamination checks, uncertainty, and meaningful ablations |
| Systems | Compute/HBM/network accounting, workload definition, latency quantiles, throughput/goodput, and recovery |
| Operational behavior | Timeouts, retries, backpressure, state consistency, observability, rollout and rollback |
| Security/authorization | Threat assumptions, permissions, data boundaries, and side-effect controls appropriate to the system |
| Editorial quality | Precise terminology, concise introduction, source-supported mechanisms, bounded claims, and clear limitations |

### Coverage audit: every original branch has a destination

| Original branch | Final canonical destination | Expansion or correction |
|---|---|---|
| 01 Foundations | 01–06 | Adds statistics, numerical verification, resource accounting, and experimental design |
| 02 Data | 07–12; Appendix C | Separates acquisition, cleaning, mixtures, synthetic/trajectory data, and operational lineage |
| 03 Tokenization | 10 | Adds serialization, template parity, migration, and cost interactions |
| 04 Architecture | 13–18 | Adds recurrent state, delta-rule hybrids, multimodal interfaces, and precise cache representations |
| 05 Pretraining | 19–20 | Broadens objectives, training state, schedule semantics, and failure diagnosis |
| 06 Scaling | 21, 38, 48 | Separates training allocation, test-time compute, and lifecycle economics |
| 07 Post-training | 31–36 | Splits feedback, direct preferences, PPO/RLHF, RLVR, and distributed agent RL |
| 08 Reasoning | 35, 37–38, 52 | Separates learned policy, decoding, search, and agent control |
| 09 Distillation/compression | 23, 39–41 | Moves adaptation to its correct location; separates distillation, quantization, and executable sparsity |
| 10 Distributed training | 29–30, 36 | Adds topology, state consistency, fault recovery, and rollout/learner mismatch |
| 11 Hardware | 25 | Separates memory media, protocols, architecture, and cluster constraints |
| 12 Kernels/compilers/communication | 26–29 | Defines distinct layers and connects algorithmic work to measured traffic |
| 13 Inference engines | 42–45; Appendix B | Separates inference semantics, runtime, artifact formats, and local management tools |
| 14 Production serving | 44–48 | Adds SLOs, admission, bounded retries, release control, and economics |
| 15 Evaluation | 06, 48, 61–63 | Moves experiment design to the beginning and separates evaluation axes |
| 16 Interpretability/safety/alignment | 32–36, 64–66 | Separates behavioral optimization, causal analysis, security, and release assurance |
| 17 Agents | 36, 49–54, 63 | Adds retrieval, context construction, tool contracts, state, recovery, and budget-matched coordination |
| 18 Multimodal | 18, 55–60 | Adds temporal/audio processing, generation, world models, VLA, and control |
| 19 Labs/model families | Appendix A; chapter case studies | Preserves organizations as provenance indexes with disclosure boundaries |
| 20 Open-source ecosystem | Appendix B | Separates methods, libraries, frameworks, formats, runtimes, and products |
| 21 Papers | Appendix D | Mechanism-organized primary-paper spine and explicit evidence protocol |
| 22 Researchers | Appendix E | Contribution-linked authorship index; no arbitrary ranking or inferred current affiliation |
| 23 Conferences | Appendix F | Broadens to retrieval, vision, speech, robotics, and security; separates historical naming |
| 24 Courses | Appendix G | Maps CS336 and complementary curricula to exact chapters |
| 25 Intelligence/tracking | Appendix G | Distinguishes measurement, discovery, artifacts, popularity, and provenance |

### Edition boundary

The chapter architecture is finalized for development. Page budgets, empirical results, manuscript-level derivations, and reproduction artifacts remain separate deliverables. Rapidly changing software/model information must be rechecked at chapter execution and release time. This edition verifies primary starting sources and selected current classifications; it does not claim an exhaustive search of all research published through September 2026.
