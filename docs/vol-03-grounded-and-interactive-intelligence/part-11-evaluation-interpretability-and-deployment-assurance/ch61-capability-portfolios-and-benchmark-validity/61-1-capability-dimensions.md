---
id: ms.section.61.1
entity_type: section
title: "Capability dimensions"
volume: 3
part: 11
chapter: 61
section: 61.1
slug: 61-1-capability-dimensions
parent: ms.chapter.61
prev_sibling: null
next_sibling: ms.section.61.2
children: []
prerequisites: [ms.chapter.6, ms.chapter.31, ms.chapter.49, ms.chapter.55, ms.chapter.56, ms.chapter.57]
downstream: [ms.chapter.62, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [evaluation], mechanism: [evaluation_validity], feedback_setting: [], modality: [text, image, audio, video]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1900
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 61.1 Capability dimensions

## Scope

[DERIVED] A capability portfolio is a set of measurements selected to justify a specified decision, together with the task distributions, evaluators, operating conditions, and coverage gaps that delimit that decision. This section owns portfolio construction; it does not redefine the experimental unit or leakage-free split, which belong to [Chapter 6](../../../vol-01-learning-and-representation/part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/README.md). The target is a defensible statement about a model endpoint under a protocol, rather than an intrinsic scalar assigned to a checkpoint.

[DERIVED] The required axes are knowledge, reasoning, mathematics, coding, instruction following, multilinguality, multimodality, and long-context use. These axes overlap: solving a mathematical word problem in a low-resource language with a diagram jointly exercises language, perception, and reasoning. Counting one item in several coverage cells is legitimate if disclosed; counting it as several independent observations is not.

## Why this exists

[DERIVED] A single average permits excellent frequent-task performance to compensate for a failure that makes deployment unacceptable. Conversely, selecting only the hardest questions can discard ordinary workflows that dominate cost and user experience. The obstruction is therefore neither insufficient difficulty nor insufficient benchmark count. It is the absence of a mapping from sampled behavior to the decision's requirements.

[DERIVED] Portfolio construction begins with the action to be justified: select a model for a support workflow, identify an adaptation regression, or authorize a bounded tool capability. Each action determines a population, acceptable failures, resource limits, and required evidence. A benchmark becomes admissible when its input, information access, grading, and failure meaning can be mapped to that target. A recognizable dataset name alone supplies none of those mappings.

## Intuition

[DERIVED] Think of each task family as a measurement channel with a particular aperture. A closed-book question measures behavior without external evidence; an open-book version measures retrieval and use of evidence; an image-free ablation asks whether the visual channel mattered. These are different channels even when the final answer is identical. A portfolio must retain both the response and how it was obtained.

[DERIVED] Knowledge and reasoning should be separated operationally by controlled contrasts rather than by assigning every question a unique cognitive label. Supply versus withhold a necessary fact; change a compositional rule while holding facts fixed; replace a relevant diagram with a verified equivalent textual representation. Such interventions isolate stated dependencies. They do not prove the model's internal computation follows a human solution or that a residual score is a pure reasoning variable.

## Formulation

> **Definition — Capability measurement vector.** [DERIVED] For system $j$, protocol $\psi$, task stratum $r$, and bounded acceptance $A_r\in[0,1]$, let $v_{jr}(\psi)$ be expected acceptance under the declared stratum distribution $P_r$.

$$
v_{jr}(\psi)=\mathbb E_{u\sim P_r,\,\xi\sim K_\psi(\cdot\mid u)}[A_r(j,u,\xi)],\qquad \mathbf v_j=(v_{j1},\ldots,v_{jR}).
$$
*(Eq. 61.1)*

[MATHEMATICALLY-DERIVED] Here $u$ is an offered item or episode, $\xi$ contains inference/environment randomness, and $K_\psi$ includes the permitted information and budget. The expectation is undefined until these objects and missing-outcome rules are declared. A portfolio selection can be represented as

$$
\min_{z\in\{0,1\}^{J_e}}\sum_{\ell=1}^{J_e}c_\ell z_\ell\quad\text{subject to}\quad \sum_\ell a_{r\ell}z_\ell\ge h_r\ (r\in\mathcal R),\qquad \sum_\ell c_\ell z_\ell\le C_e.
$$
*(Eq. 61.2)*

[DERIVED] $J_e$ counts candidate evaluations, not model parameters; $c_\ell$ is evaluation expense, $a_{r\ell}$ is an explicitly justified coverage contribution, $h_r$ a required coverage level, and $C_e$ an evaluation budget, not training compute $C$. This is a design abstraction, not a claim that valid evidence is additive. Binary coverage only establishes that a required cell has an eligible measurement:

$$
\Gamma(z)=\sum_{r=1}^{R}\omega_r\,\mathbf1\!\left\{\sum_\ell a_{r\ell}z_\ell>0\right\},\qquad \omega_r\ge0,\quad \sum_r\omega_r=1.
$$
*(Eq. 61.3)*

[DERIVED] High $\Gamma$ says nothing about sample size, evaluator validity, or model competence. A nonexistent or unvalidated task must have no positive coverage contribution.

```figure
{
  "id": "fig-61.3",
  "kind": "calculator",
  "title": "Weighted coverage is not competence",
  "caption": "Illustrative two-stratum coverage under Eq. 61.3. Vary whether each requirement has an admissible measurement; a full coverage value does not assert passing performance or adequate sample size.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.3",
  "alt": "Illustrative two-stratum coverage under Eq. 61.3. Vary whether each requirement has an admissible measurement; a full coverage value does not assert passing performance or adequate sample size.",
  "spec": {
    "tex": "\\Gamma=wq_1+(1-w)q_2",
    "equation": "61.3",
    "inputs": [
      {
        "symbol": "w",
        "label": "First-stratum weight",
        "default": 0.5,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "q1",
        "label": "First stratum covered",
        "default": 1,
        "min": 0,
        "max": 1,
        "options": [
          0,
          1
        ],
        "format": "integer"
      },
      {
        "symbol": "q2",
        "label": "Second stratum covered",
        "default": 0,
        "min": 0,
        "max": 1,
        "options": [
          0,
          1
        ],
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "coverage",
        "label": "Weighted coverage",
        "formula": "w*q1+(1-w)*q2",
        "format": "percent"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "One covered stratum",
      "variables": {
        "q1": 1,
        "q2": 0
      },
      "highlight": [
        "coverage"
      ],
      "note": "Coverage is partial even before competence is considered."
    },
    {
      "anchor": "mechanism",
      "label": "Both strata measured",
      "variables": {
        "q1": 1,
        "q2": 1
      },
      "highlight": [
        "coverage"
      ],
      "note": "Full coverage still leaves sample size, validity and acceptance obligations."
    },
    {
      "anchor": "failure-modes",
      "label": "Weight-sensitive coverage",
      "variables": {
        "q1": 1,
        "q2": 0,
        "w": 0.9
      },
      "highlight": [
        "coverage"
      ],
      "note": "A large weight can make a missing required stratum look small in an aggregate."
    }
  ]
}
```

## Mechanism

### Methodology

[DERIVED] Build an obligation matrix before choosing datasets. Its rows specify required outcomes and failure severity; its columns specify language, modality, context regime, domain, information access, interaction horizon, and resource budget. Record whether a cell has direct evidence, a justified proxy, or an unresolved gap. Allocate noncompensable requirements their own gates. A weighted summary can support a trade-off only after those gates pass.

[DERIVED] For knowledge, distinguish retained information from supplied-evidence use. For mathematics, distinguish exact final answers, valid derivations, and executable or formal checking. For coding, distinguish function completion from repository modification and runtime integration. Instruction following needs separately auditable constraints, including conflicts and infeasible requests; obeying an invalid instruction is not correctness. Multilinguality requires both language comprehension and locally relevant content, with native review when translations change meaning. Multimodality requires evidence-dependence interventions, not merely a file attached to a text-solvable question. Long-context use requires supporting spans at varied locations and dependency structures under actual admitted-token limits; nominal window size is a capacity specification.

[DERIVED] Map these requirements to earlier mechanisms: [retrieval](../../part-09-retrieval-context-and-agent-systems/ch49-retrieval-models-indexing-and-evidence-access/README.md), [document evidence](../../part-10-multimodal-world-and-embodied-models/ch55-vision-language-models-and-document-intelligence/README.md), [audio support](../../part-10-multimodal-world-and-embodied-models/ch56-audio-speech-and-real-time-interaction/README.md), and [temporal evidence](../../part-10-multimodal-world-and-embodied-models/ch57-video-temporal-reasoning-and-streaming-multimodality/README.md). Their distinct observation boundaries cannot be flattened into one text accuracy metric.

```figure
{
  "id": "fig-61.4",
  "kind": "diagram",
  "title": "Requirements determine the measurement aperture",
  "caption": "A required result selects populations, evidence access and acceptance before benchmark choice. Uncovered obligations return to design; a measured average cannot discharge them.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.2",
  "alt": "A required result selects populations, evidence access and acceptance before benchmark choice. Uncovered obligations return to design; a measured average cannot discharge them.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "objective",
        "label": "Required result"
      },
      {
        "id": "n1",
        "kind": "dataset",
        "label": "Population and strata"
      },
      {
        "id": "n2",
        "kind": "boundary",
        "label": "Information and budget"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Admissible measurements"
      },
      {
        "id": "n4",
        "kind": "branch",
        "label": "Obligations covered?"
      },
      {
        "id": "n5",
        "kind": "metric",
        "label": "Vector and gates"
      },
      {
        "id": "n6",
        "kind": "state",
        "label": "Unresolved evidence gap"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n1",
        "to": "n2"
      },
      {
        "from": "n2",
        "to": "n3"
      },
      {
        "from": "n3",
        "to": "n4"
      },
      {
        "from": "n4",
        "to": "n5",
        "label": "yes"
      },
      {
        "from": "n4",
        "to": "n6",
        "label": "no"
      },
      {
        "from": "n6",
        "to": "n0",
        "label": "revise"
      }
    ]
  }
}
```

## Algorithm

[DERIVED] **Algorithm 61.1 — Construct an admissible evaluation portfolio.**

1. Specify target population $Q$, acceptance predicates, prohibited outcomes, and evaluation budget $C_e$; reject an unspecified decision.
2. Enumerate required strata $\mathcal R$ and noncompensable gates; record unknown population weights rather than estimating them from benchmark availability.
3. For each candidate evaluation, inspect its data lineage, grading, support, protocol, and resource envelope. Set $a_{r\ell}>0$ only with a documented transfer argument.
4. Select a feasible portfolio under Eq. 61.2, retaining alternative portfolios when expense or proxy validity is uncertain. If infeasible, report the uncovered obligations.
5. Freeze the selected manifest and reserve independent items for decision confirmation. Execute only after implementation and access checks.
6. Report the vector, gates, coverage map, uncertainty, and excluded claims. Reopen the portfolio when a required population or information boundary changes.

[MATHEMATICALLY-DERIVED] The finite candidate list guarantees design enumeration terminates, not that the evidence suffices. Exact search over all subsets costs $O(2^{J_e}R J_e)$ in a direct implementation. A greedy cover heuristic is cheaper but requires its actual objective and approximation assumptions; it must not silently relax a mandatory gate.

## Implementation

[DERIVED] Use immutable task IDs and separate fields for intended construct, observed behavior, source distribution, operational stratum, evidence provenance, and evaluator version. Store multi-axis tags as metadata rather than duplicating item rows. A result ledger needs offered-item count, eligible-item count, failure count, acceptance, and reason codes. Preserve unsupported inputs and timeouts; a portfolio that drops them estimates a different conditional population.

[DERIVED] Evaluation execution costs scale with offered examples, repeated generations, graders, modalities, and tool interactions. Metadata design is $O(nR)$ if a dense coverage table is materialized, versus $O(k)$ stored nonzero assignments for a sparse map. Model execution, saved output tokens, image/audio decoding, and evaluator calls usually require separate accounting. Device FLOPs, memory traffic, energy, and money are NOT-DISCLOSED without a pinned implementation and measurements. Existing model parameter count does not determine the portfolio's expense.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Paquin and Jain audit 14,042 MMLU items using responses from 1,000 leaderboard models, with deduplicated analyses because these reduce to 869 checkpoints and 50 base-family/size combinations. They fit a Bayesian two-parameter item-response model, regress difficulty on text indicators, and compare predefined STEM/non-STEM partitions. The reported latent correlation is 0.965; item-structure analysis clusters by subject [R61.1, §§3–4, Appendix C].

[DERIVED] This study is evidence about that response population and operational partition. Related checkpoints do not supply 1,000 independent model-development experiments, and STEM membership is an imperfect proxy for inferential demand. Conditional fit and a high latent correlation do not justify either a universal single ability or a universal two-factor ontology. The consequential engineering change is to preserve domain-specific responses and test whether the intended selection survives disaggregation.

## Observations

**What the paper claims.** [PAPER-REPORTED] The MMLU audit argues against treating its aggregate as an interchangeable knowledge/reasoning measure [R61.1, §§5–6].

**What the evidence shows.** [DERIVED] The sampled response structure supports testing aggregation rather than assuming construct equivalence.

**What we infer.** [DERIVED] Model selection should use the portfolio's relevant strata and gates before an overall score.

**What remains unknown.** [NOT-DISCLOSED] This audit does not establish performance on the reader's deployment population or isolate internal reasoning mechanisms.

## Failure modes

> **Failure mode — Coverage by naming.** [DERIVED] *Symptom:* A portfolio claims a joint capability from separate marginal suites. *Cause:* Task names are substituted for evidence on the required intersection. *Detection:* Inspect coverage cells for the language-by-domain-by-modality requirement and run matched evidence controls. *Mitigation:* Add an admissible joint-stratum evaluation or leave the obligation unresolved.

[MATHEMATICALLY-DERIVED] Suppose two equally weighted strata yield acceptance vectors $(1,0)$ and $(0.5,0.5)$. Both average 0.5, but a requirement of at least 0.4 in every stratum admits only the second. This is an analytical counterexample, not measured model behavior. Duplicating the first stratum's benchmark rows can make the first system's micro-average arbitrarily close to one without changing its missing capability.

[DERIVED] A second failure is using a metric that rewards the prohibited shortcut: language fluency can conceal incorrect domain facts; correct answers can survive a missing image because the question leaks the answer. Detect these through matched evidence-removal and content-control conditions. A failed control narrows the supported construct even if the original answer was correct.

```figure
{
  "id": "fig-61.5",
  "kind": "compare",
  "title": "Marginal coverage versus joint obligations",
  "caption": "The two designs answer different questions. Joint requirements cannot be established from two independently sampled marginals without the needed intersection evidence.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.3",
  "alt": "The two designs answer different questions. Joint requirements cannot be established from two independently sampled marginals without the needed intersection evidence.",
  "spec": {
    "axis": "Evidence needed for a language-by-coding requirement",
    "columns": [
      {
        "id": "a",
        "label": "Marginal suites"
      },
      {
        "id": "b",
        "label": "Jointly stratified suite"
      }
    ],
    "rows": [
      {
        "dimension": "Observed cells",
        "values": {
          "a": "Coding overall; language overall",
          "b": "Coding within each target language"
        }
      },
      {
        "dimension": "Independence",
        "values": {
          "a": "Does not establish interaction",
          "b": "Item IDs retain shared dependencies"
        }
      },
      {
        "dimension": "Decision",
        "values": {
          "a": "Proxy with explicit gap",
          "b": "Direct if tasks match deployment"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] [Benchmark families](61-2-benchmark-families.md) supplies response/grading choices; [protocol control](61-3-version-and-protocol-control.md) fixes the measurement operator; [validity threats](61-4-validity-threats.md) challenges the transfer argument. [Chapter 62](../ch62-human-preference-model-judges-and-uncertainty/README.md) owns preference/judge uncertainty, while [Chapter 63](../ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/README.md) owns deployed-system reliability. A portfolio should link to these mechanisms rather than silently identify their estimands.

[DERIVED] Prefer a small directly relevant portfolio to a large proxy collection when it resolves the required decision with adequate uncertainty. Reverse that preference if the narrow workload omits a deployment stratum, a regression emerges outside it, or a broader suite detects a requirement violation that the local tasks miss.

## Extensions

[DERIVED] An adaptive portfolio can allocate additional evaluation to cells whose uncertainty could change the decision. The selection rule must be logged and confirmed on reserved data, since repeatedly adding tasks after seeing a weak result changes the evidential meaning. Scientific value lies in resolving an obligation or finding a transferable obstruction; adding a benchmark with the same response pattern and provenance may contribute little independent evidence.

[DERIVED] The next useful investigation is therefore conditional: a failed multimodal ablation demands new evidence-dependent items; unstable domain rankings demand a domain-specific selection check; unknown task prevalence demands deployment sampling. A larger average sample cannot repair missing support.

## Limitations

[DERIVED] No finite portfolio proves universal capability. Coverage contributions and deployment weights require substantive judgment and can be wrong. Observational response factors do not identify causal computations, and an expert-written task can still have a faulty evaluator. Rare high-severity events need targeted evidence in addition to a prevalence-weighted sample.

[UNVERIFIED] The book has not run a new capability suite or compared model endpoints. This section establishes a construction and its validity conditions, not a completed deployment authorization. Investigation stops when the declared obligations have admissible evidence and remaining uncertainty cannot reverse the specified decision; new requirements or a failed assumption reopen it.

## Reproducibility

[DERIVED] Preserve the requirement document, portfolio version, coverage rationale, item-level provenance, sampling frame, target weights, evaluation budget, gates, and rejected alternatives. Link every result to the full protocol hash and keep unresolved cells explicit. Independent reproduction should be able to reconstruct why a particular task counted toward a requirement, not only reproduce an aggregate number.

[ASSUMED] [Experiment 61.1](verification.md#experiment-611--portfolio-and-protocol-sensitivity) proposes the portfolio/ranking audit. It is unexecuted. Mathematical examples and authored figures use chosen analytical values; they are not observations of any named system.

## References

[R61.1] Paquin and Jain, What Does MMLU Actually Measure?, inspected v1, §§3–6 and Appendix C. Exact first-release, revision, access, and scope records are in [the source ledger](references.md).
