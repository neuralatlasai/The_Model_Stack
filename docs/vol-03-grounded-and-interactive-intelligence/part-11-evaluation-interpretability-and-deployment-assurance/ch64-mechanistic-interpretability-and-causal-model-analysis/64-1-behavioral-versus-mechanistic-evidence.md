---
id: ms.section.64.1
entity_type: section
title: "Behavioral versus mechanistic evidence"
volume: 3
part: 11
chapter: 64
section: 64.1
slug: 64-1-behavioral-versus-mechanistic-evidence
parent: ms.chapter.64
prev_sibling: null
next_sibling: ms.section.64.2
children: []
prerequisites:
  [
    ms.chapter.2,
    ms.chapter.5,
    ms.chapter.13,
    ms.chapter.14,
    ms.chapter.15,
    ms.chapter.16,
    ms.chapter.17,
    ms.chapter.18,
    ms.chapter.32,
    ms.chapter.61,
    ms.chapter.62,
  ]
downstream: [ms.chapter.65, ms.chapter.66]
related: [ms.chapter.40, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [evaluation, assurance],
    mechanism:
      [causal_intervention, representation_analysis, feature_decomposition],
    feedback_setting: [],
    modality: [text],
  }
papers: []
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: { maturity: active, disputed: false }
evidence_summary:
  {
    labels_used:
      [
        DERIVED,
        MATHEMATICALLY-DERIVED,
        PAPER-REPORTED,
        CODE-VERIFIED,
        ASSUMED,
        NOT-DISCLOSED,
        UNVERIFIED,
      ],
    empirically_observed: false,
  }
word_count_target: 2200
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 64.1 Behavioral versus mechanistic evidence

## Scope

[DERIVED] The required artifact is a mechanistic hypothesis with an explicit intervention contract, negative controls and held-out counterexamples. Its baseline is a behavioral or probe-based explanation that predicts observations without testing the proposed internal dependence. Acceptance means that specified interventions discriminate the hypothesis from its alternatives on a declared population; it does not mean that a fluent description identifies the model's complete computation. Statistical uncertainty belongs to [Chapter 62](../ch62-human-preference-model-judges-and-uncertainty/README.md). This section owns the distinction between observed association, internal accessibility, finite interventional evidence and mechanistic generalization.

## Why this exists

[MATHEMATICALLY-DERIVED] Behavioral equivalence on an observed support is insufficient to identify an internal mechanism. Consider two internal variables $r,s$ that always satisfy $r=s$ in the observed population. The candidate models $y=r$ and $y=s$ agree on every such input, yet replacing $s$ while holding $r$ fixed separates them. More test examples from the same diagonal support cannot resolve this ambiguity. Access to activations changes the possible experiments, but an intervention is informative only if its semantics, alignment and background state are specified.

[PAPER-REPORTED] Concept-Targeted Attribution (CTA) makes a related distinction operational: its scalar target is a linear concept score rather than the next-token logit. The two graphs can support different ablation effects. The source studies four dataset-defined concepts on Gemma-2-2B and Llama-3.2-1B; it does not establish that a probe measures an intrinsic, context-free semantic property. [R64.1, §§3.1-3.3, Limitations](https://arxiv.org/html/2608.27510v1#S3).

## Intuition

[DERIVED] A probe answers whether a label is accessible to a chosen readout class. A localization experiment asks where a particular perturbation changes a specified score. A mechanistic explanation additionally states the variables, transformations and dependencies that make that change predictable. These claims form different contracts, rather than automatically forming a ladder on which a high probe accuracy supplies every missing causal step. A model can encode a variable that its current output does not use, and an ablated component can matter through an unintended side effect.

## Formulation

[DERIVED] Let $F_\theta$ be a frozen model, $x$ an input, $h_j(x)\in\mathbb R^{d_j}$ the activation at a precisely named site $j$, and $m(F_\theta(x))$ a scalar score. A probe $p_\omega(h)$ predicts a dataset label $y$. Its population risk and an exact model-internal patch effect are different quantities:

$$
\mathcal R_{\mathcal P}(p_\omega)=\mathbb E_{(x,y)\sim\mathcal P}\ell(p_\omega(h_j(x)),y),\qquad
\Delta_{j,a}(x)=m(F_\theta^{\,h_j\leftarrow a}(x))-m(F_\theta(x)).
$$

_(Eq. 64.1)_

[DERIVED] The superscript means a declared replacement at one execution site, with other computation recomputed according to the intervention policy. It is not an intervention on a real-world cause. The donor $a=h_j(x')$ requires a token/site alignment map, a donor-selection rule, and a record of whether the recipient's other branches are held fixed or recomputed. Changing any of these changes the estimand. A probability, a logit and a log probability are also different scores; saturation can change their sensitivity.

[MATHEMATICALLY-DERIVED] Let $\rho$ map low-level states to variables of a proposed abstract model $G$, and let $I$ and $\bar I$ be corresponding low- and high-level interventions. A finite test of the claimed correspondence measures

$$
\epsilon_{\mathcal Q}(G,\rho)=
\mathbb E_{(x,I,\bar I)\sim\mathcal Q}
d_{\mathrm{out}}\!\left(\rho(F_\theta^I(x)),G^{\bar I}(\rho(x))\right).
$$

_(Eq. 64.2)_

[DERIVED] This is a book-defined conditional test, not a guarantee supplied by any cited recent paper. The mapping must be defined on input and relevant output states, and the distance must compare compatible objects. Small error on finitely sampled $\mathcal Q$ does not quantify error on interventions absent from its support. Selecting $G$, $\rho$ or $\mathcal Q$ after seeing test outcomes invalidates a nominal held-out claim.

```figure
{
  "id": "fig-64.3",
  "kind": "calculator",
  "title": "Precision of an intervention proportion",
  "caption": "Illustrative normal-approximation half-width for independent Bernoulli intervention successes; clustering, selection and small counts require Chapter 62 methods.",
  "alt": "An analytical calculator with explicit inputs. Illustrative normal-approximation half-width for independent Bernoulli intervention successes; clustering, selection and small counts require Chapter 62 methods.",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-64.3",
  "spec": {
    "equation": "64.3",
    "tex": "h_{\\mathrm{Wald}}=z\\sqrt{\\widehat p(1-\\widehat p)/n}",
    "inputs": [
      {
        "symbol": "p",
        "label": "success fraction",
        "default": 0.8,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "n",
        "label": "independent intervention pairs",
        "default": 200,
        "min": 10,
        "max": 10000,
        "format": "integer"
      },
      {
        "symbol": "z",
        "label": "normal critical value",
        "default": 1.96,
        "min": 1,
        "max": 3,
        "format": "fixed2"
      }
    ],
    "outputs": [
      {
        "symbol": "halfwidth",
        "label": "approximate half-width",
        "formula": "z*sqrt(p*(1-p)/n)",
        "format": "percent"
      }
    ]
  },
  "placement": "rail",
  "anchor": "formulation"
}
```

[MATHEMATICALLY-DERIVED] For independent Bernoulli successes $X_i$, $\widehat p=n^{-1}\sum_iX_i$, the plug-in normal half-width is

$$
h_{\mathrm{Wald}}=z\sqrt{\widehat p(1-\widehat p)/n}.
$$

_(Eq. 64.3)_

[DERIVED] Equation 64.3 is an illustrative precision calculation, not this chapter's acceptance interval. At $\widehat p\in\{0,1\}$ it degenerates to zero and must not be interpreted as certainty. The proposed protocol uses source/template-level resampling or a predeclared binomial interval when independence is justified. Multiple donor interventions from one source are not independent sources.

## Mechanism

### Methodology

[PAPER-REPORTED] CTA first extracts last-token residual activations and trains concept directions from class-conditional means. It traces a chosen direction through a cross-layer-transcoder replacement model, then compares probe-targeted and logit-targeted graph feature sets. For a prompt, the source zeros features exclusive to each graph and measures both concept-score change and top-1 token flips. The intersection condition tests shared features. This targets a double dissociation between two readouts rather than using internal decodability as a proxy for generation. [R64.1, §3.3, Appendix A.2-A.4](https://arxiv.org/html/2608.27510v1#A1).

[DERIVED] A defensible hypothesis must name a competing explanation before the decisive intervention. If the hypothesis says a feature mediates factual retrieval, matched counterexamples should separate retrieval from lexical topic, answer format and memorized template. Identity patches test implementation invariance. Matched unrelated donors and norm-matched random directions test whether generic disruption explains the result. A failed null test is an implementation or intervention-validity problem before it is evidence against a semantic theory. A selective effect can still reflect an unmeasured confound if the donor changes several latent variables together.

```figure
{
  "id": "fig-64.4",
  "kind": "diagram",
  "title": "Separate observation from an intervention claim",
  "caption": "A probe, exact patch and abstract-model test answer different questions. A failed control returns an invalid or inconclusive result rather than a mechanistic conclusion.",
  "alt": "Text equivalent: Held-out source and donor pairs. Readout prediction risk. Declared exact intervention. Identity and matched null controls. Competing mechanistic hypotheses. Supported scope or counterexample. Arrows encode the stated dependencies, not measured causal strengths.",
  "evidence": "DERIVED",
  "source": [
    "DERIVED:eq-64.1",
    "DERIVED:eq-64.2"
  ],
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "data",
        "kind": "dataset",
        "label": "Held-out source and donor pairs"
      },
      {
        "id": "probe",
        "kind": "metric",
        "label": "Readout prediction risk"
      },
      {
        "id": "patch",
        "kind": "process",
        "label": "Declared exact intervention"
      },
      {
        "id": "control",
        "kind": "branch",
        "label": "Identity and matched null controls"
      },
      {
        "id": "hyp",
        "kind": "model",
        "label": "Competing mechanistic hypotheses"
      },
      {
        "id": "result",
        "kind": "state",
        "label": "Supported scope or counterexample"
      }
    ],
    "edges": [
      {
        "from": "data",
        "to": "probe",
        "label": "association"
      },
      {
        "from": "data",
        "to": "patch",
        "label": "aligned donor"
      },
      {
        "from": "patch",
        "to": "control",
        "label": "validity"
      },
      {
        "from": "hyp",
        "to": "control",
        "label": "predictions"
      },
      {
        "from": "control",
        "to": "result",
        "label": "discriminating outcomes"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 64.1 - Validate a finite mechanistic claim.** [DERIVED] Inputs are a frozen model identity, disjoint discovery and evaluation source sets, two preregistered hypotheses, an intervention family, controls, a distance threshold $\varepsilon_*$ and finite budget $J_{\max}$. Output is a supported finite scope, a counterexample, invalid controls or inconclusive status. No hypothesis is selected on evaluation outcomes.

$$
\begin{aligned}
1.&\quad \mathcal L\leftarrow\varnothing,\quad j\leftarrow0;\quad
 \text{reject invalid site, alignment or model identity};\\
2.&\quad j\leftarrow j+1;\quad (x_j,x'_j,I_j,\bar I_j)\leftarrow\mathcal Q_{\mathrm{eval}};\\
3.&\quad c_j\leftarrow\operatorname{RunControls}(x_j,x'_j);\quad
 c_j=\mathrm{fail}\Rightarrow\operatorname{return}(\mathrm{invalid},j);\\
4.&\quad u_j\leftarrow\rho(F_\theta^{I_j}(x_j)),\quad
 v_j\leftarrow G^{\bar I_j}(\rho(x_j));\quad
 \mathcal L\leftarrow\mathcal L\cup\{d_{\mathrm{out}}(u_j,v_j)\};\\
5.&\quad \text{if the predeclared rejection rule fires, return counterexample};\\
6.&\quad j<J_{\max}\Rightarrow\text{return to 2};\quad
 \operatorname{return}\bigl(\operatorname{Decision}(\mathcal L,\varepsilon_*),\mathcal Q_{\mathrm{eval}}\bigr).
\end{aligned}
$$

[DERIVED] The invariant is unchanged model/site/hypothesis identity and no evaluation-to-discovery feedback within the run. Termination is bounded by $J_{\max}$; resource exhaustion returns inconclusive. If $c$ interventions and controls are used per example, forward cost is $O(J_{\max}c\,\operatorname{cost}(F_\theta))$, plus hook storage. Retaining full activations costs $O(n\sum_jd_j)$ for $n$ token-site records; streaming sufficient scores reduces storage only when later reanalysis is unnecessary.

## Implementation

[CODE-VERIFIED] The official CTA repository at commit `46f69f131c1bf327592efcbf733b4d08a9ce2894` documents a vendored circuit-tracer and separate `cta` and `cta_modified` pipelines. Its README's installation uses unpinned package names and its demonstration model differs from the two main paper models. This static README inspection verifies artifact organization, not execution or an exact reproduction environment. PyTorch (model/autograd framework) and Hugging Face Transformers (model definition/loading) are the relevant reference-stack systems; the CTA-specific orchestration is outside the stack, routed through the plan's circuit-tracing anchor. [R64.10, README, Setup and Running CTA](https://github.com/vedantpalit/concept-targeted-attribution/tree/46f69f131c1bf327592efcbf733b4d08a9ce2894).

[DERIVED] Hooks must record module path, input/output side, pre/post-normalization, token position, batch membership and dtype. Validate an identity patch within a stated numerical tolerance before caching scores. A tensor with the right shape but the wrong token or normalization convention is semantically invalid. Store source identifiers separately from potentially sensitive activation content; retained activations are model-derived data with their own access boundary.

## Experimental design

### Reported experiments

[PAPER-REPORTED] CTA uses four balanced concept datasets, 5,000 examples per class, a per-class 80/20 train/validation split, seed 42 and a 60-token filter. Toxicity uses paired ParaDetox sentences; sentiment uses SST-2; reasoning contrasts HotpotQA and TriviaQA; truthfulness pools factual categories. The graph analysis uses 100 prompts per concept and layer; causal dissociation uses 50 prompts per concept. Computation is reported on one A100 80 GB. These controls do not logically eliminate dataset provenance, style or label ambiguity: for example a dataset-of-origin contrast need not isolate reasoning. Exact model/tokenizer and CLT hashes, numerical precision and prompt-level uncertainty for the flip table are not fully disclosed in the inspected protocol. [R64.1, Appendices A.1-A.5, E](https://arxiv.org/html/2608.27510v1#A1).

## Observations

**What the paper claims.** [PAPER-REPORTED] In Table 1, Gemma toxicity probe-exclusive ablation changes the probe score from 102.52 to 41.28 with 0% top-1 flips; logit-exclusive ablation yields score 101.82 with 100% flips. Gemma truthfulness probe-exclusive ablation has 25% flips, so the dissociation is not universally behavior-preserving. These are source-reported means/rates on its selected conditions. [R64.1, Table 1](https://arxiv.org/html/2608.27510v1#S3.T1).

**What the evidence shows.** [DERIVED] The source table contains both selective and nonselective cases: the truthfulness probe-exclusive condition changes top-1 behavior in 25% of cases. This directly bounds an unconditional claim that probe-exclusive ablation preserves behavior; Eq.64.1 separately shows why probe risk is not a patch effect.

**What we infer.** [DERIVED] The reported intervention separates a probe readout from the immediate top-1 output under that replacement and pruning contract. It motivates auditing representation and generation separately. It does not establish that the model's underlying concept is unchanged whenever the probe score is unchanged, nor that longer generation remains unaffected. [DERIVED] Prefer the mechanistic hypothesis over its behavioral rival only if independent interventions make different predictions and controls pass. Reopen the preference if a new donor family, an alternative probe direction or a counterexample invalidates the selective effect. When both hypotheses predict the same tested outcomes, the result is underdetermined.

**What remains unknown.** [NOT-DISCLOSED] Prompt-level intervals, stable graph choices across donor rules, exact checkpoint identities and broad distribution-shift transfer are not established by the reported table. No book-authored model intervention was run.

## Failure modes

[DERIVED] A probe may exploit label leakage; source-level splitting and dataset-held-out tests can expose it. A zero ablation may leave the activation manifold; compare matched resampling and nonzero donors. A top-1 flip rate can hide large probability changes below the winning token; retain logits or log probabilities and a sequence-level task score. Selecting the strongest layer on evaluation data creates an optimistic target; select on discovery data or account for selection. Counterexample search failure is not proof that no counterexample exists.

## Siblings

```figure
{
  "id": "fig-64.5",
  "kind": "compare",
  "title": "Choose evidence for the actual question",
  "caption": "A prediction, a finite intervention effect and a mechanistic correspondence have distinct acceptance rules and reversal conditions.",
  "alt": "Text equivalent: A prediction, a finite intervention effect and a mechanistic correspondence have distinct acceptance rules and reversal conditions.",
  "evidence": "DERIVED",
  "source": [
    "DERIVED:eq-64.1",
    "DERIVED:eq-64.2"
  ],
  "spec": {
    "axis": "Choose evidence for the actual question",
    "columns": [
      {
        "id": "probe",
        "label": "Probe"
      },
      {
        "id": "patch",
        "label": "Exact patch"
      },
      {
        "id": "abstract",
        "label": "Mechanistic hypothesis"
      }
    ],
    "rows": [
      {
        "dimension": "Target",
        "values": {
          "probe": "Label accessibility",
          "patch": "Effect under declared replacement",
          "abstract": "Predicted interventional structure"
        }
      },
      {
        "dimension": "Main confound",
        "values": {
          "probe": "Dataset shortcuts",
          "patch": "Off-support donor and background",
          "abstract": "Wrong mapping or incomplete intervention set"
        }
      },
      {
        "dimension": "Decisive next test",
        "values": {
          "probe": "Held-out provenance labels",
          "patch": "Identity and matched donor controls",
          "abstract": "Counterexample where hypotheses disagree"
        }
      }
    ]
  },
  "placement": "rail",
  "anchor": "siblings"
}
```

[DERIVED] Output-only auditing remains appropriate when internal access is unavailable and the claim concerns observable behavior. It cannot identify otherwise observationally equivalent internal models. Exact patching is preferable to a cheap approximation when the finite effect is the acceptance target and the candidate set fits the budget; [64.4](64-4-causal-tracing.md) treats the approximation boundary.

## Extensions

### Improvements

[PAPER-REPORTED] CTA's dated change is the attribution target: a probe score replaces an output logit while retaining the graph machinery. Its reported double dissociation is evidence for the usefulness of that changed target, not an isolating validation of every CLT approximation. Broader cross-architecture and finer concept-steering tests remain future work in the source. [R64.1, §§3, 5, Limitations](https://arxiv.org/html/2608.27510v1#S5).

## Limitations

[DERIVED] This chapter treats model-internal interventions as controlled software experiments, with their own causal semantics. It does not infer psychological constructs or world causes directly from internal feature names. Investigation stops at the declared intervention family, uncertainty target and resource budget; only a successful acceptance rule warrants the bounded claim. A change in model, site, donor distribution or abstract mapping reopens validation.

## Reproducibility

[DERIVED] Preserve original/counterfactual inputs, model and tokenizer hashes, intervention-site schema, alignment, probe training split, frozen hypothesis, scores before and after every control, precision, seeds and excluded/failed cases. Report both intent-to-test denominators and successfully parsed evaluations. The chapter's proposed experiments and acceptance rules are in [verification](verification.md); they have not been executed.

## References

[R64.1] CTA, §§3-5 and Appendices A, E. [R64.10] Official CTA repository, pinned README inspection. Full identities and dates: [references](references.md).
