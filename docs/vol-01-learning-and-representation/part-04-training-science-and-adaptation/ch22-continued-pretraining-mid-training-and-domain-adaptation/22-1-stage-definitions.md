---
id: ms.section.22.1
entity_type: section
title: Stage definitions
short_title: Stage definitions
volume: 1
part: 4
chapter: 22
section: 22.1
slug: 22-1-stage-definitions
parent: ms.chapter.22
prev_sibling: null
next_sibling: ms.section.22.2
children: []
prerequisites: [ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.chapter.12, ms.chapter.19, ms.chapter.20, ms.chapter.21]
downstream: [ms.chapter.23, ms.chapter.24, ms.chapter.31]
related: [ms.chapter.49, ms.chapter.50, ms.chapter.63]
relations: []
axes: {lifecycle: [continued_training, adaptation], mechanism: [distribution_transition, retention, adaptation_decision], feedback_setting: [], modality: [text]}
papers: [P13, P40]
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 22.1 Stage definitions

## Scope

[DERIVED] A training stage is a specified intervention on a checkpoint, data distribution, objective, trainable parameter set, and execution state. This section fixes continued pretraining, domain-adaptive pretraining, task-adaptive pretraining, and the release-dependent term *mid-training*. The success criterion is an auditable stage boundary: another engineer can determine what changes and which evaluation justifies the change. The loss families and full training loop remain owned by [Chapter 19](../ch19-pretraining-objectives-and-the-full-training-loop/README.md); adaptation parameterizations belong to Chapter 23.

## Why this exists

[DERIVED] A checkpoint can be resumed for three different reasons: recover an interrupted run, extend exposure under an existing recipe, or deliberately change its operating distribution. All three begin with nonrandom weights. Only the first necessarily intends to preserve the original trajectory. Calling all three “continued training” loses the distinction between recovery correctness and adaptation effectiveness. An adaptation record must therefore state the intervention independently of the file-loading operation.

[DERIVED] The word *mid-training* is especially insufficient as a method identifier. Its position between broad pretraining and a later release stage does not specify a loss, a token mask, or a learning-rate schedule. Instruction-shaped documents may be consumed under an all-token language-model objective, while a supervised instruction stage may train only on answer tokens. Superficially similar text can induce different optimization problems. Classification from the data's appearance substitutes a genre label for a mathematical contract.

[DERIVED] The practical bottleneck is the joint requirement to acquire a useful specialization and preserve required behavior. Domain fit alone is not the release criterion. If a downstream system needs a stable serialization protocol, long-context competence, or a particular language, a stage that improves corpus likelihood while breaking that interface can be unusable. The stage boundary is consequently both a scientific intervention and an artifact interface.

## Intuition

[MATHEMATICALLY-DERIVED] With fixed tokenizer, architecture, and loss, further training changes parameters through a new sequence of gradients. Changing the sampled data distribution changes the expected gradient even when the objective's symbolic expression is unchanged. Changing the loss mask changes which conditional predictions contribute. Changing the trainable set changes which directions in parameter space can respond. These are distinct interventions and should be recorded as separate coordinates.

[DERIVED] Continued pretraining describes the continuation of a pretraining-style objective from an existing checkpoint. Domain-adaptive pretraining narrows or reweights exposure toward a declared domain; task-adaptive pretraining uses unlabeled inputs associated with a declared downstream task. These definitions specify the role of data, not a minimum token count or a guaranteed effect. A domain is a chosen population of examples with a membership rule. A task corpus is identified by its relationship to the task, even when its vocabulary overlaps the broader domain.

[PAPER-REPORTED] Gururangan et al. distinguish domain-specific unlabeled corpora from unlabeled text attached to a task, using masked-language-model continuation before supervised classification. This is the historical DAPT/TAPT distinction, not evidence that every contemporary decoder stage uses masked prediction. [R22.1]

## Formulation

[DERIVED] Represent stage $s$ by

$$
\mathcal S_s=
(\mathcal A_s,\mathcal T_s,\theta_s,\mathcal P_s,
\ell_s,\mathcal U_s,\omega_s,\sigma_s,
D_s,\mathcal E_s,\mathcal G_s).
$$
*(Eq. 22.1)*

[DERIVED] Here $\mathcal A_s$ is the architecture and parameter-identity map; $\mathcal T_s$ the tokenizer and serialization map; $\theta_s$ the starting parameters; $\mathcal P_s$ the probability law over serialized training examples; $\ell_s$ the loss including masks and normalization; $\mathcal U_s$ the trainable parameter subset; $\omega_s$ the optimizer state; $\sigma_s$ the scheduler and counters; $D_s$ the consumed-token budget; $\mathcal E_s$ the pinned evaluation populations; and $\mathcal G_s$ the acceptance predicate. $D_s$ denotes consumed training tokens, not unique available tokens.

[MATHEMATICALLY-DERIVED] For a finite corpus of serialized examples $z_i$ with sampling probabilities $p_{s,i}$, a token-level stage objective can be defined as a ratio of expected sufficient statistics:

$$
J_s(\theta)=
\frac{\sum_i p_{s,i}\,a_i(\theta)}
     {\sum_i p_{s,i}\,q_i},
\qquad
a_i(\theta)=
-\sum_t m_{i,t}\log p_\theta(x_{i,t}\mid x_{i,<t},c_i),
\quad
q_i=\sum_t m_{i,t}.
$$
*(Eq. 22.2)*

[MATHEMATICALLY-DERIVED] Require a positive denominator and sampling probabilities independent of the differentiated parameters. This ratio corresponds to aggregate supervised-token normalization. An expectation of per-example means, $\sum_i p_{s,i}a_i/q_i$, is generally different. Stage labels do not resolve this difference; the normalization field does. Mask definitions also identify whether prompts, separators, and synthetic intermediate text enter the loss.

[DERIVED] Define a boundary signature $\Delta_s$ by the coordinates of Eq. 22.1 that change between adjacent stages. A trajectory-preserving recovery requires the same signature plus restored stochastic and data-position state. A domain adaptation may preserve $\ell_s$ while changing $\mathcal P_s$; an instruction stage may change both. “Full fine-tuning” specifies $\mathcal U_s$, whereas “continued pretraining” specifies an objective/data role. They are compatible descriptions, not mutually exclusive categories.

## Mechanism

### Methodology

[DERIVED] Begin with the operational deficiency and its evaluation population. “Insufficient domain knowledge” is not yet a measurable deficiency: distinguish incorrect use of an available document, inability to produce the domain's syntax, lack of stable background associations, and unavailable current information. These failures can require different interventions. Construct a held-out test of the claimed deficiency before changing the model, and record which external context is available to that test.

[DERIVED] Next pin the input checkpoint and its interfaces. Preserve the architecture configuration, tokenizer revision, vocabulary order, special-token identities, tied weights, context policy, and any required output grammar. If the target corpus requires a vocabulary migration, that is an additional intervention owned by Chapter 10; do not call it an unchanged continuation. If only inference weights are released, declare optimizer and data-state continuity unavailable rather than treating absent files as zero-valued historical state.

[DERIVED] Construct the stage's exposure law from licensed, deduplicated, versioned data. State whether membership is determined by language, professional domain, document type, task-input provenance, length, or a mixture of these. A biomedical question-answer document can satisfy several memberships simultaneously. Sampling partitions must be mutually exclusive or explicitly account for overlap, otherwise nominal mixture weights misstate exposure.

[DERIVED] Then bind the stage to a concrete loss. Unlabeled is a statement about human annotation, not about missing training targets: a language-model objective obtains targets from the sequence itself. Synthetic answers are training data even if no human authored them. Their presence does not establish reinforcement learning; the actual optimization objective decides that category.

[DERIVED] Finally specify the output artifact and release gate before consuming the budget. A candidate checkpoint is distinct from an accepted release. The gate can require domain improvement, bounded retention regressions, deployment compatibility, and complete provenance. A stage may terminate without an accepted checkpoint. Treating budget exhaustion as acceptance confuses an operational event with evidence of utility.

```figure
id: fig-22.3
kind: diagram
title: Stage identity and acceptance boundary
caption: A stage label becomes reproducible only after data, objective, state policy, and acceptance population are fixed. Rejection returns a candidate to the decision record.
placement: inline
evidence: DERIVED
source: DERIVED:eq-22.1
alt: A checkpoint enters a declared stage together with a data law, loss contract, and state-transition policy. Training produces a candidate, which is accepted or rejected by domain and retention evaluation.
spec:
  direction: TB
  nodes:
    - { id: start, kind: model, label: Pinned checkpoint }
    - { id: data, kind: dataset, label: Exposure law }
    - { id: loss, kind: objective, label: Objective and masks }
    - { id: policy, kind: state, label: Optimizer transition policy }
    - { id: stage, kind: process, label: Bounded training stage }
    - { id: candidate, kind: model, label: Candidate checkpoint }
    - { id: gate, kind: metric, label: Domain and retention gate }
    - { id: release, kind: state, label: Accepted artifact }
  edges:
    - { from: start, to: stage }
    - { from: data, to: stage, kind: dependency }
    - { from: loss, to: stage, kind: dependency }
    - { from: policy, to: stage, kind: dependency }
    - { from: stage, to: candidate, kind: emphasis }
    - { from: candidate, to: gate }
    - { from: gate, to: release, label: passes }
```

## Algorithm

[DERIVED] **Algorithm 22.1 — Stage classification and admission.** Inputs are a previous record $\mathcal S_{s-1}$, proposed record $\mathcal S_s$, compatibility predicate $\mathsf C$, and declared category predicates $\mathsf D$ for domain membership and $\mathsf Q$ for task-input provenance. Output is a classified, admitted record or a rejection. The procedure does not train parameters.

$$
\begin{aligned}
1.\quad&
\Delta_s\gets\{j:(\mathcal S_s)_j\ne(\mathcal S_{s-1})_j\}.\\
2.\quad&
u\gets\mathsf C(\mathcal A_s,\mathcal T_s,\theta_s,\mathcal U_s,
                 \omega_s,\sigma_s).\\
3.\quad&
v\gets\mathbf1\{\mathcal P_s\text{ is versioned},\
               \mathbb E_{\mathcal P_s}q>0,\
               D_s>0\}.\\
4.\quad&
k_s\gets
\bigl(\mathbf1\{\ell_s\text{ is pretraining-style}\},
      \mathsf D(\mathcal P_s),\mathsf Q(\mathcal P_s),
      \operatorname{release\_label}(s)\bigr).\\
5.\quad&
r_s\gets
\begin{cases}
(\mathcal S_s,\Delta_s,k_s),&
u=v=1,\ \mathcal E_s,\mathcal G_s\text{ are fixed},\\
\bot,&\text{otherwise}.
\end{cases}
\end{aligned}
$$

[DERIVED] Each Boolean is backed by an explicit check or evidence-gap entry. The fourth coordinate preserves a publisher's release terminology without promoting it to a universal method. The invariant is that no admitted stage has an unspecified target normalization or acceptance population. Five finite transitions terminate with either a record or $\bot$.

## Implementation

[OFFICIAL-DOCUMENTATION] **Hugging Face Transformers — model-definition layer** documents that Trainer resumption loads model, optimizer, and scheduler state; its model-saving and trainer-state interfaces are separate. A load of model weights alone therefore must not be described as that complete resumption operation. The inspected documentation is unpinned and establishes an interface disclosure, not a verified execution path. [R22.8]

[DERIVED] At the operator level, a stage record connects the serialized tokens $[B,T]$, attention policy, shifted targets, and mask to scalar loss sums and token counts. Parameters and optimizer state follow the compatibility tests in Section 22.3. The deployment artifact may omit optimizer state for inference, but the research archive must retain the stage's actual transition policy.

[MATHEMATICALLY-DERIVED] Classifying a boundary requires no model training FLOPs. Comparing $N$ parameter identities and metadata is $O(N)$ in the number of scalar entries only if every value is examined; comparing tensor metadata is proportional to the number of tensors. A content hash requires reading the artifact's bytes. These are provenance costs, separate from the $C_s$ training cost. Exact hashing time, energy, and monetary cost depend on storage and hardware and are UNVERIFIED here.

```figure
id: fig-22.4
kind: calculator
title: Stage exposure and repetition
caption: Illustrative accounting, not a named model. Consumed tokens can exceed available unique tokens; the ratio measures average exposure, not the information gained.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-22.3
alt: With 10 billion consumed tokens and 2 billion unique available tokens, mean exposure is five corpus equivalents. Changing either input changes the ratio.
states:
  - { anchor: formulation, label: Consumed and available, variables: { D: 10000000000, U: 2000000000 }, note: Distinguish the stage budget from unique corpus capacity. }
  - { anchor: limitations, label: Repetition boundary, variables: { D: 20000000000, U: 2000000000 }, note: Ten exposures do not imply ten independent samples. }
spec:
  tex: e=D/U
  equation: "22.3"
  inputs:
    - { symbol: D, label: consumed tokens, default: 10000000000, min: 1000000000, max: 100000000000, step: 1000000000, format: tokens }
    - { symbol: U, label: available unique tokens, default: 2000000000, min: 1000000000, max: 20000000000, step: 1000000000, format: tokens }
  outputs:
    - { symbol: e, label: corpus equivalents, formula: D/U, format: fixed3, emphasis: true }
```

[MATHEMATICALLY-DERIVED] For uniform token exposure over a corpus with $U_s>0$ available tokens, the stage's corpus-equivalent exposure is

$$
e_s=\frac{D_s}{U_s}.
$$
*(Eq. 22.3)*

[DERIVED] Nonuniform sampling requires source-specific exposure counts. This ratio is a bookkeeping identity, not a model of diminishing returns or memorization.

```figure
id: fig-22.5
kind: stat-panel
title: Boundary fields that cannot be inferred
caption: Keep release terminology beside the scientific contract. A missing optimizer-state policy remains an evidence gap even when the schedule is published.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-22.1
alt: A stage record has separate fields for checkpoint, tokenizer, data law, loss masks, optimizer policy, evaluation population, and acceptance rule.
spec:
  header: STAGE CONTRACT
  rows:
    - { key: checkpoint, value: hash and configuration }
    - { key: data, value: version and sampling law }
    - { key: objective, value: masks and denominator }
    - { key: state, value: carry or reset explicitly }
    - { key: release, value: evaluation-gated }
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] In the originating DAPT/TAPT study, RoBERTa-base is adapted to biomedical and computer-science papers, news, and reviews, then evaluated on eight classification tasks. DAPT uses 12.5K adaptation steps on a v3-8 TPU; task fine-tuning reports five-seed means and standard deviations. Domain-relevant adaptation is compared with irrelevant-domain adaptation, and TAPT is tested after DAPT. The article's masked objective and classifier evaluation delimit the evidence. [R22.1]

[PAPER-REPORTED] Olmo 3 explicitly divides base development into pretraining, midtraining, and long-context extension before post-training. Its midtraining consumes a capability-focused mix and is evaluated both as a base model and after instruction tuning. The names identify that release's curriculum, not a new universal objective. The detailed screening protocol is discussed in Section 22.2. [R22.4]

## Observations

**What the paper claims.** [PAPER-REPORTED] The DAPT/TAPT study reports gains from relevant-domain and task-input adaptation, with no DAPT gain on AGNEWS. It also finds that irrelevant-domain continuation can hurt. [R22.1]

**What the evidence shows.** [DERIVED] A controlled relevant-versus-irrelevant corpus comparison supports a data-role distinction. It does not establish a universal token budget, guarantee retention in a decoder, or identify the best intervention for an open-ended generation workload.

**What we infer.** [DERIVED] A release's stage terminology should be preserved for provenance and expanded into Eq. 22.1 for analysis. Two stages with the same label may be less comparable than two differently named stages with identical objectives and exposure laws.

**What remains unknown.** [NOT-DISCLOSED] These disclosures do not supply one shared experimental protocol comparing all four stage labels. A label-level global ranking is unavailable.

## Failure modes

[DERIVED] The first failure is semantic: classifying by position in a lifecycle hides changes in target masking or serialization. Its symptom is a stage record that cannot reproduce the supervised-token count. The second is causal: attributing a gain to “mid-training” while changing corpus, schedule, context length, and evaluation together. Its symptom is the absence of a baseline that isolates the proposed mechanism.

[DERIVED] The third is operational: an inference checkpoint is mistaken for a resumable training snapshot. A fourth is statistical: task-adaptive data includes held-out task inputs or near duplicates, making performance conditional on exposure to evaluation material. Even without answer labels, such exposure changes the evaluation question. Declare transductive access explicitly if it is part of the protocol.

## Siblings

[DERIVED] DAPT and TAPT differ by the source population used for continuation. Continued pretraining is the broader objective-stage description. SFT differs by the supervised conditional target contract, whose complete treatment belongs to Chapter 31. An adapter differs by the trainable parameterization and can implement either objective; Chapter 23 owns its mechanics. Retrieval changes supplied evidence at inference or in a jointly trained retrieval system; Section 22.5 compares its role without redefining retrieval algorithms.

## Extensions

[DERIVED] A multilingual or long-context stage adds coordinates to the exposure and representation contract rather than creating an exemption from it. The same applies when synthetic task-like text is inserted before SFT. Each added capability requires a declared evaluation population and a retention population that includes previously required behavior.

[PAPER-REPORTED] DeepSeekMath provides a decoder continuation case; Olmo 3 provides a later explicit staged curriculum. They extend the set of disclosed interventions beyond the historical masked-language-model setting. Their mechanisms and observations remain separate case studies. [R22.2] [R22.4]

## Limitations

[DERIVED] This taxonomy is operational: it makes interventions distinguishable but does not predict their effectiveness. A precise stage record can describe a scientifically unsuccessful experiment. Published categories also overlap, so assigning several coordinates is preferable to forcing one exclusive label. No fixed corpus-equivalent exposure in Eq. 22.3 determines when specialization becomes useful.

## Reproducibility

[DERIVED] Retain Eq. 22.1 as the stage schema, the boundary signature, the source's original label, and the rationale for each changed field. Record raw and supervised token counts separately; preserve data snapshots and evaluation membership. Sources and access details are in the chapter ledger. The book has not trained or adapted a model for this section.

## References

- [R22.1](references.md#r221) — archival DAPT/TAPT study.
- [R22.2](references.md#r222) — DeepSeekMath continuation case.
- [R22.4](references.md#r224) — Olmo 3 stage definitions.
- [R22.8](references.md#r228) — Trainer state interfaces.
