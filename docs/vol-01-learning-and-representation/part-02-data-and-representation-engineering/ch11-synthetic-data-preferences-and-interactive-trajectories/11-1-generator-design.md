---
id: ms.section.11.1
entity_type: section
title: Generator design
short_title: Generator design
volume: 1
part: 2
chapter: 11
section: 11.1
slug: 11-1-generator-design
parent: ms.chapter.11
prev_sibling: null
next_sibling: ms.section.11.2
children: []
prerequisites: [ms.section.2.2, ms.section.6.2, ms.section.7.2, ms.section.7.5, ms.section.9.2, ms.section.10.4]
downstream: [ms.section.11.2, ms.section.11.3, ms.section.11.4, ms.section.11.6, ms.section.31.2, ms.section.37.1, ms.section.39.3]
related: [ms.section.9.6, ms.section.8.5]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P26}
  - {type: supported_by, target: paper.P29}
  - {type: supported_by, target: paper.P22}
  - {type: implemented_by, target: impl.vllm}
  - {type: implemented_by, target: impl.hugging-face-trl}
  - {type: consumes, target: concept.dataset-provenance-record}
  - {type: produces, target: concept.synthetic-data-provenance-record}
axes: {lifecycle: [data, post_training], mechanism: [synthetic_generation, prompting, seed_sampling, provenance], feedback_setting: [ai_feedback], modality: [text]}
papers: [P22, P26, P29]
implementations: [impl.vllm, impl.sglang, impl.hugging-face-trl, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 11.1 Generator design

## Scope

Objective: specify the object that produces synthetic training data — a *generator configuration* consisting of a teacher model, a prompting scheme, a seed set, and sampling controls — and the *synthetic-data provenance record* that makes any resulting sample auditable. Baseline: "we generated the data with a large model" with no record of prompts, seeds, versions, or sampling settings. Success: a reader can, from the provenance record alone, name the distribution a sample was drawn from, reproduce the generation call, and predict which properties of the corpus (diversity, difficulty, style) were fixed by which configuration field. Boundaries: what the generated targets *are* (instructions, rationales, preferences, trajectories) is [§11.2](11-2-target-types.md); how samples are kept or discarded is [§11.3](11-3-selection-and-verification.md); sampling distributions themselves (temperature, nucleus truncation, their effect on entropy) are owned by [§37.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-1-sampling-distributions.md); the general dataset record and its provenance fields are owned by [§7.5](../ch07-data-provenance-acquisition-and-dataset-semantics/07-5-dataset-documentation.md) and extended, not redefined, here.

## Why this exists

What failed before was the human-annotation bottleneck for instruction data. Self-Instruct states the problem directly: instruction-tuned models "depend heavily on human-written instruction data that is often limited in quantity, diversity, and creativity" (PAPER-REPORTED · R11.1). The first fix was to prompt a model with a handful of human-written seeds and let it write the rest — Self-Instruct starts "with a limited (e.g., 175 in our study) seed set of manually-written tasks" and iterates to "about 52k instructions, paired with about 82K instance inputs and target outputs" (PAPER-REPORTED · R11.1). The bottleneck that then appeared was not volume but *distribution*: a generator prompted from a fixed seed pool produces a corpus whose diversity is bounded by the seed pool and whose difficulty is bounded by the prompt, so successive methods attacked those two bounds explicitly — Evol-Instruct rewrites instructions "step by step into more complex instructions" through five in-depth operations and one in-breadth mutation (PAPER-REPORTED · R11.2), and Persona Hub replaces the seed pool with "1,015,863,523 personas" so that the same synthesis prompt yields a different sample for every persona (PAPER-REPORTED · R11.3). The constraint that became dominant is provenance: once corpora mix human, model-generated, and model-rewritten text from several teachers and versions, no downstream analysis — contamination, dedup, collapse, coupling — is possible unless every sample carries the configuration that produced it. What changed is that the generator is now treated as a *configured stochastic program* with a typed record, not a one-off script; Tulu 3 reports its synthetic portion (43% of 939,344 prompts) by generator, persona source, and skill target (PAPER-REPORTED / OFFICIAL-DOCUMENTATION · P29, R11.21), which is the level of disclosure this section makes mandatory.

## Intuition

Physically, a generator is an inference workload: a teacher model of N_T parameters run over S seed prompts with K samples each at a sampling temperature, producing tokens at a cost governed by the decode economics of Chapter 42. Every design choice maps to a resource: a larger teacher multiplies cost per token; more samples per seed multiply tokens; a longer prompt (few-shot exemplars, personas, constraints) multiplies prefill; a higher temperature widens the output distribution at the price of a higher rate of rejected samples in §11.3. The corpus that results is a *sample from a distribution the configuration defines*; the seed set fixes the support of the prompt marginal, the prompt template fixes the conditional the teacher is asked to realise, and the sampling controls fix how much of the teacher's conditional is explored. Heuristically, practitioners speak of the teacher "knowing" a domain; the measurable content is that the teacher's conditional distribution over outputs, given the prompt, places mass on outputs a verifier will accept (§11.3), and that mass is a number one can estimate before committing a budget.

## Formulation

Let a generator configuration be the tuple

$$
G = (\,T,\; v_T,\; \Pi,\; \mathcal{S},\; p_{\mathcal{S}},\; \sigma\,)
$$
*(Eq. 11.1)* where T = teacher model (identifier), v_T = teacher version or checkpoint hash, Π = prompt template (system text, few-shot exemplars, output format), 𝒮 = seed set (tasks, documents, personas, or prompts), p_𝒮 = sampling distribution over seeds, σ = sampling controls (temperature, top-p, top-k, max tokens, stop strings, seed integer).

The generator induces a joint distribution over (prompt, target) pairs:

$$
q_G(x, y) \;=\; \sum_{s \in \mathcal{S}} p_{\mathcal{S}}(s)\; p_{T,\sigma}\big(x \mid \Pi(s)\big)\; p_{T,\sigma}\big(y \mid \Pi'(x)\big)
$$
*(Eq. 11.2)* where x = generated prompt or instruction, y = generated target, Π(s) = the instruction-generation prompt rendered from seed s, Π′(x) = the response-generation prompt rendered from x, p_{T,σ} = the teacher's conditional under sampling controls σ (its form is owned by §37.1).

Two consequences follow from Eq. 11.2 without any experiment (MATHEMATICALLY-DERIVED): the support of the prompt marginal q_G(x) is contained in the support of the teacher's conditional over the rendered seeds, so a seed set with S distinct elements bounds the number of distinct "intents" the corpus can carry through the teacher's mixing of them; and any two corpora generated from configurations that differ only in σ are samples from distributions with the same support but different entropy, so their diversity difference is a sampling effect, not a content effect.

> **Definition — generator configuration (teacher configuration).** The typed tuple G of Eq. 11.1 — teacher identity and version, prompt template, seed set and seed distribution, and sampling controls — that fully specifies the distribution q_G a synthetic sample was drawn from. Two samples are from the same generator iff their G tuples are equal field by field.

> **Definition — seed diversity.** For a seed set 𝒮 partitioned into near-duplicate clusters at a declared similarity threshold (clustering owned by [§8.3](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-3-duplicate-structure.md)), the Hill number of order 1, D₁(𝒮) = exp(H(p_cluster)), of the cluster-mass distribution under p_𝒮. D₁ is the "effective number of distinct seeds"; it equals |𝒮| only when every seed is its own cluster and p_𝒮 is uniform.

$$
D_1(\mathcal{S}) = \exp\Big(-\sum_{c} p_c \log p_c\Big),\qquad p_c = \sum_{s \in c} p_{\mathcal{S}}(s)
$$
*(Eq. 11.3)* where c ranges over near-duplicate clusters of 𝒮 and p_c = total seed mass in cluster c. Entropy H follows [§2.3](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/02-3-information-theory.md).

> **Definition — synthetic-data provenance record.** The per-sample extension of the dataset record of §7.5 that stores G (by reference to a registered configuration id), the seed identifier(s) used, the exact rendered prompt hash, the sampling seed integer, the teacher's request/response identifiers, the generation timestamp, the token counts of prompt and completion, and the lineage pointer to any parent sample (for rewrite, evolution, critique–revision, or trajectory-continuation methods).

> **Assumption.** The teacher is stationary during a generation run: v_T does not change between the first and last call · *sensitivity:* hosted teachers behind an API can be silently updated; if v_T is not pinned by the provider, the record must store the response-level model identifier per call and the run must be treated as a mixture of generators (NOT-DISCLOSED for any hosted teacher whose provider does not expose a version string).

## Mechanism

**Teacher selection.** The teacher is the model whose conditional q_G realises. Three selection regimes appear in the sources. (i) *Self-generation*: the teacher is the model being improved. Self-Instruct prompted "vanilla" GPT-3 to write its own instruction data and reported "a 33% absolute improvement over the original model on Super-NaturalInstructions" after fine-tuning on it (PAPER-REPORTED · R11.1, R11.22). STaR fine-tunes GPT-J (6B) on rationales GPT-J itself generated, retraining "from the original pre-trained model M instead of continually training one model to avoid overfitting" at every outer iteration (PAPER-REPORTED · R11.4). (ii) *Stronger external teacher*: Evol-Instruct executed "four epochs of evolution using OpenAI ChatGPT API" starting from the 52k Alpaca instructions to obtain "250k instructions" (PAPER-REPORTED · R11.2); Tulu 3 used GPT-4o to write persona-conditioned math problems and instruction-following prompts and claude-3-5-sonnet for code solutions (PAPER-REPORTED · P29). (iii) *A trained policy as teacher of its successor*: DeepSeek-R1's SFT data were produced "by performing rejection sampling from the checkpoint from the above RL training", yielding "about 600k reasoning related training samples" that then trained both DeepSeek-V3-Base and the distilled Qwen2.5 and Llama3 students (PAPER-REPORTED · P26). Cost line: teacher cost per sample scales with the teacher's decode cost per token (≈ 2N_T FLOPs per token by the [2N-per-token rule](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/05-6-reference-accounting.md), plus the attention term) times completion length, plus prefill over the rendered prompt; for a hosted teacher the cost is the provider's per-token price, which is NOT-DISCLOSED as compute and must be recorded as money in the resource ledger.

**Prompting.** The prompt template Π decides which conditional the teacher realises. The sources use four template families: *few-shot bootstrapping* (Self-Instruct samples 8 in-context task instructions per generation call from a pool that mixes human seeds and model-generated tasks; PAPER-REPORTED · R11.1); *rewriting operators* (Evol-Instruct's "add constraints, deepening, concretizing, increase reasoning steps, and complicate input" plus the in-breadth "mutation, i.e., generating a completely new instruction based on the given instruction"; PAPER-REPORTED · R11.2); *conditioning on an external variable* (Persona Hub's zero-shot, few-shot, and persona-enhanced few-shot prompting, where a persona description is prepended to a fixed synthesis instruction; PAPER-REPORTED · R11.3); and *critique–revision* (Constitutional AI samples a response, asks the model to critique it "according to a constitutional principle", then to revise; principles are "randomly sampled at each revision step"; PAPER-REPORTED · P22). A fifth family, *format-constrained generation*, appears in R1's cold-start stage, where outputs were reformatted into a fixed `|special_token|<reasoning_process>|special_token|<summary>` layout so that the reasoning and the summary are separable fields rather than free text (PAPER-REPORTED · P26). Each template is part of G; changing the exemplars changes q_G exactly as changing the teacher does. Cost line: prompt tokens are paid at prefill on every call; a template with E exemplars of average length ℓ adds E·ℓ prefill tokens per sample, and for persona-conditioned generation the persona text is paid once per sample because it differs across calls and defeats prefix caching unless personas are batched by prefix ([§43](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch43-inference-engine-architecture-and-runtime-semantics/README.md) owns prefix caching).

**Seed diversity.** The seed set is the only component of G that can increase the *support* of q_G(x); the teacher and template can only redistribute mass. Self-Instruct's own diversity analysis computed, for each generated instruction, "its highest ROUGE-L overlap with the 175 seed instructions" and added a new instruction to the pool "only when its ROUGE-L similarity with any existing instruction is less than 0.7" (PAPER-REPORTED · R11.1), which is a seed-diversity control operating on the *output* pool rather than the input pool. Persona Hub moves the control to the input: personas are derived by *Text-to-Persona* (inferring "a specific persona who is likely to [read|write|like|dislike|…] the text") and *Persona-to-Persona* (expanding "via interpersonal relationships" for "six iterations"), then deduplicated with MinHash ("1-gram and a signature size of 128 … at the similarity threshold of 0.9") and by embedding ("cosine semantic similarity greater than 0.9") (PAPER-REPORTED · R11.3). Under Eq. 11.3, deduplication at threshold 0.9 fixes the cluster partition and therefore D₁; the number "1,015,863,523" is the cardinality |𝒮| after that partition, not D₁ under a stricter threshold, which is NOT-DISCLOSED. Tulu 3 sampled "∼250K personas from Persona Hub" and prompted GPT-4o "to generate problems that are unique and specific to a given persona input" (PAPER-REPORTED · P29) — a seed-diversity decision (250K personas rather than 1B) made under a budget. Cost line: seed diversity costs nothing at generation time beyond storing the seed pool; its cost is paid in the *construction* of the pool (web scraping, persona inference, dedup passes) and in the acceptance rate of §11.3, because a more diverse seed pool produces a larger fraction of prompts outside the teacher's competence.

**Sampling controls.** σ determines how much of the teacher's conditional is explored per seed. The mechanism — per-token rescaling by 1/temperature and truncation by top-p / top-k / min-p — is owned by §37.1; here only the design consequences are stated. vLLM's `SamplingParams` documents `temperature` ("Zero means greedy sampling"), `top_p` ("Must be in (0, 1]"), `top_k`, `min_p`, `n` ("Number of outputs to return for the given prompt request"), `seed`, and warns that "Random sampling without an explicit seed may not be batch invariant" (OFFICIAL-DOCUMENTATION · R11.15). The last sentence is the provenance-relevant one: without a recorded seed *and* a fixed batch composition, a generation run is not reproducible even at the engine level, so the provenance record stores the seed integer and the engine version, and treats exact reproduction as UNVERIFIED unless the engine documents batch invariance for that version. Two paper-reported facts bound the design space. DeepSeek-R1's cold-start data were sampled from R1-Zero at temperature 1.0 (PAPER-REPORTED · P26 v2 rendering as fetched; the v1 text describes the same collection without the temperature figure — the figure is therefore carried as UNVERIFIED against v1 and PAPER-REPORTED against v2), and the released model card recommends inference at "0.5-0.7 (0.6 is recommended)" (OFFICIAL-DOCUMENTATION · R11.17) — the generation temperature and the deployment temperature of the same model differ, which is expected when generation aims at coverage and deployment at reliability. Llama 2 reports that "the optimal temperature is not constant during the iterative model updates: RLHF has a direct impact on rescaling the temperature" (PAPER-REPORTED · R11.5), so a σ tuned for one policy version is stale for the next; σ must be re-validated per v_T. Cost line: raising `n` multiplies decode tokens linearly; with a shared prompt the prefill is paid once per request in engines that batch the n samples, so the marginal cost of the k-th sample is decode-only (OFFICIAL-DOCUMENTATION for the `n` semantics · R11.15; the prefill-sharing behaviour per engine version is UNVERIFIED here and owned by §43).

**Synthetic-data provenance.** The record binds every sample to G. The Appendix C mandatory fields already require "generator/policy if synthetic" ([Appendix C](../../../appendices/appendix-c-dataset-atlas-and-training-role-taxonomy.md)); this section makes that one field a structured object. The reason is downstream: contamination checks (§8.5) need the teacher identity to reason about what the teacher may have memorised; dedup after generation (§11.6) needs the seed identifier to distinguish two samples from the same seed from two seeds that converged; collapse audits (§11.4) need generation-lineage depth (how many model generations separate the sample from human text); and coupling analysis (§11.4) needs to know whether the teacher and the student share a base. Tulu 3's decontamination — "8-gram matching" with a test instance flagged "if more than 50% of the test tokens have 8-gram matches", followed by "removing any training set that has overlap with more than 2% of our evaluation suite" — is a *post-generation* gate that is only actionable because the affected samples can be traced to their source set (PAPER-REPORTED · P29; OFFICIAL-DOCUMENTATION · R11.21). Cost line: the record adds a fixed number of bytes per sample (identifiers, hashes, counts), negligible against the token payload; its real cost is engineering discipline — the generation client must emit it at call time, because it cannot be reconstructed afterward.

## Algorithm

```text
Algorithm 11.1 — Provenance-recording synthetic generation
INPUT   registered configuration G = (T, v_T, Π, S, p_S, σ); budget in tokens B_tok;
        per-seed sample count K; dedup threshold t (from §8.3); seed-set clustering
OUTPUT  sample set Y with one provenance record per sample; run manifest
STATE   tokens_spent; seed cursor; record log; failure counter
INVARIANT  every emitted sample has a record whose config_id resolves to G and whose
           rendered_prompt_hash equals hash(Π(s) or Π'(x)) as sent; tokens_spent ≤ B_tok
1  Freeze G: hash Π, hash S, pin v_T (fail if the provider cannot return a version string
      and the run is not permitted to be a mixture).
2  Compute D_1(S) by Eq. 11.3 at threshold t; write it to the manifest.
3  For each seed s drawn from p_S until tokens_spent ≥ B_tok:
4     Render prompt P ← Π(s); record hash(P), |P| tokens.
5     Call teacher with σ and an explicit seed integer; receive K completions
         x_1..x_K and per-call model identifier m.
6     If m ≠ v_T: mark the call as version-drift; either abort or tag the samples
         as belonging to generator G' = G with v_T := m.
7     For each x_k: render Π'(x_k), call teacher for the target y_k (same controls),
         record hashes, token counts, request ids, timestamp.
8     Emit (x_k, y_k, record) with lineage parent = s (or the parent sample id for
         rewrite/evolution/revision methods).
9     tokens_spent += prompt and completion tokens of every call, including failed ones.
10 Write manifest: G, D_1(S), tokens_spent, samples emitted, calls failed, version-drift
      count, seed-mass histogram actually realised (vs p_S).
```

DERIVED — complexity: O(|calls|) bookkeeping; the run cost is the token cost of line 5 and 7, ≈ Σ_calls (prefill tokens + decode tokens) × cost per token of T. Termination: the token budget is monotone non-decreasing and every call consumes ≥ 1 token. The realised seed-mass histogram in line 10 is what §11.4's coverage analysis consumes; p_S is the intent, the histogram is the fact.

## Implementation

The generator is an inference workload followed by a serialisation step. In the reference stack it is realised by an *Inference engine* — vLLM (#41) or SGLang (#42) — for open-weight teachers, or by a hosted API for closed teachers (which is outside the stack and recorded as such). vLLM's offline entry point returns `n` completions per prompt under a `SamplingParams` object whose fields map one-to-one onto σ (OFFICIAL-DOCUMENTATION · R11.15); the engine version belongs in v_T's neighbour field because sampling kernels and batch composition affect the realised distribution (OFFICIAL-DOCUMENTATION · R11.15, the batch-invariance warning). The serialised output should be written directly in the type expected by the downstream trainer: Hugging Face TRL (#29, *Post-training / RL* layer) documents a *prompt-completion* type (`{"prompt": …, "completion": …}`), a *preference* type (`prompt`/`chosen`/`rejected`), an *unpaired preference* type (`prompt`/`completion`/`label`), and a *stepwise supervision* type (`prompt`/`completions`/`labels`), each in *standard* or *conversational* format, and states that "SFTTrainer" expects "Language modeling or Prompt-completion" while "DPOTrainer" expects "Preference (explicit prompt recommended)" (OFFICIAL-DOCUMENTATION · R11.11, TRL v1.13.0). The provenance record is *not* one of those columns; it travels as additional columns that trainers ignore, which keeps one file both trainable and auditable. Conversational rendering into token sequences — chat templates and their parity between generation and training — is owned by [§10.4](../ch10-tokenization-serialization-and-interface-correctness/10-4-conversation-serialization.md); a mismatch between the template used to prompt the teacher and the template used to train the student is a provenance defect that the record makes detectable because it stores the rendered-prompt hash.

```text
Systems trace (one generation run)
seed sampling    → compute: negligible / memory: seed pool / failure: p_S not realised (log histogram)
prefill          → compute: ≈2·N_T FLOPs × prompt tokens / memory: KV for the prompt / failure: prefix cache miss on per-sample personas
decode (n=K)     → compute: ≈2·N_T FLOPs × completion tokens × K / memory: K × KV growth / failure: seed not set → non-reproducible
serialise        → storage: JSONL/Parquet with TRL columns + provenance columns / failure: rendered-prompt hash missing
manifest         → storage: G, D_1(S), token ledger / failure: teacher version drift unrecorded
```

Under the §4.2 dimensions, the relevant ones are *Inference* (batching of the K samples, prefix reuse), *Metrics* (tokens/s/GPU of the teacher fixes wall-clock; cost/token fixes money), and *Reproducibility* (engine version, seed, sampling kernels). No throughput number is stated here; any figure would need the performance-figure context of the contract and none was measured.

## Experimental design

### Experiment 11.1 — Seed diversity versus corpus diversity at fixed teacher and budget

- **Hypothesis:** at fixed T, Π, σ and token budget, corpus diversity (near-duplicate cluster count of the generated prompts at §8.3's threshold) increases with D₁(𝒮) with diminishing returns, and the student's held-out score tracks corpus diversity rather than |𝒮|.
- **Setup:** four seed sets with D₁ spanning two orders of magnitude (constructed by subsampling clusters of one persona-style pool); K = 4 samples per seed; equal total generated tokens per arm; one student, one SFT recipe, r ≥ 3 seeds.
- **Independent variables:** D₁(𝒮).
- **Controlled variables:** teacher, template, σ, total tokens, student, recipe, evaluation set (held-out, decontaminated by §8.5).
- **Dataset/workload:** instruction-following prompts synthesised per seed; targets generated by the same teacher.
- **Hardware:** one accelerator class for the teacher; one for the student; hours logged.
- **Metrics:** cluster count of generated prompts; student score with §6.4 intervals; tokens per unique cluster.
- **Baselines:** the smallest-D₁ arm.
- **Expected result:** cluster count concave in D₁; student score increasing then flat; if student score is flat across all arms, seed diversity is not the binding constraint at this budget.
- **Ablation:** hold D₁ fixed and vary σ (temperature) to separate sampling-induced from seed-induced diversity.
- **Interpretation:** a positive slope attributes gains to support expansion; a flat slope with rising cluster count means the added clusters are outside the evaluation distribution.
- **Threats to validity:** the near-duplicate threshold defines "diversity"; the evaluator may favour the teacher's style (§11.4).

Proposal only; no run was executed.

## Observations

**What the paper claims.** R11.1 claims Self-Instruct data trained from 175 seeds close most of the gap to InstructGPT-001 and that "only a 5% absolute gap" remains on expert-written instructions. R11.2 claims Evol-Instruct data make LLaMA "outperform" Alpaca and Vicuna baselines on its evaluations. R11.3 claims persona conditioning yields diverse data at billion-persona scale and reports 64.9% on MATH for a Qwen2-7B model fine-tuned on 1.09M synthesised problems. P29 claims a fully open recipe whose synthetic portion is persona-driven and decontaminated. P26 claims that 800k rejection-sampled and curated samples suffice, by SFT alone, to transfer reasoning behaviour to smaller students.

**What the evidence shows.** Self-Instruct's own quality audit found that only "54%" of sampled instances had all fields valid and that "58%" had a correct and acceptable output (PAPER-REPORTED · R11.1), so the reported 33% gain was obtained from data of which nearly half was defective by the authors' own review — which is evidence about *robustness of SFT to noise* as much as about the generator. None of the four generators has an independent reproduction inspected for this edition; the comparisons across them are not matched (different students, budgets, evaluations).

**What we infer.** DERIVED: Eq. 11.2 implies that teacher, template and seed set are not interchangeable levers — only the seed set can add support — so a corpus that is "not diverse enough" should be diagnosed by D₁(𝒮) before the teacher is changed. ASSUMED: that a teacher's version is stable within a run; the provenance record is built to detect when this fails.

**What remains unknown.** The temperatures, top-p values and sample counts used to generate the Tulu 3 and Persona Hub corpora are NOT-DISCLOSED in the pages inspected. D₁ of Persona Hub under any threshold other than 0.9 is NOT-DISCLOSED. Whether exact regeneration from a stored seed integer is possible on a given vLLM version and batch composition is UNVERIFIED.

## Failure modes

> **Failure mode — Teacher version drift.** *Symptom:* two halves of a corpus generated a week apart differ in style or refusal rate. *Cause:* hosted teacher updated without a version change visible to the client. *Detection:* per-call model identifier differs; style-distribution shift across timestamps (§11.4). *Mitigation:* Algorithm 11.1 line 6; treat as two generators.

> **Failure mode — Seed pool collapse by output filtering.** *Symptom:* corpus diversity stops growing after the first few thousand samples. *Cause:* ROUGE-style novelty filters against a growing pool reject an increasing fraction; the effective seed distribution narrows. *Detection:* acceptance rate of the novelty filter falls with pool size. *Mitigation:* move diversity control to the input (persona or task conditioning); report D₁(𝒮).

> **Failure mode — Unrecorded rendered prompt.** *Symptom:* the student is trained on targets generated under a different chat template from the one used in training. *Cause:* provenance stored only the seed, not the rendered prompt hash. *Detection:* none after the fact. *Mitigation:* store hash(Π(s)); parity checks per §10.4.

> **Failure mode — Non-reproducible sampling.** *Symptom:* regeneration from stored seeds yields different text. *Cause:* batch-composition dependence of sampling kernels (R11.15's warning). *Detection:* regenerate a fixed subset under the same batch and compare. *Mitigation:* record engine version and batch layout; do not claim bitwise reproducibility.

## Siblings

**Human demonstration collection** — [§31.2 Data families](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/31-2-data-families.md)
Why it exists: targets written by people under a rubric. What assumption changed: the conditional q(y|x) is human, not a model's. What problem it solved: no teacher bias. New failure mode: annotator population bias, cost per sample. Changed primitive: teacher call → annotation task.

**Web-scale corpus acquisition** — [§7.3 Acquisition and extraction](../ch07-data-provenance-acquisition-and-dataset-semantics/07-3-acquisition-and-extraction.md)
Why it exists: pretraining needs volume. What assumption changed: samples are found, not generated. What problem it solved: coverage of natural text. New failure mode: rights and provenance gaps. Changed primitive: generation → crawl and extraction.

**Rejection-sampled self-generation (policy as teacher)** — [§11.3](11-3-selection-and-verification.md)
Why it exists: the teacher's raw conditional is too noisy. What assumption changed: a verifier is available. What objective changed: the corpus is q_G restricted to V = 1. New failure mode: prompt-difficulty bias. Changed primitive: emit all → emit accepted.

**Mixture policy over existing pools** — [§9.1 Mixture formulation](../ch09-data-mixtures-curricula-and-sample-efficiency/09-1-mixture-formulation.md)
Why it exists: the data already exist and must be weighted. What assumption changed: no new samples are created. New failure mode: data-constrained regime. Changed primitive: generator → sampler.

## Extensions

Domain adaptation adds domain documents to 𝒮 (Text-to-Persona style) and makes the domain's cluster mass part of p_𝒮. Long-context generation multiplies prefill cost and requires the record to store the context's hash separately from the instruction's. Multimodal generation adds the image/audio identifier to the seed record; TRL's vision datasets require an `images` column and a typed `content` list (OFFICIAL-DOCUMENTATION · R11.11). Agent data replace Π′(x) by an environment loop and are developed in [§11.5](11-5-interactive-collection.md). Proposal: register G under a content-addressed id and require every synthetic sample in the book's dataset records to reference one.

## Limitations

Eq. 11.2 treats the teacher as a fixed conditional; hosted teachers violate this. D₁ depends on a similarity threshold that is a design input, not a property of the data. The section says nothing about *whether* a given synthetic corpus helps a student — that is §11.6 and the verification protocol. Falsification: if a controlled study found that student outcomes are insensitive to D₁ across two orders of magnitude at fixed budget, seed diversity would be demoted from a first-class configuration field to a diagnostic. Decision consequence: no synthetic dataset enters a training run in this book without a resolvable configuration id.

## Reproducibility

Versions: R11.1 arXiv 2212.10560 v2 (PDF, text extracted; ACL 2023 version listed at R11.22); R11.2 arXiv 2304.12244 v3 (PDF, header "Published as a conference paper at ICLR 2024"); R11.3 arXiv 2406.20094 (HTML); R11.4 arXiv 2203.14465 v2 (PDF); R11.5 arXiv 2307.09288 (HTML rendering); P26 arXiv 2501.12948 v1 (HTML) and v2 (HTML, dated 2026-01-04 on the page); P29 arXiv 2411.15124 (HTML); P22 arXiv 2212.08073 (PDF); R11.15 vLLM `SamplingParams` API page (latest); R11.11 TRL dataset-formats page (v1.13.0); all accessed 2026-09-23. Artifacts: the configuration registry and provenance columns specified in [verification.md](verification.md). Unresolved: sampling controls of the cited corpora (NOT-DISCLOSED); engine-level reproducibility (UNVERIFIED).

## References

P22, P26, P29; R11.1, R11.2, R11.3, R11.4, R11.5, R11.11, R11.15, R11.17, R11.21, R11.22; Appendix C mandatory fields; notation.md §1.
