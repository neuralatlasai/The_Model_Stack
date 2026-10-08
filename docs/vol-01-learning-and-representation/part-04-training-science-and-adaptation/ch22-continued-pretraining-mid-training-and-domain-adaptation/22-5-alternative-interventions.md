---
id: ms.section.22.5
entity_type: section
title: Alternative interventions
short_title: Alternative interventions
volume: 1
part: 4
chapter: 22
section: 22.5
slug: 22-5-alternative-interventions
parent: ms.chapter.22
prev_sibling: ms.section.22.4
next_sibling: ms.section.22.6
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

# 22.5 Alternative interventions

## Scope

[DERIVED] This section compares retrieval, prompt/context changes, SFT, adapter-based updates, and full parameter updates as responses to the same measured domain deficiency. The comparison axis is task utility at a declared evidence-access policy, retention requirement, freshness window, and lifecycle budget. Retrieval mechanics belong to Chapters 49–50, SFT to Chapter 31, and adapters to Chapter 23. Here they are interventions with different controllable variables, rather than interchangeable names for specialization.

## Why this exists

[DERIVED] Training is often proposed before the failure is localized. A model may answer incorrectly because the required document is missing, the document is present but poorly selected, the prompt omits a constraint, the model cannot apply the domain procedure, or the response protocol is wrong. More parameter updates can alter all of these behaviors indirectly while leaving the actual bottleneck unresolved.

[DERIVED] The opposite shortcut is also unsound: supplying a document does not guarantee that the model will identify the relevant evidence, reason over it, or obey the required format. Retrieval shifts the evidence-access problem into an index, selector, context budget, and generator interface. Its costs and failures need the same explicit accounting as a training intervention.

## Intuition

[DERIVED] The interventions act on distinct objects. A prompt changes conditioning text. Retrieval changes the evidence supplied for each request. Continued pretraining changes parameters using a corpus objective. SFT changes parameters using a supervised input-output target contract. An adapter restricts the parameterization of the update. These coordinates can be combined; “RAG versus fine-tuning” is not a complete experimental specification.

[MATHEMATICALLY-DERIVED] If the task answer depends on information absent from both weights and request context, changing a prompt cannot supply that information. A retrieval system can make it available when its index contains and selects the relevant source. A parameter update can encode useful statistical associations, but the update objective does not force every fact to be retrievable by every wording of a question. These are conditional statements about available information and objectives, not universal performance predictions.

## Formulation

[DERIVED] For request $x$, current evidence snapshot $I$, fixed base parameters $\theta_0$, prompt transform $h$, and retriever $r$, define candidate inference systems

$$
\begin{aligned}
\mathsf P(x)&=p_{\theta_0}(y\mid h(x)),\\
\mathsf R(x;I)&=p_{\theta_0}(y\mid h(x,r(x,I))),\\
\mathsf C(x)&=p_{\theta_C}(y\mid h(x)),\\
\mathsf S(x)&=p_{\theta_S}(y\mid h(x)).
\end{aligned}
$$
*(Eq. 22.16)*

[DERIVED] $\theta_C$ is selected after continued pretraining; $\theta_S$ after SFT. A combined system may use $p_{\theta_C}(y\mid h(x,r(x,I)))$. A retrieval system can itself be trained; Eq. 22.16 deliberately describes a frozen generator/retriever comparison unless a training stage is added to its record.

[MATHEMATICALLY-DERIVED] For the same corpus objective $J_C$, full updates and a constrained parameterization $\theta=\theta_0+\Psi(\phi)$ solve different feasible optimization problems:

$$
\theta_C\in\arg\min_{\theta\in\Theta}J_C(\theta),
\qquad
\phi_C\in\arg\min_{\phi\in\Phi}
J_C\!\left(\theta_0+\Psi(\phi)\right).
$$
*(Eq. 22.17)*

[MATHEMATICALLY-DERIVED] If the constrained family is a subset of $\Theta$, its global minimum cannot be lower than the unrestricted global minimum on that same objective. This is a feasible-set statement. Actual finite-budget optimization and held-out task utility need not follow that ordering. Chapter 23 supplies specific adapter constructions and their resource costs.

[DERIVED] For a retrieval-conditioned system, let $E$ be the event that sufficient correct evidence is available in the supplied context, and $A$ the event that the final task is accepted. The law of total probability gives

$$
q_R=\Pr(A)=
r_E\,s_1+(1-r_E)s_0,
\quad
r_E=\Pr(E),\
s_1=\Pr(A\mid E),\
s_0=\Pr(A\mid\neg E).
$$
*(Eq. 22.18)*

[MATHEMATICALLY-DERIVED] No independence is assumed. $r_E$ includes index coverage, retrieval, filtering, and context admission. If the declared task requires unavailable evidence and $s_0=0$, then $q_R\le r_E$. Without that condition, a model can sometimes answer from prior information, so retrieval recall alone is not a universal ceiling.

## Mechanism

### Methodology

[DERIVED] Diagnose the failure with controlled context. Compare no supplied evidence, the system's retrieved evidence, and sufficient correctly identified evidence under the same model and request set. A large gap between retrieved and sufficient evidence implicates evidence access or selection; a remaining gap with sufficient evidence implicates evidence use, procedure, or response constraints. This diagnostic does not justify using privileged evidence in the production benchmark.

[DERIVED] Establish the strongest allowed prompt/context baseline before training. Fix task instructions, schema, demonstrations, and maximum context budget using development data only. A weak baseline exaggerates the apparent value of every later intervention. Conversely, excessive prompt tuning against a final test leaks test information into the baseline. Charge prompt-development effort when it matters to lifecycle cost.

[DERIVED] Use retrieval when the intervention aims to provide request-specific, versioned material, and evaluate it under the actual authorization and freshness rules. Pin index snapshots, retrieval scores or selection rules, chunking, top-$k$, context truncation, citations, and fallback behavior. A retrieval deployment can update its evidence without changing model weights, but stale caches, access filters, or a stale index can still serve obsolete information.

[DERIVED] Use SFT when the intervention aims to change conditional behavior supported by examples of the desired response. Specify the answer mask, loss normalization, input distributions, and supervision provenance. SFT and continued pretraining may both use cross-entropy, but their empirical objectives differ when conditioning and masks differ. They are not a comparison of “supervised” versus “no targets”: both train on targets, constructed differently.

[DERIVED] Use continued pretraining when the proposed benefit is improved representation or prediction under sustained domain exposure, and test that benefit directly. Include an evidence-access baseline because a domain corpus can serve both training and retrieval. Do not infer that a lower corpus loss guarantees better task behavior. Evaluate whether any gain survives a fresh-document holdout and a change in surface wording.

[DERIVED] Separate the parameterization experiment from the objective experiment. Compare an adapter and full updates under the same data, masks, optimizer-selection budget, and stopping rule if the claim concerns update efficiency. If one arm uses SFT and another uses all-token corpus prediction, the difference combines objective and parameterization. A smaller trainable parameter count alone does not determine activation memory, throughput, or final utility.

```figure
id: fig-22.15
kind: compare
title: Intervention coordinates under one domain task
caption: The comparison axis is the object changed by the intervention. These mechanisms can be combined, so a method name alone does not define a benchmark arm.
placement: inline
evidence: DERIVED
source: DERIVED:eq-22.16
alt: Prompt changes conditioning, retrieval changes supplied evidence, continued pretraining changes parameters through a corpus objective, SFT changes parameters through response supervision, and adapters constrain the update parameterization.
spec:
  axis: Changed object at fixed target task and declared evidence policy
  columns:
    - { id: prompt, label: Prompt }
    - { id: retrieval, label: Retrieval }
    - { id: cpt, label: Continued pretraining }
    - { id: sft, label: SFT }
    - { id: adapter, label: Adapter }
  rows:
    - { dimension: primary change, values: { prompt: conditioning, retrieval: supplied evidence, cpt: corpus-trained weights, sft: response-trained weights, adapter: update subspace } }
    - { dimension: generator weights, values: { prompt: fixed, retrieval: fixed in this comparison, cpt: updated, sft: updated, adapter: base plus trainable module } }
    - { dimension: current document access, values: { prompt: supplied manually if allowed, retrieval: index dependent, cpt: not guaranteed, sft: not guaranteed, adapter: objective dependent } }
    - { dimension: retention test, values: { prompt: required, retrieval: required, cpt: required, sft: required, adapter: required } }
```

## Algorithm

[DERIVED] **Algorithm 22.5 — Select an intervention by a bounded factorial study.** Inputs are a fixed base artifact, common development/test tasks, permitted evidence snapshots, finite configurations $\mathcal H$, and Section 22.4's acceptance gate. Each configuration is a tuple of prompt, evidence policy, objective, parameterization, and budget.

$$
\begin{aligned}
1.\quad&
\mathcal H_0\gets
\{h:\mathsf{Authorization}(h)=1
\land \mathsf{InterfaceCompatible}(h)=1\}.\\
2.\quad&
\mathcal H_1\gets
\mathsf{FreezeDevelopmentChoices}(\mathcal H_0).\\
3.\quad&
a_h\gets\mathsf{Construct}(h,\theta_0,I_h),
\qquad h\in\mathcal H_1.\\
4.\quad&
e_h\gets
(\widehat U_D(a_h),\{\widehat U_j(a_h)\}_{j=1}^J,
\widehat q_h,\widehat K_h,\widehat L_h).\\
5.\quad&
\mathcal F\gets\{h\in\mathcal H_1:\mathcal G(e_h)=1,\
\widehat q_h>0,\ \mathsf{Finite}(e_h)=1\};\quad
\mathcal F=\varnothing\ \Rightarrow\ \operatorname{return}(\bot).\\
&h^\star\gets\arg\min_{h\in\mathcal F}\widehat K_h/\widehat q_h.\\
6.\quad&
r\gets
\begin{cases}
\mathsf{TestOnce}(a_{h^\star}),&\mathcal F\ne\varnothing,\
\widehat q_{h^\star}>0,\\
\bot,&\text{otherwise}.
\end{cases}
\end{aligned}
$$

[DERIVED] $K_h$ is lifecycle cost over a common positive request horizon, $L_h$ the declared latency statistic, and $q_h$ the accepted-task fraction. Resolve equal minima by a fixed configuration ordering. The invariant is comparable task and release criteria, not identical internal operations. A causal factorial contrast additionally holds the other coordinates fixed. Every construction and evaluation has a finite budget; failure or resource exhaustion rejects that configuration.

## Implementation

[DERIVED] **Hugging Face Transformers — model-definition layer; PyTorch — core training framework.** Training arms share a parameter and serialization interface, while retrieval arms add a separately versioned evidence path. A full implementation must retain index/model compatibility, prompt templates, input/output schemas, and source attribution. The domain decision record links to the canonical retrieval and adapter chapters rather than inventing undocumented library behavior.

[MATHEMATICALLY-DERIVED] Corpus training adds learner compute and optimizer state; retrieval adds index construction/storage and per-request selection plus context processing. Prompt-only changes can increase inference work by increasing input length. Adapter training reduces the trainable state dimension but still executes the frozen network to compute activations and gradients needed for the adapter. The exact savings require a specified architecture and runtime.

[DERIVED] Count end-to-end retrieval latency, including authorization filters, index calls, reranking if used, and extra model prefill. Include failures and retries in accepted-task cost. For training arms, count dataset preparation, hyperparameter trials, validation, and release conversion, then amortize over the same request horizon. Money and energy for a named deployment remain UNVERIFIED until measured with its hardware, rates, and workload.

```figure
id: fig-22.16
kind: calculator
title: Evidence access and evidence use
caption: Illustrative probability decomposition, not an empirical benchmark. Improve retrieval coverage and conditional evidence use separately; neither alone determines accepted-task quality.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-22.18
alt: If sufficient evidence reaches 80 percent of requests, acceptance with evidence is 90 percent and without it is 20 percent, overall acceptance is 76 percent.
states:
  - { anchor: formulation, label: Evidence pipeline, variables: { r: 0.8, s1: 0.9, s0: 0.2 }, note: Overall acceptance is 76 percent under the illustrative inputs. }
  - { anchor: failure-modes, label: Evidence-use failure, variables: { r: 0.8, s1: 0.6, s0: 0.2 }, note: Strong coverage cannot compensate for weak conditional use. }
spec:
  tex: q_R=r_Es_1+(1-r_E)s_0
  equation: "22.18"
  inputs:
    - { symbol: r, label: sufficient evidence probability, default: 0.8, min: 0, max: 1, step: 0.01, format: percent }
    - { symbol: s1, label: acceptance with evidence, default: 0.9, min: 0, max: 1, step: 0.01, format: percent }
    - { symbol: s0, label: acceptance without evidence, default: 0.2, min: 0, max: 1, step: 0.01, format: percent }
  outputs:
    - { symbol: q, label: overall accepted fraction, formula: r*s1+(1-r)*s0, format: percent, emphasis: true }
```

```figure
id: fig-22.17
kind: stat-panel
title: Comparable intervention arm
caption: Freeze these fields before the final comparison. Extra evidence and extra search are resources, even when they are supplied through context.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-22.16
alt: A benchmark arm records model, prompt, evidence snapshot, training objective, trainable parameterization, budget, and selection rule.
spec:
  header: INTERVENTION ARM
  rows:
    - { key: task, value: identical accepted-task rule }
    - { key: evidence, value: allowed snapshot and access }
    - { key: training, value: objective and parameterization }
    - { key: budget, value: trials plus serving horizon }
    - { key: selection, value: common development rule }
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] The original RAG study combines a DPR-initialized retriever with a BART generator, comparing sequence- and token-level latent-document marginalization. It evaluates open-domain Natural Questions, TriviaQA, WebQuestions, CuratedTrec, and generation/verification tasks. The retriever and generator are fine-tuned; the document index is a Wikipedia snapshot. Reported comparisons include a BART baseline, and evaluation uses task-specific metrics and splits. This is a historical trained retrieval-generator protocol, not a frozen contemporary decoder with an arbitrary search service. [P40]

[DERIVED] An intervention comparison requires a common starting checkpoint and task population. A complementarity claim requires retrieval, continued pretraining, and their combination under the same evidence policy; a parameterization claim requires objective-matched adapter and full-update arms. Training, selection, index preparation, and serving costs belong to the comparison. The chapter's unexecuted protocol is specified in [verification.md](verification.md).

## Observations

**What the paper claims.** [PAPER-REPORTED] RAG reports stronger knowledge-intensive task performance than its parametric baselines and benefits from combining parameterized generation with document evidence. Its experiment does not compare all interventions in Algorithm 22.5. [P40]

**What the evidence shows.** [DERIVED] Retrieval can be an effective component under the disclosed protocol. The result does not prove that retrieval dominates every continued-pretraining stage, nor that the original jointly trained mechanism and a modern frozen-context pipeline are experimentally interchangeable.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 22.18 separates sufficient-evidence delivery from acceptance conditional on that evidence. A benchmark that measures only retrieval recall leaves evidence use unresolved; a final-answer benchmark alone leaves the failure location unresolved.

**What remains unknown.** [UNVERIFIED] No experiment has been executed for the book's fixed-domain comparison. The winning intervention, its uncertainty, and its amortization point remain unknown until the declared protocol is run.

## Failure modes

[DERIVED] An evidence-policy mismatch compares an open-book retrieval arm with a closed-book training arm without stating the intended operational question. A weak-prompt baseline underestimates accessible performance. A training/evaluation overlap makes remembered examples appear to be generalized domain competence. An adapter trained under a different objective confounds parameterization with supervision.

[DERIVED] Retrieval failures include stale or missing evidence, access-filter mismatches, adversarial source text, and context truncation. Training failures include unsupported factual associations, loss-to-task mismatch, and retention regressions. These require different observables and mitigations. A single overall success percentage cannot determine which mechanism failed.

## Siblings

[DERIVED] Retrieval and continued pretraining can complement one another: one supplies current evidence, the other can change how the model uses domain structure. SFT can then alter response behavior. This composition is a hypothesis to test with the corresponding factorial contrasts, not a guaranteed improvement. A prompt intervention is the lowest state-change baseline, but it can still incur significant per-request context cost.

## Extensions

[DERIVED] Add a fresh-document test when deployment values new information, a reformulated-question test when robustness to wording matters, and a source-attribution test when provenance is required. Add a retrieval-ablation arm to an adapted model to determine whether gains depend on external evidence. Preserve the same evidence corpus when measuring the effect of parameter adaptation alone.

## Limitations

[DERIVED] Interventions are comparable only after utility, evidence access, retention, and budget are defined. There is no task-independent answer to whether knowledge “belongs” in weights or in an index. Permission to update weights, availability of training state, context capacity, and required freshness can eliminate otherwise scientifically interesting arms.

## Reproducibility

[DERIVED] Each arm needs a complete stage or inference manifest, exact checkpoint and tokenizer, corpus/index snapshot, selection rule, masks, decoding settings, and per-task outputs. Preserve rejected configurations and their costs. Do not report the best observed arm as universally best; state its tested population and resources. Detailed proposed experiments are in the chapter verification record.

## References

- [P40](references.md#p40) — originating RAG mechanism and experimental scope.
