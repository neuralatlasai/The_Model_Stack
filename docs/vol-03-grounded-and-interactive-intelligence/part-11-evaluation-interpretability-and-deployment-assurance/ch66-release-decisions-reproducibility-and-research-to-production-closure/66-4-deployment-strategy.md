---
id: ms.section.66.4
entity_type: section
title: "Deployment strategy"
volume: 3
part: 11
chapter: 66
section: 66.4
slug: 66-4-deployment-strategy
parent: ms.chapter.66
prev_sibling: ms.section.66.3
next_sibling: ms.section.66.5
children: []
prerequisites: [ms.chapter.6, ms.chapter.30, ms.chapter.47, ms.chapter.48, ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64, ms.chapter.65]
downstream: []
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

# 66.4 Deployment strategy

## Scope

[DERIVED] Deployment strategy moves a qualified candidate through bounded exposure while preserving causal attribution, complete outcome accounting and a credible reversal path. Shadow operation suppresses consequential actions; a canary exposes a defined fraction of authorized traffic. Neither inherits universal safety from offline evaluation. This section joins [47](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch47-observability-deployment-changes-and-incident-recovery/README.md) recovery, [48](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/README.md) capacity and [63](../ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/README.md) offered-task reliability.

## Why this exists

[DERIVED] A candidate can change user behavior, shared cache state, downstream tool load and which outcomes are observed. Randomizing individual requests can contaminate both arms through shared conversation memory or persistent state. A quiet canary can pass a timer without exercising the behavior at risk. Rolling back model traffic does not undo committed writes or cancel all outstanding work.

## Intuition

[DERIVED] Separate three questions: what candidate would have proposed, what authorized action it actually took, and what user/system outcome followed. Shadow traces observe the first and selected timing/data paths; they do not observe consequences of suppressed actions. A canary observes actual effects only in its assigned support. Use a user, conversation, tenant or service cluster as the randomization unit when interference requires it.

## Formulation

[MATHEMATICALLY-DERIVED] For independent units, randomized assignment $A_i\sim\operatorname{Bernoulli}(q)$ with known $0<q<1$, consistency and no cross-unit interference, an intention-to-treat contrast is



$$
\widehat\Delta_{\rm ITT}=\frac1N\sum_{i=1}^{N}\left(\frac{A_iY_i}{q}-\frac{(1-A_i)Y_i}{1-q}\right),\qquad
\mathbb E[\widehat\Delta_{\rm ITT}]=\mathbb E[Y(1)-Y(0)].


$$
*(Eq. 66.10)*



[DERIVED] Assignment, not successful treatment completion, defines the denominator. Noncompliance, refusals and timeouts remain outcomes. Adaptive assignment needs a design with correct logged propensities and appropriate inference; the displayed fixed-$q$ argument is not its proof.



$$
\mathbb E[N_{\rm exposed}]=f\lambda T,\qquad
\mathbb E[N_{\rm harm}]=f\lambda T r


$$
*(Eq. 66.11)*



[DERIVED] This scenario uses stationary offered rate $\lambda$ in units/second, exposure fraction $f$, duration $T$ in seconds and conditional harm probability $r$. It is an expectation, not a hard exposure cap or safety guarantee. Enforce actual counters/caps separately.



$$
P(\mathrm{at\ least\ one\ observed\ failure})=1-(1-r)^n,\qquad
n\ge\left\lceil\frac{\log(1-\gamma)}{\log(1-r)}\right\rceil,\quad 0<r,\gamma<1.


$$
*(Eq. 66.12)*



[DERIVED] This detection calculation assumes independent identical exposures and complete immediate labels. It is not an upper risk certificate and does not handle correlated or delayed harms. The instrument executes the detection probability only, including its continuous endpoint extension.

```figure
{
  "id": "fig-66.12",
  "kind": "calculator",
  "title": "Canary detection needs exposure",
  "caption": "Eq. 66.12 detection probability only, under independent identical exposures and complete labels. This is not a risk certificate or promotion rule.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-66.12",
  "alt": "Eq. 66.12 detection probability only, under independent identical exposures and complete labels. This is not a risk certificate or promotion rule.",
  "spec": {
    "tex": "P_{\\rm detect}=1-(1-r)^n",
    "equation": "66.12",
    "inputs": [
      {
        "symbol": "r",
        "label": "Hypothetical failure probability",
        "default": 0.01,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "n",
        "label": "Independent labeled exposures",
        "default": 10,
        "min": 1,
        "max": 10000,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "detect",
        "label": "Chance of observing at least one failure",
        "formula": "1-(1-r)^n",
        "format": "percent"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Small exposure",
      "variables": {
        "r": 0.01,
        "n": 10
      },
      "note": "A quiet small canary has weak detection power.",
      "highlight": [
        "detect"
      ]
    },
    {
      "anchor": "mechanism",
      "label": "More labeled exposure",
      "variables": {
        "r": 0.01,
        "n": 300
      },
      "note": "Power rises under unchanged assumptions.",
      "highlight": [
        "detect"
      ]
    },
    {
      "anchor": "failure-modes",
      "label": "Rarer failure",
      "variables": {
        "r": 0.0001,
        "n": 300
      },
      "note": "Rare hazards remain difficult to observe.",
      "highlight": [
        "detect"
      ]
    }
  ]
}
```

## Mechanism

[DERIVED] Predeclare eligible traffic, assignment unit, candidate/baseline identity, permitted effects, minimum informative exposure, horizon, delayed-label maturity, stopping method, hard caps and reversal triggers. Monitor required outcomes and legitimate-use degradation by relevant strata. Do not promote merely because no alarm fired: the monitor may have seen no traffic, lacked labels or missed the failure mechanism.

[DERIVED] Keep control-plane identity and active behavior versions separate. A stable organizational/capability-name identity can coexist with changed model or tool behavior. Maintain an immutable active-version map and attach each event to its actual version/epoch. A claim tied to one behavior-changing artifact must be reevaluated after it changes even if a narrower identity hash remains constant.

```figure
{
  "id": "fig-66.13",
  "kind": "diagram",
  "title": "Exposure has an evidence and recovery path",
  "caption": "Missing coverage remains unresolved; detected violations trigger bounded reversal and verified recovery.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-66.10",
  "alt": "Missing coverage remains unresolved; detected violations trigger bounded reversal and verified recovery.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "boundary",
        "label": "Authorized eligible support"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Shadow qualification"
      },
      {
        "id": "n2",
        "kind": "process",
        "label": "Assigned bounded exposure"
      },
      {
        "id": "n3",
        "kind": "metric",
        "label": "Mature labels + gates"
      },
      {
        "id": "n4",
        "kind": "state",
        "label": "Promote / unresolved"
      },
      {
        "id": "n5",
        "kind": "process",
        "label": "Revoke + quiesce + recover"
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
        "to": "n4",
        "label": "supported"
      },
      {
        "from": "n3",
        "to": "n5",
        "label": "violation"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "insufficient evidence"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 66.4 — Run a bounded exposure stage.**

[DERIVED] **Inputs:** qualified immutable candidate, eligible population, assignment plan, effect/exposure limits, monitors and tested reversal. **Outputs:** retained stage evidence and promotion, reversal or unresolved status.

1. Confirm authorization, healthy baseline, monitor coverage and rollback/compensation prerequisites.
2. Shadow on a declared support without consequential actions; identify the unobserved-action limits.
3. Register and randomize eligible units at the correct interference level. Tag every event with actual version and assignment.
4. Enforce traffic, action and resource caps; retain rejections, escalations, missing/late labels and shared-state incidents.
5. Apply valid frozen/sequential gates only after required exposure and label maturity. Stop immediately for noncompensable violations under the declared policy.
6. On reversal revoke publication rights, stop new work, quiesce or quarantine in-flight work, restore compatible routing/state and verify recovery. Record effects requiring compensation rather than claiming they were undone.

[DERIVED] Finish at the finite stage/exposure limit even if evidence remains unresolved. Monitoring costs scale with offered events and label/audit work, not only candidate completions.

## Implementation

[DERIVED] A release controller needs durable stage IDs, idempotent transitions, ownership/epoch checks and an explicit terminal-state record. Process-local locks serialize cooperating requests but do not guarantee crash recovery. Validate rollback under failed metrics, controller restart, stale callbacks, partial promotion and outstanding device/tool calls. Restoring a pointer cannot safely downgrade an incompatible schema; migrations need forward/backward compatibility or a separate recovery plan.

## Experimental design

[ASSUMED] Use a disposable traffic simulator and stateful service to test no-traffic, delayed-label, contradictory-monitor, stale-callback, overload and partial-commit cases. Then perform an authorized bounded stage on the intended support only after independent qualification. Experiment 66.3 proposes the study; no operational deployment or external action was performed.

## Observations

**What the paper claims.** [PAPER-REPORTED] ICAN-Deploy preserves a hash projection while capability versions change [R66.4, §3].

**What the evidence shows.** [PAPER-REPORTED] The study uses MuJoCo canary cycles and exception injection; §6 explicitly separates identity from behavioral invariance. Appendix A permits no-traffic promotion [R66.4, §§5–6, Appendix A].

**What we infer.** [DERIVED] Stable identity is a structural property, not preserved behavioral certification. No-traffic promotion requires a separate operational justification and supplies no new behavior evidence.

**What remains unknown.** [UNVERIFIED] Physical/fleet deployment and the full separately maintained runtime were not independently inspected or executed here.

## Failure modes

> **Failure mode — A silent canary is called validated.** [DERIVED] *Symptom:* a candidate promotes after an empty or unlabeled window. *Cause:* elapsed time substitutes for informative exposure and observed outcomes. *Detection:* reconcile eligible, exposed, labeled and unresolved counts by required stratum. *Mitigation:* require minimum qualified evidence and retain unresolved status when it is absent.

[MATHEMATICALLY-DERIVED] At independent failure probability $r=0.01$, ten exposures reveal at least one failure with probability only about $0.0956$. A timer and zero observed failures cannot distinguish excellent behavior from an unexercised risk.

```figure
{
  "id": "fig-66.14",
  "kind": "compare",
  "title": "Identity projection and active behavior",
  "caption": "A stable capability-name identity does not establish unchanged active versions or behavior.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-66.11",
  "alt": "A stable capability-name identity does not establish unchanged active versions or behavior.",
  "spec": {
    "axis": "Version boundary",
    "columns": [
      {
        "id": "a",
        "label": "Stable identity projection"
      },
      {
        "id": "b",
        "label": "Active behavior manifest"
      }
    ],
    "rows": [
      {
        "dimension": "Contains",
        "values": {
          "a": "Selected organizational/name fields",
          "b": "Exact model/tool/config versions"
        }
      },
      {
        "dimension": "Can stay fixed",
        "values": {
          "a": "Across excluded version changes",
          "b": "Only when recorded versions fixed"
        }
      },
      {
        "dimension": "Supports",
        "values": {
          "a": "Routing/trust relation",
          "b": "Binding tested behavior evidence"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Prefer shadow operation for low-consequence observation of inputs/proposals and bounded canaries for actual outcome evidence within authorized effects. Reverse request-level randomization when shared state causes interference. Reverse automatic promotion when labels/coverage are missing. Reverse a rollback plan that restores routing but cannot handle persistent or asynchronous effects.

## Extensions

[DERIVED] Add staged population expansion, independent holdout traffic and monitored requirement changes. Define evidence invalidation when tools, permissions, model, cache/data epoch or workload changes. Continuous monitoring needs a valid time-varying or stable-target model; an anytime bound does not make nonstationary harms stationary.

## Limitations

[DERIVED] A canary bounds exposure, not maximum harm, unless the effect surface itself is bounded. Rare catastrophic events may remain untestable at acceptable exposure. User adaptation, interference and delayed outcomes complicate attribution. Simulation cannot establish physical-world safety.

## Reproducibility

[DERIVED] Archive assignment/eligibility, actual active-version maps, exposed actions, delayed/missing labels, monitor evidence, stage transitions, cap enforcement, cancellation/quiescence and recovery/compensation records. Keep operational authorization separate from scientific support.

## References

[R66.4] Qin et al., v1 (2026-05-27), §§3–6 and Appendices A/B. Full runtime/artifacts are described separately and were not treated as inspected implementation.
