---
id: ms.section.16.2
entity_type: section
title: Router design
short_title: Router design
section: 16.2
slug: 16-2-router-design
parent: ms.chapter.16
prev_sibling: ms.section.16.1
next_sibling: ms.section.16.3
children: []
prerequisites: [ms.chapter.13, ms.chapter.14, ms.section.16.1]
downstream: [ms.chapter.27, ms.chapter.29, ms.chapter.42]
word_count_target: 1900
volume: 1
part: 3
chapter: 16
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [mixture_of_experts, conditional_computation], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P10, P13]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 16.2 — Router design

## Scope

Router design specifies selection, combination weights, assignment granularity, and constraints on eligible experts. This section covers top-k routing, gating scores, shared experts, specialization, and expert-choice alternatives. It builds on the activated-parameter contract in [Section 16.1](16-1-conditional-computation.md). The objective is an operator specification precise enough to distinguish function changes from execution changes, including the gradient path and deterministic handling of ties.

## Why this exists

**DERIVED.** An instruction such as “use top-two experts” leaves several mathematical choices unresolved. Scores can be normalized before or after selection. Selected weights may retain their original mass or be renormalized. Selection can be constrained by groups or destinations. A router can assign individual tokens, whole sequences, or other units.

These choices affect learning and execution simultaneously. Selection determines which experts receive examples and gradients. Combination weights determine how their outputs influence the representation. Group constraints determine which communication destinations are reachable. Treating the router as a negligible indexing step hides these consequences.

**PAPER-REPORTED.** Switch Transformers uses a top-one design [P10]. Expert Choice Routing reverses the selection direction so experts choose a bounded set of tokens [R16.7]. These mechanisms have different assignment constraints even when their total assignment counts match.

## Intuition

**DERIVED.** Separate three objects: a score matrix, an assignment relation, and a weighted combination. The score matrix expresses preferences; the assignment relation enforces routing constraints; the combination specifies the resulting function. One cannot reconstruct the last two from the first without the routing policy.

A router score is also not automatically a calibrated probability that an expert is correct. Softmax normalizes nonnegative values to sum to one, but calibration is a separate empirical property. A sigmoid score has a different normalization contract. Name these quantities as routing scores unless their probabilistic interpretation has been validated.

> **Definition — Routing contract.** The rules that map input units and scores to expert assignments and output weights, including eligible sets, selection constraints, normalization, tie-breaking, overflow, and gradient treatment.

## Formulation

**MATHEMATICALLY-DERIVED.** Let \(X\in\mathbb R^{M\times d}\) contain \(M\) token representations and \(W_r\in\mathbb R^{d\times E}\) router weights. Ignoring router bias for the reference case,

$$
Z=XW_r,\qquad
p_{t,e}=\frac{\exp(z_{t,e})}{\sum_{j=1}^{E}\exp(z_{t,j})},\qquad
\mathcal S_t=\operatorname{TopK}(p_{t,:},k).
$$
*(Eq. 16.4)*

Use numerically stable softmax in implementation. Define deterministic ties by expert identifier in the reference. A production kernel's tie behavior requires separate verification.

For expert functions \(f_e:\mathbb R^d\rightarrow\mathbb R^d\), two distinct combination rules are

$$
y_t^{\mathrm{mass}}=\sum_{e\in\mathcal S_t}p_{t,e}f_e(x_t),\qquad
y_t^{\mathrm{renorm}}=
\sum_{e\in\mathcal S_t}
\frac{p_{t,e}}{\sum_{j\in\mathcal S_t}p_{t,j}}f_e(x_t).
$$
*(Eq. 16.5)*

These outputs generally differ. The second preserves unit selected mass; the first retains information about probability mass assigned outside the chosen set. Shared branches, if present, are added under their own specified scaling rule.

For fixed selected set and \(k=1\), selected renormalization makes the coefficient exactly one:

$$
\frac{p_{t,e}}{p_{t,e}}=1,\qquad
\frac{\partial}{\partial z_{t,j}}
\left(\frac{p_{t,e}}{p_{t,e}}\right)=0.
$$
*(Eq. 16.6)*

This local derivative assumes positive probability and no selection-boundary crossing. The hard selection remains discontinuous. It explains why casually renormalizing a top-one gate can remove a task-gradient path through the mixture coefficient. Other auxiliary or surrogate paths may still train the router.


~~~figure
id: fig-16.6
kind: calculator
title: "Retained versus normalized gate mass"
caption: "Illustrative top-one scalar expert output of two; changing selected probability changes retained-mass output but not selected-renormalized output."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.5"
alt: "Illustrative top-one scalar expert output of two; changing selected probability changes retained-mass output but not selected-renormalized output."
spec: {"tex":"y_{mass}=2p,\\quad y_{renorm}=2","equation":"16.5","inputs":[{"symbol":"p","label":"selected probability","default":0.6,"min":0.01,"max":1,"format":"fixed2"}],"outputs":[{"symbol":"mass","label":"retained-mass output","formula":"2*p","format":"fixed3"},{"symbol":"renorm","label":"renormalized output","formula":"2","format":"fixed3"}]}
states: [{"anchor":"formulation","label":"Reference gate","variables":{"p":0.6},"note":"Both paths select the same expert but differ in scale."},{"anchor":"mechanism","label":"Higher selected mass","variables":{"p":0.9},"note":"The retained gate preserves the selected probability."},{"anchor":"failure-modes","label":"Boundary agreement","variables":{"p":1},"note":"Agreement at probability one cannot establish general equivalence."}]
~~~


## Mechanism

**DERIVED.** Top-k selection is a discrete operation. Within a region where selected indices do not change, differentiation flows through selected scores and expert outputs under the chosen implementation. It does not make the index change itself differentiable. A training description must state whether any surrogate, noise, or auxiliary objective supplies additional learning signals.

Normalization order matters even when it preserves the selected indices. For one token with finite distinct logits, softmax is monotone in each logit relative to the others and therefore preserves their rank. Renormalizing selected softmax scores cancels the full softmax denominator and gives a softmax over the selected logits. Retaining full-softmax weights does not. These identities cease to justify equivalence when score functions or selection constraints change.

Shared experts avoid selection competition for their own branch under an always-active design. They can carry computation common to many inputs, but the claim that they learn common knowledge rather than another useful decomposition requires empirical evidence. Their gates and scale still belong to the model contract.

Routing granularity controls both statistical flexibility and execution regularity. Token-level routing can assign different parts of one example to different experts. Sequence-level routing reduces assignment variation within the sequence but constrains all its tokens to a shared selection. Block-level routing lies between these choices. Equal top-k at different granularities is not an equal architectural intervention.


~~~figure
id: fig-16.7
kind: diagram
title: "Separate score selection and combination"
caption: "Scores feed a constrained assignment relation; the chosen normalization determines coefficients independently of expert execution."
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.5"
alt: "Scores feed a constrained assignment relation; the chosen normalization determines coefficients independently of expert execution."
spec: {"direction":"LR","nodes":[{"id":"x","kind":"tensor","label":"Input units"},{"id":"score","kind":"process","label":"Score function"},{"id":"select","kind":"process","label":"Constrained selection"},{"id":"weights","kind":"tensor","label":"Combination coefficients"},{"id":"expert","kind":"model","label":"Selected expert functions"},{"id":"sum","kind":"process","label":"Weighted accumulation"}],"edges":[{"from":"x","to":"score","kind":"flow"},{"from":"score","to":"select","kind":"flow"},{"from":"select","to":"expert","kind":"flow"},{"from":"score","to":"weights","kind":"flow"},{"from":"select","to":"weights","kind":"dependency"},{"from":"expert","to":"sum","kind":"flow"},{"from":"weights","to":"sum","kind":"dependency"}]}
~~~


Group-limited routing first narrows the eligible set through a group decision and then selects experts within that set. It can constrain communication destinations, but may exclude globally highest-scoring experts. Report the group-scoring function and placement mapping. Changing device placement while preserving group identifiers can still change communication; changing group membership can change the model's selected function.

Expert-choice routing instead imposes capacity from the expert side. **PAPER-REPORTED.** The cited paper studies expert selection of tokens [R16.7]. **DERIVED.** A fixed number of tokens per expert does not imply a fixed number of experts per token. Audit zero-assignment and many-assignment cases and specify their residual or combination behavior.

Specialization requires more than load histograms. Compare routing by controlled domains, input features, and task requirements, then intervene on selected experts or routing decisions. Balanced counts can coexist with similar expert functions, and distinct counts can reflect superficial tokens rather than useful task decomposition. Preserve uncertainty and avoid naming experts from anecdotal examples.

## Algorithm

**DERIVED — deterministic token-choice reference.**

~~~text
Algorithm 16.2 — Route and combine a bounded token batch
INPUT: token matrix, router weights, expert functions, top-k,
       eligible-expert rules, normalization policy, tie order
OUTPUT: token outputs and assignment ledger
STATE: bounded score rows, selected indices, combination coefficients
INVARIANT: every selected expert is eligible and each token has k distinct selections
1. Validate k and ensure each token has at least k eligible experts.
2. Compute stable routing scores under the specified score function.
3. Select k experts using score order and the declared deterministic tie rule.
4. Derive combination coefficients under the chosen normalization policy.
5. Evaluate selected expert functions, retaining token and assignment identifiers.
6. Accumulate weighted outputs in the declared precision and order.
7. Add any shared branch exactly once under its specified scale.
8. Return outputs together with scores, selections, and coefficient checks.
~~~

A streaming bounded heap gives worst-case \(O(ME\log(k+1))\) selection work and \(O(k)\) selection state per token after scores are available. Full sorting costs \(O(ME\log E)\) and is unnecessary when only k selections are needed. Score computation adds \(O(MdE)\). Treat score comparison as constant-time only after finite scalar scores are computed and validated.

## Implementation

**OFFICIAL-DOCUMENTATION.** NVIDIA Megatron-Core, **Distributed training**, documents configurable router score functions, top-k, and group routing [R16.4]. **DERIVED.** These options define different contracts; sharing one implementation package does not make their outputs interchangeable.

Hugging Face Transformers, **Model definition / adaptation**, provides a model-specific Switch interface [R16.5]. PyTorch, **Model / autograd framework**, can implement the independent bounded reference. Match each checkpoint's actual gating rule rather than imposing the reference renormalization policy.

Keep router precision separate from expert matrix precision. Near-tied scores can change selected indices under rounding even when output tensors remain finite. Compare margins between the kth and next eligible score, assignment agreement, and output differences. A numeric residual alone can miss a routing change that affects future training.

Shared-expert execution may overlap other work, but its output must still be included exactly once. Combining paths in a different floating-point order can change rounding. Validate numerical tolerances without pretending that mathematically equivalent sums imply bitwise equivalence across kernels.

## Experimental design

**PROPOSAL — router quality and specialization have not been measured here.**

### Experiment 16.2 — Routing-contract sensitivity

- **Hypothesis:** Selection granularity and coefficient normalization change the operator and its gradient behavior.
- **Setup:** Use a bounded reference with fixed experts and independently controlled routing inputs.
- **Independent variables:** Top-k, normalization order, score function, tie policy, group constraints, and routing granularity.
- **Controlled variables:** Expert weights, token representations, shared branches, precision, and output loss.
- **Dataset/workload:** Synthetic near-tie fixtures plus held-out domain-labelled inputs for later specialization analysis.
- **Hardware:** Record actual device, runtime, precision, and kernel implementation when executed.
- **Metrics:** Assignment agreement, coefficient sums, output residuals, router gradients, expert loads, and task quality.
- **Baselines:** Full-softmax retained mass, selected renormalization, and dense evaluation of all experts for diagnosis.
- **Expected result:** Algebraically distinct policies differ on constructed cases; empirical task effects remain open.
- **Ablation:** Hold selected indices fixed while changing weights, then hold weights fixed while changing selection.
- **Interpretation:** Attribute output differences to the correct routing stage.
- **Threats to validity:** Shared reference bugs, numerical ties, accidental zero expert outputs, and domain labels confounded with formatting.

## Observations

**What the paper claims — PAPER-REPORTED.** Token-choice and expert-choice mechanisms impose different assignment directions [P10, R16.7].

**What the evidence shows — MATHEMATICALLY-DERIVED.** Selected renormalization at top-one removes the local coefficient derivative in Eq. 16.6.

**What we infer — DERIVED.** A router description must include both assignment and combination, especially when comparing implementations.

**What remains unknown — UNVERIFIED.** Semantic specialization, calibration, and deployment effects require targeted interventions and measurement.

## Failure modes

**DERIVED.** Failures include duplicate expert selections, silent changes to normalization, inconsistent ties across shards, and treating shared experts as part of a competitive top-k pool when the checkpoint expects an always-active branch.


~~~figure
id: fig-16.8
kind: stat-panel
title: "Router equivalence checks"
caption: "Check these independent boundaries before interpreting an MoE quality or resource claim."
placement: rail
anchor: failure-modes
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.6"
alt: "Check these independent boundaries before interpreting an MoE quality or resource claim."
spec: {"header":"Required distinctions","rows":[{"key":"Selection","value":"Same eligible indices and tie policy"},{"key":"Weights","value":"Same normalization and scaling"},{"key":"Gradients","value":"Same declared differentiable paths"},{"key":"Shared","value":"Shared branch included exactly once"}]}
~~~


An especially deceptive failure is matching outputs on inputs where all experts return similar vectors. Such a fixture cannot establish routing equivalence. Include distinguishable expert functions in correctness tests before using realistic trained experts.

## Siblings

**DERIVED.** Token-choice fixes assignments per token; expert-choice fixes admission from the expert side; group routing constrains eligibility; shared branches bypass competition. These are distinct axes rather than mutually exclusive model categories.

## Extensions

**DERIVED.** Variable-k policies require a distribution of active work and a minimum-coverage rule. Modality-specific eligibility requires an explicit fallback when no eligible expert can process a representation. Stateful routers additionally require checkpointing their selection state.

## Limitations

**DERIVED.** The reference omits overflow handling, which is developed in 16.4. Local gradient identities do not prove trainability or convergence. A deterministic tie convention is a reproducibility tool, not evidence that it yields better task quality.

## Reproducibility

Retain scores, selected indices, eligible sets, normalization settings, tie rules, precision, shared-branch scaling, and gradient fixtures. Record the exact checkpoint and framework revisions. Specialization claims require intervention protocols and domain-controlled examples, not only visualized assignments.

## References

[P10](references.md#p10); [R16.4](references.md#r164); [R16.5](references.md#r165); [R16.7](references.md#r167).

