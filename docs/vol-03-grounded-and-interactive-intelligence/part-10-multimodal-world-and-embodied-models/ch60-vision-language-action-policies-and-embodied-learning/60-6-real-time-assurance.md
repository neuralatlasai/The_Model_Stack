---
id: ms.section.60.6
entity_type: section
title: "Real-time assurance"
volume: 3
part: 10
chapter: 60
section: 60.6
slug: 60-6-real-time-assurance
parent: ms.chapter.60
prev_sibling: ms.section.60.5
next_sibling: ms.verification.60
children: []
prerequisites:
  [
    ms.chapter.18,
    ms.chapter.24,
    ms.chapter.34,
    ms.chapter.35,
    ms.chapter.36,
    ms.chapter.52,
    ms.chapter.55,
    ms.chapter.56,
    ms.chapter.57,
    ms.chapter.58,
    ms.chapter.59,
  ]
downstream: []
related: [ms.chapter.42, ms.chapter.48, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [pretraining, inference, evaluation],
    mechanism: [action_generation, embodied_control, predictive_representation],
    feedback_setting: [],
    modality: [image, text, video, action],
  }
papers: []
implementations: [impl.pytorch]
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
        OFFICIAL-DOCUMENTATION,
        ASSUMED,
        NOT-DISCLOSED,
        UNVERIFIED,
      ],
    empirically_observed: false,
  }
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 60.6 - Real-time assurance

## Scope

[DERIVED] Assurance evaluates the complete decision path: observation age, generation, transport, limits, selection, intervention and recovery. This section derives a bounded selected-risk construction, diagnoses a current source's denominator error and specifies a simulation-first execution gate. It does not certify a robot or authorize hardware deployment.

## Why this exists

[DERIVED] A faster model can issue a wrong action sooner. A low average violation rate can hide a high violation rate among the few executed decisions. A model's disagreement can measure deliberately injected action noise rather than uncertainty about the environment. Physical assurance needs correctly defined events, denominators and operating conditions.

## Intuition

[DERIVED] A policy that executes only 1% of requests and fails on every executed request has1% joint execute-and-fail probability but100% selected failure risk. Reporting the first number as the second produces a false safety conclusion. Executing nothing gives no selected-risk observations; it is not evidence of zero conditional risk.

## Formulation

[MATHEMATICALLY-DERIVED] Observation age includes acquisition, preprocessing, queues, model computation, transport and command/servo delay. For an object moving at constant speed v,

$$
 \tau_{age}=t_{actuation}-t_{acquisition},\qquad d=v\tau_{age}.
$$

_(Eq. 60.21)_

[DERIVED] Use a common clock domain or a calibrated clock mapping with uncertainty. Fast proprioception and slow camera context have separate ages. The displacement component is a kinematic illustration, not stopping distance; unknown acceleration and object motion add error. A model-query frequency cannot establish a worst-case age bound.

[MATHEMATICALLY-DERIVED] With execute event A and violation V,

$$
 q=\Pr(A\cap V),\quad c=\Pr(A),\quad r=\Pr(V|A)=q/c\quad(c>0).
$$

_(Eq. 60.22)_

[DERIVED] q<=epsilon does not imply r<=epsilon. With c=0.01 and every execution violating, q=0.01,r=1. For c=0, r is undefined. Joint violation, selected violation and coverage require separate reported denominators. Abstention can reduce exposure while leaving selected risk high.

[MATHEMATICALLY-DERIVED] For M policies/thresholds fixed independently of calibration, IID labeled deployed-pipeline decisions and fixed score/label definitions, let n_m count accepted calibration decisions and k_m their violations. When n_m>0,

$$
 \hat r_m=k_m/n_m,\quad
 U_m=\min\!\left(1,\hat r_m+\sqrt{\frac{\ln(M/\delta)}{2n_m}}\right),
 \qquad\Pr(\forall m:n_m>0\Rightarrow r_m\leq U_m)\geq1-\delta.
$$

_(Eq. 60.23)_

[DERIVED] Conditional on a positive accepted count, accepted labels are IID from that frozen policy's accepted-decision law; Hoeffding applies to bounded binary loss. Averaging over counts retains the bound, and a union bound covers the fixed M choices. A zero accepted count gets no certificate. Selecting the largest-coverage policy satisfying U_m<=epsilon is valid under the simultaneous event. Training the score or constructing thresholds using these same calibration labels violates the stated setup. Merely exchangeable dependent sequences do not supply this IID Hoeffding argument. For correlated control trajectories use an appropriate episode-level design or a justified sequential method; do not relabel frames independent.

[MATHEMATICALLY-DERIVED] A limited feasibility projection can be defined by

$$
 u^*=\arg\min_{u\in\mathcal U(q,\dot q,\Delta)}\|u-u_{proposal}\|^2,
$$

_(Eq. 60.24)_

[DERIVED] U may encode joint-position, velocity and acceleration constraints under a declared controller model. Empty U requires an explicit stop/fallback path. This projection does not guarantee collision freedom, acceptable contact force or task correctness. State-estimation and dynamics uncertainty can invalidate the feasible-set assumptions.

```figure
{
  "id": "fig-60.18",
  "kind": "diagram",
  "title": "Every command passes an explicit decision gate",
  "caption": "Invalid schema, stale data, uncertain selection and missed deadlines have distinct paths. Simulation readiness is upstream of separate physical authorization.",
  "placement": "inline",
  "anchor": "formulation",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-60.18",
  "alt": "Invalid schema, stale data, uncertain selection and missed deadlines have distinct paths. Simulation readiness is upstream of separate physical authorization.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "p",
        "kind": "node",
        "label": "Policy proposal"
      },
      {
        "id": "s",
        "kind": "branch",
        "label": "Schema/epoch valid?"
      },
      {
        "id": "t",
        "kind": "branch",
        "label": "Age/deadline valid?"
      },
      {
        "id": "l",
        "kind": "branch",
        "label": "Limits/selection pass?"
      },
      {
        "id": "e",
        "kind": "process",
        "label": "Authorized controller"
      },
      {
        "id": "f",
        "kind": "boundary",
        "label": "Reobserve/fallback/stop"
      }
    ],
    "edges": [
      {
        "from": "p",
        "to": "s",
        "kind": "flow",
        "label": "validate"
      },
      {
        "from": "s",
        "to": "t",
        "kind": "flow",
        "label": "yes"
      },
      {
        "from": "s",
        "to": "f",
        "kind": "dependency",
        "label": "no"
      },
      {
        "from": "t",
        "to": "l",
        "kind": "flow",
        "label": "yes"
      },
      {
        "from": "t",
        "to": "f",
        "kind": "dependency",
        "label": "no"
      },
      {
        "from": "l",
        "to": "e",
        "kind": "flow",
        "label": "yes, authorization present"
      },
      {
        "from": "l",
        "to": "f",
        "kind": "dependency",
        "label": "no or uncertain"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] BOKBO studies best-of-K selection and abstention. Under action-space Gaussian perturbations, disagreement tracks perturbation strength much more than its violation labels; token-temperature sampling partially changes that finding. Its source Eq.2 averages execute-and-violate indicators over all calibration decisions, yet Theorem1 claims risk conditional on execution. AppendixA invokes a generic CRC step without establishing that denominator conversion. Its inf-threshold expression also needs a selection-direction clarification. Empirical bootstrap operating points do not repair the proof. [R60.7, Secs. 3-5; Eq.2; Theorem1; AppendixA]

[DERIVED] Eq.60.22 is a direct counterexample to that implication. Eq.60.23 is a separate, deliberately more conservative construction under explicit IID/fixed-grid assumptions; it is not a reinterpretation of the paper's algorithm or a claim that its empirical implementation is known to use the printed inf rule. @ms.section.62.5 owns the broader calibration/abstention methodology and fixed-versus-data-selected-grid distinction.

[DERIVED] The source violation label also needs scrutiny: AppendixC uses a maximum absolute constraint-force entry from efc_force and thresholds derived from expert demonstrations. This is an operational simulator proxy, not automatically a frame-resolved physical contact force or a universal human-safety threshold. The empirical p99 of50demo maxima is not, without an additional tolerance analysis, a distribution-free99% population guarantee. Units, friction/contact constraints and extraction code require validation before physical interpretation.

```figure
{
  "id": "fig-60.19",
  "kind": "compare",
  "title": "Risk denominators are part of the claim",
  "caption": "A zero-execution system has zero exposure but no selected-risk certificate. A one-decision certificate does not automatically cover an adaptive trajectory.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-60.19",
  "alt": "A zero-execution system has zero exposure but no selected-risk certificate. A one-decision certificate does not automatically cover an adaptive trajectory.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "joint",
        "label": "Joint risk"
      },
      {
        "id": "selected",
        "label": "Selected risk"
      },
      {
        "id": "coverage",
        "label": "Coverage"
      }
    ],
    "rows": [
      {
        "dimension": "Definition",
        "values": {
          "joint": "P(execute and violate)",
          "selected": "P(violate | execute)",
          "coverage": "P(execute)"
        }
      },
      {
        "dimension": "Empirical denominator",
        "values": {
          "joint": "All decisions",
          "selected": "Executed decisions",
          "coverage": "All decisions"
        }
      },
      {
        "dimension": "Zero executions",
        "values": {
          "joint": "Observed count0",
          "selected": "Undefined; no certificate",
          "coverage": "0"
        }
      },
      {
        "dimension": "Use",
        "values": {
          "joint": "Exposure accounting",
          "selected": "Quality of accepted decisions",
          "coverage": "Utility/abstention tradeoff"
        }
      }
    ]
  }
}
```

## Algorithm

### Algorithm 60.6 — Certify a fixed selection family and gate simulation execution

[DERIVED] Inputs: frozen scoring/generation pipeline, fixed threshold family, independent calibration decisions, violation labels, limits and authorized simulator controller. Output: selected certified operating point or no certificate, then logged decisions.

[DERIVED] The mathematical transitions below formalize the proposed audit; the numbered notes specify the operators and controls. Every fitting, rollout and evaluation operator has a finite update, example or deadline cap. Invalid inputs return a recorded failure; exhausted evidence returns inconclusive. These transitions are not a claim that the source implementation was executed.

$$
\begin{aligned}
1.&\quad m=1,\ldots,M:\quad n_m\leftarrow\sum_i A_{mi},
\quad k_m\leftarrow\sum_i A_{mi}V_{mi};\\
2.&\quad U_m\leftarrow\begin{cases}\min(1,k_m/n_m+\sqrt{\ln(M/\delta)/(2n_m)}),&n_m>0,\\
+\infty,&n_m=0;\end{cases}\\
3.&\quad\mathcal F\leftarrow\{m:n_m>0\land U_m\le\epsilon\};
\quad\mathcal F=\varnothing\Rightarrow\operatorname{return}(\mathrm{no\ certificate});\\
4.&\quad m_*\leftarrow\arg\max_{m\in\mathcal F}\widehat{\operatorname{coverage}}_m;
\quad\operatorname{freeze}(m_*);\\
5.&\quad j=1,\ldots,J_{\max}:\quad
\mathrm{schema/epoch/age/limit\ failure}\Rightarrow\operatorname{Fallback};\\
6.&\quad\operatorname{PublishOnce}(u_j,\mathrm{actuation\ index}_j)
\text{ only if the frozen rule permits};\quad\mathrm{regime\ change}\Rightarrow\mathrm{invalidate}.
\end{aligned}
$$

1. Freeze policy/checkpoint, K-sampling mechanism, score, thresholds, task distribution and violation definition before calibration.
2. For each threshold, compute n_m,k_m and coverage. Reject n_m=0 as uncertifiable, not risk0.
3. Compute Eq.60.23 and select a predeclared coverage/utility optimum among certified policies. If none qualifies, return no certificate and use a separately validated fallback.
4. Before every simulated command, verify schema, episode/task epoch, timestamps, age, deadline and feasible limits. Abstention and uncertainty are explicit outcomes.
5. Publish actions once by actuation index; reject late/duplicate results. Log intervention and fallback costs and any controller deviation.
6. After a reset, task/model/score/sampling change or detected shift, invalidate the associated certificate/queue and revalidate. A physical stage requires its own concrete safety/timing review and explicit authorization.

[DERIVED] Calibration cost scales with independent decisions times candidate generation and scoring, not just the number of accepted commands. Bootstrap resplits reuse data and do not create new robot trials. Threshold search on a data-selected continuum requires another uniform argument, not the fixed-M formula.

## Implementation

[DERIVED] Position limits need current state, rate/acceleration constraints need aligned previous commands and durations, and contact constraints need a validated dynamics/sensing model. Clamp-only adapters can produce abrupt transitions. A stop must specify controller behavior, not simply stop sending packets if the firmware then holds or continues an unsafe command.

[DERIVED] Define recovery states: reobserve, discard stale plan, retreat under a validated controller, request authorized intervention, reset and terminate. A new model response cannot clear a latched hardware fault. Keep task success, intervention-free success and recovered success distinct. For physical trials, include human intervention time, resets and failures in all-attempt latency/throughput.

## Experimental design

### Reported experiments

[DERIVED] BOKBO's alternative-sampling and shift negatives support a mechanism-specific warning about uncertainty proxies. Its distribution-free conditional theorem is not accepted here because the printed loss/denominator and threshold direction are unresolved. Source empirical rows remain source observations, not a safety certificate.

[DERIVED] Experiment60.5 proposes a simulation-only timing/limit/selective-risk study with controlled stale inputs, network jitter, action violations, wrong confident poses and resets. Test a frozen finite policy family on independent episodes. Report selected/joint risk, coverage, severity, task utility and total resources together.

## Observations

**What the paper claims.** [PAPER-REPORTED] BOKBO claims finite-sample conditional safety for best-of-K abstention [R60.7].

**What the evidence shows.** [DERIVED] The inspected formula controls a differently denominated quantity, and its diagnostic results depend on the sampling mechanism. Its proof does not establish the claimed conversion.

**What we infer.** [DERIVED] Use the explicit event identity and independently justified certificate rather than borrowing a guarantee from a nearby theorem label. Faster control still requires correct limits, timestamps and recovery.

**What remains unknown.** [UNVERIFIED] The source's implemented threshold convention, physical force interpretation and broad deployment guarantee are not established here.

## Failure modes

[DERIVED] Joint/conditional confusion, zero-execution claims, adaptive-grid selection, correlated calibration frames, unvalidated force labels, stale certificates, queue underruns and unauthorized hardware transitions can invalidate assurance. A statistically valid event bound is limited to its event/distribution and does not prove absence of other hazards.

```figure
{
  "id": "fig-60.20",
  "kind": "calculator",
  "title": "Fixed-family selected-risk increment",
  "caption": "Eq.60.23 Hoeffding increment before adding observed selected risk. n is accepted independent decisions for one fixed policy; zero n is excluded and cannot certify risk.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-60.23",
  "alt": "Eq.60.23 Hoeffding increment before adding observed selected risk. n is accepted independent decisions for one fixed policy; zero n is excluded and cannot certify risk.",
  "spec": {
    "equation": "60.23",
    "tex": "b=\\sqrt{\\ln(M/\\delta)/(2n)}",
    "inputs": [
      {
        "symbol": "M",
        "label": "Fixed policy/threshold count",
        "default": 20,
        "min": 1,
        "max": 1000,
        "format": "integer"
      },
      {
        "symbol": "delta",
        "label": "Failure probability",
        "default": 0.05,
        "min": 0.001,
        "max": 0.5,
        "format": "percent"
      },
      {
        "symbol": "n",
        "label": "Accepted independent decisions",
        "default": 500,
        "min": 1,
        "max": 100000,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "radius",
        "label": "Risk upper-bound increment",
        "formula": "sqrt(ln(M/delta)/(2*n))",
        "format": "raw"
      }
    ]
  }
}
```

## Siblings

[DERIVED] @ms.section.62.5 develops calibration and abstention; @ms.chapter.63 evaluates complete reliability; @ms.chapter.65 covers adversarial/privacy/safety boundaries. @ms.chapter.56 supplies clock/publication contracts; @ms.section.60.1 defines actions and @ms.chapter.59 bounds prediction-based decisions.

## Extensions

### Improvements and their evidence

[DERIVED] Add an uncertainty gate when untouched selected-risk/coverage improves after its latency cost; reverse under calibration shift. Shorten chunks when all-attempt utility/severity improves; reverse if insufficient lookahead or solve overhead dominates. Add recovery only when its complete failure/intervention outcomes validate. No change is called safe merely because it improves average success.

## Limitations

[DERIVED] The certificate assumes IID frozen-pipeline decisions and a fixed finite family. It does not establish arbitrary dependent trajectory safety, unmeasured hazards or physical force validity. A simulation artifact does not authorize a real actuator.

## Reproducibility

[DERIVED] Archive pipeline hashes, thresholds, independent split/episode IDs, labels, acceptance counts, event definitions, all-attempt timestamps, device context, controller limits, failures/interventions and authorization state. No physical or simulator execution was performed by the book.

## References

[R60.7] BOKBO, 2605.30660v1, Secs. 3-5; Eq.2; Theorem1; AppendicesA/C. Exact contradictions and independent derivations: @ms.references.60 and @ms.verification.60.
