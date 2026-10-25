---
id: ms.section.61.2
entity_type: section
title: "Benchmark families"
volume: 3
part: 11
chapter: 61
section: 61.2
slug: 61-2-benchmark-families
parent: ms.chapter.61
prev_sibling: ms.section.61.1
next_sibling: ms.section.61.3
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

# 61.2 Benchmark families

## Scope

[DERIVED] Benchmark families are selected here by the response object and checking procedure they make available: option selection, short-answer generation, derivation, executable program, instruction-constrained response, and domain artifact. The historical names in the plan are a catalog to operationalize, not evidence that their original versions satisfy the 2026 deployment target. This section compares measurement contracts and does not import pre-window papers as newly released research.

[DERIVED] A benchmark identity must include the dataset configuration and split, not only the family name. MMLU and MMLU-Pro, GPQA variants, HLE text versus multimodal conditions, AIME years, and coding-test revisions are different experimental objects. ARC must be qualified: school-science question answering and visual program-induction tasks named ARC are different families with different inputs and validators.

## Why this exists

[DERIVED] Difficulty alone does not determine usefulness. An almost universally solved task can detect a regression in a required common operation, while an almost universally failed task may provide no power to distinguish candidates at the chosen budget. A domain-specific task can be more relevant than a prestigious general suite, but only if its evaluator captures the required artifact and its sample represents the target.

[DERIVED] The controlling obstruction is the mismatch between the answer format and the intended capability. A correct option can result from recognizing a distractor pattern; a correct final number can follow invalid reasoning; a program can pass incomplete tests while violating the specification. Increasing the number of examples does not change what the scoring operator accepts.

## Intuition

[DERIVED] Measurement should be read backward from the acceptance event. For option selection, ask which strings receive probability and how their lengths are treated. For generated answers, ask what is extracted and normalized. For programs, ask what runs, in which environment, with what hidden tests and resource restrictions. For domain artifacts, ask whether qualified adjudication can distinguish a plausible-looking output from a valid one.

[DERIVED] Alternatives expose different failure surfaces. Multiple choice permits bounded scoring cost and exact labels, but constrains the answer space and supplies information through distractors. Free generation removes that particular cue while introducing extraction and grading error. Both can be useful when treated as distinct probes. Their score difference cannot be attributed solely to reasoning without holding other changes fixed.

## Formulation

[MATHEMATICALLY-DERIVED] For item $i$ with allowed answer strings $a\in\mathcal A_i$, a declared likelihood-based selector is

$$
\widehat a_i=\arg\max_{a\in\mathcal A_i}\frac{\sum_{t=1}^{|a|}\log p_\theta(a_t\mid c_i,a_{<t})}{\nu_i(a)},\qquad \nu_i(a)>0.
$$
*(Eq. 61.4)*

[DERIVED] $\nu_i=1$ gives sequence log probability; a token- or byte-length denominator defines a different decision. Delimiters, choice order, tokenizer boundaries, and whether labels or full choices are scored belong to $c_i$ and $\mathcal A_i$. A generative response uses a different pipeline: extract $e_i(y)$, normalize under a declared equivalence relation, then compare to admissible answers. Do not switch to a lenient extractor only after seeing errors.

[MATHEMATICALLY-DERIVED] For a generated program $f$ and finite test set $\mathcal T_i$, define

$$
A_i^{\mathrm{test}}(f)=\mathbf1\{\forall t\in\mathcal T_i:\ \operatorname{run}_{\mathcal E_i}(f,t)\text{ terminates within limits and meets its predicate}\}.
$$
*(Eq. 61.5)*

[DERIVED] Specification validity $A_i^\star$ implies test success only if tests are correct and the allowed behavior includes their resource conditions. Test success implies specification validity only if tests are complete for the allowed program/input class. Neither implication is automatic. If label scoring is modeled with item response theory, a separate statistical hypothesis is

$$
\Pr(Y_{ji}=1\mid\eta_j,a_i,\delta_i)=\sigma(a_i(\eta_j-\delta_i)),\qquad a_i>0,\quad \sigma(z)=(1+e^{-z})^{-1},\quad \mathcal I_i(\eta)=a_i^2p_i(\eta)(1-p_i(\eta)).
$$
*(Eq. 61.6)*

[DERIVED] $\eta_j$ is local latent ability, $\delta_i$ local difficulty, and $\mathcal I_i$ conditional Fisher information in a correctly specified two-parameter logistic model. These are not model parameters $\theta$ or physical bytes $b$. Location/scale must be identified. Extreme $p_i$ reduces this model's local information; it does not make a required easy task irrelevant.

```figure
{
  "id": "fig-61.6",
  "kind": "calculator",
  "title": "Conditional item information",
  "caption": "Illustrative two-parameter logistic measurement under Eq. 61.6, not a fitted model. Information peaks around conditional success probability one half; difficulty extremes can still be mandatory regression cases.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.6",
  "alt": "Illustrative two-parameter logistic measurement under Eq. 61.6, not a fitted model. Information peaks around conditional success probability one half; difficulty extremes can still be mandatory regression cases.",
  "spec": {
    "tex": "p=\\sigma(a(\\eta-\\delta));\\quad \\mathcal I=a^2p(1-p)",
    "equation": "61.6",
    "inputs": [
      {
        "symbol": "a",
        "label": "Positive discrimination",
        "default": 1,
        "min": 0.1,
        "max": 4,
        "format": "raw"
      },
      {
        "symbol": "ability",
        "label": "Local latent ability",
        "default": 0,
        "min": -4,
        "max": 4,
        "format": "raw"
      },
      {
        "symbol": "difficulty",
        "label": "Local item difficulty",
        "default": 0,
        "min": -4,
        "max": 4,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "prob",
        "label": "Conditional success probability",
        "formula": "1/(1+exp(-a*(ability-difficulty)))",
        "format": "percent"
      },
      {
        "symbol": "info",
        "label": "Conditional Fisher information",
        "formula": "a^2*(1/(1+exp(-a*(ability-difficulty))))*(1-1/(1+exp(-a*(ability-difficulty))))",
        "format": "raw"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Matched ability and difficulty",
      "variables": {
        "ability": 0,
        "difficulty": 0
      },
      "highlight": [
        "prob",
        "info"
      ],
      "note": "Conditional item information is largest near one-half success in this model."
    },
    {
      "anchor": "mechanism",
      "label": "Easy for this population",
      "variables": {
        "ability": 3,
        "difficulty": 0
      },
      "highlight": [
        "info"
      ],
      "note": "A locally uninformative easy item can remain a required regression case."
    },
    {
      "anchor": "failure-modes",
      "label": "Hard for this population",
      "variables": {
        "ability": -3,
        "difficulty": 0
      },
      "highlight": [
        "info"
      ],
      "note": "Difficulty alone does not guarantee discriminative or deployment-relevant evidence."
    }
  ]
}
```

## Mechanism

### Methodology

[DERIVED] Use the following contract map when assembling the plan's families. Each row names a diagnostic purpose and obligations; it does not assert a current score or universal construct purity.

| Family | Observable response/check | Required controls and unsupported leap |
|---|---|---|
| MMLU / MMLU-Pro | Subject-stratified option or generated-label correctness | Keep family, subject mix, choice count, prompt and scoring separate; academic accuracy alone does not identify general reasoning |
| GPQA | Domain-science question correctness | Pin main/diamond/extended, answer preprocessing and tool access; challenge labels do not establish novel research ability |
| HLE | Expert-level short/choice answers, with modality conditions declared | Pin item revision, text/image support and grader; breadth or difficulty does not ensure item correctness |
| ARC | Explicitly named school-science or visual-induction contract | Do not merge unrelated task families sharing an acronym; define trial and adaptation permissions |
| BBH | Heterogeneous task-specific answer predicates | Preserve per-task formats and aggregation; label parsing can dominate a nominal reasoning difference |
| GSM8K | Mathematical word-problem answer extraction | Retain units, final-answer boundary and allowed computation; final value does not verify derivation |
| MATH / AIME | Competition-style mathematical answers | Pin subset/year and symbolic/numeric equivalence; avoid tiny-sample ranking claims and year leakage |
| HumanEval / MBPP | Programs accepted by executable tests | Pin tests, language/runtime, timeout and sandbox; test passing is finite specification coverage |
| Domain-specific tasks | Required artifact plus qualified predicate | Validate population, rubric, permitted evidence and severity; general accuracy does not authorize domain use |

[DERIVED] Include instruction constraints, native-language items, evidence-dependent multimodal cases, and long-context dependencies from the relevant canonical chapters. A single mixed suite is permissible if each item retains its task-specific validator and denominator. Averaging heterogeneous raw metrics without a declared mapping has no measurement interpretation.

```figure
{
  "id": "fig-61.7",
  "kind": "diagram",
  "title": "Response objects require different validators",
  "caption": "The input contract determines whether options, generated answers, or executable artifacts are graded. Every path retains invalid/error outcomes and rejoins the offered-item ledger.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.5",
  "alt": "The input contract determines whether options, generated answers, or executable artifacts are graded. Every path retains invalid/error outcomes and rejoins the offered-item ledger.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Pinned item and allowed support"
      },
      {
        "id": "n1",
        "kind": "branch",
        "label": "Response object"
      },
      {
        "id": "n2",
        "kind": "process",
        "label": "Choice likelihood and normalization"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Extract and adjudicate answer"
      },
      {
        "id": "n4",
        "kind": "boundary",
        "label": "Sandbox program tests"
      },
      {
        "id": "n5",
        "kind": "metric",
        "label": "Acceptance and failure ledger"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n1",
        "to": "n2",
        "label": "choice"
      },
      {
        "from": "n1",
        "to": "n3",
        "label": "generation"
      },
      {
        "from": "n1",
        "to": "n4",
        "label": "program"
      },
      {
        "from": "n2",
        "to": "n5"
      },
      {
        "from": "n3",
        "to": "n5"
      },
      {
        "from": "n4",
        "to": "n5"
      }
    ]
  }
}
```

## Algorithm

[DERIVED] **Algorithm 61.2 — Audit a task's response and validator.**

1. Freeze item IDs, input support, answer set/specification, environment, and scoring operator before generating responses.
2. Construct known-correct, known-incorrect, boundary, ambiguous, malformed, and timeout controls. Where correctness itself is contested, record adjudication and omit unsupported hard labels.
3. Evaluate the validator on controls without querying the candidate model. Record false acceptances and false rejections by error category.
4. Run admissible model responses under Eq. 61.4, generated-answer grading, or Eq. 61.5 as specified. Store raw outputs and failure statuses before normalization.
5. Review a prespecified sample of passes and failures against the independent specification. Distinguish model, extractor, label, test, and environment errors.
6. Change a faulty validator only through a new protocol version; rescore preserved outputs when valid and rerun when the changed input or environment requires it.

[DERIVED] Terminate on finite item/control sets with bounded grader and execution time. A task with no trustworthy predicate remains an evidence gap rather than receiving a fabricated score. Tests are not allowed to execute arbitrary code in the evaluator's privileged process.

## Implementation

[OFFICIAL-DOCUMENTATION] The inspected LM Evaluation Harness v0.4.13 GPQA README distinguishes zero-shot, few-shot, generative, and chain-of-thought variants and documents answer-preprocessing corrections that previously stripped bracketed scientific notation. The MMLU-Pro README records a May 2026 correction to few-shot roles under chat templating [R61.7, R61.8]. These are implementation changes, not new releases of the older benchmark papers.

[DERIVED] Pin task YAML and imported utilities together; a task name and package version are insufficient if downstream configuration overrides them. Log rendered prompts and choice strings. Store answer extraction as a versioned pure operation over raw output where possible. For coding, retain sandbox image digest, compiler/interpreter, tests, exit code, resource limits, stdout/stderr, and seed. Distinguish invalid submissions, runtime errors, test failures, evaluator failures, and unavailable infrastructure.

[DERIVED] Scoring $k_i$ choices requires at least their token likelihood work, not one abstract question operation. Program validation costs approximately the sum of actual execution times up to the sandbox limits; an $O(nk)$ count of tests does not bound program runtime without those limits. Dense response matrices require $O(mn)$ storage for $m$ systems and $n$ items before outputs/traces. Latency, HBM traffic, and energy remain implementation-dependent.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The budget study evaluates four open models on GSM8K, MATH-500 and GPQA-Diamond, using seven maximum-generation-token settings from 64 to 4,096 and regex/exact-match scoring. Truncations count as incorrect; complete-case analyses are separately reported [R61.2, §3, Appendices B–C]. Its sample totals 56,476 inferences, not that many independent tasks.

[DERIVED] This protocol exposes a family distinction that a single scoreboard hides: a small fixed-answer science set has different sampling resolution and truncation behavior from a larger mathematical set. The informative comparison keeps model–item pairs and varies one protocol component. A pooled accuracy difference across these datasets would also change task weights and cannot identify a budget effect by itself.

## Observations

**What the paper claims.** [PAPER-REPORTED] The study reports budget-conditioned reversals on its three datasets [R61.2, §4.2].

**What the evidence shows.** [DERIVED] Answer format, truncation, and task denominator are material parts of the comparison.

**What we infer.** [DERIVED] A family name should index a fully specified task contract, not substitute for one.

**What remains unknown.** [UNVERIFIED] The same reversals have not been established for the reader's checkpoints, prompts, or target workloads.

## Failure modes

> **Failure mode — Finite tests mistaken for semantic validity.** [DERIVED] *Symptom:* A program passes public tests but violates an allowed input or resource condition. *Cause:* The finite tests are incomplete for the specification and program class. *Detection:* Use independently constructed counterexamples and review specification coverage. *Mitigation:* Strengthen justified tests or a proof obligation and restrict the conclusion to tested behavior.

[MATHEMATICALLY-DERIVED] As an analytical counterexample, tests restricted to inputs 0 and 1 cannot distinguish a program implementing $f(x)=x$ everywhere from a program agreeing there but returning 999 at input 2. If the specification requires identity at 2, finite test success has failed to establish that requirement. Repeating the same tests does not add input coverage.

[DERIVED] Extraction creates analogous errors. Taking the first numeral in a response can select a problem number; taking the last can select an unrelated confidence statement. Stripping punctuation can alter a decimal, a negative sign, or a chemical name. A parser that maps unparseable output to an ordinary label can convert format failures into successes. Preserve a distinguished invalid value and include it in the offered denominator.

[DERIVED] Saturation also needs a target. Near-perfect observed accuracy may reflect an easy relevant distribution, a ceiling of the chosen item pool, a leaked answer, or a lenient validator. Those explanations require different next evidence; calling all of them insufficient difficulty is not diagnosis.

```figure
{
  "id": "fig-61.8",
  "kind": "compare",
  "title": "Passing tests versus meeting a specification",
  "caption": "Equation 61.5 accepts a finite executed test set. A universal specification conclusion requires separate coverage assumptions; repeating identical incomplete tests does not add input coverage.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.5",
  "alt": "Equation 61.5 accepts a finite executed test set. A universal specification conclusion requires separate coverage assumptions; repeating identical incomplete tests does not add input coverage.",
  "spec": {
    "axis": "Program acceptance boundary under a fixed specification",
    "columns": [
      {
        "id": "a",
        "label": "Finite test success"
      },
      {
        "id": "b",
        "label": "Specification validity"
      }
    ],
    "rows": [
      {
        "dimension": "Quantification",
        "values": {
          "a": "Observed test inputs",
          "b": "All allowed inputs and constraints"
        }
      },
      {
        "dimension": "Environment",
        "values": {
          "a": "Pinned executable sandbox",
          "b": "Declared deployment semantics"
        }
      },
      {
        "dimension": "Failure gap",
        "values": {
          "a": "Untested counterexamples can remain",
          "b": "Requires proof or justified coverage"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Likelihood scoring is appropriate when the allowed answer set and probability access are part of the target. Generation is appropriate when answer production and formatting matter. Executable tests are appropriate when the artifact is code and test coverage is justified. Domain adjudication is appropriate when no reliable automatic predicate exists. Prefer the least expensive valid checker; reverse that choice when control cases reveal false acceptances capable of changing the decision.

[DERIVED] [Chapter 55](../../part-10-multimodal-world-and-embodied-models/ch55-vision-language-models-and-document-intelligence/README.md) supplies visual evidence interventions, and [Chapter 63](../ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/README.md) separates function completion from interactive repository/system success. [Chapter 62](../ch62-human-preference-model-judges-and-uncertainty/README.md) governs judge validation when exact checks are unavailable.

## Extensions

[DERIVED] Item-response models can select informative questions, but only after testing fit, differential functioning, and coverage. Adaptive selection that optimizes Fisher information may neglect required easy operations or rare modalities. Retain those as explicit strata or gates. A shorter suite is scientifically useful if it preserves the intended decision and uncertainty under held-out systems, not merely if it reproduces the existing leaderboard ordering.

[DERIVED] Stronger coding tests, multiple valid references, or independently adjudicated labels can improve measurement. The contribution is improved acceptance fidelity or coverage under a stated program/answer class. An increase in rejection rate alone is not proof of a better evaluator.

## Limitations

[DERIVED] Catalog labels do not identify internal mechanisms. A benchmark can be useful for regression testing despite imperfect construct isolation, provided the conclusion stays at that behavioral level. Finite public items are vulnerable to adaptation, and statistical difficulty is relative to the respondent population. A valid domain predicate can still be applied to an unrepresentative set of cases.

[NOT-DISCLOSED] Exact current implementations for every historical named family are not independently executed here. The inspected harness surfaces support the specified configuration distinctions and corrections; they do not certify all tasks, every hosted dataset revision, or endpoint compatibility.

## Reproducibility

[DERIVED] Keep task-level manifests containing raw item hashes, dataset revision, split, answer choices/reference, allowed tools, prompt rendering, extractor and validator versions, sandbox identity, time/token limits, and failure taxonomy. Save controls beside the results so future changes can be checked against known behavior.

[ASSUMED] [Experiment 61.2](verification.md#experiment-612--validator-and-perturbation-controls) proposes validator controls and paired variants. It is unexecuted. Exact mathematical information curves in this section describe the conditional logistic model of Eq. 61.6; they are not a fitted model of the book's candidate systems.

## References

[R61.2] de Souza and Panisson, inspected v1, §§3–4 and Appendices B–C. [R61.7, R61.8] LM Evaluation Harness v0.4.13 task READMEs, static inspection only. Full provenance and limits: [references](references.md).
