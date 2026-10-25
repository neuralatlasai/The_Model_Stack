---
id: ms.section.63.3
entity_type: section
title: "Stage attribution"
volume: 3
part: 11
chapter: 63
section: 63.3
slug: 63-3-stage-attribution
parent: ms.chapter.63
prev_sibling: ms.section.63.2
next_sibling: ms.section.63.4
children: []
prerequisites: [ms.chapter.6, ms.chapter.62]
downstream: [ms.chapter.65, ms.chapter.66]
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

# 63.3 Stage attribution

## Scope

[DERIVED] Stage attribution asks which component failed, which intervention would alter the outcome, and whether available evidence can distinguish those questions. The stages include ingestion, retrieval, evidence grounding, planning, tool execution, state consistency, answer generation and verification. This section connects the retrieval and multimodal mechanisms of [Chapters 49–57](../../part-09-retrieval-context-and-agent-systems/ch49-retrieval-models-indexing-and-evidence-access/README.md) to the observation/recovery machinery of [Chapter 47](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch47-observability-deployment-changes-and-incident-recovery/README.md). Its artifact is a task-linked stage ledger plus a separately identified intervention experiment. A plausible explanation is not a certified cause.

## Why this exists

[DERIVED] End-to-end accuracy cannot tell an engineer whether to improve retrieval, generation or a flaky tool. The last visible error can be downstream of an earlier corrupted premise. Replacing one stage with an oracle can help identify a repair opportunity, but it also changes the input distribution of downstream stages. A generator that improves after receiving gold evidence does not prove every original failure came from retrieval. Multiple faults can coexist, and recovery can hide an injected fault from final-answer grading.

## Intuition

[DERIVED] Keep three records distinct: what each stage observed and produced; whether that output met its local contract; and the outcome after a specified repair. Retrieval recall concerns known relevant evidence within a defined corpus and granularity. Chunk coverage concerns which chunks a test suite ever visits; it is not relevance recall. Grounding checks support of claims in the actual retrieved evidence, which itself can be stale or wrong. Execution correctness includes permissions, arguments, side effects and durable state. Verification quality concerns accepting intended behavior and rejecting invalid behavior. No single stage metric subsumes these.

## Formulation

[MATHEMATICALLY-DERIVED] For ordered local success events $S_1,\ldots,S_L$ and positive conditioning probabilities,

$$
P\!\left(\bigcap_{\ell=1}^{L}S_\ell\right)=\prod_{\ell=1}^{L}P(S_\ell\mid S_1,\ldots,S_{\ell-1}).
$$
*(Eq. 63.7)*

[DERIVED] This is a chain-rule identity for a joint event, not a causal decomposition. An end-to-end task may recover after a local failure, so its outcome need not equal this intersection. For a frozen intervention $f$ at stage/hop $h$, let $Y^{(f,h)}$ and $Y^{(0)}$ be terminal success under fault and control. A population fault effect is

$$
\Delta_f(h)=\mathbb E[Y^{(f,h)}-Y^{(0)}],\qquad \widehat\Delta_f(h)=\frac1N\sum_{j=1}^{N}(Y_j^{(f,h)}-Y_j^{(0)}).
$$
*(Eq. 63.8)*

[DERIVED] Random assignment or a valid controlled replay identifies an average effect under its reset, exogenous-noise and intervention conditions. A matched input alone does not ensure identical stochastic realizations. A prefix-preserving replay must restore all relevant memory, tool and environment state; a post-hoc trace edit does not make the agent react to the changed evidence.

[MATHEMATICALLY-DERIVED] For $N_f>0$ eligible fault injections, let $N_{\rm fail}$ remain failed and $N_{\rm loc}$ of those be correctly localized. Then

$$
r_{\rm recover}=1-\frac{N_{\rm fail}}{N_f},\qquad a_{\rm loc\mid fail}=\frac{N_{\rm loc}}{N_{\rm fail}}\ (N_{\rm fail}>0),\qquad j_{\rm fail,loc}=\frac{N_{\rm loc}}{N_f},\qquad r=1-f,\quad j=fa,\quad \mathbb E[N_{\rm fail}]=N_f f.
$$
*(Eq. 63.9)*

[DERIVED] The joint failed-and-localized fraction equals $(1-r_{\rm recover})a_{\rm loc\mid fail}$. It is an accounting identity, not a preferred optimization target: a more resilient system can have fewer failures to localize. No remaining failure makes conditional localization undefined, not zero accuracy. The final three expressions use the probability specialization $f=P(\mathrm{remaining\ failure})$, $a=P(\mathrm{correct\ localization}\mid\mathrm{failure})$, $r=P(\mathrm{recovery})$ and $j=P(\mathrm{failure\ and\ correct\ localization})$, with a fixed eligible count $N_f$. Calculator inputs parameterize eligible count, failed fraction and conditional localization; they illustrate the probability decomposition rather than pretending fractional expected counts are observed integer cases.

```figure
{
  "id": "fig-63.9",
  "kind": "calculator",
  "title": "Recovery and conditional localization",
  "caption": "Eq. 63.9 probability specialization: remaining-failure fraction times conditional localization equals the joint failed-and-localized fraction. Expected counts are not measured integer cases.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-63.9",
  "alt": "Eq. 63.9 probability specialization: remaining-failure fraction times conditional localization equals the joint failed-and-localized fraction. Expected counts are not measured integer cases.",
  "spec": {
    "tex": "r=1-f,\\quad j=f\\,a,\\quad n_{\\rm fail}=Nf",
    "equation": "63.9",
    "inputs": [
      {
        "symbol": "N",
        "label": "Eligible injections (illustrative)",
        "default": 100,
        "min": 1,
        "max": 1000,
        "format": "integer"
      },
      {
        "symbol": "f",
        "label": "Remaining-failure fraction",
        "default": 0.4,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "a",
        "label": "Localization conditional on failure",
        "default": 0.75,
        "min": 0,
        "max": 1,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "recovery",
        "label": "Recovery fraction",
        "formula": "1-f",
        "format": "percent"
      },
      {
        "symbol": "joint",
        "label": "Failed and localized fraction",
        "formula": "f*a",
        "format": "percent"
      },
      {
        "symbol": "failed",
        "label": "Expected failed count",
        "formula": "N*f",
        "format": "raw"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Selected failure cohort",
      "variables": {
        "N": 100,
        "f": 0.4,
        "a": 0.75
      },
      "note": "Conditional localization and resilience use different denominators.",
      "highlight": [
        "recovery",
        "joint"
      ]
    },
    {
      "anchor": "mechanism",
      "label": "More resilient system",
      "variables": {
        "N": 100,
        "f": 0.1,
        "a": 0.75
      },
      "note": "Fewer remaining failures reduce the joint count despite unchanged conditional diagnosis.",
      "highlight": [
        "recovery",
        "failed"
      ]
    },
    {
      "anchor": "failure-modes",
      "label": "No remaining failures",
      "variables": {
        "N": 100,
        "f": 0,
        "a": 0.75
      },
      "note": "The product extends to zero, but conditional localization is undefined; a is hypothetical here.",
      "highlight": [
        "joint",
        "failed"
      ]
    }
  ]
}
```

## Mechanism

[DERIVED] Build a stage contract with input identity, output identity, timing, local predicate, evidence available to the predicate and its own error model. Link every retrieved chunk to corpus/index version and query; link every generated claim to the evidence actually present at generation time. Link a tool invocation to its arguments, response, timeout, idempotency identity and committed state. Link final verification to the exact submitted artifact and environment epoch. Missing spans are missing information, not successful stages.

[DERIVED] Distinguish intervention targets: replacing retrieved documents tests evidence availability; repairing a generated query tests search policy; substituting a valid tool result tests a boundary; replacing a final answer bypasses the whole upstream system. State whether the suffix is frozen or regenerated. A frozen-suffix probe measures a constrained counterfactual and can feed later evidence inconsistent with the repaired prefix. Regeneration evaluates a policy response but adds randomness and cost. Neither automatically proves the unique natural root cause.

[DERIVED] Diagnose identifiability before model capability. Two fault mechanisms that yield the same sanitized observation distribution cannot be perfectly distinguished by any trace-only detector. Policy bypass may require a trusted policy reference; a trace containing an allowed verdict does not reveal whether that verdict should have been blocked.

```figure
{
  "id": "fig-63.10",
  "kind": "diagram",
  "title": "Intervene before the suffix reacts",
  "caption": "A recorded fault changes a stage input; downstream execution then reacts. A passive detector sees a sanitized view while held-out labels define the intervention target.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-63.8",
  "alt": "A recorded fault changes a stage input; downstream execution then reacts. A passive detector sees a sanitized view while held-out labels define the intervention target.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Control checkpoint"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Certified stage intervention"
      },
      {
        "id": "n2",
        "kind": "process",
        "label": "Regenerate suffix"
      },
      {
        "id": "n3",
        "kind": "state",
        "label": "Recovery / remaining failure"
      },
      {
        "id": "n4",
        "kind": "process",
        "label": "Sanitized diagnosis"
      },
      {
        "id": "n5",
        "kind": "metric",
        "label": "Separate outcome denominators"
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
      }
    ]
  }
}
```

## Algorithm

**Algorithm 63.3 — Separate stage audit, intervention and diagnosis.**

[DERIVED] **Inputs:** finite eligible tasks, versioned stage graph, trusted predicates, fault operators and frozen diagnosis protocol. **Outputs:** local metrics, fault effects, recovery and diagnosis denominators.

1. Register control/fault episode IDs, intervention location and eligibility before inspecting diagnosis outputs. Verify baseline state and fault applicability independently.
2. Execute controls and assigned interventions on fresh resets or valid resumable checkpoints. Record the exact changed bytes, stage state and all suffix behavior. Count inapplicable or uncertifiable injections separately.
3. Hold injection labels out from the diagnosis input; sanitize explicit markers without hiding the operational evidence being tested. Record what each detector can see.
4. Score terminal task gates, local stage predicates and recovery. Among remaining failed cases, score type, exact location and any prespecified tolerance separately.
5. Compare diagnoses on the same eligible failed cases; preserve task clusters across multiple fault variants. Charge all probe/replay/judge calls.
6. Report uncertainty, skipped cases, source/predicate errors and the intervention scope; stop after the finite prespecified operator/task matrix and bounded probes.

[DERIVED] With $N$ tasks, $F$ applicable faults and a trajectory cost $C_H$, full control-plus-replay work is $O(N(1+F)C_H)$ before diagnosis. A bounded $B_p$-probe diagnoser can add $O(NFB_pC_H)$ work. Checkpoint reuse saves a valid prefix's execution only when all state dependencies are restored.

## Implementation

[OFFICIAL-DOCUMENTATION] In the pinned AgentChaosBench formatter, `structured_view` sorts spans, shows output previews and repetition features, and labels the maximum individual span duration as wall time [R63.7, `trace_view.py`, lines 29–73].

[DERIVED] Independent inspection consequence: this label is not generally the elapsed interval from first start to last end. Two sequential one-second spans separated by a nine-second gap have maximum duration one second and elapsed span envelope eleven seconds. A true end-to-end clock can include still more admission/cleanup time. The repeat key also truncates serialized input to 400 characters, so different long inputs can collide; a compact view is a lossy representation, not the complete trace. Preserve full immutable span identities and content digests before aggregation.

[OFFICIAL-DOCUMENTATION] The pinned summary script computes its overall row over observed faulty records and reports controls separately [R63.8, `rca_summary.py`, lines 57–93]. [DERIVED] A frozen expected-case roster is still needed to detect entirely absent records. This is static source inspection only; these programs were not run.

## Experimental design

[ASSUMED] Compare a passive trace detector, a trusted-rule detector, a frozen-suffix probe and a regenerated-suffix probe on the same intervention matrix. Audit an independent sample of local predicates and trace sanitization. Include recoverable and unrecoverable faults; do not discard recoveries from resilience reporting. Stratify by injection depth, stage, observability and required reference information, with a minimum independent-case rule before comparative claims. Experiment 63.2 proposes this evaluation without reporting an execution.

## Observations

**What the paper claims.** [PAPER-REPORTED] AgenticRAG-FP injects certified hop faults and resumes downstream execution [R63.3, §§3–6].

**What the evidence shows.** [PAPER-REPORTED] Its strict dense Haiku 4.5/MuSiQue comparison has 43, 36 and 21 failed cases by depth; coverage localization is 0.91, 0 and 0. The content-fault depth-2 comparison is exploratory with 18 failures [R63.3, Tables 2–3].

**What we infer.** [DERIVED] Propagation can erase a local symptom. Diagnosis conditional on remaining failure and intervention recovery require separate reporting. A degenerate all-zero bootstrap interval is not proof of zero population probability.

**What remains unknown.** [UNVERIFIED] This does not identify all natural failure causes or establish a universal ranking of active and passive diagnosis.

## Failure modes

> **Failure mode — Naming a symptom as the cause.** [DERIVED] *Symptom:* the final unsupported answer is blamed on generation even when an earlier corrupt fact redirected retrieval. *Cause:* attribution uses the last visible error without a controlled intervention or sufficient trace. *Detection:* compare prefix-preserving fault/replay cases and distinguish type, location and terminal recovery. *Mitigation:* retain stage provenance, test explicit repair scopes and report observational uncertainty when causes are not identifiable.

[MATHEMATICALLY-DERIVED] If two fault labels have equal prior probability and identical observed trace distributions, their optimal trace-only binary classification accuracy is $1/2$. More judge parameters cannot recover information absent from the input. Conversely, an explicit injector name would make classification easy through leakage without improving operational diagnosis.

```figure
{
  "id": "fig-63.11",
  "kind": "compare",
  "title": "Observed defect versus identified effect",
  "caption": "A local audit and a controlled intervention answer different questions; neither should be silently renamed a unique natural cause.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-63.8",
  "alt": "A local audit and a controlled intervention answer different questions; neither should be silently renamed a unique natural cause.",
  "spec": {
    "axis": "Evidence for attribution",
    "columns": [
      {
        "id": "a",
        "label": "Observed stage metric"
      },
      {
        "id": "b",
        "label": "Controlled intervention"
      }
    ],
    "rows": [
      {
        "dimension": "Question",
        "values": {
          "a": "Did this output meet its predicate?",
          "b": "What changes under this operator?"
        }
      },
      {
        "dimension": "Main limit",
        "values": {
          "a": "Predicate and missing evidence",
          "b": "Intervention realism and reset validity"
        }
      },
      {
        "dimension": "Required report",
        "values": {
          "a": "Visible evidence + label error",
          "b": "Assignment + suffix + eligibility"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Prefer passive telemetry for cheap broad monitoring when it captures the relevant mechanism; prefer active probes when the extra intervention has authorized, bounded cost and can resolve a consequential ambiguity. Reverse a probe-heavy policy if it mutates state, violates deadlines or gives inconsistent counterfactual histories. Reverse a passive-only policy if the missing reference or concealed state makes the question unidentifiable.

## Extensions

[DERIVED] Extend stage graphs to multimodal alignment, perception, grounding and actuation. A missing audio stream and an empty transcript are different inputs; a future video frame invalidates a causal online score. For shared planners and caches, add resource/state nodes that can affect several branches. Use [Chapter 57](../../part-10-multimodal-world-and-embodied-models/ch57-video-temporal-reasoning-and-streaming-multimodality/README.md) for event-time support and [Chapter 53](../../part-09-retrieval-context-and-agent-systems/ch53-agent-memory-persistent-state-and-long-horizon-consistency/README.md) for shared state and coordination.

## Limitations

[DERIVED] Injected faults identify effects of their operators under the chosen tasks, not the prevalence or causes of all naturally occurring failures. An oracle repair can create an unrealistic downstream input. Baseline-correct eligibility changes the population. Report this selection and do not interpret a conditional diagnosis rate as end-to-end agent accuracy. Human or model predicates can themselves be wrong.

## Reproducibility

[DERIVED] Release intervention definitions, applicability/certification rules, original/changed bytes, restored checkpoint dependencies, full stage traces, sanitizer version, held-out labels and detector-visible views. Retain total offered, eligible, recovered, failed and localized counts. Document code/static/runtime status and source-table locators in [references](references.md).

## References

[R63.3] Pothuru, inspected v1 (2026-08-20), §§3–7, Tables 2–3 and limitations. [R63.7–R63.8] Official AgentChaosBench code pinned to `04a8a46d32be12dea1f020b7eed8c7e84e5f30ed`, named functions only; static inspection, no runtime validation.
