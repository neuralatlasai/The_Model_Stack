# Content Contract for *The Model Stack* manuscripts

**Status:** normative for every file under `docs/`. Edition 1.0, 20 September 2026.
**Authority:** this contract implements `book_plan.md` (chapter matrices, shared mathematical contract, Appendix H) and the content-object model in `Instruction/UI_UX.md`. It never overrides either. Where the plan and this file appear to disagree, the plan wins and this file must be corrected.

Requirements use **MUST**, **MUST NOT**, **SHOULD**, and **MAY** as normative terms.

---

## 1. What the `docs/` tree is

`docs/` holds the chapter manuscripts of the book as Markdown, organised so that a later UI (the Research Atlas described in `Instruction/UI_UX.md`) can compile every file into a typed research object with `parent`, `children`, `siblings`, `prerequisites`, `dependents`, `papers`, `implementations`, and `evidence` without parsing arbitrary HTML.

The tree is a four-level editorial hierarchy: **Volume → Part → Chapter → Section**. Concept-level relations (prerequisite_of, variant_of, implemented_by, evaluated_by, supported_by, contradicted_by, consumes/produces, trades_off_with) are a graph and live in frontmatter, not in the folder tree.

```text
docs/
├── README.md                          atlas index: volumes, parts, all 66 chapters, appendices
├── CONTENT_CONTRACT.md                this file
├── front-matter/
│   ├── notation.md                    shared symbols, shapes, units, and the shared mathematical contract
│   ├── reading-routes.md              reader entry routes and the six integrated studies
│   └── glossary.md                    compiled from each chapter's "Terms owned here"
├── vol-01-learning-and-representation/
│   ├── README.md
│   ├── part-01-scientific-foundations/
│   │   ├── README.md
│   │   ├── ch01-foundation-model-lifecycle/
│   │   │   ├── README.md              chapter page
│   │   │   ├── 01-1-problem-formulation.md
│   │   │   ├── 01-2-levels-of-analysis.md
│   │   │   ├── 01-3-model-categories.md
│   │   │   ├── 01-4-lifecycle-and-intervention.md
│   │   │   ├── 01-5-resource-accounting.md
│   │   │   ├── 01-6-scientific-interpretation.md
│   │   │   ├── verification.md        artifact spec + falsifiable verification task
│   │   │   └── references.md          typed reference records for this chapter
│   │   └── ch02-.../
│   └── part-02-.../
├── vol-02-execution-and-optimization/
├── vol-03-grounded-and-interactive-intelligence/
└── appendices/
    ├── README.md
    ├── appendix-a-organizations-model-families-and-disclosure.md
    └── ... appendix-b … appendix-h
```

### 1.1 Naming rules

- Folder and file names MUST be lowercase kebab-case ASCII.
- Volumes: `vol-NN-<slug>`. Parts: `part-NN-<slug>` (parts are numbered 01–11 across the series, not per volume). Chapters: `chNN-<slug>` with the two-digit chapter number from the plan.
- Section files: `NN-K-<slug>.md` where `NN` is the chapter number and `K` is the section index 1–6 from the chapter matrix. The slug is derived from the section title in the plan.
- Every folder has a `README.md` that is the page for that node.
- The canonical chapter list with fixed slugs is in `docs/README.md`. Slugs MUST NOT be changed after publication; the slug is the stable URL.

---

## 2. Frontmatter schema

Every Markdown file MUST begin with a YAML frontmatter block. Null is a legal value and means "intentionally unresolved"; it is never an inferred value.

```yaml
---
id: ms.section.14.2                 # ms.volume.1 | ms.part.3 | ms.chapter.14 | ms.section.14.2 | ms.appendix.b | ms.frontmatter.notation
entity_type: section                # volume | part | chapter | section | verification | references | appendix | frontmatter
title: Latent attention
short_title: MLA-style compression  # optional, ≤ 40 chars, for tree/breadcrumb rendering
volume: 1
part: 3
chapter: 14
section: 14.2                       # null for non-section entities
slug: 14-2-latent-attention
parent: ms.chapter.14
prev_sibling: ms.section.14.1       # null at boundaries
next_sibling: ms.section.14.3
children: []                        # ordered list of ids; chapters list their sections + verification + references
prerequisites:                      # learning dependencies; ids of earlier sections/chapters only (acyclic)
  - ms.section.5.2
  - ms.section.14.1
downstream:                         # what builds on this
  - ms.section.27.4
  - ms.section.42.4
related: []                         # non-dependency links (trades_off_with, contrasts_with)
siblings_by_mechanism:              # optional; concept-level siblings that are alternatives to this one
  - ms.section.14.1
  - ms.section.14.3
relations:                          # typed graph edges (see book_plan.md "Graph semantics")
  - {type: variant_of, target: concept.attention-architecture}
  - {type: supported_by, target: paper.P13}
  - {type: implemented_by, target: impl.flashmla}
axes:
  lifecycle: [pretraining, inference]          # data | pretraining | continued_training | adaptation | post_training | inference | serving | evaluation | assurance
  mechanism: [attention, cache_representation]
  feedback_setting: []                         # human_preference | ai_feedback | verifiable_reward | learned_reward | environment_return
  modality: [text]
papers: [P13, P19]                  # Appendix D ids; non-spine papers are listed in references.md with full records
implementations: [impl.flashmla, impl.vllm, impl.sglang]
benchmarks: []
datasets: []
status:
  maturity: established             # foundational | established | active | emerging | open
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED]
  empirically_observed: false       # MUST be false in Edition 1.0 (no experiments were run for this edition)
word_count_target: 950
updated_at: 2026-09-20
editorial_status: manuscript_draft  # architecture_only | manuscript_draft | reviewed | released
---
```

Rules:

- `prerequisites` MUST only point backwards in the chapter order (or to `front-matter/*`). The prerequisite graph MUST be acyclic.
- `downstream` MAY point forward.
- `papers` MUST use Appendix D ids (`P01`–`P52`) when the paper is on the spine. Any other cited work MUST have a full record in the chapter's `references.md` and is referenced in text by its `references.md` key (e.g. `[R14.3]`).
- Implementation ids use the form `impl.<kebab-name>` where the name is the exact project name from `Instruction/AI_REFERENCE_STACK.md` §4 lowercased (`impl.vllm`, `impl.sglang`, `impl.tensorrt-llm`, `impl.llama-cpp`, `impl.pytorch-fsdp2`, `impl.nvidia-megatron-core`, `impl.hugging-face-trl`, `impl.verl`, `impl.flashattention`, …).
- Lab ids use `lab.<kebab-name>` from `AI_REFERENCE_STACK.md` §1 (`lab.anthropic`, `lab.google-deepmind`, `lab.deepseek`, `lab.alibaba-qwen`, `lab.z-ai-glm`, `lab.moonshot-ai-kimi`, …).

---

## 3. Chapter page (`README.md`) anatomy

The chapter page is compact and research-oriented. No marketing hero. It MUST contain, in this order:

1. **Identity line.** `VOLUME II / PART V — HARDWARE, KERNELS, AND DISTRIBUTED EXECUTION / CHAPTER 27` as a single small-caps style line (plain text in Markdown).
2. **Title** (`# 27 — Attention, latent-attention, and expert kernels`).
3. **One-sentence thesis.** One sentence. What this chapter establishes and why it must be true.
4. **Metadata line.** `6 sections · N spine papers · M implementations · prerequisites: 14–17, 25–26 · artifact: <artifact from plan> · updated 2026-09-20`.
5. **Why this chapter exists.** 150–300 words answering, in order: *What failed before? What bottleneck appeared? Which constraint became dominant? What changed in the solution?* This is the "Why this exists" pattern of `UI_UX.md` §40. It MUST NOT be a summary of the sections.
6. **Concept map.** A Mermaid `flowchart` of the chapter's concepts (10–20 nodes) using only the diagram primitives listed in §8 below, followed by a plain-text nested list of the same nodes (accessibility: graphs are never the sole representation).
7. **Position in the book.** A table with rows *Prerequisites*, *Siblings (same part)*, *Downstream*, *Trades off with*; each cell links to chapter/section files with relative paths.
8. **Sections.** A table: section number and link · title · *what changes here* (one clause describing the new constraint, mechanism, or decision introduced) · primary evidence labels.
9. **Artifact.** The artifact named in the plan, restated as a concrete deliverable with its file/field list.
10. **Verification.** One paragraph summarising the falsifiable verification task; the full protocol lives in `verification.md`.
11. **Lineage.** A dated list (year · work · relation) using exactly one of the relation words: *conceptual ancestor*, *engineering optimization*, *alternative branch*, *superseded approach*, *current frontier*. Years and works MUST be ones the author can attribute to a specific paper or release in `references.md`.
12. **Terms owned here.** The glossary terms whose canonical definition lives in this chapter, each with a one-line definition and the owning section. A term MUST be defined in exactly one chapter across the book; other chapters link to it.
13. **Reference-stack coverage.** A table that binds the chapter to `Instruction/AI_REFERENCE_STACK.md`, the only permitted source index for this book. One row per reference-stack entry the chapter actually uses, with these columns: *Stack section* (§1 lab · §2 conference · §3 discovery source · §4 system) · *Entry* (exact name as written in the reference stack, with its rank number) · *Stack layer* (for §4 entries, the layer name from §4.1) · *What this chapter takes from it* (the specific mechanism, report, documentation page, or proceedings route, stated concretely) · *Surface used* (Home / Research / Papers / Blog / Code / Models / docs-code URL exactly as listed in the reference stack) · *Sections* (which of the six sections use it) · *Evidence label*. Beneath the table, one paragraph titled **Inspection dimensions applied** lists which of the §4.2 dimensions (Parallelism, Precision, Memory, Communication, Kernels, Checkpointing, Post-training, Inference, Metrics, Reliability, Reproducibility) the chapter analyses and where. A chapter that uses a source absent from the reference stack MUST say so in a final row group titled *Outside the reference stack (routed via book_plan.md anchors)* and justify it by the plan's source anchor. Minimum: 8 rows, covering at least one lab, one venue or discovery source, and (for any chapter with an Implementation heading) three §4 systems.
14. **Source route.** How to find primary evidence for this chapter using the *exact* search protocols in `Instruction/AI_REFERENCE_STACK.md` (lab search protocol §1.1, conference workflow §2.1, paper cascade §3.1, training-stack search protocol §4.3). Give 3–6 concrete filled-in queries.
15. **Status.** Editorial status, evidence coverage, and the list of NOT-DISCLOSED / UNVERIFIED items the chapter carries.

Target length for the chapter page: 900–1,600 words excluding tables and the diagram.

---

## 4. Section file anatomy

Each section file develops one row of the chapter matrix in `book_plan.md`. It MUST cover every item named in that row's "Required coverage" cell. Target length: 1,500–2,600 words of prose per section. The plan's 5,000–7,000-word figure is an indicative planning budget; this edition deliberately writes to full mechanism depth (derivations, algorithms, costs, failure modes, experiments), so a chapter lands at roughly 11,000–16,000 words. Depth MUST come from mechanism and evidence, never from repetition.

Every section's **Implementation** heading MUST name the reference-stack systems that realise the mechanism, each with its §4.1 stack layer, and MUST NOT name a system loosely or outside the reference stack without saying so.

The twelve depth elements of Appendix H are distributed across a section as follows. Use these exact H2 headings so the UI can map them to renderers. Omit a heading only when it is genuinely inapplicable, and say so in one line under "Scope".

```text
## Scope                 objective, baseline, success criteria, boundaries (≤ 120 words)
## Why this exists       what failed / bottleneck / dominant constraint / what changed
## Intuition             physical-resource reasoning first; cognitive analogies explicitly marked as heuristic
## Formulation           symbols, shapes, units, objective, constraints, estimators, assumptions — before any derivation
## Mechanism             derivation or mechanism; preserve the source's conditions; mark adaptations
## Algorithm             executable pseudocode with numbered lines, IO contract, invariants, termination, state transitions
## Implementation        tensors/operators → framework → kernels → memory → communication → deployment, naming reference-stack systems
## Experimental design   datasets, splits, baselines, ablations, budgets, seeds, evaluator independence, uncertainty (a PROPOSAL)
## Observations          the four-part observation layer (see §6)
## Failure modes         numerical, statistical, systems, distributional failures with observable symptoms
## Siblings              differential explanations of alternatives (see §7)
## Extensions            what changes for domain adaptation, long context, multimodality, agents, embodiment; proposals marked
## Limitations           valid operating regime, falsification conditions, decision consequences
## Reproducibility       versions, artifacts, configurations, exact metric definitions, unresolved unknowns
## References            spine ids and `references.md` keys used in this section
```

Not every section needs a long "Algorithm" or "Implementation"; a conceptual section (e.g. 01.2 Levels of analysis) keeps those headings short. The rule is consistency of reasoning, not forced template conformity.

---

## 5. Typed content blocks

The UI needs first-class renderers for definitions, claims, equations, algorithms, failure modes, and so on. Do not render them all as coloured callouts; give each its own grammar. The Markdown grammar below is mandatory so the compiler can recognise block types.

| Object | Markdown grammar |
|---|---|
| Definition | `> **Definition — <term>.** <one or two sentences>` (only in the owning chapter) |
| Claim | `> **Claim [<LABEL> · <source id>].** <statement>` — LABEL from §6; source id is `P13`, `R14.2`, `OD:vllm-docs`, or `DERIVED:eq-14.3` |
| Assumption | `> **Assumption.** <statement> · *sensitivity:* <what changes if false>` |
| Observation | `> **Observation [<LABEL>].** <statement>` |
| Proposition / Theorem | `> **Proposition 14.1.** <statement>` followed by `*Proof sketch.*` or `*Derivation.*` |
| Equation | Display math in `$$ … $$` with a trailing tag line `*(Eq. 14.3)*` and a one-line variable table beneath: `where L = layers, S = sequence length, …` |
| Derivation | `<details><summary>Derivation of Eq. 14.3</summary> … </details>` (inline expansion; never a separate page) |
| Algorithm | Fenced `text` block whose first line is `Algorithm 14.2 — <name>`, then `INPUT`, `OUTPUT`, `STATE`, `INVARIANT`, numbered lines; complexity and implementation link beneath the block |
| Code | Fenced block with language tag; must be reference-level (PyTorch/JAX/Triton) and must state the pinned version it targets or be marked `UNVERIFIED` |
| Tensor trace | Fenced `text` block titled `Tensor trace` with lines `[B, T, D] → op → [B, T, 3, H, Dh]` |
| Systems trace | Fenced `text` block titled `Systems trace` with `stage → latency / memory / compute / communication / failure` rows |
| Experiment | `### Experiment <ch>.<n> — <name>` with the fixed field list: Hypothesis · Setup · Independent variables · Controlled variables · Dataset/workload · Hardware · Metrics · Baselines · Expected result · Ablation · Interpretation · Threats to validity |
| Benchmark record | Table with the fields of `UI_UX.md` §24: capability measured · task construction · metric · dataset · contamination risks · protocol · known limitations · comparability |
| Dataset record | Table with the mandatory fields of Appendix C |
| Model record | Table with the "Required model record" fields of Appendix A; unknown values are `NOT-DISCLOSED` |
| Comparison record | Table with the "Comparison record" fields of Appendix B |
| Performance figure context | Any latency/throughput number MUST sit in a table that also states hardware · model · precision · sequence length · input/output distribution · concurrency · runtime version · measurement boundary |
| Failure mode | `> **Failure mode — <name>.** *Symptom:* … *Cause:* … *Detection:* … *Mitigation:* …` |
| Open question | `> **Open question.** <question> · *what evidence would settle it:* …` |
| Historical note | `> **Historical note.** …` |
| Implementation note | `> **Implementation note [<impl id> · <version or commit or UNVERIFIED>].** …` |
| Caveat / Warning | `> **Caveat.** …` / `> **Warning.** …` (warnings only for correctness or safety) |
| Further reading | `> **Further reading.** …` |

Equations, algorithms, figures, and experiments are numbered `<chapter>.<n>` and are independently linkable via a heading anchor.

---

## 6. Evidence labels and the observation layer

Every non-trivial technical statement MUST carry exactly one label from Appendix H:

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

Edition-1.0 hard rules:

- **EMPIRICALLY-OBSERVED MUST NOT appear.** No experiments were run for this edition. Every experiment is a proposal.
- **CODE-VERIFIED MUST NOT appear** unless the file states the repository, commit, and the check performed.
- A number reported by a paper or vendor MUST be labelled PAPER-REPORTED or OFFICIAL-DOCUMENTATION and MUST include the workload context (§5, performance-figure row). Advertised peak FLOPs are not application throughput.
- If an author cannot attribute a figure to a specific paper, release, or documentation page, the figure MUST be replaced by the qualitative relation and labelled UNVERIFIED, or omitted. Invented numbers, invented version strings, and invented benchmark scores are defects.
- Publicly undocumented model internals are NOT-DISCLOSED. Never infer architecture or training details from a brand or model name.
- Model releases after the author's knowledge boundary that appear in `book_plan.md` (for example the Qwen3.8 repository, the GLM-5 family repository, FlashAttention-4 as arXiv 2603.05451, the MCP specification dated 2026-07-28) MAY be cited exactly as the plan cites them, labelled OFFICIAL-DOCUMENTATION with `accessed 2026-09-20` as the plan states. Nothing beyond what the plan says about them may be asserted.

The **Observations** heading in every section MUST use the four-part observation layer of `UI_UX.md` §41, as four short labelled paragraphs:

```text
**What the paper claims.** …        (PAPER-REPORTED / OFFICIAL-DOCUMENTATION)
**What the evidence shows.** …      (which claims have independent support; which have none)
**What we infer.** …                (DERIVED / ASSUMED, clearly marked as the book's inference)
**What remains unknown.** …         (NOT-DISCLOSED / UNVERIFIED / open questions)
```

---

## 7. Siblings and differential explanations

Each section MUST have a `## Siblings` heading listing the alternatives at the same conceptual level (e.g. for GQA: MHA, MQA, MLA, sliding-window). For each sibling give a differential, not a definition:

```text
**MQA** — ../14-1-mha-mqa-gqa.md
Why it exists: cache size dominated decode bandwidth at large batch.
What assumption changed: all query heads may share one K/V head.
What objective changed: none; the likelihood objective is unchanged, the parameterisation is.
What problem it solved: KV bytes per token fall by H_q/H_kv.
What new failure mode it introduced: quality loss on retrieval-heavy tasks at H_kv = 1.
Changed primitive: per-head K/V projection → shared K/V projection.
```

Siblings MUST link to the file that owns them. A sibling that is owned by another chapter is linked, not re-explained.

---

## 8. Diagrams

Use Mermaid `flowchart` or `sequenceDiagram` only. Node labels MUST use the diagram vocabulary of `UI_UX.md` §53 as a bracketed prefix so the renderer can style them: `[Node]`, `[Process]`, `[State]`, `[Tensor]`, `[Memory]`, `[Dataset]`, `[Model]`, `[Objective]`, `[Metric]`, `[Hardware]`, `[Flow]`, `[Dependency]`, `[Branch]`, `[Feedback]`, `[Boundary]`. Example: `A["[Memory] KV cache"]`.

Every diagram MUST be followed by an equivalent nested text list.

For hardware and systems topics, diagrams show execution topology (`Model → Operations → Kernel → SM → Tensor Core → SRAM → HBM → NVLink/Fabric`), not concept clouds.

Beyond the concept map, every section carries **authored figures and rail instruments** written as fenced `figure` blocks. Their grammar — the twelve figure kinds (diagram, tensor-flow, systems-trace, memory-stack, calculator, stat-panel, lineage, cycle, matrix, chart, hierarchy, compare), the envelope fields, the formula language, the evidence rules for numbers inside figures, the rail binding rules, and the per-section minimums — is normative in [`docs/VISUAL_GRAMMAR.md`](VISUAL_GRAMMAR.md). The atlas compiler (`cd atlas && npm run compile:check`) rejects figures that violate it.

---

## 9. Vocabulary and naming

- Name organisations, systems, venues, and discovery sources exactly as `Instruction/AI_REFERENCE_STACK.md` names them: *Google DeepMind*, *Meta AI / FAIR*, *Alibaba Qwen*, *Z.ai / Zhipu AI / GLM*, *Moonshot AI / Kimi*, *DeepSeek*, *ByteDance Seed*, *NVIDIA CUDA*, *NVIDIA cuBLAS / cuBLASLt*, *NVIDIA NCCL*, *NVIDIA CUTLASS*, *Triton language* (never confused with *NVIDIA Triton Inference Server*), *NVIDIA Transformer Engine*, *AMD ROCm*, *AMD HIP*, *AMD RCCL*, *PyTorch FSDP2*, *PyTorch DTensor / DeviceMesh*, *TorchTitan*, *NVIDIA Megatron-Core*, *Megatron-LM*, *Microsoft DeepSpeed*, *Hugging Face Transformers / Accelerate / PEFT / TRL*, *torchtune*, *OpenRLHF*, *verl*, *NVIDIA NeMo RL*, *FlashAttention*, *Liger Kernel*, *vLLM*, *SGLang*, *TensorRT-LLM*, *llama.cpp*, *Hugging Face Text Generation Inference (TGI)*, *LMDeploy*, *ONNX Runtime*, *OpenVINO*, *Apple MLX / MLX-LM*.
- Use the stack layer names of `AI_REFERENCE_STACK.md` §4.1 when placing a system: *Accelerator / driver / compiler*, *Kernels / numerics / collectives*, *Model / autograd framework*, *Distributed training*, *Model definition / adaptation*, *Post-training / RL*, *Inference engine*, *Serving / portable runtime*.
- Use the inspection dimensions of §4.2 as the checklist vocabulary for any systems section: *Parallelism, Precision, Memory, Communication, Kernels, Checkpointing, Post-training, Inference, Metrics, Reliability, Reproducibility*.
- Metric names are fixed: **MFU, HFU, FLOP/s, HBM bandwidth, network bandwidth, tokens/s/GPU, TTFT, TPOT, ITL, E2E latency, p50/p95/p99, goodput, requests/s, cost/token, cost per accepted task**. Definitions live in `front-matter/notation.md` (from the plan's shared mathematical contract) and MUST NOT be redefined.
- Distinguish, always: objective vs algorithm vs feedback source vs architecture vs implementation; artifact format (GGUF, safetensors) vs tensor library (GGML) vs inference implementation (llama.cpp) vs model-management product (Ollama); RLVR (a reward setting) vs GRPO (an optimisation construction) vs reasoning (a behaviour); LoRA (adaptation) vs quantisation/pruning (compression); RoCE (RDMA carried over Ethernet) vs InfiniBand; CXL (interconnect protocol) vs memory media.
- TGI is a historical architecture and migration case (repository archived, maintenance mode). TensorRT-LLM's current runtime is PyTorch-native; legacy TensorRT-engine workflows are separate. FlashAttention-4 is a versioned hardware/algorithm case study; do not extrapolate its reported speedups.

---

## 10. Notation

All symbols follow `front-matter/notation.md`. In particular: `N` parameters, `D` training tokens, `C` compute, `L` layers, `B` batch, `S` or `T` sequence length (state which), `H_q`/`H_kv` heads, `d_model`, `d_h` head dimension, `b` bytes per value, `θ` parameters, `π_θ` policy, `π_ref` reference policy, `β` KL coefficient, `τ` distillation temperature, `I` arithmetic intensity, `P_peak`, `B_mem`. A section MAY introduce local symbols but MUST define them in a variable table at first use and MUST NOT reuse a global symbol with a different meaning.

---

## 11. Cross-references

- Link with relative paths. A section reference reads `[§14.2 Latent attention](../../part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/14-2-latent-attention.md)`.
- A concept is defined once, in its owning chapter (§3 item 12). Elsewhere, link; do not redefine. If you need to recall a definition, quote at most one sentence and link.
- Forward references are allowed and SHOULD be phrased as "developed in §29.4", never as an assumption that the reader has read it.

---

## 12. Prose standard

- Audience: principal scientists, research engineers, AI systems architects, advanced graduate researchers. Do not explain graduate-level ML basics; do explain every mechanism to its physical cost.
- Every mechanism is followed by its cost: parameters, tokens, FLOPs, memory capacity, memory traffic, communication, latency, throughput, energy, money. If a cost is not known, say NOT-DISCLOSED or UNVERIFIED; do not omit the cost line.
- Brutal truth over comfort: state where the evidence is thin, where a method's reported gains have not been independently reproduced, where a widely repeated claim is a category error, and where a vendor figure does not transfer to the reader's workload.
- No marketing language, no "state-of-the-art" without a dated benchmark record, no rankings of labs or models, no "best".
- Physical analysis concerns measured resource constraints. Cognitive analogies are heuristic unless supported by intervention evidence, and MUST be introduced as "heuristically".
- The opening of a chapter is 200–300 words. Section prose is dense; prefer a table to a paragraph when the content is parallel.
- British or American spelling MAY be used but MUST be consistent within a chapter.

---

## 13. `verification.md`

Frontmatter with `entity_type: verification`. Body:

1. **Artifact specification.** Exactly what files/tables/records the chapter artifact consists of, with field lists.
2. **Verification task.** The falsifiable task from the plan, expanded into a protocol using the Experiment block (§5), including what result would *reject* the chapter's central claim.
3. **Acceptance criteria.** Numeric or categorical, with tolerances where relevant.
4. **What this edition did not do.** A plain statement that the protocol is a proposal and has not been executed.

## 14. `references.md`

Frontmatter with `entity_type: references`. A table of every work cited in the chapter:

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|

- **Grounding is mandatory.** Authors MUST open each primary source with web fetch/search while writing, confirm the claims attributed to it, and record the actual date the page was opened in the *Accessed* column (never a nominal edition date). A source that could not be opened has Status = UNVERIFIED and Accessed = null, and every claim resting on it is labelled UNVERIFIED in the text.
- Spine papers use their `Pnn` id as Key and MUST match Appendix D exactly.
- Other works use `R<ch>.<n>`.
- Type ∈ paper · technical report · documentation · repository · dataset card · model card · course · measurement source.
- Status ∈ peer-reviewed · preprint · official documentation · archived · UNVERIFIED. A preprint's presence is not a claim of peer review.
- URLs MUST be ones the author can attribute with confidence (arXiv abs pages, official documentation roots from `AI_REFERENCE_STACK.md`, official GitHub organisations). Otherwise Status = UNVERIFIED and the URL cell is `null`.

---

## 15. Review gates (from Appendix H) that every chapter MUST pass before `editorial_status: reviewed`

| Gate | Required evidence |
|---|---|
| Taxonomy | One canonical section per concept; valid typed relations; no duplicate sibling under a different name |
| Dependency | Earlier prerequisites or an explicit primer; no cycles |
| Mathematics | Defined symbols, valid shapes/units, explicit approximation regime, correct estimator and normalisation |
| Implementation | Exact repository/commit/configuration or UNVERIFIED; API and tensor contracts; no inferred undocumented internals |
| Numerical behaviour | Reference comparisons, dtype/accumulation details, extreme-input cases, tolerances |
| Experiment | Comparable budgets, independent evaluation, contamination checks, uncertainty, meaningful ablations |
| Systems | Compute/HBM/network accounting, workload definition, latency quantiles, throughput/goodput, recovery |
| Operational behaviour | Timeouts, retries, backpressure, state consistency, observability, rollout and rollback |
| Security/authorisation | Threat assumptions, permissions, data boundaries, side-effect controls |
| Editorial quality | Precise terminology, concise introduction, source-supported mechanisms, bounded claims, clear limitations |

---

## 16. Minimal worked example of a section file

```markdown
---
id: ms.section.42.2
entity_type: section
title: State accounting
volume: 2
part: 7
chapter: 42
section: 42.2
slug: 42-2-state-accounting
parent: ms.chapter.42
prev_sibling: ms.section.42.1
next_sibling: ms.section.42.3
children: []
prerequisites: [ms.section.5.6, ms.section.14.1, ms.section.25.2]
downstream: [ms.section.43.2, ms.section.44.3, ms.section.48.4]
related: [ms.section.23.5]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P36}
  - {type: implemented_by, target: impl.vllm}
axes: {lifecycle: [inference, serving], mechanism: [memory_accounting], feedback_setting: [], modality: [text]}
papers: [P36]
implementations: [impl.vllm, impl.sglang, impl.tensorrt-llm]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 1000
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 42.2 State accounting

## Scope
…

## Why this exists
…

## Formulation

> **Definition — KV cache.** The per-layer key and value tensors retained across decode steps so that attention over the prefix is not recomputed.

$$
M_{KV} = 2\,L\,B\,S\,H_{kv}\,d_h\,b
$$
*(Eq. 42.1)* where L = layers, B = sequences, S = tokens per sequence, H_kv = KV heads, d_h = head dimension, b = bytes per value.

> **Claim [MATHEMATICALLY-DERIVED · DERIVED:eq-42.1].** For L=32, B=8, S=8192, H_kv=8, d_h=128, b=2 the conventional KV tensors occupy 8 GiB before paging metadata. This is illustrative, not a specification for any named model.

…

## Observations
**What the paper claims.** …
**What the evidence shows.** …
**What we infer.** …
**What remains unknown.** …

## Siblings
…
```

---

## 17. Things a chapter MUST NOT do

- Be a reference list, an outline, or a placeholder. Every file carries the full research manuscript for its node; the content-writing duty belongs to the authors of this book and to no one else.
- Change, paraphrase, or "improve" any file in `Instruction/`. Those files are read-only inputs.
- Present a proposed experiment as a result.
- Present a lab's or vendor's reported number as the book's measurement.
- Rank labs, models, or engines.
- Define a term that another chapter owns.
- Use a system name loosely (e.g. "Triton" without saying language or server).
- Reuse a symbol from `notation.md` with a different meaning.
- Ship a Mermaid diagram without its text equivalent.
- Leave a matrix "Required coverage" item unaddressed without an explicit one-line note saying why.

---

## 18. Author workflow (applies to every chapter author, human or agent)

1. **Read, in order:** this contract in full; the chapter's matrix in `book_plan.md` (six rows of *Required coverage*, the Verification line, the Source anchors), plus the plan's corrections table, shared mathematical contract, Appendix A–D entries relevant to the chapter, and Appendix H; `docs/front-matter/notation.md`; `Instruction/AI_REFERENCE_STACK.md` in full; `docs/atlas-manifest.json` for ids, slugs, and paths; the part `README.md`; and one finished exemplar chapter (Chapter 04 or 05) to match depth and block grammar.
2. **Build the reference-stack map first.** Before writing prose, list which reference-stack entries (§1 labs, §2 conferences, §3 discovery sources, §4 systems with their §4.1 layer, §4.2 inspection dimensions) the chapter draws on. This list becomes the *Reference-stack coverage* table (§3 item 13) and drives what is fetched.
3. **Fetch primary sources while writing.** Follow the reference stack's own protocols: lab-level search protocol §1.1, conference workflow §2.1, paper-search cascade §3.1, training-stack search protocol §4.3. Open the arXiv abs/HTML page, the official documentation root, the official repository, or the model card; confirm each attributed claim; quote sparingly and exactly; record the URL and access date in `references.md`. Rank and discovery sites prioritise what to read; they never substitute for the paper, model card, repository, or official documentation.
4. **Write the nine files** (chapter page, six sections, `verification.md`, `references.md`) into the chapter folder only. Never touch `Instruction/`, `book_plan.md`, or another chapter's files.
5. **Self-check before reporting:** every matrix item covered; fixed H2 headings present; one evidence label per non-trivial claim; no EMPIRICALLY-OBSERVED or CODE-VERIFIED; every mechanism followed by its cost line; every Mermaid diagram followed by a text list; frontmatter ids and sibling chain correct (section K.6 → `ms.verification.K` → `ms.references.K`); every relative link resolves to a path in the manifest; no term defined that another chapter owns.
6. **Report:** files and word counts; URLs fetched; NOT-DISCLOSED/UNVERIFIED items; uncovered matrix items with reasons; sections of other chapters linked; the *Terms owned here* list.
