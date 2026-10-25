---
id: ms.section.61.3
entity_type: section
title: "Version and protocol control"
volume: 3
part: 11
chapter: 61
section: 61.3
slug: 61-3-version-and-protocol-control
parent: ms.chapter.61
prev_sibling: ms.section.61.2
next_sibling: ms.section.61.4
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

# 61.3 Version and protocol control

## Scope

[DERIVED] Protocol control makes an evaluation rerunnable and makes differences interpretable. It fixes dataset revision, prompt and demonstrations, response format, decoding, tool access, reasoning budget, endpoint, answer extraction, grader, sampling, and aggregation. Changing any of these can change the measured behavior while model weights remain identical. This section owns the evaluation protocol identity; [Chapter 6](../../../vol-01-learning-and-representation/part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/README.md) owns the general controlled-experiment contract.

[DERIVED] Reproducibility is an operational requirement, not equality of package labels. Hosted endpoints may change behind an alias, stochastic inference can produce different samples, and numerical kernels can change output at fixed decoding settings. Preserve what was observed and what could actually be pinned. An unavailable revision is a limitation to report, not a reason to invent an immutable identity.

## Why this exists

[DERIVED] Without protocol control, an apparent capability gain can result from a better prompt, extra retrieval, a looser grader, or simply a larger completion budget. These are potentially useful improvements, but they answer different attribution questions. Comparing complete endpoints can justify a product decision if their budgets and offered populations are relevant; attributing the difference to the model requires a more controlled contrast.

[DERIVED] The implementation obstruction is a pipeline of transformations whose defaults are often implicit. A chat template changes roles and delimiters; a tokenizer changes truncation; a few-shot sampler changes the evidence in the prompt; a stop sequence can delete an answer; a grader can normalize away a meaningful sign. The protocol must expose these transformations as reviewable artifacts.

## Intuition

[DERIVED] Treat the evaluator as an instrument assembled from operators. The raw item becomes a rendered input, inference produces a raw response, extraction produces a candidate answer, and grading produces a result. A failure at any operator is an observed endpoint outcome, but its diagnosis depends on where it occurred. Regrading saved outputs can isolate a grading correction; it cannot reconstruct outputs that would have arisen from a changed prompt.

[DERIVED] Equal token caps do not equal equal physical work, information access, or completion opportunity across tokenizers and model architectures. Equal dollars do not equal equal capabilities either. Choose the matching axis from the decision: fixed model calls, fixed wall-clock deadline, fixed spend, or a stated frontier over these. Report the remaining unequal dimensions.

## Formulation

[MATHEMATICALLY-DERIVED] Write a protocol as $\psi=(d,s,p,m,k,b_g,t,g,a)$: data revision, sampling, prompt/scaffold, model endpoint, inference kernel/configuration, generation budget, tool policy, grader, and aggregator. For item $u$ and inference randomness $\xi$,

$$
Y_{j,u,\xi}^{\psi}=g_\psi\!\left(e_\psi\!\left(F_{j,m,k,b_g,t}(p_\psi(u),\xi)\right),u\right),\qquad \widehat v_j^\psi=a_\psi(\{Y_{j,u,\xi}^{\psi}\}).
$$
*(Eq. 61.7)*

[DERIVED] $e_\psi$ is the extractor, retained separately even though it is part of the grader configuration. Tool traces, truncation and failures are inputs to the scoring rule rather than silently missing values. Define matched-item sensitivity to a budget change as

$$
\widehat\Delta_j(b_1,b_2)=\frac1n\sum_{i=1}^{n}(Y_{ji}^{b_2}-Y_{ji}^{b_1}),\qquad b_1,b_2>0.
$$
*(Eq. 61.8)*

[DERIVED] This contrast estimates the effect of the declared budget intervention under the fixed remaining protocol. If budgets change endpoints, prompts, or truncation rules, it no longer isolates that component. For a finite prespecified protocol set $\Psi_0$,

$$
\widehat\rho_j=\max_{\psi\in\Psi_0}\widehat v_j^\psi-\min_{\psi\in\Psi_0}\widehat v_j^\psi,\qquad 0\le\widehat v_j^\psi\le1.
$$
*(Eq. 61.9)*

[MATHEMATICALLY-DERIVED] $0\le\widehat\rho_j\le1$. This observed range is descriptive; it is not a confidence interval, a supremum over unseen prompts, or an effect of model training. Taking the maximum after exploration also selects on evaluation noise.

```figure
{
  "id": "fig-61.9",
  "kind": "calculator",
  "title": "Observed protocol range",
  "caption": "Illustrative finite-grid range under Eq. 61.9. This is descriptive sensitivity of scores already supplied by the reader, not uncertainty, measured scores, or a bound over unseen protocols.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.9",
  "alt": "Illustrative finite-grid range under Eq. 61.9. This is descriptive sensitivity of scores already supplied by the reader, not uncertainty, measured scores, or a bound over unseen protocols.",
  "spec": {
    "tex": "\\widehat\\rho=\\max_\\psi \\widehat v^\\psi-\\min_\\psi\\widehat v^\\psi",
    "equation": "61.9",
    "inputs": [
      {
        "symbol": "p1",
        "label": "Illustrative protocol 1 score",
        "default": 0.7,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "p2",
        "label": "Illustrative protocol 2 score",
        "default": 0.8,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "p3",
        "label": "Illustrative protocol 3 score",
        "default": 0.6,
        "min": 0,
        "max": 1,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "range",
        "label": "Observed range",
        "formula": "max(p1,p2,p3)-min(p1,p2,p3)",
        "format": "percent"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Prespecified range",
      "variables": {
        "p1": 0.7,
        "p2": 0.8,
        "p3": 0.6
      },
      "highlight": [
        "range"
      ],
      "note": "These chosen scores illustrate a finite observed range."
    },
    {
      "anchor": "mechanism",
      "label": "A narrower checked grid",
      "variables": {
        "p1": 0.7,
        "p2": 0.72,
        "p3": 0.68
      },
      "highlight": [
        "range"
      ],
      "note": "Small range describes only the checked protocols."
    },
    {
      "anchor": "failure-modes",
      "label": "One sensitive protocol",
      "variables": {
        "p1": 0.7,
        "p2": 0.8,
        "p3": 0.4
      },
      "highlight": [
        "range"
      ],
      "note": "A failed protocol condition can dominate the selection; this is not a confidence interval."
    }
  ]
}
```

## Mechanism

### Methodology

[DERIVED] Freeze both human-readable configuration and content hashes for inputs that can be pinned. Retain exact rendered prompts including system roles, demonstrations, option order, chat delimiters and stop conditions. Store model/tokenizer/processor revisions independently; a tokenizer with the same model-family name can differ. Record whether hidden reasoning tokens consume the budget, whether tool results count toward context, and how exhausted budgets become failures or partial-credit outcomes.

[DERIVED] Factor the contrast rather than changing all components together. Hold data and candidate checkpoints fixed while varying prompts; then hold prompts fixed while varying budgets; separately vary tool access and grader. For stochastic outputs, pair items and allocation rules rather than pretending equal seed integers enforce equal token-level randomness across architectures. Preserve generation distributions and repeat uncertainty. For a hosted endpoint, log timestamp, provider/model identifier, request parameters, available revision metadata, returned usage, and finish reason; provider-internal precision and routing may remain unknown.

[DERIVED] Distinguish three questions about a truncated response: did the offered endpoint succeed within its limit; how accurate were completed outputs; what would have happened with a larger budget? The first has an offered denominator, the second a selected completed denominator, and the third requires a new intervention. Filtering to items complete under all budgets can localize behavior but changes the task population.

```figure
{
  "id": "fig-61.10",
  "kind": "diagram",
  "title": "Protocol changes localize different interventions",
  "caption": "A prompt change requires new inference. A pure grading change can replay saved raw output. Both retain distinct protocol identities and rejoin matched-item comparison.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.7",
  "alt": "A prompt change requires new inference. A pure grading change can replay saved raw output. Both retain distinct protocol identities and rejoin matched-item comparison.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Pinned item"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Render prompt and tools"
      },
      {
        "id": "n2",
        "kind": "model",
        "label": "Budgeted inference"
      },
      {
        "id": "n3",
        "kind": "memory",
        "label": "Immutable raw output"
      },
      {
        "id": "n4",
        "kind": "process",
        "label": "Extract and grade"
      },
      {
        "id": "n5",
        "kind": "metric",
        "label": "Matched-item comparison"
      },
      {
        "id": "n6",
        "kind": "dependency",
        "label": "Revised grader"
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
        "to": "n5"
      },
      {
        "from": "n6",
        "to": "n4",
        "label": "regrade only"
      }
    ]
  }
}
```

## Algorithm

[DERIVED] **Algorithm 61.3 — Execute and compare frozen protocols.**

1. Enumerate a finite protocol grid $\Psi_0$ and eligible item IDs before observing candidate results; version every component of Eq. 61.7.
2. Validate rendered-input and grading controls. Refuse a run with unavailable required artifacts or an incompatible information regime.
3. For each protocol–system–item–repeat key, allocate an explicit budget, start a monotonic timer, and execute once. Record returned usage, finish status, raw output and tool trace even on failure.
4. Extract and grade under the frozen rule. A retry receives a new attempt ID and is charged to the original offered task; never overwrite a failed attempt.
5. Join matched results by key, compute Eq. 61.8 and task-stratified comparisons, and report completion-conditioned diagnostics separately.
6. Compare ranking stability over the prespecified grid and confirm selected choices on reserved items. Stop at declared caps or report infrastructure failure; budget exhaustion is not proof of task impossibility.

[DERIVED] At most $m n r |\Psi_0|$ primary generations are scheduled for $m$ systems, $n$ items and $r$ repeats, before explicit retries and graders. Enforce finite per-call and suite deadlines and a maximum in-flight budget.

## Implementation

[OFFICIAL-DOCUMENTATION] LM Evaluation Harness v0.4.13 reports corrections for evaluation-document leakage into few-shot prompts, document-specific generation-prefix handling, choice-prefix regex matching, and incorrectly pooled group standard errors. Its release note warns that affected results can change [R61.6, Bug Fixes/Migration Notes]. This is evidence that a tool revision can alter the instrument, not evidence that every earlier evaluation was affected.

[OFFICIAL-DOCUMENTATION] At commit ddd67220430a2470529f25fd5c05a576ca1057a0, ContextSampler.sample excludes rows equal to the evaluation document and resamples when duplicate rows reduce the demonstration count. FirstNSampler also excludes the evaluation row [R61.9, ContextSampler.sample and FirstNSampler.sample]. Equality-based exclusion is inspectable behavior; it is not semantic deduplication.

[OFFICIAL-DOCUMENTATION] The pinned MultiChoiceRegexFilter escapes fallback choice patterns, orders them longest first to prevent prefix shadowing, and retains an explicit invalid fallback [R61.10, apply]. This is static control-flow inspection, not a runtime validation.

[DERIVED] Use a run cache only when its key covers the actual data, prompt, model, tool state and grader dependence. Store generated output separately from derived grades so a pure scoring change can be replayed safely. A cached request with an old rendered prompt is a protocol change hidden as an optimization. Cache equality and exact versus approximate reuse belong to [Chapter 42](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/README.md).

[DERIVED] Prompt artifacts require bytes proportional to rendered input, and raw outputs/traces add storage proportional to generated tokens and tool observations. Reusing immutable prompt templates saves representation cost but must not erase item-specific rendering. The complete resource boundary includes generation, grading, retries, data access and orchestration. No local harness installation or device compatibility has been verified here.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The budget study uses seven token caps with greedy decoding and separately analyzes all items, pairs completed at adjacent budgets, and items completed at every budget. Its GPQA example includes a nominal final-budget lead that is not statistically significant [R61.2, §§3–4.2].

[DERIVED] Greedy decoding constrains sampling; it does not establish deterministic hosted execution or stable kernels. The study's controls help separate truncation from observed nonmonotonicity, but completion filtering does not identify a counterfactual full-budget result for excluded items. Repetition on a pinned local stack would answer an additional runtime question, not retroactively supply that missing evidence.

## Observations

**What the paper claims.** [PAPER-REPORTED] Rankings can depend on the permitted generation budget in the studied settings [R61.2, §6].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] The harness release independently documents instrument corrections affecting prompts, extraction and uncertainty [R61.6].

**What we infer.** [DERIVED] Model identity and protocol identity must travel together with a reported result.

**What remains unknown.** [NOT-DISCLOSED] Exact provider-internal execution and cross-run endpoint stability are not established by a temperature setting or model alias.

## Failure modes

> **Failure mode — Rescoring mistaken for rerunning.** [DERIVED] *Symptom:* A prompt correction is reported using old outputs generated with different information. *Cause:* A scoring intervention is conflated with an input or execution intervention. *Detection:* Compare protocol components and inspect whether the raw generation saw changed support. *Mitigation:* Rerun changed inputs; replay saved output only for a pure grading correction.

[MATHEMATICALLY-DERIVED] Two systems may have response curves $v_A(b)=0.8$ and $v_B(b)=0.5+0.4\mathbf1\{b\ge b_0\}$ under a chosen analytical workload. The ordering reverses at $b_0$. These illustrative functions prove that a single-budget ranking cannot imply all-budget dominance; they are not fitted curves for named systems.

[DERIVED] Protocol hashes are also insufficient when an unlogged external tool or mutable endpoint changes. A matching hash proves identity only of the encoded inputs. The correct response to an unpinnable dependency is to bound the reproducibility claim and retain timestamps and returned evidence.

```figure
{
  "id": "fig-61.11",
  "kind": "compare",
  "title": "Generation changes and scoring changes",
  "caption": "The intervention determines which artifacts can be reused. Regrading cannot undo information that was visible to the original generation.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.7",
  "alt": "The intervention determines which artifacts can be reused. Regrading cannot undo information that was visible to the original generation.",
  "spec": {
    "axis": "Artifacts valid after one changed protocol component",
    "columns": [
      {
        "id": "a",
        "label": "Prompt or tool change"
      },
      {
        "id": "b",
        "label": "Pure grader correction"
      }
    ],
    "rows": [
      {
        "dimension": "Inference",
        "values": {
          "a": "Rerun under new access",
          "b": "Reuse saved raw output"
        }
      },
      {
        "dimension": "Attribution",
        "values": {
          "a": "Input and execution intervention",
          "b": "Measurement intervention"
        }
      },
      {
        "dimension": "Invalid reuse",
        "values": {
          "a": "Old answer with leaked support",
          "b": "Old score with known parser defect"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] For model-development attribution, prefer a fixed common protocol with independent confirmation. For an endpoint-selection decision, compare complete admissible endpoints on the same offered population and quality/resource requirements; a scaffold advantage can be relevant if its cost and permissions are included. Reverse the fixed-protocol preference when it excludes a required production capability, and reverse an endpoint preference when its advantage disappears under the actual deadline or access policy.

[DERIVED] [Reporting](61-6-reporting.md) defines how protocol-conditioned results are summarized; [Chapter 63](../ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/README.md) extends the ledger to environment state, retries, and long episodes. Prompt engineering is part of the measured system rather than an invisible constant.

## Extensions

[DERIVED] A useful next study tests whether the selected model remains admissible under the smallest protocol changes that occur in deployment: template update, option reordering, tokenizer revision, reasoning cap, or tool outage. Predeclare which changes should preserve acceptance and which intentionally change the task. A protocol comparison contributes new evidence when it changes the supported operating envelope or locates an evaluator defect.

[DERIVED] Reopening criteria should be concrete: a task-version patch changes rendered input, a new endpoint alias removes a pinned revision, a grader control fails, or a resource change crosses a deadline. Cosmetic metadata changes that leave the operator identical require provenance updates, not necessarily new inference.

## Limitations

[DERIVED] No configuration file proves all execution details are controlled. Numerical nondeterminism, hidden provider routing, external state and incomplete logs remain possible. The finite sensitivity grid does not cover all user formulations. Multiple protocol trials create selection pressure and must be included in uncertainty or confirmed independently.

[UNVERIFIED] No candidate checkpoint or harness run was executed for this chapter. Static source inspection checks the named code surface only; it does not establish runtime compatibility, benchmark reproduction, or a universally preferred prompt.

## Reproducibility

[DERIVED] Archive configuration, content digests, exact rendered inputs, component revisions, environment/container identities, allowed tools, sampling allocation, finish reasons, invalid-output policy, raw outputs, derived grades, and exclusions. Use a run identity composed from immutable components plus an explicit mutable-dependency ledger. Reproduction should distinguish byte-identical rerendering, compatible execution, statistical replication, and agreement of conclusions.

[ASSUMED] [Experiment 61.1](verification.md#experiment-611--portfolio-and-protocol-sensitivity) varies prompts and budgets of fixed candidate checkpoints. No ranking sensitivity has been measured by the book.

## References

[R61.2] Budget-dependent rankings, v1, §§3–4.2 and §6. [R61.6] Harness v0.4.13 release notes. [R61.9] Pinned sampler source. All source versions and inspection boundaries appear in [references](references.md).
