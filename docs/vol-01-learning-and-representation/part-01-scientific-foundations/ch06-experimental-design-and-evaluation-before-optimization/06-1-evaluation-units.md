---
id: ms.section.6.1
entity_type: section
title: Evaluation units
short_title: Evaluation units
volume: 1
part: 1
chapter: 6
section: 6.1
slug: 06-1-evaluation-units
parent: ms.chapter.6
prev_sibling: null
next_sibling: ms.section.6.2
children: []
prerequisites: [ms.section.1.1, ms.section.1.2, ms.section.2.5, ms.section.3.6, ms.section.4.6, ms.section.5.5]
downstream: [ms.section.6.3, ms.section.6.5, ms.section.6.6, ms.section.43.6, ms.section.48.6, ms.section.61.3, ms.section.62.6, ms.section.63.3]
related: [ms.section.10.4, ms.appendix.g]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P50}
  - {type: supported_by, target: paper.P51}
  - {type: implemented_by, target: impl.hugging-face-transformers}
  - {type: implemented_by, target: impl.vllm}
  - {type: evaluated_by, target: experiment.6.1}
axes: {lifecycle: [evaluation, serving], mechanism: [evaluation_unit, attribution], feedback_setting: [human_preference], modality: [text]}
papers: [P50, P51]
implementations: [impl.hugging-face-transformers, impl.vllm, impl.sglang, impl.tensorrt-llm, impl.llama-cpp]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, KNOWN, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 6.1 Evaluation units

## Scope

A benchmark score characterises a configured system under a particular evaluation protocol. The experimental object includes the weights, input representation, prompting and adaptation procedure, generation policy, scorer, and execution conditions. HELM standardises adaptation to make model comparisons interpretable; the LM Evaluation Harness paper demonstrates that changing an evaluation convention can substantially change the score of a fixed checkpoint. Neither result licenses attaching a protocol-free capability constant to a model name ([P50, R6.4](references.md), PAPER-REPORTED).

This section separates nine bookkeeping components of that object, defines the scored random variable, and specifies what a comparison record can establish. Components can be nested: an endpoint may encapsulate its engine and hardware, while a product may encapsulate an endpoint and retrieval system. They are therefore not automatically nine independently manipulable factors. The statistical population and dependence model are specified in [6.4](06-4-measurement-uncertainty.md); controlled interventions and resource matching are developed in [6.3](06-3-controlled-comparisons.md).

## Why this exists

Biderman et al.'s Table 1 evaluates pretrained models at zero shots using alternate task presentations. For GPT-NeoX-20B on ARC Challenge, the reported unnormalised accuracies are 38.0% under the cloze presentation and 26.6% under the MMLU-style presentation. For Mistral-7B on that same task, the corresponding values are 50.1% and 72.4%. The direction therefore depends on the checkpoint. The intervention includes the task presentation and associated answer-scoring convention; it should not be reduced to a harmless typography change ([R6.4](https://arxiv.org/html/2405.14782v2), Table 1, PAPER-REPORTED).

Sclar et al. separately study meaning-preserving format variation in few-shot evaluation. They report a maximum spread of 76 accuracy points for LLaMA-2-13B and weak transfer of format rankings across models. This establishes sensitivity in the studied regime, rather than a universal effect size or a guarantee that one fixed format is neutral ([R6.22](https://arxiv.org/html/2310.11324v2), abstract and Sections 3-4, PAPER-REPORTED). Together these findings motivate preserving the complete evaluation configuration and testing a declared format family when the claim concerns robustness to presentation.

```figure
id: fig-6.4
kind: stat-panel
title: Checkpoint-dependent task-presentation effects
caption: >-
  R6.4 Table 1 reports zero-shot unnormalised ARC Challenge accuracy under
  cloze and MMLU-style task presentations. The presentation and associated
  answer-scoring convention change together. The directions differ across
  checkpoints. These are source-reported results, not new measurements.
placement: rail
anchor: why-this-exists
evidence: PAPER-REPORTED
source: R6.4
context:
  hardware: "NOT-DISCLOSED in Table 1"
  model: "GPT-NeoX-20B and Mistral-7B pretrained checkpoints"
  precision: "NOT-DISCLOSED in Table 1"
  sequenceLength: "task-defined; not a fixed synthetic length"
  ioDistribution: "ARC Challenge, zero-shot cloze versus MMLU-style presentation"
  concurrency: "offline task accuracy; not a serving throughput experiment"
  runtimeVersion: "LM Evaluation Harness used in R6.4 v2; exact commit not established here"
  measurementBoundary: "unnormalised accuracy; Table 1 labels its uncertainty as 95% intervals"
alt: >-
  GPT-NeoX-20B accuracy is 38.0 plus or minus 2.78 percent with cloze and
  26.6 plus or minus 2.53 percent with MMLU-style presentation. Mistral-7B
  scores 50.1 plus or minus 2.86 and 72.4 plus or minus 2.56 percent.
  The arithmetic differences, alternate minus cloze, are minus 11.4 and
  plus 22.3 percentage points. This table does not report ARC-Easy.
spec:
  header: "ARC CHALLENGE / ZERO SHOTS"
  rows:
    - { key: "GPT-NeoX-20B, cloze", value: "38.0 +/- 2.78 %", note: "R6.4 Table 1" }
    - { key: "GPT-NeoX-20B, MMLU-style", value: "26.6 +/- 2.53 %", note: "same checkpoint; changed presentation/scoring" }
    - { key: "GPT-NeoX-20B difference, points", formula: "26.6 - 38.0", format: fixed1, note: "DERIVED arithmetic, not an independent run" }
    - { key: "Mistral-7B, cloze", value: "50.1 +/- 2.86 %", note: "R6.4 Table 1" }
    - { key: "Mistral-7B, MMLU-style", value: "72.4 +/- 2.56 %", note: "same checkpoint; changed presentation/scoring" }
    - { key: "Mistral-7B difference, points", formula: "72.4 - 50.1", format: fixed1, note: "DERIVED arithmetic" }
```

## Intuition

The relevant distinction is between the checkpoint's conditional token distribution and the scored output of the complete evaluation procedure. A template changes the conditioning tokens. A decoding rule changes how tokens are drawn. An extraction rule changes which generated string is scored. A tool-using scaffold can create additional observations before answering. An engine may change numerical execution without intentionally changing the mathematical model. A score consequently depends on the composition of these operations.

This dependence does not imply that every configuration change changes every outcome. Different implementations can agree exactly on a finite workload, and different strings can receive the same score. Conversely, identical checkpoint hashes do not establish identical evaluation distributions when the other operations or unrecorded provider conditions differ. Figure 6.5 depicts dependencies and containment, rather than nine independent sequential stages.

```figure
id: fig-6.5
kind: diagram
title: The nine components between an item and its score
caption: >-
  The diagram records dependencies and containment. It does not assert that
  the nine components are independent interventions or sequential stages.
  A hosted endpoint can encapsulate an engine and hardware; disclosure
  determines whether those internal identities can be resolved.
placement: wide
evidence: DERIVED
source: ["DERIVED:eq-6.1", R6.36, R6.33, R6.35, R6.7]
concepts: [ms.section.6.1]
alt: >-
  Item, prompt, tokenizer, checkpoint, engine, hardware, and scaffold feed
  a scored outcome. A model family can yield multiple checkpoints. Endpoint
  and product nodes depict composite boundaries that may hide internals.
  The reported mean averages items and complete scaffold repetitions.
spec:
  direction: LR
  nodes:
    - { id: item, kind: dataset, label: "item i", sub: "task distribution (§1.1)" }
    - { id: model, kind: model, label: "u_model", sub: "architecture + training lineage" }
    - { id: ckpt, kind: model, label: "u_ckpt: one set of weights", sub: "hash, dtype, quantisation", group: pin }
    - { id: prompt, kind: process, label: "u_prompt: template, few-shot, system", sub: "rendered string", group: pin }
    - { id: tok, kind: process, label: "u_tok: text → ids", sub: "tokenizer hash, special tokens", group: pin }
    - { id: eng, kind: process, label: "u_eng: kernels, batching, cache", sub: "commit, flags, determinism mode", group: pin }
    - { id: hw, kind: hardware, label: "u_hw: accelerator, driver, runtime", sub: "device and execution conditions", group: pin }
    - { id: scaf, kind: process, label: "u_scaf: samples, extraction, retries", sub: "complete run; internal candidates; judge", group: pin }
    - { id: score, kind: metric, label: "s_{i,r}(u) ∈ [0, 1]" }
    - { id: qhat, kind: metric, label: "q̂(u)", sub: "Eq. 6.1: mean over items and complete runs", emphasis: true }
    - { id: endp, kind: boundary, label: "u_endp: routing, caching, preprocessing", sub: "provider, endpoint id, window", group: prov }
    - { id: prod, kind: boundary, label: "u_prod: retrieval, memory, filters", sub: "product version, access path", group: prov }
  edges:
    - { from: item, to: prompt }
    - { from: prompt, to: tok, kind: emphasis }
    - { from: tok, to: eng, kind: emphasis, label: "ids" }
    - { from: model, to: ckpt, kind: dependency, label: "one model, many checkpoints" }
    - { from: ckpt, to: eng, label: "weights" }
    - { from: eng, to: hw, kind: dependency, label: "executes on" }
    - { from: eng, to: scaf, kind: emphasis, label: "continuations, log-probs" }
    - { from: scaf, to: score, kind: emphasis }
    - { from: score, to: qhat, kind: emphasis }
    - { from: endp, to: eng, kind: dependency, label: "hides" }
    - { from: endp, to: hw, kind: dependency, label: "hides" }
    - { from: prod, to: endp, kind: dependency, label: "adds on top" }
  groups:
    - { id: pin, label: "evaluator can record and pin" }
    - { id: prov, label: "provider side: disclosure varies" }
```

## Formulation

> **Definition — evaluation unit.** The tuple u = (u_model, u_ckpt, u_tok, u_prompt, u_scaf, u_endp, u_eng, u_hw, u_prod) used here to record the disclosed configuration of the evaluated system. Its sufficiency is a modelling premise: hidden provider state, execution time, randomness, and omitted environment conditions may remain. A score is interpreted conditional on the recorded unit and those premises.

| Component | What it fixes | Minimum record |
|---|---|---|
| u_model | Architecture family and training lineage as disclosed | Model-record fields of [Appendix A](../../../appendices/appendix-a-organizations-model-families-and-disclosure.md); undisclosed fields NOT-DISCLOSED |
| u_ckpt | One set of weights: training step, post-training stage, merge, numeric format, quantisation | Artifact hash, revision id, dtype, quantisation scheme |
| u_tok | Text ↔ id map, special tokens, normalisation | Tokenizer file hash, vocabulary size |
| u_prompt | Instruction text, few-shot examples and their order, chat template, system prompt | Rendered prompt strings or the template plus its inputs |
| u_scaf | Sampling settings, samples per item, answer extraction, tools, retries, aggregation (majority vote, best-of-n), judge | Scaffold code revision and configuration |
| u_endp | A hosted interface with provider-side routing, caching, rate limits, hidden preprocessing | Provider, endpoint id, region, date-time window, API parameters |
| u_eng | Inference engine, version, enabled kernels, batching and cache policy | Engine commit, flags, determinism mode |
| u_hw | Accelerator type and count, interconnect, driver, runtime | Device, driver, runtime versions, parallel configuration |
| u_prod | Complete product: endpoint plus retrieval, memory, safety filters, UI-level system prompts | Product version and the evaluator's access path |

> **Definition — evaluation scaffold.** The program surrounding model calls during evaluation — sampling settings, number of samples, answer extraction, tool access, retry and aggregation logic, and any judge — that converts a prompt into a scored outcome.

> **Definition — comparability class.** A set of evaluation units that agree on every component except those declared as factors of the comparison; membership establishes agreement on recorded controls. Causal attribution additionally requires a valid intervention or assignment design, consistent treatments, and control of relevant unrecorded differences.

For item i drawn from a task distribution (owned by [§1.1](../ch01-foundation-model-lifecycle/01-1-problem-formulation.md)) and unit u, let s_i(u) ∈ [0, 1] be the scored outcome of one run. The reported score is

$$
\hat{q}(u) = \frac{1}{n}\sum_{i=1}^{n} \frac{1}{n_r}\sum_{r=1}^{n_r} s_{i,r}(u)
$$
*(Eq. 6.1)* where n is the item count and n_r is the number of complete scaffold repetitions per item. Each s_{i,r}(u) scores the final output of one complete run. If that run internally generates k candidates and votes or selects among them, k belongs to u_scaf; it is not n_r. Averaging candidate correctness instead estimates a different quantity. Unequal repetition counts require an explicitly chosen item-weighted or draw-weighted estimator.

For k independently realisable binary interventions, write a = (a_1,...,a_k) in {0,1}^k, with baseline 0 and expected score mu(a). Define the anchored coefficients by inclusion-exclusion:

$$
\mu(a)=\sum_{S\subseteq\{1,\ldots,k\}}\gamma_S\prod_{j\in S}a_j,
\qquad
\gamma_S=\sum_{A\subseteq S}(-1)^{|S|-|A|}\mu(\mathbf1_A).
$$

Consequently, for the all-changed unit versus the baseline,

$$
\widehat q(\mathbf1)-\widehat q(\mathbf0)
=\sum_{\varnothing\ne S\subseteq\{1,\ldots,k\}}\gamma_S+\varepsilon.
$$
*(Eq. 6.2)* The singleton coefficients are effects at the baseline settings; higher coefficients are anchored interactions. This is an exact saturated representation of the 2^k cell means, with sampling error epsilon in the measured contrast. A single pair supplies one contrast and cannot separate all 2^k - 1 non-intercept coefficients without restrictions. Not all combinations of the nine bookkeeping fields are necessarily realisable, so the count applies only to the declared independently manipulable factors. Section 6.3 uses a different, explicitly stated {-1,+1} coding; coefficients must not be exchanged between the two parameterisations.

```figure
id: fig-6.6
kind: calculator
title: Identifiability in a saturated binary-intervention design
caption: >-
  For k independently realisable binary factors, there are 2^k minus 1
  non-intercept anchored coefficients. Distinct measured cells supply at
  most c minus 1 independent contrasts. The remaining coefficient count
  is a lower bound, not a claim that all nine bookkeeping fields can be
  crossed or that missing fields are known to differ.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-6.2"
alt: >-
  One binary factor has one non-intercept coefficient. Three factors have
  seven, requiring all eight cells for a saturated design. With only two
  observed cells, at most one independent contrast is available, leaving
  at least six coefficients unidentified without restrictions.
spec:
  tex: '\mu(\mathbf1)-\mu(\mathbf0)=\sum_{\varnothing\ne S}\gamma_S'
  equation: "6.2"
  inputs:
    - { symbol: k, label: "independently realisable binary factors", default: 3, min: 1, max: 9, step: 1, format: integer }
    - { symbol: c, label: "distinct cells measured", default: 2, min: 2, max: 512, step: 1, format: integer }
  outputs:
    - { symbol: U, label: "non-intercept coefficients", formula: "2^k - 1", format: integer }
    - { symbol: E, label: "maximum independent contrasts", formula: "min(c - 1, U)", format: integer }
    - { symbol: L, label: "unidentified coefficients, at least", formula: "U - E", format: integer, emphasis: true }
    - { symbol: F, label: "distinct cells in full design", formula: "2^k", format: integer }
  presets:
    - { label: "one factor, both cells", values: { k: 1, c: 2 } }
    - { label: "three factors, one pair", values: { k: 3, c: 2 } }
    - { label: "full three-factor design", values: { k: 3, c: 8 } }
```

> **Identification boundary.** Missing required fields are unknown, rather than proven different or proven equal. A comparison can remain interpretable at a coarser boundary, such as two hosted endpoints, while its decomposition into hidden engine and hardware effects remains unidentified.

## Mechanism

### Methodology

Specify the estimand before resolving the unit. A single-response correctness score, majority-vote accuracy, probability of passing at least one of k tests, human preference, and latency-constrained task success are different random variables. Fix the item population, task weights, scoring inputs, treatment, and allowable resources. Then record the components needed to interpret that estimand at the chosen boundary. A hosted-endpoint contrast can treat each endpoint as a composite intervention without asserting knowledge of its underlying checkpoint or scheduler.

Resolve artifacts by content or immutable revision, and retain rendered prompts. A tokenizer identity alone does not fix a chat template or an ordered few-shot sample. A checkpoint family name does not fix its training step, post-training stage, merge, or quantisation. A scaffold identity includes extraction, stopping, retries, candidate selection, tool permissions, and judge configuration. These distinctions explain how a correctly implemented benchmark can answer a different question from the one suggested by its label.

For a component-level intervention, change the declared component and hold the relevant controls fixed. If two engines cannot execute the same numerical format or decoding semantics, the contrast concerns the combined engine-and-format treatment. Randomise execution order or block by time when load, thermal state, or endpoint drift might correlate with treatment. Matching hashes documents controls; it does not substitute for these design conditions or establish absence of hidden interventions.

The official Transformers chat-template documentation describes model-specific control tokens and warns about duplicated special tokens. The inspected vLLM reproducibility page distinguishes deterministic scheduling and batch invariance, with an explicit same-version and same-hardware boundary. SGLang documents batch-dependent reduction order and backend-specific support for deterministic inference ([R6.33, R6.35, R6.36](references.md), OFFICIAL-DOCUMENTATION, inspected 2026-10-08). These are documentation statements about configurations, rather than measurements of benchmark effect sizes or proof that an installed environment satisfies them.

A near-tied greedy decision explains how a small numerical change can have a large downstream effect: if the top-two logit gap is smaller than a perturbation that reverses their ordering, the selected token changes, and subsequent conditionals use different prefixes. No such reversal is implied when the gap remains larger than the perturbation. Generative answer differences should therefore be measured directly; they cannot be inferred from a floating-point discrepancy alone.

Preference evaluation changes both the outcome and sampling population. Chatbot Arena's paper analyses pairwise human choices on submitted prompts, whereas a scored benchmark uses a specified correctness function. A preference win rate is conditional on opponent, prompt and voter distributions, and presentation protocol ([P51](https://arxiv.org/html/2403.04132v1), PAPER-REPORTED). It cannot be substituted for task accuracy in Eq. 6.2. Similarly, endpoint latency is a property of a service and measurement window; it is not an intrinsic constant of the underlying weight tensor.

## Algorithm

```text
Algorithm 6.1 - Evaluation-unit resolution and comparability check
INPUT   two result records; declared factor paths; chosen comparison boundary;
        required control paths; bounded canonical component digests
OUTPUT  COMPARABLE, CONFOUNDED, or UNDERSPECIFIED, with reasons
INVARIANT  an unknown identity is never accepted as a known treatment or control
1  Validate that both records implement the same outcome and population definition.
2  Resolve composite treatments at the chosen boundary; do not pretend their hidden
       internal components are independent controlled interventions.
3  If a required treatment identity or control identity is missing, return UNDERSPECIFIED.
4  Compare every required non-factor control digest; collect known differences.
5  If any such control differs, return CONFOUNDED with the changed paths.
6  Record the differences in identified factor values; identical values mean a repeat,
       not evidence for a treatment effect.
7  Return COMPARABLE with the explicit boundary and remaining disclosure limitations.
```

This is a record-consistency check, not a causal-identification algorithm. A COMPARABLE verdict admits the registered statistical comparison under its design assumptions. It does not certify random assignment, exchangeability, absence of interference, or correctness of the scorer.

For fixed-size component digests and a fixed schema, checking a supplied pair takes constant time after validation and hashing. For R records occupying Z bytes, canonicalisation and hashing require O(Z) work. Sorting bounded non-factor digest keys creates comparison groups in O(R log R) worst-case comparisons. It identifies groups without enumerating every pair. If all pairwise contrasts are requested, their output alone can be quadratic; register a bounded contrast list instead of generating an unbounded all-pairs table. Whole-artifact hashing is never counted as a constant-time string comparison.

```figure
id: fig-6.7
kind: diagram
title: Record consistency before statistical comparison
caption: >-
  Algorithm 6.1 checks identified treatments and required controls at a
  declared boundary. COMPARABLE is a record-consistency verdict; it does
  not establish causal identification. Sorting bounded control digests
  groups R records in O(R log R) worst-case comparisons after hashing.
placement: inline
evidence: DERIVED
source: "DERIVED:alg-6.1"
concepts: [ms.section.6.1]
alt: >-
  Resolve the comparison boundary and outcome definition. Missing treatment
  or required control identities produce UNDERSPECIFIED. Known changes in
  required non-factor controls produce CONFOUNDED. Otherwise the records
  are COMPARABLE for the registered analysis under its design assumptions.
spec:
  direction: LR
  nodes:
    - { id: records, kind: dataset, label: "two result records" }
    - { id: boundary, kind: process, label: "resolve boundary and estimand" }
    - { id: known, kind: branch, label: "required identities known?" }
    - { id: same, kind: branch, label: "required controls match?" }
    - { id: under, kind: state, label: "UNDERSPECIFIED" }
    - { id: conf, kind: state, label: "CONFOUNDED" }
    - { id: comparable, kind: state, label: "COMPARABLE", sub: "design assumptions still required", emphasis: true }
  edges:
    - { from: records, to: boundary }
    - { from: boundary, to: known }
    - { from: known, to: under, label: "no" }
    - { from: known, to: same, label: "yes" }
    - { from: same, to: conf, label: "no" }
    - { from: same, to: comparable, label: "yes", kind: emphasis }
```

## Implementation

Retain the original dataset item, rendered prompt, token IDs where available, raw response, parsed answer, score, and failure state as distinct artifacts. This permits a reviewer to distinguish generation changes from parser changes. For a closed API, token IDs and internal prompts may be unavailable; preserve exact client request and response bytes, endpoint identity, API parameters, and execution window instead of inventing those hidden records.

The inspected LM Evaluation Harness interface supports configuration files, chat-template controls, separate seed namespaces, sample logging, response caching, and backend selection ([R6.3](https://github.com/EleutherAI/lm-evaluation-harness/blob/main/docs/interface.md), OFFICIAL-DOCUMENTATION). Task configuration and logging are useful evidence surfaces, but they do not pin dataset revisions or prove that cached responses came from the registered treatment. Cache keys must include every response-affecting component within the claimed boundary; cache hits must be distinguishable from fresh calls.

Resource accounting follows the actual execution. Prompt length changes the dense projection work and the sequence-dependent attention work; a universal linear prefill multiplier is invalid when the attention term matters. Repeated candidate generation may reuse a prefix cache, while extraction can be inexpensive string processing or an additional judge-model call. The forward and cache accounting in [5.5](../ch05-minimal-transformer-and-execution-trace/05-5-training-and-generation.md) supplies the conditional formulas. Record executed token counts and measured resource boundaries instead of assigning unsupported microsecond timings.

## Experimental design

### Reported experiments

The zero-shot comparison in R6.4 Table 1 changes task presentation for fixed pretrained checkpoints, with unnormalised accuracy and reported 95% intervals. Cloze scoring compares completion likelihoods; the alternate ARC presentation supplies labelled choices and scores answer letters. The GPT-NeoX-20B ARC Challenge decrease is 11.4 absolute percentage points, calculated from 38.0 and 26.6. Mistral-7B's increase is 22.3 points, calculated from 50.1 and 72.4. These are source-reported operating points and arithmetic contrasts, not experiments rerun for this book. The table supplies no ARC-Easy result.

### Experiment 6.1 - Proposed component-swap comparison

Register a 2 x 2 x 2 crossing of template, extraction policy, and engine for one identified checkpoint and tokenizer. Use one multiple-choice and one generative task, fixed item IDs, a shared numerical format where supported, fixed context and output limits, and the same physical device. Preserve generated responses before extraction so that parser effects can be rescored independently. For the engine intervention, record kernel backend, batching, cache policy, and the exact deterministic-mode setting.

Estimate all eight cell means and the prespecified paired contrasts. Repeat a reference cell to examine repeatability; randomise or block execution order. Treat item clusters according to Section 6.4. For a numerical diagnostic, retain selected-token agreement and top-two logit margins where available, without turning unavailable API logits into imputed observations. Register a practical margin and multiplicity rule. The direction and size of template, extraction, and engine effects are unknown until execution. No run of this protocol has been performed.

## Observations

**What the paper claims.** HELM argues for controlled adaptation and broad multi-metric evaluation. R6.4 and R6.22 report checkpoint-dependent presentation sensitivity. The engine documentation describes conditions for repeatability, rather than a universal accuracy penalty ([P50, R6.4, R6.22, R6.33, R6.35](references.md)).

**What the evidence shows.** The inspected prompt studies establish sensitivity on their tested tasks and checkpoints. Their maxima do not describe typical effects for every model. The corrected Table 1 example concerns ARC Challenge; the previous ARC-Easy attribution was unsupported.

**What we infer.** Differences in recorded controls change the scope of a contrast. A complete-system comparison may remain meaningful while a claim about an individual hidden component is unidentified. This follows from the definition of the intervention and Eq. 6.2, not from an audited frequency of defects in public announcements.

**What remains unknown.** Engine-induced benchmark effect sizes for the proposed checkpoint, hidden endpoint implementations, and the result of Experiment 6.1 remain UNVERIFIED or NOT-DISCLOSED. No population-wide rate of confounded model reports is estimated here.

## Failure modes

> **Failure mode — Score attached to a name.** *Symptom:* two reports give different scores for "the same model" on "the same benchmark". *Cause:* different u_prompt, u_scaf, or u_eng under one u_model label. *Detection:* Algorithm 6.1 returns UNDERSPECIFIED. *Mitigation:* publish the tuple; refuse the comparison otherwise.

> **Failure mode — Endpoint read as checkpoint.** *Symptom:* an endpoint's latency, price, or accuracy is quoted as a property of open weights. *Cause:* u_endp hides u_eng, u_hw, format, and batching. *Detection:* the record has a provider and date but no engine commit. *Mitigation:* attribute to the endpoint and window; re-measure on a controlled engine for checkpoint claims ([§48.6](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-6-external-measurements.md)).

> **Failure mode — Preference score used as capability evidence.** *Symptom:* a pairwise-preference rank is cited for task correctness. *Cause:* different estimand and item distribution. *Detection:* the metric's unit is a win probability, not an accuracy. *Mitigation:* report axes separately ([§62.6](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/62-6-interpreting-scores.md)).

> **Failure mode — Silent scaffold change.** *Symptom:* a score jumps between harness versions with identical weights. *Cause:* changed extraction regex, stop strings, or few-shot sampling seed. *Detection:* task version and harness commit differ. *Mitigation:* pin both in the manifest (§6.6).

> **Failure mode — Batch-dependent outcome flips.** *Symptom:* re-running with a different batch size changes a few percent of item outcomes under greedy decoding. *Cause:* reduction-order differences at near-tied logits. *Detection:* item-level diff between runs. *Mitigation:* deterministic mode where documented, or treat as a variance term in §6.4.

## Siblings

HELM standardises adaptation across models to make coverage and protocol differences visible. A format-robustness study instead averages or reports a range over a declared format population, as in Sclar et al. These answer distinct questions: performance under one common procedure, and sensitivity to a family of procedures. The choice must precede test inspection; choosing each checkpoint's best test format would add development leakage.

System benchmarking places the hardware/software configuration inside the treatment and constrains output quality. It can compare complete execution stacks without decomposing their improvements into individual kernels. Human-preference evaluation replaces the correctness function with a pairwise choice process. Stage-level agent evaluation subdivides a scaffold into retrieval, planning, tool execution, and answer production, whose interventions may interact. These boundaries determine which controls are required and which conclusions a comparison supports.

## Extensions

### Improvements

The appropriate improvement to a single-format comparison is a prespecified robustness design, not outcome-dependent prompt repair. Cross checkpoints with a bounded, development-selected format family; report both the shared-format contrast and the format-dependent range. This separates a robust ranking from one that depends on an arbitrary presentation, while charging format exploration to the tuning ledger ([R6.22](references.md), methodological implication).

Refine the record with nested fields rather than claiming that every new modality is a new independent factor. An image processor includes resize, crop, channel ordering, and patch conversion; audio includes decoding and resampling; a retrieval scaffold includes corpus snapshot and ranking policy. Agent interventions also require environment versions and tool permissions. These are proposed applications of the bookkeeping definition, not evaluated improvements. Additional fields increase auditability only when the corresponding records are actually retained and validated.

## Limitations

No finite manifest guarantees that every behaviour-relevant condition has been measured. Hash equality establishes byte identity for the hashed artifacts under the digest's integrity assumptions; it does not guarantee identical stochastic execution or validate a benchmark's construct. A null effect in one checkpoint-task regime does not establish that recording prompts or engines is unnecessary elsewhere.

The factorial decomposition requires realisable interventions and adequate observations. Nested endpoint, product, and engine fields cannot be crossed arbitrarily. Hidden provider updates can prevent component attribution even with complete client logs. The defensible conclusion is then about the measured service and time window, with that limitation stated explicitly.

## Reproducibility

The inspected methods are P50 v2, P51 v1, R6.4 v2, and R6.22 v2. The harness interface, vLLM reproducibility page, SGLang deterministic-inference page, and Transformers chat-template page were inspected on 2026-10-08. These moving pages are not pinned runtime installations; no engine benchmark or model experiment was executed. Exact URLs, versions, and source locators are retained in the [reference register](references.md).

A future execution must resolve the benchmark-manifest fields, item and prompt hashes, repetitions of the complete scaffold, scorer, task weights, factor levels, declared controls, and comparison boundary. The package in [verification.md](verification.md) is a proposed protocol. It becomes an execution record only after actual identities and raw outcomes are supplied.

## References

P50, P51; R6.2, R6.4, R6.7, R6.8, R6.9, R6.10, R6.11, R6.12, R6.13, R6.22, R6.28, R6.32, R6.33, R6.35, R6.36; book_plan.md corrections table and Appendix G.
