---
id: ms.section.11.4
entity_type: section
title: Distributional risks
short_title: Distributional risks
volume: 1
part: 2
chapter: 11
section: 11.4
slug: 11-4-distributional-risks
parent: ms.chapter.11
prev_sibling: ms.section.11.3
next_sibling: ms.section.11.5
children: []
prerequisites: [ms.section.2.2, ms.section.2.3, ms.section.6.2, ms.section.8.3, ms.section.8.5, ms.section.9.2, ms.section.11.1, ms.section.11.3]
downstream: [ms.section.11.6, ms.section.24.2, ms.section.32.6, ms.section.39.6, ms.section.61.4, ms.section.62.4, ms.section.65.2]
related: [ms.section.9.6, ms.section.24.2]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P26}
  - {type: supported_by, target: paper.P29}
  - {type: contradicted_by, target: paper.R11.9}
  - {type: consumes, target: concept.synthetic-data-provenance-record}
axes: {lifecycle: [data, post_training, evaluation], mechanism: [distribution_shift, model_collapse, contamination, coupling], feedback_setting: [ai_feedback], modality: [text]}
papers: [P26, P29]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: true}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 11.4 Distributional risks

## Scope

Objective: characterise the ways a synthetic corpus can differ from the distribution the student is meant to learn — teacher errors, style convergence, benchmark leakage, coverage collapse, feedback loops across generations, and generator–student coupling — each with a measurable symptom, a mechanism, and a cost of detection. Baseline: "synthetic data worked in paper X, so it will work here." Success: a reader can, from a corpus's provenance records and a small audit, estimate which of the six risks is present and at what magnitude before a training run is committed. Boundaries: contamination *detection* mechanics are owned by [§8.5](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-5-evaluation-contamination.md); duplicate structure by [§8.3](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-3-duplicate-structure.md); forgetting under sequential training by [§24.2](../../part-04-training-science-and-adaptation/ch24-continual-learning-model-editing-and-unlearning/24-2-forgetting-and-transfer.md); reward exploitation by [§32.6](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch32-preferences-reward-models-verifiers-and-oversight/32-6-reward-exploitation.md); judge biases in evaluation by [§62.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/62-4-judge-failure-modes.md). This section owns the *synthetic-corpus* forms of these risks.

## Why this exists

What failed before was the assumption that model-generated text is a free substitute for human text. Self-Instruct's authors already flagged the inheritance problem: "SELF-INSTRUCT depends on LMs, and it will inherit all the limitations that carry over with LMs", naming "tail phenomena" as a serious concern (PAPER-REPORTED · R11.1). The bottleneck that appeared as synthetic fractions grew was *recursion*: when a generation's outputs become the next generation's inputs, small distortions compound. Shumailov et al. define *model collapse* as "a degenerative process affecting generations of learned generative models, where generated data end up polluting the training set of the next generation of models; being trained on polluted data, they then mis-perceive reality", separate *early* collapse ("the model begins losing information about the tails of the distribution") from *late* collapse (convergence "to a distribution that carries little resemblance to the original one, often with very small variance"), and attribute it to three error sources — statistical approximation, functional expressivity, and functional approximation (PAPER-REPORTED · R11.7). The constraint that became dominant is that the risk is *conditional on the protocol*: Gerstgrasser et al. report that "accumulating the successive generations of synthetic data alongside the original real data avoids model collapse", with a linear-regression result that under accumulation "the test error has a finite upper bound independent of the number of iterations" (PAPER-REPORTED · R11.9). So the same word names a catastrophe under a *replace* protocol and a bounded effect under an *accumulate* protocol, and a chapter that does not distinguish them says nothing. What changed is that production recipes now carry explicit counter-measures whose existence is evidence of the risk: Tulu 3's 8-gram decontamination after synthesis, and its removal of any training set overlapping "more than 2% of our evaluation suite" (PAPER-REPORTED · P29; OFFICIAL-DOCUMENTATION · R11.21); DeepSeek-R1's readability filters against mixed-language and over-long chains (PAPER-REPORTED · P26); Llama 3's semantic deduplication of synthetic dialogues (PAPER-REPORTED · R11.6). The six risks below are the ones those counter-measures target.

## Intuition

Physically, a synthetic corpus is a sample from q_G (Eq. 11.2), and the student is trained to approximate q_G restricted by the gate V (Eq. 11.5). Every risk here is a way in which that target differs from the reference distribution p* the student is evaluated against. *Teacher errors* put mass on wrong outputs; *style convergence* puts mass on a narrow surface form; *coverage collapse* removes mass from regions p* has; *benchmark leakage* puts mass exactly on the test items; *feedback loops* iterate the previous four; *coupling* means the student's and the generator's errors are correlated so that the student's evaluator (often the same family) cannot see them. The physical quantity behind most of these is the *entropy* of the corpus relative to p*: sampling at reduced temperature, filtering by a judge that prefers one style, and re-generating from a previous student all lower entropy in ways that a token-level statistic can detect before a student is trained. Heuristically, people describe a collapsed corpus as "the model talking to itself"; the measurable content is the shrinking of tail mass across generations, which Shumailov et al. illustrate with a Gaussian re-estimated from finite samples at each generation (PAPER-REPORTED · R11.7) and which Eq. 11.11 below states for the discrete case.

## Formulation

Let p* be the reference distribution (human text for the task, or the evaluation distribution), q₀ = p*, and let generation g produce a model p_g trained on data drawn from a *training distribution* q_g. Two protocols:

$$
\text{replace: } q_{g} = p_{g-1},\qquad
\text{accumulate: } q_{g} = \frac{1}{g+1}\sum_{j=0}^{g} p_{j}\ \ (p_0 := p^*)
$$
*(Eq. 11.11)* where p_j = the model of generation j (p₀ the source), and mixing weights in the accumulate case are equal for illustration; a general recipe assigns weights w_j with Σ w_j = 1 and w₀ > 0 for the real data (DERIVED restatement of the two settings compared by R11.7 and R11.9).

> **Definition — coverage collapse.** For a partition of the support of p* into cells (domains, intents, or near-duplicate clusters at a declared threshold), the fraction of cells whose mass under the synthetic corpus q falls below a declared floor ε while their mass under p* exceeds ε. It is the synthetic-corpus analogue of the [mixture coverage](../ch09-data-mixtures-curricula-and-sample-efficiency/09-2-quality-and-diversity.md) statistic owned by §9.2, applied to a single generated set.

$$
\mathrm{CC}_\varepsilon(q; p^*) = \frac{\big|\{c : p^*(c) > \varepsilon,\ q(c) < \varepsilon\}\big|}{\big|\{c : p^*(c) > \varepsilon\}\big|}
$$
*(Eq. 11.12)* where c ranges over cells of the declared partition.

> **Definition — style convergence.** The reduction, relative to p*, of the entropy of *surface* statistics of a corpus — token unigram/bigram distribution, response-length distribution, opener and closer n-grams, formatting tokens — that is not accompanied by a reduction in *content* diversity (cell coverage). It is measured as the divergence between q's and p*'s surface distributions conditional on the same content cells.

$$
\mathrm{SC}(q; p^*) = \mathbb{E}_{c \sim p^*}\Big[\mathrm{KL}\big(q(\text{style} \mid c)\,\|\,p^*(\text{style} \mid c)\big)\Big]
$$
*(Eq. 11.13)* where style = a declared vector of surface features (DERIVED; KL per [§2.3](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/02-3-information-theory.md)). Conditioning on c separates style convergence from coverage collapse: a corpus can cover every cell while writing every cell the same way.

> **Definition — generator–student coupling.** The statistical dependence between a student's errors and its generator's errors on a common evaluation: coupling κ_GS = P(student wrong | generator wrong) − P(student wrong | generator right), estimated on items where the generator's correctness is known. Coupling is high when the student inherited the generator's specific mistakes (through RESP/RAT rows that passed the gate wrongly) or when a shared base makes both fail on the same items.

> **Definition — synthetic feedback loop.** Any pipeline in which a model trained on generation-g data is the generator, judge, or user simulator for generation g+1 data. The loop is *closed* when no real data enters at g+1 (replace protocol) and *open* otherwise.

A one-line discrete illustration of tail loss under replace with N samples per generation (MATHEMATICALLY-DERIVED): a cell with mass m under p_{g−1} is absent from N draws with probability (1 − m)^N ≈ e^{−Nm}; once absent from the sample, a maximum-likelihood estimate assigns it zero mass and it cannot return under replace. Cells with m ≲ 1/N are therefore lost at rate ≈ e^{−Nm} per generation, which is the statistical-approximation error of R11.7 in its simplest form; the accumulate protocol keeps w₀ p* in every q_g so no cell's mass falls below w₀ p*(c) (DERIVED from Eq. 11.11).

> **Assumption.** The evaluator's distribution is p* · *sensitivity:* when the evaluator is itself a model from the generator's family, the "reference" is coupled to the generator and Eq. 11.13's conditioning cells are drawn from the wrong distribution; coupling analysis must then use an evaluator of independent provenance ([§6.1](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-1-evaluation-units.md) evaluator independence).

## Mechanism

**Teacher errors.** The teacher's conditional places mass on incorrect outputs; the gate removes some (Eq. 11.9 precision) and the rest enter the corpus with `teacher_sample` or `rejection_sampled` semantics. The magnitude is the teacher's error rate on the prompt distribution times the gate's false-positive rate, divided by retained mass — the complement of Eq. 11.9. Self-Instruct measured this directly (58% of outputs "correct and acceptable"; PAPER-REPORTED · R11.1); STaR's rationalization deliberately adds rows whose reasoning may be wrong while the answer is right (PAPER-REPORTED · R11.4). The subtle case is *plausible* error: a teacher that writes fluent wrong rationales produces rows a judge accepts (§11.3) and a student learns to imitate, which is where coupling begins. Cost line: detection costs an audit sample under the strongest predicate (Algorithm 11.3 lines 6–7); reduction costs either a stronger teacher (more compute per token) or a stronger gate (more verification per draw).

**Style convergence.** A single teacher under a single template writes in a narrow register; sampling at low temperature narrows it further; a judge that rewards a register narrows it again at selection. The symptom is Eq. 11.13 rising while Eq. 11.12 stays flat: every topic is covered, all in the same voice. R1's cold-start stage is a documented style intervention — R1-Zero outputs were reformatted and rewritten by annotators into a "conversational, human-aligned thinking process" because the raw RL outputs had poor readability and language mixing (PAPER-REPORTED · P26) — that is, the authors changed q's style toward a human-judged p* before training. Evol-Instruct's elimination step removes evolved instructions that copy prompt words or degenerate (PAPER-REPORTED · R11.2), a style filter on the *instruction* side. Cost line: measuring SC needs surface-feature extraction over the corpus and a reference sample of p* — CPU-scale; reducing it costs either generator diversity (several teachers or templates, each a separate G) or a style-neutral gate.

**Benchmark leakage.** A teacher may reproduce evaluation items it memorised, or the seed set may contain them; either way q places mass on test items and the student's score is inflated without capability. This is contamination with a synthetic route, and its detection is owned by §8.5; what this section adds is the *provenance* consequence: leakage can only be traced to a generator, a seed, or a template if the record of §11.1 exists. Tulu 3's procedure — 8-gram matches, a test instance flagged "if more than 50% of the test tokens have 8-gram matches", and whole training sets removed at "more than 2%" overlap with the evaluation suite — was applied to synthetic and public sets alike (PAPER-REPORTED · P29; OFFICIAL-DOCUMENTATION · R11.21). Persona Hub's authors raise the mirror-image concern: a persona-driven synthesis pipeline can *extract* a target model's knowledge at scale, so that "the target LLM's knowledge, intelligence, and capabilities could be extracted and replicated" (PAPER-REPORTED · R11.3) — leakage in the direction of the teacher's provider. Cost line: n-gram decontamination is a pass over corpus × evaluation suite (indexing cost, CPU); it must be re-run whenever the evaluation suite changes, and it cannot detect paraphrased leakage, whose detection cost (embedding search) is higher and whose α, β are UNVERIFIED for any threshold not validated per suite.

**Coverage collapse.** Cells of p* receive too little synthetic mass. Three routes: the seed set lacks them (D₁ of §11.1 small in the relevant region); the gate removes them (rejection sampling with keep-all, Eq. 11.8, removes hard cells); or a previous generation already lost them (Eq. 11.11 replace). Shumailov et al.'s fine-tuning experiments — OPT-125m on wikitext2, each generation trained on the previous generation's outputs — report that with "no original training data" preserved, performance degraded "from 20 to 28 perplexity points" over generations, and that preserving "10% of original training data" in each generation attenuated the degradation (PAPER-REPORTED · R11.7, Figure 10; the paper's own statement is that only "early signs of model collapse can be detected, if models are fine-tuned as opposed to trained from scratch"). Cost line: measuring CC_ε requires the same cell partition used for §9.2's coverage (a classifier or clustering pass); restoring lost cells costs targeted generation with seeds from those cells, at the acceptance rate those cells have — which is typically the lowest, so cost per retained sample in a collapsed cell is the highest in the corpus (Eq. 11.6).

**Feedback loops.** When the student of generation g generates, judges, or simulates users for generation g+1, the four risks above iterate. Under replace, tail loss compounds (the e^{−Nm} argument); under accumulate, R11.9 reports bounded error in linear regression and no collapse in its language-model, diffusion, and VAE experiments (PAPER-REPORTED · R11.9). The two papers are not in contradiction about mechanism; they differ in protocol, and the replace protocol of R11.7 is one that no production recipe inspected here follows — Llama 2 explicitly re-included "top-performing samples from all prior iterations" after observing regressions when only the latest iteration's samples were used (PAPER-REPORTED · R11.5), and R1's SFT mixed rejection-sampled reasoning rows with ≈200k non-reasoning rows from a separate pipeline (PAPER-REPORTED · P26). The loop is also present when the *judge* is the previous student: judge α rises on the student's own errors (coupling), so the gate degrades exactly where it is needed. Cost line: an open loop costs the real data's share of the training budget (w₀ of Eq. 11.11) at every generation; a closed loop saves that cost and pays it back in lost tails.

**Generator–student coupling.** Two routes. *Inheritance:* the student is trained on the generator's outputs, so its error set overlaps the generator's on the gate's false positives. *Shared base:* the student and the generator (or the judge) descend from the same pretrained model, so their error sets overlap even before any synthetic training. R1's distilled students (Qwen2.5 and Llama3 bases trained on R1's outputs) are inheritance-coupled to R1 by construction (PAPER-REPORTED · P26; OFFICIAL-DOCUMENTATION · R11.17); a Tulu 3 preference set judged by GPT-4o and a student evaluated by a GPT-4-family judge would be judge-coupled (the evaluator dependence is the book's inference — DERIVED; whether Tulu 3's reported evaluations use such a judge is not asserted here). The consequence for measurement is that a coupled evaluator under-reports the student's inherited errors; the §6.1 rule of evaluator independence is the counter-measure, and the chapter's verification protocol requires an evaluator of independent provenance for that reason. Cost line: estimating κ_GS requires the generator's correctness on the evaluation items (one generator pass over the evaluation set plus the strongest predicate) — a one-off cost per generator version.

## Algorithm

```text
Algorithm 11.4 — Synthetic-corpus distributional audit
INPUT   synthetic corpus Q with provenance records; reference sample P* (human or
        evaluation-distribution, disjoint from any training use); cell partition Π_c
        (from §9.2's coverage classifier or §8.3's clustering at threshold t); style
        feature extractor φ; evaluation suite E with its contamination index (§8.5);
        generator G and, if available, G's outputs on E with strongest-predicate verdicts
OUTPUT  audit report: CC_ε, SC, leakage rate, lineage-depth histogram, κ_GS estimate,
        per-generator breakdown
STATE   per-cell mass tables for Q and P*; per-row lineage depth
INVARIANT  P* is never read by any training job; every statistic is reported per G
1  Assign each row of Q and P* to a cell by Π_c; tabulate q(c), p*(c).
2  CC_ε ← Eq. 11.12 for the declared ε; list the collapsed cells with their p*(c).
3  For each cell with both q(c), p*(c) ≥ ε: estimate KL(q(φ|c) ∥ p*(φ|c)) with a
      plug-in or k-NN estimator; SC ← p*-weighted mean (Eq. 11.13). Report interval by
      bootstrap over rows.
4  Run §8.5's overlap check of Q against E; report the leakage rate per G and per seed
      source; drop or quarantine flagged rows (recorded in the gate DAG).
5  From provenance, compute lineage depth d(row) = number of model generations between the
      row and human text; report the histogram; flag any G whose inputs are entirely
      depth ≥ 1 (closed loop).
6  If G's verdicts on E exist: for each item, record (generator wrong?, student wrong?)
      after the student is trained; κ_GS ← P(s wrong | g wrong) − P(s wrong | g right),
      with a §2.5 interval. Otherwise mark κ_GS as UNVERIFIED.
7  Emit the report with all thresholds (ε, t, φ, n-gram size) stated.
```

DERIVED — complexity: O(|Q| + |P*|) cell assignment; O(|Q| · |E|-index) overlap check; O(|Q| log |Q|) for k-NN style estimates per cell; line 6 costs one generator pass over E plus one student pass. Termination: finite corpus. Line 5 is the only step that needs the §11.1 record's lineage pointer, which is why that pointer is mandatory.

## Implementation

The audit is a CPU-side data job with two model passes (line 6). Its inputs are the dataset artifacts of §11.1–§11.3 (TRL-typed rows plus provenance columns; OFFICIAL-DOCUMENTATION · R11.11 for the row types); its cell partition reuses the coverage classifier or MinHash clustering that Chapters 8–9 already require (Llama 3 reports RoBERTa-embedding clustering for semantic dedup of dialogues and an 8B topic classifier for bucketing, PAPER-REPORTED · R11.6 — a design of the same shape). No reference-stack system implements Algorithm 11.4 as a unit; the *Model definition / adaptation* layer (Hugging Face Transformers, #26) supplies the classifier and embedding models, and the generator pass of line 6 runs on the *Inference engine* layer (vLLM #41 / SGLang #42). Under the §4.2 dimensions, this is a *Reproducibility* and *Metrics* concern: the audit's thresholds and model versions must be pinned, and the report is part of the dataset record. Performance figures are not stated; the audit's cost is dominated by the overlap index and the two evaluation-set passes.

```text
Systems trace (one audit)
cell assignment   → compute: classifier/embedding forward over |Q| + |P*| rows / failure: partition drift between audits
style KL          → compute: per-cell estimator, CPU / failure: too few rows per cell (report cells skipped)
overlap check     → compute: n-gram index build + probe / failure: suite version not pinned
lineage histogram → compute: O(|Q|) / failure: lineage pointer missing → depth unknown
coupling          → compute: generator + student pass over E + strongest predicate / failure: coupled evaluator used as "truth"
```

## Experimental design

### Experiment 11.4 — Replace versus accumulate across three synthetic generations

- **Hypothesis:** under a replace protocol, CC_ε and SC rise monotonically over generations and the student's held-out score on tail cells falls; under an accumulate protocol with w₀ ≥ 0.1, all three are bounded within seed variance after generation 1.
- **Setup:** one base model; generation 0 = real SFT data; for g = 1..3, generate a corpus from the previous student with a fixed G (K = 4, fixed σ), gate with a fixed execution/symbolic predicate, then train the next student either on the new corpus only (replace) or on the union with weight w₀ on the real data (accumulate, w₀ ∈ {0.1, 0.5}); r ≥ 3 seeds; matched consumed tokens per generation.
- **Independent variables:** protocol; w₀; generation index.
- **Controlled variables:** base, G, gate, tokens per generation, evaluation suite (independent provenance; decontaminated).
- **Dataset/workload:** a task with executable checks (so the gate is not a judge) and a long-tail cell structure (e.g. problems binned by topic and difficulty).
- **Hardware:** one accelerator class; hours logged per generation including generation cost.
- **Metrics:** CC_ε, SC, tail-cell accuracy, overall accuracy, per generation with §6.4 intervals.
- **Baselines:** generation 0 student.
- **Expected result:** replace shows rising CC_ε and falling tail accuracy; accumulate shows bounded CC_ε; if accumulate at w₀ = 0.1 also degrades, R11.9's bounded-error claim does not transfer to this setting.
- **Ablation:** gate = model judge from the previous student (closed judge loop) versus execution gate.
- **Interpretation:** the generation index at which tail accuracy leaves the interval of generation 0 is the safe recursion depth for this recipe.
- **Threats to validity:** three generations may be too few to see late collapse; cell partition choice.

Proposal only; no run was executed.

## Observations

**What the paper claims.** R11.7 claims model collapse is ubiquitous among learned generative models under recursive training and demonstrates it for GMMs, VAEs, and a fine-tuned OPT-125m, with tail loss as the early signature. R11.9 claims that accumulating data avoids collapse across language, diffusion, and VAE models and proves a bounded-error result for linear regression. P29 claims its decontamination removed overlapping training sets. R11.3 claims persona synthesis can extract a target model's capabilities.

**What the evidence shows.** R11.7's language-model evidence is a 125M-parameter fine-tuning experiment under a replace protocol with an explicit statement that only early signs appear in the fine-tuning regime; its GMM and VAE results show the mechanism clearly but at small scale. R11.9's experiments are at similarly modest scale. Neither paper's protocol matches a production recipe that mixes real, synthetic, and multi-generation data with a verifier gate; the chapter therefore treats collapse as a *demonstrated mechanism with a protocol-dependent magnitude* and marks `disputed: true` in the frontmatter for the ubiquity claim. No independent measurement of style convergence or coupling in a named production corpus was inspected.

**What we infer.** DERIVED: the discrete tail-loss rate e^{−Nm} under replace and the floor w₀ p*(c) under accumulate follow from Eq. 11.11 and finite sampling; they are consistent with both papers. DERIVED: verifier gates convert tail loss into *hard-cell* loss (Eq. 11.8), so a gated pipeline can collapse coverage of difficult regions even under accumulate if the real data lack those regions. ASSUMED: the cell partition used for CC_ε reflects the evaluation's construct.

**What remains unknown.** The synthetic fraction, lineage depth, and cell coverage of every production corpus cited (P26, P29, R11.5, R11.6) are NOT-DISCLOSED beyond the counts quoted. Whether paraphrased benchmark leakage survives 8-gram decontamination in Tulu 3's synthetic sets is UNVERIFIED. κ_GS for R1's distilled students against R1 is NOT-DISCLOSED.

## Failure modes

> **Failure mode — Same voice everywhere.** *Symptom:* the student's outputs are identifiable by opener phrases and length regardless of topic. *Cause:* single teacher, single template, low temperature, style-preferring judge. *Detection:* SC rising with CC_ε flat (Algorithm 11.4 line 3). *Mitigation:* multiple G with distinct templates; style-neutral gates; sample at the temperature the generator was validated at.

> **Failure mode — Hard cells vanish.** *Symptom:* student accuracy on the hardest bin falls below the generation-0 student's. *Cause:* keep-all rejection sampling plus recursion. *Detection:* CC_ε on difficulty cells; retained-mass histogram (Algorithm 11.3 line 8). *Mitigation:* per-prompt caps; targeted regeneration; keep real data with w₀ > 0.

> **Failure mode — Inflated score by synthetic leakage.** *Symptom:* a large gain on one benchmark, none on its paraphrased or held-out counterpart. *Cause:* teacher or seed reproduced test items. *Detection:* §8.5 overlap check per G; paired evaluation on a fresh set. *Mitigation:* decontaminate after generation; report per-G leakage.

> **Failure mode — Coupled evaluator.** *Symptom:* the student's reported gains do not appear under a human or execution-based evaluation. *Cause:* judge shares a base with the generator or is the generator. *Detection:* κ_GS and evaluator-disagreement analysis (§11.3). *Mitigation:* evaluator of independent provenance; report both.

> **Failure mode — Closed loop unnoticed.** *Symptom:* corpus statistics drift generation over generation with no change in recipe. *Cause:* every input to G is model-generated (lineage depth ≥ 1 for all rows). *Detection:* lineage-depth histogram (Algorithm 11.4 line 5). *Mitigation:* enforce w₀ > 0; record depth.

## Siblings

**Evaluation contamination** — [§8.5](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-5-evaluation-contamination.md)
Why it exists: test items in training data. What assumption changed: here the route is a generator's memory or a seed, not a crawl. What problem it solved: detection mechanics. New failure mode: paraphrased leakage. Changed primitive: crawl overlap → generator-attributed overlap.

**Quality and diversity of mixtures** — [§9.2](../ch09-data-mixtures-curricula-and-sample-efficiency/09-2-quality-and-diversity.md)
Why it exists: coverage and redundancy of a *mixture* of pools. What assumption changed: this section applies the same cells to one generated set and adds style. Changed primitive: mixture coverage → CC_ε and SC per generator.

**Forgetting under sequential training** — [§24.2](../../part-04-training-science-and-adaptation/ch24-continual-learning-model-editing-and-unlearning/24-2-forgetting-and-transfer.md)
Why it exists: a single model loses earlier skills. What assumption changed: R11.7 distinguishes collapse from forgetting — "multiple models over time" whose *data* degrade. New failure mode: none shared; the two compound. Changed primitive: parameter drift → data drift.

**Reward exploitation** — [§32.6](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch32-preferences-reward-models-verifiers-and-oversight/32-6-reward-exploitation.md)
Why it exists: a policy finds the reward model's blind spots. What assumption changed: here the "policy" is the generator and the "reward" is the gate; the blind spots enter the corpus rather than the policy directly. Changed primitive: on-policy exploitation → offline gate exploitation.

**Training-data poisoning** — [§65.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch65-security-privacy-safety-and-adversarial-robustness/65-2-training-model-attacks.md)
Why it exists: an adversary shapes the corpus. What assumption changed: the shift is adversarial, not accidental. Changed primitive: statistical drift → injected drift; the same provenance records support both investigations.

## Extensions

Domain adaptation raises the stakes of coverage collapse because the domain's tail is the point. Long-context synthesis adds a length-distribution axis to style convergence. Multimodal synthesis (captions, rendered images) has collapse modes in the image space that R11.7 and R11.9 report for VAEs and diffusion models respectively; the corpus audit must add image-feature cells. Agent data loops (a policy generating trajectories judged by a model user) are closed loops by default and are treated in [§11.5](11-5-interactive-collection.md). Proposal: require lineage depth as a column in every synthetic dataset record in the book.

## Limitations

CC_ε and SC depend on a partition and a feature extractor that are design inputs; they are comparable only across audits that share them. The tail-loss argument assumes maximum-likelihood estimation without smoothing; smoothed or regularised students lose tails more slowly, so the e^{−Nm} rate is a worst case. The section does not establish at what synthetic fraction or lineage depth a *given* production recipe degrades; that is Experiment 11.4's purpose. Falsification: if a replicated Experiment 11.4 showed no rise in CC_ε under replace for three generations at production scale with a verifier gate, the collapse risk would be reclassified as a small-scale phenomenon for gated pipelines. Decision consequence: a synthetic corpus in this book carries its audit report or is treated as unaudited (all six risks UNVERIFIED).

## Reproducibility

Versions: R11.7 arXiv 2305.17493 v3 (PDF, Definition 3.1, §3 error sources, Figure 10; the Nature 2024 version was not opened — its landing page redirected to an authorisation endpoint — so venue attribution rests on the arXiv text and bibliographic listings, UNVERIFIED as a direct read); R11.9 arXiv 2404.01413 v2 (abstract); R11.1 arXiv 2212.10560 v2 (PDF); R11.3 arXiv 2406.20094 (HTML, ethics discussion); P29 arXiv 2411.15124 (HTML) and R11.21 (Ai2 blog); P26 arXiv 2501.12948 (HTML); R11.5, R11.6 (HTML renderings); all accessed 2026-09-23. Artifacts: the audit report fields in [verification.md](verification.md). Unresolved: production-corpus coverage, lineage, and coupling statistics (NOT-DISCLOSED).

## References

P26, P29; R11.1, R11.2, R11.3, R11.4, R11.5, R11.6, R11.7, R11.9, R11.11, R11.17, R11.21; notation.md §1 (entropy/KL via §2.3).
